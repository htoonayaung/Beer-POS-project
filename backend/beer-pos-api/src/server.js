import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import morgan from "morgan";
import { z } from "zod";

const prisma = new PrismaClient();
const app = express();
const port = Number(process.env.PORT || 8080);
const jwtSecret = process.env.JWT_SECRET || "development-only-change-me";
if (process.env.NODE_ENV === "production" && jwtSecret === "development-only-change-me") {
  throw new Error("JWT_SECRET must be set to a strong value in production");
}

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("combined"));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false }));

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: "Validation failed", details: z.flattenError(result.error) });
    req.validatedBody = result.data;
    next();
  };
}

async function authenticate(req, res, next) {
  const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: Number(payload.sub) },
      include: { role: { include: { permissions: { include: { permission: true } } } } }
    });
    if (!user || user.status !== "ACTIVE") return res.status(401).json({ error: "Session is no longer active" });
    req.user = {
      id: user.id,
      branchId: user.branchId,
      name: user.name,
      role: user.role.name,
      permissions: user.role.permissions.map((entry) => entry.permission.key)
    };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

const permit = (permission) => (req, res, next) => {
  if (req.user.role === "Admin" || req.user.permissions.includes(permission)) return next();
  return res.status(403).json({ error: `Missing permission: ${permission}` });
};

async function audit(req, action, entity, entityId, detail) {
  await prisma.auditLog.create({
    data: {
      userId: req.user?.id,
      branchId: req.user?.branchId,
      action,
      entity,
      entityId: String(entityId ?? ""),
      detail: detail ? JSON.stringify(detail) : null,
      ipAddress: req.ip
    }
  });
}

app.get("/api/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true, service: "beer-pos-api", database: "connected", time: new Date().toISOString() });
});

app.post("/api/auth/login", validate(z.object({
  username: z.string().trim().min(2).max(80),
  password: z.string().min(4).max(128).optional(),
  pin: z.string().regex(/^\d{4,8}$/).optional()
}).refine((value) => value.password || value.pin, "Password or PIN is required")), async (req, res) => {
  const { username, password, pin } = req.validatedBody;
  const user = await prisma.user.findUnique({ where: { username }, include: { role: true, branch: true } });
  if (!user || user.status !== "ACTIVE") return res.status(401).json({ error: "Invalid credentials" });
  const valid = password ? await bcrypt.compare(password, user.passwordHash) : Boolean(user.pinHash && await bcrypt.compare(pin, user.pinHash));
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const token = jwt.sign({ role: user.role.name, branchId: user.branchId }, jwtSecret, { subject: String(user.id), expiresIn: "8h", issuer: "golden-tap-pos" });
  res.json({ token, expiresIn: 28800, user: { id: user.id, name: user.name, username: user.username, role: user.role.name, branch: user.branch } });
});

app.use("/api", authenticate);

app.get("/api/dashboard/summary", permit("dashboard:view"), async (req, res) => {
  const branchId = req.user.branchId;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [sales, expenses, openOrders, pendingTables, unreadNotifications, inventories] = await Promise.all([
    prisma.sale.aggregate({ where: { branchId, status: "PAID", soldAt: { gte: start } }, _sum: { grandTotal: true, profit: true } }),
    prisma.expense.aggregate({ where: { branchId, spentAt: { gte: start } }, _sum: { amount: true } }),
    prisma.orderTicket.count({ where: { sale: { branchId }, status: { not: "SERVED" } } }),
    prisma.diningTable.count({ where: { branchId, status: { not: "AVAILABLE" } } }),
    prisma.notification.count({ where: { branchId, isRead: false } }),
    prisma.branchInventory.findMany({ where: { branchId }, include: { product: { select: { minimumStock: true } } } })
  ]);
  res.json({
    todaySales: Number(sales._sum.grandTotal || 0),
    todayProfit: Number(sales._sum.profit || 0),
    todayExpense: Number(expenses._sum.amount || 0),
    openOrders,
    pendingTables,
    unreadNotifications,
    lowStock: inventories.filter((item) => Number(item.stock) <= Number(item.product.minimumStock)).length
  });
});

app.get("/api/branches", async (req, res) => {
  const where = req.user.role === "Admin" ? {} : { id: req.user.branchId };
  res.json(await prisma.branch.findMany({ where, orderBy: { name: "asc" } }));
});

app.get("/api/products", permit("inventory:view"), async (req, res) => {
  const branchId = Number(req.query.branchId || req.user.branchId);
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    include: { category: true, supplier: true, inventories: { where: { branchId } } },
    orderBy: { name: "asc" }
  });
  res.json(products);
});

app.post("/api/products", permit("inventory:manage"), validate(z.object({
  categoryId: z.number().int().positive(),
  supplierId: z.number().int().positive().optional(),
  sku: z.string().min(1).max(80),
  code: z.string().min(1).max(80),
  barcode: z.string().max(100).optional(),
  name: z.string().min(1).max(160),
  unit: z.string().min(1).max(40),
  purchasePrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  minimumStock: z.number().nonnegative().default(0)
})), async (req, res) => {
  const product = await prisma.product.create({ data: req.validatedBody });
  await audit(req, "CREATE", "Product", product.id, req.validatedBody);
  res.status(201).json(product);
});

app.get("/api/tables", permit("table:manage"), async (req, res) => {
  res.json(await prisma.diningTable.findMany({ where: { branchId: req.user.branchId }, include: { reservations: { where: { status: "RESERVED" } } }, orderBy: [{ floor: "asc" }, { name: "asc" }] }));
});

app.get("/api/order-tickets", permit("table:manage"), async (req, res) => {
  const station = req.query.station;
  res.json(await prisma.orderTicket.findMany({
    where: { sale: { branchId: req.user.branchId }, ...(station ? { station } : {}) },
    include: { items: true, sale: { select: { invoiceNo: true, table: { select: { name: true } } } } },
    orderBy: { createdAt: "asc" }
  }));
});

app.patch("/api/order-tickets/:id/status", permit("table:manage"), validate(z.object({ status: z.enum(["PENDING", "COOKING", "READY", "SERVED"]) })), async (req, res) => {
  const ticket = await prisma.orderTicket.update({ where: { id: Number(req.params.id) }, data: { status: req.validatedBody.status } });
  await audit(req, "UPDATE_STATUS", "OrderTicket", ticket.id, req.validatedBody);
  res.json(ticket);
});

app.post("/api/sales", permit("sale:create"), validate(z.object({
  branchId: z.number().int().positive(),
  customerId: z.number().int().positive().optional(),
  tableId: z.number().int().positive().optional(),
  waiterName: z.string().max(100).optional(),
  guestCount: z.number().int().positive().default(1),
  discountAmount: z.number().nonnegative().default(0),
  taxAmount: z.number().nonnegative().default(0),
  serviceCharge: z.number().nonnegative().default(0),
  payments: z.array(z.object({ method: z.string().min(1), amount: z.number().positive(), reference: z.string().optional() })).min(1),
  items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().positive(), note: z.string().max(300).optional() })).min(1)
})), async (req, res) => {
  const body = req.validatedBody;
  if (req.user.role !== "Admin" && body.branchId !== req.user.branchId) return res.status(403).json({ error: "Cannot sell for another branch" });
  const sale = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({ where: { id: { in: body.items.map((item) => item.productId) } }, include: { category: true } });
    if (products.length !== body.items.length) throw new Error("One or more products do not exist");
    const inventories = await tx.branchInventory.findMany({ where: { branchId: body.branchId, productId: { in: products.map((product) => product.id) } } });
    for (const item of body.items) {
      const inventory = inventories.find((entry) => entry.productId === item.productId);
      if (!inventory || Number(inventory.stock) < item.quantity) throw new Error(`Insufficient stock for product ${item.productId}`);
    }
    const lines = body.items.map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      const unitPrice = Number(product.sellingPrice);
      const unitCost = Number(inventories.find((entry) => entry.productId === item.productId)?.averageCost || product.purchasePrice);
      return { ...item, product, unitPrice, unitCost, lineTotal: unitPrice * item.quantity, lineProfit: (unitPrice - unitCost) * item.quantity };
    });
    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const grandTotal = subtotal - body.discountAmount + body.taxAmount + body.serviceCharge;
    const paid = body.payments.reduce((sum, payment) => sum + payment.amount, 0);
    if (paid < grandTotal) throw new Error("Payment total is less than grand total");
    const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    const sequence = await tx.sale.count({ where: { soldAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } });
    const created = await tx.sale.create({
      data: {
        branchId: body.branchId, cashierId: req.user.id, customerId: body.customerId, tableId: body.tableId,
        invoiceNo: `INV-${day}-${String(sequence + 1).padStart(6, "0")}`, waiterName: body.waiterName,
        guestCount: body.guestCount, subtotal, discountAmount: body.discountAmount, taxAmount: body.taxAmount,
        serviceCharge: body.serviceCharge, grandTotal, totalCost: lines.reduce((sum, line) => sum + line.unitCost * line.quantity, 0),
        profit: lines.reduce((sum, line) => sum + line.lineProfit, 0),
        items: { create: lines.map((line) => ({ productId: line.productId, note: line.note, quantity: line.quantity, unitPrice: line.unitPrice, unitCost: line.unitCost, lineTotal: line.lineTotal, lineProfit: line.lineProfit })) },
        payments: { create: body.payments }
      },
      include: { items: true, payments: true }
    });
    for (const line of lines) {
      const inventory = await tx.branchInventory.update({
        where: { branchId_productId: { branchId: body.branchId, productId: line.productId } },
        data: { stock: { decrement: line.quantity } }
      });
      await tx.inventoryTransaction.create({ data: { branchId: body.branchId, productId: line.productId, type: "SALE_DEDUCTION", quantity: -line.quantity, unitCost: line.unitCost, reference: created.invoiceNo, createdById: req.user.id } });
      if (Number(inventory.stock) <= Number(line.product.minimumStock)) {
        await tx.notification.create({ data: { branchId: body.branchId, type: "LOW_STOCK", message: `${line.product.name} is at low stock (${inventory.stock})` } });
      }
    }
    for (const station of ["KITCHEN", "BAR"]) {
      const stationLines = lines.filter((line) => line.product.category.station === station);
      if (stationLines.length) {
        await tx.orderTicket.create({ data: { saleId: created.id, station, items: { create: stationLines.map((line) => ({ saleItemId: created.items.find((item) => item.productId === line.productId)?.id || 0, name: line.product.name, quantity: line.quantity, note: line.note })) } } });
      }
    }
    if (body.tableId) await tx.diningTable.update({ where: { id: body.tableId }, data: { status: "OCCUPIED" } });
    return created;
  });
  await audit(req, "CREATE", "Sale", sale.id, { invoiceNo: sale.invoiceNo });
  res.status(201).json(sale);
});

app.post("/api/sales/:id/status", validate(z.object({ status: z.enum(["REFUNDED", "VOIDED"]) })), async (req, res) => {
  const requiredPermission = req.validatedBody.status === "REFUNDED" ? "sale:refund" : "sale:void";
  if (req.user.role !== "Admin" && !req.user.permissions.includes(requiredPermission)) {
    return res.status(403).json({ error: `Missing permission: ${requiredPermission}` });
  }
  const saleId = Number(req.params.id);
  const updated = await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({ where: { id: saleId }, include: { items: true } });
    if (!sale) throw new Error("Sale not found");
    if (sale.status !== "PAID") throw new Error(`Sale is already ${sale.status}`);
    if (req.user.role !== "Admin" && sale.branchId !== req.user.branchId) throw new Error("Cannot update another branch sale");
    for (const item of sale.items) {
      await tx.branchInventory.update({
        where: { branchId_productId: { branchId: sale.branchId, productId: item.productId } },
        data: { stock: { increment: item.quantity } }
      });
      await tx.inventoryTransaction.create({
        data: {
          branchId: sale.branchId,
          productId: item.productId,
          type: "REFUND_RESTORE",
          quantity: item.quantity,
          unitCost: item.unitCost,
          reference: `${sale.invoiceNo}-${req.validatedBody.status}`,
          createdById: req.user.id
        }
      });
    }
    await tx.notification.create({
      data: {
        branchId: sale.branchId,
        type: req.validatedBody.status === "REFUNDED" ? "REFUND" : "VOID",
        message: `${sale.invoiceNo} changed to ${req.validatedBody.status}; inventory restored`
      }
    });
    return tx.sale.update({ where: { id: sale.id }, data: { status: req.validatedBody.status }, include: { items: true, payments: true } });
  });
  await audit(req, req.validatedBody.status, "Sale", updated.id, { invoiceNo: updated.invoiceNo });
  res.json(updated);
});

app.get("/api/notifications", async (req, res) => {
  res.json(await prisma.notification.findMany({ where: { branchId: req.user.branchId }, orderBy: { createdAt: "desc" }, take: 100 }));
});

app.use((error, req, res, _next) => {
  console.error(error);
  const message = process.env.NODE_ENV === "production" ? "Request failed" : error.message;
  res.status(error.code === "P2002" ? 409 : 400).json({ error: message });
});

app.use((req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` }));

const server = app.listen(port, () => console.log(`Beer POS API listening on http://localhost:${port}`));
const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

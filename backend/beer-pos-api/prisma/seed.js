import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const permissionKeys = [
  "dashboard:view", "sale:create", "sale:edit", "sale:void", "sale:refund", "sale:print",
  "inventory:view", "inventory:manage", "purchase:manage", "customer:manage", "table:manage",
  "report:view", "report:export", "user:manage", "settings:manage", "branch:manage"
];

async function main() {
  for (const key of permissionKeys) {
    await prisma.permission.upsert({ where: { key }, update: {}, create: { key, name: key } });
  }

  const roleDefinitions = {
    Admin: permissionKeys,
    Manager: permissionKeys.filter((key) => !["user:manage", "settings:manage", "branch:manage"].includes(key)),
    Cashier: ["sale:create", "sale:print", "table:manage", "customer:manage"],
    Kitchen: ["table:manage"],
    Bar: ["table:manage"],
    Viewer: ["dashboard:view", "inventory:view", "report:view"]
  };

  for (const [name, keys] of Object.entries(roleDefinitions)) {
    const role = await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
    const permissions = await prisma.permission.findMany({ where: { key: { in: keys } } });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({ data: permissions.map((permission) => ({ roleId: role.id, permissionId: permission.id })) });
  }

  const branch = await prisma.branch.upsert({
    where: { code: "YGN-01" },
    update: {},
    create: { code: "YGN-01", name: "Golden Tap Yangon", address: "Bogyoke Road, Yangon", phone: "+95 9 420 000 777" }
  });

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: "Admin" } });
  const cashierRole = await prisma.role.findUniqueOrThrow({ where: { name: "Cashier" } });
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);
  const adminPin = await bcrypt.hash("1111", 12);
  const cashierPin = await bcrypt.hash("3333", 12);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: { branchId: branch.id, roleId: adminRole.id, username: "admin", name: "Aung Admin", passwordHash, pinHash: adminPin }
  });
  await prisma.user.upsert({
    where: { username: "cashier" },
    update: {},
    create: { branchId: branch.id, roleId: cashierRole.id, username: "cashier", name: "Ko Cashier", passwordHash, pinHash: cashierPin }
  });

  const categories = [
    ["Beer", "BAR"], ["Whisky", "BAR"], ["Food", "KITCHEN"], ["BBQ", "KITCHEN"],
    ["Soft Drinks", "BAR"], ["Cocktails", "BAR"], ["Wine", "BAR"], ["Snacks", "KITCHEN"]
  ];
  for (const [name, station] of categories) {
    await prisma.category.upsert({ where: { name }, update: { station }, create: { name, station } });
  }

  const beerCategory = await prisma.category.findUniqueOrThrow({ where: { name: "Beer" } });
  const product = await prisma.product.upsert({
    where: { sku: "BEER-001" },
    update: {},
    create: { categoryId: beerCategory.id, sku: "BEER-001", code: "BEER-001", barcode: "9551001001", name: "Myanmar Premium Lager", unit: "Bottle", purchasePrice: 2100, sellingPrice: 3500, minimumStock: 24 }
  });
  await prisma.branchInventory.upsert({
    where: { branchId_productId: { branchId: branch.id, productId: product.id } },
    update: {},
    create: { branchId: branch.id, productId: product.id, stock: 96, averageCost: 2100 }
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });

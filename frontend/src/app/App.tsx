import {
  BarChart3,
  Beer,
  Bell,
  Boxes,
  Building2,
  CalendarCheck,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  DatabaseBackup,
  Download,
  FileText,
  Home,
  Lock,
  LogOut,
  Menu,
  MoreHorizontal,
  PackagePlus,
  Pencil,
  Plus,
  Printer,
  Receipt,
  Save,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Trash2,
  Truck,
  Upload,
  UserRound,
  Users,
  Wallet,
  X
} from "lucide-react";
import { FormEvent, ReactNode, useEffect, useState } from "react";

type Role = "Admin" | "Manager" | "Cashier" | "Kitchen" | "Bar" | "Viewer";
type PageKey =
  | "dashboard"
  | "pos"
  | "products"
  | "inventory"
  | "operations"
  | "partners"
  | "branches"
  | "sales"
  | "finance"
  | "closing"
  | "reports"
  | "users"
  | "settings";
type PaymentMethod = "Cash" | "KBZPay" | "WavePay" | "AYA Pay" | "Credit" | "Split";

type Product = {
  id: string;
  code: string;
  barcode: string;
  name: string;
  category: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minimumStock: number;
  supplier: string;
  status: "Active" | "Inactive";
  image: string;
};

type CartItem = Product & { qty: number; note: string };
type Sale = {
  id: string;
  invoiceNo: string;
  date: string;
  tableNo: string;
  customerName: string;
  waiterName: string;
  guestCount: number;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  service: number;
  grandTotal: number;
  cost: number;
  profit: number;
  paymentMethod: PaymentMethod;
  cashReceived: number;
  cashier: string;
  status: "Paid" | "Held" | "Voided" | "Refunded";
};

type Ledger = {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: "Stock In" | "Stock Out" | "Damage/Loss" | "Supplier Purchase" | "Sale Deduction" | "Refund Restore" | "Audit";
  qty: number;
  unitCost: number;
  reference: string;
};

type MoneyEntry = {
  id: string;
  date: string;
  category: string;
  amount: number;
  note: string;
  type: "Expense" | "Income";
};

type User = {
  id: string;
  name: string;
  role: Role;
  pin: string;
  status: "Active" | "Locked";
  permissions?: PageKey[];
};

type Branch = { id: string; name: string; code: string; address: string; cash: number; status: "Active" | "Inactive" };
type DiningTable = { id: string; branchId: string; name: string; floor: string; seats: number; status: "Available" | "Reserved" | "Occupied" };
type Reservation = { id: string; tableId: string; customer: string; phone: string; time: string; deposit: number; status: "Reserved" | "Checked In" | "Completed" | "Cancelled" };
type WorkOrder = { id: string; station: "Kitchen" | "Bar"; table: string; items: string[]; createdAt: string; status: "Pending" | "Cooking" | "Ready" | "Served" };
type Supplier = { id: string; name: string; phone: string; address: string; email: string; creditLimit: number; outstanding: number };
type Purchase = { id: string; supplierId: string; invoice: string; date: string; amount: number; paid: number; status: "Draft" | "Received" | "Partially Paid" | "Paid" };
type Customer = { id: string; name: string; phone: string; birthday: string; level: "Member" | "Silver" | "Gold" | "VIP"; points: number; totalSpent: number };
type Shift = { id: string; branchId: string; cashier: string; openedAt: string; closedAt?: string; openingCash: number; closingCash?: number; status: "Open" | "Closed" };
type NotificationItem = { id: string; type: "Low Stock" | "Refund" | "Void" | "System" | "Transfer"; message: string; createdAt: string; read: boolean };
type BranchTransfer = { id: string; fromBranchId: string; toBranchId: string; productId: string; qty: number; date: string; status: "Pending" | "Completed" };

type ShopSettings = {
  name: string;
  address: string;
  phone: string;
  footer: string;
  taxRate: number;
  serviceRate: number;
  printerWidth: "58mm" | "80mm";
};

type AppData = {
  products: Product[];
  sales: Sale[];
  ledger: Ledger[];
  money: MoneyEntry[];
  users: User[];
  branches: Branch[];
  tables: DiningTable[];
  reservations: Reservation[];
  workOrders: WorkOrder[];
  suppliers: Supplier[];
  purchases: Purchase[];
  customers: Customer[];
  shifts: Shift[];
  notifications: NotificationItem[];
  branchTransfers: BranchTransfer[];
  settings: ShopSettings;
  auditLogs: string[];
};

const categories = ["Beer", "Whisky", "Food", "BBQ", "Soft Drinks", "Cocktails", "Snacks"];
const expenseCategories = ["Beer Purchase", "Food Purchase", "Ingredients", "Salary", "Electricity", "Water", "Internet", "Maintenance", "Marketing", "Miscellaneous"];
const incomeCategories = ["Other Income", "Service Charge", "Rental Income", "Event Income"];
const roleLabels: Record<Role, string> = { Admin: "အက်ဒမင်", Manager: "မန်နေဂျာ", Cashier: "ငွေကိုင်", Kitchen: "မီးဖိုချောင်", Bar: "ဘားကောင်တာ", Viewer: "ကြည့်ရှုသူ" };
const categoryLabels: Record<string, string> = {
  Beer: "ဘီယာ",
  Whisky: "ဝီစကီ",
  Food: "အစားအသောက်",
  BBQ: "အကင်",
  "Soft Drinks": "အအေး",
  Cocktails: "ကော့တေး",
  Snacks: "မုန့်"
};
const expenseCategoryLabels: Record<string, string> = {
  "Beer Purchase": "ဘီယာဝယ်ယူမှု",
  "Food Purchase": "အစားအသောက်ဝယ်ယူမှု",
  Ingredients: "ကုန်ကြမ်း",
  Salary: "လစာ",
  Electricity: "မီးဖိုး",
  Water: "ရေဖိုး",
  Internet: "အင်တာနက်",
  Maintenance: "ပြုပြင်ထိန်းသိမ်းမှု",
  Marketing: "ကြော်ငြာ",
  Miscellaneous: "အထွေထွေ"
};
const incomeCategoryLabels: Record<string, string> = {
  "Other Income": "အခြားဝင်ငွေ",
  "Service Charge": "ဝန်ဆောင်ခ",
  "Rental Income": "ငှားရမ်းခဝင်ငွေ",
  "Event Income": "ပွဲဝင်ငွေ"
};
const paymentLabels: Record<PaymentMethod, string> = {
  Cash: "ငွေသား",
  KBZPay: "KBZPay",
  WavePay: "WavePay",
  "AYA Pay": "AYA Pay",
  Credit: "အကြွေး",
  Split: "ခွဲရှင်း"
};
const saleStatusLabels: Record<Sale["status"], string> = {
  Paid: "ရှင်းပြီး",
  Held: "ဆိုင်းထား",
  Voided: "ဖျက်သိမ်း",
  Refunded: "ပြန်အမ်း"
};
const ledgerTypeLabels: Record<Ledger["type"], string> = {
  "Stock In": "စတော့ဝင်",
  "Stock Out": "စတော့ထွက်",
  "Damage/Loss": "ပျက်စီး/ပျောက်ဆုံး",
  "Supplier Purchase": "Supplier ထံမှဝယ်ယူ",
  "Sale Deduction": "ရောင်းချပြီးစတော့လျှော့",
  "Refund Restore": "ပြန်အမ်းပြီးစတော့ပြန်ထည့်",
  Audit: "စတော့စစ်ဆေး"
};
const moneyTypeLabels: Record<MoneyEntry["type"], string> = { Expense: "အသုံးစရိတ်", Income: "ဝင်ငွေ" };
const unitLabels: Record<string, string> = { Bottle: "ပုလင်း", Tower: "တာဝါ", Peg: "ပက်", Plate: "ပွဲ", Stick: "ချောင်း", Glass: "ခွက်", Bowl: "ပန်းကန်" };
const permissions: Record<Role, PageKey[]> = {
  Admin: ["dashboard", "pos", "operations", "partners", "branches", "products", "inventory", "sales", "finance", "closing", "reports", "users", "settings"],
  Manager: ["dashboard", "pos", "operations", "partners", "branches", "inventory", "sales", "closing", "reports"],
  Cashier: ["pos", "operations", "closing"],
  Kitchen: ["operations"],
  Bar: ["operations"],
  Viewer: ["dashboard", "sales", "reports"]
};

const sampleProducts: Product[] = [
  { id: "p1", code: "BEER-001", barcode: "9551001001", name: "မြန်မာ ပရီမီယမ် လာဂါ", category: "Beer", unit: "Bottle", purchasePrice: 2100, sellingPrice: 3500, stock: 96, minimumStock: 24, supplier: "Yangon Beverage", status: "Active", image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=500&q=80" },
  { id: "p2", code: "BEER-002", barcode: "9551001002", name: "ဒရပ်ဘီယာ တာဝါ", category: "Beer", unit: "Tower", purchasePrice: 11500, sellingPrice: 18000, stock: 18, minimumStock: 6, supplier: "Tap Room Supply", status: "Active", image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=500&q=80" },
  { id: "p3", code: "WHI-010", barcode: "9552002010", name: "Black Label တစ်ပက်", category: "Whisky", unit: "Peg", purchasePrice: 4200, sellingPrice: 7000, stock: 44, minimumStock: 12, supplier: "Mandalay Spirits", status: "Active", image: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=500&q=80" },
  { id: "p4", code: "FOOD-005", barcode: "9553003005", name: "ရှမ်းခေါက်ဆွဲ Special", category: "Food", unit: "Plate", purchasePrice: 1800, sellingPrice: 4200, stock: 32, minimumStock: 10, supplier: "Kitchen", status: "Active", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=500&q=80" },
  { id: "p5", code: "BBQ-007", barcode: "9554004007", name: "ဝက်သားအကင်ချောင်း", category: "BBQ", unit: "Stick", purchasePrice: 900, sellingPrice: 1800, stock: 9, minimumStock: 20, supplier: "Night Grill", status: "Active", image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=500&q=80" },
  { id: "p6", code: "SOFT-003", barcode: "9555005003", name: "သံပရာဆိုဒါ", category: "Soft Drinks", unit: "Glass", purchasePrice: 700, sellingPrice: 2200, stock: 55, minimumStock: 18, supplier: "Bar Counter", status: "Active", image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=500&q=80" },
  { id: "p7", code: "COC-004", barcode: "9556006004", name: "Mojito Classic ကော့တေး", category: "Cocktails", unit: "Glass", purchasePrice: 3000, sellingPrice: 6500, stock: 27, minimumStock: 8, supplier: "Bar Counter", status: "Active", image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=500&q=80" },
  { id: "p8", code: "SNK-002", barcode: "9557007002", name: "မြေပဲကြော်အစုံ", category: "Snacks", unit: "Bowl", purchasePrice: 800, sellingPrice: 2500, stock: 40, minimumStock: 15, supplier: "Kitchen", status: "Active", image: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=500&q=80" }
];

const seedData: AppData = {
  products: sampleProducts,
  sales: [],
  ledger: [
    { id: "l1", date: new Date().toISOString(), productId: "p1", productName: "မြန်မာ ပရီမီယမ် လာဂါ", type: "Supplier Purchase", qty: 96, unitCost: 2100, reference: "Opening stock" }
  ],
  money: [
    { id: "m1", date: new Date().toISOString(), category: "Electricity", amount: 35000, note: "Daily estimate", type: "Expense" },
    { id: "m2", date: new Date().toISOString(), category: "Event Income", amount: 80000, note: "Private room booking", type: "Income" }
  ],
  users: [
    { id: "u1", name: "Aung Admin", role: "Admin", pin: "1111", status: "Active" },
    { id: "u2", name: "Mya Manager", role: "Manager", pin: "2222", status: "Active" },
    { id: "u3", name: "Ko Cashier", role: "Cashier", pin: "3333", status: "Active" },
    { id: "u4", name: "Kitchen Team", role: "Kitchen", pin: "4444", status: "Active" },
    { id: "u5", name: "Bar Team", role: "Bar", pin: "5555", status: "Active" }
  ],
  branches: [
    { id: "b1", name: "Golden Tap Yangon", code: "YGN-01", address: "ဗိုလ်ချုပ်လမ်း၊ ရန်ကုန်", cash: 850000, status: "Active" },
    { id: "b2", name: "Golden Tap Mandalay", code: "MDY-01", address: "၇၈ လမ်း၊ မန္တလေး", cash: 620000, status: "Active" }
  ],
  tables: [
    { id: "t1", branchId: "b1", name: "A1", floor: "Ground", seats: 4, status: "Occupied" },
    { id: "t2", branchId: "b1", name: "A2", floor: "Ground", seats: 4, status: "Available" },
    { id: "t3", branchId: "b1", name: "VIP-1", floor: "First", seats: 8, status: "Reserved" },
    { id: "t4", branchId: "b1", name: "Rooftop-1", floor: "Rooftop", seats: 6, status: "Available" }
  ],
  reservations: [
    { id: "r1", tableId: "t3", customer: "မောင်သန့်", phone: "09 777 123 456", time: new Date(Date.now() + 3600000).toISOString(), deposit: 50000, status: "Reserved" }
  ],
  workOrders: [
    { id: "w1", station: "Kitchen", table: "A1", items: ["ဝက်သားအကင် ၃ ချောင်း", "ရှမ်းခေါက်ဆွဲ ၁ ပွဲ"], createdAt: new Date().toISOString(), status: "Cooking" },
    { id: "w2", station: "Bar", table: "A1", items: ["မြန်မာ ပရီမီယမ် ၄ ပုလင်း"], createdAt: new Date().toISOString(), status: "Pending" }
  ],
  suppliers: [
    { id: "s1", name: "Yangon Beverage", phone: "09 500 111 222", address: "ရန်ကုန်", email: "sales@ygnbeverage.mm", creditLimit: 5000000, outstanding: 740000 },
    { id: "s2", name: "Mandalay Spirits", phone: "09 400 555 777", address: "မန္တလေး", email: "order@mdyspirits.mm", creditLimit: 3000000, outstanding: 320000 }
  ],
  purchases: [
    { id: "po1", supplierId: "s1", invoice: "PO-20260609-001", date: new Date().toISOString(), amount: 960000, paid: 500000, status: "Partially Paid" }
  ],
  customers: [
    { id: "c1", name: "ကိုဇော်", phone: "09 421 000 111", birthday: "1990-08-12", level: "Gold", points: 1280, totalSpent: 2480000 },
    { id: "c2", name: "မသီတာ", phone: "09 777 300 444", birthday: "1995-03-21", level: "VIP", points: 3400, totalSpent: 6920000 }
  ],
  shifts: [
    { id: "sh1", branchId: "b1", cashier: "Ko Cashier", openedAt: new Date().toISOString(), openingCash: 100000, status: "Open" }
  ],
  notifications: [
    { id: "n1", type: "Low Stock", message: "ဝက်သားအကင်ချောင်း စတော့သည် သတ်မှတ်ပမာဏအောက်ရောက်နေပါသည်။", createdAt: new Date().toISOString(), read: false }
  ],
  branchTransfers: [],
  settings: {
    name: "Golden Tap Beer Bar",
    address: "အမှတ် ၂၇၊ ဗိုလ်ချုပ်လမ်း၊ ရန်ကုန်",
    phone: "+95 9 420 000 777",
    footer: "ကျေးဇူးတင်ပါသည်။ ထပ်မံကြွရောက်ပါ။",
    taxRate: 5,
    serviceRate: 3,
    printerWidth: "80mm"
  },
  auditLogs: ["မြန်မာ Beer Bar demo data ထည့်သွင်းပြီးပါပြီ။"]
};

const navItems: { key: PageKey; label: string; icon: typeof Home }[] = [
  { key: "dashboard", label: "ဒက်ရှ်ဘုတ်", icon: Home },
  { key: "pos", label: "အရောင်း POS", icon: ShoppingCart },
  { key: "operations", label: "ဆိုင်လုပ်ငန်း", icon: ChefHat },
  { key: "partners", label: "ဝယ်ယူ/မိတ်ဖက်", icon: Truck },
  { key: "branches", label: "ဆိုင်ခွဲ/Shift", icon: Building2 },
  { key: "products", label: "ကုန်ပစ္စည်းများ", icon: Beer },
  { key: "inventory", label: "စတော့စာရင်း", icon: Boxes },
  { key: "sales", label: "ဘောင်ချာစာရင်း", icon: Receipt },
  { key: "finance", label: "အသုံးစရိတ်/ဝင်ငွေ", icon: Wallet },
  { key: "closing", label: "နေ့စဉ်ပိတ်စာရင်း", icon: CalendarCheck },
  { key: "reports", label: "အစီရင်ခံစာ", icon: BarChart3 },
  { key: "users", label: "အသုံးပြုသူများ", icon: Users },
  { key: "settings", label: "ဆက်တင်", icon: Settings }
];

const myNumber = new Intl.NumberFormat("my-MM", { maximumFractionDigits: 0 });
const mmk = { format: (value: number) => `${myNumber.format(Math.round(value || 0))} ကျပ်` };
const dateParts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Yangon", day: "2-digit", month: "short", year: "numeric" });
const timeParts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Yangon", hour: "2-digit", minute: "2-digit", hour12: true });
const formatDate = (value: string | Date) => {
  const parts = dateParts.formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("day")}-${get("month")}-${get("year")}`;
};
const formatTime = (value: string | Date) => timeParts.format(new Date(value)).toUpperCase();
const formatDateTime = (value: string | Date) => `${formatDate(value)} ${formatTime(value)}`;
const todayKey = () => new Date().toISOString().slice(0, 10);
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const userPermissions = (user: User) => user.permissions ?? permissions[user.role];
const purchaseOutstanding = (purchase: Purchase) => Math.max(0, purchase.amount - purchase.paid);
const recalculateSupplierOutstanding = (suppliers: Supplier[], purchases: Purchase[]) => suppliers.map((supplier) => ({
  ...supplier,
  outstanding: purchases.filter((purchase) => purchase.supplierId === supplier.id).reduce((sum, purchase) => sum + purchaseOutstanding(purchase), 0)
}));
const fromStorage = (): AppData => {
  try {
    const raw = localStorage.getItem("beer-pos-data-v3");
    if (!raw) return seedData;
    const saved = JSON.parse(raw) as Partial<AppData>;
    return {
      ...seedData,
      ...saved,
      settings: { ...seedData.settings, ...(saved.settings ?? {}) }
    };
  } catch {
    return seedData;
  }
};

function invoiceNo(count: number) {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `INV-${stamp}-${String(count + 1).padStart(6, "0")}`;
}

function downloadFile(filename: string, content: string, type = "application/json") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Record<string, string | number>[]) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  return [keys.join(","), ...rows.map((row) => keys.map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
}

export function App() {
  const [data, setData] = useState<AppData>(fromStorage);
  const [user, setUser] = useState<User | null>(() => {
    const uid = localStorage.getItem("beer-pos-user");
    return fromStorage().users.find((item) => item.id === uid) ?? null;
  });
  const [page, setPage] = useState<PageKey>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastReceipt, setLastReceipt] = useState<Sale | null>(null);

  useEffect(() => localStorage.setItem("beer-pos-data-v3", JSON.stringify(data)), [data]);
  useEffect(() => {
    if (user) localStorage.setItem("beer-pos-user", user.id);
    else localStorage.removeItem("beer-pos-user");
  }, [user]);
  useEffect(() => {
    if (!user) return;
    const latest = data.users.find((item) => item.id === user.id);
    if (!latest || latest.status !== "Active") setUser(null);
    else if (latest !== user) setUser(latest);
  }, [data.users, user]);

  const allowedPages = user ? userPermissions(user) : [];
  useEffect(() => {
    if (user && !allowedPages.includes(page)) setPage(allowedPages[0]);
  }, [allowedPages, page, user]);

  const updateData = (fn: (current: AppData) => AppData) => setData((current) => fn(current));
  const audit = (message: string) => updateData((current) => ({ ...current, auditLogs: [`${formatDateTime(new Date())} - ${message}`, ...current.auditLogs].slice(0, 80) }));

  if (!user) return <LoginScreen users={data.users} onLogin={setUser} />;

  const activeNav = navItems.filter((item) => allowedPages.includes(item.key));
  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} items={activeNav} page={page} setPage={setPage} user={user} onLogout={() => setUser(null)} />
      <main className={`min-h-screen pb-24 transition-all duration-300 lg:pb-0 ${collapsed ? "lg:pl-24" : "lg:pl-72"}`}>
        <Topbar title={navItems.find((item) => item.key === page)?.label ?? "POS"} user={user} onMenu={() => setCollapsed(!collapsed)} />
        <div className="mx-auto max-w-[1560px] px-3 py-4 sm:px-5 lg:px-7">
          {page === "dashboard" && <Dashboard data={data} />}
          {page === "pos" && <PosPage data={data} setData={setData} cart={cart} setCart={setCart} cashier={user} setLastReceipt={setLastReceipt} />}
          {page === "operations" && <OperationsPage data={data} setData={setData} audit={audit} />}
          {page === "partners" && <PartnersPage data={data} setData={setData} audit={audit} />}
          {page === "branches" && <BranchesPage data={data} setData={setData} currentUser={user} audit={audit} />}
          {page === "products" && <ProductsPage data={data} setData={setData} audit={audit} />}
          {page === "inventory" && <InventoryPage data={data} setData={setData} audit={audit} />}
          {page === "sales" && <SalesPage data={data} setData={setData} setLastReceipt={setLastReceipt} audit={audit} />}
          {page === "finance" && <FinancePage data={data} setData={setData} audit={audit} />}
          {page === "closing" && <ClosingPage data={data} cashier={user} />}
          {page === "reports" && <ReportsPage data={data} />}
          {page === "users" && <UsersPage data={data} setData={setData} currentUser={user} audit={audit} />}
          {page === "settings" && <SettingsPage data={data} setData={setData} audit={audit} />}
        </div>
      </main>
      <MobileNav items={activeNav} page={page} setPage={setPage} />
      {lastReceipt && <ReceiptModal sale={lastReceipt} settings={data.settings} onClose={() => setLastReceipt(null)} />}
    </div>
  );
}

function LoginScreen({ users, onLogin }: { users: User[]; onLogin: (user: User) => void }) {
  const [selectedId, setSelectedId] = useState(users.find((user) => user.status === "Active")?.id ?? "");
  const selected = users.find((user) => user.id === selectedId);
  const [pin, setPin] = useState(selected?.pin ?? "");
  const [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (selected?.pin === pin && selected.status === "Active") onLogin(selected);
    else setError("PIN မှားနေသည် သို့မဟုတ် အသုံးပြုသူကို ပိတ်ထားသည်။");
  };
  return (
    <main className="grid min-h-screen place-items-center bg-[#121212] p-4 text-white">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl border border-white/10 bg-[#1E1E1E]/95 p-6 shadow-2xl shadow-black/40">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#FFC107] text-black"><Beer /></div>
          <div>
            <h1 className="text-2xl font-semibold">Golden Tap POS</h1>
            <p className="text-sm text-[#B0B0B0]">ဘီယာဆိုင်၊ Bar၊ Restaurant စီမံခန့်ခွဲမှု</p>
          </div>
        </div>
        <label className="field-label">အသုံးပြုသူအကောင့်</label>
        <select className="field" value={selectedId} onChange={(event) => {
          const next = users.find((user) => user.id === event.target.value);
          setSelectedId(event.target.value);
          setPin(next?.pin ?? "");
          setError("");
        }}>
          {users.map((user) => <option key={user.id} value={user.id}>{user.name} · {roleLabels[user.role]}{user.status === "Locked" ? " (ပိတ်ထား)" : ""}</option>)}
        </select>
        <label className="field-label mt-4">PIN</label>
        <input className="field" value={pin} onChange={(event) => setPin(event.target.value)} type="password" inputMode="numeric" />
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFC107] px-4 py-3 font-semibold text-black transition hover:bg-[#FFB300]">
          <Lock size={18} /> ဝင်မည်
        </button>
        <p className="mt-4 text-xs text-[#B0B0B0]">ရွေးထားသောအကောင့်၏ PIN ဖြင့် ဝင်ရောက်ပါ။</p>
      </form>
    </main>
  );
}

function Sidebar(props: { collapsed: boolean; setCollapsed: (value: boolean) => void; items: typeof navItems; page: PageKey; setPage: (page: PageKey) => void; user: User; onLogout: () => void }) {
  return (
    <aside className={`fixed inset-y-0 left-0 z-30 hidden border-r border-white/10 bg-[#1E1E1E] shadow-2xl shadow-black/30 transition-all duration-300 lg:flex lg:flex-col ${props.collapsed ? "w-24" : "w-72"}`}>
      <div className="flex h-20 items-center justify-between px-5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#FFC107] text-black"><Beer /></div>
          {!props.collapsed && <div><p className="font-semibold">Golden Tap</p><p className="text-xs text-[#B0B0B0]">မြန်မာ POS</p></div>}
        </div>
        <button className="icon-btn" onClick={() => props.setCollapsed(!props.collapsed)} title="ဘေးမီနူး ခေါက်/ဖြန့်">
          {props.collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {props.items.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.key} onClick={() => props.setPage(item.key)} className={`nav-btn ${props.page === item.key ? "nav-btn-active" : ""}`} title={item.label}>
              <Icon size={20} /><span className={props.collapsed ? "sr-only" : ""}>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        {!props.collapsed && <p className="mb-3 text-sm text-[#B0B0B0]">{props.user.name} · {roleLabels[props.user.role]}</p>}
        <button className="nav-btn" onClick={props.onLogout}><LogOut size={20} /><span className={props.collapsed ? "sr-only" : ""}>ထွက်မည်</span></button>
      </div>
    </aside>
  );
}

function Topbar({ title, user, onMenu }: { title: string; user: User; onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#121212]/90 px-3 py-3 backdrop-blur sm:px-5 lg:px-7">
      <div className="mx-auto flex max-w-[1560px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button className="icon-btn lg:hidden" onClick={onMenu}><Menu size={20} /></button>
          <div>
            <h2 className="truncate text-lg font-semibold sm:text-2xl">{title}</h2>
            <p className="text-xs text-[#B0B0B0]">Computer, Tablet, Mobile အားလုံးအတွက် POS၊ စတော့၊ အစီရင်ခံစာ၊ ဘောင်ချာပုံနှိပ်</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-[#1E1E1E] px-3 py-2 sm:flex">
          <ShieldCheck size={18} className="text-[#FFC107]" />
          <span className="text-sm">{roleLabels[user.role]}</span>
        </div>
      </div>
    </header>
  );
}

function MobileNav({ items, page, setPage }: { items: typeof navItems; page: PageKey; setPage: (page: PageKey) => void }) {
  const [open, setOpen] = useState(false);
  const primary = items.slice(0, 4);
  const extra = items.slice(4);
  return (
    <>
      {open && <div className="fixed inset-x-3 bottom-24 z-40 max-h-[65vh] overflow-auto rounded-xl border border-white/10 bg-[#1E1E1E] p-3 shadow-2xl shadow-black/60 lg:hidden">
        <div className="grid grid-cols-2 gap-2">
          {extra.map((item) => {
            const Icon = item.icon;
            return <button key={item.key} onClick={() => { setPage(item.key); setOpen(false); }} className={`nav-btn ${page === item.key ? "nav-btn-active" : ""}`}><Icon size={19} /><span>{item.label}</span></button>;
          })}
        </div>
      </div>}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 gap-1 border-t border-white/10 bg-[#1E1E1E]/95 p-2 backdrop-blur lg:hidden">
      {primary.map((item) => {
        const Icon = item.icon;
        return <button key={item.key} onClick={() => { setPage(item.key); setOpen(false); }} className={`mobile-nav ${page === item.key ? "text-[#FFC107]" : "text-[#B0B0B0]"}`}><Icon size={20} /><span>{item.label.split(" ")[0]}</span></button>;
      })}
      <button onClick={() => setOpen(!open)} className={`mobile-nav ${open || extra.some((item) => item.key === page) ? "text-[#FFC107]" : "text-[#B0B0B0]"}`}><MoreHorizontal size={20} /><span>ပိုမို</span></button>
      </nav>
    </>
  );
}

function Dashboard({ data }: { data: AppData }) {
  const metrics = useMetrics(data);
  const lowStock = data.products.filter((p) => p.stock <= p.minimumStock);
  const topProducts = aggregateProductSales(data.sales);
  return (
    <section className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="ယနေ့အရောင်း" value={mmk.format(metrics.todaySales)} icon={<Receipt />} />
        <Metric title="ယနေ့အမြတ်" value={mmk.format(metrics.todayProfit)} icon={<BarChart3 />} tone="green" />
        <Metric title="ယနေ့အသုံးစရိတ်" value={mmk.format(metrics.todayExpense)} icon={<Wallet />} tone="red" />
        <Metric title="ငွေသားလက်ကျန်" value={mmk.format(metrics.cashBalance)} icon={<CreditCard />} />
        <Metric title="လစဉ်အရောင်း" value={mmk.format(metrics.monthSales)} icon={<CalendarCheck />} />
        <Metric title="လစဉ်အမြတ်" value={mmk.format(metrics.monthProfit)} icon={<BarChart3 />} tone="green" />
        <Metric title="Digital ငွေလက်ကျန်" value={mmk.format(metrics.digitalBalance)} icon={<Wallet />} />
        <Metric title="စတော့နည်း" value={`${myNumber.format(lowStock.length)} မျိုး`} icon={<Boxes />} tone="amber" />
        <Metric title="ဖွင့်ထားသော Order" value={`${myNumber.format(data.workOrders.filter((order) => order.status !== "Served").length)} ခု`} icon={<ChefHat />} />
        <Metric title="အသုံးပြု/ကြိုတင်စားပွဲ" value={`${myNumber.format(data.tables.filter((table) => table.status !== "Available").length)} ဝိုင်း`} icon={<Store />} tone="amber" />
        <Metric title="မဖတ်ရသေးသော Alert" value={`${myNumber.format(data.notifications.filter((item) => !item.read).length)} ခု`} icon={<Bell />} tone="red" />
        <Metric title="ဖွင့်ထားသော Shift" value={`${myNumber.format(data.shifts.filter((shift) => shift.status === "Open").length)} ခု`} icon={<Clock3 />} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_.8fr]">
        <Panel title="နေ့စဉ်အရောင်း Chart"><Bars rows={dailyRows(data.sales)} /></Panel>
        <Panel title="ငွေပေးချေမှုအမျိုးအစား"><Donut rows={paymentRows(data.sales)} /></Panel>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="ရောင်းအားအကောင်းဆုံး"><Ranked rows={topProducts.map((p) => ({ label: p.name, value: `${myNumber.format(p.qty)} ခု ရောင်းပြီး` }))} /></Panel>
        <Panel title="စတော့နည်းသောပစ္စည်းများ"><Ranked rows={lowStock.map((p) => ({ label: p.name, value: `${myNumber.format(p.stock)} ${unitLabels[p.unit] ?? p.unit}` }))} empty="စတော့နည်း alert မရှိပါ" /></Panel>
        <Panel title="နောက်ဆုံးရောင်းချမှု"><Ranked rows={data.sales.slice(0, 6).map((s) => ({ label: s.invoiceNo, value: mmk.format(s.grandTotal) }))} empty="ရောင်းချမှုမရှိသေးပါ" /></Panel>
      </div>
    </section>
  );
}

function PosPage({ data, setData, cart, setCart, cashier, setLastReceipt }: { data: AppData; setData: (data: AppData) => void; cart: CartItem[]; setCart: (items: CartItem[]) => void; cashier: User; setLastReceipt: (sale: Sale) => void }) {
  const [category, setCategory] = useState("Beer");
  const [search, setSearch] = useState("");
  const [tableNo, setTableNo] = useState("A1");
  const [customerName, setCustomerName] = useState("လက်ငင်းဧည့်သည်");
  const [waiterName, setWaiterName] = useState("Ko Min");
  const [guestCount, setGuestCount] = useState(2);
  const [discountMode, setDiscountMode] = useState<"MMK" | "%">("MMK");
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [cashReceived, setCashReceived] = useState(0);
  const products = data.products.filter((p) => p.status === "Active" && p.category === category && p.name.toLowerCase().includes(search.toLowerCase()));
  const totals = calcTotals(cart, data.settings.taxRate, data.settings.serviceRate, discountMode, discountValue);
  const add = (product: Product) => {
    const currentQty = cart.find((item) => item.id === product.id)?.qty ?? 0;
    if (currentQty >= product.stock) return;
    setCart(cart.find((item) => item.id === product.id) ? cart.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item) : [...cart, { ...product, qty: 1, note: "" }]);
  };
  const saveSale = (status: Sale["status"] = "Paid") => {
    if (!cart.length) return;
    if (status === "Paid" && cart.some((item) => item.qty > (data.products.find((product) => product.id === item.id)?.stock ?? 0))) return;
    const sale: Sale = {
      id: id("sale"),
      invoiceNo: invoiceNo(data.sales.length),
      date: new Date().toISOString(),
      tableNo,
      customerName,
      waiterName,
      guestCount,
      items: cart,
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      service: totals.service,
      grandTotal: totals.grandTotal,
      cost: totals.cost,
      profit: totals.grandTotal - totals.cost,
      paymentMethod,
      cashReceived: cashReceived || totals.grandTotal,
      cashier: cashier.name,
      status
    };
    const nextProducts = data.products.map((product) => {
      const item = cart.find((cartItem) => cartItem.id === product.id);
      return item && status === "Paid" ? { ...product, stock: Math.max(0, product.stock - item.qty) } : product;
    });
    const movements = status === "Paid" ? cart.map((item) => ({ id: id("ledger"), date: sale.date, productId: item.id, productName: item.name, type: "Sale Deduction" as const, qty: -item.qty, unitCost: item.purchasePrice, reference: sale.invoiceNo })) : [];
    const kitchenItems = cart.filter((item) => ["Food", "BBQ"].includes(item.category));
    const barItems = cart.filter((item) => !["Food", "BBQ"].includes(item.category));
    const generatedOrders: WorkOrder[] = status === "Paid" ? [
      ...(kitchenItems.length ? [{ id: id("kot"), station: "Kitchen" as const, table: tableNo, items: kitchenItems.map((item) => `${item.name} x ${item.qty}${item.note ? ` (${item.note})` : ""}`), createdAt: sale.date, status: "Pending" as const }] : []),
      ...(barItems.length ? [{ id: id("bot"), station: "Bar" as const, table: tableNo, items: barItems.map((item) => `${item.name} x ${item.qty}${item.note ? ` (${item.note})` : ""}`), createdAt: sale.date, status: "Pending" as const }] : [])
    ] : [];
    const lowStockNotifications: NotificationItem[] = nextProducts.filter((product) => product.stock <= product.minimumStock).map((product) => ({ id: id("notification"), type: "Low Stock", message: `${product.name} စတော့ ${product.stock} သာ ကျန်ရှိပါသည်။`, createdAt: sale.date, read: false }));
    setData({ ...data, products: nextProducts, sales: [sale, ...data.sales], ledger: [...movements, ...data.ledger], workOrders: [...generatedOrders, ...data.workOrders], notifications: [...lowStockNotifications, ...data.notifications], auditLogs: [`${formatDateTime(new Date())} - ${cashier.name} saved ${sale.invoiceNo}`, ...data.auditLogs] });
    setCart([]);
    setLastReceipt(sale);
  };
  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_430px]">
      <div className="min-w-0 space-y-4">
        <div className="toolbar">
          <div className="searchbox"><Search size={18} /><input placeholder="ပစ္စည်းရှာရန်" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div className="category-tabs">{categories.map((cat) => <button key={cat} onClick={() => setCategory(cat)} className={cat === category ? "tab-active" : "tab"}>{categoryLabels[cat] ?? cat}</button>)}</div>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <button key={product.id} onClick={() => add(product)} className="product-card">
              <img src={product.image} alt="" />
              <div className="p-3 text-left">
                <div className="flex items-start justify-between gap-2">
                  <h3>{product.name}</h3>
                  <span className={`stock-badge ${product.stock <= product.minimumStock ? "bg-red-500/20 text-red-200" : "bg-green-500/20 text-green-200"}`}>{product.stock}</span>
                </div>
                <p className="mt-1 text-sm text-[#B0B0B0]">{unitLabels[product.unit] ?? product.unit} · {product.supplier}</p>
                <p className="mt-2 font-semibold text-[#FFC107]">{mmk.format(product.sellingPrice)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      <aside className="cart-panel">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold"><ShoppingCart className="text-[#FFC107]" /> လက်ရှိဘောင်ချာ</h3>
        <div className="grid grid-cols-2 gap-2">
          <label><span className="field-label">စားပွဲနံပါတ်</span><input className="field" value={tableNo} onChange={(e) => setTableNo(e.target.value)} placeholder="ဥပမာ - A1" /></label>
          <label><span className="field-label">တာဝန်ခံဝန်ထမ်း</span><input className="field" value={waiterName} onChange={(e) => setWaiterName(e.target.value)} placeholder="ဝန်ထမ်းအမည်" /></label>
          <label><span className="field-label">ဧည့်သည်အမည်</span><input className="field" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="အမည်ထည့်ပါ" /></label>
          <label><span className="field-label">ဧည့်သည်ဦးရေ (ယောက်)</span><input className="field" value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))} type="number" min={1} placeholder="ဥပမာ - ၄" aria-label="ဧည့်သည်ဦးရေ" /></label>
        </div>
        <div className="mt-4 max-h-[38vh] space-y-2 overflow-auto pr-1 xl:max-h-[44vh]">
          {cart.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-[#B0B0B0]">ဘောင်ချာထဲတွင် ပစ္စည်းမရှိသေးပါ</p>}
          {cart.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex justify-between gap-3"><p className="font-medium">{item.name}</p><p className="text-[#FFC107]">{mmk.format(item.sellingPrice * item.qty)}</p></div>
              <div className="mt-3 flex items-center gap-2">
                <button className="qty-btn" onClick={() => setCart(cart.map((i) => i.id === item.id ? { ...i, qty: Math.max(1, i.qty - 1) } : i))}>-</button>
                <span className="w-8 text-center">{item.qty}</span>
                <button className="qty-btn" onClick={() => setCart(cart.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i))}>+</button>
                <input className="field min-w-0 flex-1 py-2 text-xs" value={item.note} onChange={(e) => setCart(cart.map((i) => i.id === item.id ? { ...i, note: e.target.value } : i))} placeholder="မှတ်ချက်" />
                <button className="icon-btn" onClick={() => setCart(cart.filter((i) => i.id !== item.id))}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
          <div className="grid grid-cols-[1fr_120px] items-end gap-2">
            <label><span className="field-label">လျှော့ဈေးပုံစံ</span><select className="field" value={discountMode} onChange={(e) => setDiscountMode(e.target.value as "MMK" | "%")}><option>MMK</option><option>%</option></select></label>
            <label><span className="field-label">လျှော့ဈေး {discountMode === "%" ? "(%)" : "(ကျပ်)"}</span><input className="field" type="number" min={0} value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} placeholder={discountMode === "%" ? "ဥပမာ - ၅" : "ဥပမာ - ၁၀၀၀"} aria-label="လျှော့ဈေးပမာဏ" /></label>
          </div>
          <select className="field" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
            {(["Cash", "KBZPay", "WavePay", "AYA Pay", "Credit", "Split"] as PaymentMethod[]).map((m) => <option key={m} value={m}>{paymentLabels[m]}</option>)}
          </select>
          <label><span className="field-label">ဧည့်သည်ထံမှ လက်ခံငွေ (ကျပ်)</span><input className="field" type="number" min={0} value={cashReceived} onChange={(e) => setCashReceived(Number(e.target.value))} placeholder="ဥပမာ - ၅၀၀၀၀" aria-label="လက်ခံငွေ" /></label>
          <Totals totals={totals} cashReceived={cashReceived || totals.grandTotal} />
          <div className="grid grid-cols-2 gap-2">
            <button className="primary-btn" onClick={() => saveSale("Paid")}><Receipt size={18} /> ရောင်းမည်</button>
            <button className="secondary-btn" onClick={() => saveSale("Paid")}><Printer size={18} /> ပုံနှိပ်</button>
            <button className="secondary-btn" onClick={() => saveSale("Held")}><FileText size={18} /> ဆိုင်းထား</button>
            <button className="danger-btn" onClick={() => setCart([])}><X size={18} /> ရှင်းမည်</button>
          </div>
        </div>
      </aside>
    </section>
  );
}

function OperationsPage({ data, setData, audit }: { data: AppData; setData: (data: AppData) => void; audit: (message: string) => void }) {
  const [tab, setTab] = useState<"tables" | "reservations" | "kitchen" | "bar">("tables");
  const emptyTable = (): DiningTable => ({ id: "", branchId: data.branches[0]?.id ?? "", name: "", floor: "", seats: 4, status: "Available" });
  const [tableDraft, setTableDraft] = useState<DiningTable>(emptyTable);
  const [floorFilter, setFloorFilter] = useState("အားလုံး");
  const [reservation, setReservation] = useState({ tableId: data.tables[0]?.id ?? "", customer: "", phone: "", time: "", deposit: 0 });
  const orderStatuses: WorkOrder["status"][] = ["Pending", "Cooking", "Ready", "Served"];
  const orderStatusLabel: Record<WorkOrder["status"], string> = { Pending: "စောင့်ဆိုင်း", Cooking: "ပြင်ဆင်နေ", Ready: "အဆင်သင့်", Served: "ပို့ပြီး" };
  const tableStatusLabel: Record<DiningTable["status"], string> = { Available: "အားလပ်", Reserved: "ကြိုတင်ယူ", Occupied: "အသုံးပြုနေ" };
  const changeTable = (table: DiningTable) => {
    const next: DiningTable["status"] = table.status === "Occupied" ? "Available" : "Occupied";
    setData({
      ...data,
      tables: data.tables.map((item) => item.id === table.id ? { ...item, status: next } : item),
      reservations: table.status === "Reserved"
        ? data.reservations.map((item) => item.tableId === table.id && item.status === "Reserved" ? { ...item, status: "Checked In" } : item)
        : data.reservations
    });
    audit(`Table ${table.name} status changed to ${next}`);
  };
  const saveTable = () => {
    const name = tableDraft.name.trim();
    const floor = tableDraft.floor.trim();
    if (!name || !floor || tableDraft.seats < 1) return;
    const duplicate = data.tables.some((table) => table.id !== tableDraft.id && table.branchId === tableDraft.branchId && table.floor.toLowerCase() === floor.toLowerCase() && table.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      window.alert("ဤဆိုင်ခွဲနှင့် အထပ်တွင် စားပွဲအမည်တူ ရှိပြီးသားဖြစ်သည်။");
      return;
    }
    const saved: DiningTable = { ...tableDraft, id: tableDraft.id || id("table"), name, floor };
    setData({ ...data, tables: tableDraft.id ? data.tables.map((table) => table.id === saved.id ? saved : table) : [...data.tables, saved] });
    audit(`${tableDraft.id ? "Updated" : "Added"} table ${saved.name} on ${saved.floor}`);
    setTableDraft(emptyTable());
  };
  const deleteTable = (table: DiningTable) => {
    const activeReservation = data.reservations.some((item) => item.tableId === table.id && !["Completed", "Cancelled"].includes(item.status));
    if (table.status === "Occupied" || activeReservation) {
      window.alert("အသုံးပြုနေသော သို့မဟုတ် ကြိုတင်စာရင်းရှိသော စားပွဲကို မဖျက်နိုင်ပါ။");
      return;
    }
    if (!window.confirm(`${table.name} စားပွဲကို ဖျက်ရန် သေချာပါသလား။`)) return;
    setData({ ...data, tables: data.tables.filter((item) => item.id !== table.id), reservations: data.reservations.filter((item) => item.tableId !== table.id) });
    audit(`Deleted table ${table.name}`);
    if (tableDraft.id === table.id) setTableDraft(emptyTable());
  };
  const addReservation = () => {
    if (!reservation.tableId || !reservation.customer || !reservation.time) return;
    const item: Reservation = { id: id("reservation"), ...reservation, time: new Date(reservation.time).toISOString(), status: "Reserved" };
    setData({
      ...data,
      reservations: [item, ...data.reservations],
      tables: data.tables.map((table) => table.id === reservation.tableId ? { ...table, status: "Reserved" } : table)
    });
    audit(`Reservation created for ${reservation.customer}`);
    setReservation({ tableId: data.tables[0]?.id ?? "", customer: "", phone: "", time: "", deposit: 0 });
  };
  const advanceOrder = (order: WorkOrder) => {
    const index = orderStatuses.indexOf(order.status);
    const status = orderStatuses[Math.min(index + 1, orderStatuses.length - 1)];
    setData({ ...data, workOrders: data.workOrders.map((item) => item.id === order.id ? { ...item, status } : item) });
    audit(`${order.station} order ${order.id} changed to ${status}`);
  };
  const updateReservationStatus = (reservationId: string, status: Reservation["status"]) => {
    const target = data.reservations.find((item) => item.id === reservationId);
    if (!target) return;
    const tableStatus: DiningTable["status"] = status === "Checked In" ? "Occupied" : status === "Reserved" ? "Reserved" : "Available";
    setData({
      ...data,
      reservations: data.reservations.map((item) => item.id === reservationId ? { ...item, status } : item),
      tables: data.tables.map((table) => table.id === target.tableId ? { ...table, status: tableStatus } : table)
    });
    audit(`Reservation ${target.customer} changed to ${status}`);
  };
  const deleteReservation = (item: Reservation) => {
    if (!window.confirm(`${item.customer} ၏ ကြိုတင်စာရင်းကို ဖျက်ရန် သေချာပါသလား။`)) return;
    setData({
      ...data,
      reservations: data.reservations.filter((reservation) => reservation.id !== item.id),
      tables: data.tables.map((table) => table.id === item.tableId && table.status === "Reserved" ? { ...table, status: "Available" } : table)
    });
    audit(`Deleted reservation for ${item.customer}`);
  };
  const orders = data.workOrders.filter((order) => tab === "kitchen" ? order.station === "Kitchen" : order.station === "Bar");
  const floors = [...new Set(data.tables.map((table) => table.floor))];
  const visibleTables = data.tables.filter((table) => floorFilter === "အားလုံး" || table.floor === floorFilter);
  return (
    <section className="space-y-4">
      <div className="category-tabs">
        <button className={tab === "tables" ? "tab-active" : "tab"} onClick={() => setTab("tables")}>Floor Plan</button>
        <button className={tab === "reservations" ? "tab-active" : "tab"} onClick={() => setTab("reservations")}>ကြိုတင်စာရင်း</button>
        <button className={tab === "kitchen" ? "tab-active" : "tab"} onClick={() => setTab("kitchen")}>KOT မီးဖို</button>
        <button className={tab === "bar" ? "tab-active" : "tab"} onClick={() => setTab("bar")}>BOT ဘား</button>
      </div>
      {tab === "tables" && (
        <section className="grid gap-4 xl:grid-cols-[360px_1fr]">
          <Panel title={tableDraft.id ? "စားပွဲပြင်ဆင်ရန်" : "စားပွဲအသစ်ထည့်ရန်"}>
            <label><span className="field-label">ဆိုင်ခွဲ</span><select className="field" value={tableDraft.branchId} onChange={(event) => setTableDraft({ ...tableDraft, branchId: event.target.value })}>{data.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
            <label className="mt-2 block"><span className="field-label">အထပ် / နေရာအမည်</span><input className="field" value={tableDraft.floor} onChange={(event) => setTableDraft({ ...tableDraft, floor: event.target.value })} placeholder="ဥပမာ - မြေညီထပ်၊ Rooftop၊ VIP Room" /></label>
            <label className="mt-2 block"><span className="field-label">စားပွဲအမည် / နံပါတ်</span><input className="field" value={tableDraft.name} onChange={(event) => setTableDraft({ ...tableDraft, name: event.target.value })} placeholder="ဥပမာ - A1" /></label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label><span className="field-label">ထိုင်ခုံ (ယောက်)</span><input className="field" type="number" min={1} value={tableDraft.seats} onChange={(event) => setTableDraft({ ...tableDraft, seats: Number(event.target.value) })} /></label>
              <label><span className="field-label">အခြေအနေ</span><select className="field" value={tableDraft.status} onChange={(event) => setTableDraft({ ...tableDraft, status: event.target.value as DiningTable["status"] })}><option value="Available">အားလပ်</option><option value="Reserved">ကြိုတင်ယူ</option><option value="Occupied">အသုံးပြုနေ</option></select></label>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="primary-btn" onClick={saveTable}><Save size={18} /> {tableDraft.id ? "ပြင်ဆင်သိမ်းမည်" : "စားပွဲထည့်မည်"}</button>
              <button className="secondary-btn" onClick={() => setTableDraft(emptyTable())}><X size={18} /> ရှင်းမည်</button>
            </div>
          </Panel>
          <Panel title="စားပွဲ Floor Plan">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-wrap gap-4 text-sm text-[#B0B0B0]"><span><i className="mr-2 inline-block h-3 w-3 rounded-full bg-green-500" />အားလပ်</span><span><i className="mr-2 inline-block h-3 w-3 rounded-full bg-yellow-500" />ကြိုတင်ယူ</span><span><i className="mr-2 inline-block h-3 w-3 rounded-full bg-red-500" />အသုံးပြုနေ</span></div>
              <label className="sm:w-48"><span className="field-label">အထပ်အလိုက်ကြည့်ရန်</span><select className="field" value={floorFilter} onChange={(event) => setFloorFilter(event.target.value)}><option>အားလုံး</option>{floors.map((floor) => <option key={floor}>{floor}</option>)}</select></label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleTables.map((table) => (
                <article key={table.id} className={`min-h-40 rounded-xl border p-4 ${table.status === "Available" ? "border-green-500/50 bg-green-500/10" : table.status === "Reserved" ? "border-yellow-500/50 bg-yellow-500/10" : "border-red-500/50 bg-red-500/10"}`}>
                  <div className="flex justify-between gap-3"><div><strong className="text-xl">{table.name}</strong><p className="mt-1 text-xs text-[#B0B0B0]">{data.branches.find((branch) => branch.id === table.branchId)?.code}</p></div><Store size={22} /></div>
                  <p className="mt-4 text-sm">{table.floor} · {table.seats} ယောက်</p>
                  <button className="mt-2 text-sm font-medium text-[#FFC107]" onClick={() => changeTable(table)}>{tableStatusLabel[table.status]} · ပြောင်းရန်</button>
                  <div className="mt-4 flex gap-2 border-t border-white/10 pt-3"><button className="secondary-btn min-h-9 flex-1 px-2 py-1" onClick={() => setTableDraft(table)}><Pencil size={15} /> ပြင်မည်</button><button className="danger-btn min-h-9 flex-1 px-2 py-1" onClick={() => deleteTable(table)}><Trash2 size={15} /> ဖျက်မည်</button></div>
                </article>
              ))}
              {!visibleTables.length && <p className="text-sm text-[#B0B0B0]">ဤအထပ်တွင် စားပွဲမရှိသေးပါ။</p>}
            </div>
          </Panel>
        </section>
      )}
      {tab === "reservations" && (
        <section className="grid gap-4 xl:grid-cols-[380px_1fr]">
          <Panel title="ကြိုတင်စာရင်းအသစ်">
            <select className="field" value={reservation.tableId} onChange={(e) => setReservation({ ...reservation, tableId: e.target.value })}>{data.tables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select>
            <input className="field mt-2" placeholder="ဧည့်သည်အမည်" value={reservation.customer} onChange={(e) => setReservation({ ...reservation, customer: e.target.value })} />
            <input className="field mt-2" placeholder="ဖုန်း" value={reservation.phone} onChange={(e) => setReservation({ ...reservation, phone: e.target.value })} />
            <input className="field mt-2" type="datetime-local" value={reservation.time} onChange={(e) => setReservation({ ...reservation, time: e.target.value })} />
            <label className="mt-2 block"><span className="field-label">ကြိုတင်မှာယူမှု စရံငွေ (ကျပ်)</span><input className="field" type="number" min={0} placeholder="ဥပမာ - ၅၀၀၀၀" value={reservation.deposit} onChange={(e) => setReservation({ ...reservation, deposit: Number(e.target.value) })} /></label>
            <button className="primary-btn mt-3" onClick={addReservation}><CalendarCheck size={18} /> ကြိုတင်ယူမည်</button>
          </Panel>
          <Panel title="ကြိုတင်စာရင်းများ">
            <ResponsiveTable headers={["စားပွဲ", "ဧည့်သည်", "ဖုန်း", "အချိန်", "စရံ", "အခြေအနေ", "လုပ်ဆောင်ချက်"]}>
              {data.reservations.map((item) => <tr key={item.id}><td>{data.tables.find((table) => table.id === item.tableId)?.name}</td><td>{item.customer}</td><td>{item.phone}</td><td>{formatDateTime(item.time)}</td><td>{mmk.format(item.deposit)}</td><td><select className="field min-w-36 py-2" value={item.status} onChange={(event) => updateReservationStatus(item.id, event.target.value as Reservation["status"])}><option value="Reserved">ကြိုတင်ယူ</option><option value="Checked In">ရောက်ရှိပြီး</option><option value="Completed">ပြီးဆုံး</option><option value="Cancelled">ပယ်ဖျက်</option></select></td><td><button className="text-red-300" onClick={() => deleteReservation(item)}>ဖျက်မည်</button></td></tr>)}
            </ResponsiveTable>
          </Panel>
        </section>
      )}
      {(tab === "kitchen" || tab === "bar") && (
        <Panel title={tab === "kitchen" ? "Kitchen Order Ticket Queue" : "Bar Order Ticket Queue"}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {orders.map((order) => (
              <article key={order.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between"><div><p className="text-xs text-[#B0B0B0]">{formatTime(order.createdAt)}</p><h4 className="mt-1 text-xl font-semibold">စားပွဲ {order.table}</h4></div><span className="stock-badge bg-[#FFC107]/15 text-[#FFC107]">{orderStatusLabel[order.status]}</span></div>
                <ul className="my-4 space-y-2">{order.items.map((item) => <li key={item} className="rounded-lg bg-white/[0.04] px-3 py-2">{item}</li>)}</ul>
                <button disabled={order.status === "Served"} className="primary-btn w-full disabled:opacity-40" onClick={() => advanceOrder(order)}><Clock3 size={18} /> နောက်အဆင့်သို့</button>
              </article>
            ))}
          </div>
        </Panel>
      )}
    </section>
  );
}

function PartnersPage({ data, setData, audit }: { data: AppData; setData: (data: AppData) => void; audit: (message: string) => void }) {
  const [tab, setTab] = useState<"suppliers" | "purchases" | "customers">("suppliers");
  const emptySupplier = (): Supplier => ({ id: "", name: "", phone: "", address: "", email: "", creditLimit: 0, outstanding: 0 });
  const emptyPurchase = (): Purchase => ({ id: "", supplierId: data.suppliers[0]?.id ?? "", invoice: "", date: "", amount: 0, paid: 0, status: "Draft" });
  const emptyCustomer = (): Customer => ({ id: "", name: "", phone: "", birthday: "", level: "Member", points: 0, totalSpent: 0 });
  const [supplier, setSupplier] = useState<Supplier>(emptySupplier);
  const [purchase, setPurchase] = useState<Purchase>(emptyPurchase);
  const [customer, setCustomer] = useState<Customer>(emptyCustomer);
  const saveSupplier = () => {
    if (!supplier.name.trim()) return;
    const saved = { ...supplier, id: supplier.id || id("supplier"), name: supplier.name.trim() };
    setData({ ...data, suppliers: supplier.id ? data.suppliers.map((item) => item.id === saved.id ? saved : item) : [saved, ...data.suppliers] });
    audit(`${supplier.id ? "Updated" : "Added"} supplier ${saved.name}`);
    setSupplier(emptySupplier());
  };
  const deleteSupplier = (item: Supplier) => {
    if (data.purchases.some((purchase) => purchase.supplierId === item.id)) {
      window.alert("ဝယ်ယူမှုစာရင်း ချိတ်ဆက်ထားသော Supplier ကို မဖျက်နိုင်ပါ။ Purchase Order များကို အရင်ဖျက်ပါ။");
      return;
    }
    if (!window.confirm(`${item.name} Supplier ကို ဖျက်ရန် သေချာပါသလား။`)) return;
    setData({ ...data, suppliers: data.suppliers.filter((supplier) => supplier.id !== item.id) });
    audit(`Deleted supplier ${item.name}`);
  };
  const savePurchase = () => {
    if (!purchase.supplierId || !purchase.invoice || purchase.amount <= 0) return;
    const paid = Math.min(Math.max(0, purchase.paid), purchase.amount);
    const status: Purchase["status"] = paid >= purchase.amount ? "Paid" : paid > 0 ? "Partially Paid" : "Received";
    const item: Purchase = { ...purchase, paid, id: purchase.id || id("purchase"), date: purchase.date || new Date().toISOString(), status };
    const purchases = purchase.id ? data.purchases.map((current) => current.id === item.id ? item : current) : [item, ...data.purchases];
    setData({
      ...data,
      purchases,
      suppliers: recalculateSupplierOutstanding(data.suppliers, purchases)
    });
    audit(`${purchase.id ? "Updated" : "Received"} purchase ${purchase.invoice}`);
    setPurchase(emptyPurchase());
  };
  const deletePurchase = (item: Purchase) => {
    if (!window.confirm(`${item.invoice} Purchase Order ကို ဖျက်ရန် သေချာပါသလား။`)) return;
    const purchases = data.purchases.filter((purchase) => purchase.id !== item.id);
    setData({ ...data, purchases, suppliers: recalculateSupplierOutstanding(data.suppliers, purchases) });
    audit(`Deleted purchase ${item.invoice}`);
    if (purchase.id === item.id) setPurchase(emptyPurchase());
  };
  const saveCustomer = () => {
    if (!customer.name || !customer.phone) return;
    const saved = { ...customer, id: customer.id || id("customer") };
    setData({ ...data, customers: customer.id ? data.customers.map((item) => item.id === saved.id ? saved : item) : [saved, ...data.customers] });
    audit(`${customer.id ? "Updated" : "Added"} customer ${customer.name}`);
    setCustomer(emptyCustomer());
  };
  const deleteCustomer = (item: Customer) => {
    if (!window.confirm(`${item.name} Customer ကို ဖျက်ရန် သေချာပါသလား။`)) return;
    setData({ ...data, customers: data.customers.filter((customer) => customer.id !== item.id) });
    audit(`Deleted customer ${item.name}`);
  };
  return (
    <section className="space-y-4">
      <div className="category-tabs">
        <button className={tab === "suppliers" ? "tab-active" : "tab"} onClick={() => setTab("suppliers")}>Supplier</button>
        <button className={tab === "purchases" ? "tab-active" : "tab"} onClick={() => setTab("purchases")}>Purchase Order</button>
        <button className={tab === "customers" ? "tab-active" : "tab"} onClick={() => setTab("customers")}>Customer Loyalty</button>
      </div>
      {tab === "suppliers" && <section className="grid gap-4 xl:grid-cols-[360px_1fr]"><Panel title={supplier.id ? "Supplier ပြင်ဆင်ရန်" : "Supplier အသစ်"}><input className="field" placeholder="Supplier အမည်" value={supplier.name} onChange={(e) => setSupplier({ ...supplier, name: e.target.value })} /><input className="field mt-2" placeholder="ဖုန်း" value={supplier.phone} onChange={(e) => setSupplier({ ...supplier, phone: e.target.value })} /><input className="field mt-2" placeholder="လိပ်စာ" value={supplier.address} onChange={(e) => setSupplier({ ...supplier, address: e.target.value })} /><input className="field mt-2" placeholder="Email" value={supplier.email} onChange={(e) => setSupplier({ ...supplier, email: e.target.value })} /><label className="mt-2 block"><span className="field-label">အကြွေးဝယ်ယူနိုင်သည့် အများဆုံးပမာဏ (ကျပ်)</span><input className="field" type="number" min={0} placeholder="ဥပမာ - ၅၀၀၀၀၀၀" value={supplier.creditLimit} onChange={(e) => setSupplier({ ...supplier, creditLimit: Number(e.target.value) })} /></label><div className="mt-3 grid grid-cols-2 gap-2"><button className="primary-btn" onClick={saveSupplier}><Save size={18} /> သိမ်းမည်</button><button className="secondary-btn" onClick={() => setSupplier(emptySupplier())}><X size={18} /> ရှင်းမည်</button></div></Panel><Panel title="Supplier စာရင်း"><ResponsiveTable headers={["အမည်", "ဖုန်း", "Email", "Credit Limit", "ပေးရန်ကျန်", "လုပ်ဆောင်ချက်"]}>{data.suppliers.map((item) => <tr key={item.id}><td>{item.name}<small>{item.address}</small></td><td>{item.phone}</td><td>{item.email}</td><td>{mmk.format(item.creditLimit)}</td><td>{mmk.format(item.outstanding)}</td><td><button className="text-[#FFC107]" onClick={() => setSupplier(item)}>ပြင်မည်</button> · <button className="text-red-300" onClick={() => deleteSupplier(item)}>ဖျက်မည်</button></td></tr>)}</ResponsiveTable></Panel></section>}
      {tab === "purchases" && <section className="grid gap-4 xl:grid-cols-[360px_1fr]"><Panel title={purchase.id ? "Purchase Order ပြင်ဆင်ရန်" : "Purchase Order အသစ်"}><select className="field" value={purchase.supplierId} onChange={(e) => setPurchase({ ...purchase, supplierId: e.target.value })}>{data.suppliers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input className="field mt-2" placeholder="Supplier Invoice" value={purchase.invoice} onChange={(e) => setPurchase({ ...purchase, invoice: e.target.value })} /><label className="mt-2 block"><span className="field-label">ဝယ်ယူမှု စုစုပေါင်းတန်ဖိုး (ကျပ်)</span><input className="field" type="number" min={0} placeholder="ဥပမာ - ၉၆၀၀၀၀" value={purchase.amount} onChange={(e) => setPurchase({ ...purchase, amount: Number(e.target.value) })} /></label><label className="mt-2 block"><span className="field-label">Supplier ကို ယခုပေးချေငွေ (ကျပ်)</span><input className="field" type="number" min={0} max={purchase.amount} placeholder="ဥပမာ - ၅၀၀၀၀၀" value={purchase.paid} onChange={(e) => setPurchase({ ...purchase, paid: Number(e.target.value) })} /></label><div className="mt-3 grid grid-cols-2 gap-2"><button className="primary-btn" onClick={savePurchase}><Truck size={18} /> သိမ်းမည်</button><button className="secondary-btn" onClick={() => setPurchase(emptyPurchase())}><X size={18} /> ရှင်းမည်</button></div></Panel><Panel title="ဝယ်ယူမှုစာရင်း"><ResponsiveTable headers={["Invoice", "Supplier", "ရက်စွဲ", "စုစုပေါင်း", "ပေးပြီး", "အခြေအနေ", "လုပ်ဆောင်ချက်"]}>{data.purchases.map((item) => <tr key={item.id}><td>{item.invoice}</td><td>{data.suppliers.find((s) => s.id === item.supplierId)?.name}</td><td>{formatDate(item.date)}</td><td>{mmk.format(item.amount)}</td><td>{mmk.format(item.paid)}</td><td>{item.status}</td><td><button className="text-[#FFC107]" onClick={() => setPurchase(item)}>ပြင်မည်</button> · <button className="text-red-300" onClick={() => deletePurchase(item)}>ဖျက်မည်</button></td></tr>)}</ResponsiveTable></Panel></section>}
      {tab === "customers" && <section className="grid gap-4 xl:grid-cols-[360px_1fr]"><Panel title={customer.id ? "Customer ပြင်ဆင်ရန်" : "Customer အသစ်"}><input className="field" placeholder="အမည်" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} /><input className="field mt-2" placeholder="ဖုန်း" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} /><input className="field mt-2" type="date" value={customer.birthday} onChange={(e) => setCustomer({ ...customer, birthday: e.target.value })} /><select className="field mt-2" value={customer.level} onChange={(e) => setCustomer({ ...customer, level: e.target.value as Customer["level"] })}><option>Member</option><option>Silver</option><option>Gold</option><option>VIP</option></select><div className="mt-3 grid grid-cols-2 gap-2"><button className="primary-btn" onClick={saveCustomer}><UserRound size={18} /> သိမ်းမည်</button><button className="secondary-btn" onClick={() => setCustomer(emptyCustomer())}><X size={18} /> ရှင်းမည်</button></div></Panel><Panel title="Customer Loyalty"><ResponsiveTable headers={["အမည်", "ဖုန်း", "အဖွဲ့ဝင်အဆင့်", "Reward Point", "ဝယ်ယူမှုစုစုပေါင်း", "လုပ်ဆောင်ချက်"]}>{data.customers.map((item) => <tr key={item.id}><td>{item.name}<small>{item.birthday}</small></td><td>{item.phone}</td><td>{item.level}</td><td>{myNumber.format(item.points)}</td><td>{mmk.format(item.totalSpent)}</td><td><button className="text-[#FFC107]" onClick={() => setCustomer(item)}>ပြင်မည်</button> · <button className="text-red-300" onClick={() => deleteCustomer(item)}>ဖျက်မည်</button></td></tr>)}</ResponsiveTable></Panel></section>}
    </section>
  );
}

function BranchesPage({ data, setData, currentUser, audit }: { data: AppData; setData: (data: AppData) => void; currentUser: User; audit: (message: string) => void }) {
  const [tab, setTab] = useState<"branches" | "transfer" | "shifts" | "notifications">("branches");
  const emptyBranch = (): Branch => ({ id: "", name: "", code: "", address: "", cash: 0, status: "Active" });
  const [branchDraft, setBranchDraft] = useState<Branch>(emptyBranch);
  const [transfer, setTransfer] = useState({ fromBranchId: data.branches[0]?.id ?? "", toBranchId: data.branches[1]?.id ?? "", productId: data.products[0]?.id ?? "", qty: 1 });
  const saveBranch = () => {
    if (!branchDraft.name.trim() || !branchDraft.code.trim()) return;
    if (data.branches.some((branch) => branch.id !== branchDraft.id && branch.code.toLowerCase() === branchDraft.code.trim().toLowerCase())) {
      window.alert("ဆိုင်ခွဲကုဒ်တူ ရှိပြီးသားဖြစ်သည်။");
      return;
    }
    const saved = { ...branchDraft, id: branchDraft.id || id("branch"), name: branchDraft.name.trim(), code: branchDraft.code.trim().toUpperCase() };
    setData({ ...data, branches: branchDraft.id ? data.branches.map((branch) => branch.id === saved.id ? saved : branch) : [...data.branches, saved] });
    audit(`${branchDraft.id ? "Updated" : "Added"} branch ${saved.name}`);
    setBranchDraft(emptyBranch());
  };
  const deleteBranch = (branch: Branch) => {
    if (data.branches.length <= 1) {
      window.alert("စနစ်တွင် အနည်းဆုံး ဆိုင်ခွဲတစ်ခု ရှိရမည်ဖြစ်သည်။");
      return;
    }
    const linked = data.tables.some((table) => table.branchId === branch.id) || data.shifts.some((shift) => shift.branchId === branch.id);
    if (linked) {
      window.alert("စားပွဲ သို့မဟုတ် Shift မှတ်တမ်း ချိတ်ဆက်ထားသော ဆိုင်ခွဲကို မဖျက်နိုင်ပါ။");
      return;
    }
    if (!window.confirm(`${branch.name} ဆိုင်ခွဲကို ဖျက်ရန် သေချာပါသလား။`)) return;
    setData({ ...data, branches: data.branches.filter((item) => item.id !== branch.id) });
    audit(`Deleted branch ${branch.name}`);
  };
  const completeTransfer = () => {
    if (transfer.fromBranchId === transfer.toBranchId || transfer.qty <= 0) return;
    const item: BranchTransfer = { id: id("transfer"), ...transfer, date: new Date().toISOString(), status: "Completed" };
    setData({ ...data, branchTransfers: [item, ...data.branchTransfers], notifications: [{ id: id("notification"), type: "Transfer", message: `Branch stock transfer ${transfer.qty} ခု ပြီးစီးပါပြီ။`, createdAt: item.date, read: false }, ...data.notifications] });
    audit(`Branch transfer completed for ${transfer.qty} units`);
  };
  const toggleShift = () => {
    const open = data.shifts.find((shift) => shift.status === "Open" && shift.cashier === currentUser.name);
    if (open) {
      setData({ ...data, shifts: data.shifts.map((shift) => shift.id === open.id ? { ...shift, status: "Closed", closedAt: new Date().toISOString(), closingCash: shift.openingCash } : shift) });
      audit(`Shift closed by ${currentUser.name}`);
    } else {
      setData({ ...data, shifts: [{ id: id("shift"), branchId: data.branches[0]?.id ?? "", cashier: currentUser.name, openedAt: new Date().toISOString(), openingCash: 100000, status: "Open" }, ...data.shifts] });
      audit(`Shift opened by ${currentUser.name}`);
    }
  };
  return (
    <section className="space-y-4">
      <div className="category-tabs"><button className={tab === "branches" ? "tab-active" : "tab"} onClick={() => setTab("branches")}>ဆိုင်ခွဲများ</button><button className={tab === "transfer" ? "tab-active" : "tab"} onClick={() => setTab("transfer")}>Stock Transfer</button><button className={tab === "shifts" ? "tab-active" : "tab"} onClick={() => setTab("shifts")}>Shift</button><button className={tab === "notifications" ? "tab-active" : "tab"} onClick={() => setTab("notifications")}>အသိပေးချက်</button></div>
      {tab === "branches" && <section className="grid gap-4 xl:grid-cols-[380px_1fr]"><Panel title={branchDraft.id ? "ဆိုင်ခွဲပြင်ဆင်ရန်" : "ဆိုင်ခွဲအသစ်"}><label><span className="field-label">ဆိုင်ခွဲအမည်</span><input className="field" value={branchDraft.name} onChange={(event) => setBranchDraft({ ...branchDraft, name: event.target.value })} placeholder="ဥပမာ - Golden Tap Yangon" /></label><label className="mt-2 block"><span className="field-label">ဆိုင်ခွဲကုဒ်</span><input className="field" value={branchDraft.code} onChange={(event) => setBranchDraft({ ...branchDraft, code: event.target.value })} placeholder="ဥပမာ - YGN-01" /></label><label className="mt-2 block"><span className="field-label">လိပ်စာ</span><input className="field" value={branchDraft.address} onChange={(event) => setBranchDraft({ ...branchDraft, address: event.target.value })} /></label><div className="mt-2 grid grid-cols-2 gap-2"><label><span className="field-label">ဆိုင်ခွဲငွေသား (ကျပ်)</span><input className="field" type="number" min={0} value={branchDraft.cash} onChange={(event) => setBranchDraft({ ...branchDraft, cash: Number(event.target.value) })} /></label><label><span className="field-label">အခြေအနေ</span><select className="field" value={branchDraft.status} onChange={(event) => setBranchDraft({ ...branchDraft, status: event.target.value as Branch["status"] })}><option value="Active">အသုံးပြုနိုင်</option><option value="Inactive">ပိတ်ထား</option></select></label></div><div className="mt-3 grid grid-cols-2 gap-2"><button className="primary-btn" onClick={saveBranch}><Save size={18} /> သိမ်းမည်</button><button className="secondary-btn" onClick={() => setBranchDraft(emptyBranch())}><X size={18} /> ရှင်းမည်</button></div></Panel><div className="grid content-start gap-3 md:grid-cols-2">{data.branches.map((branch) => <article key={branch.id} className="rounded-xl border border-white/10 bg-[#1E1E1E] p-5"><div className="flex justify-between"><Building2 className="text-[#FFC107]" /><span className={`stock-badge ${branch.status === "Active" ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"}`}>{branch.status === "Active" ? "အသုံးပြုနိုင်" : "ပိတ်ထား"}</span></div><h3 className="mt-4 text-xl font-semibold">{branch.name}</h3><p className="mt-1 text-sm text-[#B0B0B0]">{branch.code} · {branch.address}</p><p className="mt-5 text-sm text-[#B0B0B0]">ဆိုင်ခွဲငွေသား</p><p className="text-2xl font-semibold text-[#FFC107]">{mmk.format(branch.cash)}</p><div className="mt-4 flex gap-2 border-t border-white/10 pt-3"><button className="secondary-btn flex-1" onClick={() => setBranchDraft(branch)}><Pencil size={16} /> ပြင်မည်</button><button className="danger-btn flex-1" onClick={() => deleteBranch(branch)}><Trash2 size={16} /> ဖျက်မည်</button></div></article>)}</div></section>}
      {tab === "transfer" && <section className="grid gap-4 xl:grid-cols-[380px_1fr]"><Panel title="Branch Stock Transfer"><select className="field" value={transfer.fromBranchId} onChange={(e) => setTransfer({ ...transfer, fromBranchId: e.target.value })}>{data.branches.map((branch) => <option key={branch.id} value={branch.id}>မှ: {branch.name}</option>)}</select><select className="field mt-2" value={transfer.toBranchId} onChange={(e) => setTransfer({ ...transfer, toBranchId: e.target.value })}>{data.branches.map((branch) => <option key={branch.id} value={branch.id}>သို့: {branch.name}</option>)}</select><select className="field mt-2" value={transfer.productId} onChange={(e) => setTransfer({ ...transfer, productId: e.target.value })}>{data.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select><label className="mt-2 block"><span className="field-label">လွှဲပြောင်းမည့် ပစ္စည်းအရေအတွက် (ခု)</span><input className="field" type="number" min={1} placeholder="ဥပမာ - ၁၀" value={transfer.qty} onChange={(e) => setTransfer({ ...transfer, qty: Number(e.target.value) })} /></label><button className="primary-btn mt-3" onClick={completeTransfer}><Boxes size={18} /> လွှဲပြောင်းမည်</button></Panel><Panel title="Transfer History"><ResponsiveTable headers={["ရက်စွဲ", "မှ", "သို့", "ပစ္စည်း", "အရေအတွက်", "အခြေအနေ"]}>{data.branchTransfers.map((item) => <tr key={item.id}><td>{formatDateTime(item.date)}</td><td>{data.branches.find((b) => b.id === item.fromBranchId)?.code}</td><td>{data.branches.find((b) => b.id === item.toBranchId)?.code}</td><td>{data.products.find((p) => p.id === item.productId)?.name}</td><td>{item.qty}</td><td>{item.status}</td></tr>)}</ResponsiveTable></Panel></section>}
      {tab === "shifts" && <Panel title="Shift Management"><button className="primary-btn mb-4" onClick={toggleShift}><Clock3 size={18} /> {data.shifts.some((shift) => shift.status === "Open" && shift.cashier === currentUser.name) ? "Shift ပိတ်မည်" : "Shift ဖွင့်မည်"}</button><ResponsiveTable headers={["ငွေကိုင်", "ဆိုင်ခွဲ", "ဖွင့်ချိန်", "ပိတ်ချိန်", "ဖွင့်ငွေ", "အခြေအနေ"]}>{data.shifts.map((shift) => <tr key={shift.id}><td>{shift.cashier}</td><td>{data.branches.find((b) => b.id === shift.branchId)?.name}</td><td>{formatDateTime(shift.openedAt)}</td><td>{shift.closedAt ? formatDateTime(shift.closedAt) : "-"}</td><td>{mmk.format(shift.openingCash)}</td><td>{shift.status}</td></tr>)}</ResponsiveTable></Panel>}
      {tab === "notifications" && <Panel title="အသိပေးချက်များ"><div className="space-y-2">{data.notifications.map((item) => <button key={item.id} onClick={() => setData({ ...data, notifications: data.notifications.map((n) => n.id === item.id ? { ...n, read: true } : n) })} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left ${item.read ? "border-white/5 bg-white/[0.02]" : "border-[#FFC107]/30 bg-[#FFC107]/10"}`}><Bell className="mt-1 shrink-0 text-[#FFC107]" size={18} /><span><strong>{item.type}</strong><small className="mt-1 block text-[#B0B0B0]">{item.message} · {formatDateTime(item.createdAt)}</small></span></button>)}</div></Panel>}
    </section>
  );
}

function ProductsPage({ data, setData, audit }: { data: AppData; setData: (data: AppData) => void; audit: (message: string) => void }) {
  const [draft, setDraft] = useState<Product>({ ...sampleProducts[0], id: "", code: "", barcode: "", name: "", category: "Beer", purchasePrice: 0, sellingPrice: 0, stock: 0, minimumStock: 0, supplier: "", unit: "Bottle", status: "Active", image: sampleProducts[0].image });
  const save = () => {
    if (!draft.name) return;
    const product = { ...draft, id: draft.id || id("product"), code: draft.code || `ITEM-${data.products.length + 1}` };
    setData({ ...data, products: draft.id ? data.products.map((p) => p.id === draft.id ? product : p) : [product, ...data.products] });
    audit(`${draft.id ? "Updated" : "Added"} product ${product.name}`);
    setDraft({ ...draft, id: "", code: "", barcode: "", name: "", purchasePrice: 0, sellingPrice: 0, stock: 0, minimumStock: 0, supplier: "" });
  };
  const deleteProduct = (product: Product) => {
    const used = data.sales.some((sale) => sale.items.some((item) => item.id === product.id)) || data.ledger.some((item) => item.productId === product.id);
    if (used) {
      if (!window.confirm(`${product.name} တွင် အရောင်း/စတော့မှတ်တမ်းများ ရှိနေပါသည်။ စာရင်းမပျက်စေရန် ဖျက်မည့်အစား ပိတ်ထားမည်။ ဆက်လုပ်မလား။`)) return;
      setData({ ...data, products: data.products.map((item) => item.id === product.id ? { ...item, status: "Inactive" } : item) });
      audit(`Archived product ${product.name}`);
      return;
    }
    if (!window.confirm(`${product.name} ကို ဖျက်ရန် သေချာပါသလား။`)) return;
    setData({ ...data, products: data.products.filter((item) => item.id !== product.id) });
    audit(`Deleted product ${product.name}`);
  };
  const exportProducts = () => downloadFile("products.csv", toCsv(data.products.map((p) => ({ code: p.code, barcode: p.barcode, name: p.name, category: p.category, unit: p.unit, purchasePrice: p.purchasePrice, sellingPrice: p.sellingPrice, stock: p.stock, minimumStock: p.minimumStock, supplier: p.supplier, status: p.status }))), "text/csv");
  return (
    <section className="grid gap-4 xl:grid-cols-[420px_1fr]">
      <Panel title="ကုန်ပစ္စည်း စီမံခန့်ခွဲမှု">
        <div className="grid gap-2">
          <input className="field" placeholder="ပစ္စည်းအမည်" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-2"><input className="field" placeholder="ကုဒ်" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} /><input className="field" placeholder="Barcode" value={draft.barcode} onChange={(e) => setDraft({ ...draft, barcode: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2"><select className="field" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>{categories.map((c) => <option key={c} value={c}>{categoryLabels[c] ?? c}</option>)}</select><input className="field" placeholder="ယူနစ်" value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} /></div>
          <div className="grid gap-2 sm:grid-cols-2"><label><span className="field-label">ဝယ်ဈေး / ကုန်ကျစရိတ် (ကျပ်)</span><input className="field" type="number" min={0} placeholder="ဥပမာ - ၇၀၀" value={draft.purchasePrice} onChange={(e) => setDraft({ ...draft, purchasePrice: Number(e.target.value) })} /></label><label><span className="field-label">ဧည့်သည်ကို ရောင်းမည့်ဈေး (ကျပ်)</span><input className="field" type="number" min={0} placeholder="ဥပမာ - ၂၂၀၀" value={draft.sellingPrice} onChange={(e) => setDraft({ ...draft, sellingPrice: Number(e.target.value) })} /></label></div>
          <div className="grid gap-2 sm:grid-cols-2"><label><span className="field-label">လက်ရှိလက်ကျန်အရေအတွက် (ခု)</span><input className="field" type="number" min={0} placeholder="ဥပမာ - ၅၅" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })} /></label><label><span className="field-label">စတော့နည်းကြောင်း သတိပေးမည့်ပမာဏ (ခု)</span><input className="field" type="number" min={0} placeholder="ဥပမာ - ၁၈" value={draft.minimumStock} onChange={(e) => setDraft({ ...draft, minimumStock: Number(e.target.value) })} /></label></div>
          <input className="field" placeholder="Supplier" value={draft.supplier} onChange={(e) => setDraft({ ...draft, supplier: e.target.value })} />
          <label><span className="field-label">ရောင်းချနိုင်မှုအခြေအနေ</span><select className="field" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Product["status"] })}><option value="Active">အသုံးပြုနိုင်</option><option value="Inactive">ပိတ်ထား</option></select></label>
          <input className="field" placeholder="ပုံ URL" value={draft.image} onChange={(e) => setDraft({ ...draft, image: e.target.value })} />
          <button className="primary-btn" onClick={save}><PackagePlus size={18} /> သိမ်းမည်</button>
          <button className="secondary-btn" onClick={exportProducts}><Download size={18} /> CSV ထုတ်မည်</button>
        </div>
      </Panel>
      <Panel title="ကုန်ပစ္စည်းများ">
        <ResponsiveTable headers={["ပစ္စည်း", "အမျိုးအစား", "ဈေးနှုန်း", "စတော့", "Supplier", "လုပ်ဆောင်ချက်"]}>
          {data.products.map((p) => <tr key={p.id}><td>{p.name}<small>{p.code} · {p.status === "Active" ? "အသုံးပြုနိုင်" : "ပိတ်ထား"}</small></td><td>{categoryLabels[p.category] ?? p.category}</td><td>{mmk.format(p.sellingPrice)}</td><td><span className={p.stock <= p.minimumStock ? "text-red-300" : "text-green-300"}>{myNumber.format(p.stock)} {unitLabels[p.unit] ?? p.unit}</span></td><td>{p.supplier}</td><td><button className="text-[#FFC107]" onClick={() => setDraft(p)}>ပြင်မည်</button> · <button className="text-red-300" onClick={() => deleteProduct(p)}>ဖျက်မည်</button></td></tr>)}
        </ResponsiveTable>
      </Panel>
    </section>
  );
}

function InventoryPage({ data, setData, audit }: { data: AppData; setData: (data: AppData) => void; audit: (message: string) => void }) {
  const [productId, setProductId] = useState(data.products[0]?.id ?? "");
  const [type, setType] = useState<Ledger["type"]>("Stock In");
  const [qty, setQty] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
  const [reference, setReference] = useState("Manual adjustment");
  const [editingId, setEditingId] = useState("");
  const product = data.products.find((p) => p.id === productId);
  const manualLedgerTypes: Ledger["type"][] = ["Stock In", "Stock Out", "Damage/Loss", "Supplier Purchase", "Audit"];
  const reset = () => { setEditingId(""); setProductId(data.products[0]?.id ?? ""); setType("Stock In"); setQty(1); setUnitCost(0); setReference("Manual adjustment"); };
  const apply = () => {
    if (!product || qty <= 0) return;
    const signedQty = ["Stock Out", "Damage/Loss"].includes(type) ? -Math.abs(qty) : Math.abs(qty);
    const old = data.ledger.find((item) => item.id === editingId);
    let products = data.products.map((item) => old && item.id === old.productId ? { ...item, stock: item.stock - old.qty } : item);
    if (products.some((item) => item.stock < 0)) {
      window.alert("မူလစတော့အဝင်မှ ပစ္စည်းအချို့ ရောင်းချပြီးဖြစ်သောကြောင့် ဤစာရင်းကို ထိုပမာဏအောက် လျှော့မပြင်နိုင်ပါ။");
      return;
    }
    const target = products.find((item) => item.id === product.id);
    if (!target || target.stock + signedQty < 0) {
      window.alert("လက်ရှိစတော့ထက် အထွက်အရေအတွက် ပိုများနေပါသည်။");
      return;
    }
    products = products.map((item) => item.id === product.id ? { ...item, stock: item.stock + signedQty, purchasePrice: unitCost || item.purchasePrice } : item);
    const movement: Ledger = { id: editingId || id("ledger"), date: old?.date ?? new Date().toISOString(), productId: product.id, productName: product.name, type, qty: signedQty, unitCost: unitCost || product.purchasePrice, reference: reference.trim() || "Manual adjustment" };
    const ledger = editingId ? data.ledger.map((item) => item.id === editingId ? movement : item) : [movement, ...data.ledger];
    setData({ ...data, products, ledger });
    audit(`${editingId ? "Updated" : "Added"} inventory ${type} ${Math.abs(signedQty)} ${product.name}`);
    reset();
  };
  const editLedger = (item: Ledger) => {
    if (!manualLedgerTypes.includes(item.type)) return;
    setEditingId(item.id);
    setProductId(item.productId);
    setType(item.type);
    setQty(Math.abs(item.qty));
    setUnitCost(item.unitCost);
    setReference(item.reference);
  };
  const deleteLedger = (item: Ledger) => {
    if (!manualLedgerTypes.includes(item.type)) return;
    const target = data.products.find((product) => product.id === item.productId);
    if (!target || target.stock - item.qty < 0) {
      window.alert("ဤစာရင်းကိုဖျက်ပါက စတော့လက်ကျန် အနုတ်ဖြစ်နိုင်သောကြောင့် မဖျက်နိုင်ပါ။");
      return;
    }
    if (!window.confirm(`${item.productName} ၏ စတော့စာရင်းကို ဖျက်ရန် သေချာပါသလား။`)) return;
    setData({ ...data, products: data.products.map((product) => product.id === item.productId ? { ...product, stock: product.stock - item.qty } : product), ledger: data.ledger.filter((ledger) => ledger.id !== item.id) });
    audit(`Deleted inventory ledger ${item.id}`);
    if (editingId === item.id) reset();
  };
  return (
    <section className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <Panel title={editingId ? "စတော့စာရင်း ပြင်ဆင်ရန်" : "စတော့ အဝင်/အထွက်"}>
        <select className="field" value={productId} onChange={(e) => setProductId(e.target.value)}>{data.products.map((p) => <option value={p.id} key={p.id}>{p.name}</option>)}</select>
        <select className="field mt-2" value={type} onChange={(e) => setType(e.target.value as Ledger["type"])}>{manualLedgerTypes.map((m) => <option key={m} value={m}>{ledgerTypeLabels[m]}</option>)}</select>
        <div className="mt-2 grid gap-2 sm:grid-cols-2"><label><span className="field-label">စတော့ အဝင်/အထွက်အရေအတွက် (ခု)</span><input className="field" type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} placeholder="ဥပမာ - ၁၀" /></label><label><span className="field-label">တစ်ယူနစ် ကုန်ကျစရိတ် (ကျပ်)</span><input className="field" type="number" min={0} value={unitCost} onChange={(e) => setUnitCost(Number(e.target.value))} placeholder="ဥပမာ - ၂၁၀၀" /></label></div>
        <label className="mt-2 block"><span className="field-label">ကိုးကားချက် / အကြောင်းပြချက်</span><input className="field" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="ဥပမာ - Supplier invoice PO-001" /></label>
        <div className="mt-3 grid grid-cols-2 gap-2"><button className="primary-btn" onClick={apply}><Save size={18} /> {editingId ? "ပြင်ဆင်သိမ်းမည်" : "စာရင်းသွင်းမည်"}</button><button className="secondary-btn" onClick={reset}><X size={18} /> ရှင်းမည်</button></div>
      </Panel>
      <Panel title="စတော့ Ledger">
        <ResponsiveTable headers={["ရက်စွဲ", "ပစ္စည်း", "အမျိုးအစား", "အရေအတွက်", "ကုန်ကျစရိတ်", "ကိုးကားချက်", "လုပ်ဆောင်ချက်"]}>
          {data.ledger.map((item) => <tr key={item.id}><td>{formatDateTime(item.date)}</td><td>{item.productName}</td><td>{ledgerTypeLabels[item.type]}</td><td className={item.qty < 0 ? "text-red-300" : "text-green-300"}>{myNumber.format(item.qty)}</td><td>{mmk.format(item.unitCost)}</td><td>{item.reference}</td><td>{manualLedgerTypes.includes(item.type) ? <><button className="text-[#FFC107]" onClick={() => editLedger(item)}>ပြင်မည်</button> · <button className="text-red-300" onClick={() => deleteLedger(item)}>ဖျက်မည်</button></> : <span className="text-xs text-[#B0B0B0]">System record</span>}</td></tr>)}
        </ResponsiveTable>
      </Panel>
    </section>
  );
}

function SalesPage({ data, setData, setLastReceipt, audit }: { data: AppData; setData: (data: AppData) => void; setLastReceipt: (sale: Sale) => void; audit: (message: string) => void }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Sale | null>(null);
  const rows = data.sales.filter((s) => `${s.invoiceNo} ${s.customerName} ${s.tableNo} ${s.waiterName} ${s.paymentMethod}`.toLowerCase().includes(query.toLowerCase()));
  const mark = (sale: Sale, status: Sale["status"]) => {
    if (sale.status !== "Paid" || !["Refunded", "Voided"].includes(status)) return;
    const restoredProducts = data.products.map((product) => {
      const soldItem = sale.items.find((item) => item.id === product.id);
      return soldItem ? { ...product, stock: product.stock + soldItem.qty } : product;
    });
    const restoreLedger: Ledger[] = sale.items.map((item) => ({
      id: id("ledger"),
      date: new Date().toISOString(),
      productId: item.id,
      productName: item.name,
      type: "Refund Restore",
      qty: item.qty,
      unitCost: item.purchasePrice,
      reference: `${sale.invoiceNo}-${status}`
    }));
    const notification: NotificationItem = {
      id: id("notification"),
      type: status === "Refunded" ? "Refund" : "Void",
      message: `${sale.invoiceNo} ကို ${status === "Refunded" ? "ပြန်အမ်း" : "ဖျက်သိမ်း"}ပြီး stock ပြန်ထည့်ထားပါသည်။`,
      createdAt: new Date().toISOString(),
      read: false
    };
    setData({
      ...data,
      products: restoredProducts,
      ledger: [...restoreLedger, ...data.ledger],
      notifications: [notification, ...data.notifications],
      sales: data.sales.map((s) => s.id === sale.id ? { ...s, status } : s)
    });
    audit(`${sale.invoiceNo} marked ${status}`);
  };
  const saveSaleDetails = () => {
    if (!editing) return;
    setData({ ...data, sales: data.sales.map((sale) => sale.id === editing.id ? editing : sale) });
    audit(`Updated sale details ${editing.invoiceNo}`);
    setEditing(null);
  };
  const deleteSale = (sale: Sale) => {
    if (!window.confirm(`${sale.invoiceNo} ဘောင်ချာကို အပြီးဖျက်ရန် သေချာပါသလား။ ဤလုပ်ဆောင်ချက်ကို ပြန်ယူ၍မရပါ။`)) return;
    const restoreStock = sale.status === "Paid";
    const products = restoreStock ? data.products.map((product) => {
      const item = sale.items.find((soldItem) => soldItem.id === product.id);
      return item ? { ...product, stock: product.stock + item.qty } : product;
    }) : data.products;
    setData({
      ...data,
      products,
      sales: data.sales.filter((item) => item.id !== sale.id),
      ledger: data.ledger.filter((item) => !item.reference.startsWith(sale.invoiceNo)),
      notifications: [{ id: id("notification"), type: "System", message: `${sale.invoiceNo} ဘောင်ချာကို ဖျက်ခဲ့ပါသည်${restoreStock ? "။ Stock ပြန်ထည့်ပြီးပါပြီ" : ""}။`, createdAt: new Date().toISOString(), read: false }, ...data.notifications]
    });
    audit(`Deleted sale ${sale.invoiceNo}${restoreStock ? " and restored stock" : ""}`);
    if (editing?.id === sale.id) setEditing(null);
  };
  return (
    <section className="space-y-4">
      {editing && <Panel title={`${editing.invoiceNo} ဘောင်ချာအချက်အလက် ပြင်ဆင်ရန်`}>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <label><span className="field-label">ဧည့်သည်အမည်</span><input className="field" value={editing.customerName} onChange={(event) => setEditing({ ...editing, customerName: event.target.value })} /></label>
          <label><span className="field-label">စားပွဲနံပါတ်</span><input className="field" value={editing.tableNo} onChange={(event) => setEditing({ ...editing, tableNo: event.target.value })} /></label>
          <label><span className="field-label">တာဝန်ခံဝန်ထမ်း</span><input className="field" value={editing.waiterName} onChange={(event) => setEditing({ ...editing, waiterName: event.target.value })} /></label>
          <label><span className="field-label">ငွေပေးချေမှု</span><select className="field" value={editing.paymentMethod} onChange={(event) => setEditing({ ...editing, paymentMethod: event.target.value as PaymentMethod })}>{(["Cash", "KBZPay", "WavePay", "AYA Pay", "Credit", "Split"] as PaymentMethod[]).map((method) => <option key={method} value={method}>{paymentLabels[method]}</option>)}</select></label>
          <label><span className="field-label">လက်ခံငွေ (ကျပ်)</span><input className="field" type="number" min={0} value={editing.cashReceived} onChange={(event) => setEditing({ ...editing, cashReceived: Number(event.target.value) })} /></label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2"><button className="primary-btn" onClick={saveSaleDetails}><Save size={18} /> ပြင်ဆင်သိမ်းမည်</button><button className="secondary-btn" onClick={() => setEditing(null)}><X size={18} /> မလုပ်တော့ပါ</button></div>
      </Panel>}
      <Panel title="ဘောင်ချာစာရင်း">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="searchbox sm:max-w-md"><Search size={18} /><input placeholder="ဘောင်ချာ၊ စားပွဲ၊ ဧည့်သည်၊ ဝန်ထမ်း၊ ငွေပေးချေမှု" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          <button className="secondary-btn" onClick={() => downloadFile("sales.csv", toCsv(data.sales.map((s) => ({ invoiceNo: s.invoiceNo, date: s.date, amount: s.grandTotal, cost: s.cost, profit: s.profit, payment: s.paymentMethod, cashier: s.cashier, status: s.status }))), "text/csv")}><Download size={18} /> CSV</button>
        </div>
        <ResponsiveTable headers={["ဘောင်ချာ", "ရက်စွဲ", "စုစုပေါင်း", "ကုန်ကျ", "အမြတ်", "ငွေပေးချေမှု", "ငွေကိုင်", "လုပ်ဆောင်ချက်"]}>
          {rows.map((sale) => <tr key={sale.id}><td>{sale.invoiceNo}<small>စားပွဲ {sale.tableNo} · {saleStatusLabels[sale.status]}</small></td><td>{formatDateTime(sale.date)}</td><td>{mmk.format(sale.grandTotal)}</td><td>{mmk.format(sale.cost)}</td><td>{mmk.format(sale.profit)}</td><td>{paymentLabels[sale.paymentMethod]}</td><td>{sale.cashier}</td><td><div className="flex min-w-56 flex-wrap gap-x-3 gap-y-1"><button className="text-[#FFC107]" onClick={() => setLastReceipt(sale)}>ပြန်ပုံနှိပ်</button><button className="text-sky-300" onClick={() => setEditing(sale)}>ပြင်မည်</button>{sale.status === "Paid" && <><button className="text-amber-200" onClick={() => mark(sale, "Refunded")}>ပြန်အမ်း</button><button className="text-orange-300" onClick={() => mark(sale, "Voided")}>ဖျက်သိမ်း</button></>}<button className="text-red-300" onClick={() => deleteSale(sale)}>ဖျက်မည်</button></div></td></tr>)}
        </ResponsiveTable>
      </Panel>
    </section>
  );
}

function FinancePage({ data, setData, audit }: { data: AppData; setData: (data: AppData) => void; audit: (message: string) => void }) {
  const [type, setType] = useState<MoneyEntry["type"]>("Expense");
  const [category, setCategory] = useState(expenseCategories[0]);
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState("");
  const reset = () => { setType("Expense"); setCategory(expenseCategories[0]); setAmount(0); setNote(""); setEditingId(""); };
  const save = () => {
    if (amount <= 0) return;
    const old = data.money.find((item) => item.id === editingId);
    const entry: MoneyEntry = { id: editingId || id("money"), date: old?.date ?? new Date().toISOString(), category, amount, note, type };
    setData({ ...data, money: editingId ? data.money.map((item) => item.id === editingId ? entry : item) : [entry, ...data.money] });
    audit(`${editingId ? "Updated" : "Added"} ${type} ${category}`);
    reset();
  };
  const edit = (item: MoneyEntry) => { setEditingId(item.id); setType(item.type); setCategory(item.category); setAmount(item.amount); setNote(item.note); };
  const remove = (item: MoneyEntry) => {
    if (!window.confirm(`${item.type === "Expense" ? "အသုံးစရိတ်" : "ဝင်ငွေ"} ${mmk.format(item.amount)} ကို ဖျက်ရန် သေချာပါသလား။`)) return;
    setData({ ...data, money: data.money.filter((current) => current.id !== item.id) });
    audit(`Deleted ${item.type} ${item.category}`);
    if (editingId === item.id) reset();
  };
  return (
    <section className="grid gap-4 xl:grid-cols-[360px_1fr]">
      <Panel title={editingId ? "ငွေစာရင်း ပြင်ဆင်ရန်" : "အသုံးစရိတ် နှင့် အခြားဝင်ငွေ"}>
        <select className="field" value={type} onChange={(e) => { const next = e.target.value as MoneyEntry["type"]; setType(next); setCategory(next === "Expense" ? expenseCategories[0] : incomeCategories[0]); }}><option value="Expense">အသုံးစရိတ်</option><option value="Income">ဝင်ငွေ</option></select>
        <select className="field mt-2" value={category} onChange={(e) => setCategory(e.target.value)}>{(type === "Expense" ? expenseCategories : incomeCategories).map((c) => <option key={c} value={c}>{type === "Expense" ? expenseCategoryLabels[c] : incomeCategoryLabels[c]}</option>)}</select>
        <label className="mt-2 block"><span className="field-label">{type === "Expense" ? "အသုံးစရိတ်ပမာဏ" : "ဝင်ငွေပမာဏ"} (ကျပ်)</span><input className="field" type="number" min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="ဥပမာ - ၃၅၀၀၀" /></label>
        <input className="field mt-2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="မှတ်ချက်" />
        <div className="mt-3 grid grid-cols-2 gap-2"><button className="primary-btn" onClick={save}><Save size={18} /> သိမ်းမည်</button><button className="secondary-btn" onClick={reset}><X size={18} /> ရှင်းမည်</button></div>
      </Panel>
      <Panel title="ငွေစာရင်း Ledger">
        <ResponsiveTable headers={["ရက်စွဲ", "အမျိုးအစား", "ခေါင်းစဉ်", "ငွေပမာဏ", "မှတ်ချက်", "လုပ်ဆောင်ချက်"]}>
          {data.money.map((m) => <tr key={m.id}><td>{formatDateTime(m.date)}</td><td>{moneyTypeLabels[m.type]}</td><td>{m.type === "Expense" ? expenseCategoryLabels[m.category] : incomeCategoryLabels[m.category]}</td><td>{mmk.format(m.amount)}</td><td>{m.note}</td><td><button className="text-[#FFC107]" onClick={() => edit(m)}>ပြင်မည်</button> · <button className="text-red-300" onClick={() => remove(m)}>ဖျက်မည်</button></td></tr>)}
        </ResponsiveTable>
      </Panel>
    </section>
  );
}

function ClosingPage({ data, cashier }: { data: AppData; cashier: User }) {
  const metrics = useMetrics(data);
  const [opening, setOpening] = useState(100000);
  const [actual, setActual] = useState(metrics.expectedCash + opening);
  const expected = opening + metrics.cashBalance - metrics.todayExpense;
  return (
    <Panel title="နေ့စဉ်ပိတ်စာရင်း">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <NumberField label="ဖွင့်ငွေ" value={opening} setValue={setOpening} />
        <Metric title="ငွေသားရောင်းအား" value={mmk.format(metrics.cashBalance)} icon={<Wallet />} />
        <Metric title="Digital ရောင်းအား" value={mmk.format(metrics.digitalBalance)} icon={<CreditCard />} />
        <Metric title="အသုံးစရိတ်" value={mmk.format(metrics.todayExpense)} icon={<Receipt />} tone="red" />
        <Metric title="ရှိသင့်သောငွေသား" value={mmk.format(expected)} icon={<CalendarCheck />} />
        <NumberField label="တကယ်ရှိသောငွေသား" value={actual} setValue={setActual} />
        <Metric title="ကွာခြားချက်" value={mmk.format(actual - expected)} icon={<BarChart3 />} tone={actual - expected < 0 ? "red" : "green"} />
        <Metric title="ငွေကိုင်" value={cashier.name} icon={<Users />} />
      </div>
      <button className="secondary-btn mt-4" onClick={() => window.print()}><Printer size={18} /> ပိတ်စာရင်းပုံနှိပ်</button>
    </Panel>
  );
}

function ReportsPage({ data }: { data: AppData }) {
  const metrics = useMetrics(data);
  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="အရောင်းအစီရင်ခံစာ" value={mmk.format(metrics.monthSales)} icon={<Receipt />} />
        <Metric title="အမြတ်အစီရင်ခံစာ" value={mmk.format(metrics.monthProfit)} icon={<BarChart3 />} tone="green" />
        <Metric title="အသုံးစရိတ်အစီရင်ခံစာ" value={mmk.format(data.money.filter((m) => m.type === "Expense").reduce((s, m) => s + m.amount, 0))} icon={<Wallet />} tone="red" />
        <Metric title="စတော့တန်ဖိုး" value={mmk.format(data.products.reduce((s, p) => s + p.stock * p.purchasePrice, 0))} icon={<Boxes />} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="လစဉ်အရောင်း Chart"><Bars rows={monthlyRows(data.sales)} /></Panel>
        <Panel title="အမျိုးအစားအလိုက် စွမ်းဆောင်ရည်"><Donut rows={categoryRows(data.sales)} /></Panel>
      </div>
      <Panel title="Export Format များ">
        <div className="flex flex-wrap gap-2">
          <button className="secondary-btn" onClick={() => downloadFile("golden-tap-backup.json", JSON.stringify(data, null, 2))}><DatabaseBackup size={18} /> JSON</button>
          <button className="secondary-btn" onClick={() => downloadFile("sales-report.csv", toCsv(data.sales.map((s) => ({ invoiceNo: s.invoiceNo, date: s.date, amount: s.grandTotal, profit: s.profit }))), "text/csv")}><Download size={18} /> CSV</button>
          <button className="secondary-btn" onClick={() => window.print()}><Printer size={18} /> PDF ပုံနှိပ်</button>
        </div>
      </Panel>
    </section>
  );
}

function UsersPage({ data, setData, currentUser, audit }: { data: AppData; setData: (data: AppData) => void; currentUser: User; audit: (message: string) => void }) {
  const blankUser = (): User => ({ id: "", name: "", role: "Cashier", pin: "", status: "Active", permissions: [...permissions.Cashier] });
  const [draft, setDraft] = useState<User>(blankUser);
  const save = () => {
    const name = draft.name.trim();
    if (!name || !/^\d{4,8}$/.test(draft.pin)) {
      window.alert("အသုံးပြုသူအမည်နှင့် ဂဏန်း ၄ လုံးမှ ၈ လုံးအထိ PIN ထည့်ပါ။");
      return;
    }
    if (data.users.some((user) => user.id !== draft.id && user.name.toLowerCase() === name.toLowerCase())) {
      window.alert("အသုံးပြုသူအမည်တူ ရှိပြီးသားဖြစ်သည်။");
      return;
    }
    const saved: User = { ...draft, id: draft.id || id("user"), name, permissions: draft.permissions?.length ? draft.permissions : [...permissions[draft.role]] };
    setData({ ...data, users: draft.id ? data.users.map((user) => user.id === saved.id ? saved : user) : [...data.users, saved] });
    audit(`${draft.id ? "Updated" : "Added"} user ${saved.name} with custom RBAC`);
    setDraft(blankUser());
  };
  const remove = (user: User) => {
    if (user.id === currentUser.id) {
      window.alert("လက်ရှိဝင်ထားသော မိမိအကောင့်ကို ဖျက်၍မရပါ။");
      return;
    }
    const activeAdmins = data.users.filter((item) => item.role === "Admin" && item.status === "Active");
    if (user.role === "Admin" && activeAdmins.length <= 1) {
      window.alert("နောက်ဆုံး Active Admin အကောင့်ကို ဖျက်၍မရပါ။");
      return;
    }
    if (!window.confirm(`${user.name} အကောင့်ကို အပြီးဖျက်ရန် သေချာပါသလား။`)) return;
    setData({ ...data, users: data.users.filter((item) => item.id !== user.id) });
    audit(`Deleted user ${user.name}`);
    if (draft.id === user.id) setDraft(blankUser());
  };
  const togglePermission = (page: PageKey) => {
    const current = draft.permissions ?? permissions[draft.role];
    setDraft({ ...draft, permissions: current.includes(page) ? current.filter((item) => item !== page) : [...current, page] });
  };
  return (
    <section className="grid gap-4 xl:grid-cols-[440px_1fr]">
      <Panel title={draft.id ? "အသုံးပြုသူပြင်ဆင်ရန်" : "အသုံးပြုသူအသစ်"}>
        <label><span className="field-label">အသုံးပြုသူအမည်</span><input className="field" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="ဥပမာ - Mg Mg Cashier" /></label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label><span className="field-label">အခန်းကဏ္ဍ</span><select className="field" value={draft.role} onChange={(event) => { const role = event.target.value as Role; setDraft({ ...draft, role, permissions: [...permissions[role]] }); }}>{(Object.keys(roleLabels) as Role[]).map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></label>
          <label><span className="field-label">အခြေအနေ</span><select className="field" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as User["status"] })}><option value="Active">အသုံးပြုနိုင်</option><option value="Locked">ပိတ်ထား</option></select></label>
        </div>
        <label className="mt-2 block"><span className="field-label">Login PIN (ဂဏန်း ၄-၈ လုံး)</span><input className="field" type="password" inputMode="numeric" value={draft.pin} onChange={(event) => setDraft({ ...draft, pin: event.target.value.replace(/\D/g, "").slice(0, 8) })} placeholder="PIN အသစ်ထည့်ပါ" /></label>
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="mb-3 flex items-center justify-between gap-2"><div><p className="font-medium">စာမျက်နှာခွင့်ပြုချက်</p><p className="text-xs text-[#B0B0B0]">အသုံးပြုသူတစ်ဦးချင်းစီအတွက် menu access ရွေးပါ</p></div><button className="text-xs text-[#FFC107]" onClick={() => setDraft({ ...draft, permissions: [...permissions[draft.role]] })}>Role မူလအတိုင်း</button></div>
          <div className="grid gap-2 sm:grid-cols-2">
            {navItems.map((item) => {
              const checked = (draft.permissions ?? permissions[draft.role]).includes(item.key);
              return <label key={item.key} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${checked ? "border-[#FFC107]/40 bg-[#FFC107]/10 text-white" : "border-white/10 text-[#B0B0B0]"}`}><input type="checkbox" checked={checked} onChange={() => togglePermission(item.key)} className="h-4 w-4 accent-[#FFC107]" />{item.label}</label>;
            })}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2"><button className="primary-btn" onClick={save}><Save size={18} /> {draft.id ? "ပြင်ဆင်သိမ်းမည်" : "အသုံးပြုသူထည့်မည်"}</button><button className="secondary-btn" onClick={() => setDraft(blankUser())}><X size={18} /> ရှင်းမည်</button></div>
      </Panel>
      <Panel title="အသုံးပြုသူ စီမံခန့်ခွဲမှု နှင့် RBAC">
        <ResponsiveTable headers={["အမည်", "အခန်းကဏ္ဍ", "အခြေအနေ", "ခွင့်ပြုချက်", "လုပ်ဆောင်ချက်"]}>
          {data.users.map((user) => <tr key={user.id}><td>{user.name}<small>PIN: {"•".repeat(user.pin.length)}</small></td><td>{roleLabels[user.role]}</td><td><span className={`stock-badge ${user.status === "Active" ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"}`}>{user.status === "Active" ? "အသုံးပြုနိုင်" : "ပိတ်ထား"}</span></td><td className="max-w-md">{userPermissions(user).map((page) => navItems.find((item) => item.key === page)?.label ?? page).join(", ") || "ခွင့်ပြုချက်မရှိ"}</td><td><div className="flex gap-3"><button className="text-[#FFC107]" onClick={() => setDraft({ ...user, permissions: [...userPermissions(user)] })}>ပြင်မည်</button><button className="text-red-300" onClick={() => remove(user)}>ဖျက်မည်</button></div></td></tr>)}
        </ResponsiveTable>
      </Panel>
    </section>
  );
}

function SettingsPage({ data, setData, audit }: { data: AppData; setData: (data: AppData) => void; audit: (message: string) => void }) {
  const [settings, setSettings] = useState(data.settings);
  const save = () => { setData({ ...data, settings }); audit("ဆိုင်ဆက်တင်များ ပြင်ဆင်ပြီးပါပြီ"); };
  const restore = (file?: File) => {
    if (!file) return;
    file.text().then((text) => {
      const parsed = JSON.parse(text) as AppData;
      setData(parsed);
      audit("Restored backup file");
    });
  };
  return (
    <section className="grid gap-4 xl:grid-cols-[480px_1fr]">
      <Panel title="ဆိုင်အချက်အလက် နှင့် ဘောင်ချာဆက်တင်">
        <div className="grid gap-2">
          <input className="field" value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} />
          <input className="field" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
          <input className="field" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
          <input className="field" value={settings.footer} onChange={(e) => setSettings({ ...settings, footer: e.target.value })} />
          <div className="grid gap-2 sm:grid-cols-3"><label><span className="field-label">အခွန်နှုန်း (%)</span><input className="field" type="number" min={0} value={settings.taxRate} onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })} placeholder="ဥပမာ - ၅" /></label><label><span className="field-label">ဝန်ဆောင်ခနှုန်း (%)</span><input className="field" type="number" min={0} value={settings.serviceRate} onChange={(e) => setSettings({ ...settings, serviceRate: Number(e.target.value) })} placeholder="ဥပမာ - ၃" /></label><label><span className="field-label">ဘောင်ချာစာရွက်အကျယ်</span><select className="field" value={settings.printerWidth} onChange={(e) => setSettings({ ...settings, printerWidth: e.target.value as "58mm" | "80mm" })}><option>58mm</option><option>80mm</option></select></label></div>
          <button className="primary-btn" onClick={save}><Settings size={18} /> ဆက်တင်သိမ်းမည်</button>
        </div>
      </Panel>
      <Panel title="Backup, Restore နှင့် Audit Log">
        <div className="mb-4 flex flex-wrap gap-2">
          <button className="secondary-btn" onClick={() => downloadFile("golden-tap-backup.json", JSON.stringify(data, null, 2))}><Download size={18} /> JSON Backup</button>
          <label className="secondary-btn cursor-pointer"><Upload size={18} /> JSON Restore<input className="hidden" type="file" accept="application/json" onChange={(e) => restore(e.target.files?.[0])} /></label>
        </div>
        <div className="max-h-80 space-y-2 overflow-auto">{data.auditLogs.map((log, index) => <p key={index} className="rounded-lg bg-white/[0.03] px-3 py-2 text-sm text-[#B0B0B0]">{log}</p>)}</div>
      </Panel>
    </section>
  );
}

function ReceiptModal({ sale, settings, onClose }: { sale: Sale; settings: ShopSettings; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-auto rounded-xl border border-white/10 bg-[#1E1E1E] p-4">
        <div className="mb-3 flex justify-between print:hidden"><button className="secondary-btn" onClick={() => window.print()}><Printer size={18} /> ဘောင်ချာပုံနှိပ်</button><button className="icon-btn" onClick={onClose}><X /></button></div>
        <div id="receipt" className={`receipt ${settings.printerWidth === "58mm" ? "receipt-58" : "receipt-80"}`}>
          <div className="text-center"><div className="receipt-logo">GT</div><h2>{settings.name}</h2><p>{settings.address}</p><p>{settings.phone}</p></div>
          <hr /><p>ဘောင်ချာ: {sale.invoiceNo}</p><p>ရက်စွဲ: {formatDateTime(sale.date)}</p><p>စားပွဲ: {sale.tableNo} · ဝန်ထမ်း: {sale.waiterName}</p>
          <hr />
          <table><tbody>{sale.items.map((item) => <tr key={item.id}><td>{item.name}<br /><small>{item.qty} x {item.sellingPrice}</small></td><td>{mmk.format(item.qty * item.sellingPrice)}</td></tr>)}</tbody></table>
          <hr />
          <div className="receipt-line"><span>စုစုပေါင်း</span><span>{mmk.format(sale.subtotal)}</span></div>
          <div className="receipt-line"><span>လျှော့ဈေး</span><span>{mmk.format(sale.discount)}</span></div>
          <div className="receipt-line"><span>အခွန်</span><span>{mmk.format(sale.tax)}</span></div>
          <div className="receipt-line"><span>ဝန်ဆောင်ခ</span><span>{mmk.format(sale.service)}</span></div>
          <div className="receipt-line total"><span>ကျသင့်ငွေ</span><span>{mmk.format(sale.grandTotal)}</span></div>
          <div className="receipt-line"><span>ငွေပေးချေမှု</span><span>{paymentLabels[sale.paymentMethod]}</span></div>
          <div className="receipt-line"><span>လက်ခံငွေ</span><span>{mmk.format(sale.cashReceived)}</span></div>
          <div className="receipt-line"><span>ပြန်အမ်းငွေ</span><span>{mmk.format(Math.max(0, sale.cashReceived - sale.grandTotal))}</span></div>
          <hr /><p className="text-center">{settings.footer}</p>
        </div>
      </div>
    </div>
  );
}

function Metric({ title, value, icon, tone = "amber" }: { title: string; value: string; icon: ReactNode; tone?: "amber" | "green" | "red" }) {
  const toneClass = tone === "green" ? "text-[#4CAF50]" : tone === "red" ? "text-[#F44336]" : "text-[#FFC107]";
  return <div className="metric"><div><p>{title}</p><h3>{value}</h3></div><div className={toneClass}>{icon}</div></div>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-xl border border-white/10 bg-[#1E1E1E] p-4 shadow-xl shadow-black/20"><h3 className="mb-4 text-lg font-semibold">{title}</h3>{children}</section>;
}

function ResponsiveTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <div className="overflow-x-auto"><table className="data-table"><thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}

function NumberField({ label, value, setValue }: { label: string; value: number; setValue: (value: number) => void }) {
  return <div className="metric"><label className="w-full"><span className="field-label">{label} (ကျပ်)</span><input className="field" type="number" min={0} value={value} onChange={(e) => setValue(Number(e.target.value))} placeholder="ငွေပမာဏထည့်ပါ" /></label></div>;
}

function Totals({ totals, cashReceived }: { totals: ReturnType<typeof calcTotals>; cashReceived: number }) {
  return <div className="space-y-1 rounded-xl bg-black/25 p-3 text-sm"><Line label="စုစုပေါင်း" value={totals.subtotal} /><Line label="လျှော့ဈေး" value={totals.discount} /><Line label="အခွန်" value={totals.tax} /><Line label="ဝန်ဆောင်ခ" value={totals.service} /><Line label="ကျသင့်ငွေ" value={totals.grandTotal} strong /><Line label="ပြန်အမ်းငွေ" value={Math.max(0, cashReceived - totals.grandTotal)} /></div>;
}

function Line({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return <div className={`flex justify-between ${strong ? "text-lg font-semibold text-[#FFC107]" : "text-[#B0B0B0]"}`}><span>{label}</span><span>{mmk.format(value)}</span></div>;
}

function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return <div className="flex h-60 items-end gap-2">{rows.map((r) => <div key={r.label} className="flex min-w-0 flex-1 flex-col items-center gap-2"><div className="w-full rounded-t bg-[#FFC107]" style={{ height: `${Math.max(4, (r.value / max) * 210)}px` }} /><span className="w-full truncate text-center text-xs text-[#B0B0B0]">{r.label}</span></div>)}</div>;
}

function Donut({ rows }: { rows: { label: string; value: number }[] }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;
  return <div className="grid gap-4 sm:grid-cols-[180px_1fr]"><div className="grid h-44 w-44 place-items-center rounded-full border-[28px] border-[#FFC107] bg-black/20 text-center"><span className="text-lg font-semibold">{mmk.format(total)}</span></div><Ranked rows={rows.map((r) => ({ label: r.label, value: `${Math.round((r.value / total) * 100)}%` }))} /></div>;
}

function Ranked({ rows, empty = "No data" }: { rows: { label: string; value: string }[]; empty?: string }) {
  if (!rows.length) return <p className="text-sm text-[#B0B0B0]">{empty}</p>;
  return <div className="space-y-2">{rows.map((row) => <div key={row.label} className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2"><span className="truncate">{row.label}</span><span className="shrink-0 text-sm text-[#FFC107]">{row.value}</span></div>)}</div>;
}

function calcTotals(cart: CartItem[], taxRate: number, serviceRate: number, discountMode: "MMK" | "%", discountValue: number) {
  const subtotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.qty, 0);
  const cost = cart.reduce((sum, item) => sum + item.purchasePrice * item.qty, 0);
  const discount = discountMode === "%" ? subtotal * (discountValue / 100) : discountValue;
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * (taxRate / 100);
  const service = taxable * (serviceRate / 100);
  return { subtotal, cost, discount, tax, service, grandTotal: taxable + tax + service };
}

function useMetrics(data: AppData) {
  const today = todayKey();
  const month = today.slice(0, 7);
  const paid = data.sales.filter((s) => s.status === "Paid");
  const todaySales = paid.filter((s) => s.date.startsWith(today));
  const monthSales = paid.filter((s) => s.date.startsWith(month));
  const todayExpense = data.money.filter((m) => m.type === "Expense" && m.date.startsWith(today)).reduce((sum, m) => sum + m.amount, 0);
  const cashBalance = todaySales.filter((s) => s.paymentMethod === "Cash").reduce((sum, s) => sum + s.grandTotal, 0);
  const digitalBalance = todaySales.filter((s) => s.paymentMethod !== "Cash" && s.paymentMethod !== "Credit").reduce((sum, s) => sum + s.grandTotal, 0);
  return {
    todaySales: todaySales.reduce((sum, s) => sum + s.grandTotal, 0),
    todayProfit: todaySales.reduce((sum, s) => sum + s.profit, 0),
    todayExpense,
    monthSales: monthSales.reduce((sum, s) => sum + s.grandTotal, 0),
    monthProfit: monthSales.reduce((sum, s) => sum + s.profit, 0),
    cashBalance,
    digitalBalance,
    expectedCash: cashBalance
  };
}

function dailyRows(sales: Sale[]) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(5, 10);
    return { label: key, value: sales.filter((s) => s.status === "Paid" && s.date.slice(5, 10) === key).reduce((sum, s) => sum + s.grandTotal, 0) };
  });
}

function monthlyRows(sales: Sale[]) {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    const key = date.toISOString().slice(0, 7);
    return { label: key.slice(5), value: sales.filter((s) => s.status === "Paid" && s.date.startsWith(key)).reduce((sum, s) => sum + s.grandTotal, 0) };
  });
}

function paymentRows(sales: Sale[]) {
  return (["Cash", "KBZPay", "WavePay", "AYA Pay", "Credit", "Split"] as PaymentMethod[]).map((method) => ({ label: paymentLabels[method], value: sales.filter((s) => s.paymentMethod === method && s.status === "Paid").reduce((sum, s) => sum + s.grandTotal, 0) }));
}

function categoryRows(sales: Sale[]) {
  return categories.map((category) => ({ label: categoryLabels[category] ?? category, value: sales.flatMap((s) => s.status === "Paid" ? s.items : []).filter((i) => i.category === category).reduce((sum, i) => sum + i.sellingPrice * i.qty, 0) }));
}

function aggregateProductSales(sales: Sale[]) {
  const map = new Map<string, { name: string; qty: number }>();
  sales.filter((s) => s.status === "Paid").flatMap((s) => s.items).forEach((item) => map.set(item.id, { name: item.name, qty: (map.get(item.id)?.qty ?? 0) + item.qty }));
  return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 6);
}

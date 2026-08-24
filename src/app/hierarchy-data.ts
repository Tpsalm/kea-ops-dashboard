// Hierarchical data model for KEA Operations Dashboard
// TSR → Supervisor → Merchandiser → Store → Products
// TSR → VSR → Route/Coverage Area

export type Role = "VSR" | "TSR" | "Supervisor" | "Merchandiser";
export type Status = "Active" | "On route" | "Needs review" | "Inactive";

export interface Staff {
  id: string;
  name: string;
  role: Role;
  region: string;
  state: string;
  lga: string;
  territory: string;
  route: string;
  status: Status;
  visits: number;
  completion: number;
  lat: number;
  lng: number;
  clientId?: string;
  photos?: string[];
  // Hierarchy links
  parentId?: string;  // TSR for Supervisor, Supervisor for Merchandiser
  childrenIds?: string[];
}

export interface Store {
  id: string;
  name: string;
  address: string;
  region: string;
  state: string;
  lga: string;
  territory: string;
  lat: number;
  lng: number;
  merchandiserId: string;
  supervisorId: string;
  tsrId: string;
  clientId: string;
  status: "Healthy" | "Needs review";
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  storeId: string;
  availability: "In stock" | "Low stock" | "Out of stock";
  quantity?: number;
  lastUpdated: string;
  merchandiserId: string;
}

export interface Activity {
  id: string;
  staffId: string;
  staffName: string;
  role: Role;
  storeId?: string;
  storeName?: string;
  type: "Store visit" | "Merchandising" | "Product check" | "Route completion" | "Evidence upload";
  date: string;
  time: string;
  lat?: number;
  lng?: number;
  notes: string;
  photos?: string[];
  completion: number;
}

export interface Client {
  id: string;
  name: string;
  sector: string;
  stores: number;
  completion: string;
  status: string;
}

// TSR Data
export const tsrs: Staff[] = [
  {
    id: "KEA-TSR-001",
    name: "Abubakar Hassan",
    role: "TSR",
    region: "Lagos",
    state: "Lagos",
    lga: "Ikeja",
    territory: "Lagos West",
    route: "4 teams",
    status: "Active",
    visits: 32,
    completion: 95,
    lat: 6.5049,
    lng: 3.3612,
    clientId: "client-a",
    childrenIds: ["KEA-SUP-001", "KEA-SUP-002"],
  },
  {
    id: "KEA-TSR-002",
    name: "Yusuf Abimbola Rasheed",
    role: "TSR",
    region: "Ogun",
    state: "Ogun",
    lga: "Abeokuta North",
    territory: "Abeokuta",
    route: "6 teams",
    status: "Active",
    visits: 30,
    completion: 92,
    lat: 7.156,
    lng: 3.371,
    clientId: "client-a",
    childrenIds: ["KEA-SUP-003", "KEA-VSR-003", "KEA-VSR-004"],
  },
];

// Supervisor Data
export const supervisors: Staff[] = [
  {
    id: "KEA-SUP-001",
    name: "Oluchukwu Onyeike",
    role: "Supervisor",
    region: "Lagos",
    state: "Lagos",
    lga: "Lagos Mainland",
    territory: "Lagos Central",
    route: "8 stores",
    status: "Active",
    visits: 29,
    completion: 88,
    lat: 6.6108,
    lng: 3.3605,
    clientId: "client-a",
    parentId: "KEA-TSR-001",
    childrenIds: ["KEA-MER-001", "KEA-MER-004"],
  },
  {
    id: "KEA-SUP-002",
    name: "Moses Akindiran",
    role: "Supervisor",
    region: "Lagos",
    state: "Lagos",
    lga: "Eti-Osa",
    territory: "Lagos East",
    route: "11 stores",
    status: "Active",
    visits: 27,
    completion: 89,
    lat: 6.455,
    lng: 3.545,
    clientId: "client-b",
    parentId: "KEA-TSR-001",
    childrenIds: ["KEA-MER-002", "KEA-MER-005"],
  },
  {
    id: "KEA-SUP-003",
    name: "Michael Olayiwola",
    role: "Supervisor",
    region: "Ogun",
    state: "Ogun",
    lga: "Ijebu Ode",
    territory: "Ijebu",
    route: "5 stores",
    status: "Active",
    visits: 24,
    completion: 82,
    lat: 6.83,
    lng: 3.9265,
    clientId: "client-b",
    parentId: "KEA-TSR-002",
    childrenIds: ["KEA-MER-003"],
  },
];

// Merchandiser Data
export const merchandisers: Staff[] = [
  {
    id: "KEA-MER-001",
    name: "Maria Uchechukwu",
    role: "Merchandiser",
    region: "Lagos",
    state: "Lagos",
    lga: "Eti-Osa",
    territory: "Lagos Island",
    route: "VI Retail",
    status: "Active",
    visits: 34,
    completion: 97,
    lat: 6.4281,
    lng: 3.4219,
    clientId: "client-a",
    parentId: "KEA-SUP-001",
    photos: ["/samples/photo1.jpg", "/samples/photo2.jpg"],
  },
  {
    id: "KEA-MER-002",
    name: "Abiola Felicia Omowuni",
    role: "Merchandiser",
    region: "Lagos",
    state: "Lagos",
    lga: "Lagos Island",
    territory: "Lagos Island",
    route: "Marina Retail",
    status: "Active",
    visits: 25,
    completion: 84,
    lat: 6.4381,
    lng: 3.4319,
    clientId: "client-b",
    parentId: "KEA-SUP-002",
    photos: ["/samples/photo3.jpg"],
  },
  {
    id: "KEA-MER-003",
    name: "Ologbonori Toyosi",
    role: "Merchandiser",
    region: "Ogun",
    state: "Ogun",
    lga: "Ijebu Ode",
    territory: "Ijebu",
    route: "Ijebu Retail",
    status: "On route",
    visits: 26,
    completion: 86,
    lat: 6.82,
    lng: 3.9165,
    clientId: "client-b",
    parentId: "KEA-SUP-003",
    photos: ["/samples/photo4.jpg"],
  },
  {
    id: "KEA-MER-004",
    name: "Jonathan Okena",
    role: "Merchandiser",
    region: "Oyo",
    state: "Oyo",
    lga: "Ibadan North",
    territory: "Ibadan",
    route: "Ring Road",
    status: "Active",
    visits: 30,
    completion: 93,
    lat: 7.3776,
    lng: 3.947,
    clientId: "client-a",
    parentId: "KEA-SUP-001",
    photos: ["/samples/photo5.jpg", "/samples/photo6.jpg"],
  },
  {
    id: "KEA-MER-005",
    name: "Arorundade Adewale",
    role: "Merchandiser",
    region: "Oyo",
    state: "Oyo",
    lga: "Ibadan North",
    territory: "Ibadan",
    route: "Dugbe Retail",
    status: "Active",
    visits: 33,
    completion: 96,
    lat: 7.3866,
    lng: 3.956,
    clientId: "client-a",
    parentId: "KEA-SUP-002",
    photos: ["/samples/photo7.jpg"],
  },
];

// VSR Data
export const vsrs: Staff[] = [
  {
    id: "KEA-VSR-001",
    name: "Shittu Akinsanya",
    role: "VSR",
    region: "Lagos",
    state: "Lagos",
    lga: "Ikeja",
    territory: "Lagos Central",
    route: "Ikeja North",
    status: "On route",
    visits: 31,
    completion: 94,
    lat: 6.6018,
    lng: 3.3515,
    clientId: "client-a",
    parentId: "KEA-TSR-001",
    photos: ["/samples/vsr1.jpg"],
  },
  {
    id: "KEA-VSR-002",
    name: "Abel Nduka",
    role: "VSR",
    region: "Lagos",
    state: "Lagos",
    lga: "Surulere",
    territory: "Lagos West",
    route: "Surulere A2",
    status: "Active",
    visits: 28,
    completion: 91,
    lat: 6.4969,
    lng: 3.3532,
    clientId: "client-b",
    parentId: "KEA-TSR-001",
    photos: ["/samples/vsr2.jpg"],
  },
  {
    id: "KEA-VSR-003",
    name: "Paul Olakonipekun",
    role: "VSR",
    region: "Ogun",
    state: "Ogun",
    lga: "Abeokuta North",
    territory: "Abeokuta",
    route: "ABK North",
    status: "Needs review",
    visits: 18,
    completion: 63,
    lat: 7.1475,
    lng: 3.3619,
    clientId: "client-a",
    parentId: "KEA-TSR-002",
    photos: ["/samples/vsr3.jpg"],
  },
  {
    id: "KEA-VSR-004",
    name: "Timothy Ogunmokun",
    role: "VSR",
    region: "Ogun",
    state: "Ogun",
    lga: "Abeokuta South",
    territory: "Abeokuta",
    route: "ABK South",
    status: "Inactive",
    visits: 12,
    completion: 48,
    lat: 7.1385,
    lng: 3.3529,
    clientId: "client-a",
    parentId: "KEA-TSR-002",
    photos: ["/samples/vsr4.jpg"],
  },
  {
    id: "KEA-VSR-005",
    name: "Ikechukwu Maduora",
    role: "VSR",
    region: "Delta",
    state: "Delta",
    lga: "Oshimili South",
    territory: "Asaba",
    route: "Asaba Core",
    status: "Needs review",
    visits: 16,
    completion: 59,
    lat: 6.1982,
    lng: 6.7319,
    clientId: "client-b",
    photos: ["/samples/vsr5.jpg"],
  },
];

// All staff combined
export const allStaff: Staff[] = [...tsrs, ...supervisors, ...merchandisers, ...vsrs];

// Store Data
export const stores: Store[] = [
  {
    id: "STORE-001",
    name: "Ikeja North Hub",
    address: "15 Obafemi Awolowo Way, Ikeja",
    region: "Lagos",
    state: "Lagos",
    lga: "Ikeja",
    territory: "Lagos Central",
    lat: 6.6018,
    lng: 3.3515,
    merchandiserId: "KEA-MER-001",
    supervisorId: "KEA-SUP-001",
    tsrId: "KEA-TSR-001",
    clientId: "client-a",
    status: "Healthy",
  },
  {
    id: "STORE-002",
    name: "Surulere A2 Retail",
    address: "42 Bode Thomas Street, Surulere",
    region: "Lagos",
    state: "Lagos",
    lga: "Surulere",
    territory: "Lagos West",
    lat: 6.4969,
    lng: 3.3532,
    merchandiserId: "KEA-MER-002",
    supervisorId: "KEA-SUP-002",
    tsrId: "KEA-TSR-001",
    clientId: "client-b",
    status: "Healthy",
  },
  {
    id: "STORE-003",
    name: "Abeokuta North Market",
    address: "8 Lafenwa Road, Abeokuta",
    region: "Ogun",
    state: "Ogun",
    lga: "Abeokuta North",
    territory: "Abeokuta",
    lat: 7.1475,
    lng: 3.3619,
    merchandiserId: "KEA-MER-003",
    supervisorId: "KEA-SUP-003",
    tsrId: "KEA-TSR-002",
    clientId: "client-b",
    status: "Needs review",
  },
  {
    id: "STORE-004",
    name: "Ring Road Superstore",
    address: "23 Ring Road, Ibadan",
    region: "Oyo",
    state: "Oyo",
    lga: "Ibadan North",
    territory: "Ibadan",
    lat: 7.3776,
    lng: 3.947,
    merchandiserId: "KEA-MER-004",
    supervisorId: "KEA-SUP-001",
    tsrId: "KEA-TSR-001",
    clientId: "client-a",
    status: "Healthy",
  },
  {
    id: "STORE-005",
    name: "Dugbe Retail Center",
    address: "11 Dugbe Market Road, Ibadan",
    region: "Oyo",
    state: "Oyo",
    lga: "Ibadan North",
    territory: "Ibadan",
    lat: 7.3866,
    lng: 3.956,
    merchandiserId: "KEA-MER-005",
    supervisorId: "KEA-SUP-002",
    tsrId: "KEA-TSR-001",
    clientId: "client-a",
    status: "Healthy",
  },
  {
    id: "STORE-006",
    name: "Ijebu Retail Plaza",
    address: "5 Ibadan Road, Ijebu Ode",
    region: "Ogun",
    state: "Ogun",
    lga: "Ijebu Ode",
    territory: "Ijebu",
    lat: 6.82,
    lng: 3.9165,
    merchandiserId: "KEA-MER-003",
    supervisorId: "KEA-SUP-003",
    tsrId: "KEA-TSR-002",
    clientId: "client-b",
    status: "Healthy",
  },
  {
    id: "STORE-007",
    name: "Marina Retail Hub",
    address: "28 Marina, Lagos Island",
    region: "Lagos",
    state: "Lagos",
    lga: "Lagos Island",
    territory: "Lagos Island",
    lat: 6.4381,
    lng: 3.4319,
    merchandiserId: "KEA-MER-002",
    supervisorId: "KEA-SUP-002",
    tsrId: "KEA-TSR-001",
    clientId: "client-b",
    status: "Healthy",
  },
  {
    id: "STORE-008",
    name: "VI Retail Center",
    address: "12 Adeola Odeku, Victoria Island",
    region: "Lagos",
    state: "Lagos",
    lga: "Eti-Osa",
    territory: "Lagos Island",
    lat: 6.4281,
    lng: 3.4219,
    merchandiserId: "KEA-MER-001",
    supervisorId: "KEA-SUP-001",
    tsrId: "KEA-TSR-001",
    clientId: "client-a",
    status: "Healthy",
  },
];

// Product Data
export const products: Product[] = [
  // Store 001 - Ikeja North Hub
  { id: "PROD-001", sku: "NVB-001", name: "Nova Cola 500ml", category: "Beverages", storeId: "STORE-001", availability: "In stock", quantity: 240, lastUpdated: "2024-08-22", merchandiserId: "KEA-MER-001" },
  { id: "PROD-002", sku: "NVB-002", name: "Nova Cola 1.5L", category: "Beverages", storeId: "STORE-001", availability: "In stock", quantity: 180, lastUpdated: "2024-08-22", merchandiserId: "KEA-MER-001" },
  { id: "PROD-003", sku: "NVS-001", name: "Nova Snacks 50g", category: "Snacks", storeId: "STORE-001", availability: "Low stock", quantity: 12, lastUpdated: "2024-08-21", merchandiserId: "KEA-MER-001" },
  { id: "PROD-004", sku: "NVS-002", name: "Nova Biscuits 100g", category: "Snacks", storeId: "STORE-001", availability: "In stock", quantity: 95, lastUpdated: "2024-08-22", merchandiserId: "KEA-MER-001" },
  { id: "PROD-005", sku: "ARF-001", name: "Aria Milk 1L", category: "Dairy", storeId: "STORE-001", availability: "In stock", quantity: 60, lastUpdated: "2024-08-22", merchandiserId: "KEA-MER-001" },

  // Store 002 - Surulere A2 Retail
  { id: "PROD-006", sku: "ARF-002", name: "Aria Yogurt 150g", category: "Dairy", storeId: "STORE-002", availability: "In stock", quantity: 84, lastUpdated: "2024-08-22", merchandiserId: "KEA-MER-002" },
  { id: "PROD-007", sku: "ARF-003", name: "Aria Cheese 200g", category: "Dairy", storeId: "STORE-002", availability: "Low stock", quantity: 8, lastUpdated: "2024-08-21", merchandiserId: "KEA-MER-002" },
  { id: "PROD-008", sku: "NVB-003", name: "Nova Water 750ml", category: "Beverages", storeId: "STORE-002", availability: "In stock", quantity: 300, lastUpdated: "2024-08-22", merchandiserId: "KEA-MER-002" },
  { id: "PROD-009", sku: "NVS-003", name: "Nova Chips 75g", category: "Snacks", storeId: "STORE-002", availability: "Out of stock", quantity: 0, lastUpdated: "2024-08-20", merchandiserId: "KEA-MER-002" },

  // Store 003 - Abeokuta North Market
  { id: "PROD-010", sku: "NVB-004", name: "Nova Energy 250ml", category: "Beverages", storeId: "STORE-003", availability: "In stock", quantity: 150, lastUpdated: "2024-08-22", merchandiserId: "KEA-MER-003" },
  { id: "PROD-011", sku: "ARF-004", name: "Aria Juice 1L", category: "Beverages", storeId: "STORE-003", availability: "Low stock", quantity: 15, lastUpdated: "2024-08-21", merchandiserId: "KEA-MER-003" },
  { id: "PROD-012", sku: "NVS-004", name: "Nova Cookies 200g", category: "Snacks", storeId: "STORE-003", availability: "In stock", quantity: 45, lastUpdated: "2024-08-22", merchandiserId: "KEA-MER-003" },

  // Store 004 - Ring Road Superstore
  { id: "PROD-013", sku: "NVB-005", name: "Nova Cola Zero 500ml", category: "Beverages", storeId: "STORE-004", availability: "In stock", quantity: 200, lastUpdated: "2024-08-22", merchandiserId: "KEA-MER-004" },
  { id: "PROD-014", sku: "NVS-005", name: "Nova Nuts 100g", category: "Snacks", storeId: "STORE-004", availability: "In stock", quantity: 120, lastUpdated: "2024-08-22", merchandiserId: "KEA-MER-004" },
  { id: "PROD-015", sku: "ARF-005", name: "Aria Butter 250g", category: "Dairy", storeId: "STORE-004", availability: "In stock", quantity: 40, lastUpdated: "2024-08-22", merchandiserId: "KEA-MER-004" },
  { id: "PROD-016", sku: "NVB-006", name: "Nova Tea 500ml", category: "Beverages", storeId: "STORE-004", availability: "Low stock", quantity: 20, lastUpdated: "2024-08-21", merchandiserId: "KEA-MER-004" },

  // Store 005 - Dugbe Retail Center
  { id: "PROD-017", sku: "ARF-006", name: "Aria Cream 200ml", category: "Dairy", storeId: "STORE-005", availability: "In stock", quantity: 75, lastUpdated: "2024-08-22", merchandiserId: "KEA-MER-005" },
  { id: "PROD-018", sku: "NVS-006", name: "Nova Wafers 50g", category: "Snacks", storeId: "STORE-005", availability: "In stock", quantity: 110, lastUpdated: "2024-08-22", merchandiserId: "KEA-MER-005" },
  { id: "PROD-019", sku: "NVB-007", name: "Nova Malt 330ml", category: "Beverages", storeId: "STORE-005", availability: "In stock", quantity: 160, lastUpdated: "2024-08-22", merchandiserId: "KEA-MER-005" },

  // Store 006 - Ijebu Retail Plaza
  { id: "PROD-020", sku: "NVB-008", name: "Nova Soda 500ml", category: "Beverages", storeId: "STORE-006", availability: "In stock", quantity: 180, lastUpdated: "2024-08-22", merchandiserId: "KEA-MER-003" },
  { id: "PROD-021", sku: "NVS-007", name: "Nova Popcorn 80g", category: "Snacks", storeId: "STORE-006", availability: "Low stock", quantity: 10, lastUpdated: "2024-08-21", merchandiserId: "KEA-MER-003" },

  // Store 007 - Marina Retail Hub
  { id: "PROD-022", sku: "ARF-007", name: "Aria Ice Cream 500ml", category: "Frozen", storeId: "STORE-007", availability: "In stock", quantity: 60, lastUpdated: "2024-08-22", merchandiserId: "KEA-MER-002" },
  { id: "PROD-023", sku: "NVB-009", name: "Nova Coffee 250ml", category: "Beverages", storeId: "STORE-007", availability: "In stock", quantity: 140, lastUpdated: "2024-08-22", merchandiserId: "KEA-MER-002" },

  // Store 008 - VI Retail Center
  { id: "PROD-024", sku: "NVB-010", name: "Nova Premium Water 750ml", category: "Beverages", storeId: "STORE-008", availability: "In stock", quantity: 250, lastUpdated: "2024-08-22", merchandiserId: "KEA-MER-001" },
  { id: "PROD-025", sku: "NVS-008", name: "Nova Chocolate 100g", category: "Snacks", storeId: "STORE-008", availability: "In stock", quantity: 90, lastUpdated: "2024-08-22", merchandiserId: "KEA-MER-001" },
  { id: "PROD-026", sku: "ARF-008", name: "Aria Flavored Milk 250ml", category: "Dairy", storeId: "STORE-008", availability: "Low stock", quantity: 18, lastUpdated: "2024-08-21", merchandiserId: "KEA-MER-001" },
];

// Activity Data
export const activities: Activity[] = [
  {
    id: "ACT-001",
    staffId: "KEA-MER-001",
    staffName: "Maria Uchechukwu",
    role: "Merchandiser",
    storeId: "STORE-001",
    storeName: "Ikeja North Hub",
    type: "Store visit",
    date: "2024-08-22",
    time: "09:30",
    lat: 6.6018,
    lng: 3.3515,
    notes: "Completed full store audit. All Nova products well positioned.",
    photos: ["/samples/activity1.jpg"],
    completion: 100,
  },
  {
    id: "ACT-002",
    staffId: "KEA-MER-001",
    staffName: "Maria Uchechukwu",
    role: "Merchandiser",
    storeId: "STORE-008",
    storeName: "VI Retail Center",
    type: "Product check",
    date: "2024-08-22",
    time: "11:45",
    lat: 6.4281,
    lng: 3.4219,
    notes: "Checked Nova Premium Water stock. Requested restock for Aria Flavored Milk.",
    photos: ["/samples/activity2.jpg"],
    completion: 100,
  },
  {
    id: "ACT-003",
    staffId: "KEA-MER-002",
    staffName: "Abiola Felicia Omowuni",
    role: "Merchandiser",
    storeId: "STORE-002",
    storeName: "Surulere A2 Retail",
    type: "Merchandising",
    date: "2024-08-22",
    time: "10:15",
    lat: 6.4969,
    lng: 3.3532,
    notes: "Reorganized Aria dairy section. Facing and pricing updated.",
    photos: ["/samples/activity3.jpg"],
    completion: 95,
  },
  {
    id: "ACT-004",
    staffId: "KEA-MER-003",
    staffName: "Ologbonori Toyosi",
    role: "Merchandiser",
    storeId: "STORE-003",
    storeName: "Abeokuta North Market",
    type: "Store visit",
    date: "2024-08-22",
    time: "08:45",
    lat: 7.1475,
    lng: 3.3619,
    notes: "Store visit completed. Nova Energy stock good. Aria Juice needs replenishment.",
    photos: ["/samples/activity4.jpg"],
    completion: 85,
  },
  {
    id: "ACT-005",
    staffId: "KEA-MER-004",
    staffName: "Jonathan Okena",
    role: "Merchandiser",
    storeId: "STORE-004",
    storeName: "Ring Road Superstore",
    type: "Product check",
    date: "2024-08-22",
    time: "13:20",
    lat: 7.3776,
    lng: 3.947,
    notes: "Product check complete. Nova Tea low stock - escalated to supervisor.",
    photos: ["/samples/activity5.jpg"],
    completion: 90,
  },
  {
    id: "ACT-006",
    staffId: "KEA-VSR-001",
    staffName: "Shittu Akinsanya",
    role: "VSR",
    type: "Route completion",
    date: "2024-08-22",
    time: "16:30",
    lat: 6.6018,
    lng: 3.3515,
    notes: "Completed Ikeja North route. 12 stores visited, 11 orders collected.",
    photos: ["/samples/vsr-activity1.jpg"],
    completion: 92,
  },
  {
    id: "ACT-007",
    staffId: "KEA-VSR-002",
    staffName: "Abel Nduka",
    role: "VSR",
    type: "Route completion",
    date: "2024-08-22",
    time: "17:00",
    lat: 6.4969,
    lng: 3.3532,
    notes: "Surulere A2 route completed. 15 stores, 14 orders.",
    photos: [],
    completion: 93,
  },
  {
    id: "ACT-008",
    staffId: "KEA-SUP-001",
    staffName: "Oluchukwu Onyeike",
    role: "Supervisor",
    storeId: "STORE-001",
    storeName: "Ikeja North Hub",
    type: "Store visit",
    date: "2024-08-22",
    time: "14:00",
    lat: 6.6018,
    lng: 3.3515,
    notes: "Supervisory visit. Reviewed merchandiser performance with Maria.",
    photos: ["/samples/sup-activity1.jpg"],
    completion: 100,
  },
  {
    id: "ACT-009",
    staffId: "KEA-TSR-001",
    staffName: "Abubakar Hassan",
    role: "TSR",
    type: "Route completion",
    date: "2024-08-22",
    time: "18:00",
    lat: 6.5049,
    lng: 3.3612,
    notes: "Territory review complete. All 4 teams reporting on track.",
    photos: [],
    completion: 95,
  },
];

// VSR Routes (for map visualization)
export const vsrRoutes = [
  {
    vsrId: "KEA-VSR-001",
    vsrName: "Shittu Akinsanya",
    routeName: "Ikeja North",
    territory: "Lagos Central",
    coordinates: [
      [6.6018, 3.3515], [6.6050, 3.3550], [6.6080, 3.3580], [6.6110, 3.3610],
      [6.6140, 3.3640], [6.6108, 3.3605], [6.6070, 3.3570], [6.6030, 3.3530],
    ] as [number, number][],
    stores: ["STORE-001", "STORE-008"],
  },
  {
    vsrId: "KEA-VSR-002",
    vsrName: "Abel Nduka",
    routeName: "Surulere A2",
    territory: "Lagos West",
    coordinates: [
      [6.4969, 3.3532], [6.4990, 3.3560], [6.5020, 3.3590], [6.5049, 3.3612],
      [6.5070, 3.3640], [6.5040, 3.3610], [6.5000, 3.3570], [6.4970, 3.3540],
    ] as [number, number][],
    stores: ["STORE-002", "STORE-007"],
  },
  {
    vsrId: "KEA-VSR-003",
    vsrName: "Paul Olakonipekun",
    routeName: "ABK North",
    territory: "Abeokuta",
    coordinates: [
      [7.1475, 3.3619], [7.1500, 3.3640], [7.1530, 3.3670], [7.1560, 3.3710],
      [7.1530, 3.3740], [7.1490, 3.3700], [7.1460, 3.3650], [7.1440, 3.3600],
    ] as [number, number][],
    stores: ["STORE-003"],
  },
  {
    vsrId: "KEA-VSR-004",
    vsrName: "Timothy Ogunmokun",
    routeName: "ABK South",
    territory: "Abeokuta",
    coordinates: [
      [7.1385, 3.3529], [7.1350, 3.3500], [7.1320, 3.3470], [7.1290, 3.3440],
      [7.1260, 3.3410], [7.1290, 3.3440], [7.1320, 3.3470], [7.1350, 3.3500],
    ] as [number, number][],
    stores: [],
  },
  {
    vsrId: "KEA-VSR-005",
    vsrName: "Ikechukwu Maduora",
    routeName: "Asaba Core",
    territory: "Asaba",
    coordinates: [
      [6.1982, 6.7319], [6.2010, 6.7350], [6.2040, 6.7380], [6.2070, 6.7410],
      [6.2100, 6.7440], [6.2070, 6.7410], [6.2040, 6.7380], [6.2010, 6.7350],
    ] as [number, number][],
    stores: [],
  },
];

// Helper functions for hierarchy traversal
export function getStaffById(id: string): Staff | undefined {
  return allStaff.find(s => s.id === id);
}

export function getChildren(staffId: string): Staff[] {
  const staff = getStaffById(staffId);
  if (!staff?.childrenIds) return [];
  return staff.childrenIds.map(id => getStaffById(id)!).filter(Boolean);
}

export function getParent(staffId: string): Staff | undefined {
  const staff = getStaffById(staffId);
  if (!staff?.parentId) return undefined;
  return getStaffById(staff.parentId);
}

export function getStoresByMerchandiser(merchandiserId: string): Store[] {
  return stores.filter(s => s.merchandiserId === merchandiserId);
}

export function getStoresBySupervisor(supervisorId: string): Store[] {
  const merchandisers = getChildren(supervisorId).filter(m => m.role === "Merchandiser");
  return stores.filter(s => merchandisers.some(m => m.id === s.merchandiserId));
}

export function getStoresByTSR(tsrId: string): Store[] {
  const supervisors = getChildren(tsrId).filter(s => s.role === "Supervisor");
  const merchandisers = supervisors.flatMap(s => getChildren(s.id).filter(m => m.role === "Merchandiser"));
  return stores.filter(s => merchandisers.some(m => m.id === s.merchandiserId));
}

export function getProductsByStore(storeId: string): Product[] {
  return products.filter(p => p.storeId === storeId);
}

export function getProductsByMerchandiser(merchandiserId: string): Product[] {
  const storeIds = getStoresByMerchandiser(merchandiserId).map(s => s.id);
  return products.filter(p => storeIds.includes(p.storeId));
}

export function getActivitiesByStaff(staffId: string): Activity[] {
  return activities.filter(a => a.staffId === staffId);
}

export function getActivitiesByStore(storeId: string): Activity[] {
  return activities.filter(a => a.storeId === storeId);
}

export function getVSRRoute(vsrId: string) {
  return vsrRoutes.find(r => r.vsrId === vsrId);
}

export function getStaffByClient(clientId: string): Staff[] {
  return allStaff.filter(s => s.clientId === clientId);
}

export function getStoresByClient(clientId: string): Store[] {
  return stores.filter(s => s.clientId === clientId);
}

export function getProductsByClient(clientId: string): Product[] {
  const storeIds = getStoresByClient(clientId).map(s => s.id);
  return products.filter(p => storeIds.includes(p.storeId));
}

export function getActivitiesByClient(clientId: string): Activity[] {
  const staffIds = getStaffByClient(clientId).map(s => s.id);
  return activities.filter(a => staffIds.includes(a.staffId));
}

export const clients: Client[] = [
  { id: "client-a", name: "Nova Consumer", sector: "Consumer goods", stores: 4, completion: "91.8%", status: "On track" },
  { id: "client-b", name: "Aria Foods", sector: "Food & beverage", stores: 4, completion: "84.6%", status: "On track" },
];

// KPI calculations
export function calculateKPIs(clientId?: string) {
  const staff = clientId ? getStaffByClient(clientId) : allStaff;
  const storesList = clientId ? getStoresByClient(clientId) : stores;
  const activitiesList = clientId ? getActivitiesByClient(clientId) : activities;

  const totalVSRs = staff.filter(s => s.role === "VSR").length;
  const totalTSRs = staff.filter(s => s.role === "TSR").length;
  const totalSupervisors = staff.filter(s => s.role === "Supervisor").length;
  const totalMerchandisers = staff.filter(s => s.role === "Merchandiser").length;
  const totalActive = staff.filter(s => s.status === "Active" || s.status === "On route").length;

  const territories = [...new Set(staff.map(s => s.territory))].length;
  const routes = [...new Set(staff.filter(s => s.role === "VSR").map(s => s.route))].length;
  const storesCount = storesList.length;
  const storeIds = storesList.map(s => s.id);
  const productsCount = [...new Set(products.filter(p => storeIds.includes(p.storeId)).map(p => p.id))].length;
  const activitiesCount = activitiesList.length;

  return {
    totalVSRs,
    totalTSRs,
    totalSupervisors,
    totalMerchandisers,
    totalActive,
    totalTerritories: territories,
    totalRoutes: routes,
    totalStores: storesCount,
    totalProducts: productsCount,
    totalActivities: activitiesCount,
  };
}

export function getRegions(): string[] {
  return [...new Set(allStaff.map(s => s.region))].sort();
}

export function getTerritories(region?: string): string[] {
  const filtered = region ? allStaff.filter(s => s.region === region) : allStaff;
  return [...new Set(filtered.map(s => s.territory))].sort();
}

export function getRoles(): Role[] {
  return ["VSR", "TSR", "Supervisor", "Merchandiser"];
}

export function getStatuses(): Status[] {
  return ["Active", "On route", "Needs review", "Inactive"];
}
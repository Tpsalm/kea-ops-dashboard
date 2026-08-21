// Shared static data, types and navigation for the KEA Operations dashboard.
// These same datasets power the Overview dashboard and every dedicated tab page.
import type { LucideIcon } from "lucide-react";
import {
  BarChart3, Building2, LayoutDashboard, Map, Route, Store, Users,
} from "lucide-react";

export type Role = "VSR" | "TSR" | "Supervisor" | "Merchandiser";
export type Status = "Active" | "On route" | "Needs review" | "Inactive";

export type Staff = {
  id: string; name: string; role: Role; region: string; territory: string;
  route: string; status: Status; visits: number; completion: number;
  lat: number; lng: number;
};

// Real Nigerian city coordinates by territory, with small offsets so multiple
// staff in the same territory render as distinct pins on the map.
export const staff: Staff[] = [
  { id: "KEA-1048", name: "Shittu Akinsanya", role: "VSR", region: "Lagos", territory: "Lagos Central", route: "Ikeja North", status: "On route", visits: 31, completion: 94, lat: 6.6018, lng: 3.3515 },
  { id: "KEA-1082", name: "Abel Nduka", role: "VSR", region: "Lagos", territory: "Lagos West", route: "Surulere A2", status: "Active", visits: 28, completion: 91, lat: 6.4969, lng: 3.3532 },
  { id: "KEA-1103", name: "Maria Uchechukwu", role: "Merchandiser", region: "Lagos", territory: "Lagos Island", route: "VI Retail", status: "Active", visits: 34, completion: 97, lat: 6.4281, lng: 3.4219 },
  { id: "KEA-1127", name: "Oluchukwu Onyeike", role: "Supervisor", region: "Lagos", territory: "Lagos Central", route: "8 stores", status: "Active", visits: 29, completion: 88, lat: 6.6108, lng: 3.3605 },
  { id: "KEA-1164", name: "Paul Olakonipekun", role: "VSR", region: "Ogun", territory: "Abeokuta", route: "ABK North", status: "Needs review", visits: 18, completion: 63, lat: 7.1475, lng: 3.3619 },
  { id: "KEA-1190", name: "Abubakar Hassan", role: "TSR", region: "Lagos", territory: "Lagos West", route: "4 teams", status: "Active", visits: 32, completion: 95, lat: 6.5049, lng: 3.3612 },
  { id: "KEA-1206", name: "Ologbonori Toyosi", role: "Merchandiser", region: "Ogun", territory: "Ijebu", route: "Ijebu Retail", status: "On route", visits: 26, completion: 86, lat: 6.82, lng: 3.9165 },
  { id: "KEA-1221", name: "Timothy Ogunmokun", role: "VSR", region: "Ogun", territory: "Abeokuta", route: "ABK South", status: "Inactive", visits: 12, completion: 48, lat: 7.1385, lng: 3.3529 },
  { id: "KEA-1245", name: "Jonathan Okena", role: "Merchandiser", region: "Oyo", territory: "Ibadan", route: "Ring Road", status: "Active", visits: 30, completion: 93, lat: 7.3776, lng: 3.947 },
  { id: "KEA-1263", name: "Moses Akindiran", role: "Supervisor", region: "Lagos", territory: "Lagos East", route: "11 stores", status: "Active", visits: 27, completion: 89, lat: 6.455, lng: 3.545 },
  { id: "KEA-1281", name: "Ikechukwu Maduora", role: "VSR", region: "Delta", territory: "Asaba", route: "Asaba Core", status: "Needs review", visits: 16, completion: 59, lat: 6.1982, lng: 6.7319 },
  { id: "KEA-1309", name: "Arorundade Adewale", role: "Merchandiser", region: "Oyo", territory: "Ibadan", route: "Dugbe Retail", status: "Active", visits: 33, completion: 96, lat: 7.3866, lng: 3.956 },
  { id: "KEA-1341", name: "Yusuf Abimbola Rasheed", role: "TSR", region: "Ogun", territory: "Abeokuta", route: "6 teams", status: "Active", visits: 30, completion: 92, lat: 7.156, lng: 3.371 },
  { id: "KEA-1367", name: "Abiola Felicia Omowuni", role: "Merchandiser", region: "Lagos", territory: "Lagos Island", route: "Marina Retail", status: "Active", visits: 25, completion: 84, lat: 6.4381, lng: 3.4319 },
  { id: "KEA-1389", name: "Michael Olayiwola", role: "Supervisor", region: "Ogun", territory: "Ijebu", route: "5 stores", status: "Active", visits: 24, completion: 82, lat: 6.83, lng: 3.9265 },
];

export const activityData = [
  { day: "01 Aug", visits: 282, checks: 350 }, { day: "04 Aug", visits: 335, checks: 398 },
  { day: "07 Aug", visits: 312, checks: 376 }, { day: "10 Aug", visits: 401, checks: 455 },
  { day: "13 Aug", visits: 372, checks: 442 }, { day: "16 Aug", visits: 448, checks: 516 },
  { day: "19 Aug", visits: 421, checks: 485 }, { day: "22 Aug", visits: 502, checks: 570 },
  { day: "25 Aug", visits: 478, checks: 544 }, { day: "28 Aug", visits: 542, checks: 618 },
];

export const completionData = [
  { name: "Lagos", planned: 1240, completed: 1128 }, { name: "Ogun", planned: 810, completed: 682 },
  { name: "Oyo", planned: 690, completed: 601 }, { name: "Delta", planned: 430, completed: 344 },
  { name: "Enugu", planned: 380, completed: 325 },
];

export const roleData = [
  { name: "Merchandisers", value: 182, color: "#2563eb" }, { name: "VSRs", value: 96, color: "#14b8a6" },
  { name: "Supervisors", value: 28, color: "#f59e0b" }, { name: "TSRs", value: 14, color: "#8b5cf6" },
];

export const ROLE_COLORS: Record<Role, string> = {
  VSR: "#2563eb",           // blue
  Merchandiser: "#14b8a6",  // teal
  Supervisor: "#f59e0b",    // amber
  TSR: "#8b5cf6",           // violet
};

// Sidebar navigation. Every ANALYTICS tab maps to its own dedicated page.
export const NAV: { label: string; path: string; icon: LucideIcon }[] = [
  { label: "Overview", path: "/", icon: LayoutDashboard },
  { label: "Live map", path: "/live-map", icon: Map },
  { label: "Workforce", path: "/workforce", icon: Users },
  { label: "Stores & products", path: "/stores", icon: Store },
  { label: "VSR operations", path: "/vsr-operations", icon: Route },
  { label: "Performance", path: "/performance", icon: BarChart3 },
  { label: "Client portal", path: "/client-portal", icon: Building2 },
];

export function activeNavLabel(pathname: string): string {
  return NAV.find((n) => n.path === pathname)?.label ?? "Overview";
}

// Shared static data, types and navigation for the KEA Operations dashboard.
// These same datasets power the Overview dashboard and every dedicated tab page.
import type { LucideIcon } from "lucide-react";
import {
  BarChart3, Building2, LayoutDashboard, Map, Store, Users,
  FileText, ClipboardCheck, ShieldCheck, Network, Search, MapPin,
  PackageCheck, Activity, Layers, TrendingUp
} from "lucide-react";

export type Role = "VSR" | "TSR" | "Supervisor" | "Merchandiser";
export type Status = "Active" | "On route" | "Needs review" | "Inactive";

export type Staff = {
  id: string; name: string; role: Role; region: string; territory: string;
  route: string; status: Status; visits: number; completion: number;
  lat: number; lng: number;
  // Optional fields for client scoping and evidence
  clientId?: string;
  photos?: string[];
  // Hierarchy links
  parentId?: string;
  childrenIds?: string[];
  state?: string;
  lga?: string;
};

// Real Nigerian city coordinates by territory, with small offsets so multiple
// staff in the same territory render as distinct pins on the map.
export const staff: Staff[] = [
  // Lagos Region - Merchandisers
  { id: "M0001", name: "Toluwaleni Adio", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Ikeja", territory: "Lagos Central", route: "Royal Prince", status: "Active", visits: 28, completion: 89, lat: 6.5918, lng: 3.3315, clientId: "client-a", parentId: "KEA-TSR-001" },
  { id: "M0002", name: "Terapb Chioma Nneme", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Ojodu", territory: "Lagos West", route: "Jendel", status: "Active", visits: 26, completion: 87, lat: 6.5369, lng: 3.3232, clientId: "client-b", parentId: "KEA-TSR-001" },
  { id: "M0003", name: "Mopelola Sebilau Oladotun", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Dopemu", territory: "Lagos North", route: "Justrite", status: "Active", visits: 27, completion: 88, lat: 6.5669, lng: 3.3532, clientId: "client-a", parentId: "KEA-TSR-001" },
  { id: "M0004", name: "Happiness Usung", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Ojodu", territory: "Lagos West", route: "Justrite", status: "Active", visits: 25, completion: 86, lat: 6.5269, lng: 3.3432, clientId: "client-b", parentId: "KEA-TSR-001" },
  { id: "M0005", name: "Amadi Akpan", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Bariga", territory: "Lagos East", route: "Justrite", status: "Active", visits: 29, completion: 90, lat: 6.5069, lng: 3.3832, clientId: "client-a", parentId: "KEA-TSR-001" },
  { id: "M0006", name: "Abdulkareem Bodiat", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Ifako", territory: "Lagos Central", route: "Justrite", status: "Active", visits: 26, completion: 88, lat: 6.6018, lng: 3.3815, clientId: "client-b", parentId: "KEA-TSR-001" },
  { id: "M0007", name: "Grace Ignatius", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Ogba", territory: "Lagos West", route: "Spar", status: "Active", visits: 24, completion: 85, lat: 6.5869, lng: 3.3315, clientId: "client-a", parentId: "KEA-TSR-001" },
  { id: "M0008", name: "Bolarinwa Taloni", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Tsipeju", territory: "Lagos Island", route: "Spar", status: "Active", visits: 27, completion: 87, lat: 6.4569, lng: 3.4219, clientId: "client-b", parentId: "KEA-TSR-001" },
  { id: "M0009", name: "Akinola Towobilwu Lucia", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Maryland", territory: "Lagos East", route: "Market Square", status: "Active", visits: 28, completion: 89, lat: 6.4869, lng: 3.4319, clientId: "client-a", parentId: "KEA-TSR-001" },
  { id: "M0010", name: "Grace Peter", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Bariga", territory: "Lagos East", route: "Justrite", status: "On route", visits: 25, completion: 86, lat: 6.4769, lng: 3.4119, clientId: "client-b", parentId: "KEA-TSR-001" },
  { id: "M0011", name: "Adeniran Temitope", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Oplatmu", territory: "Lagos South", route: "Justrite", status: "Active", visits: 26, completion: 87, lat: 6.4469, lng: 3.4419, clientId: "client-a", parentId: "KEA-TSR-001" },
  { id: "M0012", name: "Saibu Enwele Remidum", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Ikorodu 2", territory: "Lagos South", route: "Justrite", status: "Active", visits: 27, completion: 88, lat: 6.4169, lng: 3.4619, clientId: "client-b", parentId: "KEA-TSR-001" },
  { id: "M0013", name: "Onajgonon Tinubun", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Odiegaonun", territory: "Lagos South", route: "Justrite", status: "Active", visits: 28, completion: 89, lat: 6.3969, lng: 3.4719, clientId: "client-a", parentId: "KEA-TSR-001" },
  { id: "M0014", name: "Popoola Naimel Tumeke", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Akowakari", territory: "Lagos South", route: "Jendal", status: "Active", visits: 26, completion: 87, lat: 6.3869, lng: 3.4819, clientId: "client-b", parentId: "KEA-TSR-001" },
  { id: "M0015", name: "Abdal Shakira Triloye", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Odiegaonun", territory: "Lagos South", route: "Jendal", status: "Active", visits: 27, completion: 88, lat: 6.3769, lng: 3.4919, clientId: "client-a", parentId: "KEA-TSR-001" },
  { id: "M0016", name: "Nasrudeen Azeezal Abida", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Ejide", territory: "Lagos South", route: "Jendal", status: "Active", visits: 28, completion: 89, lat: 6.3669, lng: 3.5019, clientId: "client-b", parentId: "KEA-TSR-001" },
  { id: "M0017", name: "Hamised Shukuroh Opeyemi", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Ogadu", territory: "Lagos East", route: "Home Afforns", status: "Active", visits: 26, completion: 87, lat: 6.4569, lng: 3.4419, clientId: "client-a", parentId: "KEA-TSR-001" },
  { id: "M0018", name: "Oyinran Afeez", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Surubare", territory: "Lagos West", route: "Spar", status: "Active", visits: 27, completion: 88, lat: 6.5269, lng: 3.3632, clientId: "client-b", parentId: "KEA-TSR-001" },
  { id: "M0019", name: "Agisoola Aminu", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Yaba", territory: "Lagos Central", route: "Spar", status: "Active", visits: 28, completion: 89, lat: 6.5969, lng: 3.3815, clientId: "client-a", parentId: "KEA-TSR-001" },
  { id: "M0020", name: "Deseshe Deborah", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Ikoyi", territory: "Lagos Island", route: "Spar", status: "Active", visits: 26, completion: 87, lat: 6.4569, lng: 3.4619, clientId: "client-b", parentId: "KEA-TSR-001" },
  { id: "M0021", name: "Odufere Ibrahim", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "VI", territory: "Lagos Island", route: "Spar", status: "Active", visits: 27, completion: 88, lat: 6.4369, lng: 3.4819, clientId: "client-a", parentId: "KEA-TSR-001" },
  { id: "M0022", name: "Ajisun Favour", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Lekki", territory: "Lagos Island", route: "Spar", status: "Active", visits: 28, completion: 89, lat: 6.4169, lng: 3.4919, clientId: "client-b", parentId: "KEA-TSR-001" },
  { id: "M0023", name: "Ogu Favour", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Eiate", territory: "Lagos Island", route: "Market Square", status: "Active", visits: 26, completion: 87, lat: 6.3969, lng: 3.5019, clientId: "client-a", parentId: "KEA-TSR-001" },
  { id: "M0024", name: "Mhouda Emmanuel", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Ajah", territory: "Lagos Island", route: "Jendal", status: "Active", visits: 27, completion: 88, lat: 6.3869, lng: 3.5119, clientId: "client-b", parentId: "KEA-TSR-001" },
  { id: "M0025", name: "Barnadise Emmoneulle", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Oiuru", territory: "Lagos South", route: "Prince Ebseno", status: "Active", visits: 28, completion: 89, lat: 6.3769, lng: 3.5219, clientId: "client-a", parentId: "KEA-TSR-001" },
  { id: "M0026", name: "Ihude Ikpah", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Deleriye", territory: "Lagos South", route: "Prince Ebseno", status: "Active", visits: 26, completion: 87, lat: 6.3669, lng: 3.5319, clientId: "client-b", parentId: "KEA-TSR-001" },
  { id: "M0027", name: "David Stella", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Admiralty", territory: "Lagos South", route: "Prince Ebseno", status: "Active", visits: 27, completion: 88, lat: 6.3569, lng: 3.5419, clientId: "client-a", parentId: "KEA-TSR-001" },
  { id: "M0028", name: "Uthe Success", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Apapa", territory: "Lagos West", route: "Prince Ebseno", status: "Active", visits: 28, completion: 89, lat: 6.3469, lng: 3.5519, clientId: "client-b", parentId: "KEA-TSR-001" },
  { id: "M0029", name: "Martin Gedtime", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Chevron", territory: "Lagos Island", route: "Prince Ebseno", status: "Active", visits: 26, completion: 87, lat: 6.3369, lng: 3.5619, clientId: "client-a", parentId: "KEA-TSR-001" },
  { id: "M0030", name: "David Iruekbukem Father", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Festac Town", territory: "Lagos West", route: "Market Square", status: "Active", visits: 27, completion: 88, lat: 6.3269, lng: 3.5719, clientId: "client-b", parentId: "KEA-TSR-001" },
  { id: "M0031", name: "Aniye Akuakuomop Konsarat", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Ayobo", territory: "Lagos West", route: "Justrite", status: "Active", visits: 28, completion: 89, lat: 6.3169, lng: 3.5819, clientId: "client-a", parentId: "KEA-TSR-001" },

  // South West Region - Merchandisers
  { id: "M0032", name: "Oinfade Fummilaye Adenke", role: "Merchandiser", region: "South West", state: "Oyo", lga: "Ibaje", territory: "Ibadan", route: "Market Square GRA/Hypericity GRA", status: "Active", visits: 26, completion: 87, lat: 7.2969, lng: 3.8519, clientId: "client-a", parentId: "KEA-TSR-002" },
  { id: "M0033", name: "Zeal Favour", role: "Merchandiser", region: "South West", state: "Oyo", lga: "Liganda", territory: "Ibadan", route: "Jendal", status: "Active", visits: 27, completion: 88, lat: 7.3069, lng: 3.8619, clientId: "client-b", parentId: "KEA-TSR-002" },
  { id: "M0034", name: "OLOPADE MERCY", role: "Merchandiser", region: "South West", state: "Osun", lga: "Orchid(ELEGANZA)", territory: "Osogbo", route: "Escore", status: "Active", visits: 28, completion: 89, lat: 7.7569, lng: 4.5519, clientId: "client-a", parentId: "KEA-TSR-003" },
  { id: "M0035", name: "Abduiganya Lafesiah", role: "Merchandiser", region: "South West", state: "Oyo", lga: "ILGWIN", territory: "Ibadan", route: "Montess Supermarket", status: "Active", visits: 26, completion: 87, lat: 7.3169, lng: 3.8719, clientId: "client-b", parentId: "KEA-TSR-002" },
  { id: "M0036", name: "Bamifere Deborah", role: "Merchandiser", region: "South West", state: "Lagos", lga: "Emediate Mali", territory: "Lagos South", route: "Enriched Mali", status: "Active", visits: 27, completion: 88, lat: 6.3269, lng: 3.6519, clientId: "client-a", parentId: "KEA-TSR-001" },
  { id: "M0037", name: "Ebualim Opayemi", role: "Merchandiser", region: "South West", state: "Osun", lga: "Nar Supermarket", territory: "Osogbo", route: "Nar Supermarket", status: "Active", visits: 28, completion: 89, lat: 7.7669, lng: 4.5619, clientId: "client-b", parentId: "KEA-TSR-003" },
  { id: "M0038", name: "Afolabi Oladele", role: "Merchandiser", region: "South West", state: "Oyo", lga: "ADO EKITI", territory: "Ekiti", route: "Adeneola Supermarket", status: "Active", visits: 26, completion: 87, lat: 7.6269, lng: 5.2319, clientId: "client-a", parentId: "KEA-TSR-004" },
  { id: "M0039", name: "Oladipe Balakis", role: "Merchandiser", region: "South West", state: "Osun", lga: "Jendel/Justrite", territory: "Osogbo", route: "Jendel/Justrite", status: "Active", visits: 27, completion: 88, lat: 7.7769, lng: 4.5719, clientId: "client-b", parentId: "KEA-TSR-003" },

  // Ogun State Region - Merchandisers
  { id: "M0040", name: "Olushotun Adio", role: "Merchandiser", region: "Ogun", state: "Ogun", lga: "Ifo", territory: "Abeokuta", route: "Market Square Ekenwan", status: "Active", visits: 28, completion: 89, lat: 6.6469, lng: 3.2819, clientId: "client-a", parentId: "KEA-TSR-005" },
  { id: "M0041", name: "Adelusi Adio", role: "Merchandiser", region: "Ogun", state: "Ogun", lga: "Casso", territory: "Abeokuta", route: "Justrite", status: "Active", visits: 26, completion: 87, lat: 6.6569, lng: 3.2919, clientId: "client-b", parentId: "KEA-TSR-005" },
  { id: "M0042", name: "John Opayemi", role: "Merchandiser", region: "Ogun", state: "Ogun", lga: "Abeokuta", territory: "Abeokuta", route: "Jendal", status: "Active", visits: 27, completion: 88, lat: 6.6669, lng: 3.3019, clientId: "client-a", parentId: "KEA-TSR-005" },
  { id: "M0043", name: "Favour Okahe", role: "Merchandiser", region: "Ogun", state: "Ogun", lga: "Isheri", territory: "Abeokuta", route: "Jendal", status: "Active", visits: 28, completion: 89, lat: 6.6769, lng: 3.3119, clientId: "client-b", parentId: "KEA-TSR-005" },
  { id: "M0044", name: "Faith Oluyo Adi", role: "Merchandiser", region: "Ogun", state: "Ogun", lga: "Egbada", territory: "Abeokuta", route: "Jendal", status: "Active", visits: 26, completion: 87, lat: 6.6869, lng: 3.3219, clientId: "client-a", parentId: "KEA-TSR-005" },

  // North Region - Merchandisers
  { id: "M0045", name: "Olorunde Bialo", role: "Merchandiser", region: "North", state: "Kano", lga: "Kano", territory: "Kano", route: "Market Square Ekenwan", status: "Active", visits: 28, completion: 89, lat: 11.9969, lng: 8.6619, clientId: "client-a", parentId: "KEA-TSR-006" },
  { id: "M0046", name: "Duru Onyinyechi Jowita", role: "Merchandiser", region: "North", state: "Lagos", lga: "Festac Town", territory: "Lagos West", route: "Spar", status: "Active", visits: 26, completion: 87, lat: 6.3369, lng: 3.5719, clientId: "client-b", parentId: "KEA-TSR-001" },
  { id: "M0047", name: "Asechi Funnilaye Justrite", role: "Merchandiser", region: "North", state: "Oyo", lga: "Igbo", territory: "Ibadan", route: "Jendel/Justrite", status: "Active", visits: 27, completion: 88, lat: 7.3269, lng: 3.8819, clientId: "client-a", parentId: "KEA-TSR-002" },
  { id: "M0048", name: "Olumide Balogum", role: "Merchandiser", region: "North", state: "Lagos", lga: "Oguuru", territory: "Lagos South", route: "Jendel", status: "Active", visits: 28, completion: 89, lat: 6.3469, lng: 3.5919, clientId: "client-b", parentId: "KEA-TSR-001" },
  { id: "M0049", name: "Abima Tadesup Orekano", role: "Merchandiser", region: "North", state: "Oyo", lga: "Maijdan", territory: "Ibadan", route: "Justrite", status: "Active", visits: 26, completion: 87, lat: 7.3369, lng: 3.8919, clientId: "client-a", parentId: "KEA-TSR-002" },
  { id: "M0050", name: "Alomo Tadesup Orekano", role: "Merchandiser", region: "North", state: "Oyo", lga: "Meran", territory: "Ibadan", route: "Justrite", status: "Active", visits: 27, completion: 88, lat: 7.3469, lng: 3.9019, clientId: "client-b", parentId: "KEA-TSR-002" },
  { id: "M0051", name: "Uchusholleu Drime Uguru", role: "Merchandiser", region: "North", state: "Enugu", lga: "Awie 2", territory: "Enugu", route: "Bohan Stores", status: "Active", visits: 28, completion: 89, lat: 6.4669, lng: 7.5119, clientId: "client-a", parentId: "KEA-TSR-007" },
  { id: "M0052", name: "Eghoma Nsapo Wiyesi", role: "Merchandiser", region: "North", state: "Enugu", lga: "Nsukka", territory: "Enugu", route: "Bohan Stores", status: "Active", visits: 26, completion: 87, lat: 6.4769, lng: 7.5219, clientId: "client-b", parentId: "KEA-TSR-007" },
  { id: "M0053", name: "Angbgbu Blessing", role: "Merchandiser", region: "North", state: "Cross River", lga: "Celebrity GRA", territory: "Calabar", route: "Calvary GRA", status: "Active", visits: 27, completion: 88, lat: 4.9669, lng: 8.3119, clientId: "client-a", parentId: "KEA-TSR-008" },
  { id: "M0054", name: "Atalelu Deborah Eneyiu", role: "Merchandiser", region: "North", state: "Cross River", lga: "Nsani", territory: "Calabar", route: "Bohan Stores Nsani", status: "Active", visits: 28, completion: 89, lat: 4.9769, lng: 8.3219, clientId: "client-b", parentId: "KEA-TSR-008" },

  // South East Region - Merchandisers
  { id: "M0055", name: "Aje Emmanuella Chineye", role: "Merchandiser", region: "South East", state: "Abia", lga: "ASABA", territory: "Aba", route: "Market Square", status: "Active", visits: 26, completion: 87, lat: 5.1069, lng: 7.4019, clientId: "client-a", parentId: "KEA-TSR-009" },
  { id: "M0056", name: "Beatrice Nlejinameke", role: "Merchandiser", region: "South East", state: "Abia", lga: "Townsquare, Aaadu", territory: "Aba", route: "Townsquare, Aaadu", status: "Active", visits: 27, completion: 88, lat: 5.1169, lng: 7.4119, clientId: "client-b", parentId: "KEA-TSR-009" },
  { id: "M0057", name: "Eneyo Emely Owdiome", role: "Merchandiser", region: "South East", state: "Abia", lga: "Abarim Stores, Aaadu", territory: "Aba", route: "Abarim Stores, Aaadu", status: "Active", visits: 28, completion: 89, lat: 5.1269, lng: 7.4219, clientId: "client-a", parentId: "KEA-TSR-009" },
  { id: "M0058", name: "Keleshi Espetchele", role: "Merchandiser", region: "South East", state: "Abia", lga: "AKWA", territory: "Aba", route: "Market Square, Aaadu", status: "Active", visits: 26, completion: 87, lat: 5.1369, lng: 7.4319, clientId: "client-b", parentId: "KEA-TSR-009" },
  { id: "M0059", name: "Emeshoele Ukabu-Uwadia", role: "Merchandiser", region: "South East", state: "Abia", lga: "Maridian", territory: "Aba", route: "Market Square, Aaadu", status: "Active", visits: 27, completion: 88, lat: 5.1469, lng: 7.4419, clientId: "client-a", parentId: "KEA-TSR-009" },
  { id: "M0060", name: "Ujcheikea Drime Uguru", role: "Merchandiser", region: "South East", state: "Abia", lga: "Awie 2", territory: "Aba", route: "Bohan Stores", status: "Active", visits: 28, completion: 89, lat: 5.1569, lng: 7.4519, clientId: "client-b", parentId: "KEA-TSR-009" },
  { id: "M0061", name: "Egbonaa Nsapo Wiyesi", role: "Merchandiser", region: "South East", state: "Enugu", lga: "Nsukka", territory: "Enugu", route: "Bohan Stores Nsani", status: "Active", visits: 26, completion: 87, lat: 6.4869, lng: 7.5319, clientId: "client-a", parentId: "KEA-TSR-007" },
  { id: "M0062", name: "Mbgbgose Alomat", role: "Merchandiser", region: "South East", state: "Osun", lga: "OWODE", territory: "Osogbo", route: "Justrite, OWODE", status: "Active", visits: 27, completion: 88, lat: 7.7869, lng: 4.5819, clientId: "client-b", parentId: "KEA-TSR-003" },
  { id: "M0063", name: "AJIBOLA TOKEDE", role: "Merchandiser", region: "South East", state: "Ondo", lga: "Simosri, Oto", territory: "Oto", route: "Simosri, Oto", status: "Active", visits: 28, completion: 89, lat: 7.1969, lng: 5.5119, clientId: "client-a", parentId: "KEA-TSR-010" },
  { id: "M0064", name: "ADETORO ABIMBOLA", role: "Merchandiser", region: "South East", state: "Ogun", lga: "OGUN STATE", territory: "Ogun", route: "Jendal Ota", status: "Active", visits: 26, completion: 87, lat: 6.6969, lng: 3.3319, clientId: "client-b", parentId: "KEA-TSR-005" },
  { id: "M0065", name: "OKEOWO OMICOLOGICAL", role: "Merchandiser", region: "South East", state: "Oyo", lga: "OGUN STATE", territory: "Oyo", route: "Market Square, Ota", status: "Active", visits: 27, completion: 88, lat: 7.3569, lng: 3.9119, clientId: "client-a", parentId: "KEA-TSR-002" },

  // South South Region - Merchandisers
  { id: "M0066", name: "Faturoun Mwoyes", role: "Merchandiser", region: "South South", state: "Delta", lga: "Jendel Omitandum, Ota", territory: "Ota", route: "Jendel Omitandum, Ota", status: "Active", visits: 28, completion: 89, lat: 6.6569, lng: 3.3719, clientId: "client-b", parentId: "KEA-TSR-005" },
  { id: "M0067", name: "Oladupe Bialo", role: "Merchandiser", region: "South South", state: "Rivers", lga: "GRA Ikeja", territory: "Port Harcourt", route: "Market Square Ekenwan", status: "Active", visits: 26, completion: 87, lat: 4.7669, lng: 7.0119, clientId: "client-a", parentId: "KEA-TSR-011" },
  { id: "M0068", name: "BAMBROSE ALMOT", role: "Merchandiser", region: "South South", state: "Rivers", lga: "Justrite, OWODE", territory: "Port Harcourt", route: "Justrite, OWODE", status: "Active", visits: 27, completion: 88, lat: 4.7769, lng: 7.0219, clientId: "client-b", parentId: "KEA-TSR-011" },
  { id: "M0069", name: "Chibuka Chinaemerem", role: "Merchandiser", region: "South South", state: "Akwa Ibom", lga: "ABA", territory: "Uyo", route: "Market Square", status: "Active", visits: 28, completion: 89, lat: 5.0369, lng: 7.7119, clientId: "client-a", parentId: "KEA-TSR-012" },
  { id: "M0070", name: "AJIBOLA TOKEDE", role: "Merchandiser", region: "South South", state: "Ondo", lga: "M0014", territory: "Oto", route: "Simosri, Oto", status: "Active", visits: 26, completion: 87, lat: 7.1969, lng: 5.5319, clientId: "client-b", parentId: "KEA-TSR-010" },
  { id: "M0071", name: "ADETORO ABIMBOLA", role: "Merchandiser", region: "South South", state: "Ogun", lga: "OGUN STATE", territory: "Ogun", route: "Jendal Ota", status: "Active", visits: 27, completion: 88, lat: 6.6869, lng: 3.3519, clientId: "client-a", parentId: "KEA-TSR-005" },
  { id: "M0072", name: "OKEOWO OMICOLOGICAL", role: "Merchandiser", region: "South South", state: "Oyo", lga: "Market Square, Ota", territory: "Oyo", route: "Market Square, Ota", status: "Active", visits: 28, completion: 89, lat: 7.3469, lng: 3.8919, clientId: "client-b", parentId: "KEA-TSR-002" },
  { id: "M0073", name: "Faturoun Mwoyes", role: "Merchandiser", region: "South South", state: "Delta", lga: "Jendel Omitandum, Ota", territory: "Delta", route: "Jendel Omitandum, Ota", status: "Active", visits: 26, completion: 87, lat: 5.9569, lng: 6.2119, clientId: "client-a", parentId: "KEA-TSR-013" },

  // Port Harcourt Region - Merchandisers
  { id: "M0074", name: "Oladupe Bisadu", role: "Merchandiser", region: "Port Harcourt", state: "Rivers", lga: "M0015", territory: "Port Harcourt", route: "Market Square Ekenwan", status: "Active", visits: 27, completion: 88, lat: 4.7869, lng: 7.0319, clientId: "client-b", parentId: "KEA-TSR-011" },
  { id: "M0075", name: "Chillei Tony", role: "Merchandiser", region: "Port Harcourt", state: "Rivers", lga: "Market Square N/umrs/Hypericity City Eastern Bypass", territory: "Port Harcourt", route: "Market Square N/umrs/Hypericity City Eastern Bypass", status: "Active", visits: 28, completion: 89, lat: 4.7969, lng: 7.0419, clientId: "client-a", parentId: "KEA-TSR-011" },
  { id: "M0076", name: "Elizabeth Team Abejirn", role: "Merchandiser", region: "Port Harcourt", state: "Rivers", lga: "Market Square Subscription/Essence Needs Spar Supelam", territory: "Port Harcourt", route: "Market Square Subscription/Essence Needs Spar Supelam", status: "Active", visits: 26, completion: 87, lat: 4.8069, lng: 7.0519, clientId: "client-b", parentId: "KEA-TSR-011" },
  { id: "M0077", name: "Beauty D. Jackson", role: "Merchandiser", region: "Port Harcourt", state: "Rivers", lga: "Hypericity Isubu/Market Square Mile 3", territory: "Port Harcourt", route: "Hypericity Isubu/Market Square Mile 3", status: "Active", visits: 27, completion: 88, lat: 4.8169, lng: 7.0619, clientId: "client-a", parentId: "KEA-TSR-011" },
  { id: "M0078", name: "Emmeneuon Chyuanu", role: "Merchandiser", region: "Port Harcourt", state: "Rivers", lga: "ABA", territory: "Port Harcourt", route: "Market Square Aja Owerri Bid / Market Square Mile 4 Junction", status: "Active", visits: 28, completion: 89, lat: 4.8269, lng: 7.0719, clientId: "client-b", parentId: "KEA-TSR-011" },
  { id: "M0079", name: "Recycling", role: "Merchandiser", region: "Port Harcourt", state: "Rivers", lga: "CA/4-A&-", territory: "Port Harcourt", route: "Spar Calabar", status: "Active", visits: 26, completion: 87, lat: 4.8369, lng: 7.0819, clientId: "client-a", parentId: "KEA-TSR-011" },
  { id: "M0080", name: "Godell Nemesis", role: "Merchandiser", region: "Port Harcourt", state: "Rivers", lga: "Port Harcourt", territory: "Port Harcourt", route: "Goodsell Supermarket Peter (Old)", status: "Active", visits: 27, completion: 88, lat: 4.8469, lng: 7.0919, clientId: "client-b", parentId: "KEA-TSR-011" },
  { id: "M0081", name: "Eyegemi Sonia Adenle", role: "Merchandiser", region: "Port Harcourt", state: "Rivers", lga: "Port Harcourt", territory: "Port Harcourt", route: "White Choice Ise/Esh Welcome U Jseife", status: "Active", visits: 28, completion: 89, lat: 4.8569, lng: 7.1019, clientId: "client-a", parentId: "KEA-TSR-011" },
  { id: "M0082", name: "Monday Worthy", role: "Merchandiser", region: "Port Harcourt", state: "Rivers", lga: "Port Harcourt", territory: "Port Harcourt", route: "Wide Choice Chkade", status: "Active", visits: 26, completion: 87, lat: 4.8669, lng: 7.1119, clientId: "client-b", parentId: "KEA-TSR-011" },
  { id: "M0083", name: "Nancy Sunday Glory", role: "Merchandiser", region: "Port Harcourt", state: "Rivers", lga: "Port Harcourt", territory: "Port Harcourt", route: "Market Square Isae/S Goodness Supermarket", status: "Active", visits: 27, completion: 88, lat: 4.8769, lng: 7.1219, clientId: "client-a", parentId: "KEA-TSR-011" },

  // Owerri Region - Merchandisers
  { id: "M0084", name: "Chibuka Chinaemerem", role: "Merchandiser", region: "Owerri", state: "Imo", lga: "Owerri", territory: "Owerri", route: "Market Square GRA/Hypericity GRA", status: "Active", visits: 28, completion: 89, lat: 5.4869, lng: 7.0419, clientId: "client-b", parentId: "KEA-TSR-014" },
  { id: "M0085", name: "Ikebem Julius Ummei", role: "Merchandiser", region: "Owerri", state: "Imo", lga: "Kano", territory: "Owerri", route: "Nine store Kano", status: "Active", visits: 26, completion: 87, lat: 5.4969, lng: 7.0519, clientId: "client-a", parentId: "KEA-TSR-014" },
  { id: "M0086", name: "Nasama Umanan", role: "Merchandiser", region: "Owerri", state: "Imo", lga: "Koduno", territory: "Owerri", route: "Grand Square, Kano", status: "Active", visits: 27, completion: 88, lat: 5.5069, lng: 7.0619, clientId: "client-b", parentId: "KEA-TSR-014" },
  { id: "M0087", name: "Maryan Queen", role: "Merchandiser", region: "Owerri", state: "Imo", lga: "Market Square Rmuehuchee", territory: "Owerri", route: "Market Square Rmuehuchee", status: "Active", visits: 28, completion: 89, lat: 5.5169, lng: 7.0719, clientId: "client-a", parentId: "KEA-TSR-014" },
  { id: "M0088", name: "Adebayo D. Junier", role: "Merchandiser", region: "Owerri", state: "Imo", lga: "Port Harcourt", territory: "Owerri", route: "Spar Pheasil", status: "Active", visits: 26, completion: 87, lat: 5.5269, lng: 7.0819, clientId: "client-b", parentId: "KEA-TSR-014" },
  { id: "M0089", name: "Emmanuel Iteme", role: "Merchandiser", region: "Owerri", state: "Imo", lga: "Port Harcourt", territory: "Owerri", route: "Spar Pheasil", status: "Active", visits: 27, completion: 88, lat: 5.5369, lng: 7.0919, clientId: "client-a", parentId: "KEA-TSR-014" },
  { id: "M0090", name: "Blessing Fred Okunii", role: "Merchandiser", region: "Owerri", state: "Imo", lga: "Market Square Oguarri/Sugarland Rumudodar", territory: "Owerri", route: "Market Square Oguarri/Sugarland Rumudodar", status: "Active", visits: 28, completion: 89, lat: 5.5469, lng: 7.1019, clientId: "client-b", parentId: "KEA-TSR-014" },

  // Original records (VSR, TSR, Supervisor)
  { id: "KEA-1048", name: "Shittu Akinsanya", role: "VSR", region: "Lagos", state: "Lagos", lga: "Ikeja", territory: "Lagos Central", route: "Ikeja North", status: "On route", visits: 31, completion: 94, lat: 6.6018, lng: 3.3515, clientId: "client-a", photos: ["/samples/photo1.jpg"], parentId: "KEA-TSR-001" },
  { id: "KEA-1082", name: "Abel Nduka", role: "VSR", region: "Lagos", state: "Lagos", lga: "Surulere", territory: "Lagos West", route: "Surulere A2", status: "Active", visits: 28, completion: 91, lat: 6.4969, lng: 3.3532, clientId: "client-b", photos: ["/samples/photo2.jpg"], parentId: "KEA-TSR-001" },
  { id: "KEA-1103", name: "Maria Uchechukwu", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Eti-Osa", territory: "Lagos Island", route: "VI Retail", status: "Active", visits: 34, completion: 97, lat: 6.4281, lng: 3.4219, clientId: "client-a", photos: ["/samples/photo3.jpg"], parentId: "KEA-SUP-001" },
  { id: "KEA-1127", name: "Oluchukwu Onyeike", role: "Supervisor", region: "Lagos", state: "Lagos", lga: "Lagos Mainland", territory: "Lagos Central", route: "8 stores", status: "Active", visits: 29, completion: 88, lat: 6.6108, lng: 3.3605, clientId: "client-a", parentId: "KEA-TSR-001", childrenIds: ["KEA-MER-001", "KEA-MER-004"] },
  { id: "KEA-1164", name: "Paul Olakonipekun", role: "VSR", region: "Ogun", state: "Ogun", lga: "Abeokuta North", territory: "Abeokuta", route: "ABK North", status: "Needs review", visits: 18, completion: 63, lat: 7.1475, lng: 3.3619, clientId: "client-a", parentId: "KEA-TSR-002", photos: ["/samples/vsr3.jpg"] },
  { id: "KEA-1190", name: "Abubakar Hassan", role: "TSR", region: "Lagos", state: "Lagos", lga: "Ikeja", territory: "Lagos West", route: "4 teams", status: "Active", visits: 32, completion: 95, lat: 6.5049, lng: 3.3612, clientId: "client-a", childrenIds: ["KEA-SUP-001", "KEA-SUP-002", "KEA-VSR-001", "KEA-VSR-002"] },
  { id: "KEA-1206", name: "Ologbonori Toyosi", role: "Merchandiser", region: "Ogun", state: "Ogun", lga: "Ijebu Ode", territory: "Ijebu", route: "Ijebu Retail", status: "On route", visits: 26, completion: 86, lat: 6.82, lng: 3.9165, clientId: "client-b", parentId: "KEA-SUP-003", photos: ["/samples/photo4.jpg"] },
  { id: "KEA-1221", name: "Timothy Ogunmokun", role: "VSR", region: "Ogun", state: "Ogun", lga: "Abeokuta South", territory: "Abeokuta", route: "ABK South", status: "Inactive", visits: 12, completion: 48, lat: 7.1385, lng: 3.3529, clientId: "client-a", parentId: "KEA-TSR-002", photos: ["/samples/vsr4.jpg"] },
  { id: "KEA-1245", name: "Jonathan Okena", role: "Merchandiser", region: "Oyo", state: "Oyo", lga: "Ibadan North", territory: "Ibadan", route: "Ring Road", status: "Active", visits: 30, completion: 93, lat: 7.3776, lng: 3.947, clientId: "client-a", parentId: "KEA-SUP-001", photos: ["/samples/photo5.jpg", "/samples/photo6.jpg"] },
  { id: "KEA-1263", name: "Moses Akindiran", role: "Supervisor", region: "Lagos", state: "Lagos", lga: "Eti-Osa", territory: "Lagos East", route: "11 stores", status: "Active", visits: 27, completion: 89, lat: 6.455, lng: 3.545, clientId: "client-b", parentId: "KEA-TSR-001", childrenIds: ["KEA-MER-002", "KEA-MER-005"] },
  { id: "KEA-1281", name: "Ikechukwu Maduora", role: "VSR", region: "Delta", state: "Delta", lga: "Oshimili South", territory: "Asaba", route: "Asaba Core", status: "Needs review", visits: 16, completion: 59, lat: 6.1982, lng: 6.7319, clientId: "client-b", photos: ["/samples/vsr5.jpg"] },
  { id: "KEA-1309", name: "Arorundade Adewale", role: "Merchandiser", region: "Oyo", state: "Oyo", lga: "Ibadan North", territory: "Ibadan", route: "Dugbe Retail", status: "Active", visits: 33, completion: 96, lat: 7.3866, lng: 3.956, clientId: "client-a", parentId: "KEA-SUP-002", photos: ["/samples/photo7.jpg"] },
  { id: "KEA-1341", name: "Yusuf Abimbola Rasheed", role: "TSR", region: "Ogun", state: "Ogun", lga: "Abeokuta North", territory: "Abeokuta", route: "6 teams", status: "Active", visits: 30, completion: 92, lat: 7.156, lng: 3.371, clientId: "client-a", childrenIds: ["KEA-SUP-003", "KEA-VSR-003", "KEA-VSR-004"] },
  { id: "KEA-1367", name: "Abiola Felicia Omowuni", role: "Merchandiser", region: "Lagos", state: "Lagos", lga: "Lagos Island", territory: "Lagos Island", route: "Marina Retail", status: "Active", visits: 25, completion: 84, lat: 6.4381, lng: 3.4319, clientId: "client-b", parentId: "KEA-SUP-002", photos: ["/samples/photo3.jpg"] },
  { id: "KEA-1389", name: "Michael Olayiwola", role: "Supervisor", region: "Ogun", state: "Ogun", lga: "Ijebu Ode", territory: "Ijebu", route: "5 stores", status: "Active", visits: 24, completion: 82, lat: 6.83, lng: 3.9265, clientId: "client-b", parentId: "KEA-TSR-002", childrenIds: ["KEA-MER-003"] },
];

export const activityData = [
  { day: "01 Aug", visits: 682, checks: 750 }, { day: "04 Aug", visits: 735, checks: 798 },
  { day: "07 Aug", visits: 712, checks: 776 }, { day: "10 Aug", visits: 801, checks: 855 },
  { day: "13 Aug", visits: 772, checks: 842 }, { day: "16 Aug", visits: 848, checks: 916 },
  { day: "19 Aug", visits: 821, checks: 885 }, { day: "22 Aug", visits: 902, checks: 970 },
  { day: "25 Aug", visits: 878, checks: 944 }, { day: "28 Aug", visits: 942, checks: 1018 },
];

export const completionData = [
  { name: "Lagos", planned: 3240, completed: 2928 }, { name: "Ogun", planned: 1810, completed: 1582 },
  { name: "Oyo", planned: 1690, completed: 1501 }, { name: "South West", planned: 1240, completed: 1092 },
  { name: "South East", planned: 1180, completed: 1062 }, { name: "South South", planned: 1040, completed: 928 },
  { name: "North", planned: 940, completed: 835 }, { name: "Port Harcourt", planned: 860, completed: 774 },
  { name: "Owerri", planned: 780, completed: 702 }, { name: "Delta", planned: 430, completed: 344 },
];

export const roleData = [
  { name: "Merchandisers", value: 82, color: "#2563eb" }, { name: "VSRs", value: 96, color: "#14b8a6" },
  { name: "Supervisors", value: 28, color: "#f59e0b" }, { name: "TSRs", value: 14, color: "#8b5cf6" },
];

export type VsrFundingStatus = "Funded" | "Awaiting Funding" | "No Loan Required" | "Under Review - Risk & Compliance" | "Cleared by Risk & Compliance";

export type VsrTrackerRow = {
  id: number;
  fullName: string;
  vsrType: "New" | "Existing";
  status: VsrFundingStatus;
  notes: string;
  dateFunded: string;
  location: string;
  email: string;
  phone: string;
  priority: number;
  riskAlert: string;
};

export const vsrTrackerRows: VsrTrackerRow[] = [
  { id: 1, fullName: "Shittu Akinsanya", vsrType: "New", status: "Funded", notes: "RISK ALERT: Flagged for unaccountability of funds", dateFunded: "18-Jun-2026", location: "Lagos", email: "akinsanyahit9@gmail.com", phone: "08068779850, 08063463006", priority: 3, riskAlert: "DANGER - Fund Accountability" },
  { id: 2, fullName: "Abel Nduka", vsrType: "New", status: "Funded", notes: "", dateFunded: "15-Jun-2026", location: "Lagos", email: "abelnduka.thesalesmachine@gmail.com", phone: "", priority: 3, riskAlert: "" },
  { id: 3, fullName: "Maria Uchechukwu", vsrType: "New", status: "Funded", notes: "", dateFunded: "15-Jun-2026", location: "Lagos", email: "mariauchechukwu71@gmail.com", phone: "", priority: 3, riskAlert: "" },
  { id: 4, fullName: "Oluchukwu Onyeike", vsrType: "New", status: "Funded", notes: "", dateFunded: "15-Jun-2026", location: "Lagos", email: "oluchukwuonyeike@yahoo.com", phone: "", priority: 3, riskAlert: "" },
  { id: 5, fullName: "Oluwapelumi Oyeleke", vsrType: "New", status: "Funded", notes: "", dateFunded: "15-Jun-2026", location: "Lagos", email: "vickie_mccarter@yahoo.com", phone: "", priority: 3, riskAlert: "" },
  { id: 6, fullName: "Onifade Omoniyi Joseph", vsrType: "New", status: "Funded", notes: "", dateFunded: "15-Jun-2026", location: "Lagos", email: "onifade_omoniyi@yahoo.com", phone: "", priority: 3, riskAlert: "" },
  { id: 7, fullName: "Paul Olakonipekun", vsrType: "New", status: "Funded", notes: "", dateFunded: "15-Jun-2026", location: "Ogun (Abk)", email: "polakso1@gmail.com", phone: "", priority: 3, riskAlert: "" },
  { id: 8, fullName: "Matthew Olatunde Mobolaji", vsrType: "New", status: "Funded", notes: "", dateFunded: "22-Jun-2026", location: "Lagos", email: "matthewoladele2018@gmail.com", phone: "", priority: 3, riskAlert: "" },
  { id: 9, fullName: "Abubakar Hassan Olayiwola", vsrType: "Existing", status: "Funded", notes: "", dateFunded: "22-Jun-2026", location: "Lagos", email: "yomix002@gmail.com", phone: "", priority: 3, riskAlert: "" },
  { id: 10, fullName: "Ogunbona Kayode", vsrType: "New", status: "Funded", notes: "", dateFunded: "22-Jun-2026", location: "Lagos", email: "kayode.ogunbona@outlook.com", phone: "", priority: 3, riskAlert: "" },
  { id: 11, fullName: "Oke Semilogo Ayodeji", vsrType: "New", status: "Funded", notes: "", dateFunded: "22-Jun-2026", location: "Lagos", email: "okesemilog02@gmail.com", phone: "", priority: 3, riskAlert: "" },
  { id: 12, fullName: "Okoro Chibuzor", vsrType: "New", status: "Funded", notes: "", dateFunded: "22-Jun-2026", location: "Lagos", email: "ail4prosper@gmail.com", phone: "", priority: 3, riskAlert: "" },
  { id: 13, fullName: "Olanipekun Micheal", vsrType: "New", status: "Funded", notes: "", dateFunded: "22-Jun-2026", location: "Lagos", email: "olanipekunm9@gmail.com", phone: "", priority: 3, riskAlert: "" },
  { id: 14, fullName: "Ologbonori Toyosi", vsrType: "Existing", status: "Funded", notes: "", dateFunded: "23-Jun-2026", location: "Ogun (Ijebu)", email: "busolami14@gmail.com", phone: "", priority: 3, riskAlert: "" },
  { id: 15, fullName: "Adewale Friday", vsrType: "Existing", status: "Funded", notes: "", dateFunded: "25-Jun-2026", location: "Lagos", email: "adewalefrida05@gmail.com", phone: "", priority: 3, riskAlert: "" },
  { id: 16, fullName: "AKINSANMI OLUWAFEMI OLUWATADE", vsrType: "New", status: "Funded", notes: "", dateFunded: "26-Jul-2026", location: "Lagos", email: "tadepraise@gmail.com", phone: "", priority: 3, riskAlert: "" },
  { id: 17, fullName: "Babatunde Salami Ibrahim", vsrType: "New", status: "Funded", notes: "", dateFunded: "26-Jul-2026", location: "Lagos", email: "salamitunde3@gmail.com", phone: "080 2812 7295", priority: 3, riskAlert: "" },
  { id: 18, fullName: "Balogun Oyekan", vsrType: "New", status: "Funded", notes: "", dateFunded: "26-Jul-2026", location: "Ogun (Ijebu)", email: "", phone: "", priority: 3, riskAlert: "" },
  { id: 19, fullName: "Timothy Ogunmokun", vsrType: "New", status: "Funded", notes: "", dateFunded: "26-Jul-2026", location: "Abeokuta", email: "timothyogunmokun@yahoo.com", phone: "", priority: 3, riskAlert: "" },
  { id: 20, fullName: "Unuaro Francis", vsrType: "New", status: "Funded", notes: "", dateFunded: "26-Jul-2026", location: "Lagos", email: "francisunuaro@gmail.com", phone: "", priority: 3, riskAlert: "" },
  { id: 21, fullName: "Ezeoka Chima Emmanuel", vsrType: "New", status: "Funded", notes: "", dateFunded: "29-Jun-2026", location: "Lagos", email: "ezeokachi@gmail.com", phone: "", priority: 3, riskAlert: "" },
  { id: 22, fullName: "SODIQ AMINU SALE", vsrType: "New", status: "Funded", notes: "", dateFunded: "29-Jun-2026", location: "Lagos", email: "sadiqaminuhsm@gmail.com", phone: "", priority: 3, riskAlert: "" },
  { id: 23, fullName: "Jacob Izobo", vsrType: "New", status: "Funded", notes: "", dateFunded: "01-Jul-2026", location: "Lagos", email: "jacobizobo480@gmail.com", phone: "", priority: 3, riskAlert: "" },
  { id: 24, fullName: "Odion Nicolas Charles", vsrType: "New", status: "Funded", notes: "", dateFunded: "07-Jul-2026", location: "Lagos", email: "odionnicolasf82@gmail.com", phone: "08070748424", priority: 3, riskAlert: "" },
  { id: 25, fullName: "Yusuf Abimbola Rasheed", vsrType: "New", status: "Funded", notes: "", dateFunded: "7/26/2026", location: "Ogun", email: "", phone: "081 073 43185", priority: 3, riskAlert: "" },
  { id: 26, fullName: "Oyerogba Atoyebi", vsrType: "New", status: "Funded", notes: "", dateFunded: "31-Jul-2026", location: "Ibadan", email: "oyerogbaatoyebi@gmail.com", phone: "", priority: 3, riskAlert: "" },
  { id: 27, fullName: "Aragundade Sunday Adewale", vsrType: "New", status: "Funded", notes: "", dateFunded: "31-Jul-2026", location: "Ibadan", email: "adewaleg41@gmail.com", phone: "", priority: 3, riskAlert: "" },
  { id: 28, fullName: "Abegunde Francis", vsrType: "New", status: "Funded", notes: "", dateFunded: "31-Jul-2026", location: "Ibadan", email: "francistunde@gmail.com", phone: "", priority: 3, riskAlert: "" },
  { id: 29, fullName: "Jonathan Okena", vsrType: "New", status: "Funded", notes: "", dateFunded: "31-Jul-2026", location: "Ibadan", email: "jonathanokena@gmail.com", phone: "", priority: 3, riskAlert: "" },
  { id: 30, fullName: "Dugwu Ukamaka Chibuzor", vsrType: "New", status: "No Loan Required", notes: "", dateFunded: "", location: "Enugu", email: "dugwuukamachibuzo@gmail.com", phone: "", priority: 3, riskAlert: "" },
  { id: 31, fullName: "Ngwu Tochukwu Nathaniel", vsrType: "New", status: "Awaiting Funding", notes: "", dateFunded: "", location: "Enugu", email: "tochukwunathngwu@yahoo.com", phone: "", priority: 2, riskAlert: "" },
  { id: 32, fullName: "Nwoko Ikechi Obinna", vsrType: "New", status: "Awaiting Funding", notes: "", dateFunded: "", location: "Benin", email: "iykoskin@gmail.com", phone: "", priority: 2, riskAlert: "" },
  { id: 33, fullName: "Okoronkwo Joshua", vsrType: "New", status: "No Loan Required", notes: "", dateFunded: "", location: "Enugu", email: "jaskey4real@gmail.com", phone: "", priority: 3, riskAlert: "" },
  { id: 34, fullName: "Adediran Kehinde", vsrType: "New", status: "Awaiting Funding", notes: "", dateFunded: "", location: "Ibadan", email: "kehindededi@gmail.com", phone: "", priority: 2, riskAlert: "" },
  { id: 35, fullName: "Olorunsola Michael Adegboyega", vsrType: "New", status: "No Loan Required", notes: "", dateFunded: "", location: "Lagos", email: "olumike080@gmail.com", phone: "", priority: 3, riskAlert: "" },
  { id: 36, fullName: "Tiamiyu Peter Ayoade", vsrType: "New", status: "No Loan Required", notes: "Loan should not be provided to him", dateFunded: "", location: "Lagos", email: "peteriamiyu123@gmail.com", phone: "", priority: 3, riskAlert: "" },
  { id: 37, fullName: "Ajibade Wasiu Abiodun", vsrType: "New", status: "Awaiting Funding", notes: "", dateFunded: "", location: "Osogbo", email: "ajibadewasiu123@gmail.com", phone: "0703 004 4677 / 0806 247 7193", priority: 2, riskAlert: "" },
  { id: 38, fullName: "Babatunde Faluji", vsrType: "New", status: "Awaiting Funding", notes: "", dateFunded: "", location: "Ibadan", email: "", phone: "", priority: 2, riskAlert: "" },
  { id: 39, fullName: "Ifeanyichukwu Adesioya", vsrType: "New", status: "Awaiting Funding", notes: "", dateFunded: "", location: "Enugu", email: "rhymonchem@gmail.com", phone: "", priority: 2, riskAlert: "" },
  { id: 40, fullName: "Bamidele Tayo", vsrType: "New", status: "Cleared by Risk & Compliance", notes: "Cleared by risk on Wednesday, August 12th, 2026. Awaiting to be send for code approval", dateFunded: "", location: "Ibadan", email: "tayobamidele001@gmail.com", phone: "", priority: 2, riskAlert: "" },
  { id: 41, fullName: "Ubong Fabian Ukpakka", vsrType: "Existing", status: "No Loan Required", notes: "Fabian should provide his personal documents should provide a 2nd guarantor", dateFunded: "", location: "Lagos", email: "", phone: "09069927954", priority: 3, riskAlert: "" },
  { id: 42, fullName: "Ikechukwu Maduora", vsrType: "New", status: "Under Review - Risk & Compliance", notes: "Sent to Risk on Monday 27th July, 2026. Sent A follow-up email on Saturday, August 8, 2026", dateFunded: "", location: "Asaba", email: "maduoraike@gmail.com", phone: "090 69696427", priority: 2, riskAlert: "" },
  { id: 43, fullName: "Moses Akindiran Akinloye", vsrType: "New", status: "Cleared by Risk & Compliance", notes: "Cleared by risk on Wednesday, August 12th, 2026. Awaiting to be send for code approval", dateFunded: "", location: "Lagos", email: "mozez007@gmail.com", phone: "08035191890", priority: 2, riskAlert: "" },
  { id: 44, fullName: "Edward Olamilekan", vsrType: "New", status: "Cleared by Risk & Compliance", notes: "Cleared by risk on Wednesday, August 12th, 2026. Awaiting to be send for code approval", dateFunded: "", location: "Lagos", email: "oadewale066@gmail.com", phone: "081 622 58096", priority: 2, riskAlert: "" },
  { id: 45, fullName: "Matimotu Stephen Obasayo", vsrType: "New", status: "Awaiting Funding", notes: "Waiting for his document (one month field induction with an experiences vsr / tsr before creation of account.)", dateFunded: "", location: "Lagos", email: "stephenmattimzfolarin@gmail.com", phone: "08122305714", priority: 2, riskAlert: "" },
  { id: 46, fullName: "ABDULIELI TIAMIYU", vsrType: "New", status: "Awaiting Funding", notes: "Territory Sales Representative (Yet to send Him Off Letter)", dateFunded: "", location: "Ibadan", email: "tiamiyuabduliejili13@gmail.com", phone: "08064910834", priority: 2, riskAlert: "" },
  { id: 47, fullName: "Abiola Felicia Omowuni", vsrType: "New", status: "Funded", notes: "Felicia should provide her application form for review", dateFunded: "01-Aug-2026", location: "Lagos", email: "okunola_bila@yahoo.com", phone: "08060364542", priority: 3, riskAlert: "" },
  { id: 48, fullName: "Michael Olayiwola Oluwaseun", vsrType: "New", status: "Funded", notes: "", dateFunded: "", location: "Lagos", email: "olaiyiwola120@gmail.com", phone: "080 66655555", priority: 3, riskAlert: "" },
  { id: 49, fullName: "Kehinde Olasunkanmi", vsrType: "New", status: "Awaiting Funding", notes: "", dateFunded: "", location: "Lagos", email: "", phone: "", priority: 2, riskAlert: "" },
  { id: 50, fullName: "Samuel Adebayo", vsrType: "New", status: "Awaiting Funding", notes: "", dateFunded: "", location: "Lagos", email: "", phone: "", priority: 2, riskAlert: "" }
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
  { label: "Performance", path: "/performance", icon: BarChart3 },
  { label: "Hierarchy", path: "/hierarchy", icon: Layers },
  { label: "Activities", path: "/activities", icon: Activity },
  { label: "Data Quality", path: "/data-quality", icon: ShieldCheck },
  { label: "Audit Trail", path: "/audit-trail", icon: Search },
  { label: "Client portal", path: "/client-portal", icon: Building2 },
];

export function activeNavLabel(pathname: string): string {
  return NAV.find((n) => n.path === pathname)?.label ?? "Overview";
}
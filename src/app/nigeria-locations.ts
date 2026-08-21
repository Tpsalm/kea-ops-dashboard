export type NigeriaLocation = {
  name: string;
  region: string;
  type: "Territory hub" | "Store" | "Route stop";
  lat: number;
  lng: number;
  staff: number;
  stores: number;
  coverage: number;
  address: string;
  lead: string;
  status: "Active" | "Attention";
};

export const nigeriaLocations: NigeriaLocation[] = [
  { name: "Ikeja Operations Hub", region: "Lagos", type: "Territory hub", lat: 6.60184, lng: 3.35149, staff: 98, stores: 306, coverage: 92, address: "Obafemi Awolowo Way, Ikeja, Lagos", lead: "Shittu Akinsanya", status: "Active" },
  { name: "Victoria Island Retail Cluster", region: "Lagos", type: "Store", lat: 6.42806, lng: 3.42194, staff: 82, stores: 258, coverage: 89, address: "Akin Adesola Street, Victoria Island, Lagos", lead: "Maria Uchechukwu", status: "Active" },
  { name: "Surulere Route A2", region: "Lagos", type: "Route stop", lat: 6.49686, lng: 3.35321, staff: 44, stores: 148, coverage: 94, address: "Bode Thomas Street, Surulere, Lagos", lead: "Abel Nduka", status: "Active" },
  { name: "Abeokuta North Hub", region: "Ogun", type: "Territory hub", lat: 7.14750, lng: 3.36190, staff: 61, stores: 195, coverage: 81, address: "Lalubu Street, Oke-Ilewo, Abeokuta, Ogun", lead: "Paul Olakonipekun", status: "Attention" },
  { name: "Ijebu Ode Retail Route", region: "Ogun", type: "Route stop", lat: 6.82000, lng: 3.91646, staff: 44, stores: 132, coverage: 86, address: "Folagbade Street, Ijebu Ode, Ogun", lead: "Ologbonori Toyosi", status: "Active" },
  { name: "Ibadan Ring Road Cluster", region: "Oyo", type: "Store", lat: 7.37756, lng: 3.94704, staff: 74, stores: 221, coverage: 88, address: "MKO Abiola Way, Ring Road, Ibadan, Oyo", lead: "Jonathan Okena", status: "Active" },
  { name: "Asaba Core Route", region: "Delta", type: "Route stop", lat: 6.19824, lng: 6.73187, staff: 31, stores: 96, coverage: 73, address: "Nnebisi Road, Asaba, Delta", lead: "Ikechukwu Maduora", status: "Attention" },
];

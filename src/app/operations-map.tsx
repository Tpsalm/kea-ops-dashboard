"use client";

import { useEffect, useMemo, useRef } from "react";
import L, { type Map as LeafletMap } from "leaflet";
import { MapContainer, Marker, Polyline, Popup, ScaleControl, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { nigeriaLocations, type NigeriaLocation } from "./nigeria-locations";
import { allStaff } from "./hierarchy-data";
export { nigeriaLocations };
export type { NigeriaLocation };

export type StaffPoint = {
  id: string; name: string; role: "VSR" | "TSR" | "Supervisor" | "Merchandiser";
  region: string; territory: string; route: string; status: string;
  visits: number; completion: number; lat: number; lng: number;
  parentId?: string;
  childrenIds?: string[];
};

// Role → colour mapping (matches the workforce donut chart).
const ROLE_COLORS: Record<StaffPoint["role"], string> = {
  VSR: "#2563eb",           // blue
  Merchandiser: "#14b8a6",  // teal
  Supervisor: "#f59e0b",    // amber
  TSR: "#8b5cf6",           // violet
};

const routeGroups = [
  [nigeriaLocations[2], nigeriaLocations[0], nigeriaLocations[1]],
  [nigeriaLocations[3], nigeriaLocations[4], nigeriaLocations[5]],
].map(group => group.map(point => [point.lat, point.lng] as [number, number]));

/**
 * Spread markers that share the same (or very close) coordinates into a small
 * circle around their shared centre so every pin is individually visible and
 * clickable. Groups points that fall within ~1.1 km of each other.
 */
function spreadCoincidentPoints(points: StaffPoint[]): Map<string, [number, number]> {
  const groups = new Map<string, StaffPoint[]>();
  points.forEach(p => {
    // 0.01° ~= 1.1 km — big enough to catch same-territory duplicates.
    const key = `${p.lat.toFixed(2)},${p.lng.toFixed(2)}`;
    const list = groups.get(key);
    if (list) list.push(p);
    else groups.set(key, [p]);
  });

  const result = new Map<string, [number, number]>();
  groups.forEach(group => {
    if (group.length === 1) {
      result.set(group[0].id, [group[0].lat, group[0].lng]);
      return;
    }
    // Radius grows slightly with group size so ring never feels cramped.
    const radius = 0.006 + group.length * 0.0008; // ~700m base + growth
    const centerLat = group.reduce((s, p) => s + p.lat, 0) / group.length;
    const centerLng = group.reduce((s, p) => s + p.lng, 0) / group.length;
    group.forEach((p, i) => {
      const angle = (2 * Math.PI * i) / group.length - Math.PI / 2;
      result.set(p.id, [
        centerLat + radius * Math.cos(angle),
        centerLng + radius * Math.sin(angle) * 1.1, // slight ellipse for readability
      ]);
    });
  });
  return result;
}

// Keeps Leaflet's tile canvas in sync with the container size.
function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const invalidate = () => map.invalidateSize({ animate: false });
    const timers = [50, 200, 500, 1000, 2000].map(delay => window.setTimeout(invalidate, delay));
    const observer = new ResizeObserver(invalidate);
    observer.observe(el);
    window.addEventListener("resize", invalidate);
    window.addEventListener("orientationchange", invalidate);
    document.addEventListener("visibilitychange", invalidate);
    return () => {
      timers.forEach(window.clearTimeout);
      observer.disconnect();
      window.removeEventListener("resize", invalidate);
      window.removeEventListener("orientationchange", invalidate);
      document.removeEventListener("visibilitychange", invalidate);
    };
  }, [map]);
  return null;
}

// Fits the map to whichever markers are currently visible.
function MapTracker({ positions, focusIndex }: { positions: [number, number][]; focusIndex: number }) {
  const map = useMap();
  const prevKey = useRef<string>("");
  useEffect(() => {
    if (!positions.length) return;
    const focus = positions[focusIndex] ?? positions[0];
    const key = positions.map(p => p.join(",")).join("|") + "→" + focus.join(",");
    if (key === prevKey.current) return;
    prevKey.current = key;
    const timer = window.setTimeout(() => {
      map.invalidateSize({ animate: false });
      if (positions.length === 1) {
        map.flyTo(positions[0], 12, { duration: 0.9 });
      } else {
        const bounds = L.latLngBounds(positions);
        map.flyToBounds(bounds.pad(0.28), { duration: 0.9, maxZoom: 11 });
      }
    }, 80);
    return () => window.clearTimeout(timer);
  }, [positions, focusIndex, map]);
  return null;
}

function staffIcon(role: StaffPoint["role"], selected: boolean) {
  const color = ROLE_COLORS[role];
  return L.divIcon({
    className: "kea-map-marker-wrap",
    html: `<span class="kea-map-marker${selected ? " selected" : ""}" style="--marker:${color}"><i></i></span>`,
    iconSize: [26, 34],
    iconAnchor: [13, 32],
    popupAnchor: [0, -31],
  });
}

export interface VSRRoute {
  vsrId: string;
  vsrName: string;
  routeName: string;
  territory: string;
  coordinates: [number, number][];
  stores: string[];
}

export interface OperationsMapProps {
  staff: StaffPoint[];
  selected: number;
  onSelect: (index: number) => void;
  region: string;
  role: string;
  viewMode?: "all" | "vsr-routes" | "merchandiser-stores" | "supervisor-team" | "tsr-territory";
  selectedStaffId?: string;
  vsrRoutes?: VSRRoute[];
}

export default function OperationsMap({
  staff,
  selected,
  onSelect,
  region,
  role,
  viewMode = "all",
  selectedStaffId,
  vsrRoutes = [],
}: OperationsMapProps) {
  const filtered = staff
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => (region === "All regions" || s.region === region))
    .filter(({ s }) => (role === "All roles" || s.role === role));
  const visible = filtered;

  if (!visible.length) {
    return <div className="map-placeholder"><strong>No matching locations</strong><small>Try a different region or role filter.</small></div>;
  }

  // Spread coincident coordinates so every staff pin is separately visible.
  const spread = useMemo(
    () => spreadCoincidentPoints(visible.map(v => v.s)),
    [visible]
  );
  const positions: [number, number][] = visible.map(v => spread.get(v.s.id)!);

  const focusIndex = Math.max(0, visible.findIndex(v => v.i === selected));
  const current = visible[focusIndex]?.s ?? visible[0].s;
  const currentPos = positions[focusIndex] ?? positions[0];
  const mapRef = useRef<LeafletMap | null>(null);

  const roleCounts: Record<StaffPoint["role"], number> = { VSR: 0, Merchandiser: 0, Supervisor: 0, TSR: 0 };
  visible.forEach(({ s }) => { roleCounts[s.role] += 1; });

  // Get selected staff for role-specific views
  const selectedStaff = useMemo(() => {
    if (!selectedStaffId) return null;
    return allStaff.find(s => s.id === selectedStaffId) ?? null;
  }, [selectedStaffId]);

  return (
    <div className="real-map-shell">
      <MapContainer
        ref={mapRef}
        center={currentPos}
        zoom={viewMode === "vsr-routes" && selectedStaff?.role === "VSR" ? 12 : 7}
        minZoom={5}
        maxZoom={18}
        scrollWheelZoom
        className="leaflet-map"
        zoomControl
        preferCanvas={false}
      >
        {/* CartoDB Positron — CORS-friendly, reliable, clean design.
            Works consistently in sandbox and production environments. */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        {/* VSR Route Visualization */}
        {viewMode === "vsr-routes" && selectedStaff?.role === "VSR" && vsrRoutes.length > 0 && (
          <>
            {vsrRoutes.map((route, index) => (
              <Polyline
                key={route.vsrId}
                positions={route.coordinates}
                pathOptions={{ 
                  color: ROLE_COLORS.VSR, 
                  weight: 4, 
                  opacity: 0.7, 
                  dashArray: "10 5",
                  lineCap: "round",
                  lineJoin: "round"
                }}
              />
            ))}
            {/* Route start/end markers */}
            {vsrRoutes.map((route) => (
              <>
                <Marker key={`${route.vsrId}-start`} position={route.coordinates[0]}>
                  <Tooltip direction="top" offset={[0, -30]} opacity={0.95}>
                    Route Start: {route.routeName}
                  </Tooltip>
                  <Popup minWidth={200}>
                    <div className="leaflet-popup-card">
                      <small style={{ color: ROLE_COLORS.VSR }}>VSR Route</small>
                      <strong>{route.vsrName}</strong>
                      <p>Route: {route.routeName}</p>
                      <p>Territory: {route.territory}</p>
                      <p>Stops: {route.coordinates.length}</p>
                    </div>
                  </Popup>
                </Marker>
                <Marker key={`${route.vsrId}-end`} position={route.coordinates[route.coordinates.length - 1]}>
                  <Tooltip direction="top" offset={[0, -30]} opacity={0.95}>
                    Route End: {route.routeName}
                  </Tooltip>
                </Marker>
              </>
            ))}
          </>
        )}

        {/* Merchandiser Store Markers - Show exact store locations */}
        {viewMode === "merchandiser-stores" && selectedStaff?.role === "Merchandiser" && (
          <>
            {/* Stores will be passed as additional markers - handled by parent */}
          </>
        )}

        {/* Supervisor Team Markers */}
        {viewMode === "supervisor-team" && selectedStaff?.role === "Supervisor" && (
          <>
            {/* Team member markers will be added by parent */}
          </>
        )}

        {/* TSR Territory Coverage */}
        {viewMode === "tsr-territory" && selectedStaff?.role === "TSR" && (
          <>
            {/* Territory boundary polygon could be added here */}
          </>
        )}

        {/* Default route groups for overview */}
        {viewMode === "all" && routeGroups.map((route, index) => (
          <Polyline
            key={index}
            positions={route}
            pathOptions={{ color: index ? "#14b8a6" : "#2563eb", weight: 2, opacity: 0.4, dashArray: "6 6" }}
          />
        ))}

        {/* Staff Markers */}
        {visible.map(({ s, i }, arrIndex) => (
          <Marker
            key={s.id}
            position={positions[arrIndex]}
            icon={staffIcon(s.role, selected === i)}
            eventHandlers={{ click: () => onSelect(i) }}
            riseOnHover
          >
            <Tooltip direction="top" offset={[0, -30]} opacity={0.95}>
              {s.name} · {s.role}
            </Tooltip>
            <Popup minWidth={230}>
              <div className="leaflet-popup-card">
                <small style={{ color: ROLE_COLORS[s.role] }}>{s.role} · {s.status}</small>
                <strong>{s.name}</strong>
                <p>{s.territory}, {s.region}</p>
                <code>{s.lat.toFixed(5)}° N, {s.lng.toFixed(5)}° E</code>
                <div>
                  <span><b>{s.visits}</b> Visits</span>
                  <span><b>{s.completion}%</b> Completion</span>
                </div>
                <p>Assignment: <b>{s.route}</b> · ID: <b>{s.id}</b></p>
              </div>
            </Popup>
          </Marker>
        ))}

        <MapResizeHandler />
        <MapTracker positions={positions} focusIndex={focusIndex} />
        <ScaleControl position="bottomleft" imperial={false} />
      </MapContainer>

      <div className="map-role-legend" role="list" aria-label="Map role legend">
        {(Object.keys(ROLE_COLORS) as Array<StaffPoint["role"]>).map(r => (
          <span key={r} role="listitem" className={roleCounts[r] === 0 ? "muted" : ""}>
            <i style={{ background: ROLE_COLORS[r] }} />
            {r} <b>{roleCounts[r]}</b>
          </span>
        ))}
      </div>

      <div className="map-coordinate-panel">
        <span className="gps-state" style={{ background: ROLE_COLORS[current.role] + "22", color: ROLE_COLORS[current.role] }}>
          {current.role.toUpperCase()}
        </span>
        <b>{current.name}</b>
        <code>{current.lat.toFixed(5)}° N &nbsp; {current.lng.toFixed(5)}° E</code>
        <small>{current.territory}, {current.region} · {current.route}</small>
      </div>
      <div className="live-map-badge"><i /> LIVE · {visible.length} STAFF ON MAP</div>
    </div>
  );
}
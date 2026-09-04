import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import PriorityBadge from '../complaint/PriorityBadge';
import StatusBadge from '../complaint/StatusBadge';
import { ExternalLink, Flame, ShieldAlert, MapPin, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

// Custom Map Controller to smoothly pan & zoom when center/coordinates change
function MapViewUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Create custom HTML bubble pin for geographic regions
const createRegionBubbleIcon = (name, count, alertLevel = 'NORMAL', alertColor = '#10b981') => {
  const isCritical = alertLevel === 'CRITICAL';

  return L.divIcon({
    className: 'custom-region-bubble-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        ${
          isCritical
            ? `<div style="
              position: absolute;
              top: 0;
              width: 48px;
              height: 48px;
              border-radius: 50%;
              background: rgba(239, 68, 68, 0.4);
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>`
            : ''
        }
        <div style="
          position: relative;
          background: ${alertColor};
          color: white;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 14px rgba(0,0,0,0.35);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          line-height: 1;
        ">
          <span>${count}</span>
        </div>
        <div style="
          margin-top: 4px;
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(4px);
          color: white;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          border: 1px solid rgba(255,255,255,0.2);
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          pointer-events: none;
        ">
          ${name}
        </div>
      </div>
    `,
    iconSize: [50, 70],
    iconAnchor: [25, 25],
    popupAnchor: [0, -30]
  });
};

// Create pinpoint icon for individual complaints at leaf zoom
const createComplaintMarker = (priority) => {
  const colors = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#f59e0b',
    LOW: '#10b981'
  };
  const pinColor = colors[priority] || '#f59e0b';

  return L.divIcon({
    className: 'custom-leaf-pin',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        background: ${pinColor};
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
  });
};

const HierarchicalProblemMap = ({
  center = [16.5787, 82.0061], // Default: Konaseema / Amalapuram
  zoom = 10,
  childRegions = [],
  individualComplaints = [],
  onSelectRegion,
  height = 'h-[620px]'
}) => {
  const hasChildRegions = childRegions.length > 0;

  return (
    <div className={`w-full ${height} rounded-2xl overflow-hidden shadow-md border border-slate-200 relative bg-slate-100`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewUpdater center={center} zoom={zoom} />

        {/* 1. Render Child Region Bubble Clusters if available */}
        {hasChildRegions &&
          childRegions.map((child) => {
            if (!child.coordinates || child.coordinates.lat == null || child.coordinates.lng == null) {
              return null;
            }

            const icon = createRegionBubbleIcon(
              child.displayName || child.name,
              child.totalProblems,
              child.alertLevel,
              child.alertColor
            );

            return (
              <Marker
                key={child._id}
                position={[child.coordinates.lat, child.coordinates.lng]}
                icon={icon}
                eventHandlers={{
                  click: () => onSelectRegion?.(child._id)
                }}
              >
                <Popup className="custom-region-popup">
                  <div className="p-1 min-w-[180px]">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 block">
                      {child.type?.replace(/_/g, ' ')}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900 mt-0.5">
                      {child.displayName || child.name}
                    </h4>

                    <div className="mt-2 py-1 px-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Active Problems:</span>
                      <span className="font-bold text-slate-900">{child.activeProblems}</span>
                    </div>

                    <div className="mt-1 py-1 px-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Alert Level:</span>
                      <span className="font-bold" style={{ color: child.alertColor }}>
                        {child.alertLabel}
                      </span>
                    </div>

                    <button
                      onClick={() => onSelectRegion?.(child._id)}
                      className="w-full mt-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition"
                    >
                      Drill Down →
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* 2. Render Individual Leaf Complaints when no child regions or at deep level */}
        {!hasChildRegions &&
          individualComplaints.map((item) => {
            if (!item.location?.coordinates || item.location.coordinates.length !== 2) return null;
            const [lon, lat] = item.location.coordinates;
            const icon = createComplaintMarker(item.priority);

            return (
              <Marker key={item._id} position={[lat, lon]} icon={icon}>
                <Popup>
                  <div className="w-56 p-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-slate-400">{item.complaintId}</span>
                      <PriorityBadge priority={item.priority} size="xs" />
                    </div>
                    <h4 className="font-bold text-xs text-slate-900">{item.title || item.categoryName}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.address}</p>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <StatusBadge status={item.status} size="xs" />
                      <Link
                        to={`/complaints/${item._id}`}
                        target="_blank"
                        className="text-emerald-600 font-bold hover:underline"
                      >
                        Details →
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-400 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl p-3 shadow-lg max-w-xs text-xs">
        <h5 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span>Geographic Alert Thresholds</span>
        </h5>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600 font-medium">Normal (0–4)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-600 font-medium">Watch (5–9)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-slate-600 font-medium">High (10–19)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-slate-600 font-medium">Critical (20+)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HierarchicalProblemMap;

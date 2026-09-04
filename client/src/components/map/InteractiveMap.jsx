import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import PriorityBadge from '../complaint/PriorityBadge';
import StatusBadge from '../complaint/StatusBadge';

// Helper to create color-coded map pins for different priorities
const createPriorityMarker = (priority) => {
  const colors = {
    CRITICAL: '#e11d48',
    HIGH: '#ea580c',
    MEDIUM: '#d97706',
    LOW: '#059669'
  };

  const pinColor = colors[priority] || colors.MEDIUM;
  const isCritical = priority === 'CRITICAL';

  return L.divIcon({
    className: 'custom-priority-pin',
    html: `
      <div style="position: relative; width: 32px; height: 32px;">
        ${isCritical ? `<div style="
          position: absolute;
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          background: rgba(225, 29, 72, 0.4);
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>` : ''}
        <div style="
          position: relative;
          background: ${pinColor};
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const InteractiveMap = ({ complaints = [], center = [12.9716, 77.5946], zoom = 13, height = 'h-[600px]' }) => {
  return (
    <div className={`w-full ${height} rounded-2xl overflow-hidden shadow-md border border-slate-200 relative`}>
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

        {complaints.map((item) => {
          if (!item.location || !item.location.coordinates || item.location.coordinates.length !== 2) {
            return null;
          }
          const [lon, lat] = item.location.coordinates;
          const markerIcon = createPriorityMarker(item.priority);

          return (
            <Marker key={item._id} position={[lat, lon]} icon={markerIcon}>
              <Popup className="custom-complaint-popup">
                <div className="w-64 p-1">
                  {item.image && (
                    <div className="w-full h-28 rounded-lg overflow-hidden mb-2 bg-slate-100">
                      <img
                        src={item.image}
                        alt={item.categoryName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-500">{item.complaintId}</span>
                    <PriorityBadge priority={item.priority} size="xs" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{item.categoryName}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.address}</p>
                  
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <StatusBadge status={item.status} size="xs" />
                    <Link
                      to={`/complaints/${item.complaintId || item._id}`}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      View Issue →
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default InteractiveMap;

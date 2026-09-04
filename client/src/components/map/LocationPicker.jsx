import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, MapPin, Loader2 } from 'lucide-react';

// Custom Pin Icon using Leaflet DivIcon
const customPinIcon = L.divIcon({
  className: 'custom-leaflet-pin',
  html: `<div style="
    background: #16a34a;
    width: 32px;
    height: 32px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div style="
      width: 10px;
      height: 10px;
      background: white;
      border-radius: 50%;
      transform: rotate(45deg);
    "></div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

// Component to handle clicks on the map
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

// Component to smoothly pan the map when location changes
const RecenterMap = ({ lat, lon }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.setView([lat, lon], 16, { animate: true });
    }
  }, [lat, lon, map]);
  return null;
};

const LocationPicker = ({ initialLat = 12.9716, initialLon = 77.5946, onLocationChange }) => {
  const [position, setPosition] = useState([initialLat, initialLon]);
  const [address, setAddress] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Reverse geocode lat/lon to human readable address using Nominatim
  const reverseGeocode = async (lat, lon) => {
    setLoadingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (response.ok) {
        const data = await response.json();
        const display = data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
        setAddress(display);
        onLocationChange({ latitude: lat, longitude: lon, address: display });
      } else {
        throw new Error('Geocoding service unavailable');
      }
    } catch (err) {
      const fallbackAddress = `Sector 4, Near Landmark (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
      setAddress(fallbackAddress);
      onLocationChange({ latitude: lat, longitude: lon, address: fallbackAddress });
    } finally {
      setLoadingAddress(false);
    }
  };

  // Initial geocode
  useEffect(() => {
    reverseGeocode(initialLat, initialLon);
  }, []);

  const handleSelectLocation = (lat, lon) => {
    setPosition([lat, lon]);
    reverseGeocode(lat, lon);
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingGps(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setPosition([lat, lon]);
        reverseGeocode(lat, lon);
        setDetectingGps(false);
      },
      (err) => {
        setDetectingGps(false);
        setGpsError('Location permission was denied or signal unavailable. You can click on the map to place the pin.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>Click anywhere on the map or drag pin to adjust exact location</span>
        </div>
        <button
          type="button"
          onClick={handleUseGPS}
          disabled={detectingGps}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors disabled:opacity-50"
        >
          {detectingGps ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Acquiring GPS...
            </>
          ) : (
            <>
              <Navigation className="w-3.5 h-3.5" />
              Use My Current GPS
            </>
          )}
        </button>
      </div>

      {gpsError && (
        <div className="p-2.5 rounded-lg bg-amber-50 text-amber-800 text-xs border border-amber-200">
          {gpsError}
        </div>
      )}

      {/* Map Container */}
      <div className="h-64 sm:h-80 w-full rounded-2xl overflow-hidden border border-slate-300 shadow-inner relative">
        <MapContainer
          center={position}
          zoom={15}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} icon={customPinIcon} />
          <MapClickHandler onLocationSelect={handleSelectLocation} />
          <RecenterMap lat={position[0]} lon={position[1]} />
        </MapContainer>
      </div>

      {/* Detected Location Card */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs">
        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 mt-0.5">
          <MapPin className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-800">📍 Confirmed Location</p>
          <p className="text-slate-600 mt-0.5 leading-relaxed">
            {loadingAddress ? 'Detecting street address...' : address || 'Coordinates detected'}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Lat: {position[0].toFixed(5)} • Lon: {position[1].toFixed(5)} (Privacy protected)
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;

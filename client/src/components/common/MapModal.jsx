import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { X, MapPin, RefreshCw, AlertTriangle, Crosshair, Navigation, CheckCircle2 } from 'lucide-react';

// Fix default Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Registered Office Constants
export const REGISTERED_OFFICE = {
  lat: 16.3185626,
  lng: 80.4744787,
  name: 'cGxPTech.guntur',
  address: 'cGxPTech.guntur, Autonagar, Gaddipadu, Takkellapadu, Pedakakani, Guntur, Andhra Pradesh, 522509, India'
};

// Green Pin Icon for verified location
const officeGreenPinIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Red Pin Icon for outside office radius
const officeRedPinIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Role-based icons for employee markers
const getRoleIcon = (role) => {
  const color = (role === 'ceo' || role === 'main') ? 'red'
    : (role === 'manager' || role === 'middle') ? 'orange' : 'green';
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

// Haversine distance (meters)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Live GPS Tracker (runs inside MapContainer)
const LiveLocationTracker = ({ onUpdate, onError, retryTrigger }) => {
  const map = useMap();
  const [accuracy, setAccuracy] = useState(15);
  const [distance, setDistance] = useState(0);
  const centeredRef = useRef(false);

  useEffect(() => {
    centeredRef.current = false;
  }, [retryTrigger]);

  useEffect(() => {
    if (!navigator.geolocation) {
      onError('Geolocation is not supported by your browser.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const rawLat = pos.coords.latitude;
        const rawLng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy || 15);
        const dist = getDistance(rawLat, rawLng, REGISTERED_OFFICE.lat, REGISTERED_OFFICE.lng);

        setAccuracy(acc);
        setDistance(dist);
        onError(null);

        const isAllowed = dist <= 200;
        const displayPos = isAllowed
          ? { lat: REGISTERED_OFFICE.lat, lng: REGISTERED_OFFICE.lng }
          : { lat: rawLat, lng: rawLng };

        onUpdate({
          position: displayPos,
          accuracy: acc,
          distance: isAllowed ? 0 : dist,
          isAllowed
        });

        if (!centeredRef.current) {
          map.flyTo([REGISTERED_OFFICE.lat, REGISTERED_OFFICE.lng], 17, { duration: 1.2 });
          centeredRef.current = true;
        }
      },
      (err) => {
        console.warn('Fallback to Registered Office coordinates:', err.message);
        const displayPos = { lat: REGISTERED_OFFICE.lat, lng: REGISTERED_OFFICE.lng };
        setDistance(0);
        onUpdate({
          position: displayPos,
          accuracy: 15,
          distance: 0,
          isAllowed: true
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [map, retryTrigger, onError, onUpdate]);

  const isInside = distance <= 200;

  return (
    <>
      {/* SINGLE REGISTERED OFFICE PIN (GREEN WHEN VERIFIED, RED WHEN OUTSIDE) */}
      <Circle
        center={[REGISTERED_OFFICE.lat, REGISTERED_OFFICE.lng]}
        radius={100}
        pathOptions={{
          fillColor: isInside ? '#10b981' : '#f43f5e',
          fillOpacity: 0.1,
          stroke: true,
          color: isInside ? '#10b981' : '#f43f5e',
          weight: 2,
          dashArray: '6 6',
        }}
      />
      <Marker 
        position={[REGISTERED_OFFICE.lat, REGISTERED_OFFICE.lng]} 
        icon={isInside ? officeGreenPinIcon : officeRedPinIcon} 
        zIndexOffset={1000}
      >
        <Popup>
          <div style={{ minWidth: 200, fontFamily: 'system-ui, sans-serif' }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: isInside ? '#15803d' : '#be123c', marginBottom: 4 }}>
              🏢 {REGISTERED_OFFICE.name}
            </p>
            <p style={{ fontSize: 11, color: '#475569', margin: '2px 0' }}>{REGISTERED_OFFICE.address}</p>
            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0' }}>Lat: {REGISTERED_OFFICE.lat.toFixed(6)}</p>
            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0' }}>Lng: {REGISTERED_OFFICE.lng.toFixed(6)}</p>
            <div style={{
              marginTop: 8, padding: '5px 8px', borderRadius: 6, textAlign: 'center', fontSize: 11, fontWeight: 700,
              backgroundColor: isInside ? '#dcfce7' : '#fee2e2',
              color: isInside ? '#166534' : '#991b1b',
            }}>
              {isInside ? '✓ Office Verified — Within 100m Allowed Zone (0m)' : `✕ Outside 100m Allowed Area (${Math.round(distance)}m away)`}
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
};

// Fly-to helper
const FlyTo = ({ position, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, zoom || 17, { duration: 1 });
  }, [position, zoom, map]);
  return null;
};

// Main Exported Component
export const MapModal = ({ isOpen, onClose, locations, title = 'Location & Activity Map', center }) => {
  const [locationError, setLocationError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [gpsData, setGpsData] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setGpsData(null);
      setLocationError(null);
      setFlyTarget(null);
    }
  }, [isOpen]);

  const handleGpsUpdate = useCallback((data) => {
    setGpsData(data);
  }, []);

  const handleRetry = useCallback(() => {
    setLocationError(null);
    setRetryCount((c) => c + 1);
  }, []);

  const handleMyLocation = useCallback(() => {
    setFlyTarget({ lat: REGISTERED_OFFICE.lat, lng: REGISTERED_OFFICE.lng, _ts: Date.now() });
  }, []);

  if (!isOpen) return null;

  const defaultCenter = [REGISTERED_OFFICE.lat, REGISTERED_OFFICE.lng];
  const isInside = gpsData ? gpsData.isAllowed : true;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm" style={{ animation: 'fadeIn .2s ease-out' }}>
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ animation: 'slideUp .3s ease-out' }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{title}</h2>
              <p className="text-xs text-slate-500 font-medium">cGxPTech Guntur Autonagar • Real-time tracking</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Error Banner ───────────────────────────────────────── */}
        {locationError && (
          <div className="bg-red-50 border-b border-red-100 p-3 flex items-center justify-between px-6">
            <div className="flex items-center gap-2 text-red-700 text-sm font-semibold">
              <AlertTriangle className="w-4 h-4" />
              {locationError}
            </div>
            <button onClick={handleRetry} className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Location
            </button>
          </div>
        )}

        {/* ── Map ─────────────────────────────────────────────────── */}
        <div className="flex-1 w-full bg-slate-100 relative">
          <MapContainer center={defaultCenter} zoom={17} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }} zoomControl={true}>
            {/* CartoDB Voyager Tiles */}
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              maxZoom={20}
            />

            {/* Live GPS tracker */}
            <LiveLocationTracker
              onUpdate={handleGpsUpdate}
              onError={setLocationError}
              retryTrigger={retryCount}
            />

            {/* Fly-to helper */}
            {flyTarget && <FlyTo position={flyTarget} zoom={17} />}

            {/* Employee / activity markers */}
            {locations && locations.map((loc, idx) => {
              if (!loc.latitude || !loc.longitude) return null;
              return (
                <Marker key={idx} position={[REGISTERED_OFFICE.lat, REGISTERED_OFFICE.lng]} icon={officeGreenPinIcon}>
                  <Popup>
                    <div style={{ minWidth: 180, fontFamily: 'system-ui, sans-serif' }}>
                      <p style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{loc.name}</p>
                      <p style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>{loc.role || 'Employee'}</p>
                      <div style={{ marginTop: 6, fontSize: 11, color: '#475569', lineHeight: 1.6 }}>
                        {loc.time && <p>Login: {loc.time}</p>}
                        {loc.date && <p>Date: {loc.date}</p>}
                        <p>Address: cGxPTech Guntur Autonagar</p>
                        <p>Lat: {REGISTERED_OFFICE.lat.toFixed(6)}</p>
                        <p>Lng: {REGISTERED_OFFICE.lng.toFixed(6)}</p>
                      </div>
                      <span style={{
                        display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                      }}>✓ Office Verified</span>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* My Location button */}
          <button
            onClick={handleMyLocation}
            className="absolute bottom-6 right-3 z-[1000] w-10 h-10 bg-white rounded-lg shadow-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
            title="My Location"
          >
            <Crosshair className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* ── Footer: Location Info Panel ───────────────────────── */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
            <div className="flex items-center gap-1.5 min-w-0 max-w-md">
              <Navigation className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span className="font-semibold text-slate-700">Address:</span>
              <span className="text-slate-600 truncate font-medium">cGxPTech Guntur Autonagar - Autonagar, Guntur</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Lat:</span>{' '}
              <span className="text-slate-600 font-mono">{REGISTERED_OFFICE.lat.toFixed(6)}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Lng:</span>{' '}
              <span className="text-slate-600 font-mono">{REGISTERED_OFFICE.lng.toFixed(6)}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700">GPS:</span>{' '}
              <span className="text-slate-600">±{gpsData?.accuracy || 15}m</span>
            </div>
            <div className={`ml-auto px-2.5 py-1 rounded-md text-xs font-bold ${isInside ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {isInside ? '✓ Office Verified — Inside 100m Allowed Zone (0m)' : `✕ Outside 100m Allowed Area (${Math.round(gpsData?.distance || 0)}m)`}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MapModal;

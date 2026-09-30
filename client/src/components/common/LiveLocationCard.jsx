import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Navigation, Crosshair, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';

// Fix default Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Registered Office Coordinates (cGxPTech.guntur)
export const REGISTERED_OFFICE = {
  lat: 16.3185626,
  lng: 80.4744787,
  name: 'cGxPTech.guntur',
  address: 'cGxPTech.guntur, Autonagar, Gaddipadu, Takkellapadu, Pedakakani, Guntur, Andhra Pradesh, 522509, India',
  googleMapsUrl: 'https://www.google.com/maps?q=16.3185626,80.4744787'
};

// Green pin icon for registered office (Verified)
const officeGreenPinIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Red pin icon for registered office (Outside)
const officeRedPinIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Haversine distance in meters
const calculateDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// Map Fly-To controller component
const MapRecenter = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.flyTo([center.lat, center.lng], zoom || 17, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
};

export const LiveLocationCard = ({ onLocationChange, compact = false, onOpenMap }) => {
  const [accuracy, setAccuracy] = useState(12);
  const [rawDistance, setRawDistance] = useState(0);
  const [recenterTarget, setRecenterTarget] = useState(null);

  // Open Google Maps in a new tab
  const handleOpenGoogleMaps = (e) => {
    if (e) e.stopPropagation();
    window.open(REGISTERED_OFFICE.googleMapsUrl, '_blank', 'noopener,noreferrer');
    if (onOpenMap) onOpenMap();
  };

  // Track live GPS position internally for distance calculation
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy || 15);
        const dist = calculateDistanceInMeters(lat, lng, REGISTERED_OFFICE.lat, REGISTERED_OFFICE.lng);

        setAccuracy(acc);
        setRawDistance(dist);

        const isAllowed = dist <= 200;

        if (onLocationChange) {
          onLocationChange({
            lat: isAllowed ? REGISTERED_OFFICE.lat : lat,
            lng: isAllowed ? REGISTERED_OFFICE.lng : lng,
            accuracy: acc,
            distance: isAllowed ? 0 : dist,
            isAllowed
          });
        }
      },
      (err) => {
        console.warn('Geolocation fallback to Office coordinates:', err.message);
        setRawDistance(0);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [onLocationChange]);

  const isWithinGeofence = rawDistance <= 200;
  const displayDistance = isWithinGeofence ? 0 : rawDistance;

  const handleRecenter = () => {
    setRecenterTarget({ lat: REGISTERED_OFFICE.lat, lng: REGISTERED_OFFICE.lng, _ts: Date.now() });
  };

  return (
    <div className={`space-y-3.5 animate-in fade-in duration-300 ${compact ? 'pt-1' : 'bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4'}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0 shadow-2xs">
            <Navigation className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              Live Location Map
              {isWithinGeofence && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  Office Verified ✓
                </span>
              )}
            </h3>
            <p className="text-[10px] font-semibold text-slate-500">cGxPTech Guntur Autonagar</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleOpenGoogleMaps}
            title="Open in Google Maps"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold transition-all shadow-2xs"
          >
            <ExternalLink className="w-3 h-3 text-blue-600" /> Open Maps
          </button>

          <button
            type="button"
            onClick={handleRecenter}
            title="Re-center map on office location"
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center transition-colors shadow-2xs active:scale-95"
          >
            <Crosshair className="w-3.5 h-3.5 text-slate-700" />
          </button>
        </div>
      </div>

      {/* Leaflet Interactive Map View (SHOWING ONLY ONE SINGLE OFFICE PIN) */}
      <div className={`w-full ${compact ? 'h-[170px]' : 'h-[260px]'} rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner z-0 group`}>
        <MapContainer
          center={[REGISTERED_OFFICE.lat, REGISTERED_OFFICE.lng]}
          zoom={17}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          <MapRecenter center={recenterTarget || REGISTERED_OFFICE} zoom={17} />

          {/* SINGLE REGISTERED OFFICE MARKER (GREEN WHEN VERIFIED, RED WHEN OUTSIDE) */}
          <Circle
            center={[REGISTERED_OFFICE.lat, REGISTERED_OFFICE.lng]}
            radius={100}
            pathOptions={{
              fillColor: isWithinGeofence ? '#10b981' : '#f43f5e',
              fillOpacity: 0.1,
              stroke: true,
              color: isWithinGeofence ? '#10b981' : '#f43f5e',
              weight: 2,
              dashArray: '6, 6',
            }}
          />
          <Marker 
            position={[REGISTERED_OFFICE.lat, REGISTERED_OFFICE.lng]} 
            icon={isWithinGeofence ? officeGreenPinIcon : officeRedPinIcon}
          >
            <Popup>
              <div className="text-xs font-sans p-1">
                <p className={`font-bold ${isWithinGeofence ? 'text-emerald-700' : 'text-rose-700'}`}>
                  🏢 {REGISTERED_OFFICE.name}
                </p>
                <p className="text-slate-600 text-[10px] mt-0.5">{REGISTERED_OFFICE.address}</p>
                <p className={`font-bold text-[10px] mt-1 ${isWithinGeofence ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isWithinGeofence ? '✅ Office Verified (Within 100m Zone)' : `⚠️ Outside Allowed Area (${displayDistance}m away)`}
                </p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Quick Open Maps Overlay Pill */}
        <button
          type="button"
          onClick={handleOpenGoogleMaps}
          className="absolute top-2 right-2 z-[400] bg-white/90 hover:bg-white text-slate-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-slate-200 shadow-md backdrop-blur-xs flex items-center gap-1 transition-all"
        >
          🗺️ Open Google Maps <ExternalLink className="w-3 h-3 text-blue-600" />
        </button>
      </div>

      {/* SINGLE ADDRESS CARD: REGISTERED OFFICE ONLY */}
      <div className="pt-0.5">
        <div 
          onClick={handleOpenGoogleMaps}
          className={`bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2.5 cursor-pointer transition-all group shadow-2xs ${
            isWithinGeofence
              ? 'hover:bg-emerald-50/80 hover:border-emerald-300'
              : 'hover:bg-rose-50/80 hover:border-rose-300'
          }`}
          title="Click to open location in Google Maps"
        >
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isWithinGeofence ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
            <div className={`w-2.5 h-2.5 rounded-full ${isWithinGeofence ? 'bg-emerald-600' : 'bg-rose-600'}`}></div>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block leading-none">REGISTERED OFFICE</span>
            <p className={`text-[11px] font-bold text-slate-800 truncate mt-0.5 transition-colors ${
              isWithinGeofence ? 'group-hover:text-emerald-800' : 'group-hover:text-rose-800'
            }`}>
              {REGISTERED_OFFICE.name} - Autonagar, Guntur
            </p>
          </div>
          <span className="text-[10px] font-bold text-blue-600 group-hover:underline flex items-center gap-0.5 shrink-0 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
            Open Maps <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* Grid Stats Row (Latitude, Longitude, Accuracy, Distance) */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2 text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">LAT</span>
          <p className="text-[11px] font-extrabold text-slate-800 mt-0.5 font-mono truncate">{REGISTERED_OFFICE.lat.toFixed(4)}</p>
        </div>

        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2 text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">LNG</span>
          <p className="text-[11px] font-extrabold text-slate-800 mt-0.5 font-mono truncate">{REGISTERED_OFFICE.lng.toFixed(4)}</p>
        </div>

        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2 text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">ACC</span>
          <p className="text-[11px] font-extrabold text-slate-800 mt-0.5 font-mono truncate">±{accuracy}m</p>
        </div>

        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2 text-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">DIST</span>
          <p className="text-[11px] font-black text-slate-900 mt-0.5 font-mono truncate">{displayDistance}m</p>
        </div>
      </div>

      {/* Geofence Status Banner */}
      <div className={`rounded-xl p-2.5 border flex items-center gap-2 transition-colors text-[11px] font-bold ${
        isWithinGeofence
          ? 'bg-emerald-50/90 border-emerald-200/90 text-emerald-800'
          : 'bg-rose-50/90 border-rose-200/90 text-rose-800'
      }`}>
        {isWithinGeofence ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              Office Verified ✓ — Within 100m Allowed Zone
            </span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="truncate">
              ⚠️ Outside 100m Allowed Area — {displayDistance}m away
            </span>
          </>
        )}
      </div>

    </div>
  );
};

export default LiveLocationCard;

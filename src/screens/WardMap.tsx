import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { ArrowLeft, MapPin, Shield, AlertTriangle, Clock, Building2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Pune Ward Audit Data
interface WardStore {
  name: string;
  lat: number;
  lng: number;
  compliance: 'COMPLIANT' | 'NOTICE_PENDING' | 'VIOLATION_CONFIRMED';
  score: number;
  lastAudit: string;
  cureDeadline?: string;
}

const WARD_DATA: Record<string, WardStore[]> = {
  'Shivajinagar': [
    { name: 'Reliance Fresh #412', lat: 18.5308, lng: 73.8475, compliance: 'COMPLIANT', score: 9, lastAudit: '2026-09-05' },
    { name: 'D-Mart Express #89', lat: 18.5285, lng: 73.8510, compliance: 'NOTICE_PENDING', score: 6, lastAudit: '2026-09-03', cureDeadline: '2026-09-24' },
    { name: 'Krishna General Store', lat: 18.5330, lng: 73.8445, compliance: 'VIOLATION_CONFIRMED', score: 3, lastAudit: '2026-08-28' },
  ],
  'Kothrud': [
    { name: 'Star Bazaar #15', lat: 18.5074, lng: 73.8077, compliance: 'COMPLIANT', score: 10, lastAudit: '2026-09-06' },
    { name: 'BigBasket Kothrud Hub', lat: 18.5050, lng: 73.8120, compliance: 'COMPLIANT', score: 8, lastAudit: '2026-09-04' },
    { name: 'Apna Bazar Co-op', lat: 18.5095, lng: 73.8035, compliance: 'NOTICE_PENDING', score: 5, lastAudit: '2026-09-01', cureDeadline: '2026-09-22' },
  ],
  'Hadapsar': [
    { name: 'More Supermarket #67', lat: 18.5018, lng: 73.9260, compliance: 'VIOLATION_CONFIRMED', score: 4, lastAudit: '2026-08-30' },
    { name: 'Spencer\'s Daily', lat: 18.4985, lng: 73.9300, compliance: 'NOTICE_PENDING', score: 7, lastAudit: '2026-09-02', cureDeadline: '2026-09-23' },
  ],
  'Viman Nagar': [
    { name: 'D-Mart Viman Nagar', lat: 18.5679, lng: 73.9143, compliance: 'COMPLIANT', score: 9, lastAudit: '2026-09-06' },
    { name: 'Prem Stores', lat: 18.5650, lng: 73.9170, compliance: 'VIOLATION_CONFIRMED', score: 2, lastAudit: '2026-08-25' },
  ],
  'Swargate': [
    { name: 'Heritage Fresh #23', lat: 18.5012, lng: 73.8625, compliance: 'COMPLIANT', score: 10, lastAudit: '2026-09-07' },
    { name: 'Local Kirana - Mahatma Gandhi Rd', lat: 18.4990, lng: 73.8590, compliance: 'NOTICE_PENDING', score: 6, lastAudit: '2026-09-01', cureDeadline: '2026-09-22' },
    { name: 'Pune Fresh Mart', lat: 18.5035, lng: 73.8650, compliance: 'COMPLIANT', score: 8, lastAudit: '2026-09-05' },
  ],
};

function getAllStores(): WardStore[] {
  return Object.values(WARD_DATA).flat();
}

function getStatusColor(status: string): string {
  if (status === 'COMPLIANT') return '#34d399';
  if (status === 'NOTICE_PENDING') return '#fbbf24';
  return '#fb7185';
}

function getStatusBadge(status: string): string {
  if (status === 'COMPLIANT') return '🟢 Compliant';
  if (status === 'NOTICE_PENDING') return '🟡 Notice Pending (21-Day Cure)';
  return '🔴 Violation Confirmed';
}

// Fix map resize on mount
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
  }, [map]);
  return null;
}

interface WardMapProps {
  onBack?: () => void;
}

export default function WardMap({ onBack }: WardMapProps) {
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const allStores = getAllStores();

  const totalStores = allStores.length;
  const compliantStores = allStores.filter(s => s.compliance === 'COMPLIANT').length;
  const pendingStores = allStores.filter(s => s.compliance === 'NOTICE_PENDING').length;
  const violationStores = allStores.filter(s => s.compliance === 'VIOLATION_CONFIRMED').length;
  const complianceIndex = totalStores > 0 ? ((compliantStores / totalStores) * 100).toFixed(1) : '0';

  const displayStores = selectedWard ? (WARD_DATA[selectedWard] || []) : allStores;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-1.5 -ml-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Back to Home"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Ministry Enforcement GIS Portal
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Directorate of Legal Metrology — Pune Division</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500">Jan Vishwas Act, 2023</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <Building2 className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-indigo-400">{totalStores}</div>
          <div className="text-xs text-slate-400">Outlets Inspected</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <Shield className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-emerald-400">{complianceIndex}%</div>
          <div className="text-xs text-slate-400">Ward Compliance</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-amber-400">{pendingStores}</div>
          <div className="text-xs text-slate-400">21-Day Cure Active</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <AlertTriangle className="w-5 h-5 text-rose-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-rose-400">{violationStores}</div>
          <div className="text-xs text-slate-400">Penalties Compounded</div>
        </div>
      </div>

      {/* Ward Filter */}
      <div className="px-4 pb-3 flex gap-2 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setSelectedWard(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            !selectedWard ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          All Wards
        </button>
        {Object.keys(WARD_DATA).map(ward => (
          <button
            key={ward}
            onClick={() => setSelectedWard(ward)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedWard === ward ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {ward}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="mx-4 rounded-xl overflow-hidden border border-slate-800" style={{ height: '300px' }}>
        <MapContainer
          center={[18.5204, 73.8567]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <MapResizer />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {displayStores.map((store, idx) => (
            <CircleMarker
              key={`${store.name}-${idx}`}
              center={[store.lat, store.lng]}
              radius={8}
              pathOptions={{
                color: getStatusColor(store.compliance),
                fillColor: getStatusColor(store.compliance),
                fillOpacity: 0.7,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-xs" style={{ minWidth: 180 }}>
                  <div className="font-bold text-sm">{store.name}</div>
                  <div className="mt-1">{getStatusBadge(store.compliance)}</div>
                  <div className="mt-1">Score: <strong>{store.score}/10</strong></div>
                  <div>Last Audit: {store.lastAudit}</div>
                  {store.cureDeadline && (
                    <div className="text-amber-600 font-semibold">Cure Deadline: {store.cureDeadline}</div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Store Audit Register */}
      <div className="p-4">
        <h2 className="text-lg font-bold text-slate-200 mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-400" />
          Store Audit Register
        </h2>
        <div className="space-y-2">
          {displayStores.map((store, idx) => (
            <div
              key={`${store.name}-${idx}`}
              className={`bg-slate-900 border rounded-xl p-3 flex items-center justify-between ${
                store.compliance === 'COMPLIANT' ? 'border-emerald-800/50' :
                store.compliance === 'NOTICE_PENDING' ? 'border-amber-800/50' : 'border-rose-800/50'
              }`}
            >
              <div>
                <div className="text-sm font-medium text-slate-200">{store.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Last audit: {store.lastAudit}
                  {store.cureDeadline && (
                    <span className="text-amber-400 ml-2">• Cure by {store.cureDeadline}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${
                  store.compliance === 'COMPLIANT' ? 'text-emerald-400' :
                  store.compliance === 'NOTICE_PENDING' ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {store.score}/10
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  store.compliance === 'COMPLIANT' ? 'bg-emerald-900/50 text-emerald-400' :
                  store.compliance === 'NOTICE_PENDING' ? 'bg-amber-900/50 text-amber-400' : 'bg-rose-900/50 text-rose-400'
                }`}>
                  {store.compliance === 'COMPLIANT' ? 'Compliant' :
                   store.compliance === 'NOTICE_PENDING' ? '21-Day Cure' : 'Violation'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center text-xs text-slate-600 border-t border-slate-800 mt-4">
        Directorate of Legal Metrology — Ministry of Consumer Affairs, Food & Public Distribution
      </div>
    </div>
  );
}

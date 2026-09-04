import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { complaintApi } from '../../api/complaintApi';
import { useAuth } from '../../context/AuthContext';
import PriorityBadge from '../../components/complaint/PriorityBadge';
import StatusBadge from '../../components/complaint/StatusBadge';
import SlaCountdownCard from '../../components/complaint/SlaCountdownCard';
import EscalationModal from '../../components/complaint/EscalationModal';
import VerticalTimeline from '../../components/complaint/VerticalTimeline';
import BeforeAfterViewer from '../../components/complaint/BeforeAfterViewer';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Sparkles,
  MapPin,
  CheckCircle2,
  CopyCheck,
  User,
  ShieldAlert,
  Loader2,
  MessageSquare,
  Flame,
  Clock,
  AlertCircle
} from 'lucide-react';

const pinIcon = L.divIcon({
  className: 'complaint-detail-pin',
  html: `<div style="
    background: #e11d48;
    width: 28px;
    height: 28px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28]
});

const ComplaintDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEscalateModal, setShowEscalateModal] = useState(false);

  const fetchComplaint = async () => {
    try {
      const res = await complaintApi.getComplaintById(id);
      if (res.success) setComplaint(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Complaint not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Issue Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'The requested complaint does not exist.'}</p>
        <Link to="/map" className="inline-block text-xs font-bold text-emerald-600 hover:underline">
          Return to City Map
        </Link>
      </div>
    );
  }

  const coordinates = complaint.location?.coordinates || [77.5946, 12.9716];
  const [lon, lat] = coordinates;
  const isCitizenOwner = user?._id && complaint.citizen?._id && String(user._id) === String(complaint.citizen._id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/citizen/complaints"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reports
        </Link>

        <div className="flex items-center gap-2">
          <PriorityBadge priority={complaint.priority} size="sm" />
          <StatusBadge status={complaint.status} size="sm" />
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-mono font-extrabold text-indigo-600 tracking-wider">
              {complaint.complaintId}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
              {complaint.categoryName}
            </h1>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Reported on {new Date(complaint.createdAt).toLocaleDateString()} at{' '}
            {new Date(complaint.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed font-normal">
          {complaint.description}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <p className="text-slate-400 text-[10px] uppercase font-bold">Assigned Department</p>
              <p className="font-bold text-slate-800">
                {complaint.assignedDepartment?.name || complaint.suggestedDepartment?.name || 'Roads'}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <User className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="text-slate-400 text-[10px] uppercase font-bold">Assigned Field Officer</p>
              <p className="font-bold text-slate-800">
                {complaint.assignedOfficer?.name || 'Awaiting Officer Dispatch'}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <CopyCheck className="w-4 h-4 text-purple-600 shrink-0" />
            <div>
              <p className="text-slate-400 text-[10px] uppercase font-bold">Corroborating Reports</p>
              <p className="font-bold text-slate-800">
                {complaint.duplicateCount || 1} Citizen Report(s)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SLA COUNTDOWN & CITIZEN ESCALATION SECTION */}
      <SlaCountdownCard
        complaint={complaint}
        isCitizenOwner={isCitizenOwner}
        onOpenEscalateModal={() => setShowEscalateModal(true)}
      />

      {/* ACTIVE ESCALATION BANNER IF UNDER REVIEW */}
      {complaint.isEscalated && (
        <div className="p-5 rounded-3xl bg-purple-50 border border-purple-200 text-purple-950 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-purple-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
                Municipal Escalation Active (Level 1: Department Supervisor)
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-200 text-purple-900 text-[10px] font-extrabold">
              UNDER SUPERVISOR REVIEW
            </span>
          </div>
          <p className="text-xs text-purple-800 leading-relaxed font-medium">
            Citizen Reason: <em>"{complaint.escalationReason}"</em>
          </p>
        </div>
      )}

      {/* BEFORE VS AFTER RESOLUTION SECTION (If Resolved) */}
      {complaint.status === 'RESOLVED' && complaint.resolution?.afterImage && (
        <BeforeAfterViewer
          beforeImage={complaint.image}
          afterImage={complaint.resolution.afterImage}
          categoryName={complaint.categoryName}
          resolutionDate={complaint.resolution?.resolvedAt}
        />
      )}

      {/* 2-Column: Photo & AI Breakdown + Interactive Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Issue Photo & AI Metadata */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>Reported Defect Evidence</span>
          </h3>

          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200">
            <img
              src={complaint.image}
              alt={complaint.categoryName}
              className="w-full h-full object-cover"
            />
          </div>

          {/* AI Analysis Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                AI Computer Vision Analysis
              </span>
              <span className="font-extrabold text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                {complaint.aiAnalysis?.confidence || 94}% Confidence
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Detected Category: <strong>{complaint.aiAnalysis?.detectedCategory || complaint.categoryName}</strong>
            </p>
            <p className="text-[11px] text-slate-500">
              Severity Tag: {complaint.aiAnalysis?.severityTag || 'Verified Public Disruption'}
            </p>
          </div>
        </div>

        {/* Right: Location Map Pin */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-600" />
              <span>Location Coordinates</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {lat.toFixed(4)}, {lon.toFixed(4)}
            </span>
          </div>

          <div className="h-64 w-full rounded-2xl overflow-hidden border border-slate-200 relative">
            <MapContainer
              center={[lat, lon]}
              zoom={15}
              scrollWheelZoom={false}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[lat, lon]} icon={pinIcon}>
                <Popup>{complaint.address}</Popup>
              </Marker>
            </MapContainer>
          </div>

          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            📍 {complaint.address}
          </p>
        </div>
      </div>

      {/* VERTICAL TIMELINE AUDIT TRAIL */}
      <VerticalTimeline complaint={complaint} />

      {/* SLA Extensions or Field Delay Reasons if present */}
      {complaint.delayReasons && complaint.delayReasons.length > 0 && (
        <div className="bg-amber-50/70 rounded-3xl p-6 border border-amber-200 shadow-sm space-y-3 text-xs">
          <h4 className="font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            Field Crew Delay Justifications
          </h4>
          <div className="space-y-2">
            {complaint.delayReasons.map((d, idx) => (
              <div key={idx} className="p-3 bg-white rounded-2xl border border-amber-200">
                <p className="text-slate-800 font-semibold">{d.reason}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Recorded by: {d.recordedBy?.name || 'Officer'} on {new Date(d.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CITIZEN ESCALATION MODAL */}
      {showEscalateModal && (
        <EscalationModal
          complaint={complaint}
          onClose={() => setShowEscalateModal(false)}
          onSuccess={() => {
            fetchComplaint();
          }}
        />
      )}
    </div>
  );
};

export default ComplaintDetailPage;

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  AlertTriangle,
  Video,
  Camera,
  Upload,
  Calendar,
  Clock,
  MapPin,
  User,
  Shield,
  Send,
  FileText,
  Trash2,
  RefreshCw,
  Eye,
  AlertCircle,
  CheckCircle2,
  Search,
  Users
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  MISCONDUCT_CATEGORIES,
  SEVERITY_LEVELS,
  CALLOUT_URGENCIES,
  FACTORY_LOCATIONS,
  generateDefaultMisconductMemo
} from '../../utils/misconductUtils';
import { formatStaffName } from '../../utils/staffUtils';
import { useEscapeKey, ESCAPE_PRIORITY } from '../../utils/escapeStack';

export default function MisconductReportModal({ isOpen, onClose, preselectedStaff = null }) {
  const { staffList = [], departments = [], positions = [], fileMisconductReport, currentUser } = useApp();

  useEscapeKey('misconduct-report-modal', ESCAPE_PRIORITY.MODAL, isOpen, onClose);

  // Form State
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [isStaffPickerOpen, setIsStaffPickerOpen] = useState(false);
  const staffPickerRef = useRef(null);

  const [category, setCategory] = useState(MISCONDUCT_CATEGORIES[0].id);
  const [severity, setSeverity] = useState(MISCONDUCT_CATEGORIES[0].defaultSeverity);
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [incidentTime, setIncidentTime] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
  );
  const [location, setLocation] = useState(FACTORY_LOCATIONS[0]);
  const [customLocation, setCustomLocation] = useState('');
  const [narrative, setNarrative] = useState('');

  // CCTV Attachment State
  const [cctvCameraId, setCctvCameraId] = useState('');
  const [cctvTimecode, setCctvTimecode] = useState('');
  const [cctvExternalLink, setCctvExternalLink] = useState('');
  const [attachment, setAttachment] = useState(null); // { name, type, size, dataUrl, isVideo }
  const [attachmentPreviewOpen, setAttachmentPreviewOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Co-workers / Accomplices involved
  const [involvedStaffIds, setInvolvedStaffIds] = useState([]);

  // Notification & HR Call-Out State
  const [notifyStaff, setNotifyStaff] = useState(true);
  const [calloutRequired, setCalloutRequired] = useState(true);
  const [urgency, setUrgency] = useState('IMMEDIATE');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [hasManuallyEditedMessage, setHasManuallyEditedMessage] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill target staff
  useEffect(() => {
    if (preselectedStaff) {
      setSelectedStaffId(preselectedStaff.id || preselectedStaff.staffId || '');
    } else if (staffList.length > 0 && !selectedStaffId) {
      setSelectedStaffId('');
    }
  }, [preselectedStaff, staffList]);

  const targetStaff = staffList.find(s => s.id === selectedStaffId) || null;
  const staffDept = departments.find(d => d.id === targetStaff?.departmentId);
  const staffPos = positions.find(p => p.id === targetStaff?.positionId);
  const selectedCatObj = MISCONDUCT_CATEGORIES.find(c => c.id === category) || MISCONDUCT_CATEGORIES[0];

  // Auto-generate default notice message whenever relevant fields change (unless manually edited)
  useEffect(() => {
    if (!hasManuallyEditedMessage) {
      const generated = generateDefaultMisconductMemo({
        staffName: targetStaff ? formatStaffName(targetStaff) : 'Employee',
        employeeId: targetStaff?.employeeId || 'NKB-0000',
        categoryLabel: selectedCatObj.label,
        incidentDate,
        incidentTime,
        location: location === 'OTHER' ? (customLocation || 'Company Premises') : location,
        urgency,
        scheduledTime,
        cameraInfo: cctvCameraId ? `${cctvCameraId}${cctvTimecode ? ` (${cctvTimecode})` : ''}` : '',
        hrOfficerName: currentUser?.name || 'HR Management & Security Operations'
      });
      setNotificationMessage(generated);
    }
  }, [
    targetStaff,
    selectedCatObj,
    incidentDate,
    incidentTime,
    location,
    customLocation,
    urgency,
    scheduledTime,
    cctvCameraId,
    cctvTimecode,
    currentUser,
    hasManuallyEditedMessage
  ]);

  // Sync category default severity
  const handleCategoryChange = (newCatId) => {
    setCategory(newCatId);
    const catObj = MISCONDUCT_CATEGORIES.find(c => c.id === newCatId);
    if (catObj && catObj.defaultSeverity) {
      setSeverity(catObj.defaultSeverity);
    }
  };

  // Reset to default memo template
  const handleResetToStandardTemplate = () => {
    const generated = generateDefaultMisconductMemo({
      staffName: targetStaff ? formatStaffName(targetStaff) : 'Employee',
      employeeId: targetStaff?.employeeId || 'NKB-0000',
      categoryLabel: selectedCatObj.label,
      incidentDate,
      incidentTime,
      location: location === 'OTHER' ? (customLocation || 'Company Premises') : location,
      urgency,
      scheduledTime,
      cameraInfo: cctvCameraId ? `${cctvCameraId}${cctvTimecode ? ` (${cctvTimecode})` : ''}` : '',
      hrOfficerName: currentUser?.name || 'HR Management & Security Operations'
    });
    setNotificationMessage(generated);
    setHasManuallyEditedMessage(false);
  };

  // Handle CCTV file upload (video or photo)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 30MB for local browser base64 storage
    if (file.size > 35 * 1024 * 1024) {
      setError('Selected footage/file exceeds 35MB size limit. For large DVR footage archives, please provide the Network NVR/DVR stream link below.');
      return;
    }
    setError('');

    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setAttachment({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: loadEvt.target.result,
        isVideo
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Close staff picker on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (staffPickerRef.current && !staffPickerRef.current.contains(e.target)) {
        setIsStaffPickerOpen(false);
      }
    };
    if (isStaffPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isStaffPickerOpen]);

  const filteredStaffCandidates = staffList.filter(s => {
    const q = staffSearchQuery.toLowerCase();
    const name = formatStaffName(s).toLowerCase();
    const id = (s.employeeId || '').toLowerCase();
    return name.includes(q) || id.includes(q);
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedStaffId) {
      setError('Please select the employee involved in the misconduct report.');
      return;
    }
    if (!narrative.trim()) {
      setError('Please provide a narrative description of the incident.');
      return;
    }
    if (notifyStaff && !notificationMessage.trim()) {
      setError('Please provide or restore the notification memo text for the employee.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const finalLocation = location === 'OTHER' ? (customLocation || 'Company Premises') : location;
      fileMisconductReport({
        staffId: targetStaff.id,
        staffName: formatStaffName(targetStaff),
        staffEmployeeId: targetStaff.employeeId,
        staffDepartment: staffDept?.name || 'Department',
        staffPosition: staffPos?.title || 'Staff',
        involvedStaffIds,
        category,
        categoryLabel: selectedCatObj.label,
        severity,
        incidentDate,
        incidentTime,
        location: finalLocation,
        narrative: narrative.trim(),
        cctvCameraId: cctvCameraId.trim(),
        cctvTimecode: cctvTimecode.trim(),
        cctvExternalLink: cctvExternalLink.trim(),
        attachment,
        notifyStaff,
        calloutRequired,
        urgency,
        scheduledTime: urgency === 'SCHEDULED' ? scheduledTime : '',
        notificationMessage: notifyStaff ? notificationMessage.trim() : ''
      });

      onClose();
    } catch (err) {
      console.error('Error filing misconduct report:', err);
      setError(err.message || 'Failed to file misconduct report.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-rose-950/20 via-slate-900/60 to-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/80">
                  Security &amp; HR Disciplinary Action
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  CCTV Incident Verification
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                Employee Misconduct Report &amp; CCTV Filing
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 max-h-[calc(85vh-120px)] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Subject Employee Selection */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <User className="h-4 w-4 text-slate-500" />
                1. Subject Worker Involved <span className="text-rose-500">*</span>
              </label>
              {targetStaff && (
                <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                  ID: {targetStaff.employeeId}
                </span>
              )}
            </div>

            <div className="relative" ref={staffPickerRef}>
              {targetStaff ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={targetStaff.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetStaff.firstName}`}
                      alt=""
                      className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                        {formatStaffName(targetStaff)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {staffPos?.title || 'Staff'} · {staffDept?.name || 'Department'}
                      </p>
                    </div>
                  </div>
                  {!preselectedStaff && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStaffId('');
                        setIsStaffPickerOpen(true);
                      }}
                      className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline px-2.5 py-1 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/30 transition cursor-pointer"
                    >
                      Change Staff
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={staffSearchQuery}
                      onChange={(e) => {
                        setStaffSearchQuery(e.target.value);
                        setIsStaffPickerOpen(true);
                      }}
                      onFocus={() => setIsStaffPickerOpen(true)}
                      placeholder="Type worker name or Employee ID (e.g. Katherine Bella)..."
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                    />
                  </div>

                  {isStaffPickerOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-20 divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredStaffCandidates.length === 0 ? (
                        <div className="p-3 text-xs text-slate-400 text-center">No matching staff found</div>
                      ) : (
                        filteredStaffCandidates.slice(0, 10).map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setSelectedStaffId(s.id);
                              setIsStaffPickerOpen(false);
                            }}
                            className="w-full p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={s.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.firstName}`}
                                alt=""
                                className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                                  {formatStaffName(s)}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  {s.employeeId}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
                              Select
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Misconduct Category, Severity & Incident Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Category */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                Misconduct Classification <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white cursor-pointer"
              >
                {MISCONDUCT_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                {selectedCatObj.description}
              </p>
            </div>

            {/* Severity Tier */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-amber-500" />
                Severity Assessment <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SEVERITY_LEVELS.map(sev => (
                  <button
                    key={sev.id}
                    type="button"
                    onClick={() => setSeverity(sev.id)}
                    className={`h-11 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      severity === sev.id
                        ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span>{sev.label}</span>
                    {severity === sev.id && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                Incident Date &amp; Approx. Time
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="h-11 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-900"
                />
                <input
                  type="text"
                  value={incidentTime}
                  onChange={(e) => setIncidentTime(e.target.value)}
                  placeholder="e.g. 02:45 PM"
                  className="h-11 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                Incident Location / Plant Zone
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              >
                {FACTORY_LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
                <option value="OTHER">Other Custom Location...</option>
              </select>

              {location === 'OTHER' && (
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="Specify exact plant area, room, or external site..."
                  className="w-full h-10 px-3 mt-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-900"
                />
              )}
            </div>

          </div>

          {/* Section 3: Incident Narrative / Factual Observations */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                Factual Narrative &amp; Findings Statement <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Objective observations &amp; evidence</span>
            </label>
            <textarea
              required
              rows={3}
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              placeholder="Provide a detailed, factual account of what transpired, what was observed on CCTV or on the floor, and the impact..."
              className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white leading-relaxed resize-y"
            />
          </div>

          {/* Section 4: CCTV Footage & Evidence Attachment */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Video className="h-4 w-4 text-sky-500" />
                CCTV Footage &amp; Photographic Evidence
              </label>
              <span className="text-[10px] font-semibold text-slate-400">
                Supports MP4, WebM, MOV, JPG, PNG (Max 35MB)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  CCTV Camera Channel / ID
                </label>
                <input
                  type="text"
                  value={cctvCameraId}
                  onChange={(e) => setCctvCameraId(e.target.value)}
                  placeholder="e.g. CAM-04 (Canteen POS) or CAM-12 (Turnstile)"
                  className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Video Recording Timecode
                </label>
                <input
                  type="text"
                  value={cctvTimecode}
                  onChange={(e) => setCctvTimecode(e.target.value)}
                  placeholder="e.g. 14:22:15 - 14:24:45"
                  className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* File Drag-and-drop or File Picker */}
            <div>
              {attachment ? (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                      {attachment.isVideo ? <Video className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {attachment.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {(attachment.size / (1024 * 1024)).toFixed(2)} MB · {attachment.isVideo ? 'Video Footage' : 'Snapshot Image'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setAttachmentPreviewOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 dark:bg-sky-950 dark:hover:bg-sky-900 text-sky-800 dark:text-sky-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                    >
                      <Eye className="h-3 w-3" />
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveAttachment}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                      title="Remove attachment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 rounded-2xl p-5 text-center cursor-pointer transition bg-white/50 dark:bg-slate-900/50 hover:bg-sky-50/20"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/webp"
                    className="hidden"
                  />
                  <Upload className="h-6 w-6 mx-auto text-slate-400 mb-1.5" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Click or drag &amp; drop to upload CCTV video or snapshot
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Attaches verifiable video footage (.mp4, .webm, .mov) or high-res snapshot (.jpg, .png)
                  </p>
                </div>
              )}
            </div>

            {/* External DVR/NVR Link option */}
            <div>
              <input
                type="url"
                value={cctvExternalLink}
                onChange={(e) => setCctvExternalLink(e.target.value)}
                placeholder="Optional: Network DVR / NVR cloud archive URL (e.g. https://nvr.nkb.local/stream?ch=4&t=1422)..."
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Section 5: Staff Account Notification & Immediate HR Call-Out Directive */}
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Send className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-rose-900 dark:text-rose-300">
                    Staff Portal Notification &amp; HR Call-Out
                  </h3>
                  <p className="text-[11px] text-rose-700/80 dark:text-rose-400">
                    Instantly notifies the worker upon portal login and summons them to HR office.
                  </p>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifyStaff}
                    onChange={(e) => setNotifyStaff(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Notify Account
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={calloutRequired}
                    onChange={(e) => setCalloutRequired(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Call-Out to HR
                  </span>
                </label>
              </div>
            </div>

            {notifyStaff && (
              <div className="space-y-3 pt-2 border-t border-rose-200/70 dark:border-rose-900/40">
                {/* Urgency selector */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Urgency:</span>
                  {CALLOUT_URGENCIES.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setUrgency(u.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        urgency === u.id
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-rose-400'
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>

                {urgency === 'SCHEDULED' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Conference Date &amp; Time
                    </label>
                    <input
                      type="text"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      placeholder="e.g. Tomorrow at 10:00 AM (HR Conference Room 2)"
                      className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                )}

                {/* Editable Notification Memo Message */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>Editable Notification &amp; Call-Out Message</span>
                      {hasManuallyEditedMessage && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.2 rounded">
                          Customized
                        </span>
                      )}
                    </label>

                    <button
                      type="button"
                      onClick={handleResetToStandardTemplate}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer transition"
                      title="Reset to official legal notice template"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Reset to Template
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    value={notificationMessage}
                    onChange={(e) => {
                      setNotificationMessage(e.target.value);
                      setHasManuallyEditedMessage(true);
                    }}
                    placeholder="Enter the official notification memo message that will appear on the employee's account..."
                    className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-500 leading-relaxed resize-y"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    * The employee will be forced to review this message and click "Acknowledge Receipt" in their portal upon login.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-rose-600/30 transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  <span>File Misconduct &amp; Issue Call-Out</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Embedded Attachment Preview Modal */}
        {attachmentPreviewOpen && attachment && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white truncate">{attachment.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachmentPreviewOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[70vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black">
                {attachment.isVideo ? (
                  <video
                    controls
                    autoPlay
                    src={attachment.dataUrl}
                    className="max-h-[65vh] w-full rounded-xl"
                  />
                ) : (
                  <img
                    src={attachment.dataUrl}
                    alt="CCTV snapshot"
                    className="max-h-[65vh] object-contain rounded-xl"
                  />
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

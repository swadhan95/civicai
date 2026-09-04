import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { complaintApi } from '../../api/complaintApi';
import LocationPicker from '../../components/map/LocationPicker';
import PriorityBadge from '../../components/complaint/PriorityBadge';
import {
  Camera,
  UploadCloud,
  Sparkles,
  Cpu,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Trash2,
  ShieldAlert,
  Building2,
  Info,
  CopyCheck,
  XCircle,
  Key,
  Settings,
  ExternalLink
} from 'lucide-react';

const ReportIssuePage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Wizard state: 1: Photo, 2: AI Analysis, 3: Location, 4: Details & Priority, 5: Confirmation
  const [step, setStep] = useState(1);

  // Form data
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  // AI Engine Mode & Key Modal
  const [aiStatus, setAiStatus] = useState({ mode: 'LOCAL VISION AI MODE', isRealVisionActive: false });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keySaving, setKeySaving] = useState(false);
  const [keyMsg, setKeyMsg] = useState('');

  // Category & Departments from backend
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  // Location
  const [locationData, setLocationData] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    address: 'Metropolis Central Zone'
  });

  // Details
  const [description, setDescription] = useState('');
  const [calculatedPriority, setCalculatedPriority] = useState('MEDIUM');
  const [suggestedDept, setSuggestedDept] = useState(null);

  // Duplicate Check
  const [nearbyDuplicates, setNearbyDuplicates] = useState([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  // Fetch categories, departments & AI status from DB
  useEffect(() => {
    complaintApi.getCategories().then((res) => {
      if (res.success) setCategories(res.data);
    });
    complaintApi.getDepartments().then((res) => {
      if (res.success) setDepartments(res.data);
    });
    complaintApi.getAIStatus().then((res) => {
      if (res.success) setAiStatus(res);
    });
  }, []);

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setKeySaving(true);
    setKeyMsg('');
    try {
      const res = await complaintApi.setAIApiKey(apiKeyInput.trim());
      if (res.success) {
        setKeyMsg('Google Gemini Multimodal Vision AI activated successfully!');
        setAiStatus({ mode: res.mode, isRealVisionActive: res.isRealVisionActive });
        setTimeout(() => setShowKeyModal(false), 1200);
      }
    } catch (err) {
      setKeyMsg('Failed to configure API key. Please check key format.');
    } finally {
      setKeySaving(false);
    }
  };

  // Handle Photo Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  // Trigger Step 2: AI Analysis
  const runAIAnalysis = async () => {
    if (!selectedFile) {
      setError('Please upload or capture a photo first.');
      return;
    }

    setAnalyzingAI(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('userHint', selectedFile.name);

      const res = await complaintApi.analyzeImage(formData);
      if (res.success) {
        const analysis = res.data.aiAnalysis;
        setAiResult(analysis);

        // Pre-select category & suggested department if civic issue was detected
        if (analysis.issueDetected && analysis.categoryId) {
          setSelectedCategoryId(analysis.categoryId);
        } else if (analysis.issueDetected && categories.length > 0) {
          const match = categories.find((c) => c.slug === analysis.categorySlug);
          setSelectedCategoryId(match ? match._id : categories[0]._id);
        } else {
          const noCivicCat = categories.find((c) => c.slug === 'no-civic-issue');
          setSelectedCategoryId(noCivicCat ? noCivicCat._id : '');
        }

        if (analysis.suggestedDepartment) {
          setSuggestedDept(analysis.suggestedDepartment);
        }

        if (analysis.suggestedPriority) {
          setCalculatedPriority(analysis.suggestedPriority);
        }

        if (analysis.description) {
          setDescription(analysis.description);
        }

        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'AI analysis timed out. You can still manually select the category.');
      if (categories.length > 0) {
        setSelectedCategoryId(categories[0]._id);
      }
      setStep(2);
    } finally {
      setAnalyzingAI(false);
    }
  };

  // Sync category changes with suggested department & priority
  const handleCategoryChange = (categoryId) => {
    setSelectedCategoryId(categoryId);
    const cat = categories.find((c) => c._id === categoryId);
    if (cat) {
      if (cat.defaultDepartment) {
        setSuggestedDept(cat.defaultDepartment);
      }
      if (cat.defaultPriority) {
        setCalculatedPriority(cat.defaultPriority);
      }
    }
  };

  // Check nearby duplicates before submitting
  const checkNearbyIssues = async () => {
    setCheckingDuplicates(true);
    try {
      const res = await complaintApi.getNearbyComplaints(
        locationData.latitude,
        locationData.longitude,
        selectedCategoryId
      );
      if (res.success && res.data) {
        setNearbyDuplicates(res.data);
      }
    } catch (err) {
      console.warn('Duplicate check skipped:', err.message);
    } finally {
      setCheckingDuplicates(false);
      setStep(4);
    }
  };

  // Submit Complaint to Backend
  const handleSubmitComplaint = async () => {
    if (!selectedCategoryId) {
      setError('Please select a valid municipal issue category.');
      return;
    }

    const selectedCatObj = categories.find((c) => c._id === selectedCategoryId);
    if (selectedCatObj && selectedCatObj.slug === 'no-civic-issue') {
      setError('Cannot submit a complaint for "No Civic Issue". Please select an active civic defect category or upload a relevant photo.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a brief description of the issue.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('categoryId', selectedCategoryId);
      formData.append('latitude', locationData.latitude);
      formData.append('longitude', locationData.longitude);
      formData.append('address', locationData.address);
      formData.append('description', description);
      formData.append('aiAnalysis', JSON.stringify(aiResult || {}));

      const res = await complaintApi.createComplaint(formData);
      if (res.success) {
        setSubmittedComplaint(res.complaint);
        setStep(5);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategoryObj = categories.find((c) => c._id === selectedCategoryId);
  const isNoCivicIssueSelected = selectedCategoryObj?.slug === 'no-civic-issue' || !selectedCategoryId;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Header with AI Mode Badge & Config Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Report Infrastructure Issue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            AI-assisted defect detection, auto-routing & verified community impact points
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowKeyModal(true)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all shadow-xs ${
            aiStatus.isRealVisionActive
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              : 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>{aiStatus.isRealVisionActive ? '⚡ Gemini 1.5 Flash Vision' : '🧠 Local CLIP Vision AI'}</span>
          <Settings className="w-3 h-3 text-slate-400 ml-1" />
        </button>
      </div>

      {/* Wizard Header Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          <span>Step {Math.min(step, 4)} of 4</span>
          <span>{step === 5 ? 'Submission Complete' : 'Report Wizard'}</span>
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
            style={{ width: `${step === 5 ? 100 : (step / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: PHOTO UPLOAD */}
      {step === 1 && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">Step 1: Capture or Upload Photo</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Take a clear picture of the public infrastructure defect. The AI vision model will inspect the image directly.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            {imagePreview ? (
              <div className="space-y-4">
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-300 relative group shadow-md">
                  <img src={imagePreview} alt="Issue preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setImagePreview('');
                    }}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-md transition-all"
                    title="Remove and choose another image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>Selected: {selectedFile?.name}</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="text-emerald-600 hover:text-emerald-700 font-semibold"
                  >
                    Change photo
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl p-8 sm:p-12 text-center cursor-pointer bg-slate-50/60 hover:bg-emerald-50/20 transition-all group"
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Camera className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-slate-800">Upload or Snap Defect Photo</p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports JPEG, PNG, or WEBP up to 15MB
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm">
                  <UploadCloud className="w-4 h-4 text-emerald-600" />
                  Browse Files
                </div>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={runAIAnalysis}
              disabled={!selectedFile || analyzingAI}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {analyzingAI ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Inspecting Image with AI Vision...
                </>
              ) : (
                <>
                  Analyze with AI Vision
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: AI ANALYSIS PREVIEW */}
      {step === 2 && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                aiResult?.mode === 'REAL AI VISION MODE'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-blue-100 text-blue-900 border-blue-300'
              }`}>
                <Sparkles className="w-3.5 h-3.5" />
                {aiResult?.mode || 'AI VISION INSPECTION'}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Step 2: AI Visual Inspection</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              CivicAI analyzed the image pixels. Review the findings and confirm before proceeding.
            </p>
          </div>

          {/* NON-CIVIC ISSUE REJECTION BANNER */}
          {aiResult && !aiResult.issueDetected && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <XCircle className="w-5 h-5 text-amber-700 shrink-0" />
                <span>No Public Infrastructure Problem Detected</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                {aiResult.reasoningSummary || 'The AI inspected this photo and did not find a municipal defect (such as road damage, water leaks, uncollected trash, or electrical hazards).'}
              </p>
              <p className="text-[11px] text-amber-700 font-semibold pt-1">
                If this is a mistake, you can manually override by selecting a category below. Otherwise, please upload a relevant photo.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-3">
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-300 shadow-inner">
                <img src={imagePreview} alt="Defect analysis" className="w-full h-full object-cover" />
              </div>
              <p className="text-[11px] text-slate-400 text-center truncate">
                File: {selectedFile?.name}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Vision Assessment Result
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                  {aiResult?.detectedCategory || 'No Civic Issue'}
                  {aiResult?.issueDetected ? (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      Defect Detected
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                      Non-Civic Subject
                    </span>
                  )}
                </h3>
              </div>

              {/* Confidence Meter */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Model Confidence</span>
                  <span className={`font-bold ${
                    (aiResult?.confidence || 0) >= 85
                      ? 'text-emerald-600'
                      : (aiResult?.confidence || 0) >= 65
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}>
                    {aiResult?.confidence || 0}% ({aiResult?.confidenceTier || 'EVALUATED'})
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (aiResult?.confidence || 0) >= 85
                        ? 'bg-emerald-500'
                        : (aiResult?.confidence || 0) >= 65
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${aiResult?.confidence || 0}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {aiResult?.confidence >= 85
                    ? 'High Confidence Classification'
                    : aiResult?.confidence >= 65
                    ? 'Medium Confidence — Citizen verification recommended'
                    : 'Low Confidence — Please review and select category'}
                </p>
              </div>

              {/* Factual Description & Reasoning */}
              {aiResult?.description && (
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                  <p className="font-bold text-slate-800">Visual Evidence:</p>
                  <p className="text-slate-600 leading-relaxed">{aiResult.description}</p>
                </div>
              )}

              {/* Category Selector (Citizen confirmation/override) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm or Change Category:
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name} {cat.slug === 'no-civic-issue' ? '(No Defect)' : `(${cat.defaultPriority} Priority)`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Upload Different Photo
            </button>

            {isNoCivicIssueSelected ? (
              <button
                type="button"
                disabled={true}
                className="px-8 py-3 rounded-xl bg-slate-300 text-slate-500 font-bold text-sm cursor-not-allowed flex items-center gap-2"
                title="Select a civic defect category to proceed"
              >
                Select Valid Civic Category to Proceed
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
              >
                Confirm Issue & Pin Location
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: LOCATION PINPOINT */}
      {step === 3 && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">Step 3: Defect Location</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              CivicAI uses GPS to pinpoint the exact defect coordinates and routes it to the closest municipal field unit.
            </p>
          </div>

          <LocationPicker
            initialLat={locationData.latitude}
            initialLon={locationData.longitude}
            onLocationChange={(loc) => setLocationData(loc)}
          />

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to AI
            </button>
            <button
              type="button"
              onClick={checkNearbyIssues}
              disabled={checkingDuplicates}
              className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {checkingDuplicates ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking Proximity...
                </>
              ) : (
                <>
                  Next: Review & Submit
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW, PRIORITY, DUPLICATE WARNING & SUBMISSION */}
      {step === 4 && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">Step 4: Department Routing & Review</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Verify your complaint parameters before final submission to city authorities.
            </p>
          </div>

          {nearbyDuplicates.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CopyCheck className="w-5 h-5 text-amber-700" />
                <span>Smart Duplicate Warning ({nearbyDuplicates.length} nearby active reports)</span>
              </div>
              <p className="text-xs leading-relaxed text-amber-800">
                Another citizen has reported an issue within {nearbyDuplicates[0].distanceMeters}m of this location. 
                Submitting this report will automatically corroborate and boost the priority of the Master Issue!
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Suggested Responsible Department
              </span>
              <p className="text-sm font-bold text-slate-900">
                {suggestedDept?.name || 'Municipal Road Maintenance'}
              </p>
              <p className="text-[11px] text-slate-500">
                Determined automatically via database routing policy
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
                Computed Priority Level
              </span>
              <div className="pt-0.5">
                <PriorityBadge priority={calculatedPriority} size="sm" />
              </div>
              <p className="text-[11px] text-slate-500">
                Calculated based on hazard category, severity & community reports
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description & Context <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the defect, hazards, landmarks, or traffic disruptions..."
              className="w-full p-3.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            ></textarea>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Location
            </button>
            <button
              type="button"
              onClick={handleSubmitComplaint}
              disabled={submitting}
              className="px-10 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering Complaint...
                </>
              ) : (
                <>
                  Submit Official Complaint
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: SUCCESS CONFIRMATION RECEIPT */}
      {step === 5 && submittedComplaint && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Complaint Successfully Registered
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              {submittedComplaint.complaintId}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Your report has been queued for municipal verification and dispatched to{' '}
              <strong>{suggestedDept?.name || 'the department'}</strong>.
            </p>
          </div>

          <div className="max-w-md mx-auto p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-900">Civic Points Earned:</span>
              <span className="font-bold text-emerald-700">
                +{submittedComplaint.pointsAwarded || 20} pts
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              You will receive automated notification updates as the department starts work and completes resolution!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(`/complaints/${submittedComplaint.complaintId}`)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              Track Complaint Details
            </button>
            <button
              type="button"
              onClick={() => navigate('/citizen/dashboard')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider transition-all"
            >
              Go to My Impact Dashboard
            </button>
          </div>
        </div>
      )}

      {/* GOOGLE GEMINI VISION KEY MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  AI Computer Vision Settings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                CivicAI uses <strong>Google Gemini 1.5 Flash Multimodal Vision</strong> to inspect real images.
                You can activate it by entering a free API key from Google AI Studio.
              </p>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                <span>Active Vision Model:</span>
                <span className="font-bold text-emerald-700">{aiStatus.mode}</span>
              </div>
            </div>

            {keyMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                {keyMsg}
              </div>
            )}

            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google Gemini API Key
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:underline font-semibold"
              >
                <span>Get a free Gemini API Key from Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={keySaving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {keySaving ? 'Activating...' : 'Activate Gemini Vision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportIssuePage;

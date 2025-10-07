import React, { useState } from "react";
import { Plus, X, Upload } from "lucide-react";


// --- Confirm Dialog (Dark themed) ---
const ConfirmDialog = ({
  open,
  onCancel,
  onConfirm,
  auctionData,
  artworks,
}) => {
  if (!open) return null;

  const endStr = auctionData?.endDate
    ? new Date(auctionData.endDate).toLocaleString()
    : "—";

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* dialog */}
      <div className="relative w-[92%] max-w-md rounded-2xl border border-hellPink/70 bg-violetHeader/90 text-white shadow-2xl">
        <div className="p-5">
          <h3 className="text-lg font-semibold mb-3">Confirm Auction</h3>

          <div className="text-sm space-y-2 mb-5">
            <p>
              <span className="text-white/70">Artist:</span>{" "}
              <span className="font-medium">{auctionData.title || "—"}</span>
            </p>
            <p>
              <span className="text-white/70">End date:</span>{" "}
              <span className="font-medium">{endStr}</span>
            </p>
            <p>
              <span className="text-white/70">Artworks:</span>{" "}
              <span className="font-medium">{artworks?.length ?? 0}</span>
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-2xl border border-buttonPink bg-buttonPink text-white hover:bg-buttonPink/90 focus:outline-none focus:ring-2 focus:ring-buttonPink/40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 rounded-2xl bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/40"
            >
              Confirm & Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


const CreateAuctionModal = ({ isOpen, onClose, onSubmit }) => {
  const CLOUD_NAME = "dhomuf4kg";
  const UPLOAD_PRESET = "react_upload";
const [showConfirm, setShowConfirm] = useState(false);
  const [auctionData, setAuctionData] = useState({
    title: "",
    description: "",
    avatarUrl: "",
    endDate: "",
  });

  const [artworks, setArtworks] = useState([
    { title: "", description: "", images: "", startPrice: "", price: "", currency: "EUR" },
  ]);

  const [imageFiles, setImageFiles] = useState({});
  const [imagePreviews, setImagePreviews] = useState({});
  const [uploadingImages, setUploadingImages] = useState({});
  const [dragStates, setDragStates] = useState({});

  // Avatar States
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarDragging, setAvatarDragging] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleAuctionChange = (field, value) => {
    setAuctionData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const ne = { ...prev };
        delete ne[field];
        return ne;
      });
    }
  };

  // Avatar Handlers
  const processAvatarFile = (file) => {
    if (!file) return;
    const valid = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!valid.includes(file.type)) {
      setErrors((p) => ({ ...p, avatar: "Ungültiges Bildformat" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((p) => ({ ...p, avatar: "Datei zu groß (max. 5MB)" }));
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
    setErrors((p) => {
      const ne = { ...p };
      delete ne.avatar;
      return ne;
    });
  };

  const handleAvatarFileChange = (e) => processAvatarFile(e.target.files[0]);
  const handleAvatarDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setAvatarDragging(true); };
  const handleAvatarDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setAvatarDragging(false); };
  const handleAvatarDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleAvatarDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setAvatarDragging(false);
    const files = e.dataTransfer.files;
    if (files?.length) processAvatarFile(files[0]);
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return null;
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", avatarFile);
    formData.append("upload_preset", UPLOAD_PRESET);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Upload fehlgeschlagen");
      return data.secure_url;
    } catch (err) {
      console.error(err);
      throw new Error(err.message || "Avatar-Upload fehlgeschlagen");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Artworks
  const addArtwork = () => {
    if (artworks.length < 10) {
      setArtworks((prev) => [...prev, { title: "", description: "", images: "", startPrice: "", price: "", currency: "EUR" }]);
    }
  };

  const removeArtwork = (index) => {
    if (artworks.length > 1) {
      setArtworks((prev) => prev.filter((_, i) => i !== index));
      const nf = { ...imageFiles }, np = { ...imagePreviews }, nu = { ...uploadingImages }, nd = { ...dragStates };
      delete nf[index]; delete np[index]; delete nu[index]; delete nd[index];
      setImageFiles(nf); setImagePreviews(np); setUploadingImages(nu); setDragStates(nd);
    }
  };

  const handleArtworkChange = (index, field, value) => {
    setArtworks((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
    if (field === "startPrice") {
      setArtworks((prev) => prev.map((a, i) => (i === index ? { ...a, price: value } : a)));
    }
  };

  const processImageFile = (idx, file) => {
    if (!file) return;
    const valid = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!valid.includes(file.type)) {
      setErrors((p) => ({ ...p, [`artwork_${idx}_images`]: "Ungültiges Bildformat" }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors((p) => ({ ...p, [`artwork_${idx}_images`]: "Datei zu groß (max. 10MB)" }));
      return;
    }
    setImageFiles((p) => ({ ...p, [idx]: file }));
    const reader = new FileReader();
    reader.onloadend = () => setImagePreviews((p) => ({ ...p, [idx]: reader.result }));
    reader.readAsDataURL(file);
    setErrors((p) => {
      const ne = { ...p };
      delete ne[`artwork_${idx}_images`];
      return ne;
    });
  };

  const handleFileChange = (idx, e) => processImageFile(idx, e.target.files[0]);
  const handleDragEnter = (idx, e) => { e.preventDefault(); e.stopPropagation(); setDragStates((p) => ({ ...p, [idx]: true })); };
  const handleDragLeave = (idx, e) => { e.preventDefault(); e.stopPropagation(); setDragStates((p) => ({ ...p, [idx]: false })); };
  const handleDragOver = (idx, e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (idx, e) => {
    e.preventDefault(); e.stopPropagation(); setDragStates((p) => ({ ...p, [idx]: false }));
    const files = e.dataTransfer.files;
    if (files?.length) processImageFile(idx, files[0]);
  };

  const uploadToCloudinary = async (idx) => {
    const file = imageFiles[idx];
    if (!file) return null;
    setUploadingImages((p) => ({ ...p, [idx]: true }));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Upload fehlgeschlagen");
      return data.secure_url;
    } catch (err) {
      console.error(err);
      throw new Error(err.message || "Bild-Upload fehlgeschlagen");
    } finally {
      setUploadingImages((p) => ({ ...p, [idx]: false }));
    }
  };

  const validateStep1 = () => {
    const ne = {};
    if (!auctionData.title.trim()) ne.title = "Titel ist erforderlich";
    if (!auctionData.description.trim()) ne.description = "Beschreibung ist erforderlich";
    if (!auctionData.avatarUrl && !avatarFile) ne.avatar = "Avatar ist erforderlich";
    if (!auctionData.endDate) {
      ne.endDate = "Enddatum ist erforderlich";
    } else {
      const end = new Date(auctionData.endDate);
      if (end <= new Date()) ne.endDate = "Enddatum muss in der Zukunft liegen";
    }
    setErrors(ne);
    return Object.keys(ne).length === 0;
  };

  const validateStep2 = () => {
    const ne = {};
    let hasError = false;
    artworks.forEach((a, i) => {
      if (!a.title.trim()) { ne[`artwork_${i}_title`] = "Titel ist erforderlich"; hasError = true; }
      if (!a.description.trim()) { ne[`artwork_${i}_description`] = "Beschreibung ist erforderlich"; hasError = true; }
      if (!a.images.trim() && !imageFiles[i]) { ne[`artwork_${i}_images`] = "Bild ist erforderlich"; hasError = true; }
      if (!a.startPrice || a.startPrice <= 0) { ne[`artwork_${i}_startPrice`] = "Startpreis muss größer als 0 sein"; hasError = true; }
    });
    setErrors(ne);
    return !hasError;
  };

  const nextStep = () => { if (currentStep === 1 && validateStep1()) setCurrentStep(2); };
  const prevStep = () => { setCurrentStep(1); setErrors({}); };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    try {
      let avatarUrl = auctionData.avatarUrl;
      if (avatarFile) avatarUrl = await uploadAvatar();

      const uploadedArtworks = await Promise.all(
        artworks.map(async (a, idx) => {
          let imageUrl = a.images;
          if (imageFiles[idx]) imageUrl = await uploadToCloudinary(idx);
          return {
            ...a,
            images: imageUrl,
            startPrice: parseFloat(a.startPrice),
            price: parseFloat(a.price || a.startPrice),
            endDate: new Date(auctionData.endDate).toISOString(),
          };
        })
      );

      const submitData = {
        auction: { ...auctionData, avatarUrl, endDate: new Date(auctionData.endDate).toISOString() },
        artworks: uploadedArtworks,
      };

      await onSubmit(submitData);

      // reset
      setAuctionData({ title: "", description: "", avatarUrl: "", endDate: "" });
      setArtworks([{ title: "", description: "", images: "", startPrice: "", price: "", currency: "EUR" }]);
      setImageFiles({}); setImagePreviews({}); setUploadingImages({}); setDragStates({});
      setAvatarFile(null); setAvatarPreview(null);
      setCurrentStep(1); setErrors({});
      onClose();
    } catch (e) {
      console.error("Error creating auction:", e);
      setErrors({ submit: "Error creating auction" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex sm:items-center items-end justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-darkBackground/50 backdrop-blur-lg" onClick={onClose} />

      <div
        className="relative w-full max-w-full sm:max-w-2xl
                   sm:rounded-2xl rounded-t-2xl bg-violetHeader/30 border border-hellPink/80
                   shadow-2xl mx-0 flex flex-col overflow-hidden
                   min-h-[70dvh] max-h-[100dvh] sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 left-0 right-0 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-20 bg-violetHeader/70 backdrop-blur border-b border-white/10">
          <div>
            <h2 className="text-xl font-sans font-extralight text-white/80">{currentStep === 1 ? "New Auction" : "Add Art"}</h2>
            <p className="text-sm text-white/60">Step {currentStep} from 2</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1 pb-[7.5rem] sm:pb-32 overscroll-contain touch-pan-y">
          {currentStep === 1 && (
            <div className="space-y-5">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block mb-1 text-sm font-medium text-white">Artist name</label>
                <input
                  type="text"
                  id="title"
                  value={auctionData.title}
                  onChange={(e) => handleAuctionChange("title", e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg bg-white/5 text-white placeholder-white/60
                              border ${errors.title ? "border-red-500 focus:ring-red-500" : "border-white/10 focus:ring-white/30"}
                              focus:outline-none focus:ring-1`}
                  placeholder="Hans Wurst"
                />
                {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block mb-1 text-sm font-medium text-white">Artist Bio</label>
                <textarea
                  id="description"
                  value={auctionData.description}
                  onChange={(e) => handleAuctionChange("description", e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-2 rounded-lg bg-white/5 text-white placeholder-white/60
                              border ${errors.description ? "border-red-500 focus:ring-red-500" : "border-white/10 focus:ring-white/30"}
                              focus:outline-none focus:ring-1`}
                  placeholder="Your Story about you"
                />
                {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
              </div>

              {/* Avatar Upload */}
              <div>
                <label className="block mb-1 text-sm font-medium text-white">Profile Picture</label>

                {avatarPreview && (
                  <div className="mb-3 flex justify-center">
                    <div className="relative">
                      <img src={avatarPreview} alt="Avatar Preview" className="w-24 h-24 rounded-full object-cover bg-violetHeader/80 border-2 border-white/20" />
                      <button
                        type="button"
                        onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}

                <div
                  className={`flex items-center justify-center w-full border-2 border-dashed rounded-lg transition ${
                    avatarDragging ? "border-blue-500 bg-blue-50"
                    : errors.avatar ? "border-red-500 bg-red-50"
                    : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
                  }`}
                  onDragEnter={handleAvatarDragEnter}
                  onDragLeave={handleAvatarDragLeave}
                  onDragOver={handleAvatarDragOver}
                  onDrop={handleAvatarDrop}
                >
                  <label className="flex flex-col items-center justify-center w-full py-8 cursor-pointer">
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                      <Upload className="w-8 h-8 mb-2 text-white/70" />
                      <p className="mb-1 text-sm text-white/70"><span className="font-semibold">Click</span> or drag picture here</p>
                      <p className="text-xs text-white/60">PNG, JPG, GIF, WebP (max. 5MB)</p>
                    </div>
                    <input type="file" className="hidden" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleAvatarFileChange} />
                  </label>
                </div>

                {avatarFile && <p className="mt-2 text-xs text-green-500">✓ {avatarFile.name} selected</p>}
                {uploadingAvatar && <p className="mt-2 text-xs text-blue-400">Uploading...</p>}
                {errors.avatar && <p className="mt-2 text-xs text-red-500">{errors.avatar}</p>}
              </div>

              {/* End Date */}
              <div>
                <label htmlFor="endDate" className="block mb-1 text-sm font-medium text-white">Auction-End</label>
                <div className="relative">
                  <input
  type="datetime-local"
  id="endDate"
  value={auctionData.endDate}
  onChange={(e) => handleAuctionChange("endDate", e.target.value)}
  min={new Date(Date.now() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)}
  step="60"
  className={`w-full px-4 py-2 rounded-lg bg-white/5 text-white placeholder-white/60
              border ${errors.endDate ? "border-red-500 focus:ring-red-500" : "border-white/10 focus:ring-white/30"}
              focus:outline-none focus:ring-1`}
/>

                  <div
                    className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 cursor-pointer text-white/60 hover:text-white/80"
                    onClick={() => document.getElementById("endDate").showPicker()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                </div>
                {errors.endDate && <p className="text-sm text-red-500 mt-1">{errors.endDate}</p>}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div>
              <div className="pb-4 mb-6 border-b border-white/10">
                <h3 className="text-lg font-medium text-white">Art ({artworks.length}/10)</h3>
              </div>

              <div className="space-y-6">
                {artworks.map((artwork, index) => (
                  <div key={index} className="min-w-0 border border-white/10 rounded-xl p-4 sm:p-5 bg-white/5 space-y-4 shadow-inner">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-white">Art {index + 1}</h4>
                      {artworks.length > 1 && (
                        <button type="button" onClick={() => removeArtwork(index)} className="text-red-400 hover:text-red-500">✕</button>
                      )}
                    </div>

                    {/* Title */}
                    <input
                      type="text"
                      placeholder="Title"
                      value={artwork.title}
                      onChange={(e) => handleArtworkChange(index, "title", e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg bg_white/5 text-white placeholder-white/60
                                  border ${errors[`artwork_${index}_title`] ? "border-red-500 focus:ring-red-500" : "border-white/10 focus:ring-white/30"}
                                  focus:outline-none focus:ring-1`.replace("bg_white/5", "bg-white/5")}
                    />
                    {errors[`artwork_${index}_title`] && <p className="text-xs text-red-500">{errors[`artwork_${index}_title`]}</p>}

                    {/* Image Upload */}
                    <div>
                      {imagePreviews[index] && (
                        <div className="mb-3 relative">
                          <img src={imagePreviews[index]} alt="Preview" className="w-full h-36 sm:h-48 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => {
                              const nf = { ...imageFiles }, np = { ...imagePreviews };
                              delete nf[index]; delete np[index];
                              setImageFiles(nf); setImagePreviews(np);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}

                      <div
                        className={`flex items-center justify-center w-full border-2 border-dashed rounded-lg transition ${
                          dragStates[index] ? "border-blue-500 bg-blue-50"
                          : errors[`artwork_${index}_images`] ? "border-red-500 bg-red-50"
                          : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
                        }`}
                        onDragEnter={(e) => handleDragEnter(index, e)}
                        onDragLeave={(e) => handleDragLeave(index, e)}
                        onDragOver={(e) => handleDragOver(index, e)}
                        onDrop={(e) => handleDrop(index, e)}
                      >
                        <label className="flex flex-col items-center justify-center w-full py-8 cursor-pointer">
                          <div className="flex flex-col items-center justify-center pointer-events-none">
                            <Upload className="w-8 h-8 mb-2 text-white/70" />
                            <p className="mb-1 text-sm text-white/70"><span className="font-semibold">Click</span> or drag picture here</p>
                            <p className="text-xs text-white/60">PNG, JPG, GIF, WebP (max. 10MB)</p>
                          </div>
                          <input type="file" className="hidden" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={(e) => handleFileChange(index, e)} />
                        </label>
                      </div>

                      {imageFiles[index] && <p className="mt-2 text-xs text-green-500">✓ {imageFiles[index].name} selected</p>}
                      {uploadingImages[index] && <p className="mt-2 text-xs text-blue-400">Uploading...</p>}
                      {errors[`artwork_${index}_images`] && <p className="mt-2 text-xs text-red-500">{errors[`artwork_${index}_images`]}</p>}
                    </div>

                    {/* Description */}
                    <textarea
                      placeholder="Description"
                      value={artwork.description}
                      onChange={(e) => handleArtworkChange(index, "description", e.target.value)}
                      rows={3}
                      className={`w-full px-4 py-2 rounded-lg bg-white/5 text-white placeholder-white/60
                                  border ${errors[`artwork_${index}_description`] ? "border-red-500 focus:ring-red-500" : "border-white/10 focus:ring-white/30"}
                                  focus:outline-none focus:ring-1`}
                    />
                    {errors[`artwork_${index}_description`] && <p className="text-xs text-red-500">{errors[`artwork_${index}_description`]}</p>}

                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="Start price (€)"
                        value={artwork.startPrice}
                        onChange={(e) => handleArtworkChange(index, "startPrice", e.target.value)}
                        className={`w-full px-4 py-2 rounded-lg bg-white/5 text-white placeholder-white/60
                                    border ${errors[`artwork_${index}_startPrice`] ? "border-red-500 focus:ring-red-500" : "border-white/10 focus:ring-white/30"}
                                    focus:outline-none focus:ring-1`}
                      />
                    </div>

                    {errors[`artwork_${index}_startPrice`] && <p className="text-xs text-red-500">{errors[`artwork_${index}_startPrice`]}</p>}
                  </div>
                ))}

                

                {errors.submit && (
                  <div className="p-4 bg-red-500/10 border border-red-500/40 text-red-300 rounded-lg">
                    {errors.submit}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
  className="sticky bottom-0 left-0 right-0 z-30 px-4 sm:px-6 py-3 sm:py-4
             pb-[calc(env(safe-area-inset-bottom)+12px)]
             bg-violetHeader/70 backdrop-blur border-t border-white/10
             flex items-center justify-between gap-2 sm:gap-3"
>
  {/* DE: Linke Seite – nur 'Back' auf Schritt 2 */}
  <div className="flex-1">
    {currentStep === 2 && (
      <button
        type="button"
        onClick={prevStep}
        className="px-6 py-2 rounded-2xl border border-buttonPink bg-buttonPink text-white hover:bg-buttonPink/80"
      >
        Back
      </button>
    )}
  </div>

  {/* DE: Rechte Seite – Next (Schritt 1) ODER Add + Create (Schritt 2) */}
  <div className="flex items-center gap-2 sm:gap-3">
    {currentStep === 1 ? (
      <button
        type="button"
        onClick={nextStep}
        className="px-6 py-2 rounded-2xl bg-coldYellow/70 border border-coldYellow text-white hover:bg-coldYellow"
      >
        Next
      </button>
    ) : (
      <>
        {/* DE: Add neben Create */}
        <button
          type="button"
          onClick={addArtwork}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
        >
          <Plus size={18} />
          Add
        </button>

        {/* DE: Create Auction mit Bestätigungsdialog */}
        <button
          onClick={() => setShowConfirm(true)}
          disabled={loading || uploadingAvatar || Object.values(uploadingImages).some(Boolean)}
          className="px-6 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Auction"}
        </button>
      </>
       )}
  </div>
</div>

{/* Confirm Dialog */}
<ConfirmDialog
  open={showConfirm}
  onCancel={() => setShowConfirm(false)}
  onConfirm={() => {
    setShowConfirm(false);
    handleSubmit();
  }}
  auctionData={auctionData}
  artworks={artworks}
/>

        </div>
      </div>
    
  );
};

export default CreateAuctionModal;
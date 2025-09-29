// components/CreateAuctionModal.jsx
import React, { useState } from "react";
import { Plus, X } from "lucide-react";

// DE: Helper – absolute http/https/data-URLs ODER relative /uploads-Pfade erlauben
const isValidImageUrl = (v) => {
  if (!v || !v.trim()) return false;
  const s = v.trim();
  if (/^(https?:)?\/\//i.test(s) || /^data:image\//i.test(s)) return true;
  if (s.startsWith("/uploads") || s.startsWith("./uploads")) return true;
  return false;
};

const CreateAuctionModal = ({ isOpen, onClose, onSubmit }) => {
  const [auctionData, setAuctionData] = useState({
    title: "",
    description: "",
    bannerImageUrl: "",
    minIncrementDefault: 5,
    endDate: "",
  });

  const [artworks, setArtworks] = useState([
    {
      title: "",
      description: "",
      images: "",
      startPrice: "",
      endPrice: "",
      price: "",
      currency: "EUR",
    },
  ]);

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // DE: Auktionsdaten aktualisieren
  const handleAuctionChange = (field, value) => {
    setAuctionData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // DE: Neues Kunstwerk hinzufügen (max 10)
  const addArtwork = () => {
    if (artworks.length < 10) {
      setArtworks((prev) => [
        ...prev,
        {
          title: "",
          description: "",
          images: "",
          startPrice: "",
          endPrice: "",
          price: "",
          currency: "EUR",
        },
      ]);
    }
  };

  // DE: Kunstwerk entfernen
  const removeArtwork = (index) => {
    if (artworks.length > 1) {
      setArtworks((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // DE: Kunstwerk-Felder aktualisieren
  const handleArtworkChange = (index, field, value) => {
    setArtworks((prev) =>
      prev.map((art, i) => (i === index ? { ...art, [field]: value } : art))
    );
    if (field === "startPrice") {
      setArtworks((prev) =>
        prev.map((art, i) => (i === index ? { ...art, price: value } : art))
      );
    }
  };

  // DE: Validierung Schritt 1 (Auktion)
  const validateStep1 = () => {
    const newErrors = {};

    if (!auctionData.title.trim()) newErrors.title = "Title is required";
    if (!auctionData.description.trim())
      newErrors.description = "Description is required";

    if (!auctionData.bannerImageUrl.trim()) {
      newErrors.bannerImageUrl = "Banner image is required";
    } else if (!isValidImageUrl(auctionData.bannerImageUrl)) {
      newErrors.bannerImageUrl =
        "Invalid image URL (use absolute URL or /uploads path)";
    }

    if (!auctionData.endDate) {
      newErrors.endDate = "End date is required";
    } else {
      const endDate = new Date(auctionData.endDate);
      const now = new Date();
      if (endDate <= now) {
        newErrors.endDate = "End date must be in the future";
      }
    }

    if (auctionData.minIncrementDefault <= 0) {
      newErrors.minIncrementDefault = "Min increment must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // DE: Validierung Schritt 2 (Kunstwerke)
  const validateStep2 = () => {
    const newErrors = {};
    let hasError = false;

    artworks.forEach((art, index) => {
      if (!art.title.trim()) {
        newErrors[`artwork_${index}_title`] = "Title is required";
        hasError = true;
      }
      if (!art.description.trim()) {
        newErrors[`artwork_${index}_description`] = "Description is required";
        hasError = true;
      }
      if (!art.images.trim()) {
        newErrors[`artwork_${index}_images`] = "Image URL is required";
        hasError = true;
      } else if (!isValidImageUrl(art.images)) {
        newErrors[`artwork_${index}_images`] =
          "Invalid image URL (use absolute URL or /uploads path)";
        hasError = true;
      }
      if (!art.startPrice || art.startPrice <= 0) {
        newErrors[`artwork_${index}_startPrice`] =
          "Start price must be greater than 0";
        hasError = true;
      }
      if (!art.endPrice || art.endPrice <= 0) {
        newErrors[`artwork_${index}_endPrice`] =
          "Max price must be greater than 0";
        hasError = true;
      }
      if (
        art.endPrice &&
        art.startPrice &&
        parseFloat(art.endPrice) <= parseFloat(art.startPrice)
      ) {
        newErrors[`artwork_${index}_endPrice`] =
          "Max price must be higher than start price";
        hasError = true;
      }
    });

    setErrors(newErrors);
    return !hasError;
  };

  // DE: Schrittwechsel
  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
  };
  const prevStep = () => {
    setCurrentStep(1);
    setErrors({});
  };

  // DE: Absenden
  const handleSubmit = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    try {
      const submitData = {
        auction: {
          ...auctionData,
          endDate: new Date(auctionData.endDate).toISOString(),
        },
        artworks: artworks.map((art) => ({
          ...art,
          startPrice: parseFloat(art.startPrice),
          endPrice: parseFloat(art.endPrice),
          price: parseFloat(art.price || art.startPrice),
          endDate: new Date(auctionData.endDate).toISOString(),
        })),
      };

      await onSubmit(submitData);

      // DE: Formular zurücksetzen
      setAuctionData({
        title: "",
        description: "",
        bannerImageUrl: "",
        minIncrementDefault: 5,
        endDate: "",
      });
      setArtworks([
        {
          title: "",
          description: "",
          images: "",
          startPrice: "",
          endPrice: "",
          price: "",
          currency: "EUR",
        },
      ]);
      setCurrentStep(1);
      setErrors({});
      onClose();
    } catch (error) {
      console.error("Error creating auction:", error);
      setErrors({ submit: "Failed to create auction" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* DE: Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* DE: Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* DE: Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {currentStep === 1 ? "Create New Auction" : "Add Artworks"}
            </h2>
            <p className="text-sm text-gray-500">Step {currentStep} of 2</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        {/* DE: Body */}
        <div className="px-6 py-6">
          {/* DE: Schritt 1 – Auktion */}
          {currentStep === 1 && (
            <div className="space-y-5">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block mb-1 text-sm font-medium text-gray-700">
                  Auction Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={auctionData.title}
                  onChange={(e) => handleAuctionChange("title", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-1 ${
                    errors.title ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="e.g., Contemporary Art Auction 2024"
                />
                {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block mb-1 text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  value={auctionData.description}
                  onChange={(e) => handleAuctionChange("description", e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-1 ${
                    errors.description ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="Describe your auction..."
                />
                {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
              </div>

              {/* Banner Image URL + Preview */}
              <div>
                <label htmlFor="bannerImageUrl" className="block mb-1 text-sm font-medium text-gray-700">
                  Banner Image (URL or /uploads/…)
                </label>
                <input
                  type="text"
                  id="bannerImageUrl"
                  value={auctionData.bannerImageUrl}
                  onChange={(e) => handleAuctionChange("bannerImageUrl", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-1 ${
                    errors.bannerImageUrl ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="https://example.com/banner.jpg or /uploads/banners/file.jpg"
                />
                {errors.bannerImageUrl && (
                  <p className="text-sm text-red-600 mt-1">{errors.bannerImageUrl}</p>
                )}
                {isValidImageUrl(auctionData.bannerImageUrl) && (
                  <div className="mt-2">
                    <img
                      src={auctionData.bannerImageUrl}
                      alt="Banner preview"
                      className="w-full h-32 object-cover rounded border"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                )}
              </div>

              {/* Min Increment */}
              <div>
                <label htmlFor="minIncrementDefault" className="block mb-1 text-sm font-medium text-gray-700">
                  Minimum Increment (€)
                </label>
                <input
                  type="number"
                  id="minIncrementDefault"
                  min="1"
                  value={auctionData.minIncrementDefault}
                  onChange={(e) => handleAuctionChange("minIncrementDefault", parseInt(e.target.value) || 0)}
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-1 ${
                    errors.minIncrementDefault ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                {errors.minIncrementDefault && (
                  <p className="text-sm text-red-600 mt-1">{errors.minIncrementDefault}</p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label htmlFor="endDate" className="block mb-1 text-sm font-medium text-gray-700">
                  Auction Ends
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  value={auctionData.endDate}
                  onChange={(e) => handleAuctionChange("endDate", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-1 ${
                    errors.endDate ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                {errors.endDate && <p className="text-sm text-red-600 mt-1">{errors.endDate}</p>}
              </div>
            </div>
          )}

          {/* DE: Schritt 2 – Kunstwerke */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-800">
                  Artworks ({artworks.length}/10)
                </h3>
                {artworks.length < 10 && (
                  <button
                    type="button"
                    onClick={addArtwork}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    + Add
                  </button>
                )}
              </div>

              {artworks.map((art, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-800">Artwork {index + 1}</h4>
                    {artworks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArtwork(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Title"
                    value={art.title}
                    onChange={(e) => handleArtworkChange(index, "title", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-gray-900"
                  />
                  {errors[`artwork_${index}_title`] && (
                    <p className="text-sm text-red-600 mt-1">{errors[`artwork_${index}_title`]}</p>
                  )}

                  <input
                    type="text"
                    placeholder="Image URL or /uploads/…"
                    value={art.images}
                    onChange={(e) => handleArtworkChange(index, "images", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-gray-900"
                  />
                  {errors[`artwork_${index}_images`] && (
                    <p className="text-sm text-red-600 mt-1">{errors[`artwork_${index}_images`]}</p>
                  )}
                  {isValidImageUrl(art.images) && (
                    <div className="mt-2">
                      <img
                        src={art.images}
                        alt={`Artwork ${index + 1} preview`}
                        className="w-full h-28 object-cover rounded border"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    </div>
                  )}

                  <textarea
                    placeholder="Description"
                    value={art.description}
                    onChange={(e) => handleArtworkChange(index, "description", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-gray-900"
                  />
                  {errors[`artwork_${index}_description`] && (
                    <p className="text-sm text-red-600 mt-1">{errors[`artwork_${index}_description`]}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="Start price (€)"
                      value={art.startPrice}
                      onChange={(e) => handleArtworkChange(index, "startPrice", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-gray-900"
                    />
                    {errors[`artwork_${index}_startPrice`] && (
                      <p className="text-sm text-red-600 mt-1 col-span-2">
                        {errors[`artwork_${index}_startPrice`]}
                      </p>
                    )}

                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="Max price (€)"
                      value={art.endPrice}
                      onChange={(e) => handleArtworkChange(index, "endPrice", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-gray-900"
                    />
                    {errors[`artwork_${index}_endPrice`] && (
                      <p className="text-sm text-red-600 mt-1 col-span-2">
                        {errors[`artwork_${index}_endPrice`]}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {errors.submit && (
                <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                  {errors.submit}
                </div>
              )}
            </div>
          )}
        </div>

        {/* DE: Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-between">
          {currentStep === 2 && (
            <button
              type="button"
              onClick={prevStep}
              className="text-black px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="text-black px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            {currentStep === 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
              >
                {loading ? "Creating…" : "Create Auction"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAuctionModal;

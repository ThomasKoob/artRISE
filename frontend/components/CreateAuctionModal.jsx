import React, { useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";

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

  // Auktionsdaten aktualisieren
  const handleAuctionChange = (field, value) => {
    setAuctionData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Kunstwerk hinzufügen
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

  // Kunstwerk entfernen
  const removeArtwork = (index) => {
    if (artworks.length > 1) {
      setArtworks((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Kunstwerk-Daten aktualisieren
  const handleArtworkChange = (index, field, value) => {
    setArtworks((prev) =>
      prev.map((artwork, i) =>
        i === index ? { ...artwork, [field]: value } : artwork
      )
    );

    if (field === "startPrice") {
      setArtworks((prev) =>
        prev.map((artwork, i) =>
          i === index ? { ...artwork, price: value } : artwork
        )
      );
    }
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!auctionData.title.trim()) newErrors.title = "Titel ist erforderlich";
    if (!auctionData.description.trim())
      newErrors.description = "Beschreibung ist erforderlich";
    if (!auctionData.bannerImageUrl.trim()) {
      newErrors.bannerImageUrl = "Banner-Bild ist erforderlich";
    } else {
      try {
        new URL(auctionData.bannerImageUrl);
      } catch {
        newErrors.bannerImageUrl = "Ungültige URL";
      }
    }

    if (!auctionData.endDate) {
      newErrors.endDate = "Enddatum ist erforderlich";
    } else {
      const endDate = new Date(auctionData.endDate);
      const now = new Date();
      if (endDate <= now) {
        newErrors.endDate = "Enddatum muss in der Zukunft liegen";
      }
    }

    if (auctionData.minIncrementDefault <= 0) {
      newErrors.minIncrementDefault = "Mindestgebot muss größer als 0 sein";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    let hasError = false;

    artworks.forEach((artwork, index) => {
      if (!artwork.title.trim()) {
        newErrors[`artwork_${index}_title`] = "Titel ist erforderlich";
        hasError = true;
      }

      if (!artwork.description.trim()) {
        newErrors[`artwork_${index}_description`] =
          "Beschreibung ist erforderlich";
        hasError = true;
      }

      if (!artwork.images.trim()) {
        newErrors[`artwork_${index}_images`] = "Bild-URL ist erforderlich";
        hasError = true;
      } else {
        try {
          new URL(artwork.images);
        } catch {
          newErrors[`artwork_${index}_images`] = "Ungültige URL";
          hasError = true;
        }
      }

      if (!artwork.startPrice || artwork.startPrice <= 0) {
        newErrors[`artwork_${index}_startPrice`] =
          "Startpreis muss größer als 0 sein";
        hasError = true;
      }

      if (!artwork.endPrice || artwork.endPrice <= 0) {
        newErrors[`artwork_${index}_endPrice`] =
          "Maximalpreis muss größer als 0 sein";
        hasError = true;
      }

      if (
        artwork.endPrice &&
        artwork.startPrice &&
        parseFloat(artwork.endPrice) <= parseFloat(artwork.startPrice)
      ) {
        newErrors[`artwork_${index}_endPrice`] =
          "Maximalpreis muss höher als Startpreis sein";
        hasError = true;
      }
    });

    setErrors(newErrors);
    return !hasError;
  };

  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const prevStep = () => {
    setCurrentStep(1);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setLoading(true);

    try {
      const submitData = {
        auction: {
          ...auctionData,
          endDate: new Date(auctionData.endDate).toISOString(),
        },
        artworks: artworks.map((artwork) => ({
          ...artwork,
          startPrice: parseFloat(artwork.startPrice),
          endPrice: parseFloat(artwork.endPrice),
          price: parseFloat(artwork.price || artwork.startPrice),
          endDate: new Date(auctionData.endDate).toISOString(),
        })),
      };

      await onSubmit(submitData);

      // Reset form
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
      setErrors({ submit: "Fehler beim Erstellen der Auktion" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
   <div className="fixed inset-0 z-50 flex items-center justify-center">
  {/* Overlay */}
  <div
    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
    onClick={onClose}
  />

  {/* Modal */}
  <div
    className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl mx-4"
    onClick={(e) => e.stopPropagation()}
  >
    {/* Header */}
    <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold text-gray-800">
          {currentStep === 1 ? "Neue Auktion erstellen" : "Kunstwerke hinzufügen"}
        </h2>
        <p className="text-sm text-gray-500">Schritt {currentStep} von 2</p>
      </div>
      <button
        onClick={onClose}
        className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
      >
        <X size={20} />
      </button>
    </div>

    {/* Body */}
    <div className="px-6 py-6">
      {/* Step 1: Auction Data */}
      {currentStep === 1 && (
        <div className="space-y-5">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block mb-1 text-sm font-medium text-gray-700">
              Auktions-Titel
            </label>
            <input
              type="text"
              id="title"
              value={auctionData.title}
              onChange={(e) => handleAuctionChange("title", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-1 ${
                errors.title ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Z.B. Moderne Kunst Auktion 2024"
            />
            {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block mb-1 text-sm font-medium text-gray-700">
              Beschreibung
            </label>
            <textarea
              id="description"
              value={auctionData.description}
              onChange={(e) => handleAuctionChange("description", e.target.value)}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-1 ${
                errors.description ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Beschreiben Sie Ihre Auktion..."
            />
            {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
          </div>

          {/* Banner Image */}
          <div>
            <label htmlFor="bannerImageUrl" className="block mb-1 text-sm font-medium text-gray-700">
              Banner-Bild URL
            </label>
            <input
              type="url"
              id="bannerImageUrl"
              value={auctionData.bannerImageUrl}
              onChange={(e) => handleAuctionChange("bannerImageUrl", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-1 ${
                errors.bannerImageUrl ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="https://example.com/banner.jpg"
            />
            {errors.bannerImageUrl && <p className="text-sm text-red-600 mt-1">{errors.bannerImageUrl}</p>}
          </div>

          {/* Increment */}
          <div>
            <label htmlFor="minIncrementDefault" className="block mb-1 text-sm font-medium text-gray-700">
              Mindest-Increment (€)
            </label>
            <input
              type="number"
              id="minIncrementDefault"
              min="1"
              value={auctionData.minIncrementDefault}
              onChange={(e) =>
                handleAuctionChange("minIncrementDefault", parseInt(e.target.value) || 0)
              }
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
              Auktions-Ende
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

      {/* Step 2: Artworks */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-800">
              Kunstwerke ({artworks.length}/10)
            </h3>
            {artworks.length < 10 && (
              <button
                type="button"
                onClick={addArtwork}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                + Hinzufügen
              </button>
            )}
          </div>

          {artworks.map((artwork, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-800">Kunstwerk {index + 1}</h4>
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
                placeholder="Titel"
                value={artwork.title}
                onChange={(e) => handleArtworkChange(index, "title", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-gray-900"
              />

              <input
                type="url"
                placeholder="Bild-URL"
                value={artwork.images}
                onChange={(e) => handleArtworkChange(index, "images", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-gray-900"
              />

              <textarea
                placeholder="Beschreibung"
                value={artwork.description}
                onChange={(e) => handleArtworkChange(index, "description", e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-gray-900"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Startpreis (€)"
                  value={artwork.startPrice}
                  onChange={(e) => handleArtworkChange(index, "startPrice", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-gray-900"
                />
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Maximalpreis (€)"
                  value={artwork.endPrice}
                  onChange={(e) => handleArtworkChange(index, "endPrice", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 text-gray-900"
                />
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

    {/* Footer */}
    <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-between">
      {currentStep === 2 && (
        <button
          type="button"
          onClick={prevStep}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Zurück
        </button>
      )}
      <div className="flex gap-3 ml-auto">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Abbrechen
        </button>
        {currentStep === 1 ? (
          <button
            type="button"
            onClick={nextStep}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Weiter
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? "Wird erstellt..." : "Auktion erstellen"}
          </button>
        )}
      </div>
    </div>
  </div>
</div>

  );
};

export default CreateAuctionModal;

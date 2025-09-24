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
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-[1400px] max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-black">
              {currentStep === 1
                ? "Neue Auktion erstellen"
                : "Kunstwerke hinzufügen"}
            </div>
            <p className="text-sm text-black">Schritt {currentStep} von 2</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step 1: Auktionsdaten */}
        {currentStep === 1 && (
          <div className="flex flex-col max-w-[1400px] mx-auto">
            <div className="max-w-md mx-auto w-full p-6">
              <div className="mb-4">
                <label className="block mb-2 text-black" htmlFor="title">
                  Auktions-Titel
                </label>
                <input
                  type="text"
                  id="title"
                  value={auctionData.title}
                  onChange={(e) => handleAuctionChange("title", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none text-black ${
                    errors.title
                      ? "focus:border-red-500 border-red-500"
                      : "focus:border-blue-500"
                  }`}
                  placeholder="Z.B. Moderne Kunst Auktion 2024"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block mb-2 text-black" htmlFor="description">
                  Beschreibung
                </label>
                <textarea
                  id="description"
                  value={auctionData.description}
                  onChange={(e) =>
                    handleAuctionChange("description", e.target.value)
                  }
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none text-black ${
                    errors.description
                      ? "focus:border-red-500 border-red-500"
                      : "focus:border-blue-500"
                  }`}
                  placeholder="Beschreiben Sie Ihre Auktion..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label
                  className="block mb-2 text-black"
                  htmlFor="bannerImageUrl"
                >
                  Banner-Bild URL
                </label>
                <input
                  type="url"
                  id="bannerImageUrl"
                  value={auctionData.bannerImageUrl}
                  onChange={(e) =>
                    handleAuctionChange("bannerImageUrl", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none text-black ${
                    errors.bannerImageUrl
                      ? "focus:border-red-500 border-red-500"
                      : "focus:border-blue-500"
                  }`}
                  placeholder="https://example.com/banner.jpg"
                />
                {errors.bannerImageUrl && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.bannerImageUrl}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label
                  className="block mb-2 text-black"
                  htmlFor="minIncrementDefault"
                >
                  Mindest-Increment (€)
                </label>
                <input
                  type="number"
                  id="minIncrementDefault"
                  min="1"
                  value={auctionData.minIncrementDefault}
                  onChange={(e) =>
                    handleAuctionChange(
                      "minIncrementDefault",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none text-black ${
                    errors.minIncrementDefault
                      ? "focus:border-red-500 border-red-500"
                      : "focus:border-blue-500"
                  }`}
                />
                {errors.minIncrementDefault && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.minIncrementDefault}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-black" htmlFor="endDate">
                  Auktions-Ende
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  value={auctionData.endDate}
                  onChange={(e) =>
                    handleAuctionChange("endDate", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none text-black ${
                    errors.endDate
                      ? "focus:border-red-500 border-red-500"
                      : "focus:border-blue-500"
                  }`}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Kunstwerke */}
        {currentStep === 2 && (
          <div className="flex flex-col max-w-[1400px] mx-auto">
            <div className="max-w-md mx-auto w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-black">
                  Kunstwerke ({artworks.length}/10)
                </h3>
                {artworks.length < 10 && (
                  <button
                    type="button"
                    onClick={addArtwork}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    <Plus size={16} />
                    Hinzufügen
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {artworks.map((artwork, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-black">
                        Kunstwerk {index + 1}
                      </h4>
                      {artworks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArtwork(index)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block mb-2 text-black">Titel</label>
                        <input
                          type="text"
                          value={artwork.title}
                          onChange={(e) =>
                            handleArtworkChange(index, "title", e.target.value)
                          }
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none text-black ${
                            errors[`artwork_${index}_title`]
                              ? "focus:border-red-500 border-red-500"
                              : "focus:border-blue-500"
                          }`}
                          placeholder="Kunstwerk-Titel"
                        />
                        {errors[`artwork_${index}_title`] && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors[`artwork_${index}_title`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block mb-2 text-black">
                          Bild-URL
                        </label>
                        <input
                          type="url"
                          value={artwork.images}
                          onChange={(e) =>
                            handleArtworkChange(index, "images", e.target.value)
                          }
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none text-black ${
                            errors[`artwork_${index}_images`]
                              ? "focus:border-red-500 border-red-500"
                              : "focus:border-blue-500"
                          }`}
                          placeholder="https://example.com/bild.jpg"
                        />
                        {errors[`artwork_${index}_images`] && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors[`artwork_${index}_images`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block mb-2 text-black">
                          Beschreibung
                        </label>
                        <textarea
                          value={artwork.description}
                          onChange={(e) =>
                            handleArtworkChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          rows={3}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none text-black ${
                            errors[`artwork_${index}_description`]
                              ? "focus:border-red-500 border-red-500"
                              : "focus:border-blue-500"
                          }`}
                          placeholder="Beschreibung des Kunstwerks"
                        />
                        {errors[`artwork_${index}_description`] && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors[`artwork_${index}_description`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block mb-2 text-black">
                          Startpreis (€)
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={artwork.startPrice}
                          onChange={(e) =>
                            handleArtworkChange(
                              index,
                              "startPrice",
                              e.target.value
                            )
                          }
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none text-black ${
                            errors[`artwork_${index}_startPrice`]
                              ? "focus:border-red-500 border-red-500"
                              : "focus:border-blue-500"
                          }`}
                          placeholder="100"
                        />
                        {errors[`artwork_${index}_startPrice`] && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors[`artwork_${index}_startPrice`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block mb-2 text-black">
                          Maximalpreis (€)
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={artwork.endPrice}
                          onChange={(e) =>
                            handleArtworkChange(
                              index,
                              "endPrice",
                              e.target.value
                            )
                          }
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none text-black ${
                            errors[`artwork_${index}_endPrice`]
                              ? "focus:border-red-500 border-red-500"
                              : "focus:border-blue-500"
                          }`}
                          placeholder="1000"
                        />
                        {errors[`artwork_${index}_endPrice`] && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors[`artwork_${index}_endPrice`]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {errors.submit && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {errors.submit}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4">
          <div className="max-w-md mx-auto w-full flex justify-between">
            <div>
              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Zurück
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>

              {currentStep === 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Weiter
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  {loading ? "Wird erstellt..." : "Auktion erstellen"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAuctionModal;

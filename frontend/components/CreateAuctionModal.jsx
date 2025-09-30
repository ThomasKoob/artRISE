import React, { useState } from "react";
import { Plus, X, Upload } from "lucide-react";

const CreateAuctionModal = ({ isOpen, onClose, onSubmit }) => {
  const CLOUD_NAME = "dhomuf4kg";
  const UPLOAD_PRESET = "react_upload";

  const [auctionData, setAuctionData] = useState({
    title: "",
    description: "",
    minIncrementDefault: 5,
    endDate: "",
  });

  const [artworks, setArtworks] = useState([
    {
      title: "",
      description: "",
      images: "",
      startPrice: "",
      price: "",
      currency: "EUR",
    },
  ]);

  const [imageFiles, setImageFiles] = useState({});
  const [imagePreviews, setImagePreviews] = useState({});
  const [uploadingImages, setUploadingImages] = useState({});
  const [dragStates, setDragStates] = useState({});

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
      // Cleanup states
      const newFiles = { ...imageFiles };
      const newPreviews = { ...imagePreviews };
      const newUploading = { ...uploadingImages };
      const newDrag = { ...dragStates };
      delete newFiles[index];
      delete newPreviews[index];
      delete newUploading[index];
      delete newDrag[index];
      setImageFiles(newFiles);
      setImagePreviews(newPreviews);
      setUploadingImages(newUploading);
      setDragStates(newDrag);
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

  // Validiert und verarbeitet Bild-Datei
  const processImageFile = (idx, file) => {
    if (!file) return;

    const valid = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!valid.includes(file.type)) {
      setErrors((p) => ({
        ...p,
        [`artwork_${idx}_images`]: "Ungültiges Bildformat",
      }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors((p) => ({
        ...p,
        [`artwork_${idx}_images`]: "Datei zu groß (max. 10MB)",
      }));
      return;
    }

    setImageFiles((p) => ({ ...p, [idx]: file }));
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviews((p) => ({ ...p, [idx]: reader.result }));
    };
    reader.readAsDataURL(file);
    setErrors((p) => {
      const newErrors = { ...p };
      delete newErrors[`artwork_${idx}_images`];
      return newErrors;
    });
  };

  const handleFileChange = (idx, e) => {
    processImageFile(idx, e.target.files[0]);
  };

  // Drag & Drop Handler
  const handleDragEnter = (idx, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragStates((p) => ({ ...p, [idx]: true }));
  };

  const handleDragLeave = (idx, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragStates((p) => ({ ...p, [idx]: false }));
  };

  const handleDragOver = (idx, e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (idx, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragStates((p) => ({ ...p, [idx]: false }));

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processImageFile(idx, files[0]);
    }
  };

  // Upload zu Cloudinary
  const uploadToCloudinary = async (idx) => {
    const file = imageFiles[idx];
    if (!file) return null;

    setUploadingImages((p) => ({ ...p, [idx]: true }));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Cloudinary Error:", data);
        throw new Error(data.error?.message || "Upload fehlgeschlagen");
      }

      return data.secure_url;
    } catch (err) {
      console.error("Upload Error:", err);
      throw new Error(err.message || "Bild-Upload fehlgeschlagen");
    } finally {
      setUploadingImages((p) => ({ ...p, [idx]: false }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!auctionData.title.trim()) newErrors.title = "Titel ist erforderlich";
    if (!auctionData.description.trim())
      newErrors.description = "Beschreibung ist erforderlich";

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

      if (!artwork.images.trim() && !imageFiles[index]) {
        newErrors[`artwork_${index}_images`] = "Bild ist erforderlich";
        hasError = true;
      }

      if (!artwork.startPrice || artwork.startPrice <= 0) {
        newErrors[`artwork_${index}_startPrice`] =
          "Startpreis muss größer als 0 sein";
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
      // Upload aller Bilder zu Cloudinary
      const uploadedArtworks = await Promise.all(
        artworks.map(async (artwork, idx) => {
          let imageUrl = artwork.images;

          // Falls eine Datei ausgewählt wurde, hochladen
          if (imageFiles[idx]) {
            imageUrl = await uploadToCloudinary(idx);
          }

          return {
            ...artwork,
            images: imageUrl,
            startPrice: parseFloat(artwork.startPrice),
            price: parseFloat(artwork.price || artwork.startPrice),
            endDate: new Date(auctionData.endDate).toISOString(),
          };
        })
      );

      const submitData = {
        auction: {
          ...auctionData,
          endDate: new Date(auctionData.endDate).toISOString(),
        },
        artworks: uploadedArtworks,
      };

      await onSubmit(submitData);

      // Reset form
      setAuctionData({
        title: "",
        description: "",
        minIncrementDefault: 5,
        endDate: "",
      });
      setArtworks([
        {
          title: "",
          description: "",
          images: "",
          startPrice: "",
          price: "",
          currency: "EUR",
        },
      ]);
      setImageFiles({});
      setImagePreviews({});
      setUploadingImages({});
      setDragStates({});
      setCurrentStep(1);
      setErrors({});
      onClose();
    } catch (error) {
      console.error("Error creating auction:", error);
      setErrors({ submit: "Error creating auction" });
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
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {currentStep === 1 ? "New Auction" : "Add Art"}
            </h2>
            <p className="text-sm text-gray-500">Step {currentStep} from 2</p>
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
                <label
                  htmlFor="title"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  Artist name
                </label>
                <input
                  type="text"
                  id="title"
                  value={auctionData.title}
                  onChange={(e) => handleAuctionChange("title", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-1 ${
                    errors.title
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="Hans Wurst"
                />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  Artist Bio
                </label>
                <textarea
                  id="description"
                  value={auctionData.description}
                  onChange={(e) =>
                    handleAuctionChange("description", e.target.value)
                  }
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-1 ${
                    errors.description
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="Your Story about you"
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Increment */}
              <div>
                <label
                  htmlFor="minIncrementDefault"
                  className="block mb-1 text-sm font-medium text-gray-700"
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
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-1 ${
                    errors.minIncrementDefault
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                {errors.minIncrementDefault && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.minIncrementDefault}
                  </p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label
                  htmlFor="endDate"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  Auction-End
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    id="endDate"
                    value={auctionData.endDate}
                    onChange={(e) =>
                      handleAuctionChange("endDate", e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-1 ${
                      errors.endDate
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                  />
                  <div
                    className="absolute right-5 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
                    onClick={() =>
                      document.getElementById("endDate").showPicker()
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      ></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                </div>

                {errors.endDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Artworks */}
          {currentStep === 2 && (
            <div>
              <div className="sticky top-0 bg-white z-10 pb-4 border-b mb-6 -mx-6 px-6 -mt-6 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-800">
                    Art ({artworks.length}/10)
                  </h3>
                  {artworks.length < 10 && (
                    <button
                      type="button"
                      onClick={addArtwork}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Add
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {artworks.map((artwork, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-800">
                        Art {index + 1}
                      </h4>
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
                      onChange={(e) =>
                        handleArtworkChange(index, "title", e.target.value)
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-1 ${
                        errors[`artwork_${index}_title`]
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      } text-gray-900`}
                    />

                    {/* Bild Upload Bereich */}
                    <div>
                      {imagePreviews[index] && (
                        <div className="mb-3 relative">
                          <img
                            src={imagePreviews[index]}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newFiles = { ...imageFiles };
                              const newPreviews = { ...imagePreviews };
                              delete newFiles[index];
                              delete newPreviews[index];
                              setImageFiles(newFiles);
                              setImagePreviews(newPreviews);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}

                      <div
                        className={`flex items-center justify-center w-full border-2 border-dashed rounded-lg transition ${
                          dragStates[index]
                            ? "border-blue-500 bg-blue-50"
                            : errors[`artwork_${index}_images`]
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300 bg-white hover:bg-gray-50"
                        }`}
                        onDragEnter={(e) => handleDragEnter(index, e)}
                        onDragLeave={(e) => handleDragLeave(index, e)}
                        onDragOver={(e) => handleDragOver(index, e)}
                        onDrop={(e) => handleDrop(index, e)}
                      >
                        <label className="flex flex-col items-center justify-center w-full py-8 cursor-pointer">
                          <div className="flex flex-col items-center justify-center pointer-events-none">
                            <Upload className="w-8 h-8 mb-2 text-gray-400" />
                            <p className="mb-1 text-sm text-gray-600">
                              <span className="font-semibold">Click</span> or
                              drag picture here
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, GIF, WebP (max. 10MB)
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={(e) => handleFileChange(index, e)}
                          />
                        </label>
                      </div>

                      {imageFiles[index] && (
                        <p className="mt-2 text-xs text-green-600">
                          ✓ {imageFiles[index].name} selected
                        </p>
                      )}
                      {uploadingImages[index] && (
                        <p className="mt-2 text-xs text-blue-600">
                          Uploading...
                        </p>
                      )}
                      {errors[`artwork_${index}_images`] && (
                        <p className="mt-2 text-xs text-red-600">
                          {errors[`artwork_${index}_images`]}
                        </p>
                      )}
                    </div>

                    <textarea
                      placeholder="Description"
                      value={artwork.description}
                      onChange={(e) =>
                        handleArtworkChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      rows={3}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-1 ${
                        errors[`artwork_${index}_description`]
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      } text-gray-900`}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="Startprice (€)"
                        value={artwork.startPrice}
                        onChange={(e) =>
                          handleArtworkChange(
                            index,
                            "startPrice",
                            e.target.value
                          )
                        }
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-1 ${
                          errors[`artwork_${index}_startPrice`]
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                        } text-gray-900`}
                      />
                    </div>

                    {(errors[`artwork_${index}_title`] ||
                      errors[`artwork_${index}_description`] ||
                      errors[`artwork_${index}_startPrice`]) && (
                      <p className="text-xs text-red-600">
                        {errors[`artwork_${index}_title`] ||
                          errors[`artwork_${index}_description`] ||
                          errors[`artwork_${index}_startPrice`]}
                      </p>
                    )}
                  </div>
                ))}

                {errors.submit && (
                  <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                    {errors.submit}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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
              Abort
            </button>
            {currentStep === 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={
                  loading || Object.values(uploadingImages).some((v) => v)
                }
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Auction"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAuctionModal;

import React, { useState } from "react";
import { Plus, X, Upload } from "lucide-react";

export default function CreateArtworkModal({ isOpen, onClose, onSubmit }) {
  // CLOUDINARY KONFIGURATION - DIESE WERTE ANPASSEN!
  const CLOUD_NAME = "dhomuf4kg";
  const UPLOAD_PRESET = "react_upload";

  const [items, setItems] = useState([
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
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const add = () => {
    if (items.length < 10) {
      setItems((p) => [
        ...p,
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

  const remove = (idx) => {
    if (items.length > 1) {
      setItems((p) => p.filter((_, i) => i !== idx));
      // Cleanup states
      const newFiles = { ...imageFiles };
      const newPreviews = { ...imagePreviews };
      const newUploading = { ...uploadingImages };
      const newDrag = { ...dragStates };
      delete newFiles[idx];
      delete newPreviews[idx];
      delete newUploading[idx];
      delete newDrag[idx];
      setImageFiles(newFiles);
      setImagePreviews(newPreviews);
      setUploadingImages(newUploading);
      setDragStates(newDrag);
    }
  };

  const setField = (idx, key, val) => {
    setItems((p) =>
      p.map((it, i) =>
        i === idx
          ? {
              ...it,
              [key]: val,
              ...(key === "startPrice" ? { price: val } : {}),
            }
          : it
      )
    );
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
      setErrors((p) => ({ ...p, [`i${idx}`]: "Ungültiges Bildformat" }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors((p) => ({ ...p, [`i${idx}`]: "Datei zu groß (max. 10MB)" }));
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
      delete newErrors[`i${idx}`];
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

  const validate = () => {
    const e = {};
    items.forEach((it, i) => {
      if (!it.title.trim()) e[`t${i}`] = "Titel fehlt";
      if (!it.description.trim()) e[`d${i}`] = "Beschreibung fehlt";
      if (!it.images.trim() && !imageFiles[i]) {
        e[`i${i}`] = "Bild fehlt";
      }
      const sp = parseFloat(it.startPrice);
      if (!sp || sp <= 0) e[`sp${i}`] = "Startpreis > 0";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Upload aller Bilder zu Cloudinary
      const uploadedItems = await Promise.all(
        items.map(async (it, idx) => {
          let imageUrl = it.images;

          // Falls eine Datei ausgewählt wurde, hochladen
          if (imageFiles[idx]) {
            imageUrl = await uploadToCloudinary(idx);
          }

          return {
            ...it,
            images: imageUrl,
            startPrice: parseFloat(it.startPrice),
            price: parseFloat(it.price || it.startPrice),
          };
        })
      );

      await onSubmit?.(uploadedItems);

      // Reset
      setItems([
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
      setErrors({});
      onClose?.();
    } catch (e) {
      console.error(e);
      setErrors({ submit: e.message || "Fehler beim Speichern" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Kunstwerke hinzufügen
            </h2>
            <p className="text-sm text-gray-500">
              Mehrere Einträge möglich (max. 10)
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="sticky top-0 bg-white z-10 pb-4 border-b mb-6 -mx-6 px-6 -mt-6 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-800">
                Einträge ({items.length}/10)
              </h3>
              {items.length < 10 && (
                <button
                  type="button"
                  onClick={add}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
                >
                  <Plus size={18} />
                  Hinzufügen
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {items.map((aw, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-800">
                    Kunstwerk {idx + 1}
                  </h4>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="text-red-600 hover:text-red-800"
                      title="Entfernen"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Titel"
                  value={aw.title}
                  onChange={(e) => setField(idx, "title", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-1 ${
                    errors[`t${idx}`]
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />

                {/* Bild Upload Bereich */}
                <div>
                  {imagePreviews[idx] && (
                    <div className="mb-3 relative">
                      <img
                        src={imagePreviews[idx]}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newFiles = { ...imageFiles };
                          const newPreviews = { ...imagePreviews };
                          delete newFiles[idx];
                          delete newPreviews[idx];
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
                    className={`flex items-center justify-center w-full border-2 border-dashed  transition ${
                      dragStates[idx]
                        ? "border-blue-500 bg-blue-50"
                        : errors[`i${idx}`]
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300 bg-white hover:bg-gray-50"
                    }`}
                    onDragEnter={(e) => handleDragEnter(idx, e)}
                    onDragLeave={(e) => handleDragLeave(idx, e)}
                    onDragOver={(e) => handleDragOver(idx, e)}
                    onDrop={(e) => handleDrop(idx, e)}
                  >
                    <label className="flex flex-col items-center justify-center w-full py-8 cursor-pointer">
                      <div className="flex flex-col items-center justify-center pointer-events-none">
                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="mb-1 text-sm text-gray-600">
                          <span className="font-semibold">Klicken</span> oder
                          Bild hierher ziehen
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF, WebP (max. 10MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={(e) => handleFileChange(idx, e)}
                      />
                    </label>
                  </div>

                  {imageFiles[idx] && (
                    <p className="mt-2 text-xs text-green-600">
                      ✓ {imageFiles[idx].name} ausgewählt
                    </p>
                  )}
                  {uploadingImages[idx] && (
                    <p className="mt-2 text-xs text-blue-600">
                      Wird hochgeladen...
                    </p>
                  )}
                </div>

                <textarea
                  placeholder="Beschreibung"
                  value={aw.description}
                  onChange={(e) => setField(idx, "description", e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-1 ${
                    errors[`d${idx}`]
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="Startpreis (€)"
                    value={aw.startPrice}
                    onChange={(e) =>
                      setField(idx, "startPrice", e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-1 ${
                      errors[`sp${idx}`]
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                  />
                </div>

                {(errors[`t${idx}`] ||
                  errors[`i${idx}`] ||
                  errors[`d${idx}`] ||
                  errors[`sp${idx}`]) && (
                  <p className="text-xs text-red-600">
                    {errors[`t${idx}`] ||
                      errors[`i${idx}`] ||
                      errors[`d${idx}`] ||
                      errors[`sp${idx}`]}
                  </p>
                )}
              </div>
            ))}

            {errors.submit && (
              <div className="p-3 rounded bg-red-100 border border-red-300 text-red-700">
                {errors.submit}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 border rounded-lg">
            Abbrechen
          </button>
          <button
            onClick={submit}
            disabled={loading || Object.values(uploadingImages).some((v) => v)}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? "Wird gespeichert..." : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

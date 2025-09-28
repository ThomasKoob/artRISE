import React, { useState } from "react";
import { Plus, X } from "lucide-react";

export default function CreateArtworkModal({ isOpen, onClose, onSubmit }) {
  const [items, setItems] = useState([
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
          endPrice: "",
          price: "",
          currency: "EUR",
        },
      ]);
    }
  };
  const remove = (idx) => {
    if (items.length > 1) setItems((p) => p.filter((_, i) => i !== idx));
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

  const validate = () => {
    const e = {};
    items.forEach((it, i) => {
      if (!it.title.trim()) e[`t${i}`] = "Titel fehlt";
      if (!it.description.trim()) e[`d${i}`] = "Beschreibung fehlt";
      if (!it.images.trim()) e[`i${i}`] = "Bild-URL fehlt";
      else {
        try {
          new URL(it.images);
        } catch {
          e[`i${i}`] = "Ungültige URL";
        }
      }
      const sp = parseFloat(it.startPrice);
      const ep = parseFloat(it.endPrice);
      if (!sp || sp <= 0) e[`sp${i}`] = "Startpreis > 0";
      if (!ep || ep <= 0) e[`ep${i}`] = "Maximalpreis > 0";
      if (sp && ep && ep <= sp) e[`ep${i}`] = "Maximalpreis > Startpreis";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit?.(
        items.map((it) => ({
          ...it,
          startPrice: parseFloat(it.startPrice),
          endPrice: parseFloat(it.endPrice),
          price: parseFloat(it.price || it.startPrice),
        }))
      );
      setItems([
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
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
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

        <div className="px-6 py-6 space-y-6">
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
              <input
                type="url"
                placeholder="Bild-URL"
                value={aw.images}
                onChange={(e) => setField(idx, "images", e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-1 ${
                  errors[`i${idx}`]
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
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
                  onChange={(e) => setField(idx, "startPrice", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-1 ${
                    errors[`sp${idx}`]
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Maximalpreis (€)"
                  value={aw.endPrice}
                  onChange={(e) => setField(idx, "endPrice", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-1 ${
                    errors[`ep${idx}`]
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
              </div>

              {(errors[`t${idx}`] ||
                errors[`i${idx}`] ||
                errors[`d${idx}`] ||
                errors[`sp${idx}`] ||
                errors[`ep${idx}`]) && (
                <p className="text-xs text-red-600">
                  {errors[`t${idx}`] ||
                    errors[`i${idx}`] ||
                    errors[`d${idx}`] ||
                    errors[`sp${idx}`] ||
                    errors[`ep${idx}`]}
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

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 border rounded-lg">
            Abbrechen
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? "Wird gespeichert..." : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

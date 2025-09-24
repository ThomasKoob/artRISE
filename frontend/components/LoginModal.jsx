import React, { useEffect, useRef, useState } from "react";

export const LoginModal = ({ onClose, onSubmit, loading, error }) => {
  const emailRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    emailRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const validate = () => {
    const errs = {};
    if (!values.email.trim()) errs.email = "E-Mail ist erforderlich";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      errs.email = "Ungültige E-Mail";
    if (!values.password) errs.password = "Passwort ist erforderlich";
    else if (values.password.length < 6) errs.password = "Mindestens 6 Zeichen";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit?.(values); // Erfolg/Fehler steuert der Context
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-xl p-6 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-xl text-gray-500 font-semibold">LogIn</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm text-gray-500 font-medium mb-1"
            >
              E-Mail
            </label>
            <input
              ref={emailRef}
              id="email"
              type="email"
              className={`w-full text-gray-500 rounded-xl border px-3 py-2 ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              value={values.email}
              onChange={(e) => setValues({ ...values, email: e.target.value })}
              autoComplete="email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm text-gray-500 font-medium mb-1"
            >
              Passwort
            </label>
            <div
              className={`flex items-center rounded-xl border ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
            >
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="w-full text-gray-500 rounded-xl px-3 py-2"
                value={values.password}
                onChange={(e) =>
                  setValues({ ...values, password: e.target.value })
                }
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="px-3 py-2 text-sm text-gray-600"
              >
                {showPassword ? "Verbergen" : "Anzeigen"}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black text-white py-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Einloggen…" : "LogIn"}
          </button>
        </form>
      </div>
    </div>
  );
};

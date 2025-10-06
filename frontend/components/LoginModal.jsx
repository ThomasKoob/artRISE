import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
export const LoginModal = ({
  onClose,
  onSubmit,
  loading,
  error,
  needsVerification,
}) => {
  const navigate = useNavigate(); // ✅ Hook hinzufügen
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
    if (!values.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      errs.email = "Invalid email";
    if (!values.password) errs.password = "Password is required";
    else if (values.password.length < 6)
      errs.password = "At least 6 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit?.(values);
  };

  // ✅ NEU: Handler für "Resend Email" Button
  const handleResendEmail = () => {
    onClose();
    navigate("/check-email", {
      state: {
        email: values.email,
      },
    });
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
        className="relative w-full max-w-md rounded-2xl bg-darkBackground/20 border-1 border-coldYellow/40 shadow-xl p-6 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-xl font-sans text-whiteLetter font-extralight mb-1">
            Log In
          </h2>
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

        {/* ✅ UPDATED: Error Display mit Verification-Link */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <p className="mb-2">{error}</p>

            {/* ✅ NEU: Zeige "Resend Email" Button wenn Email nicht verifiziert */}
            {needsVerification && (
              <button
                onClick={handleResendEmail}
                className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 underline"
              >
                Resend verification email →
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="text-sm font-sans text-whiteLetter font-extralight mb-1"
            >
              Email
            </label>
            <input
              ref={emailRef}
              id="email"
              type="email"
              className={`w-full text-whiteLetter/70 rounded-xl border-1 border-darkBackground/30 px-3 py-2 ${
                errors.email ? "border-red-500" : "border-violetHeader"
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
              className="block text-sm font-sans text-whiteLetter font-extralight mb-1"
            >
              Password
            </label>
            <div
              className={`flex items-center rounded-xl border ${
                errors.password ? "border-red-500" : "border-violetHeader"
              }`}
            >
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="w-full text-whiteLetter/70 rounded-xl px-3 py-2"
                value={values.password}
                onChange={(e) =>
                  setValues({ ...values, password: e.target.value })
                }
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="px-3 py-2 text-sm text-whiteLetter/50"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full font-sans rounded-xl border-1 border-darkBackground hover:border-0 bg-buttonPink/70 hover:bg-buttonPink text-whiteLetter/80 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
};

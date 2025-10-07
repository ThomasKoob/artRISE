// frontend/pages/SignUp.jsx
import { useState } from "react";
import { useNavigate } from "react-router";
import { useLoginModal } from "../context/LoginModalContext.jsx";
import { AgbModal } from "../components/AgbModal.jsx"; // Import AGB Modal
import { register } from "../api/api";

const SignUp = () => {
  const navigate = useNavigate();
  const { openLogin } = useLoginModal();

  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "buyer",
    instagramUrl: "",
    tiktokUrl: "",
    websiteUrl: "",
    acceptMessages: false,
    acceptTerms: false,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false); // ✅ Modal State

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Passwort-Validierung
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // AGB-Validierung
    if (!formData.acceptTerms) {
      setError("You must accept the Terms & Conditions");
      return;
    }

    setLoading(true);

    try {
      console.log("Registering user...");

      const { confirmPassword, acceptTerms, ...registrationData } = formData;

      const response = await register(registrationData);
      console.log("Registration successful:", response);

      navigate("/check-email", {
        state: {
          email: formData.email,
          userName: formData.userName,
        },
      });
    } catch (err) {
      console.error("SignUp Error:", err);
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const getButtonConfig = () => {
    if (formData.role === "buyer") {
      return {
        text: loading
          ? "Art lover account is being created..."
          : "Register as an art lover",
      };
    }
    return {
      text: loading
        ? "Artist account is being created..."
        : "Register as an artist",
    };
  };
  const buttonConfig = getButtonConfig();

  const isArtist = formData.role === "seller";

  const passwordsMatch =
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword;

  const passwordsDontMatch =
    formData.confirmPassword && formData.password !== formData.confirmPassword;

  return (
    <>
      <div className="flex justify-center px-4 pt-10 pb-8">
        <div className="w-full bg-darkBackground/30 max-w-md border-1 border-coldYellow/40 shadow-md rounded-xl p-8">
          <h2 className="text-2xl font-light font-sans text-center text-whiteLetter mb-6">
            Create your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-sans text-whiteLetter/70 mb-1">
                I´m an...
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="text-black w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-lightRedButton focus:ring-1 focus:ring-lightRedButton/50 outline-none transition bg-white/80"
              >
                <option value="buyer">Art lover</option>
                <option value="seller">Artist</option>
              </select>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-whiteLetter/70 mb-1">
                Username
              </label>
              <input
                type="text"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                required
                minLength={3}
                className="text-whiteLetter w-full px-4 py-2 rounded-lg border border-buttonPink/50 focus:border-buttonPink focus:ring-1 focus:ring-blue-500 outline-none transition"
              />
            </div>

            {/* Email + Opt-in Checkbox */}
            <div>
              <label className="block text-sm font-medium text-whiteLetter/70 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="text-whiteLetter w-full px-4 py-2 rounded-lg border border-buttonPink/50 focus:border-buttonPink focus:ring-1 focus:ring-blue-500 outline-none transition"
              />

              <label className="mt-2 inline-flex items-center gap-2 select-none">
                <input
                  type="checkbox"
                  name="acceptMessages"
                  checked={formData.acceptMessages}
                  onChange={handleChange}
                  disabled={!isArtist}
                  className="checkbox checkbox-sm"
                />
                <span className={`text-sm ${!isArtist ? "opacity-60" : ""}`}>
                  Allow interested buyers to message you
                </span>
              </label>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-whiteLetter/70 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="text-whiteLetter w-full px-4 py-2 rounded-lg border border-buttonPink/50 focus:border-buttonPink focus:ring-1 focus:ring-blue-500 outline-none transition"
              />
              <p className="text-xs text-whiteLetter/60 mt-1">
                At least 6 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-whiteLetter/70 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className={`text-whiteLetter w-full px-4 py-2 rounded-lg border outline-none transition ${
                    passwordsDontMatch
                      ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      : passwordsMatch
                      ? "border-green-500 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                      : "border-buttonPink/50 focus:border-buttonPink focus:ring-1 focus:ring-blue-500"
                  }`}
                />
                {passwordsMatch && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                    ✓
                  </span>
                )}
                {passwordsDontMatch && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                    ✕
                  </span>
                )}
              </div>
              {passwordsDontMatch && (
                <p className="text-xs text-red-500 mt-1">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* AGB-Checkbox */}
            <div className="space-y-3 pt-2">
              <label className="inline-flex items-start gap-2 select-none cursor-pointer">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  required
                  className="checkbox checkbox-sm mt-0.5"
                />
                <span className="text-sm font-extralight font-sans text-whiteLetter/90">
                  I accept the{" "}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-greenButton hover:text-greenButton/80 underline font-medium"
                  >
                    Terms & Conditions
                  </button>{" "}
                  of popAUC
                </span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !formData.acceptTerms || passwordsDontMatch}
              className="w-full cursor-pointer bg-lightRedButton/80 hover:bg-lightRedButton text-darkBackground font-medium py-2.5 px-4 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {buttonConfig.text}
            </button>

            <p className="text-center font-sans font-extralight text-md text-whiteLetter/80">
              Already have an account?{" "}
              <button
                type="button"
                onClick={openLogin}
                className="cursor-pointer text-greenButton/80 hover:text-greenButton hover:underline"
              >
                Log In
              </button>
            </p>
          </form>
        </div>
      </div>

      {/* ✅ AGB-Modal als Komponente */}
      <AgbModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => setFormData((p) => ({ ...p, acceptTerms: true }))}
      />
    </>
  );
};

export default SignUp;

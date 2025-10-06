// frontend/pages/SignUp.jsx
import { useState } from "react";
import { useNavigate } from "react-router";
import { useLoginModal } from "../context/LoginModalContext.jsx";
import { register } from "../api/api";

const SignUp = () => {
  const navigate = useNavigate();
  const { openLogin } = useLoginModal(); //Remove 'login' - no auto-login anymore

  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    password: "",
    role: "buyer", // buyer | seller
    // Optional (nur für Artists sichtbar)
    instagramUrl: "",
    tiktokUrl: "",
    websiteUrl: "",
    // Opt-in: Dürfen Interessenten dich anschreiben?
    acceptMessages: false,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // UPDATED: No auto-login, redirect to check-email
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Registering user...");
      const response = await register(formData);
      console.log("Registration successful:", response);

      // Redirect to "Check your email" page
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

  return (
    <div className="flex justify-center px-4 pt-24 pb-8">
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
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer bg-lightRedButton/80 hover:bg-lightRedButton text-darkBackground font-medium py-2.5 px-4 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
          >
            {buttonConfig.text}
          </button>

          <p className="text-center text-sm text-gray-600">
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
  );
};

export default SignUp;

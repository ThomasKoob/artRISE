import { useState } from "react";
import { useNavigate } from "react-router";
import { useLoginModal } from "../context/LoginModalContext.jsx";

const SignUp = () => {
  const navigate = useNavigate();
  const { openLogin } = useLoginModal();
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    password: "",
    avatarUrl: "",
    role: "buyer",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Wichtig für Cookies
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Erfolg - je nach Rolle weiterleiten
      if (formData.role === "seller") {
        navigate("/create-auction");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Button Text und Style basierend auf der Rolle
  const getButtonConfig = () => {
    if (formData.role === "buyer") {
      return {
        text: loading
          ? "Intressent-Account wird erstellt..."
          : "Als Interessent registrieren",
        bgColor: "bg-blue-500",
        hoverColor: "hover:bg-blue-600",
      };
    } else {
      return {
        text: loading
          ? "Künstler-Account wird erstellt..."
          : "Als Künstler registrieren",
        bgColor: "bg-green-500",
        hoverColor: "hover:bg-green-600",
      };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
  <div className="flex justify-center bg-gray-50 px-4 pt-24">
  <div className="w-full max-w-md bg-white shadow-md rounded-xl p-8">
    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
      Erstelle dein Konto
    </h2>

    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Username */}
      <div>
        <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
          Benutzer
        </label>
        <input
          type="text"
          id="userName"
          name="userName"
          value={formData.userName}
          onChange={handleChange}
          required
          minLength="3"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Passwort
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          minLength="6"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
        />
      </div>

      {/* Avatar URL */}
      <div>
        <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 mb-1">
          Avatar URL
        </label>
        <input
          type="url"
          id="avatarUrl"
          name="avatarUrl"
          value={formData.avatarUrl}
          onChange={handleChange}
          placeholder="https://example.com/avatar.jpg"
          required
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
        />
      </div>

      {/* Role */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
          Ich bin...
        </label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition bg-white"
        >
          <option value="buyer">Intressent</option>
          <option value="seller">Künstler</option>
        </select>
      </div>

      {/* Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
      >
        {buttonConfig.text}
      </button>

      <p className="text-center text-sm text-gray-600">
        Bereits ein Konto?{" "}
        <button
          type="button"
          onClick={openLogin}
          className="text-blue-600 font-medium hover:underline"
        >
          LogIn
        </button>
      </p>
    </form>
  </div>
</div>


  );
};

export default SignUp;

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

      // Erfolg - zur Home weiterleiten
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap flex-col max-w-[1400px] mx-auto">
      <div className="text-2xl flex flex-wrap mx-auto m-4">
        Erstelle dein Konto
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto w-full p-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block mb-2" htmlFor="userName">
            Benutzer
          </label>
          <input
            type="text"
            id="userName"
            name="userName"
            value={formData.userName}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            required
            minLength="3"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2" htmlFor="password">
            Passwort
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            required
            minLength="6"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2" htmlFor="avatarUrl">
            Avatar URL
          </label>
          <input
            type="url"
            id="avatarUrl"
            name="avatarUrl"
            value={formData.avatarUrl}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="https://example.com/avatar.jpg"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2" htmlFor="role">
            Ich möchte...
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="buyer">Kaufen</option>
            <option value="seller">Verkaufen</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>

        <p className="mt-4 text-center">
          Bereits ein Konto?{" "}
          <button
            type="button"
            onClick={openLogin}
            className="text-blue-500 hover:underline"
          >
            LogIn
          </button>
        </p>
      </form>
    </div>
  );
};

export default SignUp;

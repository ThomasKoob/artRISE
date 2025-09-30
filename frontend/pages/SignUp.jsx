import { useState } from "react";
import { useNavigate } from "react-router";
import { useLoginModal } from "../context/LoginModalContext.jsx";

const SignUp = () => {
  const navigate = useNavigate();
  const { openLogin, login } = useLoginModal();

  const CLOUD_NAME = "dhomuf4kg";
  const UPLOAD_PRESET = "react_upload";

  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    password: "",
    avatarUrl: "",
    role: "buyer",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const valid = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!valid.includes(file.type)) {
      setError(
        "Bitte wähle ein gültiges Bildformat (JPEG, PNG, GIF oder WebP)"
      );
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Die Datei ist zu groß. Maximum 5MB erlaubt.");
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
    setError("");
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return null;
    setUploadingAvatar(true);

    const formData = new FormData();
    formData.append("file", avatarFile);
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
        throw new Error(
          data.error?.message || "Upload zu Cloudinary fehlgeschlagen"
        );
      }

      return data.secure_url;
    } catch (err) {
      console.error("Upload Error:", err);
      throw new Error(err.message || "Avatar-Upload fehlgeschlagen");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1) Avatar ggf. hochladen
      let avatarUrl = formData.avatarUrl;
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }
      if (!avatarUrl) {
        throw new Error("Bitte wähle ein Profilbild aus");
      }

      // 2) Registrierung
      const res = await fetch("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...formData, avatarUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Registration failed");

      await login({ email: formData.email, password: formData.password });

      
      navigate("/dashboard"); 
    } catch (err) {
      setError(err.message || "Unbekannter Fehler");
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
              className="text-black w-full px-4 py-2 rounded-lg border border-buttonPink/50 focus:border-buttonPink focus:ring-1 focus:ring-blue-500 outline-none transition"
            />
          </div>

          {/* Email */}
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
              className="text-black w-full px-4 py-2 rounded-lg border border-buttonPink/50 focus:border-buttonPink focus:ring-1 focus:ring-blue-500 outline-none transition"
            />
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
              className="text-black w-full px-4 py-2 rounded-lg border border-buttonPink/50 focus:border-buttonPink focus:ring-1 focus:ring-blue-500 outline-none transition"
            />
          </div>

          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profilbild
            </label>

            {avatarPreview && (
              <div className="mb-3 flex justify-center">
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                />
              </div>
            )}

            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-8 h-8 mb-2 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="mb-1 text-sm text-gray-500">
                    <span className="font-semibold">Choose a file</span> or drag
                    & drop it here
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF oder WebP (MAX. 10MB)
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  required={!formData.avatarUrl}
                />
              </label>
            </div>

            {avatarFile && (
              <p className="mt-2 text-sm text-green-600">
                ✓ {avatarFile.name} ausgewählt
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-sans text-whiteLetter/70 mb-1">
              I am an...
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

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || uploadingAvatar}
            className="w-full cursor-pointer bg-lightRedButton/80 hover:bg-lightRedButton text-darkBackground font-medium py-2.5 px-4 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
          >
            {uploadingAvatar ? "Bild wird hochgeladen..." : buttonConfig.text}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <button
              type="button"
              onClick={openLogin}
              className="cursor-pointer text-greenButton/80 hover:text-greenButton hover:underline"
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

import { useLocation } from "react-router";
import { useState } from "react";
import { resendVerificationEmail } from "../api/api";
import { useLoginModal } from "../context/LoginModalContext.jsx";

const CheckEmail = () => {
  const location = useLocation();
  const { openLogin } = useLoginModal();
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");

  // Get email from navigation state
  const email = location.state?.email || "your email";
  const userName = location.state?.userName || "";

  const handleResend = async () => {
    if (email === "your email") {
      setMessage("❌ Error: No email address provided");
      return;
    }

    setResending(true);
    setMessage("");

    try {
      await resendVerificationEmail(email);
      setMessage(
        "✅ Verification email has been resent! Please check your inbox."
      );
    } catch (error) {
      setMessage("❌ Error: " + error.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-24 pb-8">
      <div className="w-full max-w-md bg-darkBackground/20 border-1 border-coldYellow/40 shadow-xl rounded-2xl p-8">
        {/* Icon */}
        <div className="mb-6 text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-buttonPink to-coldYellow rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-whiteLetter"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-sans font-extralight text-whiteLetter mb-4">
            Check your email
          </h1>

          {userName && (
            <p className="text-sm font-sans text-whiteLetter/70 mb-2">
              Hello{" "}
              <span className="font-medium text-coldYellow">{userName}</span>!
            </p>
          )}

          <p className="text-sm font-sans text-whiteLetter/70 mb-4 leading-relaxed">
            We've sent a verification email to
          </p>

          <p className="text-base font-sans font-medium text-buttonPink mb-6">
            {email}
          </p>

          <div className="bg-coldYellow/10 border border-coldYellow/30 rounded-xl p-4 mb-6">
            <p className="text-sm font-sans text-whiteLetter/80">
              💡 <strong>Note:</strong> The verification link is valid for 24
              hours.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full font-sans rounded-xl border-1 border-darkBackground hover:border-0 bg-buttonPink/70 hover:bg-buttonPink text-whiteLetter py-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {resending ? "Sending..." : "Resend verification email"}
          </button>

          {message && (
            <div
              className={`text-sm font-sans p-3 rounded-xl ${
                message.includes("✅")
                  ? "bg-green-500/10 text-green-400 border border-green-500/30"
                  : "bg-red-500/10 text-red-400 border border-red-500/30"
              }`}
            >
              {message}
            </div>
          )}

          <button
            onClick={openLogin}
            className="w-full font-sans rounded-xl border-1 border-violetHeader hover:bg-violetHeader/10 text-whiteLetter py-2.5 transition-all"
          >
            Back to Login
          </button>
        </div>

        {/* Spam Notice */}
        <p className="text-xs font-sans text-whiteLetter/50 text-center mt-6">
          Email not found? Check your <strong>spam folder</strong>!
        </p>
      </div>
    </div>
  );
};

export default CheckEmail;

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router";
import { verifyEmail } from "../api/api";
import { useLoginModal } from "../context/LoginModalContext.jsx";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const { openLogin } = useLoginModal();

  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  const token = searchParams.get("token");
  const hasVerified = useRef(false); // ✅ Verhindert doppelte Ausführung

  useEffect(() => {
    // ✅ Wenn schon verifiziert wurde, nicht nochmal ausführen
    if (hasVerified.current) return;

    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("No verification token found.");
        return;
      }

      // ✅ Markiere als "in Bearbeitung"
      hasVerified.current = true;

      console.log("🔍 Verifying token:", token);

      try {
        const response = await verifyEmail(token);

        console.log("✅ Full response:", response);
        console.log("✅ Response keys:", Object.keys(response));
        console.log("✅ Success:", response.success);
        console.log("✅ Message:", response.message);
        console.log("✅ Already verified?:", response.alreadyVerified);

        // ✅ Erfolgreiche Verifizierung
        if (response.success === true) {
          if (response.alreadyVerified === true) {
            console.log("ℹ️ Email was already verified before");
            setStatus("already-verified");
            setMessage(
              response.message || "This email has already been verified."
            );
            setTimeout(() => openLogin(), 2000);
          } else {
            console.log("✅ First time verification successful!");
            setStatus("success");
            setMessage(response.message || "Email successfully verified!");
            setTimeout(() => openLogin(), 3000);
          }
        } else {
          console.log("❌ Backend returned success: false");
          setStatus("error");
          setMessage(response.message || "Verification failed.");
        }
      } catch (error) {
        console.error("❌ Caught error in try/catch:", error);
        console.error("❌ Error message:", error.message);

        const errorMsg = error.message || "";

        // ✅ Prüfe ob es "already verified" ist
        if (
          errorMsg.toLowerCase().includes("already verified") ||
          errorMsg.toLowerCase().includes("already been verified")
        ) {
          console.log("ℹ️ Error indicates email was already verified");
          setStatus("already-verified");
          setMessage(
            "This email has already been verified. You can log in now."
          );
          setTimeout(() => openLogin(), 2000);
        } else if (
          errorMsg.toLowerCase().includes("expired") ||
          errorMsg.toLowerCase().includes("invalid")
        ) {
          console.log("❌ Token is expired or invalid");
          setStatus("error");
          setMessage(errorMsg);
        } else {
          console.log("❌ Unknown error occurred");
          setStatus("error");
          setMessage(errorMsg || "Verification failed. Please try again.");
        }
      }
    };

    verify();

    // ✅ Cleanup-Funktion (wichtig für React Strict Mode)
    return () => {
      // Nichts zu cleanen, aber React mag das
    };
  }, [token, openLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-24 pb-8">
      <div className="w-full max-w-md bg-darkBackground/20 border-1 border-coldYellow/40 shadow-xl rounded-2xl p-8">
        {/* Loading State */}
        {status === "verifying" && (
          <div className="text-center">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-coldYellow to-buttonPink rounded-full flex items-center justify-center animate-pulse">
                <svg
                  className="w-10 h-10 text-whiteLetter animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl font-sans font-extralight text-whiteLetter mb-4">
              Verifying your email...
            </h1>

            <p className="text-sm font-sans text-whiteLetter/70">
              Please wait, we're confirming your email address.
            </p>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="text-center">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-whiteLetter"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl font-sans font-extralight text-whiteLetter mb-4">
              Successfully Verified!
            </h1>

            <p className="text-sm font-sans text-whiteLetter/80 mb-6 leading-relaxed">
              {message}
            </p>

            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
              <p className="text-sm font-sans text-green-400">
                The login dialog will open in a few seconds...
              </p>
            </div>

            <button
              onClick={openLogin}
              className="w-full font-sans rounded-xl border-1 border-darkBackground hover:border-0 bg-buttonPink/70 hover:bg-buttonPink text-whiteLetter py-2.5 transition-all"
            >
              Log In Now
            </button>
          </div>
        )}

        {/* Already Verified State */}
        {status === "already-verified" && (
          <div className="text-center">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-whiteLetter"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl font-sans font-extralight text-whiteLetter mb-4">
              Already Verified
            </h1>

            <p className="text-sm font-sans text-whiteLetter/80 mb-6 leading-relaxed">
              {message}
            </p>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
              <p className="text-sm font-sans text-blue-400">
                The login dialog will open shortly...
              </p>
            </div>

            <button
              onClick={openLogin}
              className="w-full font-sans rounded-xl border-1 border-darkBackground hover:border-0 bg-buttonPink/70 hover:bg-buttonPink text-whiteLetter py-2.5 transition-all"
            >
              Log In Now
            </button>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="text-center">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl font-sans font-extralight text-whiteLetter mb-4">
              Verification Failed
            </h1>

            <p className="text-sm font-sans text-whiteLetter/80 mb-6 leading-relaxed">
              {message}
            </p>

            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <p className="text-sm font-sans text-red-400 text-left">
                <strong>Possible reasons:</strong>
                <br />
                • The link has expired (24h validity)
                <br />
                • The link is invalid
                <br />• Technical error - please try again
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={openLogin}
                className="w-full font-sans rounded-xl border-1 border-darkBackground hover:border-0 bg-buttonPink/70 hover:bg-buttonPink text-whiteLetter py-2.5 transition-all"
              >
                Try to Log In
              </button>

              <p className="text-sm font-sans text-whiteLetter/50">
                Need help? Contact support
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  verifyWinner,
  getShippingAddress,
  saveShippingAddress,
} from "../api/api.js";
import { useLoginModal } from "../context/LoginModalContext.jsx";

const ShippingPage = () => {
  const { artworkId } = useParams();
  const navigate = useNavigate();
  const { user, openLogin } = useLoginModal();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [artwork, setArtwork] = useState(null);
  const [winningBid, setWinningBid] = useState(null);
  const [existingAddress, setExistingAddress] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    notes: "",
  });

  // Load data on mount
  useEffect(() => {
    if (!user) {
      openLogin(`/shipping/${artworkId}`);
      return;
    }

    loadData();
  }, [artworkId, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // Verify winner
      const verifyResponse = await verifyWinner(artworkId);
      setArtwork(verifyResponse.data.artwork);
      setWinningBid(verifyResponse.data.winningBid);

      // Try to load existing address
      try {
        const addressResponse = await getShippingAddress(artworkId);
        setExistingAddress(addressResponse.data);
        setFormData({
          fullName: addressResponse.data.fullName || "",
          email: addressResponse.data.email || "",
          phone: addressResponse.data.phone || "",
          addressLine1: addressResponse.data.addressLine1 || "",
          addressLine2: addressResponse.data.addressLine2 || "",
          city: addressResponse.data.city || "",
          state: addressResponse.data.state || "",
          postalCode: addressResponse.data.postalCode || "",
          country: addressResponse.data.country || "",
          notes: addressResponse.data.notes || "",
        });
      } catch (err) {
        // No existing address - use user data as defaults
        setFormData((prev) => ({
          ...prev,
          fullName: user.userName || "",
          email: user.email || "",
        }));
      }
    } catch (err) {
      setError(err.message || "Failed to load shipping information");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      await saveShippingAddress(artworkId, formData);
      setSuccess(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to save shipping address");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-24">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-coldYellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-whiteLetter/70">Loading shipping information...</p>
        </div>
      </div>
    );
  }

  if (error && !artwork) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-24">
        <div className="max-w-md w-full bg-darkBackground/20 border border-red-500/40 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
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
          <h2 className="text-2xl font-sans font-light text-whiteLetter mb-2">
            Access Denied
          </h2>
          <p className="text-whiteLetter/70 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-buttonPink rounded-xl text-whiteLetter hover:bg-buttonPink/80 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-24">
        <div className="max-w-md w-full bg-darkBackground/20 border border-green-500/40 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-500"
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
          <h2 className="text-2xl font-sans font-light text-whiteLetter mb-2">
            Address Saved!
          </h2>
          <p className="text-whiteLetter/70 mb-6">
            Your shipping address has been saved successfully. We'll contact you
            regarding payment and delivery.
          </p>
          <p className="text-sm text-whiteLetter/50">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-24 pb-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-sans font-extralight text-whiteLetter mb-4">
            Shipping Information
          </h1>
          <p className="text-whiteLetter/70">
            Congratulations on winning this artwork!
          </p>
        </div>

        {/* Artwork Info Card */}
        {artwork && (
          <div className="bg-darkBackground/20 border border-coldYellow/30 rounded-2xl p-6 mb-8">
            <div className="flex gap-6">
              <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-darkBackground/40">
                {artwork.images && (
                  <img
                    src={artwork.images}
                    alt={artwork.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-sans font-light text-whiteLetter mb-2">
                  {artwork.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-whiteLetter/70">
                  <span>Winning Bid:</span>
                  <span className="text-coldYellow font-medium text-lg">
                    €{winningBid?.amount?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shipping Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-darkBackground/20 border border-coldYellow/30 rounded-2xl p-8"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {existingAddress && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <p className="text-blue-400 text-sm">
                You have already submitted a shipping address. You can update it
                below.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-sans font-light text-whiteLetter mb-4 pb-2 border-b border-whiteLetter/20">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-whiteLetter/70 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-darkBackground/40 border border-whiteLetter/20 rounded-xl text-whiteLetter focus:outline-none focus:border-coldYellow transition-colors"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm text-whiteLetter/70 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-darkBackground/40 border border-whiteLetter/20 rounded-xl text-whiteLetter focus:outline-none focus:border-coldYellow transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-whiteLetter/70 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-darkBackground/40 border border-whiteLetter/20 rounded-xl text-whiteLetter focus:outline-none focus:border-coldYellow transition-colors"
                    placeholder="+49 123 456789"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h3 className="text-lg font-sans font-light text-whiteLetter mb-4 pb-2 border-b border-whiteLetter/20">
                Shipping Address
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-whiteLetter/70 mb-2">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-darkBackground/40 border border-whiteLetter/20 rounded-xl text-whiteLetter focus:outline-none focus:border-coldYellow transition-colors"
                    placeholder="Street address, P.O. box"
                  />
                </div>
                <div>
                  <label className="block text-sm text-whiteLetter/70 mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-darkBackground/40 border border-whiteLetter/20 rounded-xl text-whiteLetter focus:outline-none focus:border-coldYellow transition-colors"
                    placeholder="Apartment, suite, unit, building, floor, etc."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-whiteLetter/70 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 bg-darkBackground/40 border border-whiteLetter/20 rounded-xl text-whiteLetter focus:outline-none focus:border-coldYellow transition-colors"
                      placeholder="Munich"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-whiteLetter/70 mb-2">
                      State / Province
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-darkBackground/40 border border-whiteLetter/20 rounded-xl text-whiteLetter focus:outline-none focus:border-coldYellow transition-colors"
                      placeholder="Bavaria"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-whiteLetter/70 mb-2">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 bg-darkBackground/40 border border-whiteLetter/20 rounded-xl text-whiteLetter focus:outline-none focus:border-coldYellow transition-colors"
                      placeholder="80331"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-whiteLetter/70 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-darkBackground/40 border border-whiteLetter/20 rounded-xl text-whiteLetter focus:outline-none focus:border-coldYellow transition-colors"
                    placeholder="Germany"
                  />
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm text-whiteLetter/70 mb-2">
                Delivery Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                maxLength={500}
                className="w-full px-4 py-2.5 bg-darkBackground/40 border border-whiteLetter/20 rounded-xl text-whiteLetter focus:outline-none focus:border-coldYellow transition-colors resize-none"
                placeholder="Any special delivery instructions..."
              />
              <p className="text-xs text-whiteLetter/50 mt-1">
                {formData.notes.length}/500 characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-buttonPink hover:bg-buttonPink/80 disabled:bg-buttonPink/50 text-whiteLetter font-medium rounded-xl transition-colors disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Shipping Address"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShippingPage;

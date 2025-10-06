// frontend/api/api.js
const RAW_API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV
    ? "http://localhost:3001"
    : "https://popauc.onrender.com");

const API_URL = RAW_API_URL.replace(/\/+$/, "");

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generic fetch wrapper with error handling
 */
export async function fetchJson(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;

  const config = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (response.status === 204) return null; // <— neu: kein Body erwartet

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json?.message || `HTTP ${response.status}`);
  }

  return json;
}

/**
 * Extract array from various API response formats
 */
export function listFromApi(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

/**
 * Extract ID from various object formats
 */
export function idOf(value) {
  return value?._id || value?.id || (typeof value === "string" ? value : null);
}

// ============================================
// AUCTIONS API
// ============================================

/**
 * Get all auctions
 */
export async function getAllAuctions() {
  return fetchJson("/api/auctions");
}

/**
 * Get single auction by ID
 */
export async function getAuctionById(auctionId) {
  return fetchJson(`/api/auctions/${auctionId}`);
}

/**
 * Get artworks for a specific auction
 */
export async function getAuctionArtworks(auctionId) {
  return fetchJson(`/api/auctions/${auctionId}/artworks`);
}

/**
 * Get current user's auctions (seller/artist only)
 */
export async function getMyAuctions() {
  return fetchJson("/api/auctions/me");
}

/**
 * Create new auction
 */
export async function createAuction(auctionData) {
  return fetchJson("/api/auctions", {
    method: "POST",
    body: JSON.stringify(auctionData),
  });
}

/**
 * Update auction
 */
export async function updateAuction(auctionId, auctionData) {
  return fetchJson(`/api/auctions/${auctionId}`, {
    method: "PUT",
    body: JSON.stringify(auctionData),
  });
}

/**
 * Delete auction
 */
export async function deleteAuction(auctionId) {
  return fetchJson(`/api/auctions/${auctionId}`, {
    method: "DELETE",
  });
}

// ============================================
// ARTWORKS API
// ============================================

/**
 * Get all artworks
 */
export async function getAllArtworks() {
  return fetchJson("/api/artworks");
}

/**
 * Get single artwork by ID
 */
export async function getArtworkById(artworkId) {
  return fetchJson(`/api/artworks/${artworkId}`);
}

/**
 * Create new artwork
 */
export async function createArtwork(artworkData) {
  return fetchJson("/api/artworks", {
    method: "POST",
    body: JSON.stringify(artworkData),
  });
}

/**
 * Update artwork
 */
export async function updateArtwork(artworkId, artworkData) {
  return fetchJson(`/api/artworks/${artworkId}`, {
    method: "PUT",
    body: JSON.stringify(artworkData),
  });
}

/**
 * Delete artwork
 */
export async function deleteArtwork(artworkId) {
  return fetchJson(`/api/artworks/${artworkId}`, {
    method: "DELETE",
  });
}

// ============================================
// BIDS/OFFERS API
// ============================================

/**
 * Get current user's offers/bids
 */
export async function getMyOffers() {
  return fetchJson("/api/offers/me");
}

/**
 * Get all offers for a specific artwork
 */
export async function getArtworkOffers(artworkId) {
  return fetchJson(`/api/offers/artwork/${artworkId}`);
}

/**
 * Create/place an offer
 */
export async function createOffer(offerData) {
  return fetchJson("/api/offers", {
    method: "POST",
    body: JSON.stringify(offerData),
  });
}

/**
 * Update an existing offer (raise bid)
 */
export async function updateOffer(offerId, offerData) {
  return fetchJson(`/api/offers/${offerId}`, {
    method: "PUT",
    body: JSON.stringify(offerData),
  });
}

/**
 * Place a bid on an artwork (alternative endpoint)
 */
export async function placeBid(artworkId, bidData) {
  return fetchJson(`/api/artworks/${artworkId}/bids`, {
    method: "POST",
    body: JSON.stringify(bidData),
  });
}

// ============================================
// USERS API
// ============================================

/**
 * Get all users (admin only)
 */
export async function getAllUsers() {
  return fetchJson("/api/users");
}

/**
 * Get user by ID
 */
export async function getUserById(userId) {
  return fetchJson(`/api/users/${userId}`);
}

/**
 * Update user
 */
export async function updateUser(userId, userData) {
  return fetchJson(`/api/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(userData),
  });
}

/**
 * Delete user
 */
export async function deleteUser(userId) {
  return fetchJson(`/api/users/${userId}`, {
    method: "DELETE",
  });
}

// ============================================
// AUTH API - UPDATED
// ============================================

/**
 * Register/Signup new user
 */
export async function register(userData) {
  return fetchJson("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

/**
 * Login user
 */
export async function login(credentials) {
  try {
    const response = await fetchJson("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    return response;
  } catch (error) {
    // Enhanced error handling for unverified users
    if (error.message.includes("verify your email")) {
      const enhancedError = new Error(error.message);
      enhancedError.needsVerification = true;
      throw enhancedError;
    }
    throw error;
  }
}

/**
 * Logout user
 */
export async function logout() {
  return fetchJson("/api/auth/logout", {
    method: "POST",
  });
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  return fetchJson("/api/auth/me");
}

/**
 * Verify email address
 */
export async function verifyEmail(token) {
  return fetchJson(`/api/auth/verify-email?token=${token}`, {
    method: "GET",
  });
}

/**
 *Resend verification email
 */
export async function resendVerificationEmail(email) {
  return fetchJson("/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

// ============================================
// CLOUDINARY HELPER
// ============================================

/**
 * Upload image to Cloudinary
 */
export async function uploadToCloudinary(
  file,
  cloudName = "dhomuf4kg",
  uploadPreset = "react_upload"
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || "Upload zu Cloudinary fehlgeschlagen"
    );
  }

  return data.secure_url;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format date/time in German locale
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("de-DE");
}

/**
 * Get time remaining until end date
 */
export function getTimeLeft(endDate) {
  if (!endDate) return { label: "—", ended: false };

  const end = new Date(endDate).getTime();
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) return { label: "Beendet", ended: true };

  const mins = Math.floor(diff / 60000);
  const days = Math.floor(mins / (60 * 24));
  const hours = Math.floor((mins % (60 * 24)) / 60);
  const minutes = mins % 60;

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

  return { label: `Noch ${parts.join(" ")}`, ended: false };
}

/**
 * Get status badge color classes
 */
export function getStatusBadgeClass(status = "draft") {
  const s = String(status || "").toLowerCase();
  switch (s) {
    case "live":
    case "active":
    case "open":
      return "bg-green-100 text-green-800";
    case "upcoming":
      return "bg-blue-100 text-blue-800";
    case "ended":
    case "closed":
      return "bg-gray-200 text-gray-700";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

// URL + IMAGE HELPERS

export function toAbsoluteUrl(u) {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u; // absolute
  if (u.startsWith("//")) return window.location.protocol + u;
  // API_URL
  return `${API_URL}${u.startsWith("/") ? "" : "/"}${u}`;
}

/** Normalize any id (ObjectId/object/string) to a stable comparable string */
export function toIdStr(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object")
    return String(v._id || v.id || v.$oid || JSON.stringify(v));
  return String(v);
}

/**(array/string/JSON/comma/nested…) to absolute */
export function getFirstImageUrl(obj) {
  if (!obj) return null;

  const direct = [
    obj?.images?.[0]?.url,
    obj?.images?.[0]?.src,
    obj?.images?.url,
    obj?.images?.src,
    obj?.photoUrl,
    obj?.thumbnailUrl,
    obj?.cover?.url,
    obj?.cover?.src,
  ].filter(Boolean);
  if (direct.length) return toAbsoluteUrl(direct[0]);

  const raw =
    obj?.images ??
    obj?.photos ??
    obj?.image ??
    obj?.imageUrl ??
    obj?.coverUrl ??
    obj?.bannerImageUrl ??
    obj?.photo ??
    obj?.picture ??
    obj?.media?.[0]?.url ??
    obj?.files?.[0]?.url ??
    null;

  if (!raw) return null;

  if (Array.isArray(raw)) {
    const first = raw[0];
    if (typeof first === "string") return toAbsoluteUrl(first);
    if (typeof first === "object")
      return toAbsoluteUrl(first?.url || first?.src);
    return null;
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length)
        return toAbsoluteUrl(parsed[0]);
    } catch {
      // ignore
    }
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return toAbsoluteUrl(parts[0] || raw);
  }

  if (typeof raw === "object") {
    return toAbsoluteUrl(raw?.url || raw?.src || null);
  }
  return null;
}
// ==========================================
// SHIPPING API
// ==========================================

/**
 * Verify user is winner and can access shipping page
 */
export const verifyWinner = async (artworkId) => {
  return await fetchJson(`${API_URL}/api/shipping/verify/${artworkId}`, {
    credentials: "include",
  });
};

/**
 * Get shipping address for artwork
 */
export const getShippingAddress = async (artworkId) => {
  return await fetchJson(`${API_URL}/api/shipping/${artworkId}`, {
    credentials: "include",
  });
};

/**
 * Create or update shipping address
 */
export const saveShippingAddress = async (artworkId, addressData) => {
  return await fetchJson(`${API_URL}/api/shipping/${artworkId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(addressData),
  });
};

/**
 * Get all user shipping addresses
 */
export const getUserShippingAddresses = async () => {
  return await fetchJson(`${API_URL}/api/shipping`, {
    credentials: "include",
  });
};

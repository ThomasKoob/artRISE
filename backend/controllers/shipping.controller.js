import ShippingAddress from "../models/ShippingAddress.js";
import Artwork from "../models/Artwork.js";
import Offer from "../models/Offer.js";

/**
 * Get shipping address for an artwork
 */
export const getShippingAddress = async (req, res, next) => {
  try {
    const { artworkId } = req.params;
    const userId = req.user._id;

    const shippingAddress = await ShippingAddress.findOne({
      artworkId,
      userId,
    })
      .populate("artworkId", "title images price")
      .populate("userId", "userName email");

    if (!shippingAddress) {
      return res.status(404).json({
        success: false,
        message: "Shipping address not found",
      });
    }

    res.status(200).json({
      success: true,
      data: shippingAddress,
    });
  } catch (error) {
    console.error("Error fetching shipping address:", error);
    next(error);
  }
};

/**
 * Create or update shipping address
 */
export const createOrUpdateShippingAddress = async (req, res, next) => {
  try {
    const { artworkId } = req.params;
    const userId = req.user._id;

    const {
      fullName,
      email,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      notes,
    } = req.body;

    // Validate required fields
    if (
      !fullName ||
      !email ||
      !phone ||
      !addressLine1 ||
      !city ||
      !postalCode ||
      !country
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Check if artwork exists and is sold
    const artwork = await Artwork.findById(artworkId);
    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: "Artwork not found",
      });
    }

    if (artwork.status !== "sold") {
      return res.status(400).json({
        success: false,
        message: "Artwork is not sold yet",
      });
    }

    // Verify user is the winner
    const winningBid = await Offer.findOne({ artworkId })
      .sort({ amount: -1 })
      .limit(1);

    if (!winningBid || String(winningBid.userId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not the winner of this auction",
      });
    }

    // Create or update shipping address
    let shippingAddress = await ShippingAddress.findOne({
      artworkId,
      userId,
    });

    if (shippingAddress) {
      // Update existing
      shippingAddress.fullName = fullName;
      shippingAddress.email = email;
      shippingAddress.phone = phone;
      shippingAddress.addressLine1 = addressLine1;
      shippingAddress.addressLine2 = addressLine2 || "";
      shippingAddress.city = city;
      shippingAddress.state = state || "";
      shippingAddress.postalCode = postalCode;
      shippingAddress.country = country;
      shippingAddress.notes = notes || "";
      shippingAddress.status = "confirmed";

      await shippingAddress.save();
    } else {
      // Create new
      shippingAddress = await ShippingAddress.create({
        userId,
        artworkId,
        fullName,
        email,
        phone,
        addressLine1,
        addressLine2: addressLine2 || "",
        city,
        state: state || "",
        postalCode,
        country,
        notes: notes || "",
        status: "confirmed",
      });
    }

    // Populate for response
    shippingAddress = await ShippingAddress.findById(shippingAddress._id)
      .populate("artworkId", "title images price")
      .populate("userId", "userName email");

    res.status(200).json({
      success: true,
      message: "Shipping address saved successfully",
      data: shippingAddress,
    });
  } catch (error) {
    console.error("Error saving shipping address:", error);
    next(error);
  }
};

/**
 * Get all shipping addresses for a user
 */
export const getUserShippingAddresses = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const shippingAddresses = await ShippingAddress.find({ userId })
      .populate("artworkId", "title images price status")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: shippingAddresses,
      count: shippingAddresses.length,
    });
  } catch (error) {
    console.error("Error fetching user shipping addresses:", error);
    next(error);
  }
};

/**
 * Update shipping status (for admin/seller)
 */
export const updateShippingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber } = req.body;

    const shippingAddress = await ShippingAddress.findById(id);

    if (!shippingAddress) {
      return res.status(404).json({
        success: false,
        message: "Shipping address not found",
      });
    }

    if (status) {
      shippingAddress.status = status;

      if (status === "shipped") {
        shippingAddress.shippedAt = new Date();
      } else if (status === "delivered") {
        shippingAddress.deliveredAt = new Date();
      }
    }

    if (trackingNumber) {
      shippingAddress.trackingNumber = trackingNumber;
    }

    await shippingAddress.save();

    res.status(200).json({
      success: true,
      message: "Shipping status updated",
      data: shippingAddress,
    });
  } catch (error) {
    console.error("Error updating shipping status:", error);
    next(error);
  }
};

/**
 * Verify user is winner and can access shipping page
 */
export const verifyWinner = async (req, res, next) => {
  try {
    const { artworkId } = req.params;
    const userId = req.user._id;

    // Check artwork
    const artwork = await Artwork.findById(artworkId);
    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: "Artwork not found",
      });
    }

    if (artwork.status !== "sold") {
      return res.status(400).json({
        success: false,
        message: "Auction has not ended yet",
      });
    }

    // Get winning bid
    const winningBid = await Offer.findOne({ artworkId })
      .sort({ amount: -1 })
      .limit(1)
      .populate("userId", "userName email");

    if (!winningBid) {
      return res.status(404).json({
        success: false,
        message: "No bids found for this artwork",
      });
    }

    const isWinner = String(winningBid.userId._id) === String(userId);

    if (!isWinner) {
      return res.status(403).json({
        success: false,
        message: "You are not the winner of this auction",
      });
    }

    res.status(200).json({
      success: true,
      message: "Verified winner",
      data: {
        artwork: {
          id: artwork._id,
          title: artwork.title,
          images: artwork.images,
          price: artwork.price,
          endPrice: artwork.endPrice,
        },
        winningBid: {
          amount: winningBid.amount,
        },
      },
    });
  } catch (error) {
    console.error("Error verifying winner:", error);
    next(error);
  }
};

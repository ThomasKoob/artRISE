import Offer from "../models/Offer.js";
import Artwork from "../models/Artwork.js";
import Auction from "../models/Auction.js";
import { handleBidPlaced } from "../services/notification.service.js";

export const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find();
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOfferById = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findById(id);
    if (!offer)
      return res.status(404).json({ error: `Offer with ID:${id} not found` });
    res.json(offer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOffersByArtwork = async (req, res) => {
  try {
    const { artworkId } = req.params;

    const offers = await Offer.find({ artworkId })
      .populate("userId", "userName email avatarUrl")
      .sort({ amount: -1, createdAt: 1 });

    const highestBid = offers.length > 0 ? offers[0].amount : 0;
    const totalBids = offers.length;
    const uniqueBidders = [
      ...new Set(offers.map((o) => String(o.userId?._id || o.userId))),
    ].length;

    res.json({
      success: true,
      offers,
      stats: {
        highestBid,
        totalBids,
        bidders: uniqueBidders,
      },
    });
  } catch (error) {
    console.error("Error fetching offers by artwork:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ✅ UPDATED: Mit Email-Benachrichtigungen
export const createOffer = async (req, res) => {
  try {
    const { artworkId, userId, amount } = req.body;

    if (!artworkId || !userId || amount == null) {
      return res.status(400).json({
        success: false,
        error: "artworkId, userId, and amount are required",
      });
    }

    // ✅ Get artwork
    const artwork = await Artwork.findById(artworkId);
    if (!artwork) {
      return res.status(404).json({
        success: false,
        error: "Artwork not found",
      });
    }

    // ✅ Get auction for minIncrementDefault
    const auction = await Auction.findById(artwork.auctionId);
    if (!auction) {
      return res.status(404).json({
        success: false,
        error: "Auction not found",
      });
    }

    // ✅ Check if auction is still active
    if (artwork.status === "ended" || new Date() > new Date(artwork.endDate)) {
      return res.status(400).json({
        success: false,
        error: "This auction has ended",
      });
    }

    // ✅ Get current highest bid
    const highestOffer = await Offer.findOne({ artworkId }).sort({
      amount: -1,
    });

    // ✅ Calculate minimum bid (using auction's minIncrementDefault)
    const minIncrement = auction.minIncrementDefault || 5;
    const minBidAmount = highestOffer
      ? highestOffer.amount + minIncrement
      : artwork.startPrice;

    if (amount < minBidAmount) {
      return res.status(400).json({
        success: false,
        error: `Minimum bid is €${minBidAmount.toFixed(2)}`,
        minBidAmount,
        currentHighestBid: highestOffer?.amount || 0,
        minIncrement,
      });
    }

    // Check if user already has a bid
    const existingOffer = await Offer.findOne({ artworkId, userId });

    let offer;
    let message;
    let isNewBid = false;

    if (existingOffer) {
      // Bid increase
      if (amount <= existingOffer.amount) {
        return res.status(400).json({
          success: false,
          error: `New bid must be higher than your current bid of €${existingOffer.amount.toFixed(
            2
          )}`,
        });
      }

      // ✅ Mongoose Middleware will add to bidHistory automatically
      existingOffer.amount = amount;
      offer = await existingOffer.save();
      message = "Bid increased successfully";
    } else {
      // New bid
      offer = await Offer.create({
        artworkId,
        userId,
        amount,
        bidHistory: [{ amount, timestamp: new Date() }], // ✅ Initialize history
      });
      message = "Bid placed successfully";
      isNewBid = true;
    }

    // Populate offer
    offer = await Offer.findById(offer._id).populate(
      "userId",
      "userName email avatarUrl"
    );

    // ✅ Send email notifications (async, don't block response)
    handleBidPlaced(offer, artwork, auction).catch((error) => {
      console.error("Email notification error (non-critical):", error);
    });

    res.status(201).json({
      success: true,
      offer,
      message,
      isNewBid,
      stats: {
        currentHighestBid: amount,
        nextMinBid: amount + minIncrement,
        minIncrement,
      },
    });
  } catch (error) {
    console.error("Error creating/updating offer:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const offer = await Offer.findById(id);
    if (!offer)
      return res.status(404).json({ error: `Offer with ID:${id} not found` });

    if (amount != null) offer.amount = amount;
    await offer.save();
    res.json(offer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findById(id);
    if (!offer)
      return res.status(404).json({ error: `Offer with ID:${id} not found` });

    await offer.deleteOne();
    res.json({ message: "Offer deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

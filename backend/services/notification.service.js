import {
  sendBidPlacedEmail,
  sendOutbidEmail,
  sendLeadingBidEmail,
} from "./email.service.js";
import Offer from "../models/Offer.js";
import Artwork from "../models/Artwork.js";
import Auction from "../models/Auction.js";
import User from "../models/User.js";

/**
 * Handle all notifications when a new bid is placed
 */
export const handleBidPlaced = async (newOffer, artwork, auction) => {
  try {
    console.log("📧 Processing bid notifications...");

    // 1. Get the bidder
    const bidder = await User.findById(newOffer.userId);
    if (!bidder) {
      console.error("❌ Bidder not found:", newOffer.userId);
      return;
    }

    // 2. Prepare artwork data with auction info for emails
    const artworkData = {
      _id: artwork._id,
      title: artwork.title,
      description: artwork.description,
      startPrice: artwork.startPrice,
      endDate: artwork.endDate,
      images: artwork.images, // String in your model
      auctionTitle: auction?.title || "Auction",
    };

    // 3. Send "Bid Placed" confirmation to bidder
    try {
      await sendBidPlacedEmail(bidder, artworkData, newOffer.amount);
      console.log("✅ Bid placed email sent to:", bidder.email);
    } catch (error) {
      console.error("❌ Failed to send bid placed email:", error.message);
    }

    // 4. Find all bids for this artwork, sorted by amount
    const allBids = await Offer.find({ artworkId: artwork._id })
      .sort({ amount: -1 })
      .populate("userId")
      .limit(10);

    const highestBid = allBids[0]; // Current highest

    // Find previous highest bidder (different from current bidder)
    let previousHighestBid = null;
    for (let i = 1; i < allBids.length; i++) {
      if (String(allBids[i].userId._id) !== String(newOffer.userId)) {
        previousHighestBid = allBids[i];
        break;
      }
    }

    // 5. Send outbid email to previous highest bidder
    if (previousHighestBid) {
      const previousBidder = previousHighestBid.userId;

      try {
        await sendOutbidEmail(
          previousBidder,
          artworkData,
          previousHighestBid.amount,
          highestBid.amount
        );
        console.log("✅ Outbid email sent to:", previousBidder.email);
      } catch (error) {
        console.error("❌ Failed to send outbid email:", error.message);
      }
    }

    // 6. Send "Leading Bid" email to current highest bidder
    if (String(highestBid.userId._id) === String(newOffer.userId)) {
      try {
        await sendLeadingBidEmail(bidder, artworkData, highestBid.amount);
        console.log("✅ Leading bid email sent to:", bidder.email);
      } catch (error) {
        console.error("❌ Failed to send leading bid email:", error.message);
      }
    }

    console.log("✅ All bid notifications processed");
  } catch (error) {
    console.error("❌ Error in handleBidPlaced:", error);
  }
};

/**
 * Get all bidders for an artwork
 */
export const getArtworkBidders = async (artworkId) => {
  try {
    const offers = await Offer.find({ artworkId })
      .populate("userId")
      .sort({ amount: -1 });

    return offers.map((offer) => ({
      user: offer.userId,
      bid: offer.amount,
      isWinner: false,
    }));
  } catch (error) {
    console.error("❌ Error getting artwork bidders:", error);
    return [];
  }
};

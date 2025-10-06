import cron from "node-cron";
import Artwork from "../models/Artwork.js";
import Offer from "../models/Offer.js";
import User from "../models/User.js";
import {
  sendAuctionWonEmail,
  sendAuctionLostEmail,
  sendAuctionEndingSoonEmail,
} from "../services/email.service.js";

/**
 * Check for ended auctions and send notifications
 */
export const checkEndedAuctions = async () => {
  try {
    console.log("🔍 Checking for ended auctions...");

    const now = new Date();

    // Find artworks that just ended (status is still 'live' but endDate passed)
    const endedArtworks = await Artwork.find({
      status: "live",
      endDate: { $lte: now },
    });

    if (endedArtworks.length === 0) {
      console.log("ℹ️ No ended auctions found");
      return;
    }

    console.log(`📦 Found ${endedArtworks.length} ended auctions`);

    for (const artwork of endedArtworks) {
      await processEndedAuction(artwork);
    }

    console.log("✅ Ended auctions processed");
  } catch (error) {
    console.error("❌ Error checking ended auctions:", error);
  }
};

/**
 * Process a single ended auction
 */
const processEndedAuction = async (artwork) => {
  try {
    console.log(`📧 Processing ended auction: ${artwork.title}`);

    // Get all bids for this artwork, sorted by amount (highest first)
    const bids = await Offer.find({ artworkId: artwork._id })
      .sort({ amount: -1 })
      .populate("userId");

    if (bids.length === 0) {
      console.log(`ℹ️ No bids on ${artwork.title}, marking as unsold`);
      artwork.status = "unsold";
      await artwork.save();
      return;
    }

    // Winner is the highest bidder
    const winnerBid = bids[0];
    const winner = winnerBid.userId;

    // Update artwork status
    artwork.status = "sold";
    artwork.endPrice = winnerBid.amount;
    await artwork.save();

    console.log(`🏆 Winner: ${winner.email} with €${winnerBid.amount}`);

    // Send winner email
    try {
      await sendAuctionWonEmail(winner, artwork, winnerBid.amount);
      console.log(`✅ Winner email sent to ${winner.email}`);
    } catch (error) {
      console.error(`❌ Failed to send winner email: ${error.message}`);
    }

    // Send loser emails to all other bidders
    const losers = bids.slice(1); // All except the winner

    for (const loserBid of losers) {
      try {
        const loser = loserBid.userId;
        await sendAuctionLostEmail(
          loser,
          artwork,
          loserBid.amount,
          winnerBid.amount
        );
        console.log(`✅ Loser email sent to ${loser.email}`);
      } catch (error) {
        console.error(`❌ Failed to send loser email: ${error.message}`);
      }
    }

    console.log(`✅ Auction ${artwork.title} processed successfully`);
  } catch (error) {
    console.error(`❌ Error processing auction ${artwork._id}:`, error);
  }
};

/**
 * Check for auctions ending in 24 hours
 */
export const checkEndingSoonAuctions = async () => {
  try {
    console.log("🔍 Checking for auctions ending soon...");

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find artworks ending in the next 24 hours
    const endingSoonArtworks = await Artwork.find({
      status: "live",
      endDate: {
        $gte: now,
        $lte: in24Hours,
      },
      // Add a flag to prevent sending multiple notifications
      endingSoonNotificationSent: { $ne: true },
    });

    if (endingSoonArtworks.length === 0) {
      console.log("ℹ️ No auctions ending soon");
      return;
    }

    console.log(`⏰ Found ${endingSoonArtworks.length} auctions ending in 24h`);

    for (const artwork of endingSoonArtworks) {
      await notifyEndingSoon(artwork);
    }

    console.log("✅ Ending soon notifications sent");
  } catch (error) {
    console.error("❌ Error checking ending soon auctions:", error);
  }
};

/**
 * Notify all bidders that auction is ending soon
 */
const notifyEndingSoon = async (artwork) => {
  try {
    console.log(`⏰ Notifying bidders for ${artwork.title}`);

    // Get all unique bidders
    const bids = await Offer.find({ artworkId: artwork._id })
      .populate("userId")
      .sort({ amount: -1 });

    if (bids.length === 0) {
      console.log(`ℹ️ No bids on ${artwork.title}, skipping notification`);
      return;
    }

    // Get unique bidders
    const uniqueBidders = new Map();
    for (const bid of bids) {
      if (!uniqueBidders.has(bid.userId._id.toString())) {
        uniqueBidders.set(bid.userId._id.toString(), {
          user: bid.userId,
          bid: bid.amount,
        });
      }
    }

    // Send notification to each bidder
    for (const [userId, { user, bid }] of uniqueBidders) {
      try {
        await sendAuctionEndingSoonEmail(user, artwork, bid);
        console.log(`✅ Ending soon email sent to ${user.email}`);
      } catch (error) {
        console.error(
          `❌ Failed to send ending soon email to ${user.email}: ${error.message}`
        );
      }
    }

    // Mark as notified (requires schema update)
    artwork.endingSoonNotificationSent = true;
    await artwork.save();

    console.log(`✅ All bidders notified for ${artwork.title}`);
  } catch (error) {
    console.error(`❌ Error notifying ending soon for ${artwork._id}:`, error);
  }
};

/**
 * Start the cron jobs
 */
export const startAuctionCronJobs = () => {
  console.log("🚀 Starting auction cron jobs...");

  // Check for ended auctions every 5 minutes
  cron.schedule("*/5 * * * *", () => {
    console.log("⏰ Running ended auctions check (every 5 minutes)");
    checkEndedAuctions();
  });

  // Check for ending soon auctions every hour
  cron.schedule("0 * * * *", () => {
    console.log("⏰ Running ending soon check (every hour)");
    checkEndingSoonAuctions();
  });

  console.log("✅ Cron jobs started:");
  console.log("   - Ended auctions: Every 5 minutes");
  console.log("   - Ending soon: Every hour");
};

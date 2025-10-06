import dotenv from "dotenv";
import connectDB from "./db/index.js";
import Artwork from "./models/Artwork.js";
import Offer from "./models/Offer.js";
import User from "./models/User.js";

dotenv.config();

async function createTestData() {
  try {
    await connectDB();
    console.log("Connected to DB");

    // Finde oder erstelle Test-Users
    let user1 = await User.findOne({ email: "winner@test.com" });
    if (!user1) {
      user1 = await User.create({
        userName: "TestWinner",
        email: "m.w@elektrotechnik.io",
        password: "password123",
        role: "buyer",
        isEmailVerified: true,
      });
    }

    let user2 = await User.findOne({ email: "loser@test.com" });
    if (!user2) {
      user2 = await User.create({
        userName: "TestLoser",
        email: "marvwolff@yahoo.de",
        password: "password123",
        role: "buyer",
        isEmailVerified: true,
      });
    }

    // Finde eine Auction (oder erstelle eine)
    const Auction = (await import("./models/Auction.js")).default;
    let auction = await Auction.findOne();
    if (!auction) {
      console.log(
        "Keine Auction gefunden. Erstelle erst eine Auction in der App!"
      );
      process.exit(1);
    }

    // Erstelle abgelaufenes Artwork (vor 5 Minuten)
    const expiredArtwork = await Artwork.create({
      auctionId: auction._id,
      title: "Test Artwork - EXPIRED",
      description: "Dies ist ein Test-Artwork das bereits abgelaufen ist",
      price: 100,
      startPrice: 100,
      currency: "EUR",
      images: "test.jpg",
      status: "live",
      endDate: new Date(Date.now() - 5 * 60 * 1000), // 5 Minuten her
    });

    console.log("✅ Expired Artwork erstellt:", expiredArtwork._id);

    // Erstelle Gebote auf das Artwork
    await Offer.create({
      artworkId: expiredArtwork._id,
      userId: user2._id,
      amount: 150,
    });

    await Offer.create({
      artworkId: expiredArtwork._id,
      userId: user1._id,
      amount: 200, // Winner
    });

    console.log("✅ Gebote erstellt (Winner: 200€, Loser: 150€)");

    // Erstelle Artwork das in 30 Minuten endet (für ending soon test)
    const endingSoonArtwork = await Artwork.create({
      auctionId: auction._id,
      title: "Test Artwork - ENDING SOON",
      description: "Endet in 30 Minuten",
      price: 100,
      startPrice: 100,
      currency: "EUR",
      images: "test.jpg",
      status: "live",
      endDate: new Date(Date.now() + 30 * 60 * 1000), // In 30 Minuten
    });

    console.log("✅ Ending Soon Artwork erstellt:", endingSoonArtwork._id);

    await Offer.create({
      artworkId: endingSoonArtwork._id,
      userId: user1._id,
      amount: 120,
    });

    console.log("✅ Gebot auf Ending Soon Artwork erstellt");

    console.log("\n📋 Testdaten erstellt!");
    console.log("   - Expired Artwork:", expiredArtwork._id);
    console.log("   - Ending Soon Artwork:", endingSoonArtwork._id);
    console.log(
      "\nDer Cron Job wird diese Artworks in den nächsten 5 Minuten verarbeiten."
    );

    process.exit(0);
  } catch (error) {
    console.error("Fehler:", error);
    process.exit(1);
  }
}

createTestData();

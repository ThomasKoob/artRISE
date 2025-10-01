import Artwork from "../models/Artwork.js";
import Auction from "../models/Auction.js";

// Alle Auktionen abrufen
export const getAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find()
      .populate("artistId", "userName email avatarUrl")
      .sort({ createdAt: -1 });

    // Status basierend auf Datum berechnen
    const auctionsWithStatus = auctions.map((auction) => {
      const now = new Date();
      let status = "upcoming";

      if (now > auction.endDate) {
        status = "ended";
      } else if (now <= auction.endDate) {
        status = "live";
      }

      return {
        ...auction.toObject(),
        status,
      };
    });

    res.status(200).json({
      success: true,
      data: auctionsWithStatus,
      count: auctionsWithStatus.length,
    });
  } catch (error) {
    console.error("Error fetching auctions:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching auctions",
    });
  }
};

// Einzelne Auktion abrufen
export const getAuctionById = async (req, res) => {
  try {
    const { id } = req.params;

    const auction = await Auction.findById(id).populate(
      "artistId",
      "userName email avatarUrl"
    );

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: "Auction not found",
      });
    }

    // Status basierend auf Datum berechnen
    const now = new Date();
    let status = "upcoming";

    if (now > auction.endDate) {
      status = "ended";
    } else if (now <= auction.endDate) {
      status = "live";
    }

    res.status(200).json({
      success: true,
      data: {
        ...auction.toObject(),
        status,
      },
    });
  } catch (error) {
    console.error("Error fetching auction:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching auction",
    });
  }
};

// Neue Auktion erstellen
export const createAuction = async (req, res) => {
  try {
    const {
      title,
      description,
      avatarUrl,
      minIncrementDefault,
      endDate,
      artistId,
    } = req.body;

    console.log("Creating auction with data:", {
      title,
      description,
      avatarUrl,
      endDate,
      artistId,
    });

    // Validierung
    if (!title || !description || !endDate || !artistId) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Prüfen ob endDate in der Zukunft liegt
    if (new Date(endDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "End date must be in the future",
      });
    }

    const auctionData = {
      title,
      description,
      minIncrementDefault: minIncrementDefault || 5,
      endDate,
      artistId,
    };

    // avatarUrl nur hinzufügen wenn vorhanden
    if (avatarUrl) {
      auctionData.avatarUrl = avatarUrl;
    }

    const newAuction = new Auction(auctionData);

    const savedAuction = await newAuction.save();

    console.log("Auction created successfully:", savedAuction);

    res.status(201).json({
      success: true,
      data: savedAuction,
      message: "Auction created successfully",
    });
  } catch (error) {
    console.error("Error creating auction:", error);

    // MongoDB Duplicate Key Error (unique constraint)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Artist already has an active auction",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating auction",
    });
  }
};

// Auktion aktualisieren
export const updateAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prüfen ob endDate in der Zukunft liegt (falls es aktualisiert wird)
    if (updates.endDate && new Date(updates.endDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "End date must be in the future",
      });
    }

    const updatedAuction = await Auction.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate("artistId", "userName email avatarUrl");

    if (!updatedAuction) {
      return res.status(404).json({
        success: false,
        message: "Auction not found",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedAuction,
      message: "Auction updated successfully",
    });
  } catch (error) {
    console.error("Error updating auction:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Artist already has an active auction",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating auction",
    });
  }
};

// Auktion löschen
export const deleteAuction = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAuction = await Auction.findByIdAndDelete(id);

    if (!deletedAuction) {
      return res.status(404).json({
        success: false,
        message: "Auction not found",
      });
    }

    // Optional: Auch alle zugehörigen Artworks löschen
    await Artwork.deleteMany({ auctionId: id });

    res.status(200).json({
      success: true,
      message: "Auction and related artworks deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting auction:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting auction",
    });
  }
};

// Artworks einer spezifischen Auktion abrufen
export const getAuctionArtworks = async (req, res) => {
  try {
    const { id } = req.params;

    // Überprüfen ob Auktion existiert
    const auction = await Auction.findById(id);
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: "Auction not found",
      });
    }

    // Artworks für diese Auktion finden
    const artworks = await Artwork.find({ auctionId: id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: artworks,
      count: artworks.length,
    });
  } catch (error) {
    console.error("Error fetching auction artworks:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching auction artworks",
    });
  }
};

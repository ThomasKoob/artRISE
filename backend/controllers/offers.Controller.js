import Offer from "../models/Offer.js";

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

// NEUE FUNKTION: Alle Offers für ein Artwork abrufen
export const getOffersByArtwork = async (req, res) => {
  try {
    const { artworkId } = req.params;

    // Alle Offers für dieses Artwork finden, sortiert nach Betrag
    const offers = await Offer.find({ artworkId })
      .populate("userId", "userName email avatarUrl")
      .sort({ amount: -1, createdAt: 1 }); // Höchste zuerst

    // Statistiken berechnen
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

// VERBESSERTE FUNKTION: Erlaubt Gebots-Erhöhungen
export const createOffer = async (req, res) => {
  try {
    const { artworkId, userId, amount } = req.body;

    if (!artworkId || !userId || amount == null)
      throw new Error("artworkId, userId, and amount are required");

    // Prüfen ob User bereits ein Gebot hat
    const existingOffer = await Offer.findOne({ artworkId, userId });

    let offer;
    let message;

    if (existingOffer) {
      // Gebots-Erhöhung: Update des existierenden Gebots
      if (amount <= existingOffer.amount) {
        return res.status(400).json({
          success: false,
          error: `Neues Gebot muss höher als dein aktuelles Gebot von ${existingOffer.amount} € sein`,
        });
      }

      // Update das existierende Gebot
      existingOffer.amount = amount;
      offer = await existingOffer.save();
      message = "Gebot erfolgreich erhöht";
    } else {
      // Erstelle ein neues Gebot
      offer = await Offer.create({ artworkId, userId, amount });
      message = "Gebot erfolgreich platziert";
    }

    // Populated offer zurückgeben
    offer = await Offer.findById(offer._id).populate(
      "userId",
      "userName email avatarUrl"
    );

    res.status(201).json({
      success: true,
      offer,
      message,
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

    // Verwende deleteOne statt remove (deprecated)
    await offer.deleteOne();
    res.json({ message: "Offer deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

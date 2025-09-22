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

export const createOffer = async (req, res) => {
  try {
    const { artworkId, userId, amount } = req.body;
    if (!artworkId || !userId || amount == null)
      throw new Error("artworkId, userId, and amount are required");

    const existing = await Offer.findOne({ artworkId, userId });
    if (existing)
      return res
        .status(400)
        .json({ error: "Offer already exists for this user and artwork" });

    const offer = await Offer.create({ artworkId, userId, amount });
    res.status(201).json(offer);
  } catch (error) {
    res.status(500).json({ error: error.message });
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

    await offer.remove();
    res.json({ message: "Offer deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

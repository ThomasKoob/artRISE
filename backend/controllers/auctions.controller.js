import Auction from "../models/Auction.js";

export const getAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find();
    res.json(auctions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAuctionById = async (req, res) => {
  try {
    const { id } = req.params;
    const auction = await Auction.findById(id);
    if (!auction)
      return res.status(404).json({ error: `Auction with ID:${id} not found` });
    res.json(auction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createAuction = async (req, res) => {
  try {
    const {
      title,
      description,
      bannerImageUrl,
      minIncrementDefault,
      endDate,
      artistId,
    } = req.body;
    if (!title || !description || !bannerImageUrl || !endDate || !artistId)
      throw new Error(
        "title, description, bannerImageUrl, endDate, and artistId are required"
      );

    const auction = await Auction.create(req.body);
    res.status(201).json(auction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      bannerImageUrl,
      minIncrementDefault,
      endDate,
      artistId,
    } = req.body;

    const auction = await Auction.findById(id);
    if (!auction)
      return res.status(404).json({ error: `Auction with ID:${id} not found` });

    await Auction.findByIdAndUpdate(id, req.body, { new: true });
    res.json(await Auction.findById(id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const auction = await Auction.findById(id);
    if (!auction)
      return res.status(404).json({ error: `Auction with ID:${id} not found` });

    await Auction.findByIdAndDelete(id);
    res.json({ message: "Auction deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

import Artwork from "../models/Artwork.js";

export const getArtworks = async (req, res) => {
  try {
    const artworks = await Artwork.find();
    res.json(artworks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getArtworkById = async (req, res) => {
  try {
    const { id } = req.params;
    const artwork = await Artwork.findById(id);
    if (!artwork)
      return res.status(404).json({ error: `Artwork with ID:${id} not found` });
    res.json(artwork);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getArtworksByAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const artworks = await Artwork.find({ auctionId });
    res.json(artworks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createArtwork = async (req, res) => {
  try {
    const {
      auctionId,
      title,
      description,
      price,
      currency,
      images,
      startPrice,

      status,
      endDate,
    } = req.body;
    if (
      !auctionId ||
      !title ||
      !description ||
      !price ||
      !currency ||
      !images ||
      !startPrice ||
      !endDate
    )
      throw new Error("All required fields must be provided");

    const artwork = await Artwork.create(req.body);
    res.status(201).json(artwork);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateArtwork = async (req, res) => {
  try {
    const { id } = req.params;

    const artwork = await Artwork.findById(id);
    if (!artwork)
      return res.status(404).json({ error: `Artwork with ID:${id} not found` });

    await Artwork.findByIdAndUpdate(id, req.body, { new: true });
    res.json(await Artwork.findById(id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteArtwork = async (req, res) => {
  try {
    const { id } = req.params;
    const artwork = await Artwork.findById(id);
    if (!artwork)
      return res.status(404).json({ error: `Artwork with ID:${id} not found` });

    await Artwork.findByIdAndDelete(id);
    res.json({ message: "Artwork deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

import { Artwork } from "../models/Artwork.js";

export const getArtworks = async (req, res) => {
  try {
    const artworks = await Artwork.findAll();
    res.json(artworks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getArtworkById = async (req, res) => {
  try {
    const {
      params: { id },
    } = req;
    const artwork = await Artwork.findByPk(id);
    if (!artwork)
      return res.status(404).json({ error: `Artwork with ID:${id} not found` });
    res.json(artwork);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createArtwork = async (req, res) => {
  try {
    const {
      body: {
        title,
        description,
        price,
        currency,
        images,
        startPrice,
        endPrice,
        status,
        endDate,
      },
    } = req;
    if (
      !title ||
      !description ||
      !price ||
      !currency ||
      !images ||
      !startPrice ||
      !endPrice ||
      !status ||
      !endDate
    )
      throw new Error(
        "Title, description, price, currency, images, startPrice, endPrice, status and endDate are required"
      );
    const found = await Artwork.findOne({ where: { endDate } });
    if (found) throw new Error("End date already exists");
    const artwork = await Artwork.create(req.body);
    res.json(artwork);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateArtwork = async (req, res) => {
  const {
    body: {
      title,
      description,
      price,
      currency,
      images,
      startPrice,
      endPrice,
      status,
      endDate,
    },
    params: { id },
  } = req;
  try {
    if (
      !id ||
      !title ||
      !description ||
      !price ||
      !currency ||
      !images ||
      !startPrice ||
      !endPrice ||
      !status ||
      !endDate
    ) {
      throw new Error(
        "Title, description, price, currency, images, startPrice, endPrice, status and endDate are required"
      );
    }
    const artwork = await Artwork.findByPk(id);
    if (!artwork) return res.status(404).json({ error: "Artwork not found" });
    await artwork.update(req.body);
    res.json(artwork);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteArtwork = async (req, res) => {
  try {
    const {
      params: { id },
    } = req;
    const artwork = await Artwork.findByPk(id);
    if (!artwork)
      return res.status(404).json({ error: `Artwork with ID:${id} not found` });
    await artwork.destroy();
    res.json({ message: "Artwork deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

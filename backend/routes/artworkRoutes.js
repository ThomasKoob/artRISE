import { Router } from 'express';
import {
  getArtworkById,
  getArtworks,
  createArtwork,
  updateArtwork,
  deleteArtwork,
} from '../controllers/artworks.controller.js';
             

const artworkRouter = Router();

artworkRouter.get('/', getArtworks);
artworkRouter.get('/:id', getArtworkById);
artworkRouter.post('/', createArtwork);
artworkRouter.put('/:id', updateArtwork);
artworkRouter.delete('/:id', deleteArtwork);

export default artworkRouter;




import { z } from "zod";

export const artworkSchema = z.object({
  auctionId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  price: z.number().positive(),
  currency: z.string(),
  images: z.string().url(),
  startPrice: z.number(),
  endPrice: z.number(),
  status: z.enum(["pending", "available", "sold"]).optional(),
  endDate: z.string(),
});
export const updateArtworkSchema = artworkSchema.partial();
  






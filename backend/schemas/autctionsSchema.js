import { z } from "zod";

export const auctionSchema = z.object({
  title: z.string(),
  description: z.string(),
  minIncrementDefault: z.number(),
  endDate: z.string(),
  artistId: z.string().uuid(),
});
export const updateAuctionSchema = auctionSchema.partial();

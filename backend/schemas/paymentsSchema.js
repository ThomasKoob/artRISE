import { z } from "zod";

export const paymentSchema = z.object({
  artworkId: z.string(),
  userId: z.string(),
  amount: z.number().positive(),
});

export const updatePaymentSchema = z.object({
  amount: z.number().positive(),
}); 
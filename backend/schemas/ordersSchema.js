import z from "zod"



export const orderSchema = z.object({
  artworkId: z.string(),
  userId: z.string(),
    amount: z.number().positive(),
    currency: z.string(),
    status: z.enum(["pending", "paid", "canceled"]).optional(),
    paymentId: z.string().optional(),
    paidAt: z.string().optional(),
});
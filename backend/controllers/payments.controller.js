import Payment from "../models/Payment.js";

export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);
    if (!payment)
      return res.status(404).json({ error: `Payment with ID:${id} not found` });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createPayment = async (req, res) => {
  try {
    const { userId, artworkId, amount } = req.body;

    if (!userId || !artworkId || amount == null)
      throw new Error("userId, artworkId, and amount are required");

    const existing = await Payment.findOne({ artworkId, userId });
    if (existing)
      return res
        .status(400)
        .json({ error: "Payment already exists for this user and artwork" });

    const payment = await Payment.create({ artworkId, userId, amount });
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const payment = await Payment.findById(id);
    if (!payment)
      return res.status(404).json({ error: `Payment with ID:${id} not found` });

    if (amount != null) payment.amount = amount;
    await payment.save();
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id);
    if (!payment)
      return res.status(404).json({ error: `Payment with ID:${id} not found` });

    await payment.deleteOne();
    res.json({ message: "Payment deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

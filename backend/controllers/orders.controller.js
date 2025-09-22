import Order from "../models/Order.js";

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order)
      return res.status(404).json({ error: `Order with ID:${id} not found` });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createOrder = async (req, res) => {
  try {
    const {
      artworkId,
      sellerId,
      amount,
      currency,
      status,
      sessionId,
      paymentId,
      paidAt,
    } = req.body;
    if (!artworkId || !sellerId || amount == null)
      throw new Error("artworkId, sellerId, and amount are required");

    const order = await Order.create({
      artworkId,
      sellerId,
      amount,
      currency,
      status,
      sessionId,
      paymentId,
      paidAt,
    });
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const order = await Order.findById(id);
    if (!order)
      return res.status(404).json({ error: `Order with ID:${id} not found` });

    Object.assign(order, updates);
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order)
      return res.status(404).json({ error: `Order with ID:${id} not found` });

    await order.remove();
    res.json({ message: "Order deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

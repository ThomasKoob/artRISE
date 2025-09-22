import User from "../models/User.js";

export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const {
      body: { userName, email, password, avatarUrl },
    } = req;
    if (!userName || !email || !password || !avatarUrl)
      throw new Error("Name, email, password and avatar are required");
    const found = await User.findOne({ where: { email } });
    if (found) throw new Error("Mail already exists");
    const user = await User.create(req.body);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const {
      params: { id },
    } = req;
    const user = await User.findByPk(id);
    if (!user)
      return res.status(404).json({ error: `User with ID:${id} not found` });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  const {
    body: { userName, email, password, avatarUrl },
    params: { id },
  } = req;
  try {
    if (!id || !userName || !email || !password || !avatarUrl) {
      throw new Error("Name, email and password are required");
    }
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    await user.update(req.body);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const {
      params: { id },
    } = req;
    const user = await User.findByPk(id);
    if (!user)
      return res.status(404).json({ error: `User with ID:${id} not found` });
    await user.destroy();
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

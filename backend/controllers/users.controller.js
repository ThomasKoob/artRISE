import User from "../models/User.js";

// Alle User holen
export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users); // Array zurückgeben
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User erstellen
export const createUser = async (req, res) => {
  try {
    const { userName, email, password, avatarUrl } = req.body;

    if (!userName || !email || !password) {
      return res.status(400).json({
        message: "username, email und password sind erforderlich",
      });
    }

    // prüfen, ob E-Mail schon existiert
    const found = await User.findOne({ email });
    if (found) {
      return res.status(400).json({ message: "E-Mail existiert bereits" });
    }

    // neuen User anlegen
    const user = new User({ userName, email, password, avatarUrl });
    await user.save();

    res.status(201).json(user); // gespeicherten User zurückgeben
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User nach ID holen
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user)
      return res
        .status(404)
        .json({ message: `User mit ID ${id} nicht gefunden` });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User updaten
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await User.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "User nicht gefunden" });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User löschen
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ message: `User mit ID ${id} nicht gefunden` });
    }
    res.json({ message: "User gelöscht" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

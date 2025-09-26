import { Router } from "express";
import { uploadAvatar, handleUploadError } from "../middlewares/upload.js";

const uploadRouter = Router();

// Avatar Upload Endpoint
uploadRouter.post("/avatar", uploadAvatar, handleUploadError, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // URL zum hochgeladenen Bild
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      data: {
        filename: req.file.filename,
        path: avatarUrl,
        url: `${req.protocol}://${req.get("host")}${avatarUrl}`,
      },
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading avatar",
    });
  }
});

export default uploadRouter;

import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "book_covers",        // Ảnh nằm trong folder Cloudinary
    allowed_formats: ["jpg", "png", "jpeg"]
  }
});

const upload = multer({ storage });

export default upload;

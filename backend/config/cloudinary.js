import pkg from "cloudinary";
const { v2: cloudinary } = pkg;
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Export the whole pkg so multer-storage-cloudinary can access .v2
export default pkg;

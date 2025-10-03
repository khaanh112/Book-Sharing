import mongoose from 'mongoose';



export const connectDB = async () => {
  const MONGODB_URL = process.env.MONGODB_URI;

  await mongoose.connect(MONGODB_URL).then(() => console.log('DB Connected!'))
}

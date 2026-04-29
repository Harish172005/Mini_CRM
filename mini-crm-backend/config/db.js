import mongoose from "mongoose";

/**
 * connectDB – establishes Mongoose connection to MongoDB.
 * Called once at server startup; exits process on failure
 * so the container/process manager can restart cleanly.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌  MongoDB connection error: ${error.message}`);
    process.exit(1); // non-zero exit triggers Render/PM2 restart
  }
};

export default connectDB;

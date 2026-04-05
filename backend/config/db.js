import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`\x1b[36m%s\x1b[0m`, `[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`\x1b[31m%s\x1b[0m`, `[Database Error] ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
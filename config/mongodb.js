import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URL;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URL environment variable');
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    try {
        if (cached.conn) {
            console.log("Using cached database connection");
            return cached.conn;
        }

        if (!cached.promise) {
            const opts = {
                bufferCommands: false,
                maxPoolSize: 5,
                minPoolSize: 1,
                serverSelectionTimeoutMS: 3000,
                socketTimeoutMS: 30000,
                connectTimeoutMS: 3000,
            };

            cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
                console.log("MongoDB Connected Successfully");
                return mongoose;
            });
        }

        cached.conn = await cached.promise;
        return cached.conn;

    } catch (error) {
        console.error("MongoDB connection error:", error);
        cached.promise = null;
        throw error;
    }
};

export default connectDB;
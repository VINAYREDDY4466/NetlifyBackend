import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const options = {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
            connectTimeoutMS: 10000, // Give up initial connection after 10s
            maxPoolSize: 10, // Maintain up to 10 socket connections
        };

        mongoose.connection.on('connected', () => {
            console.log("DB Connected Successfully");
        });

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        await mongoose.connect(process.env.MONGODB_URL, options);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

export default connectDB;
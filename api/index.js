import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from '../config/mongodb.js';
import connectCloudinary from '../config/cloudinary.js';
import userRouter from '../routes/userRoute.js';
import productRouter from '../routes/productRoute.js';
import cartRouter from '../routes/cartRoute.js';
import orderRouter from '../routes/orderRoute.js';
import serverless from 'serverless-http';

const app = express();

// Initialize connections only once
let isConnected = false;
let isCloudinaryConnected = false;

// Middleware to ensure DB connection
const ensureDBConnection = async (req, res, next) => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (error) {
      console.error('Database connection error:', error);
      return res.status(500).json({ error: 'Database connection failed' });
    }
  }
  next();
};

// Middleware to ensure Cloudinary connection
const ensureCloudinaryConnection = async (req, res, next) => {
  if (!isCloudinaryConnected) {
    try {
      await connectCloudinary();
      isCloudinaryConnected = true;
    } catch (error) {
      console.error('Cloudinary connection error:', error);
      return res.status(500).json({ error: 'Cloudinary connection failed' });
    }
  }
  next();
};

app.use(express.json());
app.use(cors({
  credentials: true,
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token']
}));

// Apply connection middleware to all routes
app.use(ensureDBConnection);
app.use(ensureCloudinaryConnection);

// Routes
app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);

app.get('/', (req, res) => {
  res.send("API Working");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Export the handler for Vercel
export default serverless(app);

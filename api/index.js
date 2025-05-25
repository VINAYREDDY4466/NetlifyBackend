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
      return res.status(500).json({ 
        success: false,
        error: 'Database connection failed',
        message: error.message 
      });
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
      return res.status(500).json({ 
        success: false,
        error: 'Cloudinary connection failed',
        message: error.message 
      });
    }
  }
  next();
};

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  credentials: true,
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token']
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Apply connection middleware to all routes
app.use(ensureDBConnection);
app.use(ensureCloudinaryConnection);

// Routes
app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Export the handler for Vercel
const handler = serverless(app);

export default async (req, res) => {
  // Add timeout handling
  const timeout = setTimeout(() => {
    res.status(504).json({
      success: false,
      message: 'Request timeout - server took too long to respond'
    });
  }, 8000); // 8 second timeout

  try {
    const result = await handler(req, res);
    clearTimeout(timeout);
    return result;
  } catch (error) {
    clearTimeout(timeout);
    console.error('Serverless handler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

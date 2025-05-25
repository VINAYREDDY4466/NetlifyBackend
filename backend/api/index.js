import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from '../config/mongodb.js'
import connectCloudinary from '../config/cloudinary.js'
import userRouter from '../routes/userRoute.js'
import productRouter from '../routes/productRoute.js'
import cartRouter from '../routes/cartRoute.js'
import orderRouter from '../routes/orderRoute.js'
import serverless from 'serverless-http'

// App Config
const app = express()
connectDB()
connectCloudinary()

// middlewares
app.use(express.json())

// CORS configuration
app.use(cors({
    credentials: true,
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token']
}))

// Log incoming requests
app.use((req, res, next) => {
    console.log('Request Origin:', req.headers.origin);
    console.log('Request Method:', req.method);
    console.log('Request Path:', req.path);
    next();
})

// Routes
app.use('/api/user', userRouter)
app.use('/api/product', productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/order', orderRouter)

app.get('/', (req, res) => {
    res.send("API Working")
})

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err)
    res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    })
})

// 🔁 Replace `app.listen` with this:
export const handler = serverless(app)

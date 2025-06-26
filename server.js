import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import { connectCloudinary } from './config/cloudinary.js'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRoute.js'
import orderRouter from './routes/orderRoute.js'
import videoRouter from './routes/videoRoute.js'

// App Config
const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

// middlewares
app.use(express.json())



app.use(cors({
    credentials: true,
    origin:["http://localhost:5173","https://final-ecommerce-tan.vercel.app/","http://localhost:5174"], // Allow all origins temporarily for debugging
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token']
}))

// Add headers middleware for additional debugging
app.use((req, res, next) => {
    console.log('Request Origin:', req.headers.origin);
    console.log('Request Method:', req.method);
    console.log('Request Path:', req.path);
    next();
});

// api endpoints
app.use('/api/user',userRouter)
app.use('/api/product',productRouter)
app.use('/api/cart',cartRouter)
app.use('/api/order',orderRouter)
app.use('/api/videos', videoRouter);

app.get('/',(req,res)=>{
    res.send("API Working")
})

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

app.listen(port, ()=> {
    console.log('Server started on PORT : '+ port)
    console.log('CORS enabled for all origins')
    console.log('Backend URL:', process.env.BACKEND_URL)
    console.log('Frontend URL:', process.env.FRONTEND_URL)
})
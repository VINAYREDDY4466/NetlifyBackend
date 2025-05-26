import validator from "validator";
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import userModel from "../models/userModel.js";
import nodemailer from "nodemailer";

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET)
}

// Route for user login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User doesn't exist" })
        }

      

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = createToken(user._id)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: 'Invalid credentials' })
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Route for user register
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "User already exists" })
        }

        // Validate email format & strong password
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters long" })
        }

        // Hash user password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
            isVerified: false
        })

        const user = await newUser.save()
        const token = createToken(user._id)

        res.json({ success: true, token })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Route for admin login
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email + password, process.env.JWT_SECRET);
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Store OTPs temporarily
const otpStore = {}

// Send OTP for email verification
const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = {
            otp,
            timestamp: Date.now()
        };

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'vinayvrd9@gmail.com', // Your Gmail address
                pass: 'xvaa nuac jcis rzlj'  // Your Gmail app password
            }
        });

        const mailOptions = {
            from: 'vinayvrd9@gmail.com', // Your Gmail address
            to: email,
            subject: "OTP for your Treenza Store authentication",
            text: `To authenticate, please use the following One Time Password (OTP):

${otp}

This OTP will be valid for 15 minutes.

Do not share this OTP with anyone. If you didn't make this request, you can safely ignore this email.
Treenza will never contact you about this email or ask for any login codes or links. Beware of phishing scams.

Thanks for visiting Treenza!`
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Failed to send OTP' });
    }
}

// Verify OTP
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const storedData = otpStore[email];

        if (!storedData) {
            return res.json({ success: false, message: 'OTP expired or not found' });
        }

        // Check if OTP is expired (15 minutes)
        if (Date.now() - storedData.timestamp > 15 * 60 * 1000) {
            delete otpStore[email];
            return res.json({ success: false, message: 'OTP expired' });
        }

        if (storedData.otp === otp) {
            delete otpStore[email];
            
            // Update user verification status if user exists
            const user = await userModel.findOne({ email });
            if (user) {
                user.isVerified = true;
                await user.save();
            }
            
            return res.json({ success: true, message: 'OTP verified successfully' });
        }

        res.json({ success: false, message: 'Invalid OTP' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Resend OTP
const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        await sendOtp(req, res);
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Forgot Password
const forgotPassword = async (req, res) => {
    try {
        const { email, newpassword } = req.body;

        // Find user by email
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Validate password
        if (newpassword.length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters long" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newpassword, salt);

        // Update user's password
        user.password = hashedPassword;
        await user.save();

        res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export { 
    loginUser, 
    registerUser, 
    adminLogin, 
    sendOtp, 
    verifyOtp, 
    resendOtp,
    forgotPassword 
}
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

        const user = await userModel.findOne({ email }).maxTimeMS(5000);

        if (!user) {
            return res.status(404).json({ success: false, message: "User doesn't exists" })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = createToken(user._id)
            res.json({ success: true, token })
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' })
        }

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' })
    }
}

// Route for user register
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // checking user already exists or not
        const exists = await userModel.findOne({ email }).maxTimeMS(5000);
        if (exists) {
            return res.status(400).json({ success: false, message: "User already exists" })
        }

        // validating email format & strong password
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email" })
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Please enter a strong password" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        })

        const user = await newUser.save()

        const token = createToken(user._id)

        res.status(201).json({ success: true, token })

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' })
    }
}

// Route for admin login
const adminLogin = async (req, res) => {
    try {
        const {email, password} = req.body

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email+password, process.env.JWT_SECRET);
            res.json({success: true, token})
        } else {
            res.status(401).json({success: false, message: "Invalid credentials"})
        }

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' })
    }
}

// Store OTP in MongoDB instead of memory
const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP in MongoDB with expiration
        await userModel.findOneAndUpdate(
            { email },
            { 
                otp,
                otpExpiry: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes expiry
            },
            { upsert: true, new: true }
        ).maxTimeMS(5000);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'OTP for your Treenza Store authentication',
            text: `To authenticate, please use the following One Time Password (OTP):

${otp}

This OTP will be valid for 15 minutes.

Do not share this OTP with anyone. If you didn't make this request, you can safely ignore this email.
Treenza will never contact you about this email or ask for any login codes or links. Beware of phishing scams.

Thanks for visiting Treenza!`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'OTP sent successfully' });

    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
}

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await userModel.findOne({ 
            email,
            otp,
            otpExpiry: { $gt: new Date() }
        }).maxTimeMS(5000);

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Clear OTP after successful verification
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.status(200).json({ success: true, message: 'OTP Verified Successfully' });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ success: false, message: 'Failed to verify OTP' });
    }
}

const forgotPassword = async (req, res) => {
    try {
        const { email, newpassword } = req.body;

        // Find user by email
        const user = await userModel.findOne({ email }).maxTimeMS(5000);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Validate password
        if (newpassword.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newpassword, salt);

        // Update user's password
        user.password = hashedPassword;
        await user.save();

        res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

export { loginUser, registerUser, adminLogin, sendOtp, verifyOtp, forgotPassword }
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

// Send OTP for registration
const sendRegisterOtp = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Check if user already exists
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "User already exists. Please login." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = {
            otp,
            timestamp: Date.now(),
            type: 'register'
        };

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'vinayvrd9@gmail.com',
                pass: 'xvaa nuac jcis rzlj'
            }
        });

        const mailOptions = {
            from: 'vinayvrd9@gmail.com',
            to: email,
            subject: "Email Verification OTP",
            text: `To verify your email, please use the following One Time Password (OTP):

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

// Send OTP for password reset
const sendPasswordOtp = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Check if user exists
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User doesn't exist. Please register first." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = {
            otp,
            timestamp: Date.now(),
            type: 'password'
        };

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'vinayvrd9@gmail.com',
                pass: 'xvaa nuac jcis rzlj'
            }
        });

        const mailOptions = {
            from: 'vinayvrd9@gmail.com',
            to: email,
            subject: "Email Verification OTP",
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Email Verification OTP</h2>
                <p>To verify your email, please use the following One Time Password (OTP):</p>
                <h1 style="color: #333;">${otp}</h1>
                <p>This OTP will be valid for <b>15 minutes</b>.</p>
                <p style="color: red;">Do not share this OTP with anyone.</p>
                <p>If you didn't make this request, you can safely ignore this email.</p>
                <p style="font-size: 12px; color: gray;">Treenza will never contact you about this email or ask for any login codes or links. Beware of phishing scams.</p>
                <hr />
                <p>Thanks for visiting <b>Treenza</b>!</p>
                <img src="https://res.cloudinary.com/dihcgra0j/image/upload/v1748238140/Screenshot_2025-05-26_111053_gw7gtl.png" alt="Treenza Logo" style="width: 300px;"/>
              </div>
            `
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
        const { email, otp, type } = req.body;
        const storedData = otpStore[email];

        if (!storedData) {
            return res.json({ success: false, message: 'OTP expired or not found' });
        }

        // Check if OTP is expired (15 minutes)
        if (Date.now() - storedData.timestamp > 15 * 60 * 1000) {
            delete otpStore[email];
            return res.json({ success: false, message: 'OTP expired' });
        }

        // Check if OTP type matches
        if (storedData.type !== type) {
            return res.json({ success: false, message: 'Invalid OTP type' });
        }

        if (storedData.otp === otp) {
            delete otpStore[email];
            
            // Update user verification status if it's a registration OTP
            if (type === 'register') {
                const user = await userModel.findOne({ email });
                if (user) {
                    user.isVerified = true;
                    await user.save();
                }
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
        const { email, type } = req.body;
        
        // Validate user existence based on type
        if (type === 'password') {
            const user = await userModel.findOne({ email });
            if (!user) {
                return res.json({ success: false, message: "User doesn't exist. Please register first." });
            }
        } else if (type === 'register') {
            const exists = await userModel.findOne({ email });
            if (exists) {
                return res.json({ success: false, message: "User already exists. Please login." });
            }
        }

        // Call the appropriate send OTP function
        if (type === 'password') {
            await sendPasswordOtp(req, res);
        } else {
            await sendRegisterOtp(req, res);
        }
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
    sendRegisterOtp,
    sendPasswordOtp,
    verifyOtp, 
    resendOtp,
    forgotPassword 
}
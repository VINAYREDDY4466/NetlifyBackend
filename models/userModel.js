import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cartData: { type: Object, default: {} },
    otp: { type: String },
    otpExpiry: { type: Date }
}, { 
    minimize: false,
    timestamps: true 
});

// Add index for OTP verification
userSchema.index({ email: 1, otp: 1, otpExpiry: 1 });

const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcrypt";
const NgoSchema = new mongoose.Schema({
    NgoName: {
        type: String,
        require: true,
        unique: true,
    },
    RegNumber: {
        type: String,
        require: true,
        unique: true,
    },
    Description: {
        type: String,
        require: true,
    },
    Email: {
        type: String,
        require: true,
        unique: true
    },
    PhoneNo: {
        type: String,
        require: true,
    },
    Password: {
        type: String,
        require: true,
    },
    PublicKey: {
        type: String,
        require: true,
    },
    PrivateKey: {
        type: String,
        require: true,
    },
    RefreshToken: {
        type: String,
    },
}, { timestamps: true });
NgoSchema.pre("save", async function (next) {
    if (!this.isModified("Password"))
        return next();
    try {
        if (!this.Password) {
            return next(new Error("Password is required"));
        }
        const hashedPassword = await bcrypt.hash(this.Password, 10);
        this.Password = hashedPassword;
        next();
    }
    catch (error) {
        next(error);
    }
});
NgoSchema.methods.isPasswordCorrect = async function (password) {
    if (!password) {
        return false;
    }
    return await bcrypt.compare(password, this.Password);
};
NgoSchema.methods.generateAccessToken = function () {
    const secret = process.env.ATS || "sfdsdf";
    if (!secret) {
        throw new Error("Access token secret (ATS) is missing");
    }
    return jwt.sign({
        id: this._id,
        userId: this._id, // Add userId for middleware compatibility
        email: this.Email,
        NgoName: this.NgoName,
        walletAddr: this.PublicKey,
    }, secret, {
        expiresIn: process.env.ATE || "15m", // Default 15 minutes
    });
};
NgoSchema.methods.generateRefreshToken = function () {
    const secret = process.env.RTS || "sdfsd";
    if (!secret) {
        throw new Error("Refresh token secret (RTS) is missing");
    }
    return jwt.sign({
        id: this._id,
        walletAddr: this.PublicKey,
    }, secret, {
        expiresIn: process.env.RTE || "7d", // Default 7 days
    });
};
NgoSchema.methods.generateTokens = async function () {
    const accessToken = await this.generateAccessToken();
    const refreshToken = await this.generateRefreshToken();
    // Save refresh token to database
    this.RefreshToken = refreshToken;
    await this.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
};
export const ngoModel = mongoose.model("ngomodel", NgoSchema);
//# sourceMappingURL=user(Ngo).model.js.map
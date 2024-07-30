import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userModel = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true, //property to make searching optimized and fast in MongoDB.
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    fullName: {
        type: String,
        required: true, 
        trim: true,
    },
    avatar: {
        type: String, //cloudinary url.
        required: true,
    },
    coverImage: {
        type: String, //cloudinary url.
    },
    watchHistory: {
        type: Array,
        default: [],
    },
    refreshToken: {
        type: String,

    }
}, {timestamps : true});

//now hashing and storing password:
//pre is a hook in mongoose whose functionality is to modify any passed Schema data such as password encryption,
//just before it is saved to the database(thats what a hook means!).

userModel.pre("save", async function (next) {
    if(this.isModified("password")){ //checking if the password field is modified or not.
        //modifying this.password, this here refers to the information ectracted by the pre hook.
        this.password = await bcrypt.hash(this.password, 10); 
    }
});

//injecting a custom method, feature of mongoose.
userModel.methods.isPasswordCorrect = async (password) => {
    return await bcrypt.compare(password, this.password);
    //password : raw new password entered by the user.
    //this.password : hashed password stored in the database.
}

//generating tokens using jwt by injecting custom methods in schema.
userModel.methods.generateAccessToken = async () => {
    const token = jwt.sign({
        _id: this._id.toString(),
        email: this.email,
        fullName: this.fullName,
        username: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    });
    return token;
}

userModel.methods.generateRefreshToken = async () => {
    const token = jwt.sign({
        _id: this._id.toString(),
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    });
    return token;
}

export const User = mongoose.model("User", userModel);
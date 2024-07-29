import { asyncHandler } from "../utils/asyncHandler.js" //importing the wrapper for async functions.
import { ApiError } from "../utils/apiError.js"
import { User } from "../models/userModel.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
    //get data from  frontend fields, acc to user schema.
    //check if user already exists.
    //breakdown the data and check validity of each input.
    //encrypt password field.
    //handle images or files, validate them, and finally store on cloudinary.
    //create a new user object in the database with these fields.
    //remove password and refreshToken field from response.
    //check if the user is created or not.
    //send/return response back to frontend.

    const {username, fullName, email, password} = req.body;
    //console.log(username, fullName, email, password);
    
    if( //validation.
        [fullName, username, password, email].some((field) => {
            return field.trim() === "";
        })
    ){
        throw new ApiError(400, "Please fill all fields properly!")
    }

    //checking if user exits.
    const existingUser = User.findOne({
        $or: [{username}, {email}]
    });
    if(existingUser){
        throw new ApiError(409, "User already exists!");
    }

    //checking for images, avatar is mandatory and coverImage is optional.
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImageLocalPath[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar image is required!");
    }

    //uploading images to cloudinary.
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar){
        throw new ApiError(400, "Avatar image required!!")
    }

    //creating an entry in mongoDB.
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });
    //validating the creation of user in database.
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "User cannot be registered, try again later!")
    }
    
    //sending response using the ApiResponse, in a uniform format to the frontend.
    res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully!!"),
    )
        
    












    // res.status(200).json({
    //     message: "User registered successfully",
    // });
});

export {registerUser};

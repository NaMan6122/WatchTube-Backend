import { asyncHandler } from "../utils/asyncHandler.js" //importing the wrapper for async functions.
import { ApiError } from "../utils/apiError.js"
import { User } from "../models/userModel.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import path from "path";


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        //console.log(accessToken);
        //console.log(refreshToken);

        //since refreshToken is also stored in the DB, we update the DB field with the refreshToken.
        user.refreshToken = refreshToken;
        //validateBeforeSave is necessary as we are only updating a value but mongoose by default expects all fields, which might cause an error, as we are updating only one.
        await user.save({validateBeforeSave : false})
        return {accessToken, refreshToken};

    } catch (error) {
        throw new ApiError(500, "Something went wrong, cannot generate Tokens!")
    }
}

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
    console.log(username, fullName, email, password);
    
    if( //validation.
        [fullName, username, password, email].some((field) => {
            return field.trim() === "";
        })
    ){
        throw new ApiError(400, "Please fill all fields properly!")
    }

    //checking if user exits.
    const existingUser = await User.findOne({
        $or: [{username}, {email}]
    });
    if(existingUser){
        throw new ApiError(409, "User already exists!");
    }

    //checking for images, avatar is mandatory and coverImage is optional.
    //console.log(req.files)
    const avatarFile = req.files?.avatar?.[0];
    const coverImageFile = req.files.coverImage? req.files.coverImage?.[0] : "";

    if (!avatarFile) {
        throw new ApiError(400, "Avatar image is required!");
    }

    // Use path.join to handle path separators, for windows(// \\ issues in paths)
    const avatarLocalPath = path.resolve(avatarFile.path);
    const coverImageLocalPath = coverImageFile ? path.resolve(coverImageFile.path) : null;

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

const loginUser = asyncHandler( async(req, res) => {
    //get data from user, frontend.(using req.body)
    //check if neither of the required fields are empty.
    //check if the user exists in the database(User.findOne($or: [{username}, {email}]))
    //if the user exists, validate if the password given by the user is correct or not, using bcrypt.compare().
    //generate access and refresh tokens, as secure cookies.

    //return response to the frontend using res.

    const {username, email, password} = req.body;
    console.log(req.body)
    console.log(username, email, password); 

    //checking the validity of the field.
    if(!(username || email)){
        throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findOne({
        $or: [{username}, {email}],
    })

    if(!user){
        throw new ApiError(404, "User not found");
    }
    const isValidPassword = await user.isPasswordCorrect(password);

    if(!isValidPassword){
        throw new ApiError(401, "Invalid password");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
    //console.log(accessToken, refreshToken);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    //console.log(loggedInUser);

    //additional and imp cookie parameter, which prevents any modifications in the cookie from frontend.
    //only server can modify the cookies, where "cookieOptions" is passed.
    const cookieOptions = {
        httpOnly: true,
        secure: false,
    }

    //final step, sending a response to the user.
    res.status(200)
    //.cookie(key, value, security/access options object).
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
        new ApiResponse(200, 
            {
                user: loggedInUser, accessToken, refreshToken //this user object is data defined in ApiResponse.
            },
            "User logged in successfully"
        )
    )
});

const logoutUser = asyncHandler( async(req, res) => {
    //clear refreshToken from DB, accessToken from cookie.
    //we will use a middleware here to implement the logout functionality.

    //deleting the refreshToken.
    await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refreshToken: undefined,
            }
        },
        {
            new: true,
        }
    )

    //deleting the accessToken from cookie.
    const cookieOptions = {
        httpOnly: true,
        secure: false,
    }

    console.log("User Logged Out!!");
    return res.status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"))
});

const refreshAccessToken = asyncHandler( async(req, res) => {
    //fetch the refreshToken from the cookies as we will need it for the generation of new accessToken.
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized Request!!");
    }

    //verify the refreshToken.
    const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    //check if the user still exists in the database.
    const user = await User.findById(decoded?._id);
    if(!user){
        throw new ApiError(401, "Invalid RefreshToken!!");
    }

    //now we have to match the encoded refreshToken stored in the database with our incomingRefreshToken.
    if(user?.refreshToken !== incomingRefreshToken){
        throw new ApiError(401, "Different RefreshTokens, Access Denied!!");
    }

    //generate a new accessToken.
    const cookieOptions = {
        httpOnly: true,
        secure: false,
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    return res.status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
        new ApiResponse(
            200, 
            {accessToken, refreshToken},
            "New Access Token and Refresh Token generated successfully!!"
        )
    )
});

export{
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
}

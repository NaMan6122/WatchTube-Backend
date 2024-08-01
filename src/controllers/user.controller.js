import { asyncHandler } from "../utils/asyncHandler.js" //importing the wrapper for async functions.
import { ApiError } from "../utils/apiError.js"
import { User } from "../models/userModel.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
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
};

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
            // $set: {
            //     refreshToken: undefined,
            // }
            $unset: {
                refreshToken: 1, //removes the field itself from the document.
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

const changePassword = asyncHandler( async(req, res) => {
    const {oldPassword, newPassword} = req.body;
    const user = await User.findById(req.user?._id);
    if(!user){
        throw new ApiError(401, "Unauthorized Request!!");
    }
    const isCorrect = await user.isPasswordCorrect(oldPassword);
    if(!isCorrect){
        throw new ApiError(400, "Invalid Password Entered!");
    }

    user.password = newPassword;
    user.save({validateBeforeSave : false});

    return res.status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully!!"));
});

const getCurrentUser = asyncHandler( async(req, res) => {
    console.log("User Details Sent!!")
    return res.status(200)
    .json(new ApiResponse(200,
        req.user,
        "User Fetched Successfully!!",
    ));
});

const updateUserProfile = asyncHandler( async(req, res) => {
    const {fullName, email} = req.body;
    if(!fullName || !email){
        throw new ApiError(400, "All Fields Are Required!!");
    };
    // const user = await User.findById(req.user?._id);
    // if(!user){
    //     throw new ApiError(401, "Unauthorized Request!!");
    // };
    // user.fullName = fullName;
    // user.email = email;
    // user.save({validateBeforeSave : false});

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullName : fullName,
                email : email,
            }
        },
        {new : true}
    ).select("-password -refreshToken");

    return res.status(200)
    .json(new ApiResponse(200, {}, "User Profile Updated Successfully!!"));
});

const updateUserAvatar = asyncHandler( async(req, res) => {
    let newAvatarLocalPath = req.file?.path;
    if(!newAvatarLocalPath){
        throw new ApiError(400, "No Avatar Image Found!");
    }

    newAvatarLocalPath = path.resolve(newAvatarLocalPath); //necessary for windows(\\, //).
    const newAvatar = await uploadOnCloudinary(newAvatarLocalPath); //uploading on cloudinary.

    if(!newAvatar.url){
        throw new ApiError(500, "Avatar Upload Failed");
    }
    const oldUser = await User.findById(req.user._id);
    const oldAvatarPath = oldUser.avatar;
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar : newAvatar.url,
            }
        },
        {new : true}
    ).select("-password -refreshToken");

    //deleting the old avatar image from cloudinary.
    const response = await deleteFromCloudinary(oldAvatarPath);
    if(!response){
        throw new ApiError(500, "Failed to Delete Old Avatar");
    }
    return res.status(200)
    .json(new ApiResponse(200, user, "Avatar Image Updated Successfully!!")); 
});

const updateCoverImage = asyncHandler( async(req, res) => {
    let newCoverLocalPath = req.file?.path;
    if(!newCoverLocalPath){
        throw new ApiError(400, "No Cover Image Found!!");
    }
    newCoverLocalPath = path.resolve(newCoverLocalPath); //again, necessary for windows.
    const newCover = await uploadOnCloudinary(newCoverLocalPath); //uploading on cloudinary.
    if(!newCover.url){
        throw new ApiError(500, "CoverImage Uplaod Failed!!");
    }
    const oldUser = await User.findById(req.user._id);
    const oldCoverPath = oldUser.coverImage;

    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                coverImage: newCover.url,
            }
        },
        {new : true}
    ).select("-password -refreshToken");

    //deleting the old cover image from cloudinary.
    const response = await deleteFromCloudinary(oldCoverPath);
    if(!response){
        throw new ApiError(500, "Failed to Delete Old Cover Image");
    }

    return res.status(200)
    .json(new ApiResponse(200, user, "Cover Image Changed Successfully!!"))
});

//here, we will use agg. pipelines to gather information from DB which is to be displayed when a user views a particular channel.
const getUserChannelProfile = asyncHandler( async(req, res) => {
    //the channel will be accessed from the url, so we will extract the username of the channel from the url itself.
    const {username} = req.params;
    if(!username?.trim()){
        throw new ApiError(400, "Channel Not Found!!");
    }

    //we will use the username to find the channel.
    //await User.find({username}) //in this way we can find the id of the user and run aggregation pipelines based on that user id,
    //but this is not needed as '$match' operator does it automatically.

    const channel = await User.aggregate([
        //first pipeline, where we are finding the document with the requested username.
        {
            $match: { //filtering a single document with the given username, which is the channel.
                username : username?.toLowerCase(),
            }
        },
        //second pipeline, where are trying to find out the subcriber count of the channel.
        {
            $lookup: {
                from: "subscriptions", //"Subscription" becomes "subscriptions" in MongoDB entries.
                localField: "_id", //field in User schema(local/ current).
                foreignField: "channel", //field which we have to search for in other schema.
                as: "subscribers", //what will the collective aggregation results be called as.
            }
        },
        //third pipeline, where we are counting the number of channels to which the channel user has subscribed to.
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedChannels",
            }
        },
        //fourth pipeline, where the above selected data will be grouped and added as new fields in User schema.
        {
            $addFields: {
                subscribersCount: { //this will be the name of new field.
                    $size: "$subscribers" 
                },
                channelsSubscribedTo: {
                    $size: "$subscribedChannels"
                },
                isSubscribed: { //this is necessary to display whether the current user is subscribed to the channel he is viewing or not.
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"]}, //$in operator can search through both arrays and objects.
                        then: true,
                        else: false,
                    }
                }
            }
        },
        //fifth pipeline, where we are filtering the data to only show the channel which the user.
        {
            //Passes along the documents with the requested fields to the next stage in the pipeline. 
            //The specified fields can be existing fields from the input documents or newly computed fields.
            $project: {
                username: 1, //showing the username field.
                fullName: 1,
                subscribersCount: 1, //showing the subscribersCount field.
                channelsSubscribedTo: 1, //showing the channelsSubscribedTo field.
                isSubscribed: 1, //showing the isSubscribed field.
                avatar: 1,
                coverImage: 1,
                email: 1,
                createdAt: 1,
            }
        }

    ]);

    console.log(channel); //what does aggregate return? (return type etc).
    //The aggregate method returns an array of documents that match the pipeline's criteria and transformations.

    if(!channel?.length){ //if channel is empty array, which is a truthy value, this statement without '!' will return true.
        throw new ApiError(400, "Channel Not Found");
    } //adding '!' will reverse the value hence give correct value when working with truthy value.

    //returning the channel details in the response body.
    return res.status(200)
    .json(new ApiResponse(200, channel[0], "Channel Details Fetched Successfully!!"));
    //If the user with the specified username exists and matches the pipeline criteria,
    //channel will be an array with one object containing the user details according to the $project pipeline stage.

});

const getUserWatchHistory = asyncHandler( async(req, res) => {
    const user = await User.aggregate([
        {
            //looking for the user, whose watchHistory is to be fetched.
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id),
            }
        },
        {
            //looking for the watchHistory of the user,  going through each video.
            $lookup: { 
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: { //Nested pipeline, due to complex dependency, looking for owner field which is a user, simultaneously.
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: { //restriction on what fields should be sent in the owner field, to watchHistory. 
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                    }
                                },
                                {
                                    $addFields: { //here, instead of sending an Array, we are directly sending its first object, which contains the info about owner,
                                        owner: { //overriding the owner field itself.
                                            $first: "$owner",
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            $project: { //restriction on what should be sent as each watchHistory.
                watchHistory: 1,
            }
        }
    ]);

    if(!user?.length){
        throw new ApiError(400, "User Does Not Exist!!")
    }

    return res.status(200)
    .json(new ApiResponse(200, user[0], "Watch History Fetched Successfully!!"));
});

export{
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateUserProfile,
    updateUserAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getUserWatchHistory,
}

import { User } from "../models/userModel";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";

//as we know, middleware adds more properties in req, res objects so that we can implement more functionalities and checks.

export const verifyJWT = asyncHandler( async (req, res, next) => {
    //fetching the accessToken from cookies or header wherever it exists.
    //in header, it is found as: Authorization: Bearer <token>,  so we remove the "Bearer".
    const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "");
    if (!accessToken) {
        throw new ApiError(401, "Unauthorized!!");
    }
    //decoding the token.
    const decodedToken = await jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    if(!user){
        throw new ApiError(401, "Inavlid Access Token!!");
    }
    //storing the user in the request object, so that we can access it using req.user, this is not predefined field, we made a custom field req.user.
    req.user = user;
    next();

})
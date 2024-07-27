import { asyncHandler } from "../utils/asyncHandler.js" //importing the wrapper for async functions.

const registerUser = asyncHandler( async (req, res) => {
    res.status(200).json({
        message: "User registered successfully",
    })
});

export {registerUser};

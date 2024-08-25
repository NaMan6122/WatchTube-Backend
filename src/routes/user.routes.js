import {Router} from "express"
import { loginUser, registerUser, logoutUser, refreshAccessToken, changePassword, getCurrentUser, updateUserProfile, updateUserAvatar, updateCoverImage, getUserChannelProfile, getUserWatchHistory } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

//so when the control is passed to the router, it redirects to
// ../register where the registerUser function is called within the post method.
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        }
    ]),
    registerUser
); 
router.route("/login").post(loginUser);

//secured routes: where user has to be logged in, in order to access them.
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-session").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changePassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-profile").patch(verifyJWT, updateUserProfile);
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/update-cover-image").patch(verifyJWT, upload.single("coverImage"), updateCoverImage);
router.route("/channel/:username").get(verifyJWT, getUserChannelProfile);
router.route("/history").get(verifyJWT, getUserWatchHistory); //signifies that username is a route parameter.

export default router;
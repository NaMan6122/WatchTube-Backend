import {Router} from "express"
import { loginUser, registerUser } from "../controllers/user.controller.js";
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

router.route("/login").post(loginUser)

//secured routes:
router.route("/logout").post(verifyJWT, logoutUser)

export default router;
import {Router} from "express"
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(registerUser); //so when the control is passed to the router, it redirects to
// ../register where the registerUser function is called within the post method.

export default router;
import express from "express";
import { login, register, verifyEmail} from "../controllers/auth.js";
import { facebookLogin, googleLogin } from "../controllers/auth.js";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/verify/:token", verifyEmail);
router.post("/facebook-login", facebookLogin);
router.post("/google-login", googleLogin);


export default router;

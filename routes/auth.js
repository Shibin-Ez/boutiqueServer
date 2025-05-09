import express from "express";
import { adminLogin, appleAuth, googleAuth, otpRegister, passwordLogin } from "../controllers/auth.js";

const router = express.Router();

router.post("/google", googleAuth);
router.post("/otpRegister", otpRegister);
router.post("/password", passwordLogin);
router.post("/admin", adminLogin);
router.post("/apple", appleAuth);

export default router;

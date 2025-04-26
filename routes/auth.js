import express from "express";
import { googleAuth, otpRegister, passwordLogin } from "../controllers/auth.js";

const router = express.Router();

router.post("/google", googleAuth);
router.post("/otpRegister", otpRegister);
router.post("/password", passwordLogin);

export default router;

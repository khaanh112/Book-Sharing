import { Router } from "express";
import { currentUser, loginUser, logoutUser, registerUser, verifyEmail, refreshToken} from "../Controllers/AuthController.js";
import validateToken from "../middlewares/validateTokenHandler.js";



const router = Router();

router.post("/register", registerUser);
router.get("/verify-email", verifyEmail);

router.post("/login", loginUser);
router.get("/refresh-token", refreshToken);
router.get("/current", validateToken, currentUser);

router.get("/logout", validateToken, logoutUser);

export default router;

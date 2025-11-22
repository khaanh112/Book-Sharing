import { Router } from "express";
import { currentUser, loginUser, logoutUser, registerUser, verifyEmail, refreshToken} from "../Controllers/AuthController.js";
import validateToken from "../middlewares/validateTokenHandler.js";
import validateRequest from "../middlewares/validateRequest.js";
import { registerBody, loginBody, verifyQuery } from "../validators/auth.js";
import checkBlacklist from "../middlewares/checkBlacklist.js";


const router = Router();

router.post("/register", validateRequest({ body: registerBody }), registerUser);
router.get("/verify-email", validateRequest({ query: verifyQuery }), verifyEmail);

router.post("/login", validateRequest({ body: loginBody }), loginUser);
router.get("/refresh-token", refreshToken);
router.get("/current", validateToken, currentUser);

router.get("/logout", validateToken, logoutUser);

router.get("/current", validateToken, checkBlacklist, currentUser);

export default router;

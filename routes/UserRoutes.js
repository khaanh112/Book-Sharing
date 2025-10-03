import { Router } from "express";
import { changePassword, updateUser } from "../Controllers/UserController.js";
import validateToken from "../middlewares/validateTokenHandler.js";

const router = Router();

router.use(validateToken);

router.put("/change-password", changePassword);
router.put("/update-user", updateUser);

export default router;



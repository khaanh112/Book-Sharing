import { Router } from "express";
import { changePassword, updateUser } from "../Controllers/UserController.js";
import validateToken from "../middlewares/validateTokenHandler.js";
import validateRequest from "../middlewares/validateRequest.js";
import { changePasswordBody, updateBody } from "../validators/user.js";

const router = Router();

router.use(validateToken);

router.put("/change-password", validateRequest({ body: changePasswordBody }), changePassword);
router.put("/update-user", validateRequest({ body: updateBody }), updateUser);

export default router;



import { Router } from "express";
import { changePassword, updateUser } from "./UserController.js";
import validateToken from "../../../shared/middlewares/validateTokenHandler.js";
import validateRequest from "../../../shared/middlewares/validateRequest.js";
import { changePasswordBody, updateBody } from "../../../shared/validators/user.js";

const router = Router();

router.use(validateToken);

router.put("/change-password", validateRequest({ body: changePasswordBody }), changePassword);
router.put("/update-user", validateRequest({ body: updateBody }), updateUser);

export default router;



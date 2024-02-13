import { Request, Response, Router } from "express";
import UserSchema from "../database/schemas/User";
import User from "../entities/User";
import auth from "../middlewares/auth";

const router = Router();

router.get("/me", auth, async (req: Request, res: Response) => {
  const user = req.user as User;
  const userData = await UserSchema.findById(user._id);

  if (!userData) {
    return res.status(404).send("User not found.");
  }

  return res.status(200).send(userData);
});

export default router;

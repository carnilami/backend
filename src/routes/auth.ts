import { Request, Response, Router } from "express";
import passport from "passport";
import { FRONTEND_URL } from "../utils/constants";

const router = Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req: Request, res: Response) {
    res.redirect(FRONTEND_URL);
  }
);

export default router;

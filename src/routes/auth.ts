import { Request, Response, Router } from "express";
import passport from "passport";

const router = Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req: Request, res: Response) {
    res.redirect("http://localhost:5173/");
  }
);

export default router;

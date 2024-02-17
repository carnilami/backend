import { Router } from "express";
import auctions from "./auctions";
import auth from "./auth";
import users from "./users";

const router = Router();

router.use("/auctions", auctions);
router.use("/auth", auth);
router.use("/users", users);

export default router;

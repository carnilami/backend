import { Router } from "express";
import auctions from "./auctions";
import auth from "./auth";
import test from "./upload";
import users from "./users";

const router = Router();

router.use("/auctions", auctions);
router.use("/auth", auth);
router.use("/users", users);
router.use("/upload", test);

export default router;

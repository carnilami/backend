import store from "connect-mongo";
import cors from "cors";
import express from "express";
import session from "express-session";
import passport from "passport";
import router from "../routes/routes";

require("../strategies/google");

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  app.use(
    cors({
      origin: [process.env.FRONTEND_URL!, "https://www.carnilami.com"],
      methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
      credentials: true,
    })
  );

  app.use(
    session({
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        httpOnly: process.env.NODE_ENV === "production",
      },
      store: store.create({
        mongoUrl: process.env.MONGO_URI!,
      }),
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.use("/api", router);
  return app;
}

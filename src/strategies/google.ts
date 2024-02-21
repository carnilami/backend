import passport from "passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import User from "../database/schemas/User";

passport.serializeUser((user: any, done: VerifyCallback) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done: VerifyCallback) => {
  try {
    const user = await User.findById(id);
    return user ? done(null, user) : done(null, undefined);
  } catch (error) {
    console.error(error);
  }
});

passport.use(
  new Strategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "http://localhost:3000/api/auth/google/callback",
    },
    async function (
      accessToken: any,
      refreshToken: any,
      profile: any,
      done: VerifyCallback
    ) {
      const existingUser = await User.findOneAndUpdate(
        {
          email: profile.emails[0].value,
        },
        { accessToken },
        { new: true }
      );
      if (existingUser) {
        return done(null, existingUser);
      }

      const newUser = await User.create({
        accessToken,
        refreshToken,
        email: profile.emails[0].value,
        name: profile.displayName,
      });

      return done(null, newUser);
    }
  )
);

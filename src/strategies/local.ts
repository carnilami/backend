import passport from "passport";
import { VerifyCallback } from "passport-google-oauth20";
import { IStrategyOptions, Strategy as LocalStrategy } from "passport-local";
import User from "../database/schemas/User";

interface Otp {
  userId: string;
  otp: string;
  expiry: number;
}

const otpCodes: Otp[] = [];

const options: IStrategyOptions = {
  usernameField: "phone",
  passwordField: "phone",
};

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
  new LocalStrategy(options, async (phone, password, done) => {
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return done(null, existingUser);
    }
    const newUser = await User.create({
      name: phone,
      phone,
    });
    return done(null, newUser);
  })
);

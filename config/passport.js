import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import Student from "../models/Student.js";
import dotenv from "dotenv";

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET; // Ensure you have a secret for signing the token

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log(profile);
        const user = await Student.findOne({ email: profile.emails[0].value });

        if (!user) {
          // return failure
          return done(null, false, {
            message: "User not found",
          });
        }

        // Generate JWT
        const studentObj = { id: user._id };
        const token = jwt.sign(studentObj, JWT_SECRET);

        // Send token instead of a session
        return done(null, { token });
      } catch (err) {
        done(err, null);
      }
    }
  )
);
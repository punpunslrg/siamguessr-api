import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import crypto from 'crypto';

import authService from '../services/auth.service.js';
import hashService from '../services/hash.service.js';
import createError from '../utils/create-error.util.js';


passport.use(new LocalStrategy(
    {
        usernameField: 'email', 
        passwordField: 'password'
    },
    async (email, password, done) => {
        try {
            const user = await authService.findAccountByEmail(email);

          
            if (!user) {
                return done(null, false, { message: 'Invalid email or password.' });
            }

            const isMatch = await hashService.comparePassword(password, user.password);
            if (!isMatch) {
                return done(null, false, { message: 'Invalid email or password.' });
            }

           
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
));


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback" 
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const firstName = profile.name.givenName;
        const lastName = profile.name.familyName;
        const image = profile.photos[0].value
            console.log('profile', profile)
        let user = await authService.findUserByEmail(email);

        if (user) {
            if (!user.googleId) {
                user = await authService.linkGoogleToAccount(user.id, googleId);
            }
        } else {
            
            const randomPassword = crypto.randomBytes(32).toString('hex');
            const hashedPassword = await hashService.hash(randomPassword);
            const username = `${firstName}${lastName}`.replace(/\s+/g, '') || email.split('@')[0];

            
            user = await authService.createAccount({
                email,
                username,
                password: hashedPassword,
                googleId: googleId,
                role: 'user',
                status: 'active',
                image
            });

           
        }
        
        
        return done(null, user);
    } catch (err) {
        return done(err);
    }
  }
));



passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "/api/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name','picture'] 
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        const facebookId = profile.id;
        const firstName = profile.name.givenName;
        const lastName = profile.name.familyName;
        const image = profile.photos?.[0]?.value;

console.log('profile', profile)
        if (!email) {
            return done(createError(400, "Could not retrieve email from Facebook."), false);
        }

        let user = await authService.findUserByEmail(email);

        if (user) {
            
             if (!user.facebookId) {
                user = await authService.linkFacebookToAccount(user.id, facebookId);
            }
        } else {
          
            const randomPassword = crypto.randomBytes(32).toString('hex');
            const hashedPassword = await hashService.hash(randomPassword);
            const username = `${firstName}${lastName}`.replace(/\s+/g, '') || email.split('@')[0];

            user = await authService.createAccount({
                email,
                username,
                password: hashedPassword,
                facebookId: facebookId,
                role: 'user',
                status: 'active',
                image
            });
        }
        
        return done(null, user);
    } catch (err) {
        return done(err);
    }
  }
));



passport.serializeUser((user, done) => {
    done(null, user.id);
});


passport.deserializeUser(async (id, done) => {
    try {
        const user = await authService.findUserById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// const GoogleStrategy = require("passport-google-oauth20").Strategy;
// const passport = require("passport");
// const LocalStrategy = require("passport-local").Strategy;
// const bcrypt = require("bcryptjs");
// const { PrismaClient } = require("@prisma/client");
// require("dotenv").config();

// const prisma = new PrismaClient();

// // 🧠 Local Strategy
// passport.use(
//   new LocalStrategy(async (username, password, done) => {
//     // ... local auth logic ...
//   })
// );

// // ✅ Google Strategy (เพิ่มตรงนี้)
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: "/api/auth/google/callback", 
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         const existingUser = await prisma.user.findUnique({
//           where: { googleId: profile.id },
//         });

//         if (existingUser) {
//           return done(null, existingUser);
//         }

//         const newUser = await prisma.user.create({
//           data: {
//             googleId: profile.id,
//             email: profile.emails[0].value,
//             name: profile.displayName,
//             image: profile.photos[0].value,
//             status: "active",
//           },
//         });

//         return done(null, newUser);
//       } catch (err) {
//         return done(err, null);
//       }
//     }
//   )
// );

// // session
// passport.serializeUser((user, done) => {
//   done(null, user.id);
// });
// passport.deserializeUser(async (id, done) => {
//   const user = await prisma.user.findUnique({ where: { id } });
//   done(null, user);
// });

import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import crypto from 'crypto';

import authService from '../services/auth.service.js';
import hashService from '../services/hash.service.js';
import generateHN from '../utils/generateHN.js';
import createError from '../utils/create-error.js';


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

        let user = await authService.findUserByEmail(email);

        if (user) {
           
            if (!user.googleId) {
                user = await authService.linkGoogleToAccount(user.id, googleId);
            }
        } else {
            
            const randomPassword = crypto.randomBytes(32).toString('hex');
            const hashedPassword = await hashService.hash(randomPassword);

            
            user = await authService.createAccount({
                email,
                password: hashedPassword,
                googleId: googleId,
                role: 'User' 
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
    profileFields: ['id', 'emails', 'name'] 
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        const facebookId = profile.id;
        const firstName = profile.name.givenName;
        const lastName = profile.name.familyName;

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

            user = await authService.createAccount({
                email,
                password: hashedPassword,
                facebookId: facebookId,
                role: 'User' 
            });

            
        
        return done(null, user);
    }} catch (err) {
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
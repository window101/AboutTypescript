

import * as passport from 'passport';
import User from '../models/user';

export default () => {
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser<number>( async (id, done) => {
        try {
            const user = await User.findOne({
                where: { id },

            });
            if(!user) {
                return done(new Error('no user'));
            }
            return done(null, user);
        } catch(err) {
            console.error(err);
            return done(err);
        }
    });

   // local();
}
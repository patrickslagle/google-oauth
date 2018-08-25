const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

module.exports = function(pool) {
  // serialize user into user id
  passport.serializeUser((user, done) => {
    done(null, user.profile_id);
  });

  // deserialize user from user id when attempting to authorize requests with a cookie
  passport.deserializeUser((profile_id, done) => {
    const queryText = 'select * from users where profile_id = $1';
    
    pool.query(queryText, [profile_id]).then(result => {
      const user = result.rows[0];
      console.log('deserialize main result: ');
      console.log(user.profile_id);
      
      // passport deserialize complete
      done(null, user);
    });
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.googleClientID,
        clientSecret: process.env.googleClientSecret,
        callbackURL: '/auth/google/callback', // redirect after user grants permission
        proxy: true,
      },
      (accessToken, refreshToken, profile, done) => {
        // upsert the profile id, name (screen name), and primary email
        const profile_id = profile.id;
        const name = profile.displayName;
        const email = profile.emails[0].value;
        
        const queryText = 'insert into users (profile_id, name, email) ' +
        'values ($1, $2, $3) ' +
        'on conflict (profile_id) do update set name=$2, email=$3 ' +
        'returning *';
        
        pool.query(queryText, [profile_id, name, email]).then(result => {
          const user = result.rows[0];
          
          // passport deserialize complete
          done(null, user);
        });
      }
    )
  );
};

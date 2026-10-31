/**
 * passport.js — Passport strategy configuration.
 * - LocalStrategy: email + bcrypt password
 * - GoogleStrategy: OAuth 2.0
 */
const passport       = require('passport');
const LocalStrategy  = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt         = require('bcryptjs');
const { query }      = require('../config/database');

// ── Serialize / Deserialize ──────────────────────────────────
passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const result = await query(
      'SELECT id, name, email, avatar_url, role, google_id FROM users WHERE id = $1 AND is_active = TRUE',
      [id]
    );
    if (!result.rows.length) return done(null, false);
    done(null, result.rows[0]);
  } catch (err) {
    done(err);
  }
});

// ── Local Strategy ───────────────────────────────────────────
passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const result = await query(
          'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
          [email.toLowerCase().trim()]
        );
        if (!result.rows.length) {
          return done(null, false, { message: 'Invalid email or password.' });
        }

        const user = result.rows[0];

        // OAuth-only users have no password
        if (!user.password_hash) {
          return done(null, false, { message: 'This account uses Google Sign-In. Please use "Continue with Google".' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password.' });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// ── Google OAuth Strategy ────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback',
        scope:        ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email     = profile.emails?.[0]?.value;
          const avatarUrl = profile.photos?.[0]?.value;
          const name      = profile.displayName || email?.split('@')[0] || 'User';

          if (!email) {
            return done(null, false, { message: 'Google account must have an email address.' });
          }

          // Check if a user with this Google ID already exists
          let result = await query(
            'SELECT * FROM users WHERE google_id = $1',
            [profile.id]
          );

          if (result.rows.length) {
            // Update avatar in case it changed
            await query(
              'UPDATE users SET avatar_url = $1, name = $2 WHERE google_id = $3',
              [avatarUrl, name, profile.id]
            );
            return done(null, result.rows[0]);
          }

          // Check if an email-password account exists — link it
          result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
          if (result.rows.length) {
            const updated = await query(
              'UPDATE users SET google_id = $1, avatar_url = $2 WHERE email = $3 RETURNING *',
              [profile.id, avatarUrl, email.toLowerCase()]
            );
            return done(null, updated.rows[0]);
          }

          // Create a brand-new Google user
          const newUser = await query(
            `INSERT INTO users (name, email, google_id, avatar_url, role)
             VALUES ($1, $2, $3, $4, 'user') RETURNING *`,
            [name, email.toLowerCase(), profile.id, avatarUrl]
          );
          return done(null, newUser.rows[0]);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
} else {
  console.warn('⚠️  Google OAuth not configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing).');
}

module.exports = passport;

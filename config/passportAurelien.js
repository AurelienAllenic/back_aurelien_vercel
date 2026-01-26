const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// Configuration Passport spécifique pour Aurelien
passport.use(
  "google-aurelien",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID_AURELIEN || process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET_AURELIEN || process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL_AURELIEN || "/auth-aurelien/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Passport passe le profil directement
        // On le retourne tel quel, le controller gérera la création/mise à jour de l'utilisateur
        return done(null, profile);
      } catch (error) {
        console.error("Erreur dans la stratégie Google Aurelien :", error);
        return done(error, null);
      }
    }
  )
);

// Serialization pour Aurelien (on stocke le profil complet)
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

module.exports = passport;

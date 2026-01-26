const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// Construction de l'URL de callback complète pour Google OAuth
const getCallbackURL = () => {
  // Si une URL complète est fournie, l'utiliser
  if (process.env.GOOGLE_CALLBACK_URL_AURELIEN) {
    return process.env.GOOGLE_CALLBACK_URL_AURELIEN;
  }
  
  // Sinon, construire l'URL selon l'environnement
  const isProduction = process.env.NODE_ENV === "production";
  const backendUrl = isProduction 
    ? (process.env.BACKEND_URL || "https://back-aurelien-vercel.vercel.app")
    : `http://localhost:${process.env.PORT || 3000}`;
  
  return `${backendUrl}/auth-aurelien/google/callback`;
};

// Configuration Passport spécifique pour Aurelien
passport.use(
  "google-aurelien",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID_AURELIEN || process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET_AURELIEN || process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: getCallbackURL(),
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

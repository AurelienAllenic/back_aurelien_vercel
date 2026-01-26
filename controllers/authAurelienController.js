const getUserAurelienModel = require("../models/UserAurelien");
const { connectDBAurelien } = require("../config/dbAurelien");
const bcrypt = require("bcryptjs");

// --- CONNEXION EMAIL/PASSWORD ---
exports.login = async (req, res) => {
  const { email, password } = req.body;

  console.log('🔐 [Aurelien Login] Tentative de connexion:', {
    email: email,
    emailNormalized: email?.toLowerCase().trim(),
    hasPassword: !!password,
  });

  try {
    // S'assurer que la connexion est établie
    await connectDBAurelien();
    const UserAurelien = await getUserAurelienModel();
    
    const emailNormalized = email.toLowerCase().trim();
    // Chercher l'utilisateur par email (peu importe l'authMethod)
    const user = await UserAurelien.findOne({ 
      email: emailNormalized
    });

    console.log('🔍 [Aurelien Login] Recherche utilisateur:', {
      emailRecherche: emailNormalized,
      userTrouve: !!user,
      userId: user?._id,
      userEmail: user?.email,
      userAuthMethod: user?.authMethod,
      hasPassword: !!user?.password,
    });

    if (!user) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect." });
    }

    // Si l'utilisateur existe mais n'a pas de mot de passe, c'est un compte Google uniquement
    if (!user.password) {
      console.log('❌ [Aurelien Login] User trouvé mais pas de password');
      return res.status(401).json({ error: "Ce compte utilise la connexion Google." });
    }

    // Si l'utilisateur a authMethod: "google" mais aussi un password, on peut le mettre à jour
    if (user.authMethod === "google" && user.password) {
      console.log('🔄 [Aurelien Login] Mise à jour authMethod de "google" à "email"');
      user.authMethod = "email";
      await user.save();
    }

    const passwordTrimmed = password.trim();
    const valid = await bcrypt.compare(passwordTrimmed, user.password);
    console.log('🔐 [Aurelien Login] Vérification mot de passe:', {
      valid: valid,
      passwordLength: passwordTrimmed.length,
    });

    if (!valid) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect." });
    }

    // ✅ Création d'une session pour Aurelien
    req.session.aurelienUserId = user._id;
    req.session.aurelienUserEmail = user.email;
    req.session.aurelienUserName = user.name || user.email;
    req.session.site = "aurelien"; // Identifier le site

    console.log('🔐 [Aurelien Login] Session créée:', {
      aurelienUserId: req.session.aurelienUserId,
      email: req.session.aurelienUserEmail,
      site: req.session.site,
      sessionID: req.sessionID,
    });

    // Sauvegarder la session
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error("❌ Erreur lors de la sauvegarde de la session Aurelien :", err);
          return reject(err);
        }
        console.log('✅ [Aurelien Login] Session sauvegardée');
        resolve();
      });
    });

    // Vérifier que le cookie est bien envoyé
    const setCookieHeader = res.getHeader('Set-Cookie');
    console.log('🍪 [Aurelien Login] Set-Cookie header:', setCookieHeader || 'AUCUN');

    res.status(200).json({
      message: "Connexion réussie.",
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name,
        picture: user.picture
      },
    });
  } catch (error) {
    console.error("Erreur lors de la connexion Aurelien :", error);
    res.status(500).json({ message: "Erreur serveur lors de la connexion." });
  }
};

// --- CALLBACK OAUTH GOOGLE ---
exports.googleCallback = async (req, res) => {
  try {
    console.log('🔵 [Aurelien Google OAuth] Callback reçu');
    const profile = req.user; // Passport met l'utilisateur dans req.user

    console.log('🔵 [Aurelien Google OAuth] Profile:', {
      hasProfile: !!profile,
      hasEmails: !!profile?.emails,
      email: profile?.emails?.[0]?.value,
      googleId: profile?.id,
    });

    if (!profile || !profile.emails || !profile.emails[0]) {
      console.log('❌ [Aurelien Google OAuth] Pas d\'email dans le profile');
      return res.redirect(`${process.env.AURELIEN_FRONTEND_URL || 'http://localhost:5173'}/login?error=no_email`);
    }

    // S'assurer que la connexion est établie
    await connectDBAurelien();
    const UserAurelien = await getUserAurelienModel();

    const email = profile.emails[0].value.toLowerCase().trim();
    const googleId = profile.id;
    const name = profile.displayName || profile.name?.givenName || email;
    const picture = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

    console.log('🔵 [Aurelien Google OAuth] Recherche utilisateur:', {
      email: email,
      googleId: googleId,
    });

    // 🔹 LOGIN UNIQUEMENT - Chercher un utilisateur existant par email ou googleId
    // On ne crée PAS de compte, l'utilisateur doit exister déjà
    let user = await UserAurelien.findOne({
      $or: [
        { email: email },
        { googleId: googleId }
      ]
    });

    console.log('🔵 [Aurelien Google OAuth] Résultat recherche:', {
      userTrouve: !!user,
      userId: user?._id,
      userEmail: user?.email,
      userGoogleId: user?.googleId,
      userAuthMethod: user?.authMethod,
    });

    // Si l'utilisateur n'existe pas, refuser la connexion
    if (!user) {
      console.log(`❌ [Aurelien Google OAuth] Tentative de connexion Google avec un compte inexistant: ${email}`);
      const frontendUrl = process.env.AURELIEN_FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/login?error=account_not_found`);
    }

    // Mettre à jour les infos Google si nécessaire (pour les comptes existants)
    let updated = false;
    if (!user.googleId && googleId) {
      user.googleId = googleId;
      updated = true;
    }
    // Si l'utilisateur a un password, on peut garder authMethod: "email" pour permettre les deux méthodes
    // Sinon, on met à jour à "google"
    if (!user.password && user.authMethod !== "google") {
      user.authMethod = "google";
      updated = true;
    }
    if (!user.name && name) {
      user.name = name;
      updated = true;
    }
    if (!user.picture && picture) {
      user.picture = picture;
      updated = true;
    }
    
    if (updated) {
      console.log('🔄 [Aurelien Google OAuth] Mise à jour utilisateur');
      await user.save();
    }

    // ✅ Création d'une session pour Aurelien
    req.session.aurelienUserId = user._id;
    req.session.aurelienUserEmail = user.email;
    req.session.aurelienUserName = user.name || user.email;
    req.session.site = "aurelien";

    console.log('🔐 [Aurelien Google OAuth] Session créée:', {
      aurelienUserId: req.session.aurelienUserId,
      email: req.session.aurelienUserEmail,
      site: req.session.site,
      sessionID: req.sessionID,
    });

    // Sauvegarder la session
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error("❌ [Aurelien Google OAuth] Erreur lors de la sauvegarde de la session :", err);
          return reject(err);
        }
        console.log('✅ [Aurelien Google OAuth] Session sauvegardée');
        resolve();
      });
    });

    // Vérifier que le cookie est bien envoyé
    const setCookieHeader = res.getHeader('Set-Cookie');
    console.log('🍪 [Aurelien Google OAuth] Set-Cookie header:', setCookieHeader || 'AUCUN');

    // Rediriger vers le frontend Aurelien
    const frontendUrl = process.env.AURELIEN_FRONTEND_URL || 'http://localhost:5173';
    console.log('🔄 [Aurelien Google OAuth] Redirection vers:', `${frontendUrl}/dashboard?success=logged_in`);
    res.redirect(`${frontendUrl}/dashboard?success=logged_in`);
  } catch (error) {
    console.error("❌ [Aurelien Google OAuth] Erreur lors du callback Google Aurelien :", error);
    const frontendUrl = process.env.AURELIEN_FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=server_error`);
  }
};

// --- DÉCONNEXION ---
exports.logout = (req, res) => {
  // Supprimer uniquement les données Aurelien de la session
  // (on garde la session Paro si elle existe)
  if (req.session) {
    delete req.session.aurelienUserId;
    delete req.session.aurelienUserEmail;
    delete req.session.aurelienUserName;
    if (req.session.site === "aurelien") {
      delete req.session.site;
    }
  }

  req.session.save((err) => {
    if (err) {
      console.error("Erreur lors de la déconnexion Aurelien :", err);
      return res.status(500).json({ message: "Erreur lors de la déconnexion." });
    }

    res.status(200).json({ message: "Déconnexion réussie." });
  });
};

// --- VÉRIFICATION DE SESSION ---
exports.checkSession = (req, res) => {
  console.log('🔍 [Aurelien Check] Vérification session:', {
    hasSession: !!req.session,
    sessionID: req.sessionID,
    aurelienUserId: req.session?.aurelienUserId,
    site: req.session?.site,
    cookies: req.headers.cookie || 'AUCUN COOKIE',
    origin: req.headers.origin,
  });

  if (req.session && req.session.aurelienUserId && req.session.site === "aurelien") {
    console.log('✅ [Aurelien Check] Session valide');
    return res.status(200).json({
      isAuthenticated: true,
      user: { 
        id: req.session.aurelienUserId, 
        email: req.session.aurelienUserEmail,
        name: req.session.aurelienUserName
      },
    });
  }
  
  console.log('❌ [Aurelien Check] Session invalide ou absente');
  res.status(401).json({ isAuthenticated: false });
};

// --- MIDDLEWARE DE PROTECTION DES ROUTES ---
exports.requireAuth = (req, res, next) => {
  if (!req.session.aurelienUserId || req.session.site !== "aurelien") {
    return res.status(401).json({ message: "Non authentifié." });
  }
  next();
};

// --- MIDDLEWARE ADMIN ---
exports.requireAdmin = async (req, res, next) => {
  try {
    if (!req.session.aurelienUserId || req.session.site !== "aurelien") {
      return res.status(401).json({ message: "Non authentifié." });
    }

    await connectDBAurelien();
    const UserAurelien = await getUserAurelienModel();
    const user = await UserAurelien.findById(req.session.aurelienUserId);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Accès refusé. Admin requis." });
    }

    next();
  } catch (error) {
    console.error("Erreur dans requireAdmin:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// --- CRÉATION DE COMPTE (ADMIN UNIQUEMENT) ---
exports.createUser = async (req, res) => {
  const { email, password, name, authMethod, role } = req.body;

  try {
    // Validation
    if (!email) {
      return res.status(400).json({ error: "Email requis." });
    }

    if (authMethod === "email" && !password) {
      return res.status(400).json({ error: "Mot de passe requis pour l'authentification email." });
    }

    if (!authMethod || !["email", "google"].includes(authMethod)) {
      return res.status(400).json({ error: "authMethod doit être 'email' ou 'google'." });
    }

    await connectDBAurelien();
    const UserAurelien = await getUserAurelienModel();

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await UserAurelien.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (existingUser) {
      return res.status(400).json({ error: "Un compte avec cet email existe déjà." });
    }

    // Créer le nouvel utilisateur
    const newUser = new UserAurelien({
      email: email.toLowerCase().trim(),
      password: authMethod === "email" ? password : undefined,
      name: name || undefined,
      authMethod: authMethod,
      role: role || "user"
    });

    await newUser.save();

    res.status(201).json({
      message: "Compte créé avec succès.",
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        authMethod: newUser.authMethod,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error("Erreur lors de la création du compte Aurelien :", error);
    res.status(500).json({ message: "Erreur serveur lors de la création du compte." });
  }
};

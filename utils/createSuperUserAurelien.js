require("dotenv").config();
const { connectDBAurelien } = require("../config/dbAurelien");
const getUserAurelienModel = require("../models/UserAurelien");

(async () => {
  try {
    // Connexion à MongoDB Aurelien
    await connectDBAurelien();
    const UserAurelien = await getUserAurelienModel();

    // Vérifier si un admin existe déjà
    const adminExists = await UserAurelien.findOne({ role: "admin" });
    if (adminExists) {
      console.log("✅ Un super utilisateur Aurelien existe déjà.");
      return process.exit();
    }

    // Variables d'environnement pour le premier admin
    const adminEmail = process.env.AURELIEN_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
    const adminPassword = process.env.AURELIEN_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
    const adminName = process.env.AURELIEN_ADMIN_NAME || "Admin Aurelien";

    if (!adminEmail || !adminPassword) {
      console.error("❌ Erreur: AURELIEN_ADMIN_EMAIL et AURELIEN_ADMIN_PASSWORD doivent être définis dans .env");
      return process.exit(1);
    }

    // Créer le super utilisateur
    const admin = new UserAurelien({
      email: adminEmail.toLowerCase().trim(),
      password: adminPassword,
      name: adminName,
      authMethod: "email",
      role: "admin",
    });

    await admin.save();
    console.log("✅ Super utilisateur Aurelien créé avec succès.");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Nom: ${adminName}`);
    console.log(`   Rôle: admin`);
    process.exit();
  } catch (error) {
    console.error("❌ Erreur lors de la création du super utilisateur Aurelien :", error);
    process.exit(1);
  }
})();

const mongoose = require("mongoose");

/**
 * Exporte toutes les collections MongoDB au format CSV.
 * Route attendue : GET /export-db?format=csv (protégée par auth).
 */
exports.exportDb = async (req, res) => {
  const { format } = req.query;

  if (format && format !== "csv") {
    return res
      .status(400)
      .json({ error: "Format non supporté. Utilisez ?format=csv" });
  }

  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res
        .status(500)
        .json({ error: "Connexion MongoDB non disponible pour l'export." });
    }

    const collections = await db.collections();
    let csvParts = [];

    for (const col of collections) {
      const name = col.collectionName;

      // On exclut les collections système si nécessaire
      if (name.startsWith("system.")) continue;

      const docs = await col.find({}).toArray();
      if (!docs.length) continue;

      // En-tête de section
      csvParts.push(`# Collection: ${name}`);

      // Détermination des colonnes (on enlève _id pour simplifier)
      const headers = Array.from(
        docs.reduce((set, doc) => {
          Object.keys(doc).forEach((k) => {
            if (k !== "_id") set.add(k);
          });
          return set;
        }, new Set())
      );

      csvParts.push(headers.join(";"));

      for (const doc of docs) {
        const row = headers
          .map((h) => {
            const v = doc[h];
            if (v === null || v === undefined) return "";
            let s = "";
            if (v instanceof Date) {
              s = v.toISOString();
            } else if (typeof v === "object") {
              s = JSON.stringify(v);
            } else {
              s = String(v);
            }
            // Échapper les guillemets
            s = s.replace(/"/g, '""');
            return `"${s}"`;
          })
          .join(";");

        csvParts.push(row);
      }

      // Ligne vide entre collections
      csvParts.push("");
    }

    const csvContent = csvParts.join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="paro-backup.csv"'
    );
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("❌ Erreur export DB:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de l'export des données." });
  }
};


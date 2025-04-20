const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const OUTPUT_FOLDER = "converted-images";

// Créer le dossier de sortie s'il n'existe pas déjà
if (!fs.existsSync(OUTPUT_FOLDER)) {
  fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });
}

// Middleware pour convertir les images en webp si elles ne le sont pas déjà
const convertImageToWebP = (req, res, next) => {
  if (req.file) {
    const inputPath = req.file.path;
    const outputPath = path.join(
      OUTPUT_FOLDER,
      `${path.parse(req.file.filename).name}.webp`
    );

    // Vérifier si l'image est déjà en webp
    if (path.extname(req.file.filename).toLowerCase() !== ".webp") {
      sharp(inputPath)
        .webp()
        .toFile(outputPath, (err, info) => {
          if (err) {
            return res
              .status(500)
              .json({ error: "Erreur lors de la conversion de l'image" });
          }

          // Remplacer le chemin de l'image originale par le chemin de l'image convertie
          req.file.path = outputPath;
          req.file.filename = `${path.parse(req.file.filename).name}.webp`;
          next();
        });
    } else {
      // Si l'image est déjà en webp, passer à la suite
      next();
    }
  } else {
    next();
  }
};

module.exports = { convertImageToWebP };

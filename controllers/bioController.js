const Bio = require("../models/Bio");
const cloudinary = require("cloudinary").v2;

// 🔹 Configuration de Cloudinary (ajoute ces variables dans `.env`)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
  chunk_size: 6000000, // 6MB pour diviser les gros fichiers
});

// ✅ Récupérer la bio (GET)
exports.getBio = async (req, res) => {
  try {
    const bio = await Bio.findOne();
    if (!bio) {
      return res.status(404).json({ message: "Bio non trouvée." });
    }
    res
      .status(200)
      .json({ message: "✅ Bio récupérée avec succès", data: bio });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de la bio :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Modifier la bio (PUT)
exports.updateBio = async (req, res) => {
  try {
    const updateData = req.body;

    let newImageUrl = null;

    // 🔹 Si une nouvelle image est uploadée
    if (req.file) {
      try {
        const cloudinaryResult = await cloudinary.uploader.upload(
          req.file.path,
          {
            quality: "auto:low",
            fetch_format: "auto",
            folder: "bio",
          }
        );

        newImageUrl = cloudinaryResult.secure_url;
      } catch (error) {
        console.error("❌ Erreur Cloudinary :", error);
        return res
          .status(500)
          .json({ message: "Erreur lors de l'upload de l'image." });
      }
    }

    let bio = await Bio.findOne();

    if (!bio) {
      bio = new Bio({ ...updateData, image: newImageUrl });
      await bio.save();
    } else {
      bio = await Bio.findOneAndUpdate(
        {},
        { $set: { ...updateData, image: newImageUrl || bio.image } },
        { new: true, runValidators: true }
      );
    }

    res
      .status(200)
      .json({ message: "✅ Bio mise à jour avec succès", data: bio });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de la bio :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

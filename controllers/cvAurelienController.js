const getCvAurelienModel = require("../models/CvAurelien");
const { connectDBAurelien } = require("../config/dbAurelien");

const pickUrl = (f) => (f && f[0] && (f[0].path || f[0].secure_url)) || "";

exports.getCv = async (req, res) => {
  try {
    await connectDBAurelien();
    const CvAurelien = await getCvAurelienModel();
    const cv = await CvAurelien.findOne().lean();
    if (!cv) {
      return res.status(200).json({ data: null });
    }
    res.status(200).json({ data: cv });
  } catch (error) {
    console.error("Erreur getCv Aurelien:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.upsertCv = async (req, res) => {
  try {
    await connectDBAurelien();
    const CvAurelien = await getCvAurelienModel();
    const files = req.files || {};

    const existing = await CvAurelien.findOne().lean();

    const payload = {
      imagePngFr: pickUrl(files.imagePngFr) || existing?.imagePngFr || "",
      imagePngEn: pickUrl(files.imagePngEn) || existing?.imagePngEn || "",
      pdfFr: pickUrl(files.pdfFr) || existing?.pdfFr || "",
      pdfEn: pickUrl(files.pdfEn) || existing?.pdfEn || "",
    };

    const cv = await CvAurelien.findOneAndUpdate(
      {},
      { $set: payload },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ message: "CV enregistré.", data: cv });
  } catch (error) {
    console.error("Erreur upsertCv Aurelien:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.deleteCv = async (req, res) => {
  try {
    await connectDBAurelien();
    const CvAurelien = await getCvAurelienModel();
    const cv = await CvAurelien.findOneAndDelete({});
    if (!cv) {
      return res.status(404).json({ message: "Aucun CV trouvé." });
    }
    res.status(200).json({ message: "CV supprimé." });
  } catch (error) {
    console.error("Erreur deleteCv Aurelien:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

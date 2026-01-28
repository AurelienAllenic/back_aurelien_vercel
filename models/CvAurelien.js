const mongoose = require("mongoose");
const { getAurelienConnection } = require("../config/dbAurelien");

const CvAurelienSchema = new mongoose.Schema(
  {
    imagePngFr: { type: String, default: "" },
    imagePngEn: { type: String, default: "" },
    pdfFr: { type: String, default: "" },
    pdfEn: { type: String, default: "" },
  },
  { timestamps: true }
);

const getCvAurelienModel = async () => {
  let connection = getAurelienConnection();

  if (!connection || connection.readyState !== 1) {
    const { connectDBAurelien } = require("../config/dbAurelien");
    connection = await connectDBAurelien();

    if (connection && connection.readyState === 2) {
      await new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 60;
        const checkConnection = setInterval(() => {
          attempts++;
          const state = connection.readyState;
          if (state === 1 || state === 0 || attempts >= maxAttempts) {
            clearInterval(checkConnection);
            resolve();
          }
        }, 100);
      });
    }
  }

  if (!connection || connection.readyState !== 1) {
    throw new Error("Connexion MongoDB Aurelien non disponible");
  }

  if (connection.models.CvAurelien) {
    return connection.models.CvAurelien;
  }

  return connection.model("CvAurelien", CvAurelienSchema);
};

module.exports = getCvAurelienModel;

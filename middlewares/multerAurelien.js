const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configuration Cloudinary dédiée Aurelien (variables _AURELIEN)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME_AURELIEN,
  api_key: process.env.CLOUDINARY_API_KEY_AURELIEN,
  api_secret: process.env.CLOUDINARY_API_SECRET_AURELIEN,
  secure: true,
});

const cvStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "aurelien/cv",
    resource_type: (req, file) =>
      file.mimetype === "application/pdf" ? "raw" : "image",
    format: (req, file) => {
      if (file.mimetype === "application/pdf") return "pdf";
      return file.mimetype.split("/")[1] || "png";
    },
    public_id: (req, file) => {
      const name = file.fieldname || "file";
      return `cv-${name}-${Date.now()}`;
    },
  },
});

const cvUpload = multer({
  storage: cvStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/png", "application/pdf"];
    if (!allowed.includes(file.mimetype)) {
      return cb(
        new Error("Seuls les formats PNG et PDF sont autorisés pour le CV."),
        false
      );
    }
    cb(null, true);
  },
});

exports.uploadCvFields = (req, res, next) => {
  cvUpload.fields(
    [
      { name: "imagePngFr", maxCount: 1 },
      { name: "imagePngEn", maxCount: 1 },
      { name: "pdfFr", maxCount: 1 },
      { name: "pdfEn", maxCount: 1 },
    ]
  )(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Erreur upload" });
    }
    next();
  });
};

exports.cloudinaryAurelien = cloudinary;

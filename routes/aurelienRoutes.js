const express = require("express");
const router = express.Router();
const aurelienContactController = require("../controllers/aurelienContactController");
const cvAurelienController = require("../controllers/cvAurelienController");
const authAurelienController = require("../controllers/authAurelienController");
const { uploadCvFields } = require("../middlewares/multerAurelien");

// AURELIEN CONTACT ROUTE
router.post("/aurelien-contact", aurelienContactController.handleAurelienContact);

// CV AURELIEN — public read, auth for write/delete
router.get("/cv", cvAurelienController.getCv);
router.put(
  "/cv",
  authAurelienController.requireAuth,
  uploadCvFields,
  cvAurelienController.upsertCv
);
router.delete("/cv", authAurelienController.requireAuth, cvAurelienController.deleteCv);

module.exports = router;

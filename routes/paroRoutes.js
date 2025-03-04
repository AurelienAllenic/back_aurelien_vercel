const express = require("express");
const router = express.Router();
const radioController = require("../controllers/radioController");
const smartLinkController = require("../controllers/smartLinkController");
const smartLinkV2Controller = require("../controllers/smartLinkControllerV2");
const smartLinkFolderController = require("../controllers/smartLinkFolderController");
const auth = require("../middlewares/authMiddleware");
const { uploadImage } = require("../middlewares/multerMiddleware");

// RADIO ROUTES
router.post("/add-radio", auth, uploadImage, radioController.addRadio);
router.get("/radios", radioController.findAllRadios);
router.get("/radios/:id", radioController.findOneRadio);
router.put("/radios/:id", auth, uploadImage, radioController.updateRadio);
router.delete("/radios/:id", auth, radioController.deleteRadio);

// SMART LINK ROUTES

router.post("/add-smart-link", auth, smartLinkController.addSmartLink);
router.get("/smart-links", smartLinkController.findAllSmartLinks);
router.get("/smart-links/:id", smartLinkController.findOneSmartLink);
router.put("/smart-links/:id", auth, smartLinkController.updateSmartLink);
router.delete("/smart-links/:id", auth, smartLinkController.deleteSmartLink);

// SMART LINK V2 ROUTES

router.post("/add-smart-link-v2", auth, smartLinkV2Controller.addSmartLink);
router.get("/smart-links-v2", smartLinkV2Controller.findAllSmartLinks);
router.get("/smart-links-v2/:id", smartLinkV2Controller.findOneSmartLink);
router.put("/smart-links-v2/:id", auth, smartLinkV2Controller.updateSmartLink);
router.delete(
  "/smart-links-v2/:id",
  auth,
  smartLinkV2Controller.deleteSmartLink
);

// FOLDERS ROUTES

router.post(
  "/add-smart-link-folder",
  auth,
  smartLinkFolderController.addFolder
);
router.get("/smart-links-folders", smartLinkFolderController.findAllFolders);
router.get("/smart-links-folder/:id", smartLinkFolderController.findOneFolder);
router.put(
  "/smart-links-folder/:id",
  auth,
  smartLinkFolderController.updateFolder
);
router.delete(
  "/smart-links-folder/:id",
  auth,
  smartLinkFolderController.deleteFolder
);

module.exports = router;

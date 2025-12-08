const express = require("express");
const router = express.Router();
const radioController = require("../controllers/radioController");
const smartLinkController = require("../controllers/smartLinkController");
const smartLinkV2Controller = require("../controllers/smartLinkControllerV2");
const smartLinkFolderController = require("../controllers/smartLinkFolderController");
const auth = require("../middlewares/authMiddleware");
const { uploadImage } = require("../middlewares/multerMiddleware");
const socialLinksController = require("../controllers/socialLinksController");
const bioController = require("../controllers/bioController");
const pressController = require("../controllers/pressController");
const videoController = require("../controllers/VideosController");
const epController = require("../controllers/EpController");
const singleController = require("../controllers/singleController");
const liveController = require("../controllers/LiveController");
const { uploadSingleImages } = require("../middlewares/multerMiddleware");
const trashController = require("../controllers/trashController");
const freshNewsController = require("../controllers/freshNewsController");
const paroContactController = require("../controllers/paroContactController");

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

// SOCIAL LINKS

router.get("/social-links", socialLinksController.getSocialLinks);
router.put("/social-links", auth, socialLinksController.updateSocialLinks);

// BIO ROUTES

router.get("/bio", bioController.getBio);
router.put("/bio", auth, uploadImage, bioController.updateBio);

// PRESS ROUTES

router.post("/add-press", auth, uploadImage, pressController.createPress);
router.get("/press/:id", auth, pressController.getPress);
router.put("/press/:id", auth, uploadImage, pressController.updatePress);
router.delete("/press/:id", auth, pressController.deletePress);
router.get("/all-press", pressController.findAllPress);
router.put("/order-press", pressController.updateOrder);

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

// VIDEO ROUTES
router.post("/add-video", auth, uploadImage, videoController.addVideo);
router.get("/videos", videoController.findAllVideos);
router.get("/videos/:id", videoController.findOneVideo);
router.put("/videos/:id", auth, uploadImage, videoController.updateVideo);
router.delete("/videos/:id", auth, videoController.deleteVideo);

// EP ROUTES
router.post("/add-ep", auth, uploadImage, epController.addEp);
router.get("/eps", epController.findAllEps);
router.get("/eps/:id", epController.findOneEp);
router.put("/eps/:id", auth, uploadImage, epController.updateEp);
router.delete("/eps/:id", auth, epController.deleteEp);

// SINGLE ROUTES
router.post(
  "/add-single",
  auth,
  uploadSingleImages,
  singleController.addSingle
);
router.get("/singles", singleController.findAllSingles);
router.get("/singles/:id", singleController.findOneSingle);
router.put(
  "/singles/:id",
  auth,
  uploadSingleImages,
  singleController.updateSingle
);
router.delete("/singles/:id", auth, singleController.deleteSingle);

// LIVE ROUTES
router.post("/add-live", auth, uploadImage, liveController.addLive);
router.get("/lives", liveController.findAllLives);
router.get("/lives/:id", liveController.findOneLive);
router.put("/lives/:id", auth, uploadImage, liveController.updateLive);
router.delete("/lives/:id", auth, liveController.deleteLive);

// TRASH ROUTES
router.get("/trash", trashController.getAllTrashedItems);
router.post("/restore-trash/:id", trashController.restoreItem);
router.delete("/delete-trash/:id", trashController.permanentlyDeleteItem);

// FRESH NEWS
router.get("/fresh-news", freshNewsController.getFreshNews);
router.post("/fresh-news", freshNewsController.upsertFreshNews);

// PARO CONTACT ROUTE
router.post("/paro-contact", paroContactController.handleParoContact);

module.exports = router;

const cors = require("cors");

const allowedPatterns = [
  /^https:\/\/(www\.)?aurelienallenic\.fr$/,
  /^https:\/\/(www\.)?paro-officiel\.com$/,
  /^https:\/\/(www\.)?paro-musique\.com$/
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log("Origin reçu :", origin);
    if (!origin || allowedPatterns.some((pattern) => pattern.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error("CORS policy: Origin not allowed"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const corsConfig = (req, res, next) => {
  cors(corsOptions)(req, res, () => {
    if (req.method === "OPTIONS") {
      res.header("Access-Control-Allow-Origin", req.headers.origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      return res.status(200).send();
    }
    next();
  });
};

module.exports = corsConfig;

const serverless = require("serverless-http");
const app = require("../app/app");

console.log("🚀 Serveur Express chargé !");
module.exports = serverless(app);

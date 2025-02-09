const serverless = require("serverless-http");
const app = require("../app/app");

module.exports = serverless(app);

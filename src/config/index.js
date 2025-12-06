const dev = require("./dev");
const staging = require("./staging");
const prod = require("./prod");

const env = process.env.NODE_ENV || "dev";

const configMap = { dev, staging, prod };

if (!configMap[env]) {
  throw new Error(`Config for NODE_ENV=${env} not found`);
}

module.exports = configMap[env];

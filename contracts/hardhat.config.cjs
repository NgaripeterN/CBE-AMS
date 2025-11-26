require("@nomicfoundation/hardhat-toolbox");

// Explicitly load the .env file from the project root
require("dotenv").config({ path: require('path').resolve(__dirname, '../.env') });

const privateKey = process.env.ISSUER_PRIVATE_KEY;

module.exports = {
  solidity: "0.8.20",
  paths: {
    sources: "./", // Look for .sol files in this directory
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: privateKey ? [privateKey] : [],
    },
  },
};
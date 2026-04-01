const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  /.*_tmp_.*/,
  /\.cache\/openid-client\/.*/,
];

module.exports = config;

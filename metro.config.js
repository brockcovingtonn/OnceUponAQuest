// Metro config: the defaults, plus 3D models (.glb) as bundled assets.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('glb');

module.exports = config;

const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// 👇 This is the important line for Expo SDK 53 + React 19 issues
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;

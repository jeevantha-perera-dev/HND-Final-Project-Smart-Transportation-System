const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

/**
 * react-native-svg's package.json points "react-native" at TypeScript source, which does
 * `export * from './lib/extract/types'` (type-only). Metro then fails to resolve it on Android.
 * Use the precompiled CommonJS build instead (same runtime, no TS re-export issue).
 */
const resolveRequestPrev = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react-native-svg") {
    return {
      type: "sourceFile",
      filePath: path.resolve(__dirname, "node_modules/react-native-svg/lib/commonjs/index.js"),
    };
  }
  if (resolveRequestPrev) {
    return resolveRequestPrev(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

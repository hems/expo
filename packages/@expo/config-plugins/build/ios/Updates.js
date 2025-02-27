"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Config = void 0;
exports.ensureBundleReactNativePhaseContainsConfigurationScript = ensureBundleReactNativePhaseContainsConfigurationScript;
exports.getBundleReactNativePhase = getBundleReactNativePhase;
exports.isPlistConfigurationSet = isPlistConfigurationSet;
exports.isPlistConfigurationSyncedAsync = isPlistConfigurationSyncedAsync;
exports.isPlistVersionConfigurationSyncedAsync = isPlistVersionConfigurationSyncedAsync;
exports.isShellScriptBuildPhaseConfigured = isShellScriptBuildPhaseConfigured;
exports.setUpdatesConfigAsync = setUpdatesConfigAsync;
exports.setVersionsConfigAsync = setVersionsConfigAsync;
exports.withUpdates = void 0;
function path() {
  const data = _interopRequireWildcard(require("path"));
  path = function () {
    return data;
  };
  return data;
}
function _resolveFrom() {
  const data = _interopRequireDefault(require("resolve-from"));
  _resolveFrom = function () {
    return data;
  };
  return data;
}
function _iosPlugins() {
  const data = require("../plugins/ios-plugins");
  _iosPlugins = function () {
    return data;
  };
  return data;
}
function _Updates() {
  const data = require("../utils/Updates");
  _Updates = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const CREATE_MANIFEST_IOS_PATH = 'expo-updates/scripts/create-manifest-ios.sh';
let Config = exports.Config = /*#__PURE__*/function (Config) {
  Config["ENABLED"] = "EXUpdatesEnabled";
  Config["CHECK_ON_LAUNCH"] = "EXUpdatesCheckOnLaunch";
  Config["LAUNCH_WAIT_MS"] = "EXUpdatesLaunchWaitMs";
  Config["RUNTIME_VERSION"] = "EXUpdatesRuntimeVersion";
  Config["UPDATE_URL"] = "EXUpdatesURL";
  Config["UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY"] = "EXUpdatesRequestHeaders";
  Config["CODE_SIGNING_CERTIFICATE"] = "EXUpdatesCodeSigningCertificate";
  Config["CODE_SIGNING_METADATA"] = "EXUpdatesCodeSigningMetadata";
  return Config;
}({}); // when making changes to this config plugin, ensure the same changes are also made in eas-cli and build-tools
// Also ensure the docs are up-to-date: https://docs.expo.dev/bare/installing-updates/
const withUpdates = config => {
  return (0, _iosPlugins().withExpoPlist)(config, async config => {
    const projectRoot = config.modRequest.projectRoot;
    const expoUpdatesPackageVersion = (0, _Updates().getExpoUpdatesPackageVersion)(projectRoot);
    config.modResults = await setUpdatesConfigAsync(projectRoot, config, config.modResults, expoUpdatesPackageVersion);
    return config;
  });
};
exports.withUpdates = withUpdates;
async function setUpdatesConfigAsync(projectRoot, config, expoPlist, expoUpdatesPackageVersion) {
  const newExpoPlist = {
    ...expoPlist,
    [Config.ENABLED]: (0, _Updates().getUpdatesEnabled)(config),
    [Config.CHECK_ON_LAUNCH]: (0, _Updates().getUpdatesCheckOnLaunch)(config, expoUpdatesPackageVersion),
    [Config.LAUNCH_WAIT_MS]: (0, _Updates().getUpdatesTimeout)(config)
  };
  const updateUrl = (0, _Updates().getUpdateUrl)(config);
  if (updateUrl) {
    newExpoPlist[Config.UPDATE_URL] = updateUrl;
  } else {
    delete newExpoPlist[Config.UPDATE_URL];
  }
  const codeSigningCertificate = (0, _Updates().getUpdatesCodeSigningCertificate)(projectRoot, config);
  if (codeSigningCertificate) {
    newExpoPlist[Config.CODE_SIGNING_CERTIFICATE] = codeSigningCertificate;
  } else {
    delete newExpoPlist[Config.CODE_SIGNING_CERTIFICATE];
  }
  const codeSigningMetadata = (0, _Updates().getUpdatesCodeSigningMetadata)(config);
  if (codeSigningMetadata) {
    newExpoPlist[Config.CODE_SIGNING_METADATA] = codeSigningMetadata;
  } else {
    delete newExpoPlist[Config.CODE_SIGNING_METADATA];
  }
  const requestHeaders = (0, _Updates().getUpdatesRequestHeaders)(config);
  if (requestHeaders) {
    newExpoPlist[Config.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY] = requestHeaders;
  } else {
    delete newExpoPlist[Config.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY];
  }
  return await setVersionsConfigAsync(projectRoot, config, newExpoPlist);
}
async function setVersionsConfigAsync(projectRoot, config, expoPlist) {
  const newExpoPlist = {
    ...expoPlist
  };
  const runtimeVersion = await (0, _Updates().getRuntimeVersionNullableAsync)(projectRoot, config, 'ios');
  if (!runtimeVersion && expoPlist[Config.RUNTIME_VERSION]) {
    throw new Error('A runtime version is set in your Expo.plist, but is missing from your app.json/app.config.js. Please either set runtimeVersion in your app.json/app.config.js or remove EXUpdatesRuntimeVersion from your Expo.plist.');
  }
  if (runtimeVersion) {
    delete newExpoPlist['EXUpdatesSDKVersion'];
    newExpoPlist[Config.RUNTIME_VERSION] = runtimeVersion;
  } else {
    delete newExpoPlist['EXUpdatesSDKVersion'];
    delete newExpoPlist[Config.RUNTIME_VERSION];
  }
  return newExpoPlist;
}
function formatConfigurationScriptPath(projectRoot) {
  const buildScriptPath = _resolveFrom().default.silent(projectRoot, CREATE_MANIFEST_IOS_PATH);
  if (!buildScriptPath) {
    throw new Error("Could not find the build script for iOS. This could happen in case of outdated 'node_modules'. Run 'npm install' to make sure that it's up-to-date.");
  }
  const relativePath = path().relative(path().join(projectRoot, 'ios'), buildScriptPath);
  return process.platform === 'win32' ? relativePath.replace(/\\/g, '/') : relativePath;
}
function getBundleReactNativePhase(project) {
  const shellScriptBuildPhase = project.hash.project.objects.PBXShellScriptBuildPhase;
  const bundleReactNative = Object.values(shellScriptBuildPhase).find(buildPhase => buildPhase.name === '"Bundle React Native code and images"');
  if (!bundleReactNative) {
    throw new Error(`Couldn't find a build phase "Bundle React Native code and images"`);
  }
  return bundleReactNative;
}
function ensureBundleReactNativePhaseContainsConfigurationScript(projectRoot, project) {
  const bundleReactNative = getBundleReactNativePhase(project);
  const buildPhaseShellScriptPath = formatConfigurationScriptPath(projectRoot);
  if (!isShellScriptBuildPhaseConfigured(projectRoot, project)) {
    // check if there's already another path to create-manifest-ios.sh
    // this might be the case for monorepos
    if (bundleReactNative.shellScript.includes(CREATE_MANIFEST_IOS_PATH)) {
      bundleReactNative.shellScript = bundleReactNative.shellScript.replace(new RegExp(`(\\\\n)(\\.\\.)+/node_modules/${CREATE_MANIFEST_IOS_PATH}`), '');
    }
    bundleReactNative.shellScript = `${bundleReactNative.shellScript.replace(/"$/, '')}${buildPhaseShellScriptPath}\\n"`;
  }
  return project;
}
function isShellScriptBuildPhaseConfigured(projectRoot, project) {
  const bundleReactNative = getBundleReactNativePhase(project);
  const buildPhaseShellScriptPath = formatConfigurationScriptPath(projectRoot);
  return bundleReactNative.shellScript.includes(buildPhaseShellScriptPath);
}
function isPlistConfigurationSet(expoPlist) {
  return Boolean(expoPlist.EXUpdatesURL && expoPlist.EXUpdatesRuntimeVersion);
}
async function isPlistConfigurationSyncedAsync(projectRoot, config, expoPlist) {
  return (0, _Updates().getUpdateUrl)(config) === expoPlist.EXUpdatesURL && (0, _Updates().getUpdatesEnabled)(config) === expoPlist.EXUpdatesEnabled && (0, _Updates().getUpdatesTimeout)(config) === expoPlist.EXUpdatesLaunchWaitMs && (0, _Updates().getUpdatesCheckOnLaunch)(config) === expoPlist.EXUpdatesCheckOnLaunch && (0, _Updates().getUpdatesCodeSigningCertificate)(projectRoot, config) === expoPlist.EXUpdatesCodeSigningCertificate && (0, _Updates().getUpdatesCodeSigningMetadata)(config) === expoPlist.EXUpdatesCodeSigningMetadata && (await isPlistVersionConfigurationSyncedAsync(projectRoot, config, expoPlist));
}
async function isPlistVersionConfigurationSyncedAsync(projectRoot, config, expoPlist) {
  var _expoPlist$EXUpdatesR, _expoPlist$EXUpdatesS;
  const expectedRuntimeVersion = await (0, _Updates().getRuntimeVersionNullableAsync)(projectRoot, config, 'ios');
  const currentRuntimeVersion = (_expoPlist$EXUpdatesR = expoPlist.EXUpdatesRuntimeVersion) !== null && _expoPlist$EXUpdatesR !== void 0 ? _expoPlist$EXUpdatesR : null;
  const currentSdkVersion = (_expoPlist$EXUpdatesS = expoPlist.EXUpdatesSDKVersion) !== null && _expoPlist$EXUpdatesS !== void 0 ? _expoPlist$EXUpdatesS : null;
  if (expectedRuntimeVersion !== null) {
    return currentRuntimeVersion === expectedRuntimeVersion && currentSdkVersion === null;
  } else {
    return true;
  }
}
//# sourceMappingURL=Updates.js.map
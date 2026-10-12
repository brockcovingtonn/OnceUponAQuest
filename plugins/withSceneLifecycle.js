/**
 * Adopts the iOS scene-based app life cycle using Expo's ExpoAppSceneDelegate.
 *
 * iOS 27 asserts at launch for apps built with the iOS 27 SDK that don't use
 * scenes. Expo SDK 57 ships the scene delegate but the app template doesn't
 * opt in yet, so this plugin:
 *   1. adds a UIApplicationSceneManifest pointing at EXExpoAppSceneDelegate;
 *   2. makes AppDelegate an ExpoReactNativeFactoryProvider and stops it from
 *      creating the window itself (the scene delegate creates the window and
 *      starts React Native, including cold-start deep links).
 * Remove this plugin once the Expo template adopts scenes on its own.
 */
const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const WINDOW_BLOCK = /\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\(\n\s*withModuleName: "main",\n\s*in: window,\n\s*launchOptions: launchOptions\)\n#endif\n/;

function withSceneLifecycle(config) {
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: 'EXExpoAppSceneDelegate',
          },
        ],
      },
    };
    return cfg;
  });

  config = withAppDelegate(config, (cfg) => {
    if (cfg.modResults.language !== 'swift') {
      throw new Error('withSceneLifecycle expects a Swift AppDelegate');
    }
    let src = cfg.modResults.contents;
    if (!src.includes('ExpoReactNativeFactoryProvider')) {
      src = src.replace('class AppDelegate: ExpoAppDelegate {', 'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {');
      if (!WINDOW_BLOCK.test(src)) {
        throw new Error('withSceneLifecycle: AppDelegate no longer matches the expected template; update the plugin.');
      }
      src = src.replace(WINDOW_BLOCK, '\n    // The scene delegate (EXExpoAppSceneDelegate) creates the window and starts React Native.\n');
    }
    cfg.modResults.contents = src;
    return cfg;
  });

  return config;
}

module.exports = withSceneLifecycle;

export default {
    expo: {
      name: "Along",
      slug: "Along",
      scheme: "along",
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/images/icon.png",
      userInterfaceStyle: "automatic",
      newArchEnabled: true,
      ios: {
        supportsTablet: true,
        bundleIdentifier: "com.anonymous.Along",
        infoPlist: {
          CFBundleURLTypes: [
            {
              CFBundleURLSchemes: [
                "com.googleusercontent.apps.353671954519-7lov44i083k79ngdilpn4jil5evfhqhb"
              ]
            }
          ],
          NSLocationWhenInUseUsageDescription: "This app needs access to your location to show you on the map.",
          NSLocationAlwaysAndWhenInUseUsageDescription: "This app needs access to your location to show you on the map."
        }
      },
      android: {
        adaptiveIcon: {
          backgroundColor: "#E6F4FE",
        },
        package: "com.anonymous.Along"
      },
      web: {
        output: "static",
        bundler: "metro"
      },
      plugins: [
        "expo-router",
        [
          "expo-splash-screen",
          {
            image: "./assets/images/splash-icon.png",
            resizeMode: "cover",
            backgroundColor: "#ffffff",
            enableFullScreenImage_legacy: true
          }
        ],
        [
          "@rnmapbox/maps",
          {
            RNMAPBOX_MAPS_DOWNLOAD_TOKEN: process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN
          }
        ],
        "expo-sqlite",
        "@react-native-google-signin/google-signin"
      ],
      experiments: {
        typedRoutes: true,
        reactCompiler: true
      }
    }
  };
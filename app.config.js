/** @type {import('@expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  const mapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...(config.android?.config ?? {}),
        googleMaps: {
          apiKey: mapsKey,
        },
      },
    },
    ios: {
      ...config.ios,
      config: {
        ...(config.ios?.config ?? {}),
        googleMapsApiKey: mapsKey,
      },
    },
    plugins: [
      ...(config.plugins ?? []),
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "SmartBusApp uses your location to show where you are on the map during active trips.",
          locationAlwaysAndWhenInUsePermission:
            "SmartBusApp uses your location to show where you are on the map during active trips.",
        },
      ],
    ],
  };
};

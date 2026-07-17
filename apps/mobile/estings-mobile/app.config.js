const baseConfig = require('./app.json').expo;

module.exports = () => {
  return {
    ...baseConfig,
    android: { ...baseConfig.android },
    plugins: [
      ...(baseConfig.plugins ?? []),
      '@maplibre/maplibre-react-native',
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            "Allow Esting's to use your location only when you choose Use my location while pinning a delivery address.",
        },
      ],
    ],
  };
};

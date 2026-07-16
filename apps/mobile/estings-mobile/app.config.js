const baseConfig = require('./app.json').expo;

module.exports = () => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim();
  const android = { ...baseConfig.android };

  if (googleMapsApiKey) {
    android.config = {
      ...(android.config ?? {}),
      googleMaps: {
        apiKey: googleMapsApiKey,
      },
    };
  }

  return {
    ...baseConfig,
    android,
    plugins: [
      ...(baseConfig.plugins ?? []),
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

import * as WebBrowser from 'expo-web-browser';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

// Used when running this mobile project on web. Native custom-scheme callbacks are
// handled by +native-intent, before Expo Router opens a screen.
WebBrowser.maybeCompleteAuthSession();

export default function OAuthCallbackScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
      <Text>Completing sign-in. If this window stays open, return to the app and try again.</Text>
      <Link href="/login">Return to sign-in</Link>
    </View>
  );
}

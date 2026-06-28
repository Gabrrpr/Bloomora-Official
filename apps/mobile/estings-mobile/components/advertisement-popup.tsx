import * as Linking from 'expo-linking';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, theme } from '@/constants/theme';
import { getActiveAdvertisement, type ActiveAdvertisement } from '@/services/commerce-api';

let shownThisSession = false;

export function AdvertisementPopup() {
  const [advertisement, setAdvertisement] = useState<ActiveAdvertisement | null>(null);
  const ctaDestination = advertisement?.cta_destination?.trim();

  useEffect(() => {
    if (shownThisSession) return;
    let active = true;
    void getActiveAdvertisement()
      .then((ad) => {
        if (active && ad) {
          shownThisSession = true;
          setAdvertisement(ad);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleOpenAdvertisement = () => {
    if (!ctaDestination) return;
    setAdvertisement(null);
    if (/^https?:\/\//i.test(ctaDestination)) {
      void Linking.openURL(ctaDestination);
      return;
    }
    router.push((ctaDestination.startsWith('/') ? ctaDestination : `/${ctaDestination}`) as Href);
  };

  return (
    <Modal animationType="fade" onRequestClose={() => setAdvertisement(null)} transparent visible={Boolean(advertisement)}>
      <Pressable onPress={() => setAdvertisement(null)} style={styles.overlay}>
        <View style={styles.card}>
          <Pressable onPress={handleOpenAdvertisement} style={styles.imageButton}>
          <Pressable accessibilityLabel="Close advertisement" onPress={() => setAdvertisement(null)} style={styles.close}>
            <X color="#1F2A24" size={20} />
          </Pressable>
          {advertisement ? (
            <Image contentFit="cover" source={{ uri: advertisement.image_url }} style={styles.image} />
          ) : null}
          </Pressable>
          <Text style={styles.closeHint}>Tap anywhere to close.</Text>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.62)', flex: 1, justifyContent: 'center', padding: 20 },
  card: { alignItems: 'center', gap: 12, maxWidth: 620, width: '100%' },
  close: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, height: 38, justifyContent: 'center', position: 'absolute', right: 10, top: 10, width: 38, zIndex: 2 },
  closeHint: { color: theme.colors.white, fontFamily: Fonts.sansSemiBold, fontSize: 13, textAlign: 'center' },
  image: { aspectRatio: 1.2, width: '100%' },
  imageButton: { borderRadius: 18, overflow: 'hidden', width: '100%' },
});

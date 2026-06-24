import * as Linking from 'expo-linking';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';

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
        <Pressable onPress={handleOpenAdvertisement} style={styles.card}>
          <Pressable accessibilityLabel="Close advertisement" onPress={() => setAdvertisement(null)} style={styles.close}>
            <X color={theme.colors.text} size={20} />
          </Pressable>
          {advertisement ? (
            <>
              <Image contentFit="contain" source={{ uri: advertisement.image_url }} style={styles.image} />
              <Text style={styles.title}>{advertisement.title}</Text>
              {ctaDestination ? <Text style={styles.ctaText}>Open offer</Text> : null}
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.62)', flex: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 18, maxWidth: 620, overflow: 'hidden', paddingBottom: 12, width: '100%' },
  close: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, height: 38, justifyContent: 'center', position: 'absolute', right: 10, top: 10, width: 38, zIndex: 2 },
  ctaText: { color: theme.colors.primary, fontFamily: Fonts.sansBold, fontSize: 13, paddingTop: 8, textAlign: 'center' },
  image: { aspectRatio: 1.2, backgroundColor: '#fff', width: '100%' },
  title: { color: theme.colors.text, fontFamily: Fonts.sansSemiBold, fontSize: 14, paddingHorizontal: 16, paddingTop: 10, textAlign: 'center' },
});

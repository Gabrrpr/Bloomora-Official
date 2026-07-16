import { Image } from 'expo-image';
import { Flower2 } from 'lucide-react-native';
import { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { AI_EASE_OUT, AI_MOTION } from '@/components/ai-arrangement-motion';
import { Fonts, theme } from '@/constants/theme';

export type RecipeGalleryItem = {
  id: string;
  imageUrl?: string | null;
  label: string;
  quantity: number;
};

export const RecipeGallery = memo(function RecipeGallery({ items }: { items: RecipeGalleryItem[] }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: reduceMotion ? 90 : AI_MOTION.contentEntrance,
      easing: AI_EASE_OUT,
    });
  }, [progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: reduceMotion ? 0 : interpolate(progress.value, [0, 1], [6, 0]) }],
  }));

  if (!items.length) return null;

  return (
    <Animated.View accessibilityLabel={`${items.length} recipe materials`} style={[styles.grid, animatedStyle]}>
      {items.map((item) => (
        <View key={item.id} style={styles.tile}>
          {item.imageUrl ? (
            <Image accessibilityLabel={item.label} contentFit="cover" source={{ uri: item.imageUrl }} style={styles.image} />
          ) : (
            <View style={styles.imageFallback}>
              <Flower2 color={theme.colors.primary} size={24} strokeWidth={1.8} />
            </View>
          )}
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>{item.quantity}x</Text>
          </View>
          <Text numberOfLines={2} style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, paddingBottom: 12 },
  tile: { minWidth: 0, position: 'relative', width: '31%' },
  image: { aspectRatio: 1, backgroundColor: theme.colors.surfaceAlt, borderRadius: 12, width: '100%' },
  imageFallback: { alignItems: 'center', aspectRatio: 1, backgroundColor: theme.colors.greenSoft, borderRadius: 12, justifyContent: 'center', width: '100%' },
  quantityBadge: { backgroundColor: 'rgba(31,42,36,0.78)', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4, position: 'absolute', right: 6, top: 6 },
  quantityText: { color: theme.colors.white, fontFamily: Fonts.sansBold, fontSize: 9 },
  label: { color: theme.colors.text, fontFamily: Fonts.sansMedium, fontSize: 10, lineHeight: 14, paddingHorizontal: 2, paddingTop: 6 },
});

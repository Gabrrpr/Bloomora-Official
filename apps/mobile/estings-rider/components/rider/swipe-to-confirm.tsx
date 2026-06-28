import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';

import { Fonts, theme } from '@/constants/theme';

const TRACK_PADDING = 4;
const THUMB_SIZE = 52;

export function SwipeToConfirm({
  disabled = false,
  label,
  onConfirm,
  sublabel,
}: {
  disabled?: boolean;
  label: string;
  onConfirm: () => void;
  sublabel?: string;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const confirmedRef = useRef(false);

  const maxSlide = trackWidth - THUMB_SIZE - TRACK_PADDING * 2;

  // Reset when disabled changes back to false (e.g. new delivery loaded)
  useEffect(() => {
    if (!disabled && confirmed) {
      setConfirmed(false);
      confirmedRef.current = false;
      translateX.setValue(0);
      Animated.timing(opacity, { duration: 180, toValue: 1, useNativeDriver: true }).start();
    }
  }, [confirmed, disabled, opacity, translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 5,
      onPanResponderGrant: () => {
        if (disabled || confirmedRef.current) return;
      },
      onPanResponderMove: (_, gestureState) => {
        if (disabled || confirmedRef.current) return;
        const clamped = Math.max(0, Math.min(gestureState.dx, maxSlide));
        translateX.setValue(clamped);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (disabled || confirmedRef.current) return;

        if (gestureState.dx >= maxSlide * 0.85) {
          // Snap to end, confirm
          Animated.spring(translateX, {
            friction: 8,
            tension: 120,
            toValue: maxSlide,
            useNativeDriver: true,
          }).start(async () => {
            if (!confirmedRef.current) {
              confirmedRef.current = true;
              setConfirmed(true);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onConfirm();
            }
          });
        } else {
          // Snap back
          Animated.spring(translateX, {
            friction: 8,
            tension: 120,
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  // Text opacity fades as thumb moves right
  const textOpacity = trackWidth > 0
    ? translateX.interpolate({ extrapolate: 'clamp', inputRange: [0, maxSlide * 0.5], outputRange: [1, 0] })
    : opacity;

  return (
    <View
      style={[styles.track, disabled && styles.trackDisabled]}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}>

      {/* Label */}
      <Animated.Text style={[styles.label, { opacity: textOpacity }]}>
        {confirmed ? 'Confirmed!' : label}
      </Animated.Text>

      {sublabel && !confirmed ? (
        <Animated.Text style={[styles.sublabel, { opacity: textOpacity }]}>{sublabel}</Animated.Text>
      ) : null}

      {/* Arrow trail */}
      <Animated.View style={[styles.arrowTrail, { opacity: textOpacity }]}>
        {[0, 1, 2].map((i) => (
          <Feather key={i} color="rgba(48,141,54,0.25)" name="chevron-right" size={16} />
        ))}
      </Animated.View>

      {/* Thumb */}
      <Animated.View
        {...(disabled ? {} : panResponder.panHandlers)}
        style={[
          styles.thumb,
          confirmed && styles.thumbConfirmed,
          { transform: [{ translateX }] },
        ]}>
        <Feather
          color={theme.colors.white}
          name={confirmed ? 'check' : 'chevron-right'}
          size={22}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  arrowTrail: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: THUMB_SIZE + TRACK_PADDING * 2 + 4,
    position: 'absolute',
    right: 0,
    width: '60%',
  },
  label: {
    color: theme.colors.white,
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  sublabel: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: Fonts.sans,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  thumb: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: THUMB_SIZE / 2,
    bottom: TRACK_PADDING,
    height: THUMB_SIZE,
    justifyContent: 'center',
    left: TRACK_PADDING,
    position: 'absolute',
    width: THUMB_SIZE,
  },
  thumbConfirmed: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  track: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: (THUMB_SIZE + TRACK_PADDING * 2) / 2,
    height: THUMB_SIZE + TRACK_PADDING * 2,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingLeft: THUMB_SIZE + TRACK_PADDING * 2 + theme.spacing.sm,
    paddingRight: TRACK_PADDING + theme.spacing.md,
  },
  trackDisabled: {
    backgroundColor: '#BBDDC0',
  },
});

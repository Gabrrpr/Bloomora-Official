import { Image } from 'expo-image';
import { router, usePathname } from 'expo-router';
import { MessageCircle, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/constants/theme';
import { createChatSession, getChatHistory, getChatWebSocketUrl, type BackendChatMessage } from '@/services/chat-api';
import { getAuthSession, type AuthSession } from '@/services/auth-session';

const supportAvatarImage = require('@/assets/images/estings-logo.svg');
const bubbleSize = 58;
const sideInset = 14;
const removeTargetSize = 68;
const tapSlop = 5;
const previewVisibleMs = 5600;
const removeDropDistance = removeTargetSize * 0.82;
const removeMagnetDistance = 148;

type BubblePosition = {
  x: number;
  y: number;
};

export function ChatFloatingBubble() {
  const pathname = usePathname();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pan = useRef(new Animated.ValueXY()).current;
  const headAnim = useRef(new Animated.Value(0)).current;
  const previewAnim = useRef(new Animated.Value(0)).current;
  const removeTargetAnim = useRef(new Animated.Value(0)).current;
  const positionRef = useRef<BubblePosition>({ x: width - bubbleSize - sideInset, y: height * 0.66 });
  const wsRef = useRef<WebSocket | null>(null);
  const previewHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartRef = useRef<BubblePosition>({ x: width - bubbleSize - sideInset, y: height * 0.66 });
  const currentPanPositionRef = useRef<BubblePosition>({ x: width - bubbleSize - sideInset, y: height * 0.66 });
  const lastStaffMessageIdRef = useRef<string | null>(null);
  const [chatSession, setChatSession] = useState<{ session: AuthSession; userId: string } | null>(null);
  const [isHidden, setIsHidden] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestPreview, setLatestPreview] = useState('');
  const [isSnappedLeft, setIsSnappedLeft] = useState(false);
  const [isOverRemoveTarget, setIsOverRemoveTarget] = useState(false);

  const isLiveChatRoute = pathname.includes('/live-chat');
  const shouldMount = Boolean(chatSession) && !isLiveChatRoute;
  const previewMaxWidth = Math.min(238, width - bubbleSize - sideInset * 2 - 24);
  const previewBubbleWidth = Math.min(
    previewMaxWidth,
    Math.max(96, latestPreview.length * 6.8 + theme.spacing.md * 2),
  );

  const bounds = useMemo(
    () => ({
      maxX: width - bubbleSize - sideInset,
      maxY: height - bubbleSize - insets.bottom - 92,
      minX: sideInset,
      minY: insets.top + 72,
    }),
    [height, insets.bottom, insets.top, width],
  );

  const removeTarget = useMemo(
    () => {
      const left = width / 2 - removeTargetSize / 2;
      const top = height - insets.bottom - 42 - removeTargetSize;

      return {
        centerX: left + removeTargetSize / 2,
        centerY: top + removeTargetSize / 2,
        left,
        top,
      };
    },
    [height, insets.bottom, width],
  );

  const hidePreviewBubble = useCallback(
    (immediate = false) => {
      if (previewHideTimerRef.current) {
        clearTimeout(previewHideTimerRef.current);
        previewHideTimerRef.current = null;
      }

      if (immediate) {
        previewAnim.setValue(0);
        return;
      }

      Animated.timing(previewAnim, {
        duration: 180,
        toValue: 0,
        useNativeDriver: true,
      }).start();
    },
    [previewAnim],
  );

  const showPreviewBubble = useCallback(() => {
    if (previewHideTimerRef.current) {
      clearTimeout(previewHideTimerRef.current);
    }

    Animated.spring(previewAnim, {
      damping: 14,
      mass: 0.7,
      stiffness: 160,
      toValue: 1,
      useNativeDriver: true,
    }).start();

    previewHideTimerRef.current = setTimeout(() => {
      hidePreviewBubble();
    }, previewVisibleMs);
  }, [hidePreviewBubble, previewAnim]);

  const openChat = useCallback(() => {
    setUnreadCount(0);
    hidePreviewBubble(true);
    setLatestPreview('');
    router.push('/live-chat');
  }, [hidePreviewBubble]);

  useEffect(() => {
    const nextPosition = clampPosition(positionRef.current, bounds);
    positionRef.current = nextPosition;
    currentPanPositionRef.current = nextPosition;
    setIsSnappedLeft(nextPosition.x + bubbleSize / 2 < width / 2);
    pan.setValue(nextPosition);
  }, [bounds, pan, width]);

  useEffect(() => {
    const listenerId = pan.addListener((value) => {
      currentPanPositionRef.current = {
        x: value.x,
        y: value.y,
      };
    });

    return () => {
      pan.removeListener(listenerId);
    };
  }, [pan]);

  useEffect(() => {
    Animated.spring(headAnim, {
      damping: 12,
      mass: 0.8,
      stiffness: 150,
      toValue: shouldMount && !isHidden ? 1 : 0,
      useNativeDriver: false,
    }).start();
  }, [headAnim, isHidden, shouldMount]);

  useEffect(() => {
    Animated.spring(removeTargetAnim, {
      damping: 14,
      mass: 0.75,
      stiffness: 170,
      toValue: isDragging ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [isDragging, removeTargetAnim]);

  useEffect(() => {
    return () => {
      if (previewHideTimerRef.current) {
        clearTimeout(previewHideTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    getAuthSession()
      .then(async (session) => {
        if (!isMounted || !session) {
          return;
        }

        const chat = await createChatSession({ session });

        if (isMounted) {
          setChatSession({ session, userId: chat.id });
          getChatHistory({ session, userId: chat.id })
            .then((history) => {
              const latestStaffMessage = [...history]
                .reverse()
                .find((message) => message.sender !== 'customer');
              lastStaffMessageIdRef.current = latestStaffMessage?.id ?? null;
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        if (isMounted) {
          setChatSession(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!chatSession || isLiveChatRoute) {
      wsRef.current?.close();
      wsRef.current = null;
      return;
    }

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isActive = true;

    const showIncomingMessage = (payload: Partial<BackendChatMessage>) => {
      if (!payload.id || payload.sender === 'customer' || payload.id === lastStaffMessageIdRef.current) {
        return;
      }

      lastStaffMessageIdRef.current = payload.id;
      setUnreadCount((current) => Math.min(current + 1, 99));
      setLatestPreview(getMessagePreview(payload));
      setIsHidden(false);
      showPreviewBubble();
    };

    const connect = () => {
      if (!isActive) {
        return;
      }

      const websocket = new WebSocket(getChatWebSocketUrl(chatSession));
      wsRef.current = websocket;

      websocket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as Partial<BackendChatMessage>;
          showIncomingMessage(payload);
        } catch {
          // Ignore malformed chat payloads.
        }
      };

      websocket.onclose = () => {
        if (wsRef.current === websocket) {
          wsRef.current = null;
        }

        if (isActive) {
          reconnectTimer = setTimeout(connect, 2500);
        }
      };
    };

    connect();

    const pollTimer = setInterval(() => {
      getChatHistory({ session: chatSession.session, userId: chatSession.userId })
        .then((history) => {
          const staffMessages = history.filter((message) => message.sender !== 'customer');
          const lastSeenIndex = staffMessages.findIndex((message) => message.id === lastStaffMessageIdRef.current);
          const missedMessages = lastSeenIndex >= 0 ? staffMessages.slice(lastSeenIndex + 1) : staffMessages.slice(-1);

          missedMessages.forEach(showIncomingMessage);
        })
        .catch(() => {});
    }, 12000);

    return () => {
      isActive = false;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      clearInterval(pollTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [chatSession, isLiveChatRoute, showPreviewBubble]);

  useEffect(() => {
    if (isLiveChatRoute) {
      setUnreadCount(0);
      setLatestPreview('');
      setIsDragging(false);

      if (chatSession) {
        getChatHistory({ session: chatSession.session, userId: chatSession.userId })
          .then((history) => {
            const latestStaffMessage = [...history]
              .reverse()
              .find((message) => message.sender !== 'customer');
            lastStaffMessageIdRef.current = latestStaffMessage?.id ?? lastStaffMessageIdRef.current;
          })
          .catch(() => {});
      }
    }
  }, [chatSession, isLiveChatRoute]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          setIsDragging(true);
          setIsOverRemoveTarget(false);
          pan.stopAnimation();
          dragStartRef.current = clampPosition(currentPanPositionRef.current, bounds);
          positionRef.current = dragStartRef.current;
          pan.setValue(dragStartRef.current);
        },
        onPanResponderMove: (_, gesture) => {
          const rawPosition = clampPosition(
            {
              x: dragStartRef.current.x + gesture.dx,
              y: dragStartRef.current.y + gesture.dy,
            },
            bounds,
          );
          const magnetizedPosition = magnetizeToRemoveTarget(rawPosition, removeTarget);
          const bubbleCenter = getBubbleCenter(magnetizedPosition);
          const distanceFromRemove = Math.hypot(
            bubbleCenter.x - removeTarget.centerX,
            bubbleCenter.y - removeTarget.centerY,
          );

          const isInRemoveZone = distanceFromRemove < removeDropDistance;
          const nextPosition = isInRemoveZone ? getRemoveTargetBubblePosition(removeTarget) : magnetizedPosition;

          setIsOverRemoveTarget(isInRemoveZone);
          positionRef.current = nextPosition;
          pan.setValue(nextPosition);
        },
        onPanResponderRelease: (_, gesture) => {
          const didTap = Math.abs(gesture.dx) <= tapSlop && Math.abs(gesture.dy) <= tapSlop;

          if (didTap) {
            setIsDragging(false);
            setIsOverRemoveTarget(false);
            openChat();
            return;
          }

          const nextPosition = clampPosition(positionRef.current, bounds);
          const bubbleCenter = getBubbleCenter(nextPosition);
          const distanceFromRemove = Math.hypot(
            bubbleCenter.x - removeTarget.centerX,
            bubbleCenter.y - removeTarget.centerY,
          );

          if (distanceFromRemove < removeDropDistance) {
            setIsHidden(true);
            setIsDragging(false);
            setIsOverRemoveTarget(false);
            positionRef.current = nextPosition;
            pan.setValue(nextPosition);
            return;
          }

          const snappedPosition = snapToSide(nextPosition, bounds, width);
          positionRef.current = snappedPosition;
          setIsSnappedLeft(snappedPosition.x + bubbleSize / 2 < width / 2);
          setIsDragging(false);
          setIsOverRemoveTarget(false);
          Animated.spring(pan, {
            friction: 8,
            tension: 90,
            toValue: snappedPosition,
            useNativeDriver: false,
          }).start();
        },
        onPanResponderTerminate: () => {
          setIsDragging(false);
          setIsOverRemoveTarget(false);
          const snappedPosition = snapToSide(clampPosition(positionRef.current, bounds), bounds, width);
          positionRef.current = snappedPosition;
          Animated.spring(pan, {
            friction: 8,
            tension: 90,
            toValue: snappedPosition,
            useNativeDriver: false,
          }).start();
        },
      }),
    [bounds, openChat, pan, removeTarget, width],
  );

  if (!shouldMount) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View
          pointerEvents="none"
          style={[
            styles.removeTarget,
            isOverRemoveTarget && styles.removeTargetReady,
            {
              left: removeTarget.left,
              top: removeTarget.top,
              opacity: removeTargetAnim,
              transform: [
                {
                  translateY: removeTargetAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [28, 0],
                  }),
                },
                {
                  scale: removeTargetAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.88, isOverRemoveTarget ? 1.08 : 1],
                  }),
                },
              ],
            },
            styles.removeTargetActive,
          ]}>
          <X size={28} color={theme.colors.textMuted} strokeWidth={2.4} />
        </Animated.View>

      <Animated.View
        {...responder.panHandlers}
        pointerEvents={isHidden ? 'none' : 'auto'}
        style={[
          styles.bubbleWrap,
          isOverRemoveTarget && styles.bubbleWrapRemoveReady,
          {
            opacity: headAnim,
            transform: [
              ...pan.getTranslateTransform(),
              {
                scale: headAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.78, 1],
                }),
              },
            ],
          },
          isDragging && styles.bubbleWrapEditing,
        ]}>
        {unreadCount > 0 && latestPreview ? (
          <Animated.View
            style={[
              styles.messagePreview,
              isSnappedLeft ? styles.messagePreviewLeft : styles.messagePreviewRight,
              { maxWidth: previewMaxWidth, width: previewBubbleWidth },
              {
                opacity: previewAnim,
                transform: [
                  {
                    translateX: previewAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [isSnappedLeft ? -8 : 8, 0],
                    }),
                  },
                  {
                    scale: previewAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.96, 1],
                    }),
                  },
                ],
              },
            ]}
            pointerEvents="none">
            <Text numberOfLines={2} style={styles.messagePreviewText}>{latestPreview}</Text>
            <View
              style={[
                styles.messagePreviewTail,
                isSnappedLeft ? styles.messagePreviewTailLeft : styles.messagePreviewTailRight,
              ]}
            />
          </Animated.View>
        ) : null}
        <Pressable
          accessibilityLabel="Open Esting's chat heads"
          accessibilityRole="button"
          style={({ pressed }) => [styles.bubble, pressed && styles.bubblePressed]}
          onPress={undefined}>
          <Image source={supportAvatarImage} style={styles.bubbleImage} contentFit="cover" />
          <View style={styles.bubbleIcon}>
            <MessageCircle size={12} color={theme.colors.white} strokeWidth={2.35} />
          </View>
          {unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </Animated.View>
    </View>
  );
}

function getMessagePreview(message: Partial<BackendChatMessage>) {
  const text = message.message?.trim() || (message.image_url ? 'sent an image.' : 'New message');
  return text.length > 42 ? `${text.slice(0, 39).trimEnd()}...` : text;
}

function getBubbleCenter(position: BubblePosition) {
  return {
    x: position.x + bubbleSize / 2,
    y: position.y + bubbleSize / 2,
  };
}

function magnetizeToRemoveTarget(
  position: BubblePosition,
  removeTarget: { centerX: number; centerY: number },
) {
  const targetPosition = getRemoveTargetBubblePosition(removeTarget);
  const bubbleCenter = getBubbleCenter(position);
  const distance = Math.hypot(bubbleCenter.x - removeTarget.centerX, bubbleCenter.y - removeTarget.centerY);

  if (distance > removeMagnetDistance) {
    return position;
  }

  const pullStrength = Math.min(0.48, ((removeMagnetDistance - distance) / removeMagnetDistance) * 0.72);

  return {
    x: position.x + (targetPosition.x - position.x) * pullStrength,
    y: position.y + (targetPosition.y - position.y) * pullStrength,
  };
}

function getRemoveTargetBubblePosition(removeTarget: { centerX: number; centerY: number }) {
  return {
    x: removeTarget.centerX - bubbleSize / 2,
    y: removeTarget.centerY - bubbleSize / 2,
  };
}

function clampPosition(position: BubblePosition, bounds: { maxX: number; maxY: number; minX: number; minY: number }) {
  return {
    x: Math.min(Math.max(position.x, bounds.minX), bounds.maxX),
    y: Math.min(Math.max(position.y, bounds.minY), bounds.maxY),
  };
}

function snapToSide(
  position: BubblePosition,
  bounds: { maxX: number; maxY: number; minX: number; minY: number },
  width: number,
) {
  return clampPosition(
    {
      x: position.x + bubbleSize / 2 < width / 2 ? bounds.minX : bounds.maxX,
      y: position.y,
    },
    bounds,
  );
}

const styles = StyleSheet.create({
  bubbleWrap: {
    height: bubbleSize,
    position: 'absolute',
    width: bubbleSize,
    zIndex: 100,
  },
  bubbleWrapEditing: {
    opacity: 0.96,
  },
  bubbleWrapRemoveReady: {
    opacity: 0.62,
  },
  messagePreview: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    borderRadius: 7,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 7,
    position: 'absolute',
    top: 10,
  },
  messagePreviewLeft: {
    left: bubbleSize + 12,
  },
  messagePreviewRight: {
    right: bubbleSize + 12,
  },
  messagePreviewText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 17,
    textAlign: 'left',
  },
  messagePreviewTail: {
    backgroundColor: theme.colors.primary,
    height: 16,
    position: 'absolute',
    top: 10,
    transform: [{ rotate: '45deg' }],
    width: 16,
  },
  messagePreviewTailLeft: {
    left: -6,
  },
  messagePreviewTailRight: {
    right: -6,
  },
  bubble: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(46, 139, 52, 0.18)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: bubbleSize,
    justifyContent: 'center',
    shadowColor: '#1F2A24',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    width: bubbleSize,
  },
  bubblePressed: {
    transform: [{ scale: 0.96 }],
  },
  bubbleImage: {
    borderRadius: theme.radius.pill,
    height: 48,
    width: 48,
  },
  bubbleIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.white,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    bottom: 1,
    height: 19,
    justifyContent: 'center',
    position: 'absolute',
    right: 1,
    width: 19,
  },
  unreadBadge: {
    alignItems: 'center',
    backgroundColor: '#E53935',
    borderColor: theme.colors.white,
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    height: 23,
    justifyContent: 'center',
    minWidth: 23,
    paddingHorizontal: 5,
    position: 'absolute',
    right: -6,
    top: -6,
  },
  unreadText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
  removeTarget: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderColor: 'rgba(31, 42, 36, 0.12)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: removeTargetSize,
    justifyContent: 'center',
    position: 'absolute',
    width: removeTargetSize,
    zIndex: 90,
  },
  removeTargetActive: {
    backgroundColor: 'rgba(238, 241, 238, 0.96)',
  },
  removeTargetReady: {
    backgroundColor: theme.colors.white,
    borderColor: 'rgba(31, 42, 36, 0.22)',
  },
});

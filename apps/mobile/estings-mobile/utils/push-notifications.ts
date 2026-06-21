import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushRegistrationResult =
  | {
      status: 'granted';
      token: string;
    }
  | {
      status: 'denied' | 'unavailable';
      token: null;
      reason: string;
    };

let hasScheduledAppOpenCreateReminder = false;

function getProjectId() {
  return (
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    null
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to get Expo push token.';
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

export async function configureAndroidNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2E8B34',
  });
}

export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  try {
    if (Platform.OS === 'web') {
      return {
        status: 'unavailable',
        token: null,
        reason: 'Push notifications are only available on iOS and Android.',
      };
    }

    await configureAndroidNotificationChannel();

    const projectId = getProjectId();
    if (!projectId) {
      return {
        status: 'unavailable',
        token: null,
        reason: 'Missing EAS project ID in app config.',
      };
    }

    const existingPermission = await Notifications.getPermissionsAsync();
    let finalStatus = existingPermission.status;

    if (existingPermission.status !== 'granted') {
      const requestedPermission = await Notifications.requestPermissionsAsync();
      finalStatus = requestedPermission.status;
    }

    if (finalStatus !== 'granted') {
      return {
        status: 'denied',
        token: null,
        reason: 'Notification permission was not granted.',
      };
    }

    const token = await withTimeout(
      Notifications.getExpoPushTokenAsync({ projectId }),
      15000,
      'Getting the Expo push token timed out. Check internet connection and EAS notification credentials.',
    );

    return {
      status: 'granted',
      token: token.data,
    };
  } catch (error) {
    return {
      status: 'unavailable',
      token: null,
      reason: getErrorMessage(error),
    };
  }
}

export async function showLocalChatNotification({
  body,
  conversationId,
  messageId,
  title = "Esting's Support",
}: {
  body: string;
  conversationId?: string;
  messageId?: string;
  title?: string;
}) {
  if (Platform.OS === 'web') {
    return false;
  }

  await configureAndroidNotificationChannel();

  const existingPermission = await Notifications.getPermissionsAsync();
  let finalStatus = existingPermission.status;

  if (existingPermission.status !== 'granted') {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermission.status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      body,
      data: {
        conversationId,
        messageId,
        route: '/live-chat',
      },
      sound: true,
      title,
    },
    trigger: null,
  });

  return true;
}

export async function scheduleAppOpenCreateReminder() {
  if (hasScheduledAppOpenCreateReminder || Platform.OS === 'web') {
    return false;
  }

  await configureAndroidNotificationChannel();

  const existingPermission = await Notifications.getPermissionsAsync();
  let finalStatus = existingPermission.status;

  if (existingPermission.status !== 'granted') {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermission.status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  hasScheduledAppOpenCreateReminder = true;

  await Notifications.scheduleNotificationAsync({
    content: {
      body: 'Describe your dream arrangement or build one with Mix & Match.',
      data: {
        route: '/(tabs)/generate',
      },
      sound: true,
      title: 'Make it personal',
    },
    trigger: {
      seconds: 60,
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    },
  });

  return true;
}

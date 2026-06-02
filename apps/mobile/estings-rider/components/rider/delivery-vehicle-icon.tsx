import { Image } from 'expo-image';

import { theme } from '@/constants/theme';

const deliveryVehicleIcon = require('@/assets/images/rider/delivery-vehicle.svg');

export function DeliveryVehicleIcon({
  color = theme.colors.primary,
  height = 58,
  width = 80,
}: {
  color?: string;
  height?: number;
  width?: number;
}) {
  return (
    <Image
      contentFit="contain"
      source={deliveryVehicleIcon}
      style={{ height, width }}
      tintColor={color}
    />
  );
}

import type { ImageSourcePropType } from 'react-native';

export type OccasionAsset = {
  description: string;
  image: ImageSourcePropType;
  label: string;
};

export const occasionAssets: OccasionAsset[] = [
  {
    description: 'Bright arrangements for celebrations and cheerful surprises.',
    image: require('../assets/images/occasions/Birthday.png'),
    label: 'Birthdays',
  },
  {
    description: 'Romantic blooms for milestones, dates, and years together.',
    image: require('../assets/images/occasions/Anniversary.png'),
    label: 'Anniversaries',
  },
  {
    description: 'Fresh flowers for proud moments and new beginnings.',
    image: require('../assets/images/occasions/Graduation.png'),
    label: 'Graduations',
  },
  {
    description: 'Quiet, thoughtful arrangements for comfort and care.',
    image: require('../assets/images/occasions/Sympathy.png'),
    label: 'Sympathy',
  },
  {
    description: 'Welcoming flowers for launches, blessings, and openings.',
    image: require('../assets/images/occasions/Openings.png'),
    label: 'Openings',
  },
  {
    description: 'Gentle picks to help someone feel remembered and cared for.',
    image: require('../assets/images/occasions/GetWellSoon.png'),
    label: 'Get Well Soon',
  },
  {
    description: 'Everyday flowers for small gestures and sweet surprises.',
    image: require('../assets/images/occasions/JustBecause.png'),
    label: 'Just Because',
  },
  {
    description: 'Elegant arrangements for ceremonies and wedding days.',
    image: require('../assets/images/occasions/Wedding.png'),
    label: 'Weddings',
  },
];

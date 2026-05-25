import { customDirectEventTypes } from 'react-native/Libraries/Renderer/shims/ReactNativeViewConfigRegistry';

customDirectEventTypes.topSvgLayout ??= {
  registrationName: 'onLayout',
};

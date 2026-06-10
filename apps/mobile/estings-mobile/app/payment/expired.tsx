import { Clock3 } from 'lucide-react-native';

import { PaymentResultScreen } from '@/components/payment-result-screen';
import { theme } from '@/constants/theme';

export default function PaymentExpiredScreen() {
  return (
    <PaymentResultScreen
      body="The payment window or payment method expired before payment was completed. Create a new checkout session from your cart to continue."
      icon={Clock3}
      iconColor={theme.colors.primary}
      title="Payment expired"
    />
  );
}

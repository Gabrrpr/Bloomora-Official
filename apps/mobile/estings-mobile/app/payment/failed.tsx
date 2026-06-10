import { AlertTriangle } from 'lucide-react-native';

import { PaymentResultScreen } from '@/components/payment-result-screen';
import { theme } from '@/constants/theme';

export default function PaymentFailedScreen() {
  return (
    <PaymentResultScreen
      body="PayMongo returned a failed payment attempt. No payment was marked as paid, so you can return to your cart and try another payment method."
      icon={AlertTriangle}
      iconColor={theme.colors.danger}
      title="Payment failed"
    />
  );
}

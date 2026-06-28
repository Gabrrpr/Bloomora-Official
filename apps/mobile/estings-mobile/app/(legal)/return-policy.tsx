import { Redirect } from 'expo-router';

export default function ReturnPolicyRedirect() {
  return <Redirect href={{ pathname: '/help-center/[slug]', params: { slug: 'ordering' } }} />;
}

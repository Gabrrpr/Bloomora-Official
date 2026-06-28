import { Redirect } from 'expo-router';

export default function FaqRedirect() {
  return <Redirect href={{ pathname: '/help-center/[slug]', params: { slug: 'faq' } }} />;
}

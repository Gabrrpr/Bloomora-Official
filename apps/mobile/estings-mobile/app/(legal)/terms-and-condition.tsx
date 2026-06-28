import { Redirect } from 'expo-router';

export default function TermsRedirect() {
  return <Redirect href={{ pathname: '/help-center/[slug]', params: { slug: 'terms' } }} />;
}

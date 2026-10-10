import { useLocalSearchParams } from 'expo-router';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function BadgeEarnedScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <PlaceholderScreen name={`Badge: ${slug}`} />;
}

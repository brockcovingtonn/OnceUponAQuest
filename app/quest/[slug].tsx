import { useLocalSearchParams } from 'expo-router';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function QuestDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return (
    <PlaceholderScreen
      name={`Quest: ${slug}`}
      links={[{ label: 'Open a sample spot', href: '/spot/sample-spot' }]}
    />
  );
}

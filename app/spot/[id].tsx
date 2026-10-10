import { useLocalSearchParams } from 'expo-router';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function SpotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <PlaceholderScreen
      name={`Spot: ${id}`}
      links={[{ label: 'Preview badge earned', href: '/badge/sample-badge' }]}
    />
  );
}

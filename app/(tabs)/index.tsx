import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function QuestsScreen() {
  return (
    <PlaceholderScreen
      name="Quests"
      links={[{ label: 'Open a sample quest', href: '/quest/sample-quest' }]}
    />
  );
}

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function ProfileScreen() {
  return (
    <PlaceholderScreen
      name="Profile"
      links={[
        { label: 'Preview sign-in screen', href: '/sign-in' },
        { label: 'Preview onboarding', href: '/onboarding' },
      ]}
      showDisclaimer
    />
  );
}

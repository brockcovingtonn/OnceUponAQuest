/**
 * All user-facing copy lives here so it can be reviewed in one place.
 */
export const copy = {
  appName: 'Once Upon a Quest',
  tagline: 'Find the stories hiding in plain sight.',

  disclaimer:
    'Once Upon a Quest is an independent fan app. It is not affiliated with, endorsed by, or sponsored by The Walt Disney Company or its affiliates. All park names are used only to describe locations.',

  tabs: {
    quests: 'Quests',
    passport: 'Passport',
    friends: 'Friends',
    profile: 'Profile',
  },

  common: {
    networkError: "We couldn't reach the server. Check your connection and try again.",
    somethingWrong: 'Something went wrong. Please try again.',
    retry: 'Try again',
    back: 'Back',
    signOut: 'Sign out',
  },

  signIn: {
    logoLabel: 'Once Upon a Quest logo: an open storybook with a star',
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    invalidEmail: 'Enter a valid email address.',
    sendCode: 'Send my code',
    codeSentTo: (email: string) => `We sent a 6-digit code to ${email}.`,
    codeLabel: 'Enter the 6-digit code',
    codeAccessibilityLabel: '6-digit sign-in code',
    signIn: 'Sign in',
    wrongCode: "That code didn't work. Try again.",
    resendIn: (seconds: number) =>
      `Resend code in ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`,
    resend: 'Resend code',
    codeResent: 'A new code is on its way.',
    rateLimited: 'Too many codes requested. Wait a minute, then try again.',
    useDifferentEmail: 'Use a different email',
  },

  onboarding: {
    stepOf: (step: number, total: number) => `Step ${step} of ${total}`,

    usernameTitle: 'Pick your explorer name',
    usernameLabel: 'Explorer name',
    usernamePlaceholder: 'lampLighter',
    usernameRules: '3–24 letters, numbers or underscores.',
    usernameChecking: 'Checking…',
    usernameAvailable: 'Available',
    usernameTaken: 'That name is taken. Try another.',
    usernameInvalid: 'Use 3–24 letters, numbers or underscores.',
    usernameJustTaken: 'That name was just taken. Pick another.',
    avatarTitle: 'Choose a stamp avatar',
    next: 'Next',

    rulesTitle: 'Three quest rules',
    rules: [
      { icon: 'walk-outline', text: 'Walk, never run.' },
      {
        icon: 'hand-left-outline',
        text: 'Stay on sidewalks — never stand in the street or block a doorway.',
      },
      { icon: 'sparkles-outline', text: 'Turn on Parade mode during parades and fireworks.' },
    ],
    rulesNext: 'Got it, next',

    finalTitle: 'One more thing',
    ageConfirm: "I'm 13 or older",
    termsPrefix: 'I agree to the ',
    terms: 'Terms',
    termsAnd: ' and ',
    privacy: 'Privacy Policy',
    under13: "I'm under 13",
    start: 'Start exploring',
  },

  tooYoung: {
    title: 'Thanks for stopping by!',
    body: "Once Upon a Quest is for explorers 13 and older. We didn't save your account or any of your details. We hope to see you when you're a little older!",
    done: 'Back to start',
  },

  legal: {
    termsTitle: 'Terms of Service',
    privacyTitle: 'Privacy Policy',
    comingSoon: 'The full text will be published here before launch.',
  },

  paradeMode: {
    label: 'Parade mode',
    hint: 'Pauses spots that sit on the parade route.',
    banner: 'Paused during parades and fireworks — check back after.',
    paused: 'Paused',
  },

  quests: {
    greeting: (hour: number, username: string) =>
      `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, ${username}`,
    spotsAndTime: (spots: number, minutes: number) =>
      `${spots} ${spots === 1 ? 'spot' : 'spots'} · ~${minutes} min`,
    foundOf: (found: number, total: number) => `${found}/${total} found`,
    start: 'Start',
    continue: 'Continue',
    badgeEarned: 'Badge',
    moreLands: 'More lands coming soon ✦',
    empty: 'No quests here yet.',
    loadError: "We couldn't load quests. Check your connection and try again.",
    statusNotStarted: (spots: number, minutes: number) =>
      `${spots} spots, about ${minutes} minutes. Not started.`,
    statusInProgress: (found: number, total: number) => `${found} of ${total} spots found.`,
    statusComplete: 'Complete. Badge earned.',
  },

  questDetail: {
    progress: (found: number, total: number) => `${found} of ${total}`,
    minutes: (minutes: number) => `~${minutes} min`,
    badgeForFinishing: 'Badge for finishing',
    badgeEarned: 'Badge earned!',
    notFound: "We couldn't find that quest.",
    loadError: "We couldn't load this quest. Check your connection and try again.",
    spotLabel: (order: number, name: string, state: 'found' | 'open' | 'paused') =>
      `Spot ${order}: ${name}. ${
        state === 'found' ? 'Found.' : state === 'paused' ? 'Paused for parades.' : 'Not found yet.'
      }`,
  },

  placeholder: {
    comingSoon: 'Placeholder screen — built in a later step.',
  },
} as const;

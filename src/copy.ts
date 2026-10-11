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

  spot: {
    position: (order: number, total: number) => `${order} of ${total}`,
    whereToStand: 'Where to stand',
    clue: 'Clue',
    holidayNote: 'Seasonal note',
    needHint: 'Need a hint?',
    hint: 'Hint',
    foundOn: (date: string) => `Found on ${date}`,
    notFound: "We couldn't find that spot.",
    loadError: "We couldn't load this spot. Check your connection and try again.",
    stampedLabel: 'Stamped! Spot found.',

    answerLabel: 'Your answer',
    answerPlaceholder: 'Type what you see',
    checkIn: 'Check in',

    takePhoto: 'Take a photo',
    retake: 'Retake',
    usePhoto: 'Use this photo',
    photoPreviewLabel: 'Your check-in photo',
    cameraDenied:
      'Camera access is off. Turn it on in Settings to take a check-in photo.',
    photoFailed: "We couldn't save that photo. Please try again.",

    listenBody: 'Listen closely, then tap the button.',
    heardIt: 'I heard it',

    snackBody: 'Order it, enjoy it, log it.',
    addPhotoOptional: 'Add photo (optional)',
    stampPassport: 'Stamp my passport',
    removePhoto: 'Remove photo',

    openSettings: 'Open settings',
  },

  location: {
    explainTitle: 'Check in with your location',
    explainBody:
      "To check in here, we confirm you're at the spot. We only look at your location when you tap Check in, never in the background.",
    explainContinue: 'Continue',
    tooFar: (meters: number) => `You're about ${meters} m away. Walk closer to check in.`,
    off: 'Location is off. Turn it on to check in here.',
    unavailable: "We couldn't get your location. Step outside or try again in a moment.",
  },

  /** Friendly copy for every reason the check_in RPC can return. */
  checkInReasons: {
    not_found: "This spot isn't available right now.",
    paused: 'Paused during parades and fireworks — check back after.',
    too_far: 'Walk a little closer to the spot, then try again.',
    location_required: 'We need your location to check in here.',
    wrong_answer: 'Not quite — look again.',
    photo_required: 'Take a photo of the spot to check in.',
  },

  report: {
    open: 'Report a problem',
    title: 'Report a problem',
    intro: "Tell us what's wrong with this spot. We review every report.",
    reasons: {
      spot_changed: 'This spot changed',
      unsafe: 'This spot feels unsafe',
      answer_wrong: 'The answer seems wrong',
      other: 'Something else',
    },
    noteLabel: 'Details (optional)',
    notePlaceholder: 'What did you notice?',
    send: 'Send report',
    cancel: 'Cancel',
    thanks: 'Thanks! Your report was sent.',
  },

  badge: {
    title: 'Quest complete!',
    foundAll: (count: number) => `You found all ${count} spots.`,
    share: 'Share my badge',
    shareDialogTitle: 'Share your badge',
    shareUnavailable: "Sharing isn't available on this device.",
    nextQuest: 'Next quest',
    done: 'Done',
    stampLabel: (title: string) => `${title} badge`,
    notFound: "We couldn't find that badge.",
  },

  passport: {
    title: 'My Passport',
    summary: (spots: number, badges: number, snacks: number) =>
      `${spots} ${spots === 1 ? 'spot' : 'spots'} · ${badges} ${badges === 1 ? 'badge' : 'badges'} · ${snacks} ${snacks === 1 ? 'snack' : 'snacks'}`,
    badges: 'BADGES',
    stamps: (land: string) => `${land.toUpperCase()} STAMPS`,
    snackPassport: 'SNACK PASSPORT',
    noSnacks: 'Log a snack on a quest to start your Snack Passport.',
    firstStampHint: 'Find your first spot to collect a stamp.',
    badgeLabel: (title: string, earned: boolean) => `${title} badge. ${earned ? 'Earned.' : 'Not earned yet.'}`,
    foundStampLabel: (title: string, date: string) => `${title}. Found ${date}. Open spot.`,
    lockedStampLabel: (teaser: string) => `${teaser}. Not found yet.`,
    snackLabel: (title: string, date: string) => `${title}, ${date}. Open spot.`,
    loadError: "We couldn't load your passport. Check your connection and try again.",
  },

  placeholder: {
    comingSoon: 'Placeholder screen — built in a later step.',
  },
} as const;

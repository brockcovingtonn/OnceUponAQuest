/**
 * All user-facing copy lives here so it can be reviewed in one place.
 */
export const copy = {
  appName: 'Once Upon a Quest',
  tagline: 'Find the stories hiding in plain sight.',

  intro: {
    skip: 'Tap to skip the intro.',
  },

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
    cancel: 'Cancel',
    close: 'Close',
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
    usernameTaken: "That name isn't available. Try another.",
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
    effective: (date: string) => `Effective ${date}`,
  },

  offline: {
    banner: "You're offline. Quests still work — check-ins will sync when you're back online.",
    waiting: (n: number) => `${n} check-in${n === 1 ? '' : 's'} waiting to sync.`,
    syncing: 'Syncing your check-ins…',
    synced: (n: number) => `${n} offline check-in${n === 1 ? '' : 's'} synced.`,
    badgeEarned: 'You earned a badge while offline!',
    seeBadge: 'See badge',
    needsLook: (n: number) => `${n} offline check-in${n === 1 ? '' : 's'} need${n === 1 ? 's' : ''} another look.`,
    dismiss: 'Dismiss',
    firstLaunch: "You're offline. Connect once to load your quests — after that, they work without signal.",
    notCached: "You're offline, and this hasn't been saved on your phone yet. It will load when you're back online.",
    savedTitle: 'Saved for later!',
    savedAnswer: "You're offline, so we saved your answer. We'll check it as soon as you're back online.",
    savedOther: "You're offline, so we saved this check-in. It will be stamped as soon as you're back online.",
    pendingNotice: 'This check-in is saved on your phone and will sync when you’re back online.',
    failedAnswer: (answer: string) => `Your offline answer “${answer}” wasn't quite right — look again.`,
    failedOther: (reason: string) => `Your offline check-in didn't count: ${reason}`,
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
    chapter: (n: number) => `CHAPTER ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][n - 1] ?? n}`,
  },

  questDetail: {
    progress: (found: number, total: number) => `${found} of ${total}`,
    minutes: (minutes: number) => `~${minutes} min`,
    badgeForFinishing: 'Badge for finishing',
    badgeEarned: 'Badge earned!',
    notFound: "We couldn't find that quest.",
    loadError: "We couldn't load this quest. Check your connection and try again.",
    spotLabel: (order: number, name: string, state: 'found' | 'open' | 'paused' | 'pending') =>
      `Spot ${order}: ${name}. ${
        state === 'found'
          ? 'Found.'
          : state === 'paused'
            ? 'Paused for parades.'
            : state === 'pending'
              ? 'Saved offline, waiting to sync.'
              : 'Not found yet.'
      }`,
    pending: 'Waiting to sync',
  },

  spot: {
    position: (order: number, total: number) => `${order} of ${total}`,
    photoComingSoon: 'Hint photo coming soon',
    photoLabel: (whereToStand: string) => `Hint photo. ${whereToStand}`,
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

  reportUser: {
    title: (username: string) => `Report @${username}`,
    intro: "Tell us what's wrong. Reports are private — they won't know it was you. We review every report within 24 hours.",
    reasons: {
      inappropriate_photo: 'Inappropriate profile photo',
      offensive_name: 'Offensive username or name',
      harassment: 'Harassment or bullying',
      spam: 'Spam or fake account',
      other: 'Something else',
    },
    noteLabel: 'Details (optional)',
    notePlaceholder: 'What happened?',
    send: 'Send report',
    cancel: 'Cancel',
    sent: 'Thanks — your report was sent. You can also block them.',
  },

  blocked: {
    title: 'Blocked explorers',
    empty: "You haven't blocked anyone.",
    hidden: 'Account no longer visible',
    unblock: (username: string) => `Unblock @${username}`,
    unblockShort: 'Unblock',
    loadError: "We couldn't load your blocked list. Check your connection and try again.",
  },

  moderation: {
    title: 'Moderation',
    settingsRow: (open: number) => (open > 0 ? `Moderation (${open} open)` : 'Moderation'),
    intro: 'Open reports, oldest first. Act within 24 hours (App Store rule).',
    empty: 'No open reports. 🎉',
    reportedBy: (reporter: string | null, date: string) => `Reported by @${reporter ?? 'unknown'} on ${date}`,
    reasons: {
      inappropriate_photo: 'Inappropriate photo',
      offensive_name: 'Offensive name',
      harassment: 'Harassment',
      spam: 'Spam',
      other: 'Other',
    },
    actions: {
      remove_photo: 'Remove photo',
      reset_name: 'Reset name',
      suspend: 'Suspend account',
      dismiss: 'Dismiss',
    },
    confirmSuspend: (username: string) => `Suspend @${username}? Their profile disappears for everyone and their friendships end.`,
    confirm: 'Suspend',
    cancel: 'Cancel',
    failed: 'That did not save. Check your connection and try again.',
    loadError: "We couldn't load reports. Check your connection and try again.",
  },

  insights: {
    title: 'Insights',
    settingsRow: 'Insights',
    updated: (time: string) => `Updated ${time} · admins are left out`,
    goals: 'GOALS FROM THE SPEC',
    firstVisit: 'Finished a quest on their first visit',
    cameBack: 'Came back another day for a new quest',
    perVisit: 'Check-ins per park visit',
    ratio: (part: number, of: number) => `${part} of ${of} explorers`,
    visits: (n: number) => `across ${n} visit${n === 1 ? '' : 's'}`,
    noData: '—',
    activity: 'ACTIVITY',
    activeToday: 'Active today',
    active7d: 'Active this week',
    new7d: 'New this week',
    explorers: 'Explorers',
    funnel: 'FUNNEL',
    funnelSteps: { signedUp: 'Signed up', onboarded: 'Finished onboarding', firstCheckin: 'First check-in', firstBadge: 'First badge' },
    quests: 'QUESTS',
    questRow: (title: string, started: number, finished: number) =>
      `${title}: ${started} started, ${finished} finished.`,
    startedFinished: (started: number, finished: number) => `${finished} of ${started} finished`,
    spotReports: 'MOST-REPORTED SPOTS',
    noSpotReports: 'No spot reports yet.',
    reportsCount: (n: number) => `${n} report${n === 1 ? '' : 's'}`,
    userReports: (n: number) => `${n} open user report${n === 1 ? '' : 's'} — open Moderation`,
    errors: 'APP ERRORS (14 DAYS)',
    noErrors: 'No errors reported. ✨',
    errorMeta: (count: number, users: number, when: string) =>
      `×${count} · ${users} explorer${users === 1 ? '' : 's'} · last ${when}`,
    errorWhere: (parts: string) => parts,
    crash: 'Crash',
    showStack: 'Show details',
    hideStack: 'Hide details',
    loadError: "We couldn't load insights. Check your connection and try again.",
  },

  errorScreen: {
    title: 'Something went wrong',
    body: "Sorry — this page hit a snag. We've been told about it. Try again, or go back and pick up where you left off.",
  },

  suspended: {
    title: 'Your account is suspended',
    body: (email: string) =>
      `Your account was suspended for breaking the Terms of Service. If you think this is a mistake, email ${email}.`,
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

  friends: {
    title: 'Friends',
    addLabel: 'Add by username',
    addPlaceholder: 'username',
    add: 'Send request',
    outcomes: {
      sent: (username: string) => `Request sent to @${username}.`,
      not_found: (username: string) => `No explorer named @${username}. Check the spelling.`,
      self: () => "That's you! Try a friend's username.",
      already_friends: (username: string) => `You and @${username} are already friends.`,
      already_sent: (username: string) => `You already sent @${username} a request.`,
      they_asked: (username: string) => `@${username} already sent you a request — accept it below.`,
      you_blocked: (username: string) => `You blocked @${username}. Unblock them in Profile → Blocked explorers first.`,
      unavailable: (username: string) => `You can't send a request to @${username}.`,
    },
    requests: (count: number) => `REQUESTS (${count})`,
    accept: (username: string) => `Accept @${username}`,
    decline: (username: string) => `Decline @${username}`,
    sent: 'SENT',
    waiting: 'Waiting',
    leaderboard: 'LEADERBOARD',
    you: 'You',
    stats: (spots: number, badges: number) => `${spots} · ${badges}`,
    rowLabel: (rank: number, name: string, spots: number, badges: number) =>
      `Rank ${rank}: ${name}. ${spots} ${spots === 1 ? 'spot' : 'spots'}, ${badges} ${badges === 1 ? 'badge' : 'badges'}.`,
    empty: 'Add a friend to compare passports.',
    loadError: "We couldn't load your friends. Check your connection and try again.",
    remove: (username: string) => `Remove @${username} as a friend`,
    removeConfirmTitle: (username: string) => `Remove @${username}?`,
    removeConfirmBody: "You'll stop seeing each other's progress. You can send a new request any time.",
    removeConfirm: 'Remove',
    removeCancel: 'Cancel',
    removed: (username: string) => `@${username} was removed from your friends.`,
    more: (username: string) => `More options for @${username}`,
    removeFriend: 'Remove friend',
    report: 'Report',
    block: 'Block',
    cancelRequest: 'Cancel request',
    blockConfirmTitle: (username: string) => `Block @${username}?`,
    blockConfirmBody:
      "You won't see each other in Friends, any friendship or request between you ends, and neither of you can send a new request. They aren't told.",
    blockConfirm: 'Block',
    blocked: (username: string) => `@${username} is blocked.`,
  },

  profile: {
    exploringSince: (iso: string) =>
      `Exploring since ${new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`,
    editProfile: 'Edit profile',
    settings: 'SETTINGS',
    locationPermission: 'Location permission',
    cameraPermission: 'Camera permission',
    permissionState: {
      granted: 'Allowed',
      denied: 'Off',
      undetermined: 'Not asked yet',
    },
    permissionHint: 'Opens your phone settings',
    safetyRules: 'Quest safety rules',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    about: 'About & disclaimer',
    sendFeedback: 'Send feedback',
    signOut: 'Sign out',
    deleteAccount: 'Delete my account',
    deleteConfirmTitle: 'Delete your account?',
    deleteConfirmBody:
      'This permanently deletes your profile, stamps, badges, friends and check-in photos. It cannot be undone.',
    deleteConfirm: 'Delete forever',
    deleteCancel: 'Cancel',
    deleteFailed: "We couldn't delete your account. Check your connection and try again.",
    loadError: "We couldn't load your profile. Check your connection and try again.",
  },

  /** Set to an address to show "Send feedback" in Settings; null hides the row. */
  feedbackEmail: 'higherthinkingconsulting@gmail.com' as string | null,

  fieldTools: {
    title: 'Field tools (admins, dev builds only)',
    pin: (lat: number, lng: number) => `Pin: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    noPin: 'No pin yet — check-in skips the location check.',
    radius: (meters: number) => `Check-in radius: ${meters} m (+25 m tolerance)`,
    setPin: 'Set pin here',
    pinSaved: (accuracy: number | null) =>
      accuracy === null ? 'Pin saved.' : `Pin saved (accuracy about ${Math.round(accuracy)} m).`,
    pinWeak: (accuracy: number) =>
      `GPS accuracy is about ${Math.round(accuracy)} m. Wait a moment in open sky and try again for a better pin.`,
    hintPhoto: 'Take hint photo',
    coverPhoto: 'Take cover photo',
    photoSaved: 'Photo saved.',
    verified: 'Verified on site',
    markVerified: 'Mark verified',
    markUnverified: 'Mark not verified',
    failed: 'That did not save. Check your connection and try again.',
  },

  avatarPhoto: {
    use: 'Use my own photo',
    change: 'Choose a different photo',
    optionLabel: 'Your own photo',
    note: 'Friends and other explorers can see your profile photo. Keep it friendly — no photos of other people without their OK.',
    uploadFailed: "We couldn't upload your photo. Check your connection and try again.",
  },

  editProfile: {
    title: 'Edit profile',
    username: (username: string) => `@${username}`,
    usernameNote: "Your explorer name can't be changed.",
    displayNameLabel: 'Display name (optional)',
    displayNamePlaceholder: 'How friends see you',
    avatarTitle: 'Stamp avatar',
    save: 'Save',
    saveFailed: "We couldn't save your changes. Check your connection and try again.",
    nameNotAllowed: "That display name isn't allowed. Try another.",
  },

  safety: {
    title: 'Quest safety rules',
    intro: 'Quests happen in a busy park. Please keep these in mind on every quest:',
    extra: [
      'Check in only when it is safe to stop. Step aside so others can pass.',
      'Never climb on railings, planters or props to find a detail.',
      'Follow cast member instructions and park signs at all times.',
    ],
  },

  about: {
    title: 'About & disclaimer',
    body: 'Once Upon a Quest turns a walk down the street into a storybook hunt. Find the hidden details, collect stamps and earn badges.',
    disclaimerTitle: 'Disclaimer',
    photosNote:
      'Spot photos are taken by the app founder and by explorers. Clues are written in our own words.',
    version: (version: string) => `Version ${version}`,
  },
} as const;

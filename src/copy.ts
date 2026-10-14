/**
 * All user-facing copy lives here so it can be reviewed in one place.
 */
function roman(n: number): string {
  const steps: [number, string][] = [
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let out = '';
  for (const [value, numeral] of steps) {
    while (n >= value) {
      out += numeral;
      n -= value;
    }
  }
  return out;
}

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
    testAccount: 'Tester account: enter your 6-digit test code.',
    logoLabel: 'Once Upon a Quest logo: a golden keyhole on an open storybook, with fireworks and a wishing star',
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
        text: 'Stay on walkways — never block a doorway, a queue or the parade route.',
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
    savedTitle: 'SAVED FOR YOUR NEXT VISIT',
    removeSaved: 'Remove from saved',
    removeSavedLabel: (title: string) => `Remove ${title} from saved quests`,
    greeting: (hour: number, username: string) =>
      `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, ${username}`,
    spotsAndTime: (spots: number, minutes: number) =>
      `${spots} ${spots === 1 ? 'spot' : 'spots'} · ~${minutes} min`,
    foundOf: (found: number, total: number) => `${found}/${total} found`,
    start: 'Start',
    continue: 'Continue',
    badgeEarned: 'Badge',
    moreLands: 'New chapters are always being written ✦',
    beingVerified: 'Being verified on site',
    jumpTo: 'Jump to a land',
    jumpToLabel: (land: string) => `Jump to ${land}`,
    empty: 'No quests here yet.',
    loadError: "We couldn't load quests. Check your connection and try again.",
    statusNotStarted: (spots: number, minutes: number) =>
      `${spots} spots, about ${minutes} minutes. Not started.`,
    statusInProgress: (found: number, total: number) => `${found} of ${total} spots found.`,
    statusComplete: 'Complete. Badge earned.',
    chapter: (n: number) => `CHAPTER ${n > 0 && n < 90 ? roman(n) : n}`,
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
    save: 'Save for my next visit',
    saved: 'Saved for your next visit',
    beingVerified:
      "We're still checking some of these spots in person, so a detail may have changed. If something doesn't match, tell us with Send feedback on your Profile.",
  },

  spot: {
    position: (order: number, total: number) => `${order} of ${total}`,
    photoComingSoon: 'Hint photo coming soon',
    storyBehind: 'Story behind this',
    beingVerified: 'Not yet checked in person — details may have changed.',
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

  map: {
    title: 'Map',
    storybook: 'Storybook',
    real: 'Real map',
    viewLabel: 'Map style',
    allSpots: 'All spots',
    wholePark: 'Whole park',
    backToPark: 'Back to the whole park',
    osmCredit: '© OpenStreetMap contributors',
    allInLand: 'All quests here',
    landsLabel: 'Lands',
    questsLabel: 'Quests in this land',
    landLabel: (land: string, found: number, total: number) => `${land}. ${found} of ${total} spots found.`,
    landHint: 'Shows this land up close',
    landCount: (found: number, total: number) => `${found}/${total} found`,
    parkIntro: 'Tap a land to see its quests up close.',
    approximate: 'Spot positions are approximate until they’re pinned on site.',
    noPins: 'Spot pins are added during the field walk. Until then, use the Storybook map.',
    tilesNeedSignal: 'The real map needs signal to load. The Storybook map works offline.',
    locateMe: 'Show where I am',
    hideMe: 'Hide my location',
    notOnStreet: "You're not on the street right now.",
    notOnMap: "You're not on this map right now.",
    youAreHere: 'You are here',
    stampLabel: (order: number, name: string, state: 'found' | 'open' | 'paused') =>
      `Spot ${order}: ${name}. ${state === 'found' ? 'Found.' : state === 'paused' ? 'Paused for parades.' : 'Not found yet.'} Shows details.`,
    found: 'Found',
    notFound: 'Not found yet',
    paused: 'Paused for parades',
    openSpot: 'Open spot',
    close: 'Close',
    loadError: "We couldn't load the map. Check your connection and try again.",
  },

  walkthrough: {
    open: 'How quests work',
    openHint: 'A quick tour of quests, check-ins, stamps and safety',
    skip: 'Skip',
    back: 'Back',
    next: 'Next',
    done: 'Start exploring',
    pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
    pages: [
      {
        title: 'Welcome to the story',
        body: 'Quests are short storybook hunts in every land of the park. Each quest has 4 to 7 spots in walking order and takes about 15–20 minutes. Start any quest, in any order, and pick up where you left off.',
      },
      {
        title: 'Find the spot',
        body: 'Open a spot to see where to stand — always on a walkway — and a clue in our own words. Then look closely: the details are hiding in plain sight. Found spots reveal their real name.',
      },
      {
        title: 'Four ways to check in',
        body: 'Each spot asks for one thing: type what you see, take a photo, listen for something, or log a snack. If a spot has a location pin, you need to be close by to check in.',
      },
      {
        title: 'Stamps and badges',
        body: 'Every spot you find stamps your Passport. Find every spot in a quest to earn its badge, and keep a Snack Passport of the treats you try along the way.',
      },
      {
        title: 'Hints and Parade mode',
        body: 'Wrong answers are part of the fun — try as often as you like, and after two misses you can ask for a hint. During parades and fireworks, turn on Parade mode: spots on the route pause until it’s safe.',
      },
      {
        title: 'No signal? No problem',
        body: 'Crowded lands can have weak signal. Your quests still open, and check-ins are saved on your phone with an hourglass. They’re stamped automatically as soon as you’re back online.',
      },
      {
        title: 'Explore with friends',
        body: 'Add friends by username to compare passports on the leaderboard. Use the … menu next to anyone to remove, report or block them. Only accepted friends can see your progress.',
      },
      {
        title: 'Storybook Lens',
        body: 'Tap the lens button on the Map and point your camera at the park: stories about the architecture, history and engineering of what you’re facing float into view. Read them anywhere; stamp a Lens page in your Passport when you’re standing nearby.',
      },
      {
        title: 'Safety first',
        body: 'The park’s rules and cast members always come first. Keep these three in mind on every quest:',
      },
    ],
    demo: {
      questTitle: 'A Sample Quest',
      chapter: 'CHAPTER I',
      foundOf: (found: number, total: number) => `${found}/${total} found`,
      teaser: 'The baker’s window',
      whereToStand: 'Sidewalk across from the bakery, looking up.',
      clue: 'A name is painted on the window above the bakery.',
      methods: { answer: 'Answer', photo: 'Photo', listen: 'Listen', snack: 'Snack' },
      answerExample: 'Rosie',
      checkIn: 'Check in',
      photoCaption: 'Take a photo of the spot',
      listenCaption: 'Pick up the phone and listen',
      snackCaption: 'Order it, enjoy it, log it',
      stamped: 'Stamped!',
      badge: 'Badge earned!',
      notQuite: 'Not quite — look again.',
      needHint: 'Need a hint?',
      hint: 'Hint: look up, not at the doors.',
      paradeMode: 'Parade mode',
      paused: 'Paused',
      offline: 'Offline',
      saved: 'Saved for later',
      backOnline: 'Back online',
      synced: 'Synced — stamped!',
      you: 'You',
      friendA: 'lampLighter',
      friendB: 'mapMaker',
      spots: (n: number) => `${n} spots`,
      lensTitle: 'The Old Clock Tower',
      lensTeaser: 'Its gears were made for a real town.',
      lensFacing: 'You’re facing',
      lensStamped: 'Lens page stamped!',
    },
    reducedMotionNote: 'Animations are paused because Reduce Motion is on.',
  },

  lens: {
    name: 'Storybook Lens',
    open: 'Open the Storybook Lens',
    openHint: 'Point your camera at the park to discover the stories behind what you see',
    buttonLabel: 'Lens',
    close: 'Close the lens',
    whichLand: 'Which land are you in?',
    pointHint: 'Step aside first, then turn slowly — stories appear as you face each landmark.',
    browseHint: 'Swipe through the stories here. Step aside before you look around.',
    nothingAhead: 'Nothing in this direction. Keep turning!',
    modePoint: 'Point',
    modeBrowse: 'Browse',
    modeLabel: 'Lens mode',
    readStory: 'Read the story',
    facing: 'You’re facing',
    distance: (m: number) => (m < 1000 ? `${Math.round(m / 5) * 5} m away` : `${(m / 1000).toFixed(1)} km away`),
    toLeft: (title: string) => `${title} is to your left`,
    toRight: (title: string) => `${title} is to your right`,
    cameraOff: 'The camera is off, so you’re seeing the storybook view. Turn the camera on in Settings to look through the lens.',
    turnOnCamera: 'Turn on the camera',
    noCompass: 'Your phone’s compass isn’t available, so the lens is in Browse mode.',
    findingYou: 'Finding where you are…',
    pinnedNone: 'Landmarks here aren’t pinned yet, so browse the stories by land.',
    cardLabel: (title: string, teaser: string) => `${title}. ${teaser} Opens the story.`,
    layers: { architecture: 'Architecture', story: 'Story', history: 'History', engineering: 'Engineering' },
    layersLabel: 'Story layers',
    lookFor: 'Look for…',
    questsHere: 'Quests with this landmark',
    moreInLand: (land: string) => `More stories in ${land}`,
    storyBehind: 'Story behind this',
    stamp: 'I’m here — stamp my Lens page',
    stampHint: 'Stamping checks that you’re near the landmark.',
    stampedOn: (date: string) => `Lens page stamped on ${date}`,
    stamped: 'Stamped! A new Lens page in your Passport.',
    tooFar: (m: number) => `You’re about ${m} m away. Get a little closer to stamp it.`,
    locationRequired: 'Turn on location so we can tell you’re here.',
    needsSignal: 'Stamping needs signal. The story stays readable offline — try again when you’re connected.',
    failed: 'We couldn’t stamp it. Please try again.',
    notFound: 'We couldn’t find that story.',
    loadError: 'We couldn’t load the stories. Check your connection and try again.',
    ownWords: 'Written in our own words from public history. Spotted a mistake? Tell us with Send feedback on your Profile.',
    beingVerified: 'Being verified on site',
    passportTitle: 'LENS PAGES',
    passportCount: (n: number, total: number) => `${n} of ${total} stories stamped`,
    passportEmpty: 'Open the Storybook Lens from the Map to start collecting Lens pages.',
    passportStamp: (title: string, stamped: boolean) => `${title}. ${stamped ? 'Stamped.' : 'Not stamped yet.'} Opens the story.`,
    mapToggle: 'Stories',
    mapToggleLabel: 'Show landmark stories on the map',
    markerLabel: (title: string, stamped: boolean) => `Story: ${title}.${stamped ? ' Stamped.' : ''} Shows details.`,
  },

  appUpdate: {
    ready: 'A new version of Once Upon a Quest is ready.',
    restart: 'Restart now',
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
    done: 'Done',
    nextAdventure: 'YOUR NEXT ADVENTURE',
    nextReason: (reason: 'in_progress' | 'same_land' | 'next_land', land: string, found: number, total: number) =>
      reason === 'in_progress'
        ? `You're partway through: ${found} of ${total} spots found.`
        : reason === 'same_land'
          ? `Right next door, in ${land}.`
          : `A new land to explore: ${land}.`,
    startNow: 'Start now',
    saveForNext: 'Save for my next visit',
    savedForNext: 'Saved for your next visit',
    savedHint: "It's pinned to the top of your Quests screen.",
    saveFailed: "That didn't save. Check your connection and try again.",
    allDone: 'You have finished every quest. Legendary!',
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
    landProgress: (found: number, total: number) => `${found} of ${total} stamps`,
    landProgressLabel: (land: string, found: number, total: number) => `${land}: ${found} of ${total} stamps found.`,
    milestones: 'MILESTONES',
    milestoneLabel: (title: string, detail: string, earned: boolean) =>
      `${title}. ${detail}. ${earned ? 'Earned.' : 'Not earned yet.'}`,
    milestone: {
      firstStamp: { title: 'First Stamp', detail: 'Find your first spot' },
      firstSnack: { title: 'First Snack', detail: 'Log your first snack' },
      threeDays: { title: 'Three Visits', detail: 'Find spots on 3 different park days' },
      tenStamps: { title: 'Ten Stamps', detail: 'Find 10 spots' },
      firstLens: { title: 'First Lens Page', detail: 'Stamp a Storybook Lens story' },
    },
    daysProgress: (days: number) => `${days} of 3 park days`,
    sharePassport: 'Share my Passport',
  },

  share: {
    shareImage: 'Share image',
    close: 'Close',
    preview: 'Here is your storybook card.',
    unavailable: "Sharing isn't available on this device.",
    failed: "We couldn't make the image. Please try again.",
    spotButton: 'Share this find',
    spotDialog: 'Share your find',
    passportDialog: 'Share your Passport',
    found: 'FOUND',
    foundOn: (date: string) => `Found on ${date}`,
    inQuest: (quest: string) => `in the quest “${quest}”`,
    passportTitle: (name: string) => `${name}’s Passport`,
    stats: { spots: 'spots', badges: 'badges', snacks: 'snacks', lens: 'Lens pages' },
    badgesEarned: 'BADGES EARNED',
    noBadgesYet: 'The first badge is just a quest away.',
    moreBadges: (n: number) => `+${n}`,
    footer: 'An independent fan app',
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
    sounds: 'Sounds',
    soundsHint: 'Stamp thunks and badge chimes (follows your silent switch)',
    vibration: 'Vibration',
    vibrationHint: 'A gentle buzz when you check in',
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
    landmarkNoPin: 'No pin yet — the Lens shows it in Browse mode and stamping skips the location check.',
    landmarkRadius: (meters: number) => `Stamp radius: ${meters} m (+25 m tolerance)`,
    landmarkPhoto: 'Take landmark photo',
  },

  fieldWalk: {
    title: 'Field walk',
    settingsRow: (done: number, total: number) => `Field walk (${done} of ${total} done)`,
    summary: (done: number, total: number) => `${done} of ${total} spots done`,
    doneMeans: 'A spot is done when it has a pin, a hint photo and is marked verified.',
    onlyUnfinished: 'Show only unfinished',
    pin: 'Pin',
    photo: 'Photo',
    verified: 'Verified',
    cover: 'Cover photo',
    spotLabel: (order: number, teaser: string, pin: boolean, photo: boolean, verified: boolean) =>
      `Spot ${order}: ${teaser}. Pin ${pin ? 'set' : 'missing'}, photo ${photo ? 'set' : 'missing'}, ${verified ? 'verified' : 'not verified'}. Opens the spot.`,
    allDone: 'Every spot is done. 🎉',
    landmarksTitle: 'Storybook Lens landmarks',
    landmarkSummary: (done: number, total: number) => `${done} of ${total} landmarks done`,
    landmarkLabel: (title: string, land: string, pin: boolean, photo: boolean, verified: boolean) =>
      `${title}, ${land}. Pin ${pin ? 'set' : 'missing'}, photo ${photo ? 'set' : 'missing'}, ${verified ? 'verified' : 'not verified'}. Opens the story.`,
    loadError: "We couldn't load the checklist. Check your connection and try again.",
  },

  editContent: {
    editSpot: 'Edit text & answers',
    editQuest: 'Edit title & story',
    titleSpot: 'Edit spot',
    titleQuest: 'Edit quest',
    teaser: 'Teaser (shown before it’s found)',
    title: 'Title (shown after it’s found)',
    whereToStand: 'Where to stand',
    clue: 'Clue',
    hint: 'Hint (after 2 misses — blank for none)',
    prompt: 'Check-in prompt',
    holidayNote: 'Seasonal note (blank for none)',
    answers: 'Accepted answers (one per line)',
    answersHelp: 'Capital letters, spaces and punctuation are ignored when checking.',
    pauseDuringParades: 'Pause during parades',
    radius: 'Check-in radius in meters (10–200)',
    questTitle: 'Quest title',
    story: 'Story intro',
    save: 'Save changes',
    cancel: 'Cancel',
    saved: 'Saved. Everyone sees the change right away.',
    failed: 'That did not save. Check the fields and your connection, then try again.',
    needsAnswer: 'An answer spot needs at least one accepted answer.',
    badRadius: 'Radius must be between 10 and 200 meters.',
    editLandmark: 'Edit story text',
    titleLandmark: 'Edit landmark story',
    landmarkTitle: 'Title',
    landmarkTeaser: 'Teaser (one line)',
    lookFor: 'Look for…',
    layer: (name: string) => `${name} (blank for none)`,
    landmarkRadius: 'Stamp radius in meters (10–300)',
    badLandmarkRadius: 'Radius must be between 10 and 300 meters.',
    needsTwoLayers: 'Keep at least two story layers.',
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
    body: 'Once Upon a Quest turns a walk through the park into a storybook hunt. Find the hidden details, collect stamps and earn badges.',
    disclaimerTitle: 'Disclaimer',
    photosNote:
      'Spot photos are taken by the app founder and by explorers. Clues are written in our own words.',
    mapCredit:
      'The park map is drawn from OpenStreetMap data, © OpenStreetMap contributors, available under the Open Database License (openstreetmap.org/copyright). The illustration style is our own.',
    version: (version: string) => `Version ${version}`,
  },
} as const;

import { type LegalDocument, legalInfo as L } from './info';

/**
 * Terms of Service. Drafted to match how the app actually works; have an
 * attorney review before launch. Plain data so it renders in the app and
 * exports to Markdown (scripts/export-legal.mjs) for the store listing.
 */
export const terms: LegalDocument = {
  title: 'Terms of Service',
  intro: `These Terms of Service ("Terms") are an agreement between you and ${L.operator} ("we", "us") about your use of the ${L.appName} mobile app (the "App"). Please read them carefully. By creating an account or using the App, you agree to these Terms and to our Privacy Policy. If you do not agree, do not use the App.`,
  sections: [
    {
      heading: '1. An independent fan app',
      paragraphs: [
        `${L.appName} is an independent fan app. It is not affiliated with, endorsed by, or sponsored by The Walt Disney Company or its affiliates, or by any theme park operator. All park, land, attraction, shop and menu names are used only to describe real locations and belong to their respective owners.`,
        'Nothing in the App gives you any right to enter a park, skip a line, or receive any service from a park operator. Your visit is governed entirely by the park operator\'s own rules, tickets and policies.',
      ],
    },
    {
      heading: '2. Who can use the App',
      bullets: [
        'You must be at least 13 years old to create an account. If you are under 13, please do not use the App.',
        'If you are under 18 (or the age of majority where you live), you may use the App only with the permission and supervision of a parent or legal guardian, who agrees to these Terms on your behalf and is responsible for your use.',
        'You may not use the App if you are barred from doing so under applicable law.',
      ],
    },
    {
      heading: '3. Your account',
      bullets: [
        'You sign in with a one-time code sent to your email. Keep access to your email secure; anyone who can read it can sign in as you.',
        'Give accurate information and keep it current. One account per person.',
        'Your username and profile must not impersonate anyone, mislead others, or include offensive, hateful, sexual, or infringing content. We may change or reclaim a username that breaks these rules.',
        'You are responsible for activity on your account. Tell us right away at ' + L.contactEmail + ' if you think someone else is using it.',
      ],
    },
    {
      heading: '4. Safety first — assumption of risk',
      paragraphs: [
        'Quests take place in busy, real-world places. Your safety, and the safety of those around you, always comes before any quest.',
      ],
      bullets: [
        'Always follow park rules, posted signs and instructions from park staff. They take priority over anything in the App.',
        'Walk, never run. Stay on sidewalks and public walkways. Never stand in a street or parade route, block a doorway or walkway, climb on railings, planters, props or buildings, or enter any area that is closed or restricted.',
        'Turn on Parade mode during parades and fireworks, and do not check in at paused spots.',
        'Stay aware of your surroundings and do not use the App while walking through crowds, near vehicles, or anywhere it would be unsafe to look at your phone.',
        'Parents and guardians are responsible for supervising minors at all times.',
        'Spots, clues, hints and answers are researched in good faith but may be inaccurate, out of date, seasonal, or temporarily unavailable. Places change without notice.',
      ],
    },
    {
      heading: '',
      paragraphs: [
        'You understand that visiting theme parks and other public places involves risks, including crowds, weather, uneven surfaces and physical exertion. You voluntarily choose to take part in quests and assume all risks of doing so. We do not operate, control or inspect any park or location shown in the App.',
      ],
    },
    {
      heading: '5. No buying or selling',
      paragraphs: [
        'The App is for fun and exploration only. You may not use the App to buy, sell, trade for money, advertise, or arrange any paid service, tour, or meetup on park property or elsewhere. Logging a snack in the Snack Passport is not an endorsement of any vendor, and we are not paid by any vendor or park.',
      ],
    },
    {
      heading: '6. Your content',
      paragraphs: [
        'Your content includes your username, display name, profile photo, check-in photos, snack logs, problem reports and anything else you submit. You keep ownership of your content.',
        'You give us a worldwide, non-exclusive, royalty-free license to host, store, copy, process and display your content only as needed to run, secure and improve the App as described in our Privacy Policy — for example, showing your profile photo to other signed-in users and showing your check-in photos back to you. Check-in photos are private to you; we do not publish them. This license ends when you delete the content or your account, except for copies we must keep by law or that remain for a short time in backups.',
        'You promise that you have the rights to everything you upload, and that anyone identifiable in your photos has agreed to appear. Do not photograph other guests, children, or staff without permission, and follow any park rules about photography.',
        'We may remove any content, or limit any account, that we reasonably believe breaks these Terms or puts people at risk.',
      ],
    },
    {
      heading: '7. Things you may not do',
      bullets: [
        'Harass, bully, threaten, stalk, or impersonate anyone, or share hateful, sexual, violent, or otherwise inappropriate content.',
        'Use the App to arrange to meet strangers, especially minors.',
        'Upload content that infringes someone else\'s copyright, trademark, privacy or publicity rights.',
        'Fake check-ins with automated tools, spoof your location, or otherwise cheat the game.',
        'Copy, scrape, reverse engineer, or interfere with the App, its security, or its servers, or try to access data that is not yours.',
        'Submit false or misleading problem reports.',
        'Use the App for any unlawful purpose or in violation of any park\'s rules.',
      ],
    },
    {
      heading: '8. Friends and other explorers',
      paragraphs: [
        'You choose who to add as a friend, and you can remove a friend at any time. Friends can see your progress and badges. Other signed-in users can see your username, display name and profile picture. We are not responsible for how other users act, in or out of the App. If someone makes you feel unsafe, remove them and tell us at ' + L.contactEmail + '.',
      ],
    },
    {
      heading: '9. Our content',
      paragraphs: [
        `The App, including its design, code, original artwork, quest text and clues, is owned by ${L.operator} or its licensors and protected by law. We give you a personal, non-transferable, revocable license to use the App for your own non-commercial enjoyment, subject to these Terms. If you send us ideas or feedback, we may use them without any obligation to you.`,
      ],
    },
    {
      heading: '10. Changes and availability',
      paragraphs: [
        'We may add, change, pause or retire quests, spots, badges and features at any time, and the App may sometimes be unavailable. Badges and progress have no monetary value and cannot be exchanged for anything.',
      ],
    },
    {
      heading: '11. Ending your account',
      paragraphs: [
        'You can delete your account at any time in Profile → Delete my account, which permanently deletes your profile, progress and photos. We may suspend or end your access if you break these Terms, if required by law, or to protect users or the App. Sections that by their nature should survive (such as ownership, disclaimers, limits of liability, release, indemnity and disputes) survive the end of these Terms.',
      ],
    },
    {
      heading: '12. Disclaimers',
      paragraphs: [
        'THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE OR SECURE, OR THAT ANY SPOT, CLUE, ANSWER, OR LOCATION INFORMATION IS ACCURATE OR SAFE TO VISIT.',
      ],
    },
    {
      heading: '13. Limitation of liability',
      paragraphs: [
        `TO THE FULLEST EXTENT PERMITTED BY LAW, ${L.operator.toUpperCase()} AND ITS OWNERS, EMPLOYEES AND CONTRACTORS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY OR PUNITIVE DAMAGES, OR FOR ANY PERSONAL INJURY, PROPERTY DAMAGE, LOST DATA, OR LOSS ARISING FROM YOUR VISITS TO ANY PARK OR LOCATION, YOUR INTERACTIONS WITH OTHER USERS, OR YOUR USE OF (OR INABILITY TO USE) THE APP. OUR TOTAL LIABILITY FOR ALL CLAIMS RELATING TO THE APP WILL NOT EXCEED FIFTY U.S. DOLLARS (US $50).`,
        'Some places do not allow certain limitations, so some of these may not apply to you. Nothing in these Terms limits liability that cannot be limited by law.',
      ],
    },
    {
      heading: '14. Release',
      paragraphs: [
        'To the fullest extent permitted by law, you release us from claims, demands and damages of every kind arising out of or connected with (a) your visits to any park or location, and (b) disputes with other users.',
        'If you are a California resident, you waive California Civil Code Section 1542, which says: "A general release does not extend to claims that the creditor or releasing party does not know or suspect to exist in his or her favor at the time of executing the release and that, if known by him or her, would have materially affected his or her settlement with the debtor or released party." Residents of other places waive any similar law.',
      ],
    },
    {
      heading: '15. Indemnity',
      paragraphs: [
        'To the extent permitted by law, you agree to defend, indemnify and hold us harmless from claims, losses and expenses (including reasonable attorneys\' fees) arising from your content, your breach of these Terms, your violation of any law or park rule, or your conduct at any location.',
      ],
    },
    {
      heading: '16. Governing law and disputes',
      paragraphs: [
        `These Terms are governed by the laws of the State of ${L.governingState} and applicable U.S. federal law, without regard to conflict-of-law rules. Before filing any claim, you agree to contact us at ${L.contactEmail} and try in good faith to resolve it informally for at least 30 days. If we cannot, any claim must be brought in the state or federal courts located in ${L.venue}, and you and we consent to their jurisdiction, except that either of us may bring an individual claim in small claims court. Any claim must be brought within one year after it arises, where the law allows.`,
      ],
    },
    {
      heading: '17. App store terms',
      paragraphs: [
        'If you downloaded the App from the Apple App Store or Google Play, you also agree to that store\'s terms. These Terms are between you and us only, not Apple or Google. Apple and Google are not responsible for the App, its content, maintenance or support, or any claims relating to it (including product liability, legal compliance, or intellectual property claims), and have no warranty obligations for it. Apple and its subsidiaries are third-party beneficiaries of these Terms and may enforce them against you. You confirm that you are not located in a country subject to a U.S. government embargo and are not on any U.S. government list of prohibited or restricted parties.',
      ],
    },
    {
      heading: '18. Changes to these Terms',
      paragraphs: [
        'We may update these Terms from time to time. If we make a material change, we will let you know in the App before it takes effect. If you keep using the App after the change takes effect, you accept the updated Terms. If you do not agree, delete your account.',
      ],
    },
    {
      heading: '19. General',
      paragraphs: [
        'These Terms and our Privacy Policy are the entire agreement between you and us about the App. If any part is found unenforceable, the rest stays in effect. Our failure to enforce a provision is not a waiver. You may not transfer these Terms; we may transfer them as part of a merger, sale, or reorganization.',
      ],
    },
    {
      heading: '20. Contact us',
      paragraphs: [`${L.operator} · ${L.contactEmail}`],
    },
  ],
};

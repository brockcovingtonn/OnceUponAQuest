/**
 * Facts the Terms and Privacy Policy depend on. Confirm every value with your
 * attorney before launch (see docs/LAUNCH_CHECKLIST.md).
 */
export const legalInfo = {
  appName: 'Once Upon a Quest',
  /** Legal name of the business that operates the app. */
  operator: 'Higher Thinking Consulting',
  contactEmail: 'higherthinkingconsulting@gmail.com',
  effectiveDate: 'October 15, 2026',
  governingState: 'California',
  venue: 'Orange County, California',
  dataLocation: 'the United States (West Coast)',
} as const;

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalDocument = {
  title: string;
  intro: string;
  sections: LegalSection[];
};

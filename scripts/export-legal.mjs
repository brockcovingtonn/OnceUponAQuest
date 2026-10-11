// Writes docs/legal/TERMS.md and docs/legal/PRIVACY.md from src/legal/*.ts so
// the same text can be hosted on a website for the App Store / Play listing.
//   npm run legal:export
import { mkdirSync, writeFileSync } from 'node:fs';
import { registerHooks } from 'node:module';

// The app's TypeScript imports omit the .ts extension; let Node find those files.
registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context);
    } catch (error) {
      if (specifier.startsWith('.') && !specifier.endsWith('.ts')) return next(`${specifier}.ts`, context);
      throw error;
    }
  },
});

const { legalInfo } = await import('../src/legal/info.ts');
const { privacy } = await import('../src/legal/privacy.ts');
const { terms } = await import('../src/legal/terms.ts');

const disclaimer =
  'Once Upon a Quest is an independent fan app. It is not affiliated with, endorsed by, or sponsored by The Walt Disney Company or its affiliates. All park names are used only to describe locations.';

function toMarkdown(doc) {
  const lines = [`# ${legalInfo.appName} — ${doc.title}`, '', `_Effective ${legalInfo.effectiveDate}_`, '', doc.intro, ''];
  for (const s of doc.sections) {
    if (s.heading) lines.push(`## ${s.heading}`, '');
    for (const p of s.paragraphs ?? []) lines.push(p, '');
    if (s.bullets) lines.push(...s.bullets.map((b) => `- ${b}`), '');
  }
  lines.push('---', '', `_${disclaimer}_`, '');
  return lines.join('\n');
}

mkdirSync('docs/legal', { recursive: true });
writeFileSync('docs/legal/TERMS.md', toMarkdown(terms));
writeFileSync('docs/legal/PRIVACY.md', toMarkdown(privacy));
console.log('Wrote docs/legal/TERMS.md and docs/legal/PRIVACY.md');

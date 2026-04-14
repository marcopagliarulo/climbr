import { CliUtils, Command } from '@climbr/core';

const LANGUAGES = [
  'TypeScript',
  'JavaScript',
  'Python',
  'Rust',
  'Go',
  'Java',
  'C#',
  'C++',
  'Ruby',
  'Swift',
  'Kotlin',
  'PHP',
];

const COUNTRIES: { value: string; name: string }[] = [
  { value: 'us', name: 'United States' },
  { value: 'gb', name: 'United Kingdom' },
  { value: 'de', name: 'Germany' },
  { value: 'fr', name: 'France' },
  { value: 'it', name: 'Italy' },
  { value: 'jp', name: 'Japan' },
  { value: 'br', name: 'Brazil' },
  { value: 'au', name: 'Australia' },
  { value: 'ca', name: 'Canada' },
  { value: 'es', name: 'Spain' },
];

export default (): Command => {
  return new Command('inputs')
    .description('Walk through every available input prompt type')
    .action(async () => {
      CliUtils.showInfo('Starting inputs demo — building a sample profile...');
      console.log('');

      // 1. promptInput — free-form text with validation
      const name = await CliUtils.promptInput({
        message: 'Your name:',
        required: true,
        validate: (v) =>
          v.trim().length >= 2 || 'Name must be at least 2 characters',
      });

      // 2. promptNumber — bounded numeric input
      const age = await CliUtils.promptNumber({
        message: 'Your age:',
        min: 1,
        max: 120,
        step: 1,
        required: true,
      });

      // 3. promptPassword — masked text input
      const token = await CliUtils.promptPassword({
        message: 'Create a secret token:',
        validate: (v) => v.length >= 6 || 'Token must be at least 6 characters',
      });

      // 4. promptBoolean — True / False select
      const isPublic = await CliUtils.promptBoolean(
        'Make your profile public?',
      );

      // 5. promptConfirm — Y / N confirmation
      const acceptTerms = await CliUtils.promptConfirm({
        message: 'Do you accept the terms of service?',
        defaultValue: false,
      });

      if (!acceptTerms) {
        CliUtils.showWarning('You must accept the terms to continue.');
        return;
      }

      // 6. promptSelect — pick one from a fixed list
      const role = await CliUtils.promptSelect<string>({
        message: 'Select your role:',
        choices: [
          { value: 'developer', name: 'Developer' },
          { value: 'designer', name: 'Designer' },
          { value: 'manager', name: 'Manager' },
          { value: 'other', name: 'Other' },
        ],
      });

      // 7. promptSearchChoices — filter a static list by keyword
      const country = await CliUtils.promptSearchChoices({
        message: 'Search and select your country:',
        choices: COUNTRIES,
        validate: (v) => !!v || 'Please select a country',
      });

      // 8. promptSearch — async source search
      const language = await CliUtils.promptSearch<string>({
        message: 'Search for your primary programming language:',
        source: async (term) => {
          const filtered = term
            ? LANGUAGES.filter((l) =>
                l.toLowerCase().includes(term.toLowerCase()),
              )
            : LANGUAGES;
          return Promise.resolve(filtered.map((l) => ({ value: l, name: l })));
        },
      });

      // 9. promptArray — collect a variable-length list
      const tags = await CliUtils.promptArray({
        message: 'Add a skill or interest tag',
      });

      // 10. promptObject — structured JSON via editor
      const metadata = await CliUtils.promptObject({
        message: 'Edit your profile metadata (JSON):',
        defaultValue: JSON.stringify({ website: '', bio: '' }, null, 2),
        validate: (raw) => {
          try {
            JSON.parse(raw);
            return true;
          } catch {
            return 'Must be valid JSON';
          }
        },
      });

      const masked = `${'*'.repeat(Math.max(0, token.length - 2))}${token.slice(-2)}`;

      CliUtils.showBoxedSuccessMessage({
        title: 'Profile Created',
        message: [
          `Name:     ${CliUtils.formatValue({ value: name })}`,
          `Age:      ${CliUtils.formatValue({ value: age ?? 0 })}`,
          `Token:    ${CliUtils.formatValue({ value: masked })}`,
          `Public:   ${CliUtils.formatValue({ value: isPublic })}`,
          `Role:     ${CliUtils.formatValue({ value: role })}`,
          `Country:  ${CliUtils.formatValue({ value: country })}`,
          `Language: ${CliUtils.formatValue({ value: language })}`,
          `Tags:     ${CliUtils.formatValue({ value: tags.length ? tags.join(', ') : '(none)' })}`,
          `Metadata: ${CliUtils.formatValue({ value: metadata, maxLength: 60 })}`,
        ].join('\n'),
      });
    });
};

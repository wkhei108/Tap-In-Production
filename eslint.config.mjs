import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      /*
       * `list()` scans the whole store. Vercel bills it as an advanced
       * operation — the bucket a Hobby plan only allows 2,000 of per month —
       * and this project never needs it: every pathname it reads is a fixed,
       * known string, so `findBlobUrl` in `photo-storage.ts` looks one up
       * directly and memoises the answer.
       *
       * Using it to find a known pathname is what exhausted a store's quota
       * in under a day, so it is banned rather than left as a footgun. If a
       * genuine need for enumeration ever arrives, disable this on the line
       * and say why.
       */
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@vercel/blob',
              importNames: ['list'],
              message:
                'list() scans the store and is billed as an advanced operation. Pathnames here are fixed — use findBlobUrl() from lib/photo-storage instead.',
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'coverage/**'],
  },
];

export default config;

const knipConfig = {
  $schema: 'https://unpkg.com/knip@latest/schema.json',
  entry: ['lib/db/scripts/crm-seed.ts'],
  ignore: [
    'proxy.ts',
    // Shadcn/UI components or custom registries are part of the template
    'components/ui/**',
    'components/ai-elements/**',
    // Chart/skeleton components are template examples
    'components/skeletons.tsx',
    'components/charts/**',
    // React Email templates, scanned by email dev server
    'emails/**',
    'lib/email/otp.ts',
    // Library barrel exports, infrastructure for template users
    'lib/**/index.ts',
    // Queue system - public API for manual job triggering
    'lib/queue/queues/**',
    'lib/queue/init-workers.ts',
    // Runtime user uploads, never source code
    'uploads/**',
  ],
  ignoreDependencies: [
    // Shadcn/UI dependencies (only used in components/ui/** which is ignored)
    '@radix-ui/*',
    'embla-carousel-react',
    'react-resizable-panels',
    'recharts',
    'tailwindcss',
    'tailwindcss-animate',
    'vaul',
    // Drag-and-drop toolkit kept available for template users
    '@dnd-kit/*',
    // They are used but not imported in the codebase
    'drizzle-zod',
    '@trpc/next',
  ],
  // Playwright specs are run by the Playwright CLI, not imported anywhere.
  playwright: {
    config: ['playwright.config.ts'],
    entry: ['e2e/**/*.{setup,spec}.ts'],
  },
  ignoreBinaries: ['shadcn'],
  rules: {
    files: 'error',
    dependencies: 'error',
    devDependencies: 'warn',
    unlisted: 'error',
    binaries: 'error',
    unresolved: 'error',
    exports: 'error',
    types: 'error',
    nsExports: 'error',
    nsTypes: 'error',
    duplicates: 'error',
    enumMembers: 'error',
    classMembers: 'error',
  },
};

export default knipConfig;

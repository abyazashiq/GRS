# AGENTS.md

This file contains guidelines and commands for agentic coding agents working in this Next.js repository.

## Build Commands

### Development
- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build production application
- `npm run start` - Start production server

### Code Quality
- `npm run lint` - Run ESLint for code linting
- `npx tsc --noEmit` - Run TypeScript type checking without emitting files

### Testing
This project currently has no test framework configured. When adding tests:
- Choose between Jest, Vitest, or React Testing Library
- Update package.json with test scripts
- Follow Next.js testing conventions

## Project Structure

```
grs/
├── app/                 # Next.js App Router
│   ├── globals.css     # Global styles with Tailwind
│   ├── layout.tsx      # Root layout component
│   └── page.tsx        # Home page component
├── next.config.ts      # Next.js configuration
├── eslint.config.mjs   # ESLint configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## Code Style Guidelines

### TypeScript Configuration
- Strict mode enabled (`"strict": true`)
- Target: ES2017
- JSX: React-JSX (no import needed for React)
- Path alias: `@/*` maps to `./`

### Import Conventions
- Use ES6 imports/exports
- Import React components directly (no `import React from "react"`)
- Use path aliases: `import Component from "@/app/page"`
- Third-party imports first, then local imports
- Type imports use `import type` when possible

### Component Style
- Use functional components with TypeScript
- Props interface: `Readonly<{ children: React.ReactNode }>`
- Export default for page components
- Use semantic HTML elements
- Apply Tailwind classes directly to elements

### CSS & Styling
- Tailwind CSS v4 with PostCSS
- CSS custom properties for theming
- Dark mode support via `prefers-color-scheme`
- Use Tailwind utility classes over custom CSS
- Responsive design with `sm:`, `md:`, `lg:` prefixes

### Naming Conventions
- Components: PascalCase (e.g., `HomePage`, `UserCard`)
- Files: kebab-case for utilities, PascalCase for components
- Variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Functions: camelCase, descriptive verbs

### Error Handling
- Use TypeScript for compile-time error prevention
- Implement proper error boundaries in React components
- Handle async operations with try/catch blocks
- Provide meaningful error messages to users

### ESLint Rules
- Follow Next.js recommended configuration
- Core Web Vitals rules enabled
- TypeScript-specific rules enforced
- Global ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

### Performance Guidelines
- Use Next.js Image component for optimization
- Implement proper loading states
- Optimize bundle size with dynamic imports
- Use React.memo for expensive components when needed

### Accessibility
- Semantic HTML elements
- Proper ARIA labels where needed
- Keyboard navigation support
- Color contrast compliance
- Alt text for all images

### Git & Committing
- Commit only when explicitly requested
- Run `npm run lint` and `npx tsc --noEmit` before commits
- Use conventional commit messages if required
- Never commit sensitive data (API keys, secrets)

## Development Workflow

1. Always run `npm run lint` after making changes
2. Check TypeScript compilation with `npx tsc --noEmit`
3. Test in development server with `npm run dev`
4. Build verification with `npm run build` before deployment

## Framework-Specific Notes

- Next.js 16.1.4 with App Router
- React 19.2.3 with React-JSX transform
- Tailwind CSS v4 for styling
- TypeScript 5 for type safety
- ESLint 9 for code quality

When working on this codebase, prioritize type safety, performance, and maintainability while following Next.js best practices.
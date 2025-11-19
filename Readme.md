# Vitruvium Character Card

Unofficial tool for creating character cards for the Vitruvium system.

## Tech Stack

- Vue 3 with Composition API
- TypeScript
- Vite
- Pinia for state management
- Tailwind CSS for styling
- Vitest for unit testing
- Playwright for E2E testing
- html2canvas for PNG export

## Features

- Create and edit character information
- Manage skills and categories
- Import/export character data as JSON
- Export character card as PNG with metadata
- Theme customization (dark/light/custom)

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
npm run build

# Runs the end-to-end tests
npm run test:e2e
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

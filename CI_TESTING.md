# CI & Testing Guide

This document outlines the continuous integration (CI) and testing setup for the kcb.pro monorepo.

## 🚀 Quick Start

### Local Development Commands

```bash
# Install dependencies
bun install

# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Lint code
bun run lint

# Fix linting issues
bun run lint:fix

# Type check
bun run typecheck

# Build all apps
bun run build:home
bun run build:router
```

### Individual App Commands

```bash
# Home app
cd apps/home
bun run test        # Run tests
bun run lint        # Lint code
bun run typecheck   # Type check
bun run build       # Build app

# Router app
cd apps/router
bun run test        # Run tests
bun run lint        # Lint code
bun run typecheck   # Type check
bun run build       # Build app
```

## 🔧 CI Pipeline

The CI pipeline runs automatically on:

- **Push** to `main` or `develop` branches
- **Pull requests** to `main`

### Pipeline Jobs

The CI workflow (`.github/workflows/ci.yml`) includes four main jobs that run in parallel:

#### 1. **Change Detection** 🔍

- Detects which parts of the monorepo have changed
- Uses git-based comparison to avoid GitHub API permission issues
- Optimizes CI by only running checks for changed components

#### 2. **Lint Check** 📋

- Runs ESLint across the entire codebase
- Uses the configuration from `eslint.config.mts`
- Enforces code style and best practices

#### 3. **TypeScript Type Checking** 🔍

- Runs `tsc --noEmit` for each app individually
- Ensures type safety without generating output files
- Uses matrix strategy for parallel execution

#### 4. **Build Verification** 🏗️

- Builds both home and router apps
- Ensures production builds work correctly
- Uses matrix strategy for parallel execution

#### 5. **Test Execution** 🧪

- Runs the complete test suite using Vitest
- Uses jsdom environment for React component testing
- Includes proper cleanup and isolation between tests

### Smart Change Detection

The CI pipeline only runs checks for changed components:

| Changed Files     | Jobs Triggered                                 |
| ----------------- | ---------------------------------------------- |
| `apps/home/**`    | Lint, TypeCheck (home), Build (home), Test     |
| `apps/router/**`  | Lint, TypeCheck (router), Build (router), Test |
| `libs/**`         | Lint, Test                                     |
| Root config files | All jobs                                       |

Root config files include:

- `*.json`, `*.ts`, `*.js` files
- `.github/**` (workflow files)
- `eslint.config.*`
- `vitest.config.*`

## 🧪 Testing Setup

### Framework & Tools

- **Test Runner**: [Vitest](https://vitest.dev/) - Fast Vite-native test runner
- **Testing Library**: [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/) - Simple and complete testing utilities
- **Environment**: jsdom - Browser-like environment for component testing
- **Matchers**: [@testing-library/jest-dom](https://github.com/testing-library/jest-dom) - Custom matchers for DOM testing

### Configuration Files

#### Root Level

- `vitest.config.ts` - Root Vitest configuration
- `vitest.setup.ts` - Global test setup (imports jest-dom matchers)

#### App Level

- `apps/home/vitest.config.ts` - Home app specific config
- `apps/home/src/test/setup.ts` - Home app test setup
- `apps/router/vitest.config.ts` - Router app specific config (if exists)

### Test Structure

```
apps/
├── home/
│   ├── src/
│   │   ├── App.test.tsx          # Component tests
│   │   └── test/
│   │       └── setup.ts          # Test setup
│   └── vitest.config.ts          # Vitest config
└── router/
    ├── src/
    │   └── App.test.tsx          # Component tests
    └── vitest.config.ts          # Vitest config
```

## 📋 Linting & Code Quality

### ESLint Configuration

The project uses a modern flat config setup (`eslint.config.mts`):

- **Base**: ESLint recommended rules
- **TypeScript**: TypeScript ESLint recommended rules
- **React**: React plugin with automatic JSX runtime detection
- **Environment**: Browser and Node.js globals

### Key Rules

- React components don't need to import React (new JSX transform)
- TypeScript strict mode enabled
- Consistent code formatting enforced

### Running Linting

```bash
# Check for issues
bun run lint

# Auto-fix issues
bun run lint:fix

# Lint specific files
bunx eslint src/App.tsx
```

## 🔍 Type Checking

### TypeScript Configuration

Each app has its own `tsconfig.json` with:

- Strict type checking enabled
- Modern ES modules support
- React JSX support
- Path mapping for clean imports

### Running Type Checks

```bash
# Check all apps
bun run typecheck

# Check specific app
bun run typecheck:home
bun run typecheck:router

# Check from app directory
cd apps/home && bun run typecheck
```

## 🚨 Troubleshooting

### Common Issues

#### Test Failures

```bash
# Error: document is not defined
```

**Solution**: Ensure you're using Vitest (`bun run test`), not Bun's test runner (`bun test`)

#### Multiple Elements Found

```bash
# Error: Found multiple elements with the text: "..."
```

**Solution**: Add `cleanup()` in `afterEach` and use more specific queries like `getByRole()`

#### Lint Errors

```bash
# Error: 'React' must be in scope when using JSX
```

**Solution**: This rule is disabled in our config for new JSX transform

### Getting Help

1. Check the CI logs in GitHub Actions for detailed error messages
2. Run commands locally to reproduce issues
3. Ensure all dependencies are installed with `bun install`
4. Check that you're in the correct directory when running commands

## 🔄 Workflow Integration

### Pre-commit Hooks

The project uses Husky for Git hooks:

- **commit-msg**: Validates commit messages using commitlint
- **pre-commit**: Runs Prettier on staged files via lint-staged

### Release Process

The monorepo uses automated semantic versioning:

- Conventional commits determine version bumps
- GitHub Actions automatically creates releases
- Each app/lib is versioned independently

For more details, see `RELEASE.md`.

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)

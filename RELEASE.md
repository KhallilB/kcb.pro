# Release Process

This document outlines the automated semantic versioning and release process for apps and libraries in this monorepo.

## Overview

Each app and library maintains independent semantic versioning using [release-it](https://github.com/release-it/release-it) with conventional changelog support. The release process is **fully automated** using GitHub Actions and integrates with your existing commit lint setup using conventional commits.

## 🤖 Automated Release Process

Releases are automatically triggered when:

1. **Pull Request Merged**: When a PR is merged to `main`/`master` branch
2. **Direct Push**: When commits are pushed directly to `main`/`master` branch
3. **Manual Trigger**: Using GitHub Actions workflow dispatch

### What Gets Released

The system automatically detects which apps/libs have changes and only releases those:

- **Router App** (`apps/router/`) → Creates `router@x.y.z` release
- **Home App** (`apps/home/`) → Creates `home@x.y.z` release
- **Styles Library** (`libs/styles/`) → Creates `styles@x.y.z` release

## Prerequisites

- Ensure all commits follow [Conventional Commits](https://www.conventionalcommits.org/) format
- Your commit lint is already configured to enforce this

## 🔧 Manual Release Commands (Optional)

> **Note**: These manual commands are available as backup options. In most cases, you should rely on the automated GitHub Actions workflow.

### Quick Release Commands

```bash
# Release specific app/lib (manual override)
bun run release:router      # Release router app
bun run release:home        # Release home app
bun run release:styles      # Release styles lib

# Dry run (preview changes without releasing)
bun run release:router:dry  # Preview router release
bun run release:home:dry    # Preview home release
bun run release:styles:dry  # Preview styles release
```

### Using the Release Helper Script

```bash
# Release with helper script (manual override)
node scripts/release.js apps/router
node scripts/release.js apps/home
node scripts/release.js libs/styles

# Dry run with helper script
node scripts/release.js apps/router --dry-run
node scripts/release.js libs/styles --dry-run
```

## 🚀 GitHub Actions Workflows

### Automatic Releases

1. **On PR Merge/Push to Main**: Automatically detects changes and releases affected apps/libs
2. **Manual Trigger**: Go to Actions → Release → Run workflow
   - Choose target: `all`, `apps/router`, `apps/home`, or `libs/styles`
   - Option for dry-run preview

### PR Release Previews

When you open a PR, GitHub Actions will:

- Detect which apps/libs will be affected
- Show a preview of what versions will be released
- Add a comment to the PR with release information

## Release Process

1. **Make changes** following conventional commit format:

   ```bash
   git commit -m "feat(router): add new navigation component"
   git commit -m "fix(home): resolve responsive layout issue"
   git commit -m "docs(styles): update component documentation"
   ```

2. **Preview the release** (recommended):

   ```bash
   bun run release:router:dry
   ```

3. **Execute the release**:
   ```bash
   bun run release:router
   ```

## What Happens During Release

1. **Version Bump**: Automatically determines the next version based on conventional commits:
   - `feat:` → minor version bump (0.1.0 → 0.2.0)
   - `fix:` → patch version bump (0.1.0 → 0.1.1)
   - `BREAKING CHANGE:` → major version bump (0.1.0 → 1.0.0)

2. **Changelog Generation**: Updates `CHANGELOG.md` with new features, fixes, and breaking changes

3. **Git Operations**:
   - Creates a commit with the version bump
   - Creates a git tag (e.g., `router@1.2.3`)
   - Pushes changes and tags to remote

4. **GitHub Release**: Creates a GitHub release with the changelog

## Commit Message Format

Follow the conventional commits specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

### Examples

```bash
git commit -m "feat(router): add user authentication flow"
git commit -m "fix(home): resolve mobile viewport issues"
git commit -m "docs(styles): add component usage examples"
git commit -m "chore(router): update dependencies"
```

## Configuration Files

- **Root config**: `.release-it.json` - Base configuration
- **App configs**: `apps/*/release-it.json` - App-specific overrides
- **Lib configs**: `libs/*/.release-it.json` - Library-specific overrides

## Troubleshooting

### Common Issues

1. **No commits since last release**: Release-it will skip if no conventional commits are found
2. **Dirty working directory**: Commit or stash changes before releasing
3. **Missing GitHub token**: Set `GITHUB_TOKEN` environment variable for GitHub releases

### Manual Version Override

If you need to specify a version manually:

```bash
cd apps/router && release-it --increment=major
cd apps/router && release-it --new-version=2.0.0
```

## Best Practices

1. Always run dry-run first to preview changes
2. Use descriptive commit messages with proper scopes
3. Group related changes in single commits when possible
4. Test your changes before releasing
5. Review the generated changelog before confirming release

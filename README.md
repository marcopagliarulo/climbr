# Climbr
![Climbr](./packages/core/climbr.svg)

> A Node.js CLI framework that handles the mountain, so you can focus on the summit.

Climbr is an opinionated TypeScript-first framework for building Node.js CLI tools. It takes care of command wiring, persistent configuration, interactive prompts, and output formatting — so you can spend your time on what your CLI actually does.

## Packages

| Package | Description |
|---|---|
| [`@climbr/core`](./packages/core) | The framework — auto-discovery, config system, CLI utilities |
| [`climbr-demo`](./packages/demo) | Reference CLI that exercises the framework |

## Development

This repository is an npm workspace monorepo. All commands run from the root.

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Lint all packages
npm run lint

# Format all packages
npm run format
```

To work on a single package, use the `-w` flag:

```bash
npm run build -w packages/core
```

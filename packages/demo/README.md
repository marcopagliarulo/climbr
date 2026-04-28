# @climbr/demo

A reference CLI built with [@climbr/core](https://github.com/marcopagliarulo/climbr/tree/main/packages/core) that exercises the main features of the framework.

## Usage

```bash
npx @climbr/demo <command>
```

## Commands

### `display`

Runs through every output and messaging utility available in `@climbr/core`: inline messages, boxed messages, spinner, and value formatting.

```bash
climbr-demo display
climbr-demo display --debug   # also shows debug output
```

### `inputs`

Exercises every interactive prompt type: text, number, password, boolean, select, search, confirm, array, and config-backed defaults.

```bash
climbr-demo inputs
```

### `greet <name>`

A minimal plugin command registered via `.use()` rather than auto-discovery — demonstrates explicit command registration.

```bash
climbr-demo greet World
climbr-demo greet World --uppercase
```

### `config`

Built-in config command provided by the framework. Reads and writes persistent, Zod-validated configuration.

```bash
climbr-demo config get
climbr-demo config set
climbr-demo config delete
```

## Source

The source lives in the [climbr monorepo](https://github.com/marcopagliarulo/climbr) under `packages/demo`.

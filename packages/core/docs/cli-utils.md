# CliUtils

`CliUtils` is a static utility class that provides a consistent interface for all user-facing output and interactive prompts. It wraps [Chalk](https://github.com/chalk/chalk), [Boxen](https://github.com/sindresorhus/boxen), [Ora](https://github.com/sindresorhus/ora), and [@inquirer/prompts](https://github.com/SBoudrias/Inquirer.js).

```ts
import { CliUtils } from '@climbr/core';
```

---

## Output methods

### `showError(message, exit?)`

Displays an error. When `exit` is `true` (default), calls `program.error()` which prints the message and exits with code 1. When `false`, prints to stderr without exiting.

```ts
CliUtils.showError('Something went wrong');          // exits
CliUtils.showError('Non-fatal warning', false);      // logs only
```

### `showSuccess(message)`

```ts
CliUtils.showSuccess('File saved.');
// → Success: File saved.  (green)
```

### `showInfo(message)`

```ts
CliUtils.showInfo('Loading configuration…');
// → Info: Loading configuration…  (blue)
```

### `showWarning(message)`

```ts
CliUtils.showWarning('Deprecated flag used.');
// → Warning: Deprecated flag used.  (yellow)
```

### `showDebug(message)`

Only visible when `process.env.DEBUG === 'true'` (set by the `--debug` flag or manually).

```ts
CliUtils.showDebug('Cache miss for key "foo"');
// → Debug: Cache miss for key "foo"  (cyan, only with DEBUG=true)
```

---

## Boxed messages

All boxed methods accept `{ message: string, title?: string }`.

```ts
CliUtils.showBoxedInfoMessage({ title: 'Info', message: 'Done.' });
CliUtils.showBoxedSuccessMessage({ title: 'Success', message: 'Deployed!' });
CliUtils.showBoxedErrorMessage({ title: 'Error', message: 'Build failed.' });
CliUtils.showBoxedDebugMessage({ title: 'Debug', message: 'x = 42' });
```

Border colors: blue (info), green (success), red (error), cyan (debug).

---

## Spinner

```ts
CliUtils.startSpinner('Building project…');

// ... async work ...

CliUtils.stopSpinner(true, 'Build complete.');    // success (✔)
CliUtils.stopSpinner(false, 'Build failed.');     // failure (✖)
```

---

## `formatValue`

Formats any value for display, truncating long strings.

```ts
CliUtils.formatValue({ value: 'hello' })                    // "hello"
CliUtils.formatValue({ value: 42 })                         // "42"
CliUtils.formatValue({ value: true })                       // "true"
CliUtils.formatValue({ value: { a: 1 } })                   // '{"a": 1}'
CliUtils.formatValue({ value: null })                       // "(not set)"  (gray)
CliUtils.formatValue({ value: undefined })                  // "(not set)"  (gray)
CliUtils.formatValue({ value: 'long string…', maxLength: 20 })  // truncates with "..."
```

Default `maxLength` is 50.

---

## Prompts

All prompts are async and return a value once the user confirms.

### `promptInput`

Free-form text input.

```ts
const name = await CliUtils.promptInput({
  message: 'Your name:',
  required: true,                                   // optional
  defaultValue: 'Alice',                            // optional
  validate: (v) => v.length >= 2 || 'Too short',   // optional
});
```

Returns `Promise<string>` (trimmed).

---

### `promptNumber`

Numeric input with optional bounds.

```ts
const port = await CliUtils.promptNumber({
  message: 'Port:',
  min: 1024,
  max: 65535,
  step: 1,
  required: true,
  defaultValue: 3000,
});
```

Returns `Promise<number | undefined>`.

---

### `promptPassword`

Masked text input.

```ts
const token = await CliUtils.promptPassword({
  message: 'API token:',
  validate: (v) => v.length >= 8 || 'Token too short',
});
```

Returns `Promise<string>`.

---

### `promptBoolean`

True / False select.

```ts
const isPublic = await CliUtils.promptBoolean('Make profile public?');
```

Returns `Promise<boolean>`.

---

### `promptConfirm`

Y / N confirmation.

```ts
const ok = await CliUtils.promptConfirm({
  message: 'Delete all files?',
  defaultValue: false,
});
```

Returns `Promise<boolean>`.

---

### `promptSelect`

Pick one from a fixed list of choices.

```ts
const role = await CliUtils.promptSelect<string>({
  message: 'Select your role:',
  defaultValue: 'developer',
  choices: [
    { value: 'developer', name: 'Developer' },
    { value: 'designer', name: 'Designer' },
    { value: 'manager', name: 'Manager' },
  ],
});
```

Returns `Promise<T>`.

---

### `promptSearchChoices`

Filter a static list of string choices by typing.

```ts
const country = await CliUtils.promptSearchChoices({
  message: 'Select country:',
  choices: [
    { value: 'us', name: 'United States' },
    { value: 'gb', name: 'United Kingdom' },
    { value: 'de', name: 'Germany' },
  ],
  validate: (v) => !!v || 'Required',
});
```

Returns `Promise<string>`.

---

### `promptSearch`

Async source search — the `source` function is called on every keystroke with the current search term.

```ts
const language = await CliUtils.promptSearch<string>({
  message: 'Programming language:',
  source: async (term) => {
    const all = ['TypeScript', 'JavaScript', 'Rust', 'Go'];
    const filtered = term
      ? all.filter((l) => l.toLowerCase().includes(term.toLowerCase()))
      : all;
    return filtered.map((l) => ({ value: l, name: l }));
  },
});
```

Returns `Promise<T>`.

---

### `promptArray`

Collect a variable-length list by prompting repeatedly until the user submits an empty input.

```ts
const tags = await CliUtils.promptArray({
  message: 'Add a tag',     // shown as "Add a tag (To stop adding elements, submit an empty value)"
  validate: (v) => v.length <= 30 || 'Tag too long',
});
// tags: string[]
```

Returns `Promise<string[]>`.

---

### `promptArrayOfNumber`

Same as `promptArray` but collects numbers. Stops when the user submits without entering a value.

```ts
const ports = await CliUtils.promptArrayOfNumber({
  message: 'Add a port',
  validate: (v) => (v !== undefined && v > 0) || 'Must be a positive number',
});
// ports: number[]
```

Returns `Promise<number[]>`.

---

### `promptObject`

Open a temporary JSON file in the user's `$EDITOR`. The result is parsed and returned as an object.

```ts
const metadata = await CliUtils.promptObject({
  message: 'Edit metadata:',
  defaultValue: JSON.stringify({ website: '', bio: '' }, null, 2),
  validate: (raw) => {
    try { JSON.parse(raw); return true; }
    catch { return 'Must be valid JSON'; }
  },
});
// metadata: object
```

Returns `Promise<object>`.

---

## Type reference

All prompt option types are exported:

```ts
import type {
  PromptInput,
  PromptNumber,
  PromptPassword,
  PromptConfirm,
  PromptSelect,
  PromptSearchChoices,
  PromptSearch,
  PromptArray,
  PromptObject,
  InquirerChoice,
  FormatValue,
  BoxedMessage,
} from '@climbr/core';
```

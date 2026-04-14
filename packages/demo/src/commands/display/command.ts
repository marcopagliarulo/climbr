import { CliUtils, Command } from '@climbr/core';

export default function displayCommand(): Command {
  return new Command('display')
    .description(
      'Showcase every display and messaging utility from @climbr/core',
    )
    .option('-d, --debug', 'Enable debug output for this run')
    .action(async (opts: { debug?: boolean }) => {
      if (opts.debug) {
        process.env['DEBUG'] = 'true';
      }

      // ── Inline message types ──────────────────────────────────────────────
      console.log('\n--- Inline messages ---\n');

      CliUtils.showInfo('This is an info message.');
      CliUtils.showSuccess('This is a success message.');
      CliUtils.showWarning('This is a warning message.');
      CliUtils.showDebug(
        'This is a debug message (only visible with --debug or DEBUG=true).',
      );
      // showError exits by default; pass exit=false to keep the process alive
      CliUtils.showError('This is a non-fatal error message.', false);

      // ── Boxed message types ───────────────────────────────────────────────
      console.log('\n--- Boxed messages ---');

      CliUtils.showBoxedInfoMessage({
        title: 'Info',
        message: 'This is a boxed info message.',
      });

      CliUtils.showBoxedSuccessMessage({
        title: 'Success',
        message: 'This is a boxed success message.',
      });

      CliUtils.showBoxedErrorMessage({
        title: 'Error',
        message: 'This is a boxed error message.',
      });

      CliUtils.showBoxedDebugMessage({
        title: 'Debug',
        message: 'This is a boxed debug message.',
      });

      // ── formatValue ───────────────────────────────────────────────────────
      console.log('\n--- formatValue ---\n');

      const examples: Array<{
        label: string;
        value:
          | Parameters<typeof CliUtils.formatValue>[0]['value']
          | null
          | undefined;
        maxLength?: number;
      }> = [
        { label: 'string', value: 'Hello, world!' },
        { label: 'number', value: 42 },
        { label: 'boolean', value: true },
        { label: 'object', value: { key: 'value', count: 3 } },
        {
          label: 'truncated (maxLength=20)',
          value: 'This string is quite long and will be cut off',
          maxLength: 20,
        },
        { label: 'null', value: null },
        { label: 'undefined', value: undefined },
      ];

      for (const ex of examples) {
        const formatted =
          ex.value === null || ex.value === undefined
            ? CliUtils.formatValue({
                value: ex.value as unknown as string,
                maxLength: ex.maxLength,
              })
            : CliUtils.formatValue({
                value: ex.value,
                maxLength: ex.maxLength,
              });
        console.log(`  ${ex.label.padEnd(30)} → ${formatted}`);
      }

      // ── Spinner ───────────────────────────────────────────────────────────
      console.log('\n--- Spinner ---\n');

      CliUtils.startSpinner('Running a task…');
      await new Promise((resolve) => setTimeout(resolve, 1500));
      CliUtils.stopSpinner(true, 'Task completed successfully!');

      CliUtils.startSpinner('Running a failing task…');
      await new Promise((resolve) => setTimeout(resolve, 1500));
      CliUtils.stopSpinner(false, 'Task failed.');

      console.log('');
      CliUtils.showSuccess('Display demo complete.');
    });
}

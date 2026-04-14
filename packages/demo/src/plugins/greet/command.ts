import { CliUtils, Command } from '@climbr/core';

export default function greetCommand(): Command {
  return new Command('greet')
    .description('Greet someone by name — loaded as an explicit plugin via .use()')
    .argument('<name>', 'Name of the person to greet')
    .option('-u, --uppercase', 'Print the greeting in uppercase')
    .action((name: string, opts: { uppercase?: boolean }) => {
      let message = `Hello, ${name}!`;
      if (opts.uppercase) message = message.toUpperCase();
      CliUtils.showBoxedSuccessMessage({ title: 'Greeting', message });
    });
}

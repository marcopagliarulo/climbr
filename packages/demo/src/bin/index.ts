import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCli } from '@climbr/core';
import greetCommand from '../plugins/greet/command.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const cli = createCli({
  name: 'climbr-demo',
  version: '1.0.0',
  description: 'Demo CLI showcasing climbr-core capabilities',
  commandsDir: join(__dirname, '../commands'),
  configDir: join(__dirname, '../globalConfig'),
  configStoreName: 'climbr-demo',
});

// Plugin commands live outside commandsDir and must be registered explicitly.
cli.use(greetCommand());

await cli.run();

import path from 'path';
import { spawnSync } from 'child_process';
import { variantTestMap } from '../misconfigurations/variant-test-map';

const jestCli = path.join(process.cwd(), 'node_modules', 'jest', 'bin', 'jest.js');
const availableVariants = Object.keys(variantTestMap);

function parseVariantArgument(args: string[]) {
  if (args.length === 0) return undefined;
  if (args.length === 1 && (args[0] === '--help' || args[0] === '-h')) {
    console.log('Usage: npm run test:variants -- [--variant <name>]');
    console.log(`Available variants: ${availableVariants.join(', ')}`);
    process.exit(0);
  }
  if (args.length !== 2 || args[0] !== '--variant') {
    throw new Error('Usage: npm run test:variants -- [--variant <name>]');
  }
  if (!availableVariants.includes(args[1])) {
    throw new Error(`Unknown variant '${args[1]}'. Available variants: ${availableVariants.join(', ')}`);
  }
  return args[1];
}

const selectedVariant = parseVariantArgument(process.argv.slice(2));
const variantsToRun = Object.entries(variantTestMap).filter(([variant]) =>
  !selectedVariant || variant === selectedVariant
);

for (const [variant, definition] of variantsToRun) {
  console.log(`\n=== ${variant} ===`);
  const result = spawnSync(process.execPath, [jestCli, '--runInBand', '--runTestsByPath', definition.focusedTest], {
    cwd: process.cwd(),
    env: { ...process.env, APP_VARIANT: variant },
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(selectedVariant
  ? `\nMisconfiguration variant '${selectedVariant}' passed.`
  : `\nAll ${variantsToRun.length} misconfiguration variant suites passed.`);
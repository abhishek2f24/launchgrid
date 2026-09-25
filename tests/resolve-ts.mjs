/**
 * Lets `node --test` resolve the extensionless relative imports the app uses.
 *
 * The source is written for a bundler, so `import './currency'` has no
 * extension. Node's ESM resolver requires one. Rather than rewrite every
 * import across the app to suit the test runner — which would be the tail
 * wagging the dog — this hook appends `.ts` for relative specifiers that
 * resolve to a TypeScript file.
 *
 * Node's own type stripping does the rest, so the suite still needs no
 * dependency and no build step.
 */
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
      const base = new URL(specifier, context.parentURL);
      for (const candidate of ['.ts', '.tsx', '/index.ts']) {
        const withExt = new URL(base.href + candidate);
        if (existsSync(fileURLToPath(withExt))) {
          return nextResolve(specifier + candidate, context);
        }
      }
    }
    return nextResolve(specifier, context);
  },
});

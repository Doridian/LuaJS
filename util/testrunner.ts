import { spec, tap } from 'node:test/reporters';
import { run } from 'node:test';
import { globSync } from 'glob';

let testReporter = tap;
if (!process.env.CI) {
    testReporter = spec as unknown as any; // NodeJS types are wrong, this works!
}

run({
    files: globSync("test/**/*.ts"),
})
.compose(testReporter)
.pipe(process.stdout);

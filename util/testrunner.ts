import { spec as Spec } from 'node:test/reporters';
import { run } from 'node:test';
import { globSync } from 'glob';


run({
    files: globSync("test/**/*.ts"),
})
.on('test:fail', () => {
    process.exitCode = 1;
  })
.compose(new Spec())
.pipe(process.stdout);

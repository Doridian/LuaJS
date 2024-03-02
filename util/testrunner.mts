import { spec as Spec, tap } from 'node:test/reporters';
import { run } from 'node:test';
import { globSync } from 'glob';

const runStream = run({
    files: globSync("test/**/*.mjs"),
})
let outputStream: {
    pipe: (stream: NodeJS.WritableStream) => void;
};
if (process.env['CI']) {
    outputStream = runStream.compose(tap);
} else {
    outputStream = runStream.compose(new Spec());
}
outputStream.pipe(process.stdout);

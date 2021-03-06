const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const assert = require('assert');
const glob = require('glob');

const bin = path.resolve(`bin.js`);

function normalize(str) {
	return str.replace(/^\s+$/gm, '').trim();
}

describe('svelte-cli', () => {
	fs.readdirSync('test/samples').forEach(dir => {
		if (dir[0] === '.') return;

		// append .solo to test dir to only run that test
		const solo = /\.solo$/.test(dir);

		(solo ? it.only : it)(dir, done => {
			process.chdir(`${__dirname}/samples/${dir}`);

			const command = fs.readFileSync('command.sh', 'utf-8');

			child_process.exec(
				`
				alias svelte=${bin}
				chmod u+x ${bin}
				mkdir -p actual
				rm -rf actual/*
				${command}
			`,
				err => {
					if (err) {
						done(err);
						return;
					}

					const actual = glob
						.sync('**', { cwd: 'actual', nodir: true })
						.map(file => {
							return {
								file,
								contents: normalize(fs.readFileSync(`actual/${file}`, 'utf-8'))
							};
						});

					const expected = glob
						.sync('**', { cwd: 'expected', nodir: true })
						.map(file => {
							return {
								file,
								contents: normalize(
									fs.readFileSync(`expected/${file}`, 'utf-8')
								)
							};
						});

					actual.forEach((a, i) => {
						const e = expected[i];

						assert.equal(a.file, e.file, 'File list mismatch');

						if (/\.map$/.test(a.file)) {
							assert.deepEqual(JSON.parse(a.contents), JSON.parse(e.contents));
						} else {
							assert.equal(a.contents, e.contents);
						}
					});

					done();
				}
			);
		});
	});
});

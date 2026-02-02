const { spawn } = require('child_process');
const fs = require('fs');

const logStream = fs.createWriteStream('test_output.log');

const child = spawn('npx', ['ts-node', 'test/full_api_test.ts'], {
  shell: true,
});

child.stdout.pipe(logStream);
child.stderr.pipe(logStream);
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

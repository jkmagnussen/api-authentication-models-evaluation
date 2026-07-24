import fs from 'fs';

function load(name: string) {
  return JSON.parse(fs.readFileSync(`${name}-performance.json`, 'utf8'));
}

const jwt = load('jwt');
const oauth = load('oauth');
const sessions = load('sessions');

const rows = [
  ['Model', 'Avg(ms)', 'p95(ms)', 'p99(ms)', 'Throughput(req/s)'],
  ['JWT', jwt.avg, jwt.p95, jwt.p99, jwt.throughput],
  ['Sessions', sessions.avg, sessions.p95, sessions.p99, sessions.throughput],
  ['OAuth', oauth.avg, oauth.p95, oauth.p99, oauth.throughput],
];

const csv = rows.map((r) => r.join(',')).join('\n');

fs.writeFileSync('performance-summary.csv', csv);

console.log('Generated performance-summary.csv');

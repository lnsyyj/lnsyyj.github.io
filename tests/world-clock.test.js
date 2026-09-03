const assert = require('node:assert/strict');
const { locations, normalizeLocations } = require('../assets/js/world-clock-data.js');

assert.ok(locations.some((location) => location.id === 'china-shanghai' && location.timeZone === 'Asia/Shanghai'), 'China / Shanghai must be selectable');
assert.ok(locations.some((location) => location.id === 'usa-new-york' && location.timeZone === 'America/New_York'), 'United States / New York must be selectable');
assert.deepEqual(
  normalizeLocations(['china-shanghai', 'china-shanghai', 'unknown', 'japan-tokyo']),
  ['china-shanghai', 'japan-tokyo'],
  'saved dashboard entries must remove duplicates and unavailable locations'
);

console.log('World clock data tests passed.');

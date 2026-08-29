const assert = require('assert');
const {
  normalizeWebApiPayload,
  mergeNormalizedPayloads,
  loadPriorityCompetitionIds,
  makeWebCompetitionApiUrl,
} = require('../scrapers/365-api');

assert.ok(loadPriorityCompetitionIds('football').includes(104), 'MLS id from popularity list');
assert.ok(loadPriorityCompetitionIds('football').includes(72), 'Liga Profesional id from popularity list');
assert.deepStrictEqual(loadPriorityCompetitionIds('basketball'), []);

assert.match(
  makeWebCompetitionApiUrl([104, 72], '2026-08-29'),
  /webws\.365scores\.com\/web\/games\/\?.*competitions=104%2C72.*startDate=29%2F08%2F2026/
);

const web = normalizeWebApiPayload({
  countries: [{ id: 18, name: 'USA' }],
  competitions: [{ id: 104, name: 'MLS', countryId: 18 }],
  games: [{
    id: 4621406,
    competitionId: 104,
    startTime: '2026-08-29T20:30:00-03:00',
    statusText: 'Scheduled',
    statusGroup: 2,
    homeCompetitor: { name: 'Inter Miami', shortName: 'Miami', symbolicName: 'MIA' },
    awayCompetitor: { name: 'CF Montreal', shortName: 'Montreal', symbolicName: 'MTL' },
  }],
});

assert.strictEqual(web.games.length, 1);
assert.strictEqual(web.games[0].mobileDateKey, '2026-08-29');
assert.strictEqual(web.games[0].mobileTime, '20:30');
assert.strictEqual(web.games[0].homeCompetitor.name, 'Inter Miami');
assert.strictEqual(web.games[0].statusText, 'scheduled');

const mobile = {
  countries: [{ id: 18, name: 'USA' }],
  competitions: [{ id: 104, name: 'MLS', countryId: 18 }],
  games: [{
    id: 1,
    mobileDateKey: '2026-08-29',
    mobileTime: '17:30',
    competitionId: 104,
    statusText: 'scheduled',
    homeCompetitor: { name: 'Seattle Sounders', shortName: 'SEA' },
    awayCompetitor: { name: 'Chicago Fire', shortName: 'CHI' },
    competitors: [],
  }],
};

const merged = mergeNormalizedPayloads(mobile, web);
assert.strictEqual(merged.games.length, 2, 'backfill adds MLS evening game absent from mobile feed');
assert.strictEqual(merged._backfillAdded, 1);
assert.ok(merged.games.some(game => String(game.id) === '4621406'));

const mergedAgain = mergeNormalizedPayloads(merged, web);
assert.strictEqual(mergedAgain._backfillAdded, 0, 'same web game id is not duplicated');

console.log('test-365-web-backfill: ok');

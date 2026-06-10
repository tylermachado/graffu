import fs from 'fs';

const squads = JSON.parse(fs.readFileSync('./src/data/2026/squads.json', 'utf8'));
const teams = JSON.parse(fs.readFileSync('./src/data/teams.json', 'utf8'));

// Create nation -> confederation map
const nationToConfederation = Object.fromEntries(teams.map(t => [t.nation, t.confederation]));

// Calculate retention rate per confederation
const confedStats = {};

for (const [nation, players] of Object.entries(squads)) {
	const confederation = nationToConfederation[nation];
	if (!confederation) {
		console.warn(`No confederation found for ${nation}`);
		continue;
	}
	
	if (!confedStats[confederation]) {
		confedStats[confederation] = { domestic: 0, total: 0 };
	}
	
	const domesticCount = players.filter(p => p.club_nation === nation).length;
	confedStats[confederation].domestic += domesticCount;
	confedStats[confederation].total += players.length;
}

// Calculate retention rates
const confederations = ['AFC', 'CONCACAF', 'UEFA', 'CONMEBOL', 'CAF', 'OFC'];
console.log('\n2026 Domestic Retention Rates:');
console.log('-----');
     
for (const confed of confederations) {
	if (confedStats[confed]) {
		const rate = Math.round((confedStats[confed].domestic / confedStats[confed].total) * 100);
		console.log(`${confed}: ${rate}%`);
	}
}

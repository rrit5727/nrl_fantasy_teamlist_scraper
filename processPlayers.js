const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvParser = require('csv-parser');

// Function to format player name
function formatPlayerName(fullName) {
    const names = fullName.split(' ');
    if (names.length < 2) return fullName;
    return `${names[0][0]}. ${names.slice(1).join(' ')}`;
}

// Function to process player data
async function processPlayers(inputFilePath) {
    const players = [];
    
    // Valid position prefixes that indicate players we want to include
    const validPrefixes = ['F.', 'W.', 'C.', 'H.', 'P.', '2. Row', 'L.', 'I.'];

    // Read and process the CSV file
    fs.createReadStream(inputFilePath)
        .pipe(csvParser())
        .on('data', (row) => {
            const line = row['Player Name'];
            if (line && validPrefixes.some(prefix => line.startsWith(prefix))) {
                // Extract the player name (everything after "is number XX ")
                const match = line.match(/is number \d+ (.+)$/);
                if (match) {
                    const playerName = match[1].trim();
                    const formattedName = formatPlayerName(playerName);
                    players.push({ name: formattedName });
                }
            }
        })
        .on('end', async () => {
            // Set up CSV writer
            const csvWriter = createCsvWriter({
                path: 'nrl_players.csv',
                header: [
                    { id: 'name', title: 'Player Name' }
                ]
            });

            // Write to CSV file
            await csvWriter.writeRecords(players);
            console.log(`Successfully processed ${players.length} players to nrl_players.csv`);
        })
        .on('error', (error) => {
            console.error('An error occurred while reading the CSV file:', error);
        });
}

// Sample usage
const inputFilePath = 'players.csv'; // Path to the input CSV file
processPlayers(inputFilePath).catch(console.error);
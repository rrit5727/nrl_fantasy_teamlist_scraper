const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvParser = require('csv-parser');

// Function to format player name (now keeping full name)
function formatPlayerName(fullName) {
    return fullName; // Return the full name unchanged
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
                // Extract both position and player name
                const match = line.match(/^(.+?)\. is number (\d+) (.+)$/);
                if (match) {
                    const position = match[1];
                    const number = match[2];
                    const playerName = match[3].trim();
                    
                    // Keep the position with the player name
                    const formattedEntry = `${position}. is number ${number} ${formatPlayerName(playerName)}`;
                    players.push({ name: formattedEntry });
                }
            }
        })
        .on('end', async () => {
            // Add player numbers cycling from 1 to 17, repeating each number twice
            const playersWithNumbers = players.map((player, index) => ({
                number: `${Math.floor((index % 34) / 2) + 1}.`,
                name: player.name
            }));

            // Set up CSV writer
            const csvWriter = createCsvWriter({
                path: 'teamlists.csv',
                header: [
                    { id: 'number', title: 'Player Number' },
                    { id: 'name', title: 'Player Name' }
                ],
                alwaysQuote: false
            });

            // Write to CSV file
            await csvWriter.writeRecords(playersWithNumbers);
            console.log(`Successfully processed ${playersWithNumbers.length} players to teamlists.csv`);
        })
        .on('error', (error) => {
            console.error('An error occurred while reading the CSV file:', error);
        });
}

// Sample usage
const inputFilePath = 'players.csv'; // Path to the input CSV file
processPlayers(inputFilePath).catch(console.error);
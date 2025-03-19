const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvParser = require('csv-parser');

async function reformatPlayerData() {
    const players = [];
    
    // Read the existing players.csv file
    fs.createReadStream('players.csv')
        .pipe(csvParser())
        .on('data', (row) => {
            const line = row['Player Name'];
            
            if (line) {
                // Extract the number and player name using regex
                const match = line.match(/is number (\d+) (.+)$/);
                if (match) {
                    const playerNumber = match[1];
                    const playerName = match[2].trim();
                    players.push({ 
                        number: playerNumber,
                        name: playerName
                    });
                }
            }
        })
        .on('end', async () => {
            // Set up CSV writer
            const csvWriter = createCsvWriter({
                path: 'teamlists.csv',
                header: [
                    { id: 'number', title: 'Player Number' },
                    { id: 'name', title: 'Player Name' }
                ]
            });

            // Write to CSV file
            await csvWriter.writeRecords(players);
            console.log(`Successfully reformatted ${players.length} players to teamlists.csv`);
        })
        .on('error', (error) => {
            console.error('An error occurred while reading the CSV file:', error);
        });
}

// Run the function
reformatPlayerData().catch(console.error);

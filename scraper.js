const { chromium } = require('playwright');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

async function scrapePlayerNames() {
    const browser = await chromium.launch({
        headless: false  // Makes browser visible - helpful for debugging
    });
    
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    try {
        await page.goto('https://www.nrl.com/news/2024/08/13/nrl-team-lists-round-24/', {
            timeout: 60000, // Increase timeout to 60 seconds
            waitUntil: 'domcontentloaded'
        });

        await page.waitForSelector('h4', { timeout: 60000 });

        const players = await page.evaluate(() => {
            const playersList = [];
            
            // Find all player list items
            const playerElements = document.querySelectorAll('.team-list-profile__name');
            
            playerElements.forEach(playerEl => {
                const fullName = playerEl.textContent.trim().split(/\s+/);
                const formattedName = `${fullName[0][0]}. ${fullName.slice(1).join(' ')}`;
                playersList.push({ name: formattedName });
            });
            
            return playersList;
        });

        const csvWriter = createCsvWriter({
            path: 'players.csv',
            header: [
                { id: 'name', title: 'Player Name' }
            ]
        });

        await csvWriter.writeRecords(players);
        console.log('Player names have been exported to players.csv');
        
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await browser.close();
    }
}

scrapePlayerNames().catch(console.error);
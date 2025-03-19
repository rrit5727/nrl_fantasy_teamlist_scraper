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
        await page.goto('https://www.nrl.com/news/2025/03/18/nrl-team-lists-round-3/', {
            timeout: 60000, // Increase timeout to 60 seconds
            waitUntil: 'domcontentloaded'
        });

        await page.waitForSelector('h4', { timeout: 60000 });

        const players = await page.evaluate(() => {
            const playersList = [];
            
            // Find all player list items
            const playerElements = document.querySelectorAll('.team-list-profile__name');
            
            playerElements.forEach(playerEl => {
                // Extract the position and player name from the visually hidden span
                const hiddenSpan = playerEl.querySelector('.u-visually-hidden');
                if (hiddenSpan) {
                    const text = hiddenSpan.textContent;
                    
                    // Skip reserve players (those with "Replacement" in their description)
                    if (text.includes('Replacement')) {
                        return; // Skip this iteration - don't include this player
                    }
                    
                    // Extract player position and number
                    const match = text.match(/(.+) for .+ is number (\d+)/);
                    
                    if (match) {
                        // Get all text nodes and visible spans to form the complete name
                        let firstName = '';
                        let lastName = '';
                        
                        // Extract first name (text node)
                        const textNodes = Array.from(playerEl.childNodes)
                            .filter(node => node.nodeType === Node.TEXT_NODE)
                            .map(node => node.textContent.trim())
                            .filter(text => text.length > 0);
                        
                        if (textNodes.length > 0) {
                            firstName = textNodes.join(' ').trim();
                        }
                        
                        // Extract last name (from the span)
                        const lastNameSpan = playerEl.querySelector('.u-font-weight-700');
                        if (lastNameSpan) {
                            lastName = lastNameSpan.textContent.trim();
                        }
                        
                        // Combine into full name
                        const fullName = `${firstName} ${lastName}`.trim();
                        
                        // Add to list with position prefix
                        playersList.push({ 
                            name: `${match[1]}. is number ${match[2]} ${fullName}` 
                        });
                    }
                }
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
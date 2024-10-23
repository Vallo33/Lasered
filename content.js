// Immediately check if we're on a blocked site
function checkAndBlockSite() {
    console.log('Checking if site should be blocked...');
    chrome.storage.local.get(['activeMode', 'modes', 'customSites'], (data) => {
        console.log('Current mode:', data.activeMode);
        console.log('Available modes:', data.modes);
        
        if (!data.activeMode) {
            console.log('No active mode');
            return;
        }

        const currentMode = data.modes[data.activeMode];
        if (!currentMode) {
            console.log('Mode not found');
            return;
        }

        console.log('Current mode:', currentMode);
        const blockedSites = [...currentMode.sites, ...(data.customSites || [])];
        console.log('Blocked sites:', blockedSites);
        console.log('Current hostname:', window.location.hostname);

        // More permissive matching
        const isBlocked = blockedSites.some(pattern => {
            const domain = pattern
                .replace('*://*.', '')
                .replace('/*', '')
                .replace('*', '');
            return window.location.hostname.includes(domain);
        });

        console.log('Is site blocked?', isBlocked);

        if (isBlocked) {
            console.log('Blocking site...');
            // Force the entire page content to be our blocking message
            document.documentElement.innerHTML = `
                <html>
                <head>
                    <title>Site Blocked - Lasered</title>
                </head>
                <body style="margin: 0; padding: 0; height: 100vh; display: flex; align-items: center; justify-content: center; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
                    <div style="text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 400px; margin: 20px;">
                        <div style="font-size: 24px; font-weight: bold; margin-bottom: 30px; color: #4A90E2;">Lasered</div>
                        <h1 style="color: #4A90E2; margin-bottom: 20px;">Stay Focused!</h1>
                        <p style="font-size: 16px; line-height: 1.6; color: #666; margin-bottom: 20px;">
                            This site is currently blocked to help you maintain your focus.
                        </p>
                        <p style="font-size: 14px; color: #888;">
                            Redirecting to Google in 2 seconds...
                        </p>
                    </div>
                </body>
                </html>
            `;

            // Prevent any other content from loading
            document.body.style.display = 'none';
            
            // Force the redirect after 2 seconds
            setTimeout(() => {
                console.log('Redirecting to Google...');
                window.location.replace('https://www.google.com');
            }, 2000);
        }
    });
}

// Run the check immediately
checkAndBlockSite();

// Also run when the page content loads
document.addEventListener('DOMContentLoaded', checkAndBlockSite);

// And run when the page is fully loaded
window.addEventListener('load', checkAndBlockSite);
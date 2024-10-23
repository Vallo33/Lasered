function simplifyUrl(url) {
    let simple = url.replace(/^https?:\/\//, '');
    simple = simple.replace(/^www\./, '');
    simple = simple.replace(/\/.*$/, '');
    return simple;
}

function createBlockingPage() {
    // Create a new HTML document
    document.documentElement.innerHTML = `
    <html>
        <head>
            <title>Site Blocked - Lasered</title>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #f5f5f5;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .modal {
                    background: white;
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    text-align: center;
                    max-width: 400px;
                    margin: 20px;
                    animation: fadeIn 0.5s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .logo {
                    font-size: 24px;
                    font-weight: bold;
                    color: #4A90E2;
                    margin-bottom: 30px;
                }
                .title {
                    color: #4A90E2;
                    margin-bottom: 20px;
                    font-size: 24px;
                }
                .message {
                    font-size: 16px;
                    line-height: 1.6;
                    color: #666;
                    margin-bottom: 20px;
                }
                .redirect-message {
                    font-size: 14px;
                    color: #888;
                }
                .progress-bar {
                    width: 100%;
                    height: 4px;
                    background-color: #eee;
                    margin-top: 20px;
                    border-radius: 2px;
                    overflow: hidden;
                }
                .progress {
                    width: 0%;
                    height: 100%;
                    background-color: #4A90E2;
                    transition: width 2s linear;
                }
            </style>
        </head>
        <body>
            <div class="modal">
                <div class="logo">Lasered</div>
                <h1 class="title">Stay Focused!</h1>
                <p class="message">
                    This site is currently blocked to help you maintain your focus.
                </p>
                <p class="redirect-message">
                    Redirecting to Google in 2 seconds...
                </p>
                <div class="progress-bar">
                    <div class="progress"></div>
                </div>
            </div>
        </body>
    </html>`;

    // Start progress bar animation
    requestAnimationFrame(() => {
        const progress = document.querySelector('.progress');
        if (progress) {
            progress.style.width = '100%';
        }
    });

    // Redirect after delay
    setTimeout(() => {
        window.location.replace('https://www.google.com');
    }, 2000);
}

function checkAndBlockSite() {
    console.log('Checking if site should be blocked...');
    
    chrome.storage.local.get(['activeMode', 'modes', 'customSites'], (data) => {
        if (!data.activeMode) {
            console.log('No active mode');
            return;
        }

        const currentMode = data.modes[data.activeMode];
        if (!currentMode) {
            console.log('Mode not found');
            return;
        }

        // Get all blocked sites
        const allBlockedSites = [
            ...(currentMode.sites || []),
            ...(data.customSites || [])
        ].map(pattern => pattern
            .replace('*://*.', '')
            .replace('/*', '')
            .replace('*', '')
        );

        console.log('All blocked sites:', allBlockedSites);

        // Get current URL
        const currentUrl = simplifyUrl(window.location.href);
        console.log('Current URL (simplified):', currentUrl);

        // Check if current URL matches any blocked pattern
        const isBlocked = allBlockedSites.some(pattern => {
            console.log('Checking pattern:', pattern, 'against:', currentUrl);
            return currentUrl.includes(pattern);
        });

        console.log('Is site blocked?', isBlocked);

        if (isBlocked) {
            console.log('Blocking site...');
            // Stop the page from loading further
            window.stop();
            // Create our blocking page
            createBlockingPage();
        }
    });
}

// Run as early as possible
if (document.documentElement) {
    checkAndBlockSite();
}

// Fallback for when document isn't ready
document.addEventListener('DOMContentLoaded', checkAndBlockSite);

// Handle dynamic navigation
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        checkAndBlockSite();
    }
}).observe(document, { subtree: true, childList: true });
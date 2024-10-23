function blockSite() {
    // First, stop any further page loading
    window.stop();
    
    // Create and append styles first
    const style = document.createElement('style');
    style.textContent = `
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: #f5f5f5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            overflow: hidden;
        }
        #laser-block-modal {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
            margin: 20px;
            opacity: 0;
            transform: translateY(-20px);
            animation: modalFadeIn 0.5s forwards;
            z-index: 2147483647;
        }
        @keyframes modalFadeIn {
            to {
                opacity: 1;
                transform: translateY(0);
            }
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
            font-weight: bold;
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
            width: 0;
            height: 100%;
            background-color: #4A90E2;
            transition: width 2s linear;
        }
    `;

    // Clear existing content and add our style
    document.head.innerHTML = '';
    document.head.appendChild(style);

    // Create modal content
    document.body.innerHTML = `
        <div id="laser-block-modal">
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
    `;

    // Force layout recalculation
    document.getElementById('laser-block-modal').offsetHeight;

    // Start progress bar animation
    requestAnimationFrame(() => {
        document.querySelector('.progress').style.width = '100%';
    });

    // Redirect after modal display
    setTimeout(() => {
        window.location.replace('https://www.google.com');
    }, 2000);
}

function isUrlBlocked(currentUrl, pattern) {
    // Remove protocol and www from the current URL
    const cleanUrl = currentUrl.toLowerCase()
        .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
        .split('/')[0]; // Get just the domain part
    
    // Clean up the pattern
    const cleanPattern = pattern
        .replace(/\*:\/\/\*\./g, '')
        .replace(/\*\./g, '')
        .replace(/\/\*/g, '')
        .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
        .split('/')[0]; // Get just the domain part

    console.log('Comparing:', cleanUrl, 'with pattern:', cleanPattern);
    return cleanUrl === cleanPattern;
}

function checkAndBlockSite() {
    chrome.storage.local.get(['activeMode', 'modes', 'customSites'], (data) => {
        console.log('Checking active mode:', data.activeMode);
        
        if (!data.activeMode) return;

        const currentMode = data.modes[data.activeMode];
        if (!currentMode) return;

        console.log('Current mode:', currentMode);

        // Get all blocked sites
        const blockedSites = [...(currentMode.sites || []), ...(data.customSites || [])];
        const currentUrl = window.location.href;
        
        console.log('Checking URL:', currentUrl);
        console.log('Against blocked sites:', blockedSites);

        // Check if the current site should be blocked
        const isBlocked = blockedSites.some(pattern => {
            // For built-in sites, use the original matching
            if (pattern.includes('facebook.com') || 
                pattern.includes('youtube.com') || 
                pattern.includes('twitter.com') || 
                pattern.includes('instagram.com') || 
                pattern.includes('tiktok.com')) {
                return currentUrl.includes(pattern.replace(/\*:\/\/\*\./g, '').replace(/\/\*/g, ''));
            }
            // For custom sites, use the strict matching
            return isUrlBlocked(currentUrl, pattern);
        });

        console.log('Is site blocked?', isBlocked);

        if (isBlocked) {
            console.log('Blocking site...');
            blockSite();
        }
    });
}

// Run checks at different stages
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndBlockSite);
} else {
    checkAndBlockSite();
}

// Also check when the page is fully loaded
window.addEventListener('load', checkAndBlockSite);

// Handle single-page applications
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        checkAndBlockSite();
    }
}).observe(document, { subtree: true, childList: true });
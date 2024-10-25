function blockSite() {
    window.stop();
    
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

    document.head.innerHTML = '';
    document.head.appendChild(style);

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

    requestAnimationFrame(() => {
        document.querySelector('.progress').style.width = '100%';
    });

    setTimeout(() => {
        window.location.replace('https://www.google.com');
    }, 2000);
}

function isUrlBlocked(currentUrl, pattern) {
    const cleanUrl = currentUrl.toLowerCase()
        .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
        .split('/')[0];
    
    const cleanPattern = pattern
        .replace(/\*:\/\/\*\./g, '')
        .replace(/\*\./g, '')
        .replace(/\/\*/g, '')
        .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
        .split('/')[0];

    return cleanUrl === cleanPattern;
}

function isWithinSchedule(schedule) {
    // If no schedule, assume always active
    if (!schedule) return true;

    const now = new Date();
    const currentDay = now.getDay(); // 0-6, where 0 is Sunday

    // Check if current day is in schedule
    if (!schedule.days.includes(currentDay)) {
        console.log('Outside scheduled days. Current day:', currentDay, 'Scheduled days:', schedule.days);
        return false;
    }

    // Convert current time to minutes since midnight
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeInMinutes = (currentHours * 60) + currentMinutes;

    // Convert schedule times to minutes since midnight
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
    const startTimeInMinutes = (startHour * 60) + startMinute;
    const endTimeInMinutes = (endHour * 60) + endMinute;

    // Check if current time is within schedule
    const isWithinTime = currentTimeInMinutes >= startTimeInMinutes && 
                        currentTimeInMinutes <= endTimeInMinutes;

    console.log('Schedule check:', {
        currentDay,
        currentTime: `${currentHours}:${currentMinutes}`,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isWithinTime
    });

    return isWithinTime;
}

function checkAndBlockSite() {
    chrome.storage.local.get(['activeMode', 'modes', 'customSites'], (data) => {
        if (!data.activeMode) return;

        const currentMode = data.modes[data.activeMode];
        if (!currentMode) return;

        console.log('Current mode:', currentMode);

        // For custom modes, check schedule first
        if (data.activeMode.startsWith('custom-')) {
            if (!isWithinSchedule(currentMode.schedule)) {
                console.log('Outside scheduled time - not blocking');
                return;
            }
        }

        // Get all blocked sites
        const blockedSites = [...(currentMode.sites || []), ...(data.customSites || [])];
        const currentUrl = window.location.href;

        // Check if the current site should be blocked
        const isBlocked = blockedSites.some(pattern => {
            if (pattern.includes('facebook.com') || 
                pattern.includes('youtube.com') || 
                pattern.includes('twitter.com') || 
                pattern.includes('instagram.com') || 
                pattern.includes('tiktok.com')) {
                return currentUrl.includes(pattern.replace(/\*:\/\/\*\./g, '').replace(/\/\*/g, ''));
            }
            return isUrlBlocked(currentUrl, pattern);
        });

        if (isBlocked) {
            blockSite();
        }
    });
}

// Initialize checking
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndBlockSite);
} else {
    checkAndBlockSite();
}

// Set up periodic checking for schedule changes
setInterval(checkAndBlockSite, 60000); // Check every minute

// Handle page loads and navigation
window.addEventListener('load', checkAndBlockSite);

let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        checkAndBlockSite();
    }
}).observe(document, { subtree: true, childList: true });
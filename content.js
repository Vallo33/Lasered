try {
    let extensionEnabled = true;

    function blockSite() {
        try {
            if (!extensionEnabled) return;
            
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

            if (document.documentElement) {
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
                    const progress = document.querySelector('.progress');
                    if (progress) {
                        progress.style.width = '100%';
                    }
                });

                setTimeout(() => {
                    if (extensionEnabled) {
                        window.location.replace('https://www.google.com');
                    }
                }, 2000);
            }
        } catch (error) {
            console.error('Error in blockSite:', error);
            if (extensionEnabled) {
                window.location.replace('https://www.google.com');
            }
        }
    }

    function isUrlBlocked(currentUrl, pattern) {
        try {
            // Remove protocol and www from the current URL
            const cleanUrl = currentUrl.toLowerCase()
                .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
                .split('/')[0];
            
            // Clean up the pattern
            const cleanPattern = pattern
                .replace(/\*:\/\/\*\./g, '')
                .replace(/\*\./g, '')
                .replace(/\/\*/g, '')
                .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
                .split('/')[0];

            console.log('Comparing:', cleanUrl, 'with pattern:', cleanPattern);
            return cleanUrl.includes(cleanPattern) || cleanPattern.includes(cleanUrl);
        } catch (error) {
            console.error('Error in isUrlBlocked:', error);
            return false;
        }
    }

    function isWithinSchedule(schedule) {
        try {
            if (!schedule) return true;

            const now = new Date();
            const currentDay = now.getDay();
            
            // Check if current day is in schedule
            if (!schedule.days.includes(currentDay)) {
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
            return currentTimeInMinutes >= startTimeInMinutes && 
                   currentTimeInMinutes <= endTimeInMinutes;
        } catch (error) {
            console.error('Error in isWithinSchedule:', error);
            return false;
        }
    }

    function checkAndBlockSite() {
        try {
            if (!extensionEnabled) return;

            chrome.storage.local.get(['activeMode', 'modes', 'customSites'], (data) => {
                try {
                    if (!data || !data.activeMode) return;

                    const currentMode = data.modes[data.activeMode];
                    if (!currentMode) return;

                    if (data.activeMode.startsWith('custom-')) {
                        if (currentMode.schedule && !isWithinSchedule(currentMode.schedule)) {
                            console.log('Outside scheduled time - not blocking');
                            return;
                        }
                    }

                    const blockedSites = [...(currentMode.sites || []), ...(data.customSites || [])];
                    const currentUrl = window.location.href;

                    console.log('Checking URL:', currentUrl);
                    console.log('Against blocked sites:', blockedSites);

                    const isBlocked = blockedSites.some(pattern => {
                        return isUrlBlocked(currentUrl, pattern);
                    });

                    console.log('Is site blocked?', isBlocked);

                    if (isBlocked) {
                        console.log('Blocking site...');
                        blockSite();
                    }
                } catch (error) {
                    console.error('Error in storage callback:', error);
                }
            });
        } catch (error) {
            console.error('Error in checkAndBlockSite:', error);
        }
    }

    // Initialize with error handling
    try {
        let observer;
        
        // Run initial check
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkAndBlockSite);
        } else {
            checkAndBlockSite();
        }

        // Set up observers and listeners
        window.addEventListener('load', () => {
            try {
                checkAndBlockSite();
            } catch (error) {
                console.error('Error in load listener:', error);
            }
        });

        // Check every minute for schedule changes
        setInterval(checkAndBlockSite, 60000);

        let lastUrl = location.href;
        observer = new MutationObserver(() => {
            try {
                const url = location.href;
                if (url !== lastUrl) {
                    lastUrl = url;
                    checkAndBlockSite();
                }
            } catch (error) {
                console.error('Error in MutationObserver:', error);
            }
        });

        observer.observe(document, { subtree: true, childList: true });

    } catch (error) {
        console.error('Error in initialization:', error);
    }

} catch (error) {
    console.error('Fatal error in content script:', error);
}
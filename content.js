function checkAndBlockSite() {
    chrome.storage.local.get(['activeMode', 'modes', 'customSites'], (data) => {
        if (!data.activeMode) return;

        const currentMode = data.modes[data.activeMode];
        if (!currentMode) return;

        const blockedSites = [...currentMode.sites, ...(data.customSites || [])];
        
        // More permissive matching
        const isBlocked = blockedSites.some(pattern => {
            const domain = pattern
                .replace('*://*.', '')
                .replace('/*', '')
                .replace('*', '');
            return window.location.hostname.includes(domain);
        });

        if (isBlocked) {
            // Stop any ongoing navigation
            window.stop();
            
            // Clear existing content
            document.head.innerHTML = '';
            document.body.innerHTML = '';

            // Add our styles
            const style = document.createElement('style');
            style.textContent = `
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
            `;
            document.head.appendChild(style);

            // Add modal content
            document.body.innerHTML = `
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
            `;

            // Animate progress bar
            setTimeout(() => {
                document.querySelector('.progress').style.width = '100%';
            }, 100);

            // Force the redirect after animation
            setTimeout(() => {
                window.location.replace('https://www.google.com');
            }, 2000);
        }
    });
}

// Run checks at different stages
document.addEventListener('DOMContentLoaded', checkAndBlockSite);
window.addEventListener('load', checkAndBlockSite);
// Also run immediately
checkAndBlockSite();
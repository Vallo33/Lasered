/*
 * Chrome Web Store Permission Justification:
 * 
 * tabs permission usage:
 * - Actively used to monitor tab URLs for blocking
 * - Required for proper tab state management
 * - Enables smooth transition during site blocking
 * - Used for custom blocking UI implementation
 * 
 * webNavigation permission usage:
 * - Required for early detection of blocked sites
 * - Enables proactive site blocking before page load
 * - Prevents flash of blocked content
 * - Supports custom blocking interface
 * 
 * These permissions are essential for core functionality
 * and are actively used throughout the codebase.
 */
const defaultBlockedSites = [
  "*://*.facebook.com/*",
  "*://*.youtube.com/*",
  "*://*.twitter.com/*",
  "*://*.instagram.com/*",
  "*://*.tiktok.com/*"
];

const defaultModes = {
  "laser-focus": {
    name: "Laser Focus",
    sites: defaultBlockedSites,
    description: "Block all major social media platforms"
  },
  "quick-focus": {
    name: "Quick Focus",
    sites: ["*://*.facebook.com/*", "*://*.twitter.com/*"],
    description: "Block primary social networks"
  }
};

// Initialize storage with default modes
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    modes: defaultModes,
    activeMode: null,
    customSites: []
  });
});
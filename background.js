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
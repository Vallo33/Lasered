document.addEventListener('DOMContentLoaded', () => {
  // Load and display modes
  loadModes();
  loadCustomSites();
  
  // Add event listeners
  document.getElementById('add-mode').addEventListener('click', addCustomMode);
  document.getElementById('add-site').addEventListener('click', addCustomSite);
});

function loadModes() {
  chrome.storage.local.get(['modes', 'activeMode'], (data) => {
    const modesContainer = document.getElementById('modes-container');
    modesContainer.innerHTML = '';
    
    Object.entries(data.modes).forEach(([id, mode]) => {
      const modeElement = createModeElement(id, mode, data.activeMode === id);
      modesContainer.appendChild(modeElement);
    });
  });
}

function createModeElement(id, mode, isActive) {
  const div = document.createElement('div');
  div.className = `mode ${isActive ? 'active' : ''}`;
  
  const title = document.createElement('h3');
  title.textContent = mode.name;
  
  const description = document.createElement('p');
  description.className = 'mode-description';
  description.textContent = mode.description;
  
  const button = document.createElement('button');
  button.className = `button-toggle ${isActive ? 'active' : ''}`;
  button.textContent = isActive ? 'Disable' : 'Enable';
  button.onclick = () => toggleMode(id, isActive);
  
  div.appendChild(title);
  div.appendChild(description);
  div.appendChild(button);
  return div;
}

function toggleMode(modeId, isActive) {
  chrome.storage.local.set({
    activeMode: isActive ? null : modeId
  }, loadModes);
}

function addCustomMode() {
  // Implementation for adding custom modes
  // This will be connected to your UI design
}

function addCustomSite() {
  const input = document.getElementById('new-site');
  const url = input.value.trim();
  
  if (!url) return;
  
  chrome.storage.local.get(['customSites'], (data) => {
    const customSites = [...(data.customSites || []), `*://*.${url}/*`];
    chrome.storage.local.set({ customSites }, () => {
      input.value = '';
      loadCustomSites();
    });
  });
}

function loadCustomSites() {
  chrome.storage.local.get(['customSites'], (data) => {
    const sitesList = document.getElementById('blocked-sites-list');
    sitesList.innerHTML = '';
    
    const customSites = data.customSites || [];
    
    customSites.forEach(site => {
      const li = document.createElement('li');
      li.className = 'blocked-site';
      
      // Clean up the URL pattern for display
      const displayUrl = site.replace('*://*.', '').replace('/*', '');
      
      li.innerHTML = `
        <span>${displayUrl}</span>
        <button class="button-secondary remove-site" aria-label="Remove site">×</button>
      `;
      
      // Add remove button functionality
      const removeButton = li.querySelector('.remove-site');
      removeButton.onclick = () => {
        const updatedSites = customSites.filter(s => s !== site);
        chrome.storage.local.set({ customSites: updatedSites }, loadCustomSites);
      };
      
      sitesList.appendChild(li);
    });
  });
}
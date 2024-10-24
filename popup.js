document.addEventListener('DOMContentLoaded', () => {
  // Load and display modes
  loadModes();
  loadCustomSites();
  
  // Add event listeners
  document.getElementById('add-mode').addEventListener('click', showCustomModeModal);
  document.getElementById('add-site').addEventListener('click', addCustomSite);
  document.getElementById('custom-mode-form').addEventListener('submit', saveCustomMode);
  document.getElementById('cancel-mode').addEventListener('click', hideCustomModeModal);
  document.getElementById('add-custom-site').addEventListener('click', addCustomSiteInput);

  // Set up remove buttons for custom site inputs
  setupRemoveButtons();
});

function showCustomModeModal() {
  const modal = document.getElementById('custom-mode-modal');
  modal.classList.add('show');
}

function hideCustomModeModal() {
  const modal = document.getElementById('custom-mode-modal');
  modal.classList.remove('show');
  // Reset form
  document.getElementById('custom-mode-form').reset();
  // Reset custom sites list
  const customSitesList = document.getElementById('custom-sites-list');
  customSitesList.innerHTML = `
    <div class="custom-site-input">
      <input type="text" placeholder="Enter website URL">
      <button type="button" class="button-secondary remove-site">×</button>
    </div>
  `;
  setupRemoveButtons();
}

function addCustomSiteInput() {
  const customSitesList = document.getElementById('custom-sites-list');
  const newInput = document.createElement('div');
  newInput.className = 'custom-site-input';
  newInput.innerHTML = `
    <input type="text" placeholder="Enter website URL">
    <button type="button" class="button-secondary remove-site">×</button>
  `;
  customSitesList.appendChild(newInput);
  setupRemoveButtons();
}

function setupRemoveButtons() {
  document.querySelectorAll('.remove-site').forEach(button => {
    button.onclick = function() {
      this.parentElement.remove();
    };
  });
}

function saveCustomMode(e) {
  e.preventDefault();

  // Get form values
  const name = document.getElementById('mode-name').value;
  const startTime = document.getElementById('start-time').value;
  const endTime = document.getElementById('end-time').value;
  
  // Get selected days
  const days = Array.from(document.querySelectorAll('.days-selector input:checked'))
    .map(checkbox => parseInt(checkbox.value));
  
  // Get selected preset sites
  const presetSites = Array.from(document.querySelectorAll('.sites-selector input:checked'))
    .map(checkbox => `*://*.${checkbox.value}/*`);
  
  // Get custom sites
  const customSites = Array.from(document.querySelectorAll('#custom-sites-list input'))
    .map(input => input.value.trim())
    .filter(url => url)
    .map(url => `*://*.${url}/*`);

  // Combine all blocked sites
  const sites = [...presetSites, ...customSites];

  // Create mode object
  const modeId = 'custom-' + Date.now();
  const newMode = {
    name,
    sites,
    description: `Active ${days.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')} from ${startTime} to ${endTime}`,
    schedule: {
      days,
      startTime,
      endTime
    }
  };

  // Save to storage
  chrome.storage.local.get(['modes'], (data) => {
    const modes = { ...data.modes };
    modes[modeId] = newMode;
    chrome.storage.local.set({ modes }, () => {
      hideCustomModeModal();
      loadModes();
    });
  });
}

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
  
  // Add delete button for custom modes
  if (id.startsWith('custom-')) {
    const deleteButton = document.createElement('button');
    deleteButton.className = 'button-secondary';
    deleteButton.textContent = 'Delete';
    deleteButton.style.marginLeft = '8px';
    deleteButton.onclick = (e) => {
      e.stopPropagation();
      deleteMode(id);
    };
    button.parentElement?.appendChild(deleteButton);
  }
  
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

function deleteMode(modeId) {
  chrome.storage.local.get(['modes', 'activeMode'], (data) => {
    const modes = { ...data.modes };
    delete modes[modeId];
    
    // If the deleted mode was active, deactivate it
    const newActiveMode = data.activeMode === modeId ? null : data.activeMode;
    
    chrome.storage.local.set({
      modes,
      activeMode: newActiveMode
    }, loadModes);
  });
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
let currentEditingModeId = null;

document.addEventListener('DOMContentLoaded', () => {
    // Load and display modes
    loadModes();
    loadCustomSites();
    
    // Add event listeners for main buttons
    document.getElementById('add-mode').addEventListener('click', () => showCustomModeModal());
    document.getElementById('add-site').addEventListener('click', addCustomSite);
    document.getElementById('custom-mode-form').addEventListener('submit', saveCustomMode);
    document.getElementById('cancel-mode').addEventListener('click', hideCustomModeModal);
    document.getElementById('add-custom-site').addEventListener('click', () => addCustomSiteInput(''));

    // Add schedule toggle handler
    const scheduleToggle = document.getElementById('enable-schedule');
    if (scheduleToggle) {
        const scheduleSettings = document.getElementById('schedule-settings');
        scheduleToggle.addEventListener('change', (e) => {
            if (scheduleSettings) {
                scheduleSettings.style.display = e.target.checked ? 'block' : 'none';
            }
        });
    }

    // Set up remove buttons for custom site inputs
    setupRemoveButtons();
});

function showCustomModeModal(modeId = null) {
    const modal = document.getElementById('custom-mode-modal');
    const form = document.getElementById('custom-mode-form');
    const title = modal.querySelector('h2');
    const submitButton = form.querySelector('button[type="submit"]');
    const scheduleToggle = document.getElementById('enable-schedule');
    const scheduleSettings = document.getElementById('schedule-settings');

    // Reset form
    form.reset();
    currentEditingModeId = modeId;

    if (modeId) {
        // Edit mode
        title.textContent = 'Edit Mode';
        submitButton.textContent = 'Save Changes';
        
        chrome.storage.local.get(['modes'], (data) => {
            const mode = data.modes[modeId];
            
            // Fill form with existing data
            document.getElementById('mode-name').value = mode.name;
            
            // Handle schedule
            if (mode.schedule) {
                scheduleToggle.checked = true;
                scheduleSettings.style.display = 'block';
                
                document.getElementById('start-time').value = mode.schedule.startTime;
                document.getElementById('end-time').value = mode.schedule.endTime;
                
                const dayCheckboxes = document.querySelectorAll('.days-selector input');
                dayCheckboxes.forEach(checkbox => {
                    checkbox.checked = mode.schedule.days.includes(parseInt(checkbox.value));
                });
            } else {
                scheduleToggle.checked = false;
                scheduleSettings.style.display = 'none';
            }
            
            // Set blocked sites
            const siteCheckboxes = document.querySelectorAll('.sites-selector input');
            siteCheckboxes.forEach(checkbox => {
                const pattern = `*://*.${checkbox.value}/*`;
                checkbox.checked = mode.sites.includes(pattern);
            });
            
            // Set custom sites
            const customSitesList = document.getElementById('custom-sites-list');
            customSitesList.innerHTML = ''; // Clear existing
            
            mode.sites.forEach(site => {
                if (!site.includes('facebook.com') && 
                    !site.includes('youtube.com') && 
                    !site.includes('twitter.com') && 
                    !site.includes('instagram.com') && 
                    !site.includes('tiktok.com')) {
                    const cleanSite = site.replace(/\*:\/\/\*\./g, '').replace(/\/\*/g, '');
                    addCustomSiteInput(cleanSite);
                }
            });
        });
    } else {
        // Create mode
        title.textContent = 'Create Custom Mode';
        submitButton.textContent = 'Save Mode';
        scheduleToggle.checked = false;
        scheduleSettings.style.display = 'none';
        
        // Reset custom sites list
        const customSitesList = document.getElementById('custom-sites-list');
        customSitesList.innerHTML = `
        <div class="custom-site-input">
            <input type="text" placeholder="Enter website URL">
            <button type="button" class="remove-site-button">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.5 4.5H13.5" stroke="currentColor" stroke-linecap="round"/>
                    <path d="M5.5 4.5V3.5C5.5 2.94772 5.94772 2.5 6.5 2.5H9.5C10.0523 2.5 10.5 2.94772 10.5 3.5V4.5" stroke="currentColor" stroke-linecap="round"/>
                    <path d="M12.5 4.5L11.5 13.5H4.5L3.5 4.5" stroke="currentColor" stroke-linecap="round"/>
                </svg>
            </button>
        </div>
    `;
    }

    modal.classList.add('show');
    setupRemoveButtons();
}

function hideCustomModeModal() {
    const modal = document.getElementById('custom-mode-modal');
    if (modal) {
        modal.classList.remove('show');
        // Reset form
        const form = document.getElementById('custom-mode-form');
        if (form) {
            form.reset();
        }
        currentEditingModeId = null;
    }
}

function addCustomSiteInput(value = '') {
    const customSitesList = document.getElementById('custom-sites-list');
    const newInput = document.createElement('div');
    newInput.className = 'custom-site-input';
    newInput.innerHTML = `
        <input type="text" placeholder="Enter website URL" value="${typeof value === 'string' ? value : ''}">
        <button type="button" class="remove-site-button" aria-label="Remove site">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 4.5H13.5" stroke="currentColor" stroke-linecap="round"/>
                <path d="M5.5 4.5V3.5C5.5 2.94772 5.94772 2.5 6.5 2.5H9.5C10.0523 2.5 10.5 2.94772 10.5 3.5V4.5" stroke="currentColor" stroke-linecap="round"/>
                <path d="M12.5 4.5L11.5 13.5H4.5L3.5 4.5" stroke="currentColor" stroke-linecap="round"/>
            </svg>
        </button>
    `;
    customSitesList.appendChild(newInput);
    setupRemoveButtons();
}

function setupRemoveButtons() {
    document.querySelectorAll('.remove-site-button').forEach(button => {
        button.onclick = function() {
            this.parentElement.remove();
        };
    });
}

function saveCustomMode(e) {
    e.preventDefault();

    // Get form values
    const name = document.getElementById('mode-name').value;
    const isScheduleEnabled = document.getElementById('enable-schedule').checked;
    
    let schedule = null;
    if (isScheduleEnabled) {
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        const days = Array.from(document.querySelectorAll('.days-selector input:checked'))
            .map(checkbox => parseInt(checkbox.value));

        // Only add schedule if both time and days are selected
        if (startTime && endTime && days.length > 0) {
            schedule = {
                days,
                startTime,
                endTime
            };
        }
    }
    
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
    const modeId = currentEditingModeId || 'custom-' + Date.now();
    const newMode = {
        name,
        sites,
        description: schedule 
            ? `Active ${schedule.days.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')} from ${schedule.startTime} to ${schedule.endTime}`
            : 'Active at all times',
        schedule
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

function deleteMode(modeId) {
    // Create and show custom confirmation dialog
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'modal';
    confirmDialog.innerHTML = `
        <div class="modal-content confirmation-dialog">
            <h3>Delete Mode</h3>
            <p>Are you sure you want to delete this mode? This action cannot be undone.</p>
            <div class="modal-buttons">
                <button class="button-secondary" id="cancel-delete">Cancel</button>
                <button class="delete-button" id="confirm-delete">Delete</button>
            </div>
        </div>
    `;
    document.body.appendChild(confirmDialog);
    confirmDialog.classList.add('show');

    // Handle cancel
    document.getElementById('cancel-delete').onclick = () => {
        confirmDialog.remove();
    };

    // Handle confirm
    document.getElementById('confirm-delete').onclick = () => {
        chrome.storage.local.get(['modes', 'activeMode'], (data) => {
            const modes = { ...data.modes };
            delete modes[modeId];
            
            // If the deleted mode was active, deactivate it
            const newActiveMode = data.activeMode === modeId ? null : data.activeMode;
            
            chrome.storage.local.set({
                modes,
                activeMode: newActiveMode
            }, () => {
                loadModes();
                confirmDialog.remove();
            });
        });
    };
}

function loadModes() {
    chrome.storage.local.get(['modes', 'activeMode'], (data) => {
        const modesContainer = document.getElementById('modes-container');
        modesContainer.innerHTML = '';
        
        Object.entries(data.modes || {}).forEach(([id, mode]) => {
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

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'mode-buttons';
    
    const toggleButton = document.createElement('button');
    toggleButton.className = `button-toggle ${isActive ? 'active' : ''}`;
    toggleButton.textContent = isActive ? 'Disable' : 'Enable';
    toggleButton.onclick = () => toggleMode(id, isActive);
    
    buttonContainer.appendChild(toggleButton);

    if (id.startsWith('custom-')) {
        const editButton = document.createElement('button');
        editButton.className = 'button-secondary';
        editButton.textContent = 'Edit';
        editButton.onclick = (e) => {
            e.stopPropagation();
            showCustomModeModal(id);
        };

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = (e) => {
            e.stopPropagation();
            deleteMode(id);
        };

        buttonContainer.appendChild(editButton);
        buttonContainer.appendChild(deleteButton);
    }
    
    div.appendChild(title);
    div.appendChild(description);
    div.appendChild(buttonContainer);
    
    return div;
}

function toggleMode(modeId, isActive) {
    chrome.storage.local.set({
        activeMode: isActive ? null : modeId
    }, loadModes);
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
                <button class="remove-site-button">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.5 4.5H13.5" stroke="currentColor" stroke-linecap="round"/>
                        <path d="M5.5 4.5V3.5C5.5 2.94772 5.94772 2.5 6.5 2.5H9.5C10.0523 2.5 10.5 2.94772 10.5 3.5V4.5" stroke="currentColor" stroke-linecap="round"/>
                        <path d="M12.5 4.5L11.5 13.5H4.5L3.5 4.5" stroke="currentColor" stroke-linecap="round"/>
                    </svg>
                </button>
            `;
            
            // Add remove button functionality
            const removeButton = li.querySelector('.remove-site-button');
            removeButton.onclick = () => {
                const updatedSites = customSites.filter(s => s !== site);
                chrome.storage.local.set({ customSites: updatedSites }, loadCustomSites);
            };
            
            sitesList.appendChild(li);
        });
    });
}
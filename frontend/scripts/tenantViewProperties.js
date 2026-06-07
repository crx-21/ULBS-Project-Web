document.addEventListener('DOMContentLoaded', async () => {
    await loadAvailableProperties();
    await loadCounterStatistics();
    contactRequest();

    document.getElementById('popup-overlay')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('popup-overlay')) closePopup();
    });
});

async function loadAvailableProperties() {
    const regularGrid = document.getElementById('properties-container');

    if (!regularGrid) return;

    try {
        const appCheck = await apiPost({ action: 'get_tenant_application' });
        const hasApplied = appCheck.has_applied;

        const response = await apiPost({ action: 'get_available_properties' });
        if (!response.success) {
            showError(response.message || 'Failed to load properties.');
            return;
        }

        window.loadedProperties = response.properties;
        window.hasUserApplied = hasApplied;
        
        renderProperties(window.loadedProperties, window.hasUserApplied);
        
        // Connect button filter trigger click to function
        const applyBtn = document.getElementById('btn-apply-filters');
        if (applyBtn) {
            applyBtn.onclick = applyUserFilters;
        }

    } catch (error) {
        console.error('Error fetching available properties:', error);
    }
}

async function loadCounterStatistics() {
    const propCounter = document.getElementById('properties-counter');
    const cityCounter = document.getElementById('cities-counter');

    if (!propCounter || !cityCounter) return;

    try {
        const response = await apiPost({ action: 'GetCounts' });

        if (response.success) {
            propCounter.textContent = response.properties ?? 0;
            cityCounter.textContent = response.cities ?? 0;
        } else {
            console.warn('API returned success:false when retrieving counts.');
        }
    } catch (error) {
        console.error('Failed to update dashboard hero metrics:', error);
    }
}

function renderProperties(properties, hasApplied) {
    const regularGrid = document.getElementById('properties-container');
    const emptyMessage = document.getElementById('no-properties-message');
    
    if (properties.length === 0) {
        if (emptyMessage) emptyMessage.style.display = 'block';
        regularGrid.style.display = 'none';
    } else {
        if (emptyMessage) emptyMessage.style.display = 'none';
        regularGrid.style.display = 'grid';
        regularGrid.innerHTML = '';
        properties.forEach((property) => {
            const card = createPropertyCard(property, hasApplied);
            regularGrid.appendChild(card);
        });
    }
}

function applyUserFilters() {
    const locationFilter = document.getElementById('filter-location').value.trim().toLowerCase();
    const minRentFilter  = parseFloat(document.getElementById('filter-min-rent').value);
    const maxRentFilter  = parseFloat(document.getElementById('filter-max-rent').value);
    
    // FIX 1: Fixed ID name from 'filter-property-type' to 'filter-type'
    const typeSelect = document.getElementById('filter-type');
    const propertyTypeFilter = typeSelect ? typeSelect.value : 'any';
    

    let filtered = window.loadedProperties || [];

    if (locationFilter) {
        filtered = filtered.filter(p => p.location && p.location.toLowerCase().includes(locationFilter));
    }

    // FIX 2: Fixed property evaluation to look for p.type safely
    if (propertyTypeFilter && propertyTypeFilter !== 'any') {
        filtered = filtered.filter(p => p.type === propertyTypeFilter || p.property_type === propertyTypeFilter);
    }

    filtered = filtered.filter(p => {
        const rent = parseFloat(p.rent);
        if (!isNaN(minRentFilter) && rent < minRentFilter) return false;
        if (!isNaN(maxRentFilter) && rent > maxRentFilter) return false;
        return true;
    });

    renderProperties(filtered, window.hasUserApplied);
}

function createPropertyCard(property, hasApplied) {
    const card = document.createElement('div');
    card.className = 'property-card';
    
    // FIX 3: Adjusted photo directory targets to drop the tricky initial forward slash
    const photoUrl = property.photos
        ? `../../uploads/properties/${property.photos}`
        : '../../resources/placeholder-property.jpg';

    card.innerHTML = `
        <div class="card-image-wrapper" style="background-image: url('${photoUrl}');">
            <div class="card-overlay-bar">
                <span class="card-city-name">• ${escapeHtml(property.location)}</span>
                <span class="card-price-tag">${parseFloat(property.rent).toFixed(0)}$</span>
            </div>
        </div>
    `;

    card.addEventListener('click', () => openPropertyPopup(property, hasApplied));
    return card;
}

function openPropertyPopup(property, hasApplied) {
    const photoUrl = property.photos
        ? `../../uploads/properties/${property.photos}`
        : '../../resources/placeholder-property.jpg';

    document.getElementById('popup-photo').style.backgroundImage = `url('${photoUrl}')`;
    document.getElementById('popup-title').textContent    = property.title;
    document.getElementById('popup-location').textContent = '📍 ' + property.location;
    document.getElementById('popup-rent').textContent     = '$' + parseFloat(property.rent).toFixed(2) + ' / month';
    document.getElementById('popup-lease').textContent    = '🗓 ' + property.lease_term;
    document.getElementById('popup-description').textContent = property.description || 'No description provided.';

    const applyBtn = document.getElementById('popup-apply-btn');
    if (hasApplied) {
        applyBtn.textContent  = 'Already Applied';
        applyBtn.disabled     = true;
        applyBtn.classList.add('btn-disabled');
    } else {
        applyBtn.textContent  = 'Apply';
        applyBtn.disabled     = false;
        applyBtn.classList.remove('btn-disabled');
        applyBtn.onclick = () => {
            sessionStorage.setItem('apply_propertyId', property.propertyId);
            sessionStorage.setItem('apply_propertyTitle', property.title);
            window.location.href = '../dashboard/applicationForm.html';
        };
    }

    document.getElementById('popup-overlay').style.display = 'flex';
}

function contactRequest(){
    const contactBtn = document.getElementById('contact');
    const contactPopup = document.getElementById('PopupContact');
    const closeContactBtn = document.getElementById('btnCloseContact');
    const contactForm = document.getElementById('contactForm');

    contactBtn?.addEventListener('click', () => {
        if (contactPopup) contactPopup.style.display = 'flex';
    });

    closeContactBtn?.addEventListener('click', closeContactPopup);

    contactPopup?.addEventListener('click', (e) => {
        if (e.target === contactPopup) closeContactPopup();
    });

    contactForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('btnSubmitContact');
        if (submitBtn) {
            submitBtn.textContent = 'Sending Message...';
            submitBtn.disabled = true;
        }

        const dataPayload = {
            action: 'submit_support_ticket',
            name: document.getElementById('contact-name').value.trim(),
            email: document.getElementById('contact-email').value.trim(),
            phone: document.getElementById('contact-phone').value.trim(),
            message: document.getElementById('contact-message').value.trim()
        };

        try {
            const response = await apiPost(dataPayload);
            if (response.success) {
                alert('Your inquiry was sent successfully!');
                contactForm.reset();
                closeContactPopup();
            } else {
                alert(response.message || 'An error occurred.');
            }
        } catch (error) {
            console.error('API Error:', error);
            alert('Could not connect to the server.');
        } finally {
            if (submitBtn) {
                submitBtn.textContent = 'Send Message';
                submitBtn.disabled = false;
            }
        }
    });
}

function closePopup() {
    document.getElementById('popup-overlay').style.display = 'none';
}

function closeContactPopup() {
    const contactPopup = document.getElementById('PopupContact');
    if (contactPopup) {
        contactPopup.style.display = 'none';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
document.addEventListener('DOMContentLoaded', async () => {
    await loadAvailableProperties();

    document.getElementById('popup-overlay')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('popup-overlay')) closePopup();
    });
});

async function loadAvailableProperties() {
    const regularGrid        = document.getElementById('properties-container');
    const regularEmptyMessage= document.getElementById('no-properties-message');
    const megaGrid           = document.getElementById('mega-properties-container');
    const megaEmptyMessage   = document.getElementById('no-mega-properties-message');

    if (!regularGrid || !megaGrid) return;

    try {
        // Check if tenant already has an application
        const appCheck = await apiPost({ action: 'get_tenant_application' });
        const hasApplied = appCheck.has_applied;

        const response = await apiPost({ action: 'get_available_properties' });
        if (!response.success) {
            showError(response.message || 'Failed to load properties.');
            return;
        }

        const allProp          = response.properties;
        const regularProperties= allProp.filter(p => p.rent < 100);
        const megaProperties   = allProp.filter(p => p.rent >= 100);

        if (regularProperties.length === 0) {
            if (regularEmptyMessage) regularEmptyMessage.style.display = 'block';
            regularGrid.style.display = 'none';
        } else {
            if (regularEmptyMessage) regularEmptyMessage.style.display = 'none';
            regularGrid.style.display = 'grid';
            regularGrid.innerHTML = '';
            regularProperties.forEach(p => regularGrid.appendChild(createPropertyCard(p, hasApplied)));
        }

        if (megaProperties.length === 0) {
            if (megaEmptyMessage) megaEmptyMessage.style.display = 'block';
            megaGrid.style.display = 'none';
        } else {
            if (megaEmptyMessage) megaEmptyMessage.style.display = 'none';
            megaGrid.style.display = 'grid';
            megaGrid.innerHTML = '';
            megaProperties.forEach(p => megaGrid.appendChild(createPropertyCard(p, hasApplied)));
        }

    } catch (error) {
        console.error('Error fetching available properties:', error);
    }
}

function createPropertyCard(property, hasApplied) {
    const card = document.createElement('div');
    card.className = 'property-card';
    const photoUrl = property.photos
        ? `/ULBS-Project-Web/uploads/properties/${property.photos}`
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
        ? `/ULBS-Project-Web/uploads/properties/${property.photos}`
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
            // Store propertyId and redirect to application form
            sessionStorage.setItem('apply_propertyId', property.propertyId);
            sessionStorage.setItem('apply_propertyTitle', property.title);
            window.location.href = '../dashboard/applicationForm.html';
        };
    }

    document.getElementById('popup-overlay').style.display = 'flex';
}

function closePopup() {
    document.getElementById('popup-overlay').style.display = 'none';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
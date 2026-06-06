// landlord_properties.js

document.addEventListener('DOMContentLoaded', async () => {
    await initLogoutButton();
    await loadProperties();
    document.getElementById('field-photo')?.addEventListener('change', (e) => {
        const preview = document.getElementById('photo-preview');
        const file = e.target.files[0];
        if (!file) { preview.innerHTML = ''; return; }
    
        const reader = new FileReader();
        reader.onload = (ev) => {
            preview.innerHTML = `<img src="${ev.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    });
    document.getElementById('btn-create-post')?.addEventListener('click', () => openCreateModal());
    document.getElementById('btn-create-post-empty')?.addEventListener('click', () => openCreateModal());
    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal-overlay')) closeModal();
    });
    document.getElementById('property-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitProperty();
    });
});

// ─── Load & Render ────────────────────────────────────────────────────────────

async function loadProperties() {
    const grid = document.getElementById('properties-grid');
    const emptyState = document.getElementById('empty-state');
    const topBarBtn = document.getElementById('btn-create-post');

    try {
        const data = await apiPost({ action: 'get_properties' });

        if (!data.success) {
            showError(data.message || 'Failed to load properties.');
            return;
        }

        if (data.properties.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'flex';
            topBarBtn.style.display = 'none';       // ← hide when empty
        } else {
            emptyState.style.display = 'none';
            grid.style.display = 'grid';
            topBarBtn.style.display = 'block';      // ← show when properties exist
            grid.innerHTML = '';
            data.properties.forEach(p => {
                grid.appendChild(buildCard(p));
            });
        }

    } catch (err) {
        showError('Network error. Please try again.');
        console.error(err);
    }
}

    


function buildCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    const photoHtml = property.photos
        ? `<img class="card-photo" src="/ULBS-Project-Web/uploads/properties/${property.photos}" alt="Property photo">`
        : `<div class="card-photo-placeholder">🏠</div>`;

    card.innerHTML = `
        ${photoHtml}
        <div class="card-header">
            <h3 class="card-title">${escapeHtml(property.title)}</h3>
            <span class="card-location">📍 ${escapeHtml(property.location)}</span>
        </div>
        <div class="card-body">
            <p class="card-description">${escapeHtml(property.description || 'No description provided.')}</p>
            <div class="card-meta">
                <div class="meta-item rent">
                    <span class="meta-label">Rent</span>
                    <span class="meta-value">$${parseFloat(property.rent).toFixed(2)}</span>
                </div>
                <div class="meta-item lease">
                    <span class="meta-label">Lease Term</span>
                    <span class="meta-value">${escapeHtml(property.lease_term)}</span>
                </div>
            </div>
        </div>
        <div class="card-footer">
            <span class="card-date">Posted: ${formatDate(property.created_at)}</span>
            <div class="card-actions">
                <button class="btn-edit" onclick="openEditModal(${property.propertyId})">Edit</button>
                <button class="btn-delete" onclick="deleteProperty(${property.propertyId})">Delete</button>
            </div>
        </div>
    `;
    return card;
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────

function openCreateModal() {
    document.getElementById('modal-title').textContent = 'Add New Property';
    document.getElementById('property-form').reset();
    document.getElementById('property-id').value = '';
    document.getElementById('photo-preview').innerHTML = '';  // ← clear preview
    document.getElementById('modal-overlay').style.display = 'flex';
}

async function openEditModal(propertyId) {
    try {
        const data = await apiPost({ action: 'get_property', id: propertyId });
        if (!data.success) { showError(data.message); return; }

        const p = data.property;
        document.getElementById('modal-title').textContent = 'Edit Property';
        document.getElementById('property-id').value = p.propertyId;
        document.getElementById('field-title').value = p.title;
        document.getElementById('field-description').value = p.description || '';
        document.getElementById('field-location').value = p.location;
        document.getElementById('field-rent').value = p.rent;
        document.getElementById('field-lease').value = p.lease_term;

        // Show existing photo in preview if any
        const preview = document.getElementById('photo-preview');
        if (p.photos) {
            preview.innerHTML = `<img src="/ULBS-Project-Web/uploads/properties/${p.photos}" alt="Property photo">`;
        } else {
            preview.innerHTML = '';
        }

        document.getElementById('modal-overlay').style.display = 'flex';

    } catch (err) {
        showError('Could not load property details.');
    }
}

function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}

async function submitProperty() {
    const id = document.getElementById('property-id').value;
    const isEdit = id !== '';

    const payload = {
        action: isEdit ? 'update_property' : 'create_property',
        propertyId: id || null,
        title: document.getElementById('field-title').value.trim(),
        description: document.getElementById('field-description').value.trim(),
        location: document.getElementById('field-location').value.trim(),
        rent: document.getElementById('field-rent').value,
        lease_term: document.getElementById('field-lease').value.trim()
    };

    try {
        const data = await apiPost(payload);

        if (data.success) {
            const propertyId = isEdit ? id : data.propertyId;
            await uploadPhoto(propertyId);    // ← upload photo after save
            closeModal();
            loadProperties();
        } else {
            showError(data.message || 'Failed to save property.');
        }
    } catch (err) {
        showError('Network error. Please try again.');
    }
}

async function uploadPhoto(propertyId) {
    const input = document.getElementById('field-photo');
    if (!input || !input.files.length) return;  // no photo selected, skip

    const formData = new FormData();
    formData.append('action', 'upload_property_photo');
    formData.append('propertyId', propertyId);
    formData.append('photo', input.files[0]);

    try {
        const res = await fetch('../backend/api.php', {
            method: 'POST',
            credentials: 'same-origin',
            body: formData  // no Content-Type header — browser sets it automatically
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        if (!data.success) {
            showError('Photo upload failed: ' + (data.message || 'Unknown error'));
        }
    } catch (err) {
        showError('Photo upload failed: ' + err.message);
    }
}
// ─── Delete ───────────────────────────────────────────────────────────────────

async function deleteProperty(propertyId) {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
        const data = await apiPost({ action: 'delete_property', propertyId });

        if (data.success) {
            loadProperties();
        } else {
            showError(data.message || 'Failed to delete property.');
        }

    } catch (err) {
        showError('Network error. Please try again.');
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function showError(msg) {
    const el = document.getElementById('error-banner');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 4000);
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
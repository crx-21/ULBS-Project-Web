// landlord_properties.js

document.addEventListener('DOMContentLoaded', async () => {
    await initLogoutButton();
    await loadProperties();
    await loadInbox();
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
    document.getElementById('btn-inbox')?.addEventListener('click', () => toggleInbox());
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

// Deterministic bill generation based on propertyId for consistency between landlord and tenant
function generateConsistentBills(propertyId) {
    let seed = propertyId;
    const random = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };

    const bills = {
        water: (random() * 40 + 20).toFixed(2),
        electricity: (random() * 80 + 40).toFixed(2),
        internet: (random() * 30 + 20).toFixed(2),
        heating: (random() * 60 + 30).toFixed(2),
    };
    const total = Object.values(bills).reduce((acc, val) => acc + parseFloat(val), 0).toFixed(2);

    return { ...bills, total };
}

function buildCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    const photoHtml = property.photos
        ? `<img class="card-photo" src="/ULBS-Project-Web/uploads/properties/${property.photos}" alt="Property photo">`
        : `<div class="card-photo-placeholder">🏠</div>`;

    const isOccupied = property.status === 'occupied';
    const rentValue = parseFloat(property.rent) || 0;

    let utilityBillsHtml = '';
    let profitHtml = '';
    let actionButtonsHtml = `
        <button class="btn-edit" onclick="openEditModal(${property.propertyId})">Edit</button>
        <button class="btn-delete" onclick="deleteProperty(${property.propertyId})">Delete</button>
    `;

    if (isOccupied) {
        const bills = generateConsistentBills(property.propertyId);
        const totalBills = parseFloat(bills.total);
        const profit = rentValue - totalBills;

        utilityBillsHtml = `
            <div class="meta-item utilities">
                <span class="meta-label">Utility Bills</span>
                <span class="meta-value">$${totalBills.toFixed(2)}</span>
            </div>
        `;

        profitHtml = `
            <div class="card-profit" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; font-weight: bold; color: #5c0a28;">
                <span class="profit-label">Monthly Profit: </span>
                <span class="profit-value">$${profit.toFixed(2)}</span>
            </div>
        `;

        actionButtonsHtml = `
            <button class="btn-view-bills" onclick="openBillsModal(${property.propertyId})" style="background: #5c0a28; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">View Bills</button>
            <button class="btn-edit" onclick="openEditModal(${property.propertyId})">Edit</button>
            <button class="btn-delete" onclick="deleteProperty(${property.propertyId})">Delete</button>
        `;
    }

    card.innerHTML = `
        ${photoHtml}
        <div class="card-header">
            <h3 class="card-title">${escapeHtml(property.title)}</h3>
            <span class="card-location">📍 ${escapeHtml(property.location)}</span>
            ${isOccupied ? '<span class="card-status status-occupied" style="background: #2dc653; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; margin-left: 10px;">Occupied</span>' : ''}
        </div>
        <div class="card-body">
            <p class="card-description">${escapeHtml(property.description || 'No description provided.')}</p>
            <div class="card-meta">
                <div class="meta-item rent">
                    <span class="meta-label">Rent</span>
                    <span class="meta-value">$${rentValue.toFixed(2)}</span>
                </div>
                <div class="meta-item lease">
                    <span class="meta-label">Lease Term</span>
                    <span class="meta-value">${escapeHtml(property.lease_term)}</span>
                </div>
                ${utilityBillsHtml}
            </div>
        </div>
        <div class="card-footer">
            <span class="card-date">Posted: ${formatDate(property.created_at)}</span>
            ${profitHtml}
            <div class="card-actions">
                ${actionButtonsHtml}
            </div>
        </div>
    `;
    return card;
}

function openBillsModal(propertyId) {
    const bills = generateConsistentBills(propertyId);
    const content = document.getElementById('bills-content');

    content.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ccc;">
                <span>💧 Water Bill</span>
                <strong>$${bills.water}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ccc;">
                <span>⚡ Electricity Bill</span>
                <strong>$${bills.electricity}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ccc;">
                <span>🌐 Internet Bill</span>
                <strong>$${bills.internet}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ccc;">
                <span>🔥 Heating Bill</span>
                <strong>$${bills.heating}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; font-weight: bold; font-size: 1.1rem; color: #5c0a28;">
                <span>Total Amount</span>
                <span>$${bills.total}</span>
            </div>
        </div>
    `;

    document.getElementById('btn-pay-bills').onclick = () => {
        alert(`Payment of $${bills.total} processed successfully!`);
        closeBillsModal();
    };

    document.getElementById('bills-modal-overlay').style.display = 'flex';
}

function closeBillsModal() {
    document.getElementById('bills-modal-overlay').style.display = 'none';
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
        const res = await fetch('/ULBS-Project-Web/backend/api.php', {
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

async function handleApplication(applicationId, decision, btn) {
    btn.disabled = true;
    btn.textContent = 'Processing...';

    try {
        const data = await apiPost({
            action:        'handle_application',
            applicationId: applicationId,
            decision:      decision
        });

        if (data.success) {
                    window.location.href = '/ULBS-Project-Web/frontend/dashboard/applicationResult.html?action=' + decision;
        } else {
            showError(data.message || 'Failed to update application.');
            btn.disabled = false;
            btn.textContent = decision === 'approved' ? '✓ Accept' : '✕ Reject';
        }

    } catch (err) {
        showError('Network error. Please try again.');
        btn.disabled = false;
        btn.textContent = decision === 'approved' ? '✓ Accept' : '✕ Reject';
    }
}

async function loadInbox() {
    const data = await apiPost({ action: 'get_applications' });
    if (!data.success) return;

    const badge    = document.getElementById('inbox-badge');
    const list     = document.getElementById('inbox-list');
    const fullList = document.getElementById('inbox-applications-list');
    if (!badge || !list || !fullList) return;

    if (data.pending_count > 0) {
        badge.textContent   = data.pending_count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }

    // Sidebar mini list
    list.innerHTML = '';
    if (data.applications.length === 0) {
        list.innerHTML = '<p class="inbox-empty">No applications yet.</p>';
    } else {
        data.applications.forEach(app => {
            const item = document.createElement('div');
            item.className = 'inbox-item';
            item.innerHTML = `
                <div class="inbox-item-header">
                    <span class="inbox-tenant">${escapeHtml(app.tenantName)}</span>
                    <span class="inbox-status status-${app.status}">${app.status}</span>
                </div>
                <p class="inbox-property">🏠 ${escapeHtml(app.propertyTitle)}</p>
                <p class="inbox-title">${escapeHtml(app.title)}</p>
                <p class="inbox-message">${escapeHtml(app.message)}</p>
                <span class="inbox-date">${formatDate(app.created_at)}</span>
            `;
            list.appendChild(item);
        });
    }

    // Full panel list
    fullList.innerHTML = '';
    if (data.applications.length === 0) {
        fullList.innerHTML = '<p class="inbox-empty">No applications yet.</p>';
    } else {
        data.applications.forEach(app => {
            const item = document.createElement('div');
            item.className = 'inbox-full-item';
            item.innerHTML = `
                <div class="inbox-full-header">
                    <div>
                        <h3 class="inbox-full-title">${escapeHtml(app.title)}</h3>
                        <p class="inbox-full-property">🏠 ${escapeHtml(app.propertyTitle)} — 📍 ${escapeHtml(app.location)}</p>
                    </div>
                    <span class="inbox-status status-${app.status}">${app.status}</span>
                </div>
                <div class="inbox-full-from">
                    <span>👤 ${escapeHtml(app.tenantName)}</span>
                    <span class="inbox-date">${formatDate(app.created_at)}</span>
                </div>
                <p class="inbox-full-message">${escapeHtml(app.message)}</p>
                ${app.status === 'pending' ? `
                <div class="inbox-full-actions">
                    <button class="btn-accept" onclick="handleApplication(${app.applicationId}, 'approved', this)">✓ Accept</button>
                    <button class="btn-reject" onclick="handleApplication(${app.applicationId}, 'rejected', this)">✕ Reject</button>
                </div>
                ` : ''}
            `;
            fullList.appendChild(item);
        });
    }
}

function toggleInbox() {
    const fullPanel      = document.getElementById('inbox-full-panel');
    const propertiesArea = document.getElementById('container-landlord-content');
    const isOpen         = fullPanel.style.display !== 'none';

    if (isOpen) {
        fullPanel.style.display      = 'none';
        propertiesArea.style.display = 'block';
    } else {
        fullPanel.style.display      = 'block';
        propertiesArea.style.display = 'none';
    }
}

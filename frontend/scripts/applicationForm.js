document.addEventListener('DOMContentLoaded', () => {
    const propertyId    = sessionStorage.getItem('apply_propertyId');
    const propertyTitle = sessionStorage.getItem('apply_propertyTitle');

    if (!propertyId) {
        window.location.href = '../dashboard/frontPageTenant.html';
        return;
    }

    document.getElementById('form-property-title').textContent = '🏠 ' + propertyTitle;

    document.getElementById('btn-confirm').addEventListener('click', async () => {
        const title   = document.getElementById('field-app-title').value.trim();
        const message = document.getElementById('field-app-message').value.trim();
    
        if (!title || !message) {
            showError('Please fill in both the title and message.');
            return;
        }
    
        const btn = document.getElementById('btn-confirm');
        btn.disabled = true;
        btn.textContent = 'Submitting...';
    
        try {
            const data = await apiPost({
                action:     'apply_for_property',
                propertyId: parseInt(propertyId),
                title:      title,
                message:    message
            });
    
            if (data.success) {
                sessionStorage.removeItem('apply_propertyId');
                sessionStorage.removeItem('apply_propertyTitle');
                showSuccess('Application submitted! The landlord will review it shortly.');
                setTimeout(() => window.location.href = '../dashboard/frontPageTenant.html', 2000);
            } else {
                showError(data.message || 'Failed to submit application.');
                btn.disabled = false;
                btn.textContent = 'Confirm Application';
            }
    
        } catch (err) {
            showError('Network error. Please try again.');
            btn.disabled = false;
            btn.textContent = 'Confirm Application';
        }
    });
});

function showError(msg) {
    const el = document.getElementById('error-banner');
    el.textContent = msg;
    el.style.display = 'block';
    document.getElementById('success-banner').style.display = 'none';
}

function showSuccess(msg) {
    const el = document.getElementById('success-banner');
    el.textContent = msg;
    el.style.display = 'block';
    document.getElementById('error-banner').style.display = 'none';
}
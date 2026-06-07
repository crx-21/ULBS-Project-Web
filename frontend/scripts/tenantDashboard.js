document.addEventListener('DOMContentLoaded', async () => {
    await loadTenantProperty();
});

async function loadTenantProperty() {
    const container = document.getElementById('container-tenant-content');
    if (!container) return;

    try {
        const data = await apiPost({ action: 'get_tenant_application' });

        if (!data.success) {
            container.innerHTML = `<p style="color: red;">Error loading property: ${data.message}</p>`;
            return;
        }

        if (!data.has_applied || data.application.status !== 'approved') {
            container.innerHTML = `
                <div style="text-align: center; margin-top: 50px;">
                    <h2 style="color: #5c0a28;">No Admitted Property</h2>
                    <p>You haven't been admitted to any property yet or your application is pending.</p>
                </div>
            `;
            return;
        }

        renderPropertyDashboard(data.application);
    } catch (err) {
        container.innerHTML = `<p style="color: red;">Network error. Please try again.</p>`;
        console.error(err);
    }
}

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

function renderPropertyDashboard(property) {
    const container = document.getElementById('container-tenant-content');
    const bills = generateConsistentBills(property.propertyId);
    const rentValue = parseFloat(property.rent) || 0;

    const photoHtml = property.photos
        ? `<img src="/ULBS-Project-Web/uploads/properties/${property.photos}" alt="Property photo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`
        : `<div style="width: 100%; height: 100%; background: #eee; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 3rem;">🏠</div>`;

    container.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto; background: #5c0a28; color: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); overflow: hidden; font-family: 'Montserrat', sans-serif;">
            <div style="padding: 30px 0; text-align: center;">
                <h2 style="margin: 0; font-size: 2rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">My Rented Property</h2>
                <p style="margin: 10px 0 0; opacity: 0.8; font-size: 1.2rem;">${escapeHtml(property.title)}</p>
            </div>

            <div style="padding: 0 30px 30px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: stretch;">
                    <!-- Left Column: Photo and Emergency -->
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        <div style="height: 300px;">
                            ${photoHtml}
                        </div>
                        <button id="btn-emergency" style="background: #e63946; color: white; border: none; padding: 15px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 1rem; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.2); text-transform: uppercase; letter-spacing: 1px;" onmouseover="this.style.backgroundColor='#c12e3a'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.25)'" onmouseout="this.style.backgroundColor='#e63946'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.2)'">🚨 Emergency Maintenance</button>
                    </div>

                    <!-- Right Column: Bills Info -->
                    <div style="background: white; color: #333; padding: 20px; border-radius: 12px; display: flex; flex-direction: column; justify-content: space-between;">
                        <div style="height: 100%;">
                            <h3 style="color: #5c0a28; border-bottom: 2px solid #5c0a28; padding-bottom: 10px; margin-top: 0;">Payment Center</h3>
                            <div id="payment-list" style="display: flex; flex-direction: column; gap: 12px; margin: 20px 0;">
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0;">
                                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.95rem;">
                                        <input type="checkbox" class="pay-item" data-value="${rentValue}" checked style="width: 18px; height: 18px; accent-color: #5c0a28;">
                                        <span>🏠 Monthly Rent</span>
                                    </label>
                                    <strong style="color: #5c0a28;">$${rentValue.toFixed(2)}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0;">
                                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.95rem;">
                                        <input type="checkbox" class="pay-item" data-value="${bills.water}" checked style="width: 18px; height: 18px; accent-color: #5c0a28;">
                                        <span>💧 Water Bill</span>
                                    </label>
                                    <strong style="color: #5c0a28;">$${bills.water}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0;">
                                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.95rem;">
                                        <input type="checkbox" class="pay-item" data-value="${bills.electricity}" checked style="width: 18px; height: 18px; accent-color: #5c0a28;">
                                        <span>⚡ Electricity Bill</span>
                                    </label>
                                    <strong style="color: #5c0a28;">$${bills.electricity}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0;">
                                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.95rem;">
                                        <input type="checkbox" class="pay-item" data-value="${bills.internet}" checked style="width: 18px; height: 18px; accent-color: #5c0a28;">
                                        <span>🌐 Internet Bill</span>
                                    </label>
                                    <strong style="color: #5c0a28;">$${bills.internet}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0;">
                                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.95rem;">
                                        <input type="checkbox" class="pay-item" data-value="${bills.heating}" checked style="width: 18px; height: 18px; accent-color: #5c0a28;">
                                        <span>🔥 Heating Bill</span>
                                    </label>
                                    <strong style="color: #5c0a28;">$${bills.heating}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; border-top: 2px solid #5c0a28; padding-top: 15px; font-weight: 800; font-size: 1.2rem; color: #5c0a28;">
                                    <span>Total to Pay:</span> <span id="total-pay-amount">$${(rentValue + parseFloat(bills.total)).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <button id="btn-pay-now" style="width: 100%; background: #2dc653; color: white; border: none; padding: 15px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 1rem; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" onmouseover="this.style.backgroundColor='#27ae60'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'" onmouseout="this.style.backgroundColor='#2dc653'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">Pay Now</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const checkboxes = document.querySelectorAll('.pay-item');
    const totalDisplay = document.getElementById('total-pay-amount');

    const updateTotal = () => {
        let sum = 0;
        checkboxes.forEach(cb => {
            if (cb.checked) sum += parseFloat(cb.dataset.value);
        });
        totalDisplay.textContent = `$${sum.toFixed(2)}`;
    };

    checkboxes.forEach(cb => cb.addEventListener('change', updateTotal));

    document.getElementById('btn-pay-now').onclick = () => {
        const finalTotal = totalDisplay.textContent;
        alert(`Payment of ${finalTotal} processed successfully! Your selected bills and rent have been cleared.`);
    };

    document.getElementById('btn-emergency').onclick = () => {
        alert(`EMERGENCY REQUEST SENT!\n\nOur maintenance team has been notified for property: ${property.title}.\n\nSomeone will contact you shortly at the registered email.`);
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

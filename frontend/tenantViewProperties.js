document.addEventListener('DOMContentLoaded', async() => { await loadAvailableProperties(); });

async function loadAvailableProperties() {
    const regularGrid=document.getElementById('properties-container');
    const regularEmptyMessage=document.getElementById('no-properties-message');
    const megaGrid=document.getElementById('mega-properties-container');
    const megaEmptyMessage=document.getElementById('no-mega-properties-message');


    if(!regularGrid || !megaGrid) return;

    try {
        const response=await apiPost({ action: 'get_available_properties' });
        if(!response.success) {
            showError(response.message || 'Failed to load properties.');
            return;
        }

        const allProp=response.properties;
        const regularProperties=allProp.filter(p=>p.rent<100);
        const megaProperties=allProp.filter(p=>p.rent>=100);

        if(regularProperties.length===0) {
            if(regularEmptyMessage) regularEmptyMessage.style.display='block';
            regularGrid.style.display='none';
        } else {
            if(regularEmptyMessage) regularEmptyMessage.style.display='none';
            regularGrid.style.display='grid';
            regularGrid.innerHTML='';
            regularProperties.forEach(property => {regularGrid.appendChild(createPropertyCard(property));});
        }

        if(megaProperties.length===0) {
            if(megaEmptyMessage) megaEmptyMessage.style.display='block';
            megaGrid.style.display='none';
        } else {
            if(megaEmptyMessage) megaEmptyMessage.style.display='none';
            megaGrid.style.display='grid';
            megaGrid.innerHTML='';
            megaProperties.forEach(property => {megaGrid.appendChild(createPropertyCard(property));});
        }
    } catch (error) {
        console.error('Error fetching available properties:', error);
    }
}

function createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    const photoUrl = property.photos
        ? `/ULBS-Project-Web/uploads/properties/${property.photos}`
        : '../resources/placeholder-property.jpg';
    card.innerHTML = `
        <div class="card-image-wrapper" style="background-image: url('${photoUrl}');">
            <div class="card-overlay-bar">
                <span class="card-city-name">• ${escapeHtml(property.location)}</span>
                <span class="card-price-tag">${parseFloat(property.rent).toFixed(0)}$</span>
            </div>
        </div>
    `;
    // card.addEventListener('click', () => {
    //     applyForProperty(property.propertyId);
    // });
    return card;
}

function escapeHtml(text){
    const div=document.createElement('div');
    div.textContent=text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const options={ year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// function applyForProperty(id) {
//     //Partea 2/3 - funcția de aplicare pentru chiriași
// }
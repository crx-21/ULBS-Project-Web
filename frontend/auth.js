const formRegister = document.getElementById('Register');
const formLogin = document.getElementById('Login');

const API_URL = '../backend/api.php';

//Am implementat comunicare user efectueaza html http requests (login,signup) -> Auth.js -> api.php -> auth.js parseaza raspunsul. 
function Popup()
{
  var popup = document.getElementById("PopupRegister");
  popup.classList.toggle("show");
}

async function saveRoleAndClose(role) {
    try {
        const result = await apiPost({ 
            action: 'SetRole', 
            role: role 
        });

        if (result.success) {
            // Remove the flag so it doesn't pop up again next time they reload
            sessionStorage.removeItem('PopupRegister');
            
            const popup = document.getElementById("PopupRegister");
            popup.classList.remove("show");
            
            // Wait 500ms for the animation to finish before hiding completely
            setTimeout(() => {
                popup.style.display = 'none';
            }, 500);
        } else {
            alert('Failed to save role: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving role:', error);
        alert('An error occurred while saving your role.');
    }
}

function setupRoleSelection() {
    const tenantBtn = document.getElementById('btnTenant');
    const landlordBtn = document.getElementById('btnLandlord');

    tenantBtn?.addEventListener('click', () => saveRoleAndClose('tenant'));
    landlordBtn?.addEventListener('click', () => saveRoleAndClose('landlord'));
}


async function apiPost(data) {
    const response = await fetch(API_URL, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error('Server response was not JSON:', text);
        throw new Error(text || 'Invalid server response');
    }
}



formRegister?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.action = 'Register';

    try {
        const result = await apiPost(data);

        if (result.success && result.logged_in) {
            sessionStorage.setItem('session_id', result.session_id);
            sessionStorage.setItem('username', result.user.username);

            sessionStorage.setItem('PopupRegister', true);
            window.location.href = 'frontPageTenant.html';
            
        } else {
            alert('Registration failed: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Network Error:', error);
        alert('An error occurred during registration. Please try again.');
    }
});



formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.action = 'Login';

    try {
        const result = await apiPost(data);
        if (result.success && result.logged_in) {
            sessionStorage.setItem('session_id', result.session_id);
            sessionStorage.setItem('username', result.user.username);
            window.location.href = 'frontPageTenant.html';
        } else {
            alert('Login failed: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Network Error:', error);
        alert('An error occurred during login. Please try again.');
    }
});



function bindSignInButton() {
    document.getElementById('sign-in')?.addEventListener('click', () => {
        window.location.href = 'login.html';
    });
}

function bindLogoutButton() {
    document.getElementById('logout-link')?.addEventListener('click', async () => {
        await apiPost({ action: 'Logout' });
        sessionStorage.removeItem('session_id');
        sessionStorage.removeItem('username');
        window.location.reload();
    });
}

async function loadSessionState() {
    const navAccount = document.getElementById('nav-account');
    if (!navAccount) {
        return;
    }

    try {
        const result = await apiPost({ action: 'Session' });
        if (result.logged_in) {
            navAccount.innerHTML = `
                <span class="nav-user">Hi, ${result.user.username}</span>
                <input type="button" value="Log out" id="logout-link">
            `;
            bindLogoutButton();

            if (sessionStorage.getItem('PopupRegister') === 'true') {
                Popup();
                setupRoleSelection();
            }
        } else {
            navAccount.innerHTML = '<input type="button" value="Sign In" id="sign-in">';
            bindSignInButton();
        }
    } catch (error) {
        console.error('Session check failed:', error);
        bindSignInButton();
    }
}

if (document.body.dataset.checkSession === 'true') 
{
loadSessionState();
}



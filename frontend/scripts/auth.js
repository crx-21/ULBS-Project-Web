const formRegister = document.getElementById('Register');
const formLogin = document.getElementById('Login');

const API_URL = '/ULBS-Project-Web/backend/api.php';

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
            sessionStorage.removeItem('PopupRegister');
            
            const popup = document.getElementById("PopupRegister");
            popup.classList.remove("show");
            
            setTimeout(() => {
                popup.style.display = 'none';
            }, 500);

            // Redirect based on chosen role
            if (role === 'landlord') {
                window.location.href = '../dashboard/frontPageLandlord.html';
            } else {
                window.location.href = '../dashboard/frontPageTenant.html';
            }

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
            window.location.href = '../dashboard/frontPageTenant.html';
            
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

            //Redirect based on role returned by API
            if (result.user.role === 'landlord') {
                window.location.href = '../dashboard/frontPageLandlord.html';
            } else {
                window.location.href = '../dashboard/frontPageTenant.html';
            }

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
        window.location.href = '../auth/login.html';
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

function bindDashboardButton() {
    document.getElementById('btn-to-dashboard')?.addEventListener('click', async () => {
        try {
            const result = await apiPost({ action: 'Session' });
            if (result.logged_in) {
                if (result.user.role === 'landlord') {
                    window.location.href = '../dashboard/frontPageLandlord.html';
                } else {
                    window.location.href = '../dashboard/dashboardTenant.html';
                }
            } else {
                alert('Please sign in first to access the dashboard.');
                window.location.href = '../auth/login.html';
            }
        } catch (error) {
            console.error('Error checking session for dashboard redirect:', error);
            alert('An error occurred. Please try again.');
        }
    });
}

async function loadSessionState() {
    const navAccount = document.getElementById('nav-account');
    if (!navAccount) {
        return;
    }

    try {
        const result = await apiPost({ action: 'Session' });
        bindDashboardButton();

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

async function initLogoutButton(buttonId = 'Logout') {
    const logoutBtn = document.getElementById(buttonId);
    if (!logoutBtn) return;

    try {
        const result = await apiPost({ action: 'Session' });

        if (!result.logged_in) {
            logoutBtn.value = 'Log In';
            logoutBtn.onclick = () => window.location.href = '../auth/login.html';
        } else {
            logoutBtn.value = 'Log Out';
            logoutBtn.onclick = async () => {
                await apiPost({ action: 'Logout' });
                sessionStorage.clear();
                window.location.href = '../auth/login.html';
            };
        }

    } catch (err) {
        console.error('Session check failed:', err);
        logoutBtn.value = 'Log In';
        logoutBtn.onclick = () => window.location.href = '../auth/login.html';
    }
}





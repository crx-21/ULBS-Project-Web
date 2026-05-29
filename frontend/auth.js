const formRegister = document.getElementById('Register');
const formLogin = document.getElementById('Login');

const API_URL = '../backend/api.php';

//Am implementat comunicare user efectueaza html http requests (login,signup) -> Auth.js -> api.php -> auth.js parseaza raspunsul. 


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
            window.location.href = 'frontPage.html';
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
            window.location.href = 'frontPage.html';
        } else {
            alert('Login failed: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Network Error:', error);
        alert('An error occurred during login. Please try again.');
    }
});



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
                <a href="#" id="logout-link" class="cta-button">Log out</a>
            `;

            document.getElementById('logout-link')?.addEventListener('click', async (e) => {
                e.preventDefault();
                await apiPost({ action: 'Logout' });
                sessionStorage.removeItem('session_id');
                sessionStorage.removeItem('username');
                window.location.reload();
            });
        } else {
            navAccount.innerHTML = '<a href="login.html" class="cta-button">Sign In</a>';
        }
    } catch (error) {
      console.error('Session check failed:', error);

    }

}

if (document.body.dataset.checkSession === 'true') 
{
loadSessionState();
}



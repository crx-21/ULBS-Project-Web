let userEmail = '';

    async function requestCode() {
        const emailInput = document.getElementById('email').value;
        if (!emailInput) return alert('Please enter an email.');
        
        userEmail = emailInput;
        document.getElementById('message').innerText = "Sending...";

        try {
            // Target the single file
            const res = await fetch('../backend/password_recovery.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Include the action so PHP knows to trigger send_code()
                body: JSON.stringify({ action: 'send_code', email: userEmail }) 
            });
            const data = await res.json();
            document.getElementById('message').innerText = data.message;
            
            if (res.ok) {
                document.getElementById('step1').classList.add('hidden');
                document.getElementById('step2').classList.remove('hidden');
            }
        } catch (error) {
            document.getElementById('message').innerText = "An error occurred.";
        }
    }

    async function resetPassword() {
        const code = document.getElementById('code').value;
        const newPassword = document.getElementById('newPassword').value;

        if (!code || !newPassword) return alert('Please fill in all fields.');

        document.getElementById('message').innerText = "Verifying...";

        try {
            // Target the single file
            const res = await fetch('../backend/password_recovery.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Include the action so PHP knows to trigger reset_data()
                body: JSON.stringify({ action: 'reset_data', email: userEmail, code: code, newPassword: newPassword })
            });
            const data = await res.json();
            document.getElementById('message').innerText = data.message;
            
            if (res.ok) {
                document.getElementById('step2').classList.add('hidden');
            }
        } catch (error) {
            document.getElementById('message').innerText = "An error occurred.";
        }
    }
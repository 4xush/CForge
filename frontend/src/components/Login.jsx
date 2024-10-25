const handleLogin = async (event) => {
    event.preventDefault();

    const loginData = {
        email: emailInput, // Get these values from your form inputs
        password: passwordInput
    };

    try {
        const response = await fetch('http://localhost:5000/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('app-token', data.token);  // Store JWT token
            // Redirect or update UI as needed
        } else {
            console.error('Login failed');
        }
    } catch (error) {
        console.error('Error logging in:', error);
    }
};

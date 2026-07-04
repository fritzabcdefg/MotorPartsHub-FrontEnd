// User auth helper with axios
(function (global) {
    let currentUser = null;
    let currentToken = null;

    // Check localStorage for existing session
    function initSession() {
        const stored = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (stored && token) {
            currentUser = JSON.parse(stored);
            currentToken = token;
        }
    }

    function register(data) {
        return api.post('/api/v1/register', data);
    }

    function login(credentials) {
        return api.post('/api/v1/login', credentials);
    }

    function logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        currentUser = null;
        currentToken = null;
        window.location.href = 'login.html';
    }

    function profile() {
        return currentUser;
    }

    function getToken() {
        return currentToken;
    }

    function setSession(user, token) {
        currentUser = user;
        currentToken = token;
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
    }

    function isLoggedIn() {
        return currentUser !== null && currentToken !== null;
    }

    // Handle register form
    $(document).ready(function() {
        initSession();

        $('#registerForm').on('submit', function(e) {
            e.preventDefault();
            
            const name = $('#name').val();
            const email = $('#email').val();
            const password = $('#password').val();

            if (!name || !email || !password) {
                alert('All fields are required.');
                return;
            }

            register({ name, email, password })
                .then(function(response) {
                    alert('Registration successful! Please log in.');
                    window.location.href = 'login.html';
                })
                .catch(function(error) {
                    const message = error.response?.data?.message || 'Registration failed.';
                    alert(message);
                });
        });

        // Handle login form
        $('#loginForm').on('submit', function(e) {
            e.preventDefault();
            
            const email = $('#email').val();
            const password = $('#password').val();

            if (!email || !password) {
                alert('Email and password are required.');
                return;
            }

            const payload = { email: String(email).trim(), password: String(password) };

            api.post('/api/v1/login', payload)
                .then(function(response) {
                    const user = response.data?.user;
                    const token = response.data?.token;
                    if (!user || !token) {
                        throw new Error('Login response was incomplete.');
                    }
                    setSession(user, token);
                    alert('Login successful!');
                    if (user.role === 'admin') {
                        window.location.href = 'dashboard.html';
                    } else {
                        window.location.href = 'home.html';
                    }
                })
                .catch(function(error) {
                    const message = error.response?.data?.message || error.message || 'Login failed.';
                    alert(message);
                });
        });
    });

    global.User = { 
        login, 
        register, 
        profile, 
        logout, 
        getToken, 
        setSession, 
        isLoggedIn, 
        initSession 
    };
})(window);

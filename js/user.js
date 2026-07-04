// User auth helper with jQuery AJAX
(function (global) {
    const API_BASE = 'http://localhost:4000/api/v1';
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
        return $.ajax({
            url: `${API_BASE}/register`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data)
        });
    }

    function login(credentials) {
        return $.ajax({
            url: `${API_BASE}/login`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(credentials)
        });
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
                .done(function(response) {
                    alert('Registration successful! Please log in.');
                    window.location.href = 'login.html';
                })
                .fail(function(xhr) {
                    const error = xhr.responseJSON?.message || 'Registration failed.';
                    alert(error);
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

            login({ email, password })
                .done(function(response) {
                    setSession(response.user, response.token);
                    alert('Login successful!');
                    // Redirect based on role
                    if (response.user.role === 'admin') {
                        window.location.href = 'dashboard.html';
                    } else {
                        window.location.href = 'home.html';
                    }
                })
                .fail(function(xhr) {
                    const error = xhr.responseJSON?.message || 'Login failed.';
                    alert(error);
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

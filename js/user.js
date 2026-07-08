// User auth helper with axios
(function (global) {
    let currentUser = null;
    let currentToken = null;

    // notify() was being called but never defined anywhere, which threw a
    // ReferenceError and broke the code that runs right after it (like the
    // login redirect below). Defining a lightweight toast here fixes that;
    // if a fancier global notify() ever gets loaded elsewhere, this defers to it.
    function notify(message, type = 'info') {
        if (typeof window.notify === 'function' && window.notify !== notify) {
            window.notify(message, type);
            return;
        }

        const colors = {
            success: '#52c456',
            error: '#ff5252',
            warning: '#ffb020',
            info: '#a86bff'
        };
        const color = colors[type] || colors.info;

        let container = document.getElementById('mph-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'mph-toast-container';
            container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            background:#110724;
            color:#f1efff;
            border:1px solid ${color};
            box-shadow:0 8px 24px rgba(0,0,0,0.5), 0 0 12px ${color}66;
            padding:12px 18px;
            border-radius:8px;
            font-family:'Montserrat', sans-serif;
            font-size:0.9rem;
            max-width:320px;
            opacity:0;
            transform:translateY(-8px);
            transition:opacity 0.2s ease, transform 0.2s ease;
        `;
        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-8px)';
            setTimeout(() => toast.remove(), 200);
        }, 3200);
    }

    function clearSession(redirectTo = null) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('mph_cart_v1');
        currentUser = null;
        currentToken = null;
        window.dispatchEvent(new Event('auth:changed'));
        window.dispatchEvent(new CustomEvent('cart:updated'));

        if (redirectTo) {
            window.location.replace(redirectTo);
        }
    }

    // Check localStorage for existing session
    function initSession() {
        const stored = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!stored || !token) {
            clearSession();
            return;
        }

        try {
            currentUser = JSON.parse(stored);
            currentToken = token;
        } catch (err) {
            console.error('Invalid user JSON in localStorage', err);
            clearSession();
        }
    }

    function register(data) {
        return api.post('/api/v1/register', data);
    }

    function login(credentials) {
        return api.post('/api/v1/login', credentials);
    }

    function logout(redirectTo = '/login.html') {
        clearSession(redirectTo);
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
        window.dispatchEvent(new Event('auth:changed'));
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
                notify('All fields are required.', 'warning');
                return;
            }

            register({ name, email, password })
                .then(function(response) {
                    notify('Registration successful! Please log in.', 'success');
                    setTimeout(function() {
                        window.location.href = 'login.html';
                    }, 1200);
                })
                .catch(function(error) {
                    const message = error.response?.data?.message || 'Registration failed.';
                    notify(message, 'error');
                });
        });

        // Handle login form
        $('#loginForm').on('submit', function(e) {
            e.preventDefault();
            
            const email = $('#email').val();
            const password = $('#password').val();

            if (!email || !password) {
                notify('Email and password are required.', 'warning');
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
                    notify('Login successful!', 'success');
                    setTimeout(function() {
                        if (user.role === 'admin') {
                            window.location.href = '/admin/dashboard.html';
                        } else {
                            window.location.href = 'home.html';
                        }
                    }, 1000);
                })
                .catch(function(error) {
                    const message = error.response?.data?.message || error.message || 'Login failed.';
                    notify(message, 'error');
                });
        });
    });

    global.User = { 
        login, 
        register, 
        profile, 
        logout, 
        clearSession,
        getToken, 
        setSession, 
        isLoggedIn, 
        initSession 
    };
})(window);
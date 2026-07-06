function clearAuthSession(redirectTo = null) {
  localStorage.removeItem('user');
  localStorage.removeItem('token');

  if (window.User && typeof window.User.clearSession === 'function') {
    window.User.clearSession(redirectTo);
  } else {
    window.dispatchEvent(new Event('auth:changed'));
    if (redirectTo) {
      window.location.replace(redirectTo);
    }
  }
}

function updateHeaderNav() {
  const stored = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  const hasUserApi = window.User && typeof window.User.isLoggedIn === 'function';
  const navCart = document.getElementById('navCart');
  const navAuth = document.getElementById('navAuth');
  const navDashboard = document.getElementById('navDashboard');
  const navProfile = document.getElementById('navProfile');
  const dropdownMeta = navProfile ? navProfile.querySelector('.dropdown-meta') : null;

  let user = null;

  if (hasUserApi && window.User.isLoggedIn()) {
    user = window.User.profile ? window.User.profile() : null;
  }

  if (!user && stored) {
    try {
      user = JSON.parse(stored);
    } catch (err) {
      console.error('Invalid user JSON in localStorage', err);
      clearAuthSession('/login.html');
      return;
    }
  }

  const isLoggedIn = Boolean(user && token) || (hasUserApi && window.User.isLoggedIn());

  // ==========================================
  // GUEST / LOGGED OUT STATE
  // ==========================================
  if (!isLoggedIn) {
    if (navAuth) {
      navAuth.textContent = 'Login';
      navAuth.href = '/login.html';
      navAuth.style.setProperty('display', 'inline-block', 'important');
    }
    if (navProfile) {
      navProfile.style.setProperty('display', 'none', 'important'); 
      navProfile.classList.remove('active');
    }
    if (navDashboard) navDashboard.style.setProperty('display', 'none', 'important');
    if (navCart) navCart.style.setProperty('display', 'inline-block', 'important');
    if (dropdownMeta) dropdownMeta.textContent = 'Logged out';
    return;
  }

// ==========================================
  // LOGGED IN STATE
  // ==========================================
  const isAdmin = user.role === 'admin';

  if (navAuth) navAuth.style.setProperty('display', 'none', 'important');
  if (navProfile) {
    navProfile.style.setProperty('display', 'inline-block', 'important'); 
    if (dropdownMeta) {
      // 1. Try getting the name from the current user session object
      let displayName = user.name;
      
      // 2. Fallback: If session object is empty, look directly inside localStorage strings
      if (!displayName) {
        try {
          const localUser = JSON.parse(localStorage.getItem('user') || '{}');
          displayName = localUser.name;
        } catch (e) {
          console.error("Error reading fallback name storage:", e);
        }
      }
      
      // 3. Fallback 2: If name still isn't found, cut out the prefix from their login email
      if (!displayName && user.email) {
        displayName = user.email.split('@')[0];
      }
      
      // 4. Final placeholder fallback
      if (!displayName) {
        displayName = 'User';
      }

      // Isolate just the first word (first name)
      const firstName = displayName.trim().split(' ')[0];
      dropdownMeta.textContent = `Logged in as ${firstName}`;
    }
  }

  if (isAdmin) {
    if (navDashboard) navDashboard.style.setProperty('display', 'inline-block', 'important');
    if (navCart) navCart.style.setProperty('display', 'none', 'important');
  } else {
    if (navDashboard) navDashboard.style.setProperty('display', 'none', 'important');
    if (navCart) navCart.style.setProperty('display', 'inline-block', 'important');
  }
}

  function initHeaderNav() {
    if (window.headerNavInitialized) {
      updateHeaderNav();
      return;
    }

    window.headerNavInitialized = true;
    if (window.User && typeof window.User.initSession === 'function') {
      window.User.initSession();
    }
    updateHeaderNav();
  
  // ==========================================
  // FAIL-SAFE: INJECT OVERRIDE STYLES FOR CLICK LOCK
  // ==========================================
  if (!document.getElementById('mph-header-overrides')) {
    const style = document.createElement('style');
    style.id = 'mph-header-overrides';
    style.innerHTML = `
      .nav-dropdown.active .dropdown-menu {
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ==========================================
  // CLICK AND ACTION HANDLERS
  // ==========================================
  document.addEventListener('click', function (e) {
    const navProfile = document.getElementById('navProfile');

    // 1. Handle Profile Menu Click Toggling
    const profileTrigger = e.target.closest('.profile-trigger');
    if (profileTrigger) {
      e.preventDefault();
      e.stopPropagation(); 
      if (navProfile) {
        navProfile.classList.toggle('active');
      }
      return;
    }

    // 2. Handle Logout Targets
    const logoutTarget = e.target.closest('#navLogout') || e.target.closest('.logout-item');
    if (logoutTarget) {
      e.preventDefault();
      if (window.User && typeof window.User.logout === 'function') {
        window.User.logout('/login.html');
      } else {
        clearAuthSession('/login.html');
      }
      return;
    }

    // 3. Click Away Dismissal (Only close if clicking OUTSIDE the entire profile block)
    if (navProfile && !navProfile.contains(e.target)) {
      navProfile.classList.remove('active');
    }
  });

  window.addEventListener('storage', updateHeaderNav);
  window.addEventListener('auth:changed', updateHeaderNav);
}

// Global execution hooks
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeaderNav);
} else {
  initHeaderNav();
}

window.initHeaderNav = initHeaderNav;
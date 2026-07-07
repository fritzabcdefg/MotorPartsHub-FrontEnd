(function (global) {
    const CART_KEY = 'mph_cart_v1';

    function getCart() {
        const raw = localStorage.getItem(CART_KEY);
        return raw ? JSON.parse(raw) : [];
    }

    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateCartBadge();
        window.dispatchEvent(new CustomEvent('cart:updated'));
    }

    function clearCart(silent = false) {
        localStorage.removeItem(CART_KEY);
        updateCartBadge();
        if (!silent) {
            window.dispatchEvent(new CustomEvent('cart:updated'));
        }
    }

    function hasActiveSession() {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        return Boolean(storedUser && token);
    }

    function updateCheckoutState() {
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (!checkoutBtn) return;
        const canCheckout = hasActiveSession();
        checkoutBtn.disabled = !canCheckout;
        checkoutBtn.textContent = canCheckout ? 'Secure Checkout ➔' : 'Login to Checkout';
        checkoutBtn.classList.toggle('disabled', !canCheckout);
        checkoutBtn.style.opacity = canCheckout ? '1' : '0.7';
    }

    function handleCheckoutClick(event) {
        event.preventDefault();
        if (!hasActiveSession()) {
            // Not logged in — send to login
            window.location.href = '/login.html';
            return;
        }
        // Logged in — save cart snapshot for order-success.html receipt display,
        // then navigate to checkout
        const cart = getCart();
        if (!cart || cart.length === 0) {
            alert('Your cart is empty.');
            return;
        }
        localStorage.setItem('mph_last_order', JSON.stringify(cart));
        window.location.href = '/checkout.html'; // FIXED: was missing this line
    }

    function addItem(item) {
        const cart = getCart();
        const normalizedId = String(item.item_id ?? item.id ?? '');
        const normalizedItem = Object.assign({}, item, {
            item_id:    normalizedId,
            id:         normalizedId,
            name:       item.name || item.description || 'Unnamed item',
            price:      Number(item.price ?? item.sell_price ?? 0),
            sell_price: Number(item.sell_price ?? item.price ?? 0),
            quantity:   Number(item.quantity || 1)
        });
        const existing = cart.find(i => String(i.item_id ?? i.id ?? '') === normalizedId);
        if (existing) existing.quantity = (existing.quantity || 0) + (normalizedItem.quantity || 1);
        else cart.push(normalizedItem);
        saveCart(cart);
        return cart;
    }

    function removeItem(itemId) {
        let cart = getCart();
        cart = cart.filter(i => i.item_id !== itemId);
        saveCart(cart);
        return cart;
    }

    function updateQuantity(itemId, quantity) {
        let cart = getCart();
        const item = cart.find(i => i.item_id === itemId);
        if (item) {
            if (quantity <= 0) {
                cart = cart.filter(i => i.item_id !== itemId);
            } else {
                item.quantity = quantity;
            }
            saveCart(cart);
        }
        return cart;
    }

    function updateCartBadge() {
        const cart = getCart();
        const count = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const badge = document.getElementById('itemCount');
        if (badge) {
            badge.textContent = count > 0 ? count : '0';
            return true;
        }
        window.setTimeout(updateCartBadge, 100);
        return false;
    }

    document.addEventListener('DOMContentLoaded', function () {
        updateCartBadge();
        updateCheckoutState();
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.removeEventListener('click', handleCheckoutClick);
            checkoutBtn.addEventListener('click', handleCheckoutClick);
        }
    });
    window.addEventListener('load', function () {
        updateCartBadge();
        updateCheckoutState();
    });
    window.addEventListener('storage', function () {
        updateCartBadge();
        updateCheckoutState();
    });
    window.addEventListener('cart:updated', function () {
        updateCartBadge();
        updateCheckoutState();
    });
    window.addEventListener('auth:changed', function () {
        updateCartBadge();
        updateCheckoutState();
    });

    global.Cart = { getCart, saveCart, clearCart, addItem, removeItem, updateQuantity, updateCartBadge, hasActiveSession, updateCheckoutState };
})(window);
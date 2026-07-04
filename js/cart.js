// Base cart utilities for MotorPartsHub
(function (global) {
    const CART_KEY = 'mph_cart_v1';

    function getCart() {
        const raw = localStorage.getItem(CART_KEY);
        return raw ? JSON.parse(raw) : [];
    }

    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateCartBadge();
    }

    function addItem(item) {
        const cart = getCart();
        const normalizedId = String(item.item_id ?? item.id ?? '');
        const normalizedItem = Object.assign({}, item, {
            item_id: normalizedId,
            id: normalizedId,
            name: item.name || item.description || 'Unnamed item',
            quantity: item.quantity || 1
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
        return false;
    }

    // Update badge on page load and listen for storage changes
    document.addEventListener('DOMContentLoaded', updateCartBadge);
    window.addEventListener('load', updateCartBadge);
    window.addEventListener('storage', updateCartBadge);

    global.Cart = { getCart, saveCart, addItem, removeItem, updateQuantity, updateCartBadge };
})(window);

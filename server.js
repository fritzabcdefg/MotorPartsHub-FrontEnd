const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use(express.static(path.join(__dirname, 'public')));

app.get(/^(?!\/api\/).*/, (req, res) => {
  const requestedPath = req.path.toLowerCase();

  if (requestedPath === '/home' || requestedPath === '/home.html') {
    return res.sendFile(path.join(__dirname, 'public', 'home.html'));
  }

  if (requestedPath === '/item' || requestedPath === '/item.html') {
    return res.sendFile(path.join(__dirname, 'public', 'item.html'));
  }

  if (requestedPath === '/dashboard' || requestedPath === '/dashboard.html') {
    return res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
  }

  if (requestedPath === '/login' || requestedPath === '/login.html') {
    return res.sendFile(path.join(__dirname, 'public', 'login.html'));
  }

  if (requestedPath === '/register' || requestedPath === '/register.html') {
    return res.sendFile(path.join(__dirname, 'public', 'register.html'));
  }

  if (requestedPath === '/cart' || requestedPath === '/cart.html') {
    return res.sendFile(path.join(__dirname, 'public', 'cart.html'));
  }

  if (requestedPath === '/profile' || requestedPath === '/profile.html') {
    return res.sendFile(path.join(__dirname, 'public', 'profile.html'));
  }

  return res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend dev server running at http://localhost:${PORT}`);
});

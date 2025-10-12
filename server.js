const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Security and embedding headers
app.use((req, res, next) => {
  // Allow the page to be embedded on Webflow and your own domains
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https: data: blob:; " +
    "img-src 'self' https: data: blob:; " +
    "font-src 'self' https: data:; " +
    "style-src 'self' 'unsafe-inline' https:; " +
    "script-src 'self' 'unsafe-inline' https:; " +
    "connect-src 'self' https:; " +
    "frame-ancestors 'self' https://webflow.com https://*.webflow.io https://snoutservices.com https://*.snoutservices.com"
  );
  // Avoid old X-Frame-Options limitations by not setting it (CSP frame-ancestors supersedes it)
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// Cache static assets lightly
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    } else {
      res.setHeader('Cache-Control', 'no-store');
    }
  }
}));

// Fallback to index
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Snout booking form running on http://localhost:${PORT}`);
});

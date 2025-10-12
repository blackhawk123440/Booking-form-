# Snout Booking Form – Deploy to Render + Embed in Webflow

This repo serves the exact booking form as a standalone page and makes it easy to embed into Webflow with perfect visual fidelity and mobile readiness.

## Quick Start (Local)

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Deploy to Render (from GitHub)

1. Push this folder to a new GitHub repo.
2. In Render, click New → Web Service.
3. Connect your repo, choose the default branch.
4. Runtime: Node. Build Command: `npm install`. Start Command: `node server.js`.
5. Create the service. Your app will be at `https://<your-service>.onrender.com`.

## Enable iframe embedding (already configured)

This server sets a Content-Security-Policy with:
```
frame-ancestors 'self' https://webflow.com https://*.webflow.io https://snoutservices.com https://*.snoutservices.com
```
This allows the page to be embedded in your Webflow site and on your own domains. Edit `server.js` if you need to add more.

## Embed in Webflow

1. Add an Embed element where you want the form.
2. Paste this HTML (replace the `src` with your Render URL):

```html
<div style="position:relative;width:100%;">
  <iframe
    id="snoutBookingIframe"
    src="https://<your-service>.onrender.com/"
    style="width:100%;border:0;overflow:hidden;height:100vh;"
    scrolling="no"
    allowtransparency="true"
  ></iframe>
</div>

<script>
  // Auto-resize listener (pairs with the inline script inside index.html)
  window.addEventListener('message', function(e) {
    try {
      if (e.data && e.data.type === 'SNOUT_IFRAME_HEIGHT') {
        var iframe = document.getElementById('snoutBookingIframe');
        if (iframe && typeof e.data.height === 'number') {
          iframe.style.height = e.data.height + 'px';
        }
      }
    } catch (err) {}
  });
</script>
```

That’s it. The form remains visually exact and fully mobile‑optimized. The inner page posts its height to the parent so the iframe expands to fit content on every step.

## Notes

- The original form HTML is preserved as `public/index.html` with a tiny, visual‑no‑change script appended that only posts height to the parent page.
- All fonts and icons load via HTTPS CDNs.
- If you later add back‑end submission, you can extend the Express server with an API route.

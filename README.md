Snout Booking Form — Render + Webflow embed

This build keeps your original HTML intact and adds
1) a centered white container that caps width on desktop and trims spacing on mobile
2) a robust auto-resize messenger so the iframe perfectly fits each step

Local
npm install
npm run dev
open http://localhost:3000

Render
New → Web Service → connect repo
Build command: npm install
Start command: node server.js

Webflow embed listener
Place this in your Webflow Embed, replacing the src with your Render or custom domain URL.

<div style="position:relative;width:100%;">
  <iframe
    id="snoutBookingIframe"
    src="https://your-service.onrender.com/"
    style="width:100%;border:0;overflow:hidden;"
    scrolling="no"
    allowtransparency="true"
  ></iframe>
</div>

<script>
  (function () {
    var iframe = document.getElementById('snoutBookingIframe');
    var wrap = iframe.parentElement;
    wrap.style.maxWidth = '920px';
    wrap.style.margin = '0 auto';
    wrap.style.borderRadius = '16px';
    wrap.style.boxShadow = '0 6px 32px rgba(0,0,0,0.08)';
    wrap.style.background = '#ffffff';
    wrap.style.transition = 'height 240ms ease';

    function setHeights(h) {
      if (!h || !iframe || !wrap) return;
      iframe.style.height = h + 'px';
      wrap.style.height = h + 'px';
    }

    window.addEventListener('message', function (e) {
      try {
        if (e.data && e.data.type === 'SNOUT_IFRAME_HEIGHT') {
          var h = Number(e.data.height);
          if (Number.isFinite(h) && h > 0) setHeights(h);
        }
      } catch (_) {}
    });
  })();
</script>

Notes
If you switch to a custom domain like book.snoutservices.com, just replace the iframe src and add that domain in Render.

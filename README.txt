Snout Booking v1.0.1 - Webflow-fit Package

What you asked for
- A real white container so the widget looks like a proper form on desktop and mobile.
- Not stretched to the sides on desktop (capped at 820px by default).
- Mobile fits the container cleanly.
- The container height adjusts by step: short for Service, Dates, Times; taller only for Contact.

How it works
- The app posts its height to the parent page via postMessage any time content changes.
- Add a tiny listener on your Webflow page to set the iframe height based on those messages.

Embed with auto-resize
1) Place this iframe where you want the form (replace SRC with your Render domain)

<iframe id="snout-frame"
  src="https://YOUR-RENDER-URL"
  title="Snout Booking"
  style="width:100%; border:0;"
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade"
  sandbox="allow-scripts allow-forms allow-same-origin"></iframe>

2) Below it (or anywhere on the page) add this tiny script

<script>
  window.addEventListener('message', function(e){
    if (!e.data || e.data.type !== 'snout-size') return;
    var frame = document.getElementById('snout-frame');
    if (!frame) return;
    var min = 540; // adjust minimum height if needed
    var h = Math.max(min, Number(e.data.height || 0));
    frame.style.height = h + 'px';
  });
</script>

Brand tweaks
- Change max width by editing .sb-container max-width in booking.css.
- Colors, radius, shadows are at the top of booking.css as variables.

Next
- Deploy to Render like before and use the iframe + listener above. The container will only extend on the contact step, exactly like you wanted.

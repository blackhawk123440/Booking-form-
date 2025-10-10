Snout Booking - Deployable Package

What this is
A clean, accessible, mobile first booking form with a time modal and apply all logic, scoped under #snout-booking.

Files
index.html
booking.css
booking.js
README.txt

Deploy on GitHub and Render
1. Create a new GitHub repo and add these files at the root
2. On Render choose Static Site
   Build command none
   Publish directory set to root
3. After deploy you get a public URL

Embed into Webflow
Use an iframe to avoid the 50k embed limit

<iframe
  src="https://YOUR-RENDER-URL"
  title="Snout Booking"
  style="width:100%; min-height:940px; border:0;"
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade"
  sandbox="allow-scripts allow-forms allow-same-origin"
></iframe>

Notes
You can wire the submit handler to Airtable or Stripe later with fetch.
Change the brand look by editing CSS variables at the top of booking.css.

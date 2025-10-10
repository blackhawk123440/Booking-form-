Snout Booking v1.0.2

Framed step container and auto resize for Webflow iframe.

Parent page listener example for Webflow:
<script>
window.addEventListener('message', function(e){
  if(e.data && e.data.type === 'snout-size'){
    var iframe = document.querySelector('iframe[src="https://snout-form.onrender.com"]');
    if(iframe){ iframe.style.height = e.data.height + 'px'; }
  }
});
</script>

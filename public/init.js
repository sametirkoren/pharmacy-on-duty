// Global error handler for crypto wallet interference
window.addEventListener('error', function(event) {
  if (event.message && (event.message.includes('ethereum') || event.message.includes('selectedAddress'))) {
    event.preventDefault();
    return false;
  }
});

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').catch(function() {});
  });
}

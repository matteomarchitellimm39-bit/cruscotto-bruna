/* Bruna27 · avvisi sul telefono e sul computer */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { testo: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.titolo || 'Bruna27', {
    body: d.testo || 'Apri Bruna27 per i dettagli.', icon: d.icon || 'icona-192.png', badge: 'icona-192.png',
    data: { link: d.link || 'p-home', nid: d.nid || null }, tag: d.tag ? 'b27-' + d.tag : 'b27-' + Date.now(), renotify: !!d.tag, requireInteraction: !!d.urgente
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const link = (e.notification.data && e.notification.data.link) || 'p-home';
  const nid = (e.notification.data && e.notification.data.nid) || '';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if (c.url.startsWith(self.registration.scope)) { c.postMessage({ go: link, nid }); return c.focus(); } }
    return self.clients.openWindow(self.registration.scope + '?go=' + encodeURIComponent(link) + (nid ? '&n=' + nid : ''));
  }));
});

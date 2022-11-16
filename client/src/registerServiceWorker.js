const isLocalhost = Boolean(
  ['[::1]', 'localhost'].includes(window.location.hostname) ||
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
);

export default function register() {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location);
    if (publicUrl.origin !== window.location.origin) return;

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
      if (isLocalhost) checkValidServiceWorker(swUrl);
      else registerValidSW(swUrl);
    });
  }
}

function registerValidSW(swUrl) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller)
              console.log('New content is available; please refresh.');
            else console.log('Content is cached for offline use.');
          }
        };
      };
    })
    .catch((error) =>
      console.error('Error during service worker registration:', error)
    );
}

function checkValidServiceWorker(swUrl) {
  fetch(swUrl)
    .then(async (res) => {
      if (
        res.status === 404 ||
        res.headers.get('content-type').indexOf('javascript') === -1
      ) {
        const registration = await navigator.serviceWorker.ready;
        await registration.unregister();
        window.location.reload();
      } else registerValidSW(swUrl);
    })
    .catch(() => console.log('App is running in offline mode.'));
}

export function unregister() {
  if ('serviceWorker' in navigator)
    navigator.serviceWorker.ready.then((registration) =>
      registration.unregister()
    );
}

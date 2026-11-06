// Offline support, painless updates and the install helper for grown-ups.
// The helper shows only on the first screen and only in a normal browser tab,
// so that a child playing the installed app never sees a single word.
import { app } from './core/engine.js';
import { save } from './core/save.js';

const TEXT = {
  ru: {
    add: 'Добавить на экран «Домой»',
    title: 'Установка',
    ios: ['Нажмите кнопку «Поделиться» в Safari (квадрат со стрелкой вверх).', 'Выберите «На экран “Домой”». Если пункта не видно, прокрутите список вниз.', 'Нажмите «Добавить». Запускайте игру с новой иконки и один раз откройте её с интернетом: дальше она работает и без него.'],
    android: ['Откройте меню Chrome (три точки справа вверху).', 'Выберите «Установить приложение» или «Добавить на главный экран».', 'Подтвердите. Запускайте игру с новой иконки.']
  },
  en: {
    add: 'Add to Home Screen',
    title: 'Install',
    ios: ['Tap the Share button in Safari (the square with an up arrow).', 'Choose “Add to Home Screen”. Scroll down if you don’t see it.', 'Tap “Add”. Launch from the new icon once while online; after that it works offline too.'],
    android: ['Open the Chrome menu (three dots, top right).', 'Choose “Install app” or “Add to Home screen”.', 'Confirm, then launch from the new icon.']
  }
};

export function setupPWA() {
  registerSW();
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (standalone) return;

  const T = (navigator.language || 'en').toLowerCase().startsWith('ru') ? TEXT.ru : TEXT.en;
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  if (!isIOS && !isAndroid) return;

  const btn = document.getElementById('install');
  const guide = document.getElementById('guide');
  btn.textContent = T.add;
  let deferred = null;
  let onSplash = app.scene && app.scene.name === 'splash';
  const refresh = () => { btn.style.display = onSplash ? 'block' : 'none'; };
  refresh();
  document.addEventListener('wonder:splash', (e) => { onSplash = e.detail; refresh(); });
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; });
  window.addEventListener('appinstalled', () => { deferred = null; btn.remove(); });

  btn.addEventListener('click', async () => {
    if (deferred) {
      deferred.prompt();
      deferred = null;
      return;
    }
    document.getElementById('gt').textContent = T.title;
    document.getElementById('gl').innerHTML = (isIOS ? T.ios : T.android).map((s) => `<li>${s}</li>`).join('');
    guide.style.display = 'flex';
  });
  document.getElementById('gc').addEventListener('click', () => { guide.style.display = 'none'; });
}

function registerSW() {
  if (!('serviceWorker' in navigator) || location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;
  navigator.serviceWorker.register('sw.js').then((reg) => {
    const applyIfWaiting = () => {
      // A new version is ready: switch at a moment that cannot interrupt play
      const atRest = !app.scene || app.scene.name === 'splash' || (document.hidden && app.scene.name === 'hub');
      if (reg.waiting && atRest && navigator.serviceWorker.controller) {
        save.now();
        reg.waiting.postMessage('activate');
      }
    };
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      if (w) w.addEventListener('statechange', () => { if (w.state === 'installed') applyIfWaiting(); });
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) applyIfWaiting();
      else reg.update().catch(() => {});
    });
    applyIfWaiting();
  }).catch(() => {});
  // The very first install also fires this; only a real update needs a reload
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded || !hadController) return;
    reloaded = true;
    location.reload();
  });
}

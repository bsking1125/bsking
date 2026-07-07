// 앱 껍데기(화면 파일들)만 캐시해서 오프라인에서도 앱이 열리게 해줘요.
// 데이터는 어차피 Firebase에서 실시간으로 받아오는 거라, 그쪽 요청은 건드리지 않고 그냥 통과시켜요.
// 전략: 인터넷이 되면 항상 최신 파일을 먼저 받아오고, 안 될 때만 저장해둔 걸로 대체해요
// (한창 기능을 계속 고치는 중이라, "일단 저장해둔 거 먼저 보여주기"보다 이게 더 맞아요).
const CACHE_NAME = 'wh-app-shell-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .catch(() => {}) // 파일명이 다르거나 없는 항목이 있어도 설치 자체는 실패하지 않게
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return; // firebase/구글 API 요청은 그대로 네트워크로

  event.respondWith(
    fetch(event.request).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return res;
    }).catch(() => caches.match(event.request))
  );
});

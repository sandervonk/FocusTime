// basic serviceworker

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open("FocusTime-[-version-number-]").then(function (cache) {
      return cache.addAll(["./js/util.js", "./js/auth.js", "./js/index.js", "./js/signup.js", "./js/app.js", "./index.html", "./signup.html", "./app/index.html", "./img/icon/favicon.png", "./img/icon/favicon.svg", "./img/icon/favicon-monochrome.png", "./img/icon/favicon-monochrome.svg"]);
    })
  );
});

// basic offline functionality (aside from firebase)
self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      return response || fetch(event.request);
    })
  );
});

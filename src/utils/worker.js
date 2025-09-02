addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const newUrl = `https://cdn.example.com${url.pathname}`; // CDN الرئيسي

  const modifiedHeaders = new Headers(request.headers);
  modifiedHeaders.set("CF-Region", "YE");

  return fetch(newUrl, {
    method: request.method,
    headers: modifiedHeaders,
  });
}

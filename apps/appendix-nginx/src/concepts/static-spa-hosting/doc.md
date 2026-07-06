# Static SPA hosting and fallback

A single-page app has two very different kinds of files:

- **Hashed assets**: `app.D8s9s.js`, `style.C7fs.css`, images.
- **HTML shell**: `index.html`, which points to the current asset names.

They need different cache policies.

## Correct caching split

Hashed assets:

```nginx
location /assets/ {
  try_files $uri =404;
  add_header Cache-Control "public, max-age=31536000, immutable";
}
```

HTML:

```nginx
location = /index.html {
  add_header Cache-Control "no-cache";
}
```

Client routes:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Why this works

Hashed assets can be cached for a long time because their filenames change when content changes.
`index.html` must be revalidated so users discover new asset filenames after deploy.

## Common production bug

If `index.html` is cached as immutable, users keep booting an old asset graph. If old assets are
deleted during deploy, the page can become blank because HTML points to filenames that no longer
exist.

## Senior interview phrasing

> For SPA hosting I use long immutable caching only for hashed assets, no-cache or validation for
> `index.html`, and `try_files` fallback only for front-end routes. Missing assets should 404, not
> silently return the HTML shell.

## References

- [Nginx: Serving static content](https://docs.nginx.com/nginx/admin-guide/web-server/serving-static-content/)
- [Nginx: add_header](https://nginx.org/en/docs/http/ngx_http_headers_module.html#add_header)

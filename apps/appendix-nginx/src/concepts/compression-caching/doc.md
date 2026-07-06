# Compression and cache headers

Nginx can reduce transfer size and shape browser/CDN cache behavior.

## Compression

Compress text-like responses:

```nginx
gzip on;
gzip_types text/css application/javascript application/json image/svg+xml;
gzip_vary on;
```

Do not waste CPU compressing already-compressed formats such as JPEG, PNG, WebP, MP4, or gzip files.

If your build emits Brotli/gzip precompressed files, serving those can be better than compressing
on the fly.

## Cache-Control

Hashed assets:

```http
Cache-Control: public, max-age=31536000, immutable
```

HTML:

```http
Cache-Control: no-cache
```

`no-cache` does not mean "do not store"; it means revalidate before reuse. That is often right for
`index.html`.

## CDN alignment

If a CDN sits in front, Nginx headers and CDN rules must agree. Otherwise Nginx can say "revalidate
HTML" while the CDN serves stale HTML for hours.

## Senior interview phrasing

> I separate compression from caching. Compression reduces bytes for text assets. Cache-Control
> defines freshness. For SPAs, immutable hashed assets and revalidated HTML are the key deploy-safe
> split.

## References

- [Nginx: gzip module](https://nginx.org/en/docs/http/ngx_http_gzip_module.html)
- [MDN: Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)

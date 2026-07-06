# Reverse proxy and upstream headers

Nginx often sits in front of API services. The browser talks to Nginx; Nginx talks to upstream
servers.

```text
browser -> nginx -> upstream service
```

## `proxy_pass`

`proxy_pass` forwards the request to another server or upstream group.

Trailing slash behavior matters:

```nginx
location /api/ {
  proxy_pass http://api_upstream/;
}
```

Changing the slash can change whether `/api/users` becomes `/users` or `/api/users` upstream.

## Forwarded headers

Upstreams often need original request context:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

Without `X-Forwarded-Proto`, apps can generate `http://` redirects behind HTTPS, break secure
cookies, or produce wrong canonical URLs.

## Timeouts and buffering

Timeouts are product behavior:

- too short: legitimate slow requests fail,
- too long: incidents hang the UI and tie up resources.

Streaming endpoints may need different buffering/timeout settings from normal JSON APIs.

## Senior interview phrasing

> As a reverse proxy, Nginx must preserve host, scheme, and client IP context, map URI prefixes
> intentionally, and bound upstream behavior with timeouts. I always review `proxy_pass` slash
> semantics and forwarded headers.

## References

- [Nginx: proxy_pass](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass)
- [Nginx: proxy_set_header](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_set_header)

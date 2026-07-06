# Security headers and rate limiting

Nginx can enforce baseline protections before traffic reaches the app.

## Security headers

Useful headers include:

- `Content-Security-Policy`,
- `X-Content-Type-Options: nosniff`,
- `Referrer-Policy`,
- `Strict-Transport-Security`,
- `Permissions-Policy`.

Use `always` when headers should also appear on error responses:

```nginx
add_header X-Content-Type-Options "nosniff" always;
```

## CSP rollout

CSP is powerful but easy to break. For large existing apps:

1. Start with `Content-Security-Policy-Report-Only`.
2. Collect violations.
3. Remove unsafe sources.
4. Enforce.

## Rate limiting

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
  limit_req zone=api burst=20 nodelay;
}
```

Behind a proxy/load balancer, make sure the key represents the real client, not only the proxy IP.

## Senior interview phrasing

> I use Nginx for baseline security headers and edge rate limits, but I treat them as defense in
> depth. CSP needs a careful rollout, and rate limiting must use the correct client identity behind
> proxies.

## References

- [Nginx: limit_req module](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html)
- [MDN: Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [MDN: X-Content-Type-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options)

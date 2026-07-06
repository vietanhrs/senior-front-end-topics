# TLS, HTTP/2, and HTTP/3

Nginx often terminates TLS: it presents the certificate, decrypts traffic, and forwards requests to
upstreams over private networking.

## HTTP to HTTPS

```nginx
server {
  listen 80;
  server_name app.example.com;
  return 301 https://$host$request_uri;
}
```

This keeps plaintext traffic from serving the app.

## Certificate chain

Use a valid certificate and full chain:

```nginx
ssl_certificate /etc/ssl/app/fullchain.pem;
ssl_certificate_key /etc/ssl/app/privkey.pem;
```

A missing intermediate certificate can work in some browsers and fail in others.

## HTTP/2 and HTTP/3

HTTP/2 multiplexes requests over one connection and improves many asset-heavy pages. HTTP/3 uses
QUIC over UDP and can help on lossy networks, but deployment depends on Nginx version, CDN/load
balancer path, firewall, and client support.

## HSTS

HSTS tells browsers to use HTTPS automatically in the future:

```nginx
add_header Strict-Transport-Security "max-age=31536000" always;
```

Roll it out carefully. A broken HTTPS setup plus long HSTS can lock users out.

## Senior interview phrasing

> Nginx can terminate TLS, redirect HTTP to HTTPS, enable HTTP/2 or HTTP/3 where supported, and add
> HSTS. I verify certificate chain, forwarded scheme headers, and rollout safety before treating the
> transport layer as done.

## References

- [Nginx: HTTPS servers](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [Nginx: HTTP/2 module](https://nginx.org/en/docs/http/ngx_http_v2_module.html)
- [MDN: Strict-Transport-Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)

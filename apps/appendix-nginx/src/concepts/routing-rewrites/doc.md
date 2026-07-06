# Routing, rewrites, root, and alias

Many Nginx bugs are path mapping bugs.

## `root` vs `alias`

`root` appends the URI to a root directory:

```nginx
location /images/ {
  root /var/www/app;
}
```

`/images/logo.png` maps to `/var/www/app/images/logo.png`.

`alias` replaces the matched location prefix:

```nginx
location /docs/ {
  alias /var/www/docs/;
}
```

`/docs/intro.html` maps to `/var/www/docs/intro.html`.

## Redirect vs rewrite

`return 301 /new-path/` tells the browser to request a new URL.

`rewrite ... break` changes URI handling internally inside Nginx. Use it carefully because rewrites
can loop or obscure where a request finally went.

## Proxy slash semantics

`proxy_pass http://api/;` and `proxy_pass http://api;` can forward different upstream URIs when
used inside prefix locations. Test with real paths.

## Senior interview phrasing

> For Nginx routing issues I inspect whether the request maps to filesystem or upstream, then check
> `root` vs `alias`, redirect vs internal rewrite, `proxy_pass` slash behavior, and SPA fallback
> order.

## References

- [Nginx: root](https://nginx.org/en/docs/http/ngx_http_core_module.html#root)
- [Nginx: alias](https://nginx.org/en/docs/http/ngx_http_core_module.html#alias)
- [Nginx: rewrite module](https://nginx.org/en/docs/http/ngx_http_rewrite_module.html)

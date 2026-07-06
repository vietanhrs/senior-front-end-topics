# Request lifecycle and config selection

Nginx is easiest to understand as a request router plus static file server plus reverse proxy.

A request roughly goes through:

1. TCP/TLS connection is accepted on a `listen` socket.
2. Nginx chooses a `server` block using address, port, SNI, and `Host`.
3. Nginx chooses a `location` inside that server.
4. The selected location serves a file, rewrites/redirects, proxies upstream, or returns a response.

## Location matching

Priority is not simply "first match". Exact locations, prefix locations, `^~`, and regex locations
have specific matching rules. This matters for SPAs because API routes must not fall through to
`index.html`.

## `try_files`

`try_files` checks filesystem candidates in order:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

For an SPA, this allows `/settings` refresh to serve `index.html`. It should not be applied to API
or immutable asset locations.

## Senior interview phrasing

> Nginx selects a virtual server, then a location, then either serves a file, redirects, rewrites,
> proxies, or returns a response. For front-end deployments I pay special attention to location
> precedence, `try_files` order, and keeping SPA fallback separate from APIs and assets.

## References

- [Nginx: How nginx processes a request](https://nginx.org/en/docs/http/request_processing.html)
- [Nginx: location directive](https://nginx.org/en/docs/http/ngx_http_core_module.html#location)
- [Nginx: try_files](https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files)

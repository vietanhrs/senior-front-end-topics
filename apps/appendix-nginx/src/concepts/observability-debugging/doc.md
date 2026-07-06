# Observability and debugging

Nginx is often the first place where production truth appears. Good logs can answer:

- Did the browser request the expected asset?
- Did the SPA fallback fire?
- Was the upstream slow?
- Did the CDN/cache serve stale content?
- Did a specific deploy create 404s?

## Useful log fields

```nginx
log_format main '$request_id $remote_addr $host "$request" '
                '$status $body_bytes_sent $request_time '
                'upstream=$upstream_addr upstream_time=$upstream_response_time '
                'cache=$upstream_cache_status';
```

Important fields:

- request ID,
- host,
- request line,
- status,
- request time,
- upstream address,
- upstream response time,
- cache status,
- bytes sent.

## Request correlation

Return the request ID:

```nginx
add_header X-Request-ID $request_id always;
```

The browser, Nginx logs, and upstream logs can then be joined during incident debugging.

## Debug checklist

For blank page after deploy:

1. Check `index.html` status/cache.
2. Check hashed JS/CSS status.
3. Check whether missing assets return 404 or HTML.
4. Check CDN cache status.
5. Check deploy timestamp and request ID correlation.

## Senior interview phrasing

> I want Nginx logs to include request ID, status, request time, upstream address/time, and cache
> status. That lets me distinguish front-end asset 404s, stale HTML, upstream latency, and routing
> mistakes quickly.

## References

- [Nginx: log_format](https://nginx.org/en/docs/http/ngx_http_log_module.html#log_format)
- [Nginx: error_log](https://nginx.org/en/docs/ngx_core_module.html#error_log)

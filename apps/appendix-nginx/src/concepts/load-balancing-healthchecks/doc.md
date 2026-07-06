# Load balancing and health checks

Nginx can distribute requests across upstream servers:

```nginx
upstream api_upstream {
  least_conn;
  server 10.0.1.10:8080 max_fails=3 fail_timeout=10s;
  server 10.0.1.11:8080 max_fails=3 fail_timeout=10s;
}
```

## Strategies

Common strategies:

- round-robin default,
- `least_conn`,
- `ip_hash`,
- weighted servers.

Choose based on traffic shape. Long-polling or streaming traffic may behave poorly with naive
round-robin.

## Passive health

Open-source Nginx commonly uses passive failure detection through `max_fails` and `fail_timeout`.
That means a peer is considered unhealthy because real requests failed.

Active health checks may come from Nginx Plus, Kubernetes, a load balancer, or service mesh.

## Retry risk

`proxy_next_upstream` can retry failures. Retrying safe GETs is different from retrying POST
mutations. Retried non-idempotent writes can duplicate effects unless the backend uses idempotency.

## Senior interview phrasing

> Nginx can balance upstream traffic, fail away from unhealthy peers, and retry selected failures.
> I review load strategy, timeout/failure thresholds, active health source, and whether retries are
> safe for the HTTP method and product action.

## References

- [Nginx: upstream module](https://nginx.org/en/docs/http/ngx_http_upstream_module.html)
- [Nginx: proxy_next_upstream](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_next_upstream)

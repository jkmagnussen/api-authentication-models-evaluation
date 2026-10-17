# Concurrent Load Study (Exploratory)

Generated: 2026-10-06T14:03:33.839Z

This is a separate concurrent workload; it is not pooled with protocol-v4 sequential latency results. Each run warms each model/condition/concurrency cell, then measures concurrent protected-resource traffic and actual completed requests per second. Baseline requests should return HTTP 200; invalid-credential attacks should return HTTP 401. Unexpected status rates are reported rather than filtered.

Results are descriptive by matched block. No significance claims are made from this exploratory run set. The benchmark runs on one local host and does not represent production network or deployment capacity.

| Model | Concurrency | Blocks | Baseline mean RPS | Attack mean RPS | Mean paired RPS delta % | Baseline mean latency ms | Attack mean latency ms | Baseline mean p95 ms | Attack mean p95 ms | Baseline unexpected % | Attack unexpected % |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| JWT | 1 | 5 | 2923.1 | 3159.0 | 8.59 | 0.344 | 0.319 | 0.434 | 0.414 | 0.00 | 0.00 |
| JWT | 10 | 5 | 3489.9 | 3793.8 | 8.68 | 2.868 | 2.644 | 3.296 | 2.966 | 0.00 | 0.00 |
| JWT | 50 | 5 | 3506.2 | 3877.7 | 10.70 | 14.282 | 12.910 | 19.400 | 16.667 | 0.00 | 0.00 |
| OAUTH | 1 | 5 | 1271.4 | 1294.2 | 1.91 | 0.787 | 0.774 | 1.019 | 0.985 | 0.00 | 0.00 |
| OAUTH | 10 | 5 | 2953.4 | 3224.3 | 9.94 | 3.415 | 3.132 | 4.550 | 4.008 | 0.00 | 0.00 |
| OAUTH | 50 | 5 | 3796.8 | 3946.8 | 5.27 | 13.087 | 12.827 | 18.684 | 17.103 | 0.00 | 0.00 |
| SESSIONS | 1 | 5 | 1357.0 | 1395.2 | 2.93 | 0.738 | 0.717 | 0.956 | 0.972 | 0.00 | 0.00 |
| SESSIONS | 10 | 5 | 3346.2 | 3466.6 | 3.74 | 2.989 | 2.886 | 3.641 | 3.520 | 0.00 | 0.00 |
| SESSIONS | 50 | 5 | 3920.7 | 4408.5 | 13.98 | 13.024 | 11.418 | 20.669 | 15.559 | 0.00 | 0.00 |

Raw per-request latencies, condition ordering, warm-up counts, concurrency, runtime, and host metadata are preserved in `runs/`.

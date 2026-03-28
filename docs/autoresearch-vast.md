# Vast Autoresearch Run

## Current Instance

- Status: running on Vast proxy SSH
- GPU target: RTX 5090
- Instance id: `33735286`
- SSH: `ssh -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes -p 15286 root@ssh3.vast.ai`

## Current State

- Refreshed: 2026-03-28T21:28:28.993338+00:00
- Last result: train.py running
- Recovery actions: training_running

```text
step 00949 (17.0%) | loss: 3.334347 | lrm: 1.00 | dt: 326ms | tok/sec: 402,440 | mfu: 4.9% | epoch: 1 | remaining: 1493s    
step 00950 (17.0%) | loss: 3.328968 | lrm: 1.00 | dt: 326ms | tok/sec: 402,499 | mfu: 4.9% | epoch: 1 | remaining: 1493s    
step 00951 (17.1%) | loss: 3.302081 | lrm: 1.00 | dt: 326ms | tok/sec: 402,374 | mfu: 4.9% | epoch: 1 | remaining: 1493s    
step 00952 (17.1%) | loss: 3.308856 | lrm: 1.00 | dt: 326ms | tok/sec: 402,407 | mfu: 4.9% | epoch: 1 | remaining: 1492s    
step 00953 (17.1%) | loss: 3.309236 | lrm: 1.00 | dt: 326ms | tok/sec: 402,454 | mfu: 4.9% | epoch: 1 | remaining: 1492s    
step 00954 (17.1%) | loss: 3.308103 | lrm: 1.00 | dt: 326ms | tok/sec: 402,444 | mfu: 4.9% | epoch: 1 | remaining: 1492s    
step 00955 (17.1%) | loss: 3.317464 | lrm: 1.00 | dt: 326ms | tok/sec: 402,462 | mfu: 4.9% | epoch: 1 | remaining: 1491s    
step 00956 (17.2%) | loss: 3.329129 | lrm: 1.00 | dt: 326ms | tok/sec: 402,369 | mfu: 4.9% | epoch: 1 | remaining: 1491s    
step 00957 (17.2%) | loss: 3.330196 | lrm: 1.00 | dt: 326ms | tok/sec: 402,214 | mfu: 4.9% | epoch: 1 | remaining: 1491s    
step 00958 (17.2%) | loss: 3.332297 | lrm: 1.00 | dt: 326ms | tok/sec: 402,431 | mfu: 4.9% | epoch: 1 | remaining: 1490s    
step 00959 (17.2%) | loss: 3.305104 | lrm: 1.00 | dt: 358ms | tok/sec: 365,614 | mfu: 4.4% | epoch: 1 | remaining: 1490s    
step 00960 (17.2%) | loss: 3.309390 | lrm: 1.00 | dt: 326ms | tok/sec: 402,479 | mfu: 4.9% | epoch: 1 | remaining: 1490s    
step 00961 (17.2%) | loss: 3.309780 | lrm: 1.00 | dt: 326ms | tok/sec: 402,340 | mfu: 4.9% | epoch: 1 | remaining: 1489s    
step 00962 (17.3%) | loss: 3.303708 | lrm: 1.00 | dt: 326ms | tok/sec: 402,417 | mfu: 4.9% | epoch: 1 | remaining: 1489s    
step 00963 (17.3%) | loss: 3.277123 | lrm: 1.00 | dt: 326ms | tok/sec: 402,450 | mfu: 4.9% | epoch: 1 | remaining: 1489s    
step 00964 (17.3%) | loss: 3.280122 | lrm: 1.00 | dt: 327ms | tok/sec: 400,280 | mfu: 4.9% | epoch: 1 | remaining: 1488s    
step 00965 (17.3%) | loss: 3.272328 | lrm: 1.00 | dt: 326ms | tok/sec: 402,335 | mfu: 4.9% | epoch: 1 | remaining: 1488s    
step 00966 (17.3%) | loss: 3.279863 | lrm: 1.00 | dt: 326ms | tok/sec: 402,379 | mfu: 4.9% | epoch: 1 | remaining: 1488s    
step 00967 (17.4%) | loss: 3.295048 | lrm: 1.00 | dt: 326ms | tok/sec: 402,313 | mfu: 4.9% | epoch: 1 | remaining: 1487s    
step 00968 (17.4%) | loss: 3.297443 | lrm: 1.00 | dt: 328ms | tok/sec: 399,017 | mfu: 4.9% | epoch: 1 | remaining: 1487s    
step 00969 (17.4%) | loss: 3.296795 | lrm: 1.00 | dt: 326ms | tok/sec: 402,316 | mfu: 4.9% | epoch: 1 | remaining: 1487s    
step 00970 (17.4%) | loss: 3.309923 | lrm: 1.00 | dt: 326ms | tok/sec: 402,454 | mfu: 4.9% | epoch: 1 | remaining: 1486s    
step 00971 (17.4%) | loss: 3.296462 | lrm: 1.00 | dt: 326ms | tok/sec: 402,236 | mfu: 4.9% | epoch: 1 | remaining: 1486s    
step 00972 (17.4%) | loss: 3.294587 | lrm: 1.00 | dt: 326ms | tok/sec: 402,231 | mfu: 4.9% | epoch: 1 | remaining: 1486s    
step 00973 (17.5%) | loss: 3.291145 | lrm: 1.00 | dt: 332ms | tok/sec: 394,833 | mfu: 4.8% | epoch: 1 | remaining: 1485s    
step 00974 (17.5%) | loss: 3.287487 | lrm: 1.00 | dt: 326ms | tok/sec: 402,205 | mfu: 4.9% | epoch: 1 | remaining: 1485s    
step 00975 (17.5%) | loss: 3.287769 | lrm: 1.00 | dt: 326ms | tok/sec: 402,445 | mfu: 4.9% | epoch: 1 | remaining: 1485s    
step 00976 (17.5%) | loss: 3.289984 | lrm: 1.00 | dt: 326ms | tok/sec: 402,045 | mfu: 4.9% | epoch: 1 | remaining: 1484s    
step 00977 (17.5%) | loss: 3.296544 | lrm: 1.00 | dt: 329ms | tok/sec: 398,782 | mfu: 4.8% | epoch: 1 | remaining: 1484s    
step 00978 (17.6%) | loss: 3.306399 | lrm: 1.00 | dt: 326ms | tok/sec: 402,423 | mfu: 4.9% | epoch: 1 | remaining: 1484s    
step 00979 (17.6%) | loss: 3.296466 | lrm: 1.00 | dt: 326ms | tok/sec: 402,394 | mfu: 4.9% | epoch: 1 | remaining: 1483s    
step 00980 (17.6%) | loss: 3.300765 | lrm: 1.00 | dt: 326ms | tok/sec: 402,258 | mfu: 4.9% | epoch: 1 | remaining: 1483s    
step 00981 (17.6%) | loss: 3.295199 | lrm: 1.00 | dt: 326ms | tok/sec: 402,502 | mfu: 4.9% | epoch: 1 | remaining: 1483s    
step 00982 (17.6%) | loss: 3.266018 | lrm: 1.00 | dt: 326ms | tok/sec: 402,371 | mfu: 4.9% | epoch: 1 | remaining: 1482s    
step 00983 (17.6%) | loss: 3.268758 | lrm: 1.00 | dt: 326ms | tok/sec: 402,352 | mfu: 4.9% | epoch: 1 | remaining: 1482s    ===TRAIN===
  15806 bash -lc /root/.local/bin/uv run train.py > baseline.log 2>&1
  15811 /root/.local/bin/uv run train.py
  15814 /root/autoresearch/.venv/bin/python3 train.py
===RESULTS===
commit	val_bpb	memory_gb	status	description
```

## Sync Policy

- Keep MERCK services stable first.
- Keep the remote training lane alive and recover from environment drift.
- Push meaningful checkpoints to `main`.

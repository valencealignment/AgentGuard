# Vast Autoresearch Run

## Current Instance

- Status: running on Vast proxy SSH
- GPU target: RTX 5090
- Instance id: `33735286`
- SSH: `ssh -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes -p 15286 root@ssh3.vast.ai`

## Current State

- Refreshed: 2026-03-28T21:25:13.787365+00:00
- Last result: train.py running
- Recovery actions: training_running

```text
step 00352 (6.2%) | loss: 3.567769 | lrm: 1.00 | dt: 338ms | tok/sec: 387,878 | mfu: 4.7% | epoch: 1 | remaining: 1688s    
step 00353 (6.2%) | loss: 3.564958 | lrm: 1.00 | dt: 326ms | tok/sec: 402,404 | mfu: 4.9% | epoch: 1 | remaining: 1688s    
step 00354 (6.2%) | loss: 3.573993 | lrm: 1.00 | dt: 326ms | tok/sec: 402,269 | mfu: 4.9% | epoch: 1 | remaining: 1688s    
step 00355 (6.2%) | loss: 3.567531 | lrm: 1.00 | dt: 334ms | tok/sec: 392,204 | mfu: 4.8% | epoch: 1 | remaining: 1687s    
step 00356 (6.3%) | loss: 3.561749 | lrm: 1.00 | dt: 326ms | tok/sec: 401,961 | mfu: 4.9% | epoch: 1 | remaining: 1687s    
step 00357 (6.3%) | loss: 3.560527 | lrm: 1.00 | dt: 326ms | tok/sec: 402,337 | mfu: 4.9% | epoch: 1 | remaining: 1687s    
step 00358 (6.3%) | loss: 3.544225 | lrm: 1.00 | dt: 326ms | tok/sec: 402,269 | mfu: 4.9% | epoch: 1 | remaining: 1686s    
step 00359 (6.3%) | loss: 3.535533 | lrm: 1.00 | dt: 326ms | tok/sec: 402,475 | mfu: 4.9% | epoch: 1 | remaining: 1686s    
step 00360 (6.3%) | loss: 3.529518 | lrm: 1.00 | dt: 326ms | tok/sec: 402,407 | mfu: 4.9% | epoch: 1 | remaining: 1686s    
step 00361 (6.4%) | loss: 3.548146 | lrm: 1.00 | dt: 332ms | tok/sec: 394,386 | mfu: 4.8% | epoch: 1 | remaining: 1685s    
step 00362 (6.4%) | loss: 3.552917 | lrm: 1.00 | dt: 326ms | tok/sec: 402,467 | mfu: 4.9% | epoch: 1 | remaining: 1685s    
step 00363 (6.4%) | loss: 3.544503 | lrm: 1.00 | dt: 326ms | tok/sec: 402,359 | mfu: 4.9% | epoch: 1 | remaining: 1685s    
step 00364 (6.4%) | loss: 3.563568 | lrm: 1.00 | dt: 326ms | tok/sec: 402,351 | mfu: 4.9% | epoch: 1 | remaining: 1684s    
step 00365 (6.4%) | loss: 3.549576 | lrm: 1.00 | dt: 326ms | tok/sec: 402,403 | mfu: 4.9% | epoch: 1 | remaining: 1684s    
step 00366 (6.4%) | loss: 3.558662 | lrm: 1.00 | dt: 326ms | tok/sec: 402,310 | mfu: 4.9% | epoch: 1 | remaining: 1684s    
step 00367 (6.5%) | loss: 3.553783 | lrm: 1.00 | dt: 326ms | tok/sec: 402,344 | mfu: 4.9% | epoch: 1 | remaining: 1683s    
step 00368 (6.5%) | loss: 3.561895 | lrm: 1.00 | dt: 326ms | tok/sec: 402,261 | mfu: 4.9% | epoch: 1 | remaining: 1683s    
step 00369 (6.5%) | loss: 3.563390 | lrm: 1.00 | dt: 326ms | tok/sec: 402,376 | mfu: 4.9% | epoch: 1 | remaining: 1683s    
step 00370 (6.5%) | loss: 3.554518 | lrm: 1.00 | dt: 326ms | tok/sec: 402,348 | mfu: 4.9% | epoch: 1 | remaining: 1682s    
step 00371 (6.5%) | loss: 3.536691 | lrm: 1.00 | dt: 328ms | tok/sec: 399,577 | mfu: 4.9% | epoch: 1 | remaining: 1682s    
step 00372 (6.6%) | loss: 3.528028 | lrm: 1.00 | dt: 326ms | tok/sec: 402,351 | mfu: 4.9% | epoch: 1 | remaining: 1682s    
step 00373 (6.6%) | loss: 3.537293 | lrm: 1.00 | dt: 326ms | tok/sec: 402,372 | mfu: 4.9% | epoch: 1 | remaining: 1681s    
step 00374 (6.6%) | loss: 3.537069 | lrm: 1.00 | dt: 326ms | tok/sec: 402,315 | mfu: 4.9% | epoch: 1 | remaining: 1681s    
step 00375 (6.6%) | loss: 3.525145 | lrm: 1.00 | dt: 336ms | tok/sec: 389,718 | mfu: 4.7% | epoch: 1 | remaining: 1681s    
step 00376 (6.6%) | loss: 3.558577 | lrm: 1.00 | dt: 326ms | tok/sec: 402,432 | mfu: 4.9% | epoch: 1 | remaining: 1680s    
step 00377 (6.6%) | loss: 3.547432 | lrm: 1.00 | dt: 326ms | tok/sec: 402,247 | mfu: 4.9% | epoch: 1 | remaining: 1680s    
step 00378 (6.7%) | loss: 3.547091 | lrm: 1.00 | dt: 326ms | tok/sec: 402,317 | mfu: 4.9% | epoch: 1 | remaining: 1680s    
step 00379 (6.7%) | loss: 3.546236 | lrm: 1.00 | dt: 326ms | tok/sec: 402,514 | mfu: 4.9% | epoch: 1 | remaining: 1679s    
step 00380 (6.7%) | loss: 3.541558 | lrm: 1.00 | dt: 326ms | tok/sec: 402,198 | mfu: 4.9% | epoch: 1 | remaining: 1679s    
step 00381 (6.7%) | loss: 3.509393 | lrm: 1.00 | dt: 326ms | tok/sec: 402,351 | mfu: 4.9% | epoch: 1 | remaining: 1679s    
step 00382 (6.7%) | loss: 3.506850 | lrm: 1.00 | dt: 326ms | tok/sec: 402,210 | mfu: 4.9% | epoch: 1 | remaining: 1678s    
step 00383 (6.8%) | loss: 3.509059 | lrm: 1.00 | dt: 326ms | tok/sec: 402,329 | mfu: 4.9% | epoch: 1 | remaining: 1678s    
step 00384 (6.8%) | loss: 3.511220 | lrm: 1.00 | dt: 326ms | tok/sec: 402,259 | mfu: 4.9% | epoch: 1 | remaining: 1678s    
step 00385 (6.8%) | loss: 3.509707 | lrm: 1.00 | dt: 326ms | tok/sec: 402,293 | mfu: 4.9% | epoch: 1 | remaining: 1678s    
step 00386 (6.8%) | loss: 3.504372 | lrm: 1.00 | dt: 326ms | tok/sec: 402,422 | mfu: 4.9% | epoch: 1 | remaining: 1677s    ===TRAIN===
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

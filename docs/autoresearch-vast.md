# Vast Autoresearch Run

## Current Instance

- Status: running on Vast proxy SSH
- GPU target: RTX 5090
- Instance id: `33735286`
- SSH: `ssh -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes -p 15286 root@ssh3.vast.ai`

## Current State

- Refreshed: 2026-03-28T21:03:36.856231+00:00
- Last result: train.py running
- Recovery actions: training_running

```text
step 00477 (82.9%) | loss: 3.248942 | lrm: 0.34 | dt: 533ms | tok/sec: 245,713 | mfu: 5.9% | epoch: 1 | remaining: 51s    
step 00478 (83.1%) | loss: 3.229247 | lrm: 0.34 | dt: 533ms | tok/sec: 245,702 | mfu: 5.9% | epoch: 1 | remaining: 50s    
step 00479 (83.2%) | loss: 3.237212 | lrm: 0.34 | dt: 533ms | tok/sec: 245,718 | mfu: 5.9% | epoch: 1 | remaining: 50s    
step 00480 (83.4%) | loss: 3.235711 | lrm: 0.33 | dt: 533ms | tok/sec: 245,693 | mfu: 5.9% | epoch: 1 | remaining: 49s    
step 00481 (83.6%) | loss: 3.210287 | lrm: 0.33 | dt: 533ms | tok/sec: 245,707 | mfu: 5.9% | epoch: 1 | remaining: 49s    
step 00482 (83.8%) | loss: 3.204568 | lrm: 0.32 | dt: 533ms | tok/sec: 245,765 | mfu: 5.9% | epoch: 1 | remaining: 48s    
step 00483 (83.9%) | loss: 3.230673 | lrm: 0.32 | dt: 533ms | tok/sec: 245,773 | mfu: 5.9% | epoch: 1 | remaining: 48s    
step 00484 (84.1%) | loss: 3.228696 | lrm: 0.32 | dt: 533ms | tok/sec: 245,736 | mfu: 5.9% | epoch: 1 | remaining: 47s    
step 00485 (84.3%) | loss: 3.218257 | lrm: 0.31 | dt: 533ms | tok/sec: 245,758 | mfu: 5.9% | epoch: 1 | remaining: 47s    
step 00486 (84.5%) | loss: 3.191737 | lrm: 0.31 | dt: 533ms | tok/sec: 245,731 | mfu: 5.9% | epoch: 1 | remaining: 46s    
step 00487 (84.7%) | loss: 3.197032 | lrm: 0.31 | dt: 533ms | tok/sec: 245,708 | mfu: 5.9% | epoch: 1 | remaining: 45s    
step 00488 (84.8%) | loss: 3.194204 | lrm: 0.30 | dt: 533ms | tok/sec: 245,807 | mfu: 5.9% | epoch: 1 | remaining: 45s    
step 00489 (85.0%) | loss: 3.210363 | lrm: 0.30 | dt: 533ms | tok/sec: 245,787 | mfu: 5.9% | epoch: 1 | remaining: 44s    
step 00490 (85.2%) | loss: 3.195234 | lrm: 0.30 | dt: 533ms | tok/sec: 245,735 | mfu: 5.9% | epoch: 1 | remaining: 44s    
step 00491 (85.4%) | loss: 3.192805 | lrm: 0.29 | dt: 533ms | tok/sec: 245,757 | mfu: 5.9% | epoch: 1 | remaining: 43s    
step 00492 (85.5%) | loss: 3.182490 | lrm: 0.29 | dt: 533ms | tok/sec: 245,724 | mfu: 5.9% | epoch: 1 | remaining: 43s    
step 00493 (85.7%) | loss: 3.188070 | lrm: 0.29 | dt: 533ms | tok/sec: 245,758 | mfu: 5.9% | epoch: 1 | remaining: 42s    
step 00494 (85.9%) | loss: 3.162063 | lrm: 0.28 | dt: 533ms | tok/sec: 245,810 | mfu: 5.9% | epoch: 1 | remaining: 42s    
step 00495 (86.1%) | loss: 3.174183 | lrm: 0.28 | dt: 533ms | tok/sec: 245,760 | mfu: 5.9% | epoch: 1 | remaining: 41s    
step 00496 (86.3%) | loss: 3.156712 | lrm: 0.27 | dt: 533ms | tok/sec: 245,753 | mfu: 5.9% | epoch: 1 | remaining: 41s    
step 00497 (86.4%) | loss: 3.143878 | lrm: 0.27 | dt: 533ms | tok/sec: 245,720 | mfu: 5.9% | epoch: 1 | remaining: 40s    
step 00498 (86.6%) | loss: 3.129223 | lrm: 0.27 | dt: 533ms | tok/sec: 245,764 | mfu: 5.9% | epoch: 1 | remaining: 40s    
step 00499 (86.8%) | loss: 3.154643 | lrm: 0.26 | dt: 533ms | tok/sec: 245,729 | mfu: 5.9% | epoch: 1 | remaining: 39s    
step 00500 (87.0%) | loss: 3.144577 | lrm: 0.26 | dt: 533ms | tok/sec: 245,735 | mfu: 5.9% | epoch: 1 | remaining: 39s    
step 00501 (87.1%) | loss: 3.157478 | lrm: 0.26 | dt: 534ms | tok/sec: 245,670 | mfu: 5.9% | epoch: 1 | remaining: 38s    
step 00502 (87.3%) | loss: 3.158366 | lrm: 0.25 | dt: 533ms | tok/sec: 245,788 | mfu: 5.9% | epoch: 1 | remaining: 37s    
step 00503 (87.5%) | loss: 3.176759 | lrm: 0.25 | dt: 533ms | tok/sec: 245,779 | mfu: 5.9% | epoch: 1 | remaining: 37s    
step 00504 (87.7%) | loss: 3.190973 | lrm: 0.25 | dt: 533ms | tok/sec: 245,771 | mfu: 5.9% | epoch: 1 | remaining: 36s    
step 00505 (87.9%) | loss: 3.196984 | lrm: 0.24 | dt: 533ms | tok/sec: 245,704 | mfu: 5.9% | epoch: 1 | remaining: 36s    
step 00506 (88.0%) | loss: 3.190566 | lrm: 0.24 | dt: 533ms | tok/sec: 245,766 | mfu: 5.9% | epoch: 1 | remaining: 35s    
step 00507 (88.2%) | loss: 3.179371 | lrm: 0.24 | dt: 533ms | tok/sec: 245,727 | mfu: 5.9% | epoch: 1 | remaining: 35s    
step 00508 (88.4%) | loss: 3.199401 | lrm: 0.23 | dt: 533ms | tok/sec: 245,821 | mfu: 5.9% | epoch: 1 | remaining: 34s    
step 00509 (88.6%) | loss: 3.174369 | lrm: 0.23 | dt: 533ms | tok/sec: 245,770 | mfu: 5.9% | epoch: 1 | remaining: 34s    
step 00510 (88.7%) | loss: 3.158379 | lrm: 0.23 | dt: 533ms | tok/sec: 245,776 | mfu: 5.9% | epoch: 1 | remaining: 33s    
step 00511 (88.9%) | loss: 3.165360 | lrm: 0.22 | dt: 533ms | tok/sec: 245,722 | mfu: 5.9% | epoch: 1 | remaining: 33s    ===TRAIN===
   4625 bash -lc /root/.local/bin/uv run train.py > baseline.log 2>&1
   4630 /root/.local/bin/uv run train.py
   4633 /root/autoresearch/.venv/bin/python3 train.py
===RESULTS===
commit	val_bpb	memory_gb	status	description
```

## Sync Policy

- Keep MERCK services stable first.
- Keep the remote training lane alive and recover from environment drift.
- Push meaningful checkpoints to `main`.

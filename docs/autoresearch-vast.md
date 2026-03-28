# Vast Autoresearch Run

## Current Instance

- Status: running on Vast proxy SSH
- GPU target: RTX 5090
- Instance id: `33735286`
- SSH: `ssh -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes -p 15286 root@ssh3.vast.ai`

## Current State

- Refreshed: 2026-03-28T21:04:41.636550+00:00
- Last result: train.py running
- Recovery actions: training_running

```text
step 00539 (93.9%) | loss: 3.137400 | lrm: 0.12 | dt: 533ms | tok/sec: 245,705 | mfu: 5.9% | epoch: 1 | remaining: 18s    
step 00540 (94.1%) | loss: 3.125659 | lrm: 0.12 | dt: 533ms | tok/sec: 245,789 | mfu: 5.9% | epoch: 1 | remaining: 17s    
step 00541 (94.3%) | loss: 3.111321 | lrm: 0.11 | dt: 533ms | tok/sec: 245,780 | mfu: 5.9% | epoch: 1 | remaining: 17s    
step 00542 (94.4%) | loss: 3.111537 | lrm: 0.11 | dt: 533ms | tok/sec: 245,722 | mfu: 5.9% | epoch: 1 | remaining: 16s    
step 00543 (94.6%) | loss: 3.107119 | lrm: 0.11 | dt: 533ms | tok/sec: 245,720 | mfu: 5.9% | epoch: 1 | remaining: 16s    
step 00544 (94.8%) | loss: 3.114217 | lrm: 0.10 | dt: 534ms | tok/sec: 245,555 | mfu: 5.9% | epoch: 1 | remaining: 15s    
step 00545 (95.0%) | loss: 3.104600 | lrm: 0.10 | dt: 533ms | tok/sec: 245,744 | mfu: 5.9% | epoch: 1 | remaining: 15s    
step 00546 (95.1%) | loss: 3.101468 | lrm: 0.10 | dt: 533ms | tok/sec: 245,742 | mfu: 5.9% | epoch: 1 | remaining: 14s    
step 00547 (95.3%) | loss: 3.083764 | lrm: 0.09 | dt: 533ms | tok/sec: 245,755 | mfu: 5.9% | epoch: 1 | remaining: 13s    
step 00548 (95.5%) | loss: 3.105051 | lrm: 0.09 | dt: 533ms | tok/sec: 245,705 | mfu: 5.9% | epoch: 1 | remaining: 13s    
step 00549 (95.7%) | loss: 3.089991 | lrm: 0.09 | dt: 533ms | tok/sec: 245,810 | mfu: 5.9% | epoch: 1 | remaining: 12s    
step 00550 (95.9%) | loss: 3.101297 | lrm: 0.08 | dt: 533ms | tok/sec: 245,772 | mfu: 5.9% | epoch: 1 | remaining: 12s    
step 00551 (96.0%) | loss: 3.118485 | lrm: 0.08 | dt: 533ms | tok/sec: 245,686 | mfu: 5.9% | epoch: 1 | remaining: 11s    
step 00552 (96.2%) | loss: 3.119675 | lrm: 0.08 | dt: 533ms | tok/sec: 245,761 | mfu: 5.9% | epoch: 1 | remaining: 11s    
step 00553 (96.4%) | loss: 3.096094 | lrm: 0.07 | dt: 533ms | tok/sec: 245,764 | mfu: 5.9% | epoch: 1 | remaining: 10s    
step 00554 (96.6%) | loss: 3.088483 | lrm: 0.07 | dt: 533ms | tok/sec: 245,795 | mfu: 5.9% | epoch: 1 | remaining: 10s    
step 00555 (96.7%) | loss: 3.100559 | lrm: 0.07 | dt: 533ms | tok/sec: 245,731 | mfu: 5.9% | epoch: 1 | remaining: 9s    
step 00556 (96.9%) | loss: 3.100471 | lrm: 0.06 | dt: 533ms | tok/sec: 245,777 | mfu: 5.9% | epoch: 1 | remaining: 9s    
step 00557 (97.1%) | loss: 3.097779 | lrm: 0.06 | dt: 533ms | tok/sec: 245,712 | mfu: 5.9% | epoch: 1 | remaining: 8s    
step 00558 (97.3%) | loss: 3.077240 | lrm: 0.05 | dt: 533ms | tok/sec: 245,766 | mfu: 5.9% | epoch: 1 | remaining: 8s    
step 00559 (97.5%) | loss: 3.092887 | lrm: 0.05 | dt: 533ms | tok/sec: 245,706 | mfu: 5.9% | epoch: 1 | remaining: 7s    
step 00560 (97.6%) | loss: 3.064023 | lrm: 0.05 | dt: 533ms | tok/sec: 245,771 | mfu: 5.9% | epoch: 1 | remaining: 7s    
step 00561 (97.8%) | loss: 3.047210 | lrm: 0.04 | dt: 533ms | tok/sec: 245,814 | mfu: 5.9% | epoch: 1 | remaining: 6s    
step 00562 (98.0%) | loss: 3.060353 | lrm: 0.04 | dt: 533ms | tok/sec: 245,789 | mfu: 5.9% | epoch: 1 | remaining: 5s    
step 00563 (98.2%) | loss: 3.056009 | lrm: 0.04 | dt: 533ms | tok/sec: 245,688 | mfu: 5.9% | epoch: 1 | remaining: 5s    
step 00564 (98.3%) | loss: 3.038359 | lrm: 0.03 | dt: 533ms | tok/sec: 245,726 | mfu: 5.9% | epoch: 1 | remaining: 4s    
step 00565 (98.5%) | loss: 3.024979 | lrm: 0.03 | dt: 533ms | tok/sec: 245,751 | mfu: 5.9% | epoch: 1 | remaining: 4s    
step 00566 (98.7%) | loss: 3.067046 | lrm: 0.03 | dt: 533ms | tok/sec: 245,744 | mfu: 5.9% | epoch: 1 | remaining: 3s    
step 00567 (98.9%) | loss: 3.054620 | lrm: 0.02 | dt: 533ms | tok/sec: 245,778 | mfu: 5.9% | epoch: 1 | remaining: 3s    
step 00568 (99.1%) | loss: 3.054848 | lrm: 0.02 | dt: 533ms | tok/sec: 245,716 | mfu: 5.9% | epoch: 1 | remaining: 2s    
step 00569 (99.2%) | loss: 3.074383 | lrm: 0.02 | dt: 533ms | tok/sec: 245,790 | mfu: 5.9% | epoch: 1 | remaining: 2s    
step 00570 (99.4%) | loss: 3.059519 | lrm: 0.01 | dt: 533ms | tok/sec: 245,727 | mfu: 5.9% | epoch: 1 | remaining: 1s    
step 00571 (99.6%) | loss: 3.066764 | lrm: 0.01 | dt: 533ms | tok/sec: 245,830 | mfu: 5.9% | epoch: 1 | remaining: 1s    
step 00572 (99.8%) | loss: 3.048356 | lrm: 0.00 | dt: 563ms | tok/sec: 232,745 | mfu: 5.6% | epoch: 1 | remaining: 0s    
step 00573 (100.0%) | loss: 3.058507 | lrm: 0.00 | dt: 533ms | tok/sec: 245,783 | mfu: 5.9% | epoch: 1 | remaining: 0s    ===TRAIN===
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

# Vast Autoresearch Run

## Current Instance

- Status: running on Vast proxy SSH
- GPU target: RTX 5090
- Instance id: `33735286`
- SSH: `ssh -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes -p 15286 root@ssh3.vast.ai`

## Current State

- Refreshed: 2026-03-28T21:02:32.103213+00:00
- Last result: train.py running
- Recovery actions: training_running

```text
step 00356 (61.3%) | loss: 3.407304 | lrm: 0.77 | dt: 533ms | tok/sec: 245,735 | mfu: 5.9% | epoch: 1 | remaining: 115s    
step 00357 (61.5%) | loss: 3.406016 | lrm: 0.77 | dt: 533ms | tok/sec: 245,792 | mfu: 5.9% | epoch: 1 | remaining: 115s    
step 00358 (61.7%) | loss: 3.388862 | lrm: 0.77 | dt: 533ms | tok/sec: 245,724 | mfu: 5.9% | epoch: 1 | remaining: 114s    
step 00359 (61.9%) | loss: 3.378327 | lrm: 0.76 | dt: 533ms | tok/sec: 245,819 | mfu: 5.9% | epoch: 1 | remaining: 114s    
step 00360 (62.0%) | loss: 3.372060 | lrm: 0.76 | dt: 533ms | tok/sec: 245,780 | mfu: 5.9% | epoch: 1 | remaining: 113s    
step 00361 (62.2%) | loss: 3.390117 | lrm: 0.76 | dt: 533ms | tok/sec: 245,782 | mfu: 5.9% | epoch: 1 | remaining: 113s    
step 00362 (62.4%) | loss: 3.394074 | lrm: 0.75 | dt: 533ms | tok/sec: 245,780 | mfu: 5.9% | epoch: 1 | remaining: 112s    
step 00363 (62.6%) | loss: 3.387582 | lrm: 0.75 | dt: 533ms | tok/sec: 245,726 | mfu: 5.9% | epoch: 1 | remaining: 112s    
step 00364 (62.8%) | loss: 3.405958 | lrm: 0.74 | dt: 533ms | tok/sec: 245,691 | mfu: 5.9% | epoch: 1 | remaining: 111s    
step 00365 (62.9%) | loss: 3.392636 | lrm: 0.74 | dt: 533ms | tok/sec: 245,740 | mfu: 5.9% | epoch: 1 | remaining: 111s    
step 00366 (63.1%) | loss: 3.402206 | lrm: 0.74 | dt: 533ms | tok/sec: 245,723 | mfu: 5.9% | epoch: 1 | remaining: 110s    
step 00367 (63.3%) | loss: 3.397382 | lrm: 0.73 | dt: 533ms | tok/sec: 245,689 | mfu: 5.9% | epoch: 1 | remaining: 110s    
step 00368 (63.5%) | loss: 3.404428 | lrm: 0.73 | dt: 533ms | tok/sec: 245,720 | mfu: 5.9% | epoch: 1 | remaining: 109s    
step 00369 (63.6%) | loss: 3.404966 | lrm: 0.73 | dt: 533ms | tok/sec: 245,888 | mfu: 5.9% | epoch: 1 | remaining: 109s    
step 00370 (63.8%) | loss: 3.394547 | lrm: 0.72 | dt: 533ms | tok/sec: 245,810 | mfu: 5.9% | epoch: 1 | remaining: 108s    
step 00371 (64.0%) | loss: 3.375444 | lrm: 0.72 | dt: 533ms | tok/sec: 245,749 | mfu: 5.9% | epoch: 1 | remaining: 107s    
step 00372 (64.2%) | loss: 3.366194 | lrm: 0.72 | dt: 533ms | tok/sec: 245,795 | mfu: 5.9% | epoch: 1 | remaining: 107s    
step 00373 (64.4%) | loss: 3.374755 | lrm: 0.71 | dt: 533ms | tok/sec: 245,759 | mfu: 5.9% | epoch: 1 | remaining: 106s    
step 00374 (64.5%) | loss: 3.374505 | lrm: 0.71 | dt: 533ms | tok/sec: 245,772 | mfu: 5.9% | epoch: 1 | remaining: 106s    
step 00375 (64.7%) | loss: 3.361065 | lrm: 0.71 | dt: 533ms | tok/sec: 245,820 | mfu: 5.9% | epoch: 1 | remaining: 105s    
step 00376 (64.9%) | loss: 3.394411 | lrm: 0.70 | dt: 533ms | tok/sec: 245,779 | mfu: 5.9% | epoch: 1 | remaining: 105s    
step 00377 (65.1%) | loss: 3.381703 | lrm: 0.70 | dt: 533ms | tok/sec: 245,761 | mfu: 5.9% | epoch: 1 | remaining: 104s    
step 00378 (65.2%) | loss: 3.380811 | lrm: 0.70 | dt: 533ms | tok/sec: 245,806 | mfu: 5.9% | epoch: 1 | remaining: 104s    
step 00379 (65.4%) | loss: 3.379639 | lrm: 0.69 | dt: 533ms | tok/sec: 245,778 | mfu: 5.9% | epoch: 1 | remaining: 103s    
step 00380 (65.6%) | loss: 3.375394 | lrm: 0.69 | dt: 533ms | tok/sec: 245,752 | mfu: 5.9% | epoch: 1 | remaining: 103s    
step 00381 (65.8%) | loss: 3.341987 | lrm: 0.68 | dt: 533ms | tok/sec: 245,743 | mfu: 5.9% | epoch: 1 | remaining: 102s    
step 00382 (66.0%) | loss: 3.339784 | lrm: 0.68 | dt: 533ms | tok/sec: 245,789 | mfu: 5.9% | epoch: 1 | remaining: 102s    
step 00383 (66.1%) | loss: 3.340855 | lrm: 0.68 | dt: 533ms | tok/sec: 245,723 | mfu: 5.9% | epoch: 1 | remaining: 101s    
step 00384 (66.3%) | loss: 3.341257 | lrm: 0.67 | dt: 533ms | tok/sec: 245,772 | mfu: 5.9% | epoch: 1 | remaining: 101s    
step 00385 (66.5%) | loss: 3.339409 | lrm: 0.67 | dt: 533ms | tok/sec: 245,770 | mfu: 5.9% | epoch: 1 | remaining: 100s    
step 00386 (66.7%) | loss: 3.332380 | lrm: 0.67 | dt: 533ms | tok/sec: 245,753 | mfu: 5.9% | epoch: 1 | remaining: 99s    
step 00387 (66.8%) | loss: 3.333440 | lrm: 0.66 | dt: 533ms | tok/sec: 245,795 | mfu: 5.9% | epoch: 1 | remaining: 99s    
step 00388 (67.0%) | loss: 3.319968 | lrm: 0.66 | dt: 533ms | tok/sec: 245,756 | mfu: 5.9% | epoch: 1 | remaining: 98s    
step 00389 (67.2%) | loss: 3.328830 | lrm: 0.66 | dt: 533ms | tok/sec: 245,791 | mfu: 5.9% | epoch: 1 | remaining: 98s    
step 00390 (67.4%) | loss: 3.341087 | lrm: 0.65 | dt: 533ms | tok/sec: 245,761 | mfu: 5.9% | epoch: 1 | remaining: 97s    ===TRAIN===
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

# Vast Autoresearch Run

## Current Instance

- Status: running on Vast proxy SSH
- GPU target: RTX 5090
- Instance id: `33735286`
- SSH: `ssh -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes -p 15286 root@ssh3.vast.ai`

## Current State

- Refreshed: 2026-03-28T21:26:18.625315+00:00
- Last result: train.py running
- Recovery actions: training_running

```text
step 00550 (9.8%) | loss: 3.372331 | lrm: 1.00 | dt: 326ms | tok/sec: 402,239 | mfu: 4.9% | epoch: 1 | remaining: 1624s    
step 00551 (9.8%) | loss: 3.388712 | lrm: 1.00 | dt: 326ms | tok/sec: 402,261 | mfu: 4.9% | epoch: 1 | remaining: 1623s    
step 00552 (9.8%) | loss: 3.387899 | lrm: 1.00 | dt: 326ms | tok/sec: 402,255 | mfu: 4.9% | epoch: 1 | remaining: 1623s    
step 00553 (9.8%) | loss: 3.367248 | lrm: 1.00 | dt: 326ms | tok/sec: 402,473 | mfu: 4.9% | epoch: 1 | remaining: 1623s    
step 00554 (9.9%) | loss: 3.360110 | lrm: 1.00 | dt: 326ms | tok/sec: 402,293 | mfu: 4.9% | epoch: 1 | remaining: 1622s    
step 00555 (9.9%) | loss: 3.371828 | lrm: 1.00 | dt: 326ms | tok/sec: 402,165 | mfu: 4.9% | epoch: 1 | remaining: 1622s    
step 00556 (9.9%) | loss: 3.370434 | lrm: 1.00 | dt: 326ms | tok/sec: 401,560 | mfu: 4.9% | epoch: 1 | remaining: 1622s    
step 00557 (9.9%) | loss: 3.367255 | lrm: 1.00 | dt: 331ms | tok/sec: 395,559 | mfu: 4.8% | epoch: 1 | remaining: 1621s    
step 00558 (9.9%) | loss: 3.346419 | lrm: 1.00 | dt: 326ms | tok/sec: 402,177 | mfu: 4.9% | epoch: 1 | remaining: 1621s    
step 00559 (9.9%) | loss: 3.360672 | lrm: 1.00 | dt: 326ms | tok/sec: 402,448 | mfu: 4.9% | epoch: 1 | remaining: 1621s    
step 00560 (10.0%) | loss: 3.334803 | lrm: 1.00 | dt: 326ms | tok/sec: 402,377 | mfu: 4.9% | epoch: 1 | remaining: 1620s    
step 00561 (10.0%) | loss: 3.319462 | lrm: 1.00 | dt: 326ms | tok/sec: 402,445 | mfu: 4.9% | epoch: 1 | remaining: 1620s    
step 00562 (10.0%) | loss: 3.332222 | lrm: 1.00 | dt: 326ms | tok/sec: 402,284 | mfu: 4.9% | epoch: 1 | remaining: 1620s    
step 00563 (10.0%) | loss: 3.328167 | lrm: 1.00 | dt: 326ms | tok/sec: 402,277 | mfu: 4.9% | epoch: 1 | remaining: 1619s    
step 00564 (10.0%) | loss: 3.311196 | lrm: 1.00 | dt: 326ms | tok/sec: 402,268 | mfu: 4.9% | epoch: 1 | remaining: 1619s    
step 00565 (10.1%) | loss: 3.296791 | lrm: 1.00 | dt: 326ms | tok/sec: 402,507 | mfu: 4.9% | epoch: 1 | remaining: 1619s    
step 00566 (10.1%) | loss: 3.338031 | lrm: 1.00 | dt: 326ms | tok/sec: 402,408 | mfu: 4.9% | epoch: 1 | remaining: 1618s    
step 00567 (10.1%) | loss: 3.327581 | lrm: 1.00 | dt: 332ms | tok/sec: 394,848 | mfu: 4.8% | epoch: 1 | remaining: 1618s    
step 00568 (10.1%) | loss: 3.327628 | lrm: 1.00 | dt: 326ms | tok/sec: 402,308 | mfu: 4.9% | epoch: 1 | remaining: 1618s    
step 00569 (10.1%) | loss: 3.347991 | lrm: 1.00 | dt: 326ms | tok/sec: 402,436 | mfu: 4.9% | epoch: 1 | remaining: 1617s    
step 00570 (10.1%) | loss: 3.335306 | lrm: 1.00 | dt: 326ms | tok/sec: 402,224 | mfu: 4.9% | epoch: 1 | remaining: 1617s    
step 00571 (10.2%) | loss: 3.341535 | lrm: 1.00 | dt: 326ms | tok/sec: 402,409 | mfu: 4.9% | epoch: 1 | remaining: 1617s    
step 00572 (10.2%) | loss: 3.322741 | lrm: 1.00 | dt: 380ms | tok/sec: 345,338 | mfu: 4.2% | epoch: 1 | remaining: 1616s    
step 00573 (10.2%) | loss: 3.334873 | lrm: 1.00 | dt: 326ms | tok/sec: 402,379 | mfu: 4.9% | epoch: 1 | remaining: 1616s    
step 00574 (10.2%) | loss: 3.348096 | lrm: 1.00 | dt: 326ms | tok/sec: 402,285 | mfu: 4.9% | epoch: 1 | remaining: 1616s    
step 00575 (10.2%) | loss: 3.351684 | lrm: 1.00 | dt: 326ms | tok/sec: 402,318 | mfu: 4.9% | epoch: 1 | remaining: 1615s    
step 00576 (10.3%) | loss: 3.348877 | lrm: 1.00 | dt: 326ms | tok/sec: 402,322 | mfu: 4.9% | epoch: 1 | remaining: 1615s    
step 00577 (10.3%) | loss: 3.355615 | lrm: 1.00 | dt: 326ms | tok/sec: 402,490 | mfu: 4.9% | epoch: 1 | remaining: 1615s    
step 00578 (10.3%) | loss: 3.367803 | lrm: 1.00 | dt: 326ms | tok/sec: 402,334 | mfu: 4.9% | epoch: 1 | remaining: 1614s    
step 00579 (10.3%) | loss: 3.366839 | lrm: 1.00 | dt: 326ms | tok/sec: 402,365 | mfu: 4.9% | epoch: 1 | remaining: 1614s    
step 00580 (10.3%) | loss: 3.382869 | lrm: 1.00 | dt: 333ms | tok/sec: 393,327 | mfu: 4.8% | epoch: 1 | remaining: 1614s    
step 00581 (10.3%) | loss: 3.388856 | lrm: 1.00 | dt: 342ms | tok/sec: 382,842 | mfu: 4.7% | epoch: 1 | remaining: 1613s    
step 00582 (10.4%) | loss: 3.388495 | lrm: 1.00 | dt: 326ms | tok/sec: 402,332 | mfu: 4.9% | epoch: 1 | remaining: 1613s    
step 00583 (10.4%) | loss: 3.391133 | lrm: 1.00 | dt: 326ms | tok/sec: 402,209 | mfu: 4.9% | epoch: 1 | remaining: 1613s    
step 00584 (10.4%) | loss: 3.424362 | lrm: 1.00 | dt: 326ms | tok/sec: 402,510 | mfu: 4.9% | epoch: 1 | remaining: 1612s    ===TRAIN===
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

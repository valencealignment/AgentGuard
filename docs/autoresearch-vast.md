# Vast Autoresearch Run

## Current Instance

- Status: running on Vast proxy SSH
- GPU target: RTX 5090
- Instance id: `33735286`
- SSH: `ssh -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes -p 15286 root@ssh3.vast.ai`

## Current State

- Refreshed: 2026-03-28T21:01:02.781764+00:00
- Last result: train.py running
- Recovery actions: training_running

```text
step 00189 (31.6%) | loss: 3.681150 | lrm: 1.00 | dt: 533ms | tok/sec: 245,808 | mfu: 5.9% | epoch: 1 | remaining: 205s    
step 00190 (31.8%) | loss: 3.662723 | lrm: 1.00 | dt: 533ms | tok/sec: 245,816 | mfu: 5.9% | epoch: 1 | remaining: 204s    
step 00191 (32.0%) | loss: 3.653454 | lrm: 1.00 | dt: 533ms | tok/sec: 245,818 | mfu: 5.9% | epoch: 1 | remaining: 203s    
step 00192 (32.2%) | loss: 3.640091 | lrm: 1.00 | dt: 533ms | tok/sec: 245,800 | mfu: 5.9% | epoch: 1 | remaining: 203s    
step 00193 (32.4%) | loss: 3.615692 | lrm: 1.00 | dt: 533ms | tok/sec: 245,805 | mfu: 5.9% | epoch: 1 | remaining: 202s    
step 00194 (32.5%) | loss: 3.618506 | lrm: 1.00 | dt: 533ms | tok/sec: 245,819 | mfu: 5.9% | epoch: 1 | remaining: 202s    
step 00195 (32.7%) | loss: 3.646511 | lrm: 1.00 | dt: 533ms | tok/sec: 245,786 | mfu: 5.9% | epoch: 1 | remaining: 201s    
step 00196 (32.9%) | loss: 3.661189 | lrm: 1.00 | dt: 533ms | tok/sec: 245,770 | mfu: 5.9% | epoch: 1 | remaining: 201s    
step 00197 (33.1%) | loss: 3.650811 | lrm: 1.00 | dt: 533ms | tok/sec: 245,789 | mfu: 5.9% | epoch: 1 | remaining: 200s    
step 00198 (33.2%) | loss: 3.654072 | lrm: 1.00 | dt: 533ms | tok/sec: 245,786 | mfu: 5.9% | epoch: 1 | remaining: 200s    
step 00199 (33.4%) | loss: 3.623082 | lrm: 1.00 | dt: 533ms | tok/sec: 245,803 | mfu: 5.9% | epoch: 1 | remaining: 199s    
step 00200 (33.6%) | loss: 3.611831 | lrm: 1.00 | dt: 533ms | tok/sec: 245,881 | mfu: 5.9% | epoch: 1 | remaining: 199s    
step 00201 (33.8%) | loss: 3.596534 | lrm: 1.00 | dt: 533ms | tok/sec: 245,787 | mfu: 5.9% | epoch: 1 | remaining: 198s    
step 00202 (34.0%) | loss: 3.603329 | lrm: 1.00 | dt: 533ms | tok/sec: 245,843 | mfu: 5.9% | epoch: 1 | remaining: 198s    
step 00203 (34.1%) | loss: 3.611362 | lrm: 1.00 | dt: 533ms | tok/sec: 245,792 | mfu: 5.9% | epoch: 1 | remaining: 197s    
step 00204 (34.3%) | loss: 3.616457 | lrm: 1.00 | dt: 533ms | tok/sec: 245,771 | mfu: 5.9% | epoch: 1 | remaining: 197s    
step 00205 (34.5%) | loss: 3.599381 | lrm: 1.00 | dt: 533ms | tok/sec: 245,803 | mfu: 5.9% | epoch: 1 | remaining: 196s    
step 00206 (34.7%) | loss: 3.585400 | lrm: 1.00 | dt: 533ms | tok/sec: 245,823 | mfu: 5.9% | epoch: 1 | remaining: 195s    
step 00207 (34.8%) | loss: 3.600712 | lrm: 1.00 | dt: 533ms | tok/sec: 245,744 | mfu: 5.9% | epoch: 1 | remaining: 195s    
step 00208 (35.0%) | loss: 3.612200 | lrm: 1.00 | dt: 533ms | tok/sec: 245,736 | mfu: 5.9% | epoch: 1 | remaining: 194s    
step 00209 (35.2%) | loss: 3.607995 | lrm: 1.00 | dt: 533ms | tok/sec: 245,708 | mfu: 5.9% | epoch: 1 | remaining: 194s    
step 00210 (35.4%) | loss: 3.595809 | lrm: 1.00 | dt: 533ms | tok/sec: 245,783 | mfu: 5.9% | epoch: 1 | remaining: 193s    
step 00211 (35.6%) | loss: 3.590806 | lrm: 1.00 | dt: 533ms | tok/sec: 245,722 | mfu: 5.9% | epoch: 1 | remaining: 193s    
step 00212 (35.7%) | loss: 3.587524 | lrm: 1.00 | dt: 533ms | tok/sec: 245,771 | mfu: 5.9% | epoch: 1 | remaining: 192s    
step 00213 (35.9%) | loss: 3.581581 | lrm: 1.00 | dt: 533ms | tok/sec: 245,779 | mfu: 5.9% | epoch: 1 | remaining: 192s    
step 00214 (36.1%) | loss: 3.576606 | lrm: 1.00 | dt: 533ms | tok/sec: 245,828 | mfu: 5.9% | epoch: 1 | remaining: 191s    
step 00215 (36.3%) | loss: 3.597536 | lrm: 1.00 | dt: 533ms | tok/sec: 245,808 | mfu: 5.9% | epoch: 1 | remaining: 191s    
step 00216 (36.4%) | loss: 3.592004 | lrm: 1.00 | dt: 533ms | tok/sec: 245,818 | mfu: 5.9% | epoch: 1 | remaining: 190s    
step 00217 (36.6%) | loss: 3.598531 | lrm: 1.00 | dt: 533ms | tok/sec: 245,833 | mfu: 5.9% | epoch: 1 | remaining: 190s    
step 00218 (36.8%) | loss: 3.588338 | lrm: 1.00 | dt: 533ms | tok/sec: 245,814 | mfu: 5.9% | epoch: 1 | remaining: 189s    
step 00219 (37.0%) | loss: 3.598294 | lrm: 1.00 | dt: 534ms | tok/sec: 245,629 | mfu: 5.9% | epoch: 1 | remaining: 189s    
step 00220 (37.2%) | loss: 3.597304 | lrm: 1.00 | dt: 534ms | tok/sec: 245,557 | mfu: 5.9% | epoch: 1 | remaining: 188s    
step 00221 (37.3%) | loss: 3.598469 | lrm: 1.00 | dt: 533ms | tok/sec: 245,806 | mfu: 5.9% | epoch: 1 | remaining: 187s    
step 00222 (37.5%) | loss: 3.591784 | lrm: 1.00 | dt: 533ms | tok/sec: 245,807 | mfu: 5.9% | epoch: 1 | remaining: 187s    
step 00223 (37.7%) | loss: 3.561558 | lrm: 1.00 | dt: 533ms | tok/sec: 245,778 | mfu: 5.9% | epoch: 1 | remaining: 186s    ===TRAIN===
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

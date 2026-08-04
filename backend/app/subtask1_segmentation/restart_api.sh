#!/bin/bash
kill $(cat api.pid) 2>/dev/null
cd /home/umwise2526studentproj/Group3ProjectWork/project/bhavik/backend/app/subtask1_segmentation
nohup /home/umwise2526studentproj/miniconda3/envs/myenv/bin/uvicorn api:app --host 0.0.0.0 --port 8000 > api.log 2>&1 &
echo $! > api.pid
echo "API restarted, PID: $(cat api.pid)"

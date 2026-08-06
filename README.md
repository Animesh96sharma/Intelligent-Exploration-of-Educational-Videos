Conda Activate- conda activate myenv

For Subtask 1 
source venv/bin/activate
python backend/app/subtask1_segmentation/run_pipeline.py --folder /home/umwise2526studentproj/Group3ProjectWork/data/raw/videos

For Subtask 2

python -m scripts.run_subtask2 --step chapters
python -m scripts.run_subtask2 --step videos
python -m scripts.run_subtask2 --step embeddings
python -m scripts.run_subtask2 --step collection
python -m scripts.run_subtask2 --step evaluate


Or run everything in one go:

python -m scripts.run_subtask2

To delete already summaried files 
rm -rf data/processed/subtask2_summarization/chapter_summaries/*

TO start api >  uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8001


Added 3 different group for all of us and data folder is seperate now. Anyone who is working can now use their own folder to work. 

# Intelligent-Exploration-of-Educational-Videos
University Project work- will add details about the project

# Git Repo from the Paper-1 for reference/help- 
https://github.com/lucas-ventura/chapter-llama

# Create a Virtual Environment-
python -m venv .venv

# Activate the Virtual Enviroment before working 
.\.venv\Scripts\Activate.ps1

# Install all the required packages-
python -m pip install -r requirements.txt

# Verify that all the requirements are satisfied-
python -m pip install -r requirements.txt


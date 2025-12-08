import os
os.environ["PATH"] += os.pathsep + r"C:\Users\Avi\ffmpeg-8.0.1-full_build\bin"

import whisper

model = whisper.load_model("small")
video_path = r"C://Users//Avi//Downloads//STREAM_PROJECT_FAIRDI-1105FCDE.mp4"
result = model.transcribe(video_path)
print(result["text"])

with open("transcript.txt", "w", encoding="utf-8") as f:
    f.write(result["text"])

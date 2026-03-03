# app.py
import streamlit as st
import pandas as pd

# --- IMPORT YOUR OTHER FILES ---
import segmentation as seg
import summarization as summ

st.title("Intelligent Video Explorer")

# 1. File Upload
video_file = st.file_uploader("Upload a Lecture Video", type=['mp4'])

if video_file is not None:
    # Save file locally (needed for processing)
    with open("temp_video.mp4", "wb") as f:
        f.write(video_file.getbuffer())

    st.video(video_file)

    # 2. Link Subtask 1 (With Caching!)
    # We use @st.cache_data so we don't re-run the heavy model on every click
    @st.cache_data
    def run_segmentation_pipeline(path):
        return seg.process_video_chapters(path)

    with st.spinner('Running Chapter-Llama segmentation...'):
        chapters_data = run_segmentation_pipeline("temp_video.mp4")

    st.success("Segmentation Complete!")

    # 3. Link Subtask 2
    @st.cache_data
    def run_summarization_pipeline(_chapters):
        return summ.generate_summaries(_chapters)

    with st.spinner('Generating Summaries...'):
        summary_data = run_summarization_pipeline(chapters_data)

    # 4. Visualization (Subtask 3 Logic)

    # Create Layout
    col1, col2 = st.columns([1, 2])

    with col1:
        st.subheader("Chapters")
        # Let user select a chapter
        titles = [c['title'] for c in chapters_data]
        selected_title = st.radio("Jump to:", titles)

        # Find start time for selected chapter
        selected_chapter = next(c for c in chapters_data if c['title'] == selected_title)
        start_time = selected_chapter['start']

        st.info(f"Starts at: {start_time}s")

    with col2:
        st.subheader("Summary")
        # Display summary from Subtask 2 Code
        st.markdown(f"**{selected_title}**")
        st.write(summary_data[selected_title])

        st.caption("Key Concepts: AI, Machine Learning, Data (Mock tags)")

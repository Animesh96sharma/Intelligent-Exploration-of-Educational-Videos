import streamlit as st
import json
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd

# Load stubs
@st.cache_data
def load_stubs():
    with open("stub_data.json", "r") as f:
        return json.load(f)

data = load_stubs()
videos = data["videos"]
similarities = data["similarities"]
shared_topics = data["shared_topics"]

st.set_page_config(page_title="Video Explorer Prototype", layout="wide")

# Sidebar: Video selector
st.sidebar.header("Collection")
selected_idx = st.sidebar.selectbox("Pick a video", range(len(videos)), format_func=lambda i: videos[i]["title"])
video = videos[selected_idx]

# Main tabs
tab1, tab2 = st.tabs(["📹 Video Exploration", "🔍 Collection Explorer"])

with tab1:
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.header(video["title"])
        st.video(video["url"])  # Embeds TIB/YouTube
        
        # Chapter Timeline (using Plotly Gantt-style)
        chapters_df = pd.DataFrame([{
            "Chapter": ch["title"][:20] + "...",
            "Start (min)": ch["start"]/60,
            "End (min)": ch["end"]/60,
            "Chapter ID": ch["id"]
        } for ch in video["chapters"]])
        
        fig_timeline = px.timeline(chapters_df, x_start="Start (min)", x_end="End (min)", 
                                  y="Chapter", color="Chapter ID", title="Chapter Timeline (click to jump)")
        fig_timeline.update_yaxes(autorange="reversed")
        fig_timeline.update_layout(height=300, xaxis_title="Time (minutes)")
        st.plotly_chart(fig_timeline, use_container_width=True)
    
    with col2:
        # Hierarchical Summary
        summary_level = st.radio("Summary level:", ["short", "medium", "long"])
        st.markdown("### 📝 Video Summary")
        st.write(video["summaries"][summary_level])
        
        st.markdown("### 📋 Chapters")
        for ch in video["chapters"]:
            with st.expander(f"{ch['title']} ({ch['start']/60:.0f}-{ch['end']/60:.0f} min)"):
                st.write(ch["summary_short"])
                concepts = ", ".join(ch["key_concepts"])
                st.caption(f"**Key concepts:** {concepts}")
        
        # Concept cloud (simple bar for now)
        concept_counts = pd.Series(video["key_concepts"]).value_counts()
        st.markdown("### 🏷️ Key Concepts")
        st.bar_chart(concept_counts)

with tab2:
    st.header("Video Collection Explorer")
    
    # Similarity Matrix
    sim_df = pd.DataFrame(similarities, 
                         index=[v["title"][:15] for v in videos],
                         columns=[f"V{i+1}" for i in range(len(videos))])
    fig_matrix = px.imshow(sim_df, title="Topic Similarity Heatmap (click videos to compare)",
                          color_continuous_scale="Viridis")
    st.plotly_chart(fig_matrix, use_container_width=True)
    
    # Shared topics table
    st.markdown("### 📊 Shared Topics")
    for topic, vid_indices in shared_topics.items():
        vid_names = [videos[i]["title"][:20] for i in vid_indices]
        st.caption(f"**{topic}**: {', '.join(vid_names)}")
    
    # Quick comparison selector
    col_a, col_b = st.columns(2)
    with col_a: vid_a_idx = st.selectbox("Video A", range(len(videos)), index=0)
    with col_b: vid_b_idx = st.selectbox("Video B", range(len(videos)), index=1)
    if vid_a_idx != vid_b_idx:
        sim_score = similarities[vid_a_idx][vid_b_idx]
        st.metric("Similarity Score", f"{sim_score:.1%}")

# Footer
st.markdown("---")
st.caption("Prototype using stubs. Replace `data` with real API from Subtasks 1-2.")[file:1]

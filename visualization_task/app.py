import importlib
import streamlit as st
import data_loader
import feature_timeline
import feature_summary
import feature_collection
import feature_search
import feature_clustering

# Force Python to reload your custom modules to prevent caching errors!
importlib.reload(data_loader)
importlib.reload(feature_timeline)
importlib.reload(feature_summary)
importlib.reload(feature_collection)

# Page Config & Data Loading
st.set_page_config(page_title="Project", layout="wide")
data = data_loader.load_stubs("stub_data.json")
videos = data["videos"]

# Sidebar Navigation + Filters

st.sidebar.header("🔎 Search & Filters")

# Search bar
search_query = st.sidebar.text_input("Search videos")

# Topic filter
all_topics = list(data["shared_topics"].keys())
selected_topic = st.sidebar.selectbox(
    "Filter by topic",
    ["All Topics"] + all_topics
)

# Filter videos
filtered_videos = []

for i, v in enumerate(videos):

    title_match = search_query.lower() in v["title"].lower()

    topic_match = True
    if selected_topic != "All Topics":
        topic_match = i in data["shared_topics"].get(selected_topic, [])

    if title_match and topic_match:
        filtered_videos.append((i, v))
st.sidebar.write(f"Results: {len(filtered_videos)} videos")
# If nothing found
if not filtered_videos:
    st.sidebar.warning("No videos match your search.")
    filtered_videos = list(enumerate(videos))

# Video selector
selected_idx = st.sidebar.selectbox(
    "Pick a video to explore",
    [i for i, _ in filtered_videos],
    format_func=lambda i: videos[i]["title"]
)

selected_video = videos[selected_idx]

# 3. Main Layout with Tabs
tab_video, tab_collection, tab_search, tab_clusters = st.tabs(
[
"📹 Video Exploration",
"🔍 Collection Explorer",
"🔎 Transcript Search",
"🧠 Topic Clustering"
]
)

with tab_video:
    col1, col2 = st.columns([2, 1])
    
    with col1:
        # Show embedded YouTube video player
        st.video(selected_video["url"])
        
        # Then show the topic timeline below
        feature_timeline.render_timeline(selected_video)
        
    with col2:
        feature_summary.render_summary(selected_video)

with tab_collection:
    # Pass the collection-level data to the collection feature
    feature_collection.render_collection(data["similarities"], videos, data["shared_topics"])

with tab_search:
    feature_search.render_transcript_search(videos)

with tab_clusters:
    feature_clustering.render_clustering(data["similarities"], videos)
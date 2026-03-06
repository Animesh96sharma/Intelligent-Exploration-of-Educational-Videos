import streamlit as st
import numpy as np
import plotly.express as px
from sklearn.cluster import KMeans
from sklearn.manifold import TSNE


def render_clustering(similarities, videos):

    st.markdown("### 🧠 Topic Clustering of Videos")
    st.write("Videos are grouped automatically based on topic similarity.")

    sim_matrix = np.array(similarities)

    # Number of clusters selector
    k = st.slider(
        "Number of clusters",
        min_value=2,
        max_value=min(6, len(videos)),
        value=3
    )

    # KMeans clustering
    kmeans = KMeans(n_clusters=k, random_state=42)
    clusters = kmeans.fit_predict(sim_matrix)

    # Dimensionality reduction for visualization
    tsne = TSNE(
        n_components=2,
        perplexity=min(5, len(videos)-1),
        random_state=42
    )

    embedding = tsne.fit_transform(sim_matrix)

    x = embedding[:, 0]
    y = embedding[:, 1]

    titles = [v["title"] for v in videos]

    fig = px.scatter(
        x=x,
        y=y,
        color=clusters.astype(str),
        text=[f"V{i+1}" for i in range(len(videos))],
        labels={"color": "Cluster"},
        hover_name=titles
    )

    fig.update_traces(textposition="top center")

    fig.update_layout(
        height=500,
        title="Video Topic Clusters"
    )

    st.plotly_chart(fig, use_container_width=True)

    # Show cluster groups
    st.markdown("### 📚 Cluster Contents")

    cluster_map = {}

    for i, c in enumerate(clusters):
        cluster_map.setdefault(c, []).append(videos[i]["title"])

    for c, vids in cluster_map.items():

        with st.expander(f"Cluster {c+1} ({len(vids)} videos)"):
            for v in vids:
                st.write(v)
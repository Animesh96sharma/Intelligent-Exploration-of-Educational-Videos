import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import networkx as nx


def render_collection(similarities, videos, shared_topics):
    """
    Renders the collection-level visual analytics dashboard including:
    - Similarity Heatmap
    - Video Similarity Network Graph
    - Shared Topic Mapping
    """

    st.markdown("## Video Collection Explorer")
    st.write("Compare lectures to find common themes and overlapping content.")

    col1, col2 = st.columns([2, 1])

    with col1:

        # ============================
        # 1. Similarity Heatmap
        # ============================
        st.markdown("### 🗺️ Topic Similarity Heatmap")

        video_ids = [f"V{i+1}" for i in range(len(videos))]

        sim_df = pd.DataFrame(
            similarities,
            index=video_ids,
            columns=video_ids
        )

        hover_text = [
            [
                f"{videos[i]['title']} ↔ {videos[j]['title']}<br>Similarity: {similarities[i][j]*100:.1f}%"
                for j in range(len(videos))
            ]
            for i in range(len(videos))
        ]

        fig_matrix = px.imshow(
            sim_df,
            color_continuous_scale="Blues",
            zmin=0,
            zmax=1,
            labels=dict(x="Video", y="Video", color="Similarity")
        )

        fig_matrix.update_traces(
            text=hover_text,
            hovertemplate="%{text}<extra></extra>"
        )

        fig_matrix.update_layout(
            height=400,
            margin=dict(t=20, l=20, r=20, b=20)
        )

        st.plotly_chart(fig_matrix, use_container_width=True)

        # ============================
        # 2. Video Similarity Network
        # ============================
        st.markdown("### 🧠 Video Similarity Network")

        threshold = st.slider(
            "Similarity threshold",
            0.0,
            1.0,
            0.5,
            0.05
        )

        G = nx.Graph()

        # Add nodes
        for i, v in enumerate(videos):
            G.add_node(i, label=v["title"])

        # Add edges based on similarity
        for i in range(len(videos)):
            for j in range(i + 1, len(videos)):
                if similarities[i][j] >= threshold:
                    G.add_edge(i, j, weight=similarities[i][j])

        pos = nx.spring_layout(G, seed=42)

        edge_x = []
        edge_y = []

        for edge in G.edges():
            x0, y0 = pos[edge[0]]
            x1, y1 = pos[edge[1]]
            edge_x += [x0, x1, None]
            edge_y += [y0, y1, None]

        edge_trace = go.Scatter(
            x=edge_x,
            y=edge_y,
            line=dict(width=1, color="#888"),
            hoverinfo='none',
            mode='lines'
        )

        node_x = []
        node_y = []
        node_text = []

        for node in G.nodes():
            x, y = pos[node]
            node_x.append(x)
            node_y.append(y)
            node_text.append(videos[node]["title"])

        node_trace = go.Scatter(
            x=node_x,
            y=node_y,
            mode='markers+text',
            text=[f"V{i+1}" for i in G.nodes()],
            textposition="bottom center",
            hovertext=node_text,
            hoverinfo="text",
            marker=dict(
                size=18,
                color="#1f77b4",
                line_width=2
            )
        )

        fig_network = go.Figure(
            data=[edge_trace, node_trace],
            layout=go.Layout(
                showlegend=False,
                hovermode='closest',
                margin=dict(b=20, l=5, r=5, t=40),
                height=400,
                xaxis=dict(showgrid=False, zeroline=False),
                yaxis=dict(showgrid=False, zeroline=False)
            )
        )

        st.plotly_chart(fig_network, use_container_width=True)

        # ============================
        # Video Index
        # ============================
        st.markdown("#### Video Index")

        for i, v in enumerate(videos):
            st.markdown(f"**V{i+1}** — {v['title']}")

    with col2:

        # ============================
        # Shared Topics
        # ============================
        st.markdown("### 📊 Shared Topics")
        st.write("Topics appearing in multiple videos:")

        for topic, vid_indices in shared_topics.items():

            vid_names = [videos[i]["title"] for i in vid_indices]

            with st.expander(f"**{topic}** ({len(vid_indices)} videos)"):
                for name in vid_names:
                    st.markdown(f"- {name}")

        # ============================
        # Quick Compare
        # ============================
        st.markdown("### ⚖️ Quick Compare")

        vid_a_idx = st.selectbox(
            "Select Video A",
            range(len(videos)),
            format_func=lambda i: videos[i]["title"][:40],
            key="vid_a"
        )

        vid_b_idx = st.selectbox(
            "Select Video B",
            range(len(videos)),
            format_func=lambda i: videos[i]["title"][:40],
            index=min(1, len(videos)-1),
            key="vid_b"
        )

        if vid_a_idx != vid_b_idx:
            sim_score = similarities[vid_a_idx][vid_b_idx]
            st.metric("Similarity Score", f"{sim_score * 100:.0f}%")
        else:
            st.warning("Select two different videos to compare.")
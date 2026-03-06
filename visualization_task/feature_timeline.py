import streamlit as st
import pandas as pd
import plotly.express as px

def render_timeline(selected_video):
    """
    Render a topic evolution timeline for a single video
    """
    st.markdown(f"### ⏱ Topic Timeline - {selected_video['title']}")

    if "topics" not in selected_video or not selected_video["topics"]:
        st.info("No topic timeline available for this video.")
        return

    # Build DataFrame for Plotly
    df = pd.DataFrame([
        {
            "Topic": t["topic"],
            "Start": t["start"] / 60,  # convert to minutes
            "End": t["end"] / 60
        }
        for t in selected_video["topics"]
    ])

    # Compute duration
    df["Duration"] = df["End"] - df["Start"]

    # Plot Gantt-style timeline
    fig = px.timeline(
        df,
        x_start="Start",
        x_end="End",
        y="Topic",
        color="Topic",
        hover_data={"Start": True, "End": True, "Duration": True},
        title=f"Topic Evolution for '{selected_video['title']}'"
    )

    fig.update_yaxes(autorange="reversed")  # topics top-down
    fig.update_layout(height=400, margin=dict(t=40, l=20, r=20, b=20))

    fig.update_xaxes(type='linear', title='Time (minutes)')

    st.plotly_chart(fig, use_container_width=True)
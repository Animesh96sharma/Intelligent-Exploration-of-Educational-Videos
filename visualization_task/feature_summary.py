import streamlit as st
import pandas as pd

def render_summary(video):
    """
    Renders the summary panel for a single video, including multi-level 
    text summaries, chapter details, and a key concepts chart.
    """
    st.markdown("### 📝 Video Summary")
    
    # 1. Multi-level summary selector
    summary_level = st.radio(
        "Select detail level:", 
        ["short", "medium", "long"], 
        horizontal=True
    )
    
    # Display the selected summary
    st.info(video["summaries"][summary_level])
    
    # 2. Hierarchical Chapter Summaries
    st.markdown("### 📋 Chapter Details")
    for ch in video["chapters"]:
        # Convert seconds to minutes for display
        start_min = ch['start'] / 60
        end_min = ch['end'] / 60
        
        # Create an expandable section for each chapter
        with st.expander(f"{ch['title']} ({start_min:.0f} - {end_min:.0f} min)"):
            st.write(ch["summary_short"])
            
            # Show concepts as pill-like text
            if "key_concepts" in ch and ch["key_concepts"]:
                concepts_str = ", ".join(ch["key_concepts"])
                st.caption(f"**Concepts covered:** {concepts_str}")
    
    # 3. Concept "Cloud" (Bar Chart representation)
    st.markdown("### 🏷️ Top Concepts in Video")
    if "key_concepts" in video and video["key_concepts"]:
        # Count frequencies (in a real app, this would come from the API)
        concept_counts = pd.Series(video["key_concepts"]).value_counts()
        st.bar_chart(concept_counts, height=200)
    else:
        st.write("No concept data available for this video.")

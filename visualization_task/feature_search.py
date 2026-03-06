import streamlit as st


def render_transcript_search(videos):

    st.markdown("### 🔍 Search Inside Videos")

    query = st.text_input("Search transcript keywords")

    if not query:
        return

    query = query.lower()

    results = []

    for vid_idx, video in enumerate(videos):

        transcript = video.get("transcript", [])

        for segment in transcript:

            if query in segment["text"].lower():

                results.append({
                    "video_idx": vid_idx,
                    "title": video["title"],
                    "start": segment["start"],
                    "text": segment["text"]
                })

    if not results:
        st.info("No transcript matches found.")
        return

    st.write(f"Found {len(results)} matches")

    for r in results:

        minutes = int(r["start"] // 60)
        seconds = int(r["start"] % 60)

        timestamp = f"{minutes:02}:{seconds:02}"

        with st.expander(f"{r['title']} — {timestamp}"):

            st.write(r["text"])

            st.button(
                f"Jump to {timestamp}",
                key=f"{r['video_idx']}_{r['start']}"
            )
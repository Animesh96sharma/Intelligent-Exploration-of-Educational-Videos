# summarization.py

def generate_summaries(chapters_data):
    """
    Input: The list of chapters from segmentation.py
    Output: A dictionary where keys are titles and values are summaries.
    """
    print("Generating summaries with LLM...")

    summaries = {}

    for chapter in chapters_data:
        title = chapter['title']
        # --- YOUR REAL SUMMARIZATION CODE GOES HERE ---
        # summary = llm_chain.run(chapter['text_content'])

        # Mock result
        summaries[title] = f"This section covers the core concepts of {title}. It explains key terms and provides examples."

    return summaries

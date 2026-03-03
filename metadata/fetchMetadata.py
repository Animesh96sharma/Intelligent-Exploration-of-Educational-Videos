import requests
from bs4 import BeautifulSoup
import json

from gradio.processing_utils import video_is_playable
from test_unstructured.partition.html.test_convert import title_element_html

url = "https://av.tib.eu/search"
params = {
    'q': '"computer vision"',
    'subject': 'Computer Science',
    'lang': 'en',
    'asrSource': 'Whisper',
    'pageSize': 50
}

response = requests.get(url, params=params)
soup = BeautifulSoup(response.text, 'html.parser')

lectures = []
for item in soup.select('.media-item'):
    title_elem = item.select_one('.media-title a')
    duration_elem = item.select_one('.duration')
    if title_elem:
        title = title_elem.text.strip()
        video_id = title_elem['href'].split('/')[-1]
        duration = duration_elem.text.strip() if duration_elem else 'Unknown'
        lectures.append({
            'title': title,
            'url': f"https://av.tib.eu/media/{video_id}",
            'id': video_id,
            'duration': duration
        })

with open('cv_ai_lectures.json', 'w') as f:
    json.dump(lectures, f, indent=2)

print(f"Found {len(lectures)} Computer Vision/AI lectures")
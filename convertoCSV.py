import json
import csv
import time

start = time.time()
english_lectures = []

with open('media.jsonl', 'r', encoding='utf-8') as f:
    writer = None
    first = True

    for line_num, line in enumerate(f, 1):
        data = json.loads(line.strip())

        metadata = data.get('metadata', {})
        language = metadata.get('language', '')
        duration = data.get('duration', 0)
        genres = metadata.get('genres', [])
        subjects = metadata.get('subjects', [])

        # Current 3 filters
        is_english = language == 'eng'
        is_long = duration > 1800
        is_lecture = any('lecture' in g.get('labels', {}).get('en', '').lower() or
                         'vortrag' in g.get('labels', {}).get('de', '').lower()
                         for g in genres)

        if is_english and is_long and is_lecture:
            row = {
                'id': data.get('id'),
                'title': metadata.get('title', {}).get('value', 'No title'),
                'language': language,
                'duration_sec': duration,
                'duration_min': f"{duration//60}:{duration%60:02d}",
                'url': f"https://av.tib.eu/media/{data.get('id')}",
                'year': metadata.get('publicationYear', 'Unknown'),
                'genres': ', '.join([g.get('labels', {}).get('en', '') for g in genres]),
                'subjects': ', '.join([s.get('labels', {}).get('en', '') for s in subjects])  # 👈 NEW
            }
            english_lectures.append(row)

            if len(english_lectures) >= 1000:
                if first:
                    writer = csv.DictWriter(open('english_lectures_subjects.csv', 'w', newline='', encoding='utf-8'),
                                            fieldnames=row.keys())
                    writer.writeheader()
                    first = False
                writer.writerows(english_lectures)
                english_lectures = []
                print(f"✅ {line_num:,} lines - {len(english_lectures)} lectures")

# Final batch
if english_lectures:
    if first:
        writer = csv.DictWriter(open('english_lectures_subjects.csv', 'w', newline='', encoding='utf-8'),
                                fieldnames=english_lectures[0].keys())
        writer.writeheader()
    writer.writerows(english_lectures)

print(f"✅ Done in {time.time()-start:.1f}s")
print(f"📊 {len(english_lectures)} English lectures >30min with subjects")

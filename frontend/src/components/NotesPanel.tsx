import { useState } from 'react'
import type { VideoNote } from '../types/userState'
import { formatTimeLabel } from '../lib/userState'

type NotesPanelProps = {
  notes: VideoNote[]
  onAddNote: (text: string) => void
  onUpdateNote: (noteId: string, text: string) => void
  onRemoveNote: (noteId: string) => void
  onJumpToTime: (time: number) => void
}

export default function NotesPanel({
  notes,
  onAddNote,
  onUpdateNote,
  onRemoveNote,
  onJumpToTime,
}: NotesPanelProps) {
  const [draft, setDraft] = useState('')

  return (
    <section className="sidebar-card">
      <div className="results-head">
        <h3>Notes & annotations</h3>
        <span>{notes.length} saved</span>
      </div>

      <div className="notes-compose">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a note for the current timestamp..."
          rows={4}
        />
        <button
          type="button"
          className="primary-btn"
          onClick={() => {
            const text = draft.trim()
            if (!text) return
            onAddNote(text)
            setDraft('')
          }}
        >
          Save note
        </button>
      </div>

      {notes.length === 0 ? (
        <p>No notes saved yet.</p>
      ) : (
        <div className="notes-list">
          {notes.map((note) => (
            <article key={note.id} className="note-card">
              <div className="note-card-head">
                <button type="button" className="inline-link" onClick={() => onJumpToTime(note.timestamp)}>
                  {formatTimeLabel(note.timestamp)}
                </button>
                <button type="button" className="secondary-btn small" onClick={() => onRemoveNote(note.id)}>
                  Delete
                </button>
              </div>

              <textarea
                value={note.text}
                rows={3}
                onChange={(event) => onUpdateNote(note.id, event.target.value)}
              />
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
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

export default function NotesPanel({ notes, onAddNote, onUpdateNote, onRemoveNote, onJumpToTime }: NotesPanelProps) {
  const [draft, setDraft] = useState('')

  return (
    <section className="bg-white border border-slate-200 rounded-[22px] p-5 shadow-[0_8px_20px_rgba(15,23,42,0.05)] flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="m-0 text-[1.05rem] tracking-[-0.02em] inline-flex items-center gap-2.5">Notes &amp; annotations</h3>
        <span className="text-slate-400 text-sm">{notes.length} saved</span>
      </div>

      <div className="flex flex-col gap-2.5">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a note for the current timestamp..."
          rows={4}
          className="w-full border border-slate-200 rounded-[12px] bg-white px-3 py-2.5 text-slate-900 resize-y box-border outline-none focus:border-slate-400"
        />
        <button
          type="button"
          className="border border-black rounded-[14px] bg-black text-white px-4 py-2.5 font-bold shadow-[0_16px_28px_rgba(0,0,0,0.14)] transition-[transform,box-shadow] duration-[180ms] hover:bg-[#111] hover:translate-y-[-1px]"
          onClick={() => { const t = draft.trim(); if (!t) return; onAddNote(t); setDraft('') }}
        >
          Save note
        </button>
      </div>

      {notes.length === 0 ? (
        <p className="text-slate-400 text-sm">No notes saved yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((note) => (
            <article key={note.id} className="border border-slate-200 bg-slate-50 rounded-[14px] p-3">
              <div className="flex justify-between gap-3 items-start mb-2">
                <button
                  type="button"
                  className="border-none bg-transparent text-black p-0 font-bold transition-[transform] hover:translate-y-[-1px] text-sm"
                  onClick={() => onJumpToTime(note.timestampSeconds)}
                >
                  {formatTimeLabel(note.timestampSeconds)}
                </button>
                <button
                  type="button"
                  className="border border-black rounded-[14px] bg-white text-black px-3 py-2 text-[0.82rem] font-semibold shadow-[0_8px_20px_rgba(15,23,42,0.05)] hover:bg-[#f8f8f8]"
                  onClick={() => onRemoveNote(note.id)}
                >
                  Delete
                </button>
              </div>
              <textarea
                value={note.text}
                rows={3}
                onChange={(e) => onUpdateNote(note.id, e.target.value)}
                className="w-full border border-slate-200 rounded-[12px] bg-white px-3 py-2.5 text-slate-900 resize-y box-border outline-none focus:border-slate-400 text-sm"
              />
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

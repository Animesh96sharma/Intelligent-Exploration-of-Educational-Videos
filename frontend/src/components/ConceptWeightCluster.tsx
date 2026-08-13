import { useMemo } from 'react'
import type { VideoRecord } from '../types/video'
import { buildConceptOccurrenceCounts } from '../lib/analytics'
import LiveWordCloud, { type WordEntry } from './LiveWordCloud'

type ConceptWeightClusterProps = {
  videos: VideoRecord[]
  onSelectConcept: (concept: string | null) => void
  selectedConcept: string | null
}

export default function ConceptWeightCluster({ videos, onSelectConcept, selectedConcept }: ConceptWeightClusterProps) {
  const occurrenceCounts = useMemo(() => buildConceptOccurrenceCounts(videos), [videos])
  const entries: WordEntry[] = useMemo(
    () => Array.from(occurrenceCounts.values()).map((e) => ({ label: e.label, weight: e.occurrences, meta: `${e.videoCount} video${e.videoCount === 1 ? '' : 's'}` })),
    [occurrenceCounts],
  )

  return (
    <div className="flex flex-col gap-3">
      <LiveWordCloud
        entries={entries}
        onSelectConcept={onSelectConcept}
        selectedConcept={selectedConcept}
        unitLabel="total mentions"
        emptyMessage="No concept frequency data is available for the current filtered set."
      />
    </div>
  )
}

import { useMemo } from 'react'
import type { VideoRecord } from '../types/video'
import { buildConceptOccurrenceCounts } from '../lib/analytics'
import LiveWordCloud, { type WordEntry } from './LiveWordCloud'

type ConceptWeightClusterProps = {
  videos: VideoRecord[]
  onSelectConcept: (concept: string | null) => void
  selectedConcept: string | null
}

export default function ConceptWeightCluster({
  videos,
  onSelectConcept,
  selectedConcept,
}: ConceptWeightClusterProps) {
  const occurrenceCounts = useMemo(() => buildConceptOccurrenceCounts(videos), [videos])

  const entries: WordEntry[] = useMemo(
    () =>
      Array.from(occurrenceCounts.values()).map((entry) => ({
        label: entry.label,
        weight: entry.occurrences,
        meta: `${entry.videoCount} video${entry.videoCount === 1 ? '' : 's'}`,
      })),
    [occurrenceCounts],
  )

  return (
    <div className="concept-cluster-shell">
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

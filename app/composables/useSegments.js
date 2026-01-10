import { ref } from 'vue'

export function useSegments() {
  const activeSegment = ref('kids')

  const switchSegment = (segmentName) => {
    activeSegment.value = segmentName
  }

  const isActive = (segmentName) => activeSegment.value === segmentName

  return { activeSegment, switchSegment, isActive }
}

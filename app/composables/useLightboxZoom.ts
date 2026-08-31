import { ref, computed, type Ref } from 'vue'

export function useLightboxZoom(
  viewportRef: Ref<HTMLElement | null>,
  imageRef: Ref<HTMLImageElement | null>
) {
  const MIN_ZOOM = 1
  const MAX_ZOOM = 5

  const scale = ref(1)
  const translateX = ref(0)
  const translateY = ref(0)
  const isDragging = ref(false)
  const isPinching = ref(false)

  const activePointers = new Map<number, { x: number; y: number }>()
  let initialPinchDistance = 0
  let initialPinchScale = 1
  let lastPointerPos = { x: 0, y: 0 }
  let touchStartPos = { x: 0, y: 0, time: 0 }
  let lastTapTime = 0

  const zoomPercent = computed(() => `${Math.round(scale.value * 100)}%`)

  function resetZoom() {
    scale.value = 1
    translateX.value = 0
    translateY.value = 0
    isDragging.value = false
    isPinching.value = false
  }

  function clampPan(newX: number, newY: number, currentScale = scale.value) {
    if (!viewportRef.value || !imageRef.value || currentScale <= 1) {
      translateX.value = 0
      translateY.value = 0
      return
    }

    const vpWidth = viewportRef.value.clientWidth
    const vpHeight = viewportRef.value.clientHeight
    const imgWidth = imageRef.value.clientWidth * currentScale
    const imgHeight = imageRef.value.clientHeight * currentScale

    const maxPanX = Math.max(0, (imgWidth - vpWidth) / 2)
    const maxPanY = Math.max(0, (imgHeight - vpHeight) / 2)

    translateX.value = Math.max(-maxPanX, Math.min(maxPanX, newX))
    translateY.value = Math.max(-maxPanY, Math.min(maxPanY, newY))
  }

  function setZoom(newScale: number, centerX?: number, centerY?: number) {
    const clampedScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale))

    if (centerX !== undefined && centerY !== undefined && viewportRef.value) {
      const rect = viewportRef.value.getBoundingClientRect()
      const relX = centerX - rect.left - rect.width / 2
      const relY = centerY - rect.top - rect.height / 2
      const factor = clampedScale / scale.value

      const targetX = translateX.value - relX * (factor - 1)
      const targetY = translateY.value - relY * (factor - 1)

      scale.value = clampedScale
      clampPan(targetX, targetY, clampedScale)
    } else {
      scale.value = clampedScale
      clampPan(translateX.value, translateY.value, clampedScale)
    }
  }

  function zoomIn() {
    setZoom(scale.value + 0.5)
  }

  function zoomOut() {
    setZoom(scale.value - 0.5)
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.3 : -0.3
    setZoom(scale.value + delta, e.clientX, e.clientY)
  }

  function getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }) {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y)
  }

  function getCenter(p1: { x: number; y: number }, p2: { x: number; y: number }) {
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
  }

  function handlePointerDown(e: PointerEvent) {
    if (!viewportRef.value) return
    ;(e.target as HTMLElement)?.setPointerCapture?.(e.pointerId)
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (activePointers.size === 1) {
      lastPointerPos = { x: e.clientX, y: e.clientY }
      touchStartPos = { x: e.clientX, y: e.clientY, time: Date.now() }
      if (scale.value > 1) {
        isDragging.value = true
      }
    } else if (activePointers.size === 2) {
      isPinching.value = true
      isDragging.value = false
      const [p1, p2] = Array.from(activePointers.values())
      initialPinchDistance = getDistance(p1, p2)
      initialPinchScale = scale.value
    }
  }

  function handlePointerMove(e: PointerEvent) {
    if (!activePointers.has(e.pointerId)) return
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (isPinching.value && activePointers.size === 2) {
      const [p1, p2] = Array.from(activePointers.values())
      const currentDist = getDistance(p1, p2)
      const center = getCenter(p1, p2)
      if (initialPinchDistance > 0) {
        const ratio = currentDist / initialPinchDistance
        setZoom(initialPinchScale * ratio, center.x, center.y)
      }
    } else if (isDragging.value && activePointers.size === 1) {
      const dx = e.clientX - lastPointerPos.x
      const dy = e.clientY - lastPointerPos.y
      lastPointerPos = { x: e.clientX, y: e.clientY }
      clampPan(translateX.value + dx, translateY.value + dy)
    }
  }

  function handlePointerUp(e: PointerEvent) {
    activePointers.delete(e.pointerId)

    if (activePointers.size === 0) {
      isDragging.value = false
      isPinching.value = false
    } else if (activePointers.size === 1) {
      isPinching.value = false
      if (scale.value > 1) {
        isDragging.value = true
        const remaining = Array.from(activePointers.values())[0]
        lastPointerPos = { x: remaining.x, y: remaining.y }
      }
    }
  }

  function handleDoubleClick(e: MouseEvent) {
    if (scale.value > 1) {
      resetZoom()
    } else {
      setZoom(2.5, e.clientX, e.clientY)
    }
  }

  return {
    scale,
    translateX,
    translateY,
    isDragging,
    isPinching,
    zoomPercent,
    resetZoom,
    zoomIn,
    zoomOut,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleDoubleClick
  }
}

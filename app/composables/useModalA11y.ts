import { ref, watch, nextTick, onUnmounted, type Ref } from 'vue'

export interface ModalA11yOptions {
  initialFocusSelector?: string
  dialogRef?: Ref<HTMLElement | null>
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ')

/**
 * Composable acessível reutilizável para Modais, Dialogs e Sheets (A11y WAI-ARIA).
 *
 * Funcionalidades:
 * 1. Fechamento via tecla Escape;
 * 2. Focus Trap estrito (Tab / Shift+Tab circulam apenas dentro do dialog);
 * 3. Foco inicial automático no primeiro elemento interativo;
 * 4. Restauração do foco ao elemento trigger que abriu o modal após o fechamento.
 *
 * LOC <= 200
 */
export function useModalA11y(
  isOpen: Ref<boolean>,
  emitClose: () => void,
  options: ModalA11yOptions = {}
) {
  const triggerElement = ref<HTMLElement | null>(null)
  const currentDialogEl = ref<HTMLElement | null>(null)

  function getFocusableElements(container: HTMLElement): HTMLElement[] {
    const elements = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    return elements.filter(el => {
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0
    })
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!isOpen.value) return

    if (e.key === 'Escape') {
      const allDialogs = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"], [role="alertdialog"]'))
      if (allDialogs.length > 1) {
        const topmostDialog = allDialogs[allDialogs.length - 1]
        // Se houver múltiplos diálogos abertos e este não for o topo da pilha, não consome Escape
        if (currentDialogEl.value && currentDialogEl.value !== topmostDialog) {
          return
        }
      }

      e.preventDefault()
      e.stopPropagation()
      emitClose()
      return
    }

    if (e.key === 'Tab') {
      const container = currentDialogEl.value || options.dialogRef?.value || (document.querySelector('[role="dialog"][aria-modal="true"], [role="alertdialog"][aria-modal="true"]') as HTMLElement | null)
      if (!container) return

      const focusables = getFocusableElements(container)
      if (focusables.length === 0) {
        e.preventDefault()
        return
      }

      const firstElement = focusables[0]
      const lastElement = focusables[focusables.length - 1]
      const activeEl = document.activeElement as HTMLElement | null

      if (e.shiftKey) {
        // Shift + Tab: se estiver no primeiro, cicla para o último
        if (activeEl === firstElement || !container.contains(activeEl)) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab normal: se estiver no último, cicla para o primeiro
        if (activeEl === lastElement || !container.contains(activeEl)) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }
  }

  watch(isOpen, async (open) => {
    if (typeof window === 'undefined') return

    if (open) {
      // Salva o trigger ativo antes de abrir o modal
      const active = document.activeElement as HTMLElement | null
      if (active && active !== document.body) {
        triggerElement.value = active
      }
      window.addEventListener('keydown', handleKeyDown, true)

      await nextTick()
      const allDialogs = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"], [role="alertdialog"]'))
      currentDialogEl.value = options.dialogRef?.value || allDialogs[allDialogs.length - 1] || null

      const container = currentDialogEl.value
      if (container) {
        let targetEl: HTMLElement | null = null
        if (options.initialFocusSelector) {
          targetEl = container.querySelector<HTMLElement>(options.initialFocusSelector)
        }
        if (!targetEl) {
          const focusables = getFocusableElements(container)
          targetEl = focusables[0] || null
        }
        if (targetEl && typeof targetEl.focus === 'function') {
          targetEl.focus()
        }
      }
    } else {
      window.removeEventListener('keydown', handleKeyDown, true)
      currentDialogEl.value = null
      await nextTick()
      // Restaura o foco para o elemento original se ainda estiver conectado ao DOM
      if (
        triggerElement.value &&
        typeof triggerElement.value.focus === 'function' &&
        document.contains(triggerElement.value)
      ) {
        triggerElement.value.focus()
      } else {
        // Fallback: se o trigger foi desmontado (ex: botão em parent sheet que fechou), foca no primeiro controle interativo da tela
        const fallback = document.querySelector<HTMLElement>('[role="button"], button, a[href], input')
        if (fallback && typeof fallback.focus === 'function') {
          fallback.focus()
        }
      }
      triggerElement.value = null
    }
  }, { immediate: true })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  })

  return {
    triggerElement
  }
}

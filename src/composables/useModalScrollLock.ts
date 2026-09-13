import { watch, onUnmounted, type Ref } from 'vue'

/**
 * Locks page scroll while any of the given modal-open refs is true —
 * fixes the "background page still scrolls behind an open modal"
 * issue, since .modal-overlay being position:fixed doesn't stop the
 * underlying body from scrolling on its own. Pass every modal-open
 * ref this component has; the body stays locked as long as at least
 * one of them is true, and always restores on unmount as a safety net.
 */
export function useModalScrollLock(...openRefs: Ref<boolean>[]) {
  const previousOverflow = document.body.style.overflow

  watch(openRefs, (values) => {
    const anyOpen = values.some(Boolean)
    document.body.style.overflow = anyOpen ? 'hidden' : previousOverflow
  })

  onUnmounted(() => {
    document.body.style.overflow = previousOverflow
  })
}
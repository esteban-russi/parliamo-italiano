import { RefObject, useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

// Open dialogs, topmost last. Only the topmost one reacts to Tab and Escape,
// so a drawer opened from inside the video call does not close the call.
const dialogStack: RefObject<HTMLElement | null>[] = [];
let overflowBeforeFirstDialog = '';

/**
 * Modal dialog behaviour: moves focus into the dialog when it opens, keeps Tab
 * inside it, closes on Escape (when `onEscape` is given), locks page scroll and
 * returns focus to the element that opened it when it closes.
 */
export function useDialog(
  containerRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onEscape?: () => void
) {
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!isOpen) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    if (dialogStack.length === 0) {
      overflowBeforeFirstDialog = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    dialogStack.push(containerRef);

    const focusables = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        el => el.offsetParent !== null || el === document.activeElement
      );

    // Prefer an element marked data-autofocus (the dialog itself may carry it),
    // then the first focusable, then the dialog itself
    const initial = container.hasAttribute('data-autofocus')
      ? container
      : container.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0] ?? container;
    initial.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (dialogStack[dialogStack.length - 1] !== containerRef) return;

      if (e.key === 'Escape' && onEscapeRef.current) {
        e.preventDefault();
        onEscapeRef.current();
        return;
      }

      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !container.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !container.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const index = dialogStack.lastIndexOf(containerRef);
      if (index !== -1) dialogStack.splice(index, 1);
      if (dialogStack.length === 0) document.body.style.overflow = overflowBeforeFirstDialog;
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [isOpen, containerRef]);
}

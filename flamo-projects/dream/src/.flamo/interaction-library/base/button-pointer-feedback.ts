export type ButtonPointerFeedbackState = 'idle' | 'hover' | 'pressed' | 'clicked';

export type ButtonPointerFeedbackEvent =
  | { type: 'pointerenter' }
  | { type: 'pointerleave' }
  | { type: 'pointerdown'; button?: number }
  | { type: 'pointerup'; inside?: boolean }
  | { type: 'pointercancel' }
  | { type: 'click' }
  | { type: 'settle'; inside?: boolean };

export function reduceButtonPointerFeedback(
  state: ButtonPointerFeedbackState,
  event: ButtonPointerFeedbackEvent,
): ButtonPointerFeedbackState {
  switch (event.type) {
    case 'pointerenter':
      return state === 'pressed' ? state : 'hover';
    case 'pointerleave':
    case 'pointercancel':
      return 'idle';
    case 'pointerdown':
      return (event.button ?? 0) === 0 ? 'pressed' : state;
    case 'pointerup':
      return event.inside === false ? 'idle' : 'hover';
    case 'click':
      return 'clicked';
    case 'settle':
      return event.inside === false ? 'idle' : 'hover';
  }
}

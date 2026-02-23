/**
 * Shared Feature Option Lists
 *
 * Single source of truth for option arrays consumed by both the
 * Preferences UI (ui/preferences.js) and the Site Editor
 * (ui/siteeditor.js).  Neither file should define these locally.
 *
 * The null/"Global (default)" sentinel required by the Site Editor's
 * override controls is added at the call site via withGlobalDefault()
 * in siteeditor.js so these arrays stay clean for direct use in
 * preferences.js.
 */

export var FOCUS_OUTLINE_OPTIONS = [
  { value: 'off',    label: 'Subtle Blue' },
  { value: 'on',     label: 'Blue Ring' },
  { value: 'high',   label: 'Yellow Ring' },
  { value: 'portal', label: 'Portal Style (Glow)' },
  { value: 'white',  label: 'White Ring' },
];

export var FOCUS_TRANSITION_MODE_OPTIONS = [
  { value: 'slide', label: 'Slide (Directional)' },
  { value: 'scale', label: 'Scale (Grow)' },
  { value: 'glow',  label: 'Glow (Pulse)' },
  { value: 'off',   label: 'Off' },
];

export var FOCUS_TRANSITION_SPEED_OPTIONS = [
  { value: 'fast',   label: 'Fast (150ms)' },
  { value: 'medium', label: 'Medium (250ms)' },
  { value: 'slow',   label: 'Slow (400ms)' },
];

export var TEXT_SCALE_OPTIONS = [
  { value: 'extra-small', label: 'Extra Small (75%)' },
  { value: 'small',       label: 'Small (90%)' },
  { value: 'off',         label: 'Normal (100%)' },
  { value: 'medium',      label: 'Medium (115%)' },
  { value: 'large',       label: 'Large (135%)' },
  { value: 'extra-large', label: 'Extra Large (160%)' },
];

export var NAVIGATION_MODE_OPTIONS = [
  { value: 'geometric',   label: 'Grid Navigation (Geometric)' },
  { value: 'directional', label: 'Smart Navigation (Directional)' },
  { value: 'polyfill',    label: 'Legacy Polyfill (Compatibility Only)' },
];

export var VIEWPORT_OPTIONS = [
  { value: 'auto',     label: 'Auto' },
  { value: 'locked',   label: 'Locked (1920)' },
  { value: 'unlocked', label: 'Unlocked' },
];

export var UA_MODE_OPTIONS = [
  { value: 'tizen',   label: 'Tizen TV' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'mobile',  label: 'Mobile' },
];

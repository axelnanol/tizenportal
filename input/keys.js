/**
 * TizenPortal Key Code Constants
 * 
 * Samsung Tizen remote key codes and mappings.
 * 
 * ⚠️ WARNING: Do NOT register for or handle the BACK button (10009).
 * Intercepting BACK often causes hard crashes on Tizen.
 * Let the system handle BACK natively.
 */

/**
 * Key code constants
 */
export var KEYS = {
  // Navigation
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  ENTER: 13,

  // ⚠️ DO NOT USE - Causes crashes on Tizen!
  // BACK: 10009,

  // Exit
  EXIT: 10182,

  // Color buttons
  RED: 403,
  GREEN: 404,
  YELLOW: 405,
  BLUE: 406,

  // Media controls
  PLAY: 415,
  PAUSE: 19,
  PLAY_PAUSE: 10252,
  STOP: 413,
  REWIND: 412,
  FAST_FORWARD: 417,
  TRACK_PREVIOUS: 10232,
  TRACK_NEXT: 10233,

  // Volume (usually handled by system)
  VOLUME_UP: 447,
  VOLUME_DOWN: 448,
  MUTE: 449,

  // Channel (usually handled by system)
  CHANNEL_UP: 427,
  CHANNEL_DOWN: 428,

  // Number pad
  NUM_0: 48,
  NUM_1: 49,
  NUM_2: 50,
  NUM_3: 51,
  NUM_4: 52,
  NUM_5: 53,
  NUM_6: 54,
  NUM_7: 55,
  NUM_8: 56,
  NUM_9: 57,

  // IME (on-screen keyboard)
  IME_DONE: 65376,
  IME_CANCEL: 65385,

  // Info / Guide
  INFO: 457,
  GUIDE: 458,

  // Source / Input
  SOURCE: 10072,

  // Menu
  MENU: 10133,
  TOOLS: 10135,
};

/**
 * Color button action mappings
 * 
 * | Button | Short Press         | Long Press              |
 * |--------|---------------------|-------------------------|
 * | Red    | Address bar         | Reload page             |
 * | Green  | Mouse mode toggle   | Focus highlight toggle  |
 * | Yellow | Preferences         | Add site                |
 * | Blue   | Diagnostics menu    | Safe mode               |
 */
export var COLOR_ACTIONS = {
  RED: {
    short: 'addressbar',
    long: 'reload',
  },
  GREEN: {
    short: 'pointerMode',
    long: 'focusHighlight',
  },
  YELLOW: {
    short: 'preferences',
    long: 'addSite',
  },
  BLUE: {
    short: 'diagnostics',
    long: 'safeMode',
  },
};

/**
 * Check if a key code is a navigation key
 * @param {number} keyCode
 * @returns {boolean}
 */
export function isNavigationKey(keyCode) {
  return keyCode === KEYS.LEFT ||
         keyCode === KEYS.UP ||
         keyCode === KEYS.RIGHT ||
         keyCode === KEYS.DOWN;
}

/**
 * Check if a key code is a color button
 * @param {number} keyCode
 * @returns {boolean}
 */
export function isColorButton(keyCode) {
  return keyCode === KEYS.RED ||
         keyCode === KEYS.GREEN ||
         keyCode === KEYS.YELLOW ||
         keyCode === KEYS.BLUE;
}

/**
 * Check if a key code is a media key
 * @param {number} keyCode
 * @returns {boolean}
 */
export function isMediaKey(keyCode) {
  return keyCode === KEYS.PLAY ||
         keyCode === KEYS.PAUSE ||
         keyCode === KEYS.PLAY_PAUSE ||
         keyCode === KEYS.STOP ||
         keyCode === KEYS.REWIND ||
         keyCode === KEYS.FAST_FORWARD ||
         keyCode === KEYS.TRACK_PREVIOUS ||
         keyCode === KEYS.TRACK_NEXT;
}

/**
 * Get the name of a key from its code
 * @param {number} keyCode
 * @returns {string|null}
 */
export function getKeyName(keyCode) {
  for (var name in KEYS) {
    if (KEYS.hasOwnProperty(name) && KEYS[name] === keyCode) {
      return name;
    }
  }
  return null;
}

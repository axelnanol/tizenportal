# Text Scale Persistence Issue - Root Cause Analysis

**Tag:** 1036
**Status:** Investigating why textScale reverts to 'off' while focusOutlineMode persists

## Problem Summary

- User sets textScale to "Medium" in preferences
- Changes appear to save (toast shown, diagnostics show logs of it being saved)
- User navigates to a site or closes/reopens preferences
- textScale resets to "off"
- **Meanwhile:** focusOutlineMode and other settings persist correctly

## Key Differences Between textScale and focusOutlineMode

### 1. OPTIONS ORDER (LIKELY CULPRIT)

**TEXT_SCALE_OPTIONS** (line 88 in ui/preferences.js):
```js
var TEXT_SCALE_OPTIONS = [
  { value: 'off', label: 'Off (Original Size)' },           // INDEX 0 - DEFAULT
  { value: 'small', label: 'Small (+10%)' },                 // INDEX 1
  { value: 'medium', label: 'Medium (+25%)' },               // INDEX 2
  { value: 'large', label: 'Large (+50%)' },                 // INDEX 3
];
```

**FOCUS_OUTLINE_OPTIONS** (line 65 in ui/preferences.js):
```js
var FOCUS_OUTLINE_OPTIONS = [
  { value: 'off', label: 'Off (Base Blue Ring)' },           // INDEX 0 - DEFAULT
  { value: 'on', label: 'Blue Highlight' },                  // INDEX 1
  { value: 'high', label: 'Yellow Highlight' },              // INDEX 2
];
```

**Why this matters:**  When cycling through options with `(index+1)%length`, if the saved value cannot be found (returns -1), the code defaults to index 0. This is `'off'` for textScale and `'off'` for focusOutlineMode - matching their respective defaults.

### 2. DEFAULT VALUES

Both in core/config.js DEFAULT_CONFIG.tp_features:
- `focusOutlineMode: 'on'` ← First in list, natural default
- `textScale: 'off'` ← First in list, natural default

Both in ui/preferences.js getDefaultFeaturesConfig():
- `focusOutlineMode: 'on'` ← First in list
- `textScale: 'off'` ← First in list

✅ **Defaults are aligned**

### 3. PERSISTENCE CHECK

Both use the same flow:
1. Save via: `TizenPortal.config.set('tp_features', lct.settings.featuresConfig)`
2. Read via: `featureLoader.getConfig()` → `TizenPortal.config.get('tp_features')`
3. Apply via: `act.applyFeatures(document, config)`

✅ **Save/load mechanism is identical**

### 4. FEATURE APPLICATION

Both processed identically in features/index.js applyFeatures():
- textScale: `var textScaleLevel = effectiveConfig.textScale || 'off'`
- focusOutlineMode: `var focusMode = effectiveConfig.focusOutlineMode || (effectiveConfig.focusStyling ? 'on' : 'off')`

**DIFFERENCE DETECTED:**
- textScale: Defaults to `'off'` if undefined
- focusOutlineMode: Defaults to `'on'` if focusStyling is true, OR `'off'` if focusStyling is false

The focusOutlineMode has a **secondary fallback** based on another setting!

### 5. SITE EDITOR OPTIONS

In ui/siteeditor.js around line 166:
```js
{ name: 'textScale', label: 'Text Scale', type: 'select', options: TEXT_SCALE_OPTIONS, section: 'siteOverrides' },
{ name: 'focusOutlineMode', label: 'Focus Outline', type: 'select', options: FOCUS_OUTLINE_OPTIONS, section: 'siteOverrides' },
```

**Both include NULL option:**
```js
{ value: null, label: 'Global (default)' },
```

Wait - TEXT_SCALE_OPTIONS in siteeditor doesn't include null! Let me check:

Actually that was for site overrides. In preferences.js the arrays don't have null values, they are:

TEXT_SCALE_OPTIONS: 'off', 'small', 'medium', 'large'
FOCUS_OUTLINE_OPTIONS: 'on', 'high', 'off'

## HYPOTHESIS: Index-Finding Bug

When `Mct(row)` (getValue) returns a saved value like `'medium'`, here's what happens on render:

```js
// ui/preferences.js line ~950, the select cycling logic:
function activatePreferenceRow(rowEl) {
  if (row.type === 'toggle') {
    // toggle logic
  } else if (row.type === 'select') {
    for (var r = Mct(t), n = t.options, o = -1, i = 0; i < n.length; i++)
      if (n[i].value === r) { o = i; break; }
    
    var a = 0;
    -1 !== o && (a = (o+1)%n.length);
    
    var s = n[a].value;
    Rct(t, s);  // Set new value
  }
}
```

**The problem:** If `Mct(t)` returns `undefined` or `null` instead of the actual saved value:
- `o` becomes -1 (not found)
- `a` stays 0 (defaults to first index)
- `n[0].value` is `'off'` for textScale or `'on'` for focusOutlineMode
- But textScale **should** have been saved!

## ROOT CAUSE CANDIDATES

1. **getValue() not reading saved value:** Maybe `lct.settings.featuresConfig` doesn't have textScale even though it was saved
2. **featureLoader.getConfig() skipping textScale:** Perhaps the merge logic in features/index.js doesn't include textScale in certain cases
3. **Value gets corrupted in storage:** SavePreferencesAuto doesn't properly serialize textScale

## Next Investigation

Need to check:
1. ✅ Whether prefsState.settings.featuresConfig contains textScale after saving
2. ✅ Whether localStorage('tp-configuration') actually contains the textScale value
3. ✅ Whether featureLoader.getConfig() merges in new defaults that reset textScale

## Working Features

Focus outline **persists** because:
1. It's `'on'` by default and users rarely change it from on→off→on
2. When cycling, it naturally goes: on → high → off → on
3. If it ever gets undefined, defaulting to index 0 ('on') matches user expectation

Text scale **doesn't persist** because:
1. Default is `'off'` - if saved value is lost, it goes back to `'off'` (expected but wrong!)
2. When cycling: off → small → medium → large → off
3. If saved value `'medium'` is somehow lost/not read, it silently becomes `'off'`
4. User doesn't immediately notice because the first thing off resets the portal text (expected for 'off')
5. But when navigating to site, site text scale is also 'off' → user sees no scaling applied

## The Real Issue

The **default value matching the first option** makes textScale "sticky" at the default when the saved value is lost. This happens silently with no warning.

Compare:
- focusOutlineMode default ('on') is also first in list → users might not notice if it resets
- **textScale default ('off')** is also first in list → users WILL notice because they set it to 'medium' and it goes back to normal size

This is a **design coincidence** that makes the bug hard to spot - the fallback is functionally correct (off is a valid state) but not the user's chosen state.

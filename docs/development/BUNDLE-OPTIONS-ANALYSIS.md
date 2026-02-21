# Bundle Options Registry Analysis

## Decision: DO NOT Merge Bundle Options into Unified Registry

### Date
February 15, 2026

### Context
After implementing the unified registry system for features and userscripts, we evaluated whether bundle options should also be integrated into this registry.

## Analysis

### Current Bundle Options Implementation

Bundle options are:
- **Defined in** bundle manifest.json files
- **Stored in** card objects (per-site): `card.bundleOptions`, `card.bundleOptionData`
- **Scope**: Per-card/per-site configuration
- **Types**: toggle, url, select, text
- **UI**: Dynamically rendered from manifest.options array
- **Usage**: Configure bundle behavior on a per-site basis

**Example** (from adblock bundle):
```json
{
  "options": [
    {
      "key": "strict",
      "label": "Strict Mode",
      "type": "toggle",
      "default": false,
      "description": "Enable stricter ad blocking"
    },
    {
      "key": "allowlistUrl",
      "label": "Allowlist URL",
      "type": "url",
      "placeholder": "https://example.com/allowlist.txt"
    }
  ]
}
```

### Unified Registry System

The registry manages:
- **Items**: Features and userscripts
- **Stored in**: Global config (tp_features, tp_userscripts_v2)
- **Scope**: Global, system-wide
- **Types**: FEATURE (executable code) or USERSCRIPT (executable code)
- **UI**: Static preference toggles and sections
- **Usage**: Enable/disable global enhancements

## Key Differences

| Aspect | Bundle Options | Registry Items |
|--------|---------------|----------------|
| **Nature** | Configuration metadata | Executable features/scripts |
| **Scope** | Per-site (card-specific) | Global (system-wide) |
| **Storage** | In card objects | Global config store |
| **UI Pattern** | Dynamic forms from manifest | Static preference rows |
| **Lifecycle** | Applied when bundle activates | Applied at page load |
| **Purpose** | Configure bundle behavior | Enable/disable enhancements |
| **Relationship** | Belong to bundles | Standalone items |

## Decision Rationale

### Reasons Against Merging

1. **Different Abstraction Levels**
   - Bundle options are *configuration for* bundles
   - Registry items *are* features/scripts themselves
   - Mixing these would violate separation of concerns

2. **Different Scope Models**
   - Bundle options are inherently per-site
   - Registry items are inherently global
   - The storage and retrieval patterns are fundamentally incompatible

3. **Different Storage Requirements**
   - Options need per-card storage (can vary by site)
   - Registry items need global storage (apply everywhere)
   - Card objects are the natural home for per-site config

4. **Different UI Paradigms**
   - Options need dynamic form generation from manifests
   - Registry items need static toggle lists
   - The UI patterns serve different purposes

5. **Coupling Concerns**
   - Merging would tightly couple bundle system to registry
   - Would make bundles dependent on registry internals
   - Reduces modularity and flexibility

6. **Complexity Without Benefit**
   - Would add significant complexity to registry
   - No clear architectural improvement
   - Current design is already clean and appropriate

### What Would Be Gained (Minimal)
- Slight unification of query patterns
- Could use Registry.query() to list options

### What Would Be Lost (Significant)
- Clear separation of concerns
- Appropriate scoping (global vs per-site)
- Simple storage model for options
- Bundle independence from registry
- Flexibility to evolve systems separately

## Recommendation

**Keep bundle options as part of the bundle manifest system.**

Bundle options are configuration metadata for bundles, not standalone features. They belong in the bundle system where they:
1. Are appropriately scoped (per-site)
2. Are naturally stored (in card objects)
3. Have appropriate UI (dynamic forms)
4. Maintain loose coupling with other systems

The unified registry is for global, executable enhancements (features and userscripts). Bundle options serve a different purpose and should remain separate.

## Alternative Considered

We could create a separate `OptionsRegistry` for bundle options, but this would:
- Add unnecessary abstraction
- Not solve any actual problems
- Make the codebase more complex
- Duplicate patterns that already work well

The current implementation is correct and should be maintained.

## Conclusion

Bundle options should **NOT** be merged into the unified registry. The current design appropriately separates:
- Global enhancements (registry) from per-site configuration (bundle options)
- Executable code (features/scripts) from configuration metadata (options)
- System-wide settings from card-specific settings

This separation of concerns is architecturally sound and should be preserved.

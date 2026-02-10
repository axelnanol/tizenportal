/**
 * Spatial Navigation Library - TypeScript Definitions
 * @version 1.0.0
 */

export as namespace SpatialNavigation;

/**
 * Navigation mode
 */
export type NavigationMode = 'geometric' | 'directional';

/**
 * Navigation direction
 */
export type Direction = 'left' | 'right' | 'up' | 'down';

/**
 * Scroll behavior
 */
export type ScrollBehavior = 'scrollFirst' | 'focus';

/**
 * Fallback behavior
 */
export type FallbackBehavior = 'none' | 'nearest' | 'wrap';

/**
 * Configuration options
 */
export interface Config {
  /**
   * Navigation mode: "geometric" or "directional"
   * @default 'geometric'
   */
  mode?: NavigationMode;
  
  /**
   * Cone angle in degrees for directional mode (±angle)
   * @default 30
   */
  coneAngle?: number;
  
  /**
   * Weight for primary axis distance in directional mode
   * @default 1
   */
  primaryWeight?: number;
  
  /**
   * Weight for secondary axis offset in directional mode
   * @default 0.5
   */
  secondaryWeight?: number;
  
  /**
   * Apply bonus for perpendicular axis overlap in directional mode
   * @default true
   */
  overlapBonus?: boolean;
  
  /**
   * Weight for overlap bonus in directional mode
   * @default 5
   */
  overlapWeight?: number;
  
  /**
   * Prefer staying aligned in rows/columns in directional mode
   * @default true
   */
  rowColumnBias?: boolean;
  
  /**
   * Weight for row/column alignment in directional mode
   * @default 5
   */
  alignmentWeight?: number;
  
  /**
   * Scroll behavior in directional mode
   * @default 'focus'
   */
  scrollBehavior?: ScrollBehavior;
  
  /**
   * Fallback behavior when no candidates found in directional mode
   * @default 'none'
   */
  fallback?: FallbackBehavior;
  
  /**
   * Orthogonal weight for left/right navigation in geometric mode
   * @default 30
   */
  orthogonalWeightLR?: number;
  
  /**
   * Orthogonal weight for up/down navigation in geometric mode
   * @default 2
   */
  orthogonalWeightUD?: number;
}

/**
 * Navigation options
 */
export interface NavigationOptions {
  /**
   * Container element to search within
   * @default document.body
   */
  container?: Element;
  
  /**
   * Specific candidate elements to consider
   * If not provided, all focusable elements in container will be used
   */
  candidates?: Element[];
}

/**
 * Rectangle with center point
 */
export interface Rect {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/**
 * Configure the spatial navigation system
 * @param options - Configuration options
 * @returns Current configuration
 * @throws {TypeError} If options is not an object or contains invalid types
 * @throws {Error} If mode, scrollBehavior, or fallback values are invalid
 */
export function configure(options: Config): Config;

/**
 * Get current configuration
 * @returns Current configuration (copy)
 */
export function getConfig(): Config;

/**
 * Reset configuration to defaults
 */
export function resetConfig(): void;

/**
 * Navigate from current focused element in the given direction
 * @param direction - Navigation direction
 * @param options - Optional navigation parameters
 * @returns True if navigation succeeded, false otherwise
 */
export function navigate(direction: Direction, options?: NavigationOptions): boolean;

/**
 * Find the next focusable element in the given direction
 * @param origin - Origin element (currently focused)
 * @param direction - Navigation direction
 * @param options - Optional navigation parameters
 * @returns Next element to focus, or null if none found
 * @throws {Error} If origin or direction are missing or invalid
 */
export function findNextFocusable(
  origin: Element,
  direction: Direction,
  options?: NavigationOptions
): Element | null;

/**
 * Find first focusable element in container
 * @param container - Container element
 * @returns First focusable element or null
 */
export function findFirstFocusable(container?: Element): Element | null;

/**
 * Utility functions (exposed for testing and extension)
 */
export namespace utils {
  /**
   * Get normalized bounding rectangle for an element
   * @param element - DOM element
   * @returns Normalized rect with center point
   */
  export function getRect(element: Element): Rect;
  
  /**
   * Check if an element is visible
   * @param element - DOM element
   * @returns True if visible
   */
  export function isVisible(element: Element): boolean;
  
  /**
   * Check if an element is focusable
   * @param element - DOM element
   * @returns True if focusable
   */
  export function isFocusable(element: Element): boolean;
  
  /**
   * Filter candidates using geometric (axis-aligned) filtering
   * @param origin - Origin element
   * @param candidates - Candidate elements
   * @param direction - Navigation direction
   * @returns Filtered candidates
   */
  export function filterByDirectionGeometric(
    origin: Element,
    candidates: Element[],
    direction: Direction
  ): Element[];
  
  /**
   * Filter candidates using cone-based filtering
   * @param origin - Origin element
   * @param candidates - Candidate elements
   * @param direction - Navigation direction
   * @returns Filtered candidates
   */
  export function filterByDirectionCone(
    origin: Element,
    candidates: Element[],
    direction: Direction
  ): Element[];
  
  /**
   * Calculate geometric distance score
   * @param origin - Origin element
   * @param candidate - Candidate element
   * @param direction - Navigation direction
   * @returns Distance score (lower is better)
   */
  export function scoreGeometric(
    origin: Element,
    candidate: Element,
    direction: Direction
  ): number;
  
  /**
   * Calculate directional distance score
   * @param origin - Origin element
   * @param candidate - Candidate element
   * @param direction - Navigation direction
   * @returns Distance score (lower is better)
   */
  export function scoreDirectional(
    origin: Element,
    candidate: Element,
    direction: Direction
  ): number;
  
  /**
   * Apply fallback strategy when no candidates found
   * @param origin - Origin element
   * @param allCandidates - All available candidates
   * @param direction - Navigation direction
   * @returns Best fallback candidate or null
   */
  export function applyFallback(
    origin: Element,
    allCandidates: Element[],
    direction: Direction
  ): Element | null;
}

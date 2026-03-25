/**
 * Design system class constants - single source of truth
 * Import these instead of writing class strings inline.
 */

// -- Cards ------------------------------------------------------------------
export const CARD = 'bg-white rounded-xl shadow-sm border border-gray-200 p-5'
export const CARD_COMPACT = 'bg-white rounded-xl shadow-sm border border-gray-200 p-4'
export const CARD_MODAL = 'bg-white rounded-2xl shadow-xl p-6'
export const CARD_FLOATING = 'bg-white rounded-xl shadow-lg border border-gray-200 p-4'
export const CARD_STICKY_ACTION = 'bg-white rounded-xl shadow-md border border-gray-200 p-5 sticky bottom-0 z-10 sm:relative sm:shadow-sm'

// -- Buttons ----------------------------------------------------------------
const BTN_BASE = 'font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[44px]'

export const BTN_PRIMARY = `bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white ${BTN_BASE} focus:ring-blue-500 py-3 px-5`
export const BTN_SECONDARY = `bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-700 ${BTN_BASE} focus:ring-gray-400 py-3 px-5`
export const BTN_DANGER = `bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white ${BTN_BASE} focus:ring-red-500 py-3 px-5`
export const BTN_SUCCESS = `bg-green-600 hover:bg-green-700 text-white ${BTN_BASE} focus:ring-green-500 py-3 px-5`

export const BTN_SM_PRIMARY = `bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] px-4 py-2.5`
export const BTN_SM_SECONDARY = `bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 min-h-[44px] px-4 py-2.5`

export const BTN_GHOST = 'text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-lg'

// Tool-size large buttons (stopwatch etc) - add color classes when using
export const BTN_TOOL = 'flex-1 font-semibold py-4 px-6 rounded-xl text-lg transition-colors min-h-[56px] focus:outline-none focus:ring-2 focus:ring-offset-2'

// -- Typography -------------------------------------------------------------
export const TEXT_TITLE = 'text-xl font-bold text-gray-900 mb-4'
export const TEXT_CARD_TITLE = 'text-base font-semibold text-gray-900'
export const TEXT_SECTION_TITLE = 'text-sm font-semibold text-gray-700'
export const TEXT_LABEL = 'block text-sm font-medium text-gray-700 mb-2'
export const TEXT_HELP = 'text-xs text-gray-500'

// -- Inputs -----------------------------------------------------------------
export const INPUT = 'w-full px-4 py-2.5 min-h-[44px] border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400'
export const INPUT_ERROR = 'border-red-400 focus:ring-red-500 focus:border-red-500'
export const SELECT = 'w-full px-4 py-2.5 min-h-[44px] border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'

// -- Badges -----------------------------------------------------------------
const BADGE_BASE = 'inline-flex items-center rounded-md text-xs font-semibold'

export const BADGE_PASS = `${BADGE_BASE} px-2.5 py-1 rounded-lg font-bold bg-green-600 text-white`
export const BADGE_FAIL = `${BADGE_BASE} px-2.5 py-1 rounded-lg font-bold bg-red-600 text-white`
export const BADGE_PASS_LIGHT = `${BADGE_BASE} px-2 py-0.5 bg-green-100 text-green-800`
export const BADGE_FAIL_LIGHT = `${BADGE_BASE} px-2 py-0.5 bg-red-100 text-red-800`
export const BADGE_WARNING = `${BADGE_BASE} px-2 py-0.5 bg-amber-100 text-amber-800`
export const BADGE_INFO = `${BADGE_BASE} px-2 py-0.5 bg-blue-100 text-blue-800`
export const BADGE_NEUTRAL = `${BADGE_BASE} px-2 py-0.5 bg-gray-100 text-gray-600`

// -- Alerts/Banners ---------------------------------------------------------
const ALERT_BASE = 'p-4 rounded-xl text-sm'

export const ALERT_SUCCESS = `${ALERT_BASE} bg-green-50 border border-green-200 text-green-800`
export const ALERT_ERROR = `${ALERT_BASE} bg-red-50 border border-red-200 text-red-800`
export const ALERT_WARNING = `${ALERT_BASE} bg-amber-50 border border-amber-200 text-amber-800`
export const ALERT_INFO = `${ALERT_BASE} bg-blue-50 border border-blue-200 text-blue-800`

// -- Layout -----------------------------------------------------------------
export const TAB_CONTENT_SPACING = 'space-y-6'

// -- Timing Constants -------------------------------------------------------
export const TOAST_AUTO_DISMISS_MS = 5000
export const SUCCESS_MESSAGE_CLEAR_MS = 2000
export const NOTIFICATION_DURATION_MS = 3000
export const UNDO_DELETE_TIMEOUT_MS = 60000
export const DRAFT_DEBOUNCE_MS = 500

// -- Validation Ranges ------------------------------------------------------
export const USAF_MIN_AGE = 17
export const USAF_MAX_AGE = 65
export const MIN_HEIGHT_INCHES = 48
export const MAX_HEIGHT_INCHES = 84
export const MIN_WAIST_INCHES = 20
export const MAX_WAIST_INCHES = 55
export const MAX_RUN_TIME_SECONDS = 7200
export const MAX_PLANK_TIME_SECONDS = 600
export const MAX_REP_COUNT = 300
export const HIGH_REP_WARNING_THRESHOLD = 200

// -- Chart Colors (hex required for SVG/Recharts) ---------------------------
export const CHART_COLORS = {
  cardio: '#3b82f6',
  strength: '#10b981',
  core: '#f59e0b',
  bodyComp: '#8b5cf6',
  composite: '#6366f1',
  projected: '#f59e0b',
  passing: '#ef4444',
  practice: '#9ca3af',
  mockTest: '#f97316',
  fractionalTest: '#8b5cf6',
  milestone: '#fbbf24',
  gridLine: '#f0f0f0',
  gridLineDark: '#334155',
  tickText: '#6b7280',
  tickTextDark: '#94a3b8',
  passDot: '#16a34a',
  failDot: '#dc2626',
}

// -- Component Semantic Colors (border accents) -----------------------------
export const COMP_BORDER_COLORS = {
  cardio: 'border-blue-400',
  strength: 'border-green-400',
  core: 'border-amber-400',
  bodyComp: 'border-purple-400',
}

// -- Shared Label Maps (single source of truth) -----------------------------
// Keys match EXERCISES enum values from utils/scoring/constants.js
export const EXERCISE_LABEL_MAP = {
  '2mile_run': '2-Mile Run',
  hamr: 'HAMR Shuttle',
  '2km_walk': '2km Walk',
  pushups: 'Push-ups',
  hrpu: 'Hand-Release Push-ups',
  situps: 'Sit-ups',
  clrc: 'Reverse Crunches',
  plank: 'Forearm Plank',
  whtr: 'Waist-to-Height Ratio',
}

// Keys match COMPONENTS enum values from utils/scoring/constants.js
export const COMPONENT_LABEL_MAP = {
  cardio: 'Cardio',
  strength: 'Strength',
  core: 'Core',
  bodyComp: 'Body Comp (WHtR)',
}

export const COMPONENT_ORDER = ['cardio', 'strength', 'core', 'bodyComp']

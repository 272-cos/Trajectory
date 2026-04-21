/**
 * ExercisePreferencePicker - Unified PFA event preference selector.
 *
 * Shared by PlanTab and ProjectTab. Displays four component categories
 * (Cardio, Strength, Core, Body Comp) with toggle-style pill buttons.
 * Body Comp always shows WHtR as the only option (non-interactive).
 *
 * Props:
 *   pfaPreferences      - { upperBody, core, cardio } from AppContext
 *   updatePfaPreferences - (prefs) => void from AppContext
 *   compact             - boolean; when true, uses smaller label width
 */

import { UPPER_BODY, CORE, CARDIO } from '../../utils/training/exercisePreferences.js'

export default function ExercisePreferencePicker({ pfaPreferences, updatePfaPreferences, compact = false }) {
  const labelWidth = compact ? 'w-16' : 'w-20'

  const categories = [
    {
      label: 'Cardio',
      options: [
        { value: CARDIO.RUN,  short: 'Dist. Run' },
        { value: CARDIO.HAMR, short: 'HAMR' },
        { value: CARDIO.WALK, short: '2km Walk' },
      ],
      current:  pfaPreferences?.cardio    || CARDIO.RUN,
      onChange: (v) => updatePfaPreferences({ ...pfaPreferences, cardio: v }),
    },
    {
      label: 'Strength',
      options: [
        { value: UPPER_BODY.PUSHUPS, short: 'Push-ups' },
        { value: UPPER_BODY.HRPU,    short: 'Hand-Release' },
      ],
      current:  pfaPreferences?.upperBody || UPPER_BODY.PUSHUPS,
      onChange: (v) => updatePfaPreferences({ ...pfaPreferences, upperBody: v }),
    },
    {
      label: 'Core',
      options: [
        { value: CORE.SITUPS, short: 'Sit-ups' },
        { value: CORE.CLRC,   short: 'Rev. Crunches' },
        { value: CORE.PLANK,  short: 'Plank' },
      ],
      current:  pfaPreferences?.core      || CORE.SITUPS,
      onChange: (v) => updatePfaPreferences({ ...pfaPreferences, core: v }),
    },
  ]

  return (
    <div className="space-y-1.5">
      {categories.map(({ label, options, current, onChange }) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`text-xs text-gray-500 ${labelWidth} shrink-0`}>{label}</div>
          <div className="flex gap-1 flex-1 flex-wrap">
            {options.map(({ value, short }) => (
              <button
                key={value}
                type="button"
                onClick={() => onChange(value)}
                aria-pressed={current === value}
                className={[
                  'flex-1 py-1 rounded text-xs font-semibold transition-colors border',
                  current === value
                    ? 'bg-blue-600 border-blue-700 text-white'
                    : 'bg-white border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600',
                ].join(' ')}
              >
                {short}
              </button>
            ))}
          </div>
        </div>
      ))}
      {/* Body Comp: WHtR is the only option - display only */}
      <div className="flex items-center gap-2">
        <div className={`text-xs text-gray-500 ${labelWidth} shrink-0`}>Body Comp</div>
        <div className="flex gap-1 flex-1">
          <div className="flex-1 py-1 rounded text-xs font-semibold border bg-blue-600 border-blue-700 text-white text-center select-none">
            WHtR
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * ExercisePreferencePicker - shared single-select picker for PFA event preferences.
 *
 * Canonical visual style matches PlanTab's preference panel (PillGroup rows).
 * Reads and writes pfaPreferences via AppContext - single source of truth.
 *
 * Used by PlanTab and ProjectTab.
 */

import { useApp } from '../../context/AppContext.jsx'
import PillGroup from './PillGroup.jsx'
import {
  UPPER_BODY,
  CORE,
  CARDIO,
} from '../../utils/training/exercisePreferences.js'

export default function ExercisePreferencePicker({ className = '' }) {
  const { pfaPreferences, updatePfaPreferences } = useApp()

  const prefs = pfaPreferences ?? {}

  return (
    <div className={className}>
      <PillGroup
        label="Upper Body"
        value={prefs.upperBody ?? UPPER_BODY.PUSHUPS}
        onChange={(v) => updatePfaPreferences({ ...prefs, upperBody: v })}
        options={[
          { value: UPPER_BODY.PUSHUPS, label: 'Push-ups' },
          { value: UPPER_BODY.HRPU,    label: 'Hand-Release' },
        ]}
      />
      <PillGroup
        label="Core"
        value={prefs.core ?? CORE.SITUPS}
        onChange={(v) => updatePfaPreferences({ ...prefs, core: v })}
        options={[
          { value: CORE.SITUPS, label: 'Sit-ups' },
          { value: CORE.CLRC,   label: 'Rev. Crunch' },
          { value: CORE.PLANK,  label: 'Plank' },
        ]}
      />
      <PillGroup
        label="Cardio"
        value={prefs.cardio ?? CARDIO.RUN}
        onChange={(v) => updatePfaPreferences({ ...prefs, cardio: v })}
        options={[
          { value: CARDIO.RUN,  label: 'Dist. Run' },
          { value: CARDIO.HAMR, label: 'HAMR' },
          { value: CARDIO.WALK, label: '2km Walk' },
        ]}
      />
    </div>
  )
}

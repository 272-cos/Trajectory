/**
 * Tools Tab - Practice utilities for USAF PFA preparation
 * Sprint 8: 8.2 Stopwatch + Lap Timer (HAMR metronome, exercise comparison planned)
 */

import Stopwatch from '../tools/Stopwatch.jsx'

export default function ToolsTab() {
  return (
    <div
      role="tabpanel"
      id="tools-panel"
      aria-labelledby="tools-tab"
      className="space-y-4"
    >
      <Stopwatch />
    </div>
  )
}

/**
 * Tools Tab - Practice utilities for USAF PFA preparation
 * Sprint 8: 8.2 Stopwatch + Lap Timer, 8.3 HAMR Practice Metronome
 */

import Stopwatch from '../tools/Stopwatch.jsx'
import HamrMetronome from '../tools/HamrMetronome.jsx'

export default function ToolsTab() {
  return (
    <div
      role="tabpanel"
      id="tools-panel"
      aria-labelledby="tools-tab"
      className="space-y-4"
    >
      <HamrMetronome />
      <Stopwatch />
    </div>
  )
}

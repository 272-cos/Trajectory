/**
 * OvertrainingWarningModal - one-time blocking modal that fires the first time
 * the user selects more than 3 training days per week. Persists acknowledgement
 * in localStorage so it never appears again for that browser profile.
 */

export default function OvertrainingWarningModal({ onAcknowledge, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="overtraining-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
        <h2 id="overtraining-title" className="text-lg font-semibold text-gray-900">
          Training more than three days a week?
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Rest is integral to the plan. The biggest risk is injury forcing time off.
          Plan for at least one full rest day between hard sessions, and listen to
          your body - soreness that carries over to the next workout is a signal to
          back off, not push through.
        </p>
        <p className="text-xs text-gray-500 leading-relaxed">
          This message appears only once. You can keep training four or more days a
          week after acknowledging it.
        </p>
        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors min-h-[44px]"
          >
            Back to 3 days
          </button>
          <button
            type="button"
            onClick={onAcknowledge}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors min-h-[44px]"
          >
            I understand, continue
          </button>
        </div>
      </div>
    </div>
  )
}

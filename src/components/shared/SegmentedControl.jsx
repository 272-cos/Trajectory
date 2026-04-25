/**
 * SegmentedControl - connected segmented button strip for exclusive option selection.
 *
 * Visual style: outer border wraps all segments; segments are separated by inner dividers.
 * Use PillGroup for spaced pill buttons; use SegmentedControl for a unified selector strip.
 */

export default function SegmentedControl({ options, value, onChange, disabled = false, groupLabel }) {
  return (
    <div
      role="group"
      aria-label={groupLabel}
      className={`flex rounded-lg border overflow-hidden ${disabled ? 'border-gray-200' : 'border-gray-300'}`}
    >
      {options.map((opt, i) => {
        const isSelected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            aria-pressed={isSelected}
            onClick={() => !disabled && onChange(opt.value)}
            className={[
              'flex-1 py-2.5 px-2 text-sm font-medium transition-colors min-h-[44px]',
              'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500',
              i < options.length - 1 ? (disabled ? 'border-r border-gray-200' : 'border-r border-gray-300') : '',
              isSelected
                ? (disabled ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white')
                : (disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'),
            ].join(' ')}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

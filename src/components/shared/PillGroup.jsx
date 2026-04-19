/**
 * PillGroup - shared single-select segmented control.
 *
 * Canonical style mirrors PlanTab's PFA-event preference picker:
 * equal-flex buttons, rounded, blue-600 selected / white unselected,
 * with aria-pressed for accessibility.
 */

export default function PillGroup({
  label,
  options,
  value,
  onChange,
  ariaLabel,
  className = '',
}) {
  const group = (
    <div className={`flex gap-1 flex-1 ${className}`} role="radiogroup" aria-label={ariaLabel || label}>
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={selected}
            role="radio"
            aria-checked={selected}
            className={[
              'flex-1 py-1 rounded text-xs font-semibold transition-colors border min-h-[32px]',
              selected
                ? 'bg-blue-600 border-blue-700 text-white'
                : 'bg-white border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600',
            ].join(' ')}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )

  if (!label) return group

  return (
    <div className="flex items-center gap-2 mb-1.5">
      <div className="text-xs text-gray-500 w-20 shrink-0">{label}</div>
      {group}
    </div>
  )
}

/**
 * PillGroup - shared pill-selector component.
 *
 * Variants:
 *   single-select (default): value is scalar, onChange(newValue)
 *   multi-select (multi=true): value is array, onChange(newArray) - each click toggles membership
 *
 * activeColor: 'blue' (default) | 'amber' | 'green' | 'red'
 * options[].ariaLabel: optional per-button aria-label (useful for dynamic "Add/Remove X" labels)
 */

const ACTIVE_COLORS = {
  blue:  'bg-blue-600 border-blue-700 text-white',
  amber: 'bg-amber-400 border-amber-500 text-white',
  green: 'bg-green-500 border-green-600 text-white',
  red:   'bg-red-500 border-red-600 text-white',
}

export default function PillGroup({
  label,
  options,
  value,
  onChange,
  multi = false,
  activeColor = 'blue',
  ariaLabel,
  className = '',
}) {
  const activeClass = ACTIVE_COLORS[activeColor] ?? ACTIVE_COLORS.blue

  const isActive = (optValue) =>
    multi ? Array.isArray(value) && value.includes(optValue) : value === optValue

  const handleClick = (optValue) => {
    if (multi) {
      const arr = Array.isArray(value) ? value : []
      if (arr.includes(optValue)) {
        onChange(arr.filter(v => v !== optValue))
      } else {
        onChange([...arr, optValue])
      }
    } else {
      onChange(optValue)
    }
  }

  const group = (
    <div
      className={`flex gap-1 flex-1 ${className}`}
      role={multi ? 'group' : 'radiogroup'}
      aria-label={ariaLabel || label}
    >
      {options.map((opt) => {
        const selected = isActive(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleClick(opt.value)}
            aria-pressed={selected}
            role={multi ? 'button' : 'radio'}
            aria-checked={multi ? undefined : selected}
            aria-label={opt.ariaLabel}
            className={[
              'flex-1 py-1 rounded text-xs font-semibold transition-colors border min-h-[32px]',
              selected
                ? activeClass
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

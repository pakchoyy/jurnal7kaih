interface ProgressRingProps {
  /** 0..100 */
  value: number
  size?: number
  stroke?: number
  trackColor?: string
  color?: string
  label?: React.ReactNode
}

/**
 * Ring progress SVG. Default warna hijau (Brand Green) mengikuti mockup-v2.
 */
export function ProgressRing({
  value,
  size = 64,
  stroke = 7,
  trackColor = 'rgba(255,255,255,.25)',
  color = '#10B981',
  label,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
      </svg>
      {label != null && (
        <div className="absolute inset-0 flex items-center justify-center font-display font-black">
          {label}
        </div>
      )}
    </div>
  )
}

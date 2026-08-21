import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { cn } from '@/utils/cn'

function AnimatedNumber({ value }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => {
    if (typeof value === 'string') return value
    return Math.round(v).toLocaleString()
  })

  useEffect(() => {
    if (typeof value !== 'number') return
    const controls = animate(count, value, { duration: 1, ease: 'easeOut' })
    return controls.stop
  }, [value])

  if (typeof value === 'string') return <span>{value}</span>
  return <motion.span>{rounded}</motion.span>
}

export function MetricCard({ label, value, delta, deltaPositive, accent, note }) {
  const borderColor = {
    high:   'border-l-red-500',
    medium: 'border-l-amber-500',
    low:    'border-l-green-500',
    accent: 'border-l-[#00D4AA]',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'bg-[#111827] rounded-lg p-4 border border-[#2D3748] border-l-2',
        accent ? borderColor[accent] : 'border-l-[#2D3748]'
      )}
    >
      <p className="text-xs text-[#4B5563] uppercase tracking-widest font-medium mb-2">{label}</p>
      <p className="text-3xl font-semibold font-mono text-[#F7F9FC]">
        <AnimatedNumber value={value} />
      </p>
      {delta && (
        <p className={cn('text-xs mt-1.5', deltaPositive ? 'text-green-400' : 'text-red-400')}>
          {deltaPositive ? '↑' : '↓'} {delta} vs yesterday
        </p>
      )}
      {note && !delta && (
        <p className="text-xs mt-1.5 text-[#4B5563]">{note}</p>
      )}
    </motion.div>
  )
}

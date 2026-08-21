import { cn } from '@/utils/cn'

export function Badge({ children, className }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-[#2D3748] bg-[#1C2333] text-[#94A3B8]', className)}>
      {children}
    </span>
  )
}

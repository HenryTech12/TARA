import { cn } from '@/utils/cn'

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('bg-[#111827] border border-[#2D3748] rounded-lg', className)} {...props}>
      {children}
    </div>
  )
}

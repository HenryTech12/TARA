import { cn } from '@/utils/cn'
import { forwardRef } from 'react'

export const Input = forwardRef(({ className, label, error, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">{label}</label>}
    <input
      ref={ref}
      className={cn(
        'w-full bg-[#1C2333] border border-[#2D3748] rounded-md px-3 py-2 text-sm text-[#F7F9FC] font-mono',
        'placeholder:text-[#4B5563] focus:outline-none focus:border-[#00D4AA]/50 transition-colors',
        error && 'border-red-500/50',
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
))

Input.displayName = 'Input'

import { cn } from '@/utils/cn'

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse bg-[#1C2333] rounded', className)} />
}

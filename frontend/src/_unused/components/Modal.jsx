import { useEffect } from 'react'
import { cn } from '@/utils/cn'
import { XMarkIcon } from '@heroicons/react/24/outline'

export function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-[#1C2333] border border-[#2D3748] rounded-lg w-full shadow-2xl', sizes[size])}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2D3748]">
          <h3 className="text-sm font-semibold text-[#F7F9FC]">{title}</h3>
          <button onClick={onClose} className="p-1 rounded text-[#4B5563] hover:text-[#F7F9FC] hover:bg-[#2D3748] transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

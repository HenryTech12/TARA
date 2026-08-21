import { useToastStore } from '@/store/toastStore'
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'framer-motion'

const icons = {
  success: <CheckCircleIcon className="w-4 h-4 text-green-400 shrink-0" />,
  error: <ExclamationCircleIcon className="w-4 h-4 text-red-400 shrink-0" />,
  info: <InformationCircleIcon className="w-4 h-4 text-blue-400 shrink-0" />,
}

const borders = {
  success: 'border-green-500/30',
  error: 'border-red-500/30',
  info: 'border-blue-500/30',
}

export function Toaster() {
  const { toasts, remove } = useToastStore()

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex items-center gap-3 bg-[#1C2333] border ${borders[t.type]} rounded-lg px-4 py-3 shadow-xl min-w-64 max-w-sm`}
          >
            {icons[t.type]}
            <span className="text-sm text-[#F7F9FC] flex-1">{t.message}</span>
            <button onClick={() => remove(t.id)} className="text-[#4B5563] hover:text-[#F7F9FC] transition-colors">
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

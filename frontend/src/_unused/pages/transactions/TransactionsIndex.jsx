import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { TransactionList } from '@/components/entities/TransactionList'
import { IngestTransactionModal } from '@/components/transactions/IngestTransactionModal'
import { Button } from '@/components/ui/Button'
import { useRecentTransactions } from '@/hooks/useTransactions'
import { PlusIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

export default function TransactionsIndex() {
  const queryClient = useQueryClient()
  const { data: transactions, isLoading, isError } = useRecentTransactions(50)
  const [ingestOpen, setIngestOpen] = useState(false)

  const handleIngestSuccess = () => {
    setIngestOpen(false)
    // Refetch recent transactions after a short delay to allow job processing
    setTimeout(() => queryClient.invalidateQueries({ queryKey: ['transactions', 'recent'] }), 2000)
  }

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle={`${transactions?.length ?? 0} recent records`}
        actions={
          <Button variant="primary" onClick={() => setIngestOpen(true)}>
            <PlusIcon className="w-4 h-4" />
            Ingest Transaction
          </Button>
        }
      />

      <div className="bg-[#111827] border border-[#2D3748] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2D3748] flex items-center gap-2">
          <p className="text-xs text-[#4B5563] uppercase tracking-wider font-medium">Recent Transactions</p>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        </div>
        {isError ? (
          <div className="flex flex-col items-center py-16 gap-2">
            <ExclamationCircleIcon className="w-8 h-8 text-red-400" />
            <p className="text-sm text-red-400">Failed to load transactions</p>
          </div>
        ) : (
          <div className="p-2">
            <TransactionList transactions={transactions} isLoading={isLoading} showEntityLinks />
          </div>
        )}
      </div>

      <IngestTransactionModal
        open={ingestOpen}
        onClose={() => setIngestOpen(false)}
        onSuccess={handleIngestSuccess}
      />
    </div>
  )
}

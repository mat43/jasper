import { CurrencyDollarIcon } from '@heroicons/react/24/outline'

export default function YouOweCard({ youOwe, pendingSettlements, monthlyBudget = 500 }) {
    const numItems = pendingSettlements.length
    const categoriesOwed = Array.from(new Set(pendingSettlements.map(s => s.category)))
    const largestPending = numItems
        ? Math.max(...pendingSettlements.map(s => s.amount))
        : 0
    const owedPct = Math.min((youOwe / monthlyBudget) * 100, 100)
    const paidPct = 100 - owedPct

    return (
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-800">You Owe</h3>
                </div>
            </div>

            <p className="text-4xl font-bold text-gray-900">${youOwe.toFixed(2)}</p>

            <div className="flex flex-wrap gap-2">
                {categoriesOwed.map(cat => (
                    <span
                        key={cat}
                        className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full"
                    >
                        {cat}
                    </span>
                ))}
            </div>

            <div className="text-sm text-gray-600">
                {numItems} pending {numItems === 1 ? 'item' : 'items'}, largest ${largestPending}
            </div>

            <div className="w-full bg-green-200 rounded-full h-2 overflow-hidden">
                <div
                    className="h-2 bg-green-600 rounded-full transition-all duration-500"
                    style={{ width: `${paidPct}%` }}
                />
            </div>
        </div>
    )
}

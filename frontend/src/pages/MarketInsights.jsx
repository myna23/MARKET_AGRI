import { useEffect, useState } from 'react'
import { getMarketInsights } from '../services/api'
import { TrendingUp, Users, Package, BarChart2 } from 'lucide-react'

const EMOJI = { tomatoes: '🍅', peppers: '🌶️', garden_eggs: '🍆', okra: '🌿', leafy_greens: '🥬', onions: '🧅', yams: '🍠', maize: '🌽', millet: '🌾', rice: '🍚', other: '🌾' }

export default function MarketInsights() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMarketInsights().then(r => { setData(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-gray-400">Loading insights...</div>
  if (!data) return <div className="text-center py-20 text-red-400">Failed to load insights</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <BarChart2 size={28} className="text-green-600" /> Market Insights
        </h1>
        <p className="text-gray-500">Live price data and supply trends from Northern Ghana farmers</p>
      </div>

      {/* Platform stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-green-700">{data.total_farmers}</div>
          <div className="text-gray-500 text-sm flex items-center justify-center gap-1"><Users size={12} /> Farmers</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{data.total_buyers}</div>
          <div className="text-gray-500 text-sm flex items-center justify-center gap-1"><Users size={12} /> Buyers</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-orange-500">{data.total_listings}</div>
          <div className="text-gray-500 text-sm flex items-center justify-center gap-1"><Package size={12} /> Active Listings</div>
        </div>
      </div>

      {/* Price table */}
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <TrendingUp size={20} className="text-green-600" /> Current Prices by Category
      </h2>
      <div className="grid md:grid-cols-2 gap-4">
        {Object.entries(data.supply).map(([cat, info]) => (
          <div key={cat} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{EMOJI[cat] || '🌾'}</span>
              <div>
                <div className="font-bold text-gray-800 capitalize">{cat.replace('_', ' ')}</div>
                <div className="text-xs text-gray-400">{info.num_listings} listing{info.num_listings !== 1 ? 's' : ''}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="bg-green-50 rounded-lg p-2">
                <div className="font-bold text-green-700">GHS {info.avg_price_per_kg}</div>
                <div className="text-xs text-gray-400">Avg/kg</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-2">
                <div className="font-bold text-blue-600">GHS {info.min_price}</div>
                <div className="text-xs text-gray-400">Min/kg</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-2">
                <div className="font-bold text-orange-600">GHS {info.max_price}</div>
                <div className="text-xs text-gray-400">Max/kg</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-400 text-right">
              Total supply: {info.total_supply_kg.toFixed(0)} kg
            </div>
          </div>
        ))}
      </div>

      {/* Demand */}
      {Object.keys(data.demand).length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Order Demand by Category</h2>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="space-y-3">
              {Object.entries(data.demand).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                const max = Math.max(...Object.values(data.demand))
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-lg w-6">{EMOJI[cat] || '🌾'}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 capitalize">{cat.replace('_', ' ')}</span>
                        <span className="text-gray-500 font-medium">{count} orders</span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

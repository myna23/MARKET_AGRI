import { useState, useEffect } from 'react'
import { listProducts, getRecommendations } from '../services/api'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/ProductCard'
import { Search, Sparkles } from 'lucide-react'

const CATEGORIES = ['', 'tomatoes', 'peppers', 'garden_eggs', 'okra', 'leafy_greens', 'onions', 'yams', 'maize', 'millet', 'rice']

export default function Marketplace() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [tab, setTab] = useState('all')

  useEffect(() => {
    fetchProducts()
    if (user?.role === 'buyer' && user?.buyer_id) {
      fetchRecs(user.buyer_id)
    }
  }, [category, maxPrice, user])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = { available_only: true }
      if (category) params.category = category
      if (maxPrice) params.max_price = parseFloat(maxPrice)
      if (search) params.search = search
      const res = await listProducts(params)
      setProducts(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecs = async (buyer_id) => {
    try {
      const res = await getRecommendations(buyer_id, 8)
      setRecommendations(res.data)
    } catch (e) {}
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchProducts()
  }

  const displayed = tab === 'recommended' ? recommendations : products

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Produce Marketplace</h1>
        <p className="text-gray-500">Fresh vegetables from Northern Ghana farmers</p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-3 items-end">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search produce..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            <Search size={16} />
          </button>
        </form>
        <div className="flex gap-2 flex-wrap">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="">All categories</option>
            {CATEGORIES.filter(Boolean).map(c => (
              <option key={c} value={c}>{c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Max GHS/kg"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
      </div>

      {/* Tabs */}
      {user?.role === 'buyer' && recommendations.length > 0 && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('all')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition ${tab === 'all' ? 'bg-green-600 text-white' : 'bg-white border text-gray-600 hover:border-green-400'}`}
          >
            All Listings
          </button>
          <button
            onClick={() => setTab('recommended')}
            className={`px-5 py-2 rounded-full text-sm font-medium flex items-center gap-1 transition ${tab === 'recommended' ? 'bg-green-600 text-white' : 'bg-white border text-gray-600 hover:border-green-400'}`}
          >
            <Sparkles size={14} /> For You
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading produce...</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No produce found. Try adjusting your filters.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayed.map((p) => (
            <ProductCard key={p.id || p.product_id} product={p} showMatch={tab === 'recommended'} />
          ))}
        </div>
      )}
    </div>
  )
}

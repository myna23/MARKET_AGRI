import { useState, useEffect, useCallback } from 'react'
import { listProducts, getRecommendations } from '../services/api'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/ProductCard'
import { Search, Sparkles, MapPin, Loader } from 'lucide-react'

const CATEGORIES = ['', 'tomatoes', 'peppers', 'garden_eggs', 'okra', 'leafy_greens', 'onions', 'yams', 'maize', 'millet', 'rice']

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function Marketplace() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('default')
  const [tab, setTab] = useState('all')

  useEffect(() => {
    fetchProducts()
    if (user?.role === 'buyer' && user?.buyer_id) {
      getRecommendations(user.buyer_id, 8).then(r => setRecommendations(r.data)).catch(() => {})
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

  const getLocation = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setSortBy('distance')
        setLocating(false)
      },
      () => {
        alert('Could not get your location. Please allow location access.')
        setLocating(false)
      }
    )
  }

  const sortedProducts = useCallback(() => {
    let list = tab === 'recommended' ? recommendations : products
    if (sortBy === 'distance' && userLocation) {
      return [...list].sort((a, b) => {
        const fa = a.farmer, fb = b.farmer
        if (!fa?.latitude || !fb?.latitude) return 0
        const da = haversineKm(userLocation.lat, userLocation.lon, fa.latitude, fa.longitude)
        const db2 = haversineKm(userLocation.lat, userLocation.lon, fb.latitude, fb.longitude)
        return da - db2
      })
    }
    if (sortBy === 'price_asc') return [...list].sort((a, b) => a.price_per_kg - b.price_per_kg)
    if (sortBy === 'price_desc') return [...list].sort((a, b) => b.price_per_kg - a.price_per_kg)
    return list
  }, [products, recommendations, tab, sortBy, userLocation])

  const getDistanceLabel = (product) => {
    if (!userLocation || !product.farmer?.latitude) return null
    const d = haversineKm(userLocation.lat, userLocation.lon, product.farmer.latitude, product.farmer.longitude)
    return d < 1 ? `<1 km` : `${d.toFixed(1)} km`
  }

  const displayed = sortedProducts()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Produce Marketplace</h1>
        <p className="text-gray-500 text-sm">Fresh vegetables from Northern Ghana farmers</p>
      </div>

      {/* Search & Filter bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-end">
        <form onSubmit={(e) => { e.preventDefault(); fetchProducts() }} className="flex gap-2 flex-1 min-w-48">
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
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
          <option value="">All categories</option>
          {CATEGORIES.filter(Boolean).map(c => (
            <option key={c} value={c}>{c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
          ))}
        </select>
        <input type="number" placeholder="Max GHS/kg" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
          className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
          <option value="default">Sort: Default</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          {userLocation && <option value="distance">Nearest First</option>}
        </select>
        <button onClick={getLocation} disabled={locating}
          className="flex items-center gap-2 border border-green-500 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50 disabled:opacity-50">
          {locating ? <Loader size={14} className="animate-spin" /> : <MapPin size={14} />}
          {userLocation ? 'Location on' : 'Sort by distance'}
        </button>
      </div>

      {userLocation && (
        <div className="text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg mb-4 inline-flex items-center gap-1">
          <MapPin size={12} /> Using your location — distances shown on each product
        </div>
      )}

      {/* Tabs */}
      {user?.role === 'buyer' && recommendations.length > 0 && (
        <div className="flex gap-2 mb-5">
          <button onClick={() => setTab('all')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition ${tab === 'all' ? 'bg-green-600 text-white' : 'bg-white border text-gray-600 hover:border-green-400'}`}>
            All Listings ({products.length})
          </button>
          <button onClick={() => setTab('recommended')}
            className={`px-5 py-2 rounded-full text-sm font-medium flex items-center gap-1 transition ${tab === 'recommended' ? 'bg-green-600 text-white' : 'bg-white border text-gray-600 hover:border-green-400'}`}>
            <Sparkles size={14} /> For You ({recommendations.length})
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading produce...</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No produce found.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayed.map((p) => (
            <ProductCard
              key={p.id || p.product_id}
              product={p}
              showMatch={tab === 'recommended'}
              distanceLabel={getDistanceLabel(p)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

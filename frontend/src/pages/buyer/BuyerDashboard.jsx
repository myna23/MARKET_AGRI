import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { getBuyerOrders, getRecommendations } from '../../services/api'
import { ShoppingCart, Sparkles } from 'lucide-react'
import ProductCard from '../../components/ProductCard'

const STATUS_COLOR = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-orange-100 text-orange-600',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
}

export default function BuyerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'buyer') { navigate('/login'); return }
    Promise.all([
      getBuyerOrders(user.buyer_id).then(r => setOrders(r.data)),
      getRecommendations(user.buyer_id, 6).then(r => setRecs(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [user])

  const totalSpent = orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + o.total_price, 0)

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {user.name} 🛒</h1>
        <p className="text-gray-500 text-sm">Track your orders and discover fresh produce</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
          <div className="text-gray-500 text-sm">Total Orders</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-green-700">GHS {totalSpent.toFixed(0)}</div>
          <div className="text-gray-500 text-sm">Total Spent</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm col-span-2 md:col-span-1">
          <Link to="/marketplace" className="block bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700">
            Browse Marketplace
          </Link>
        </div>
      </div>

      {/* Recommendations */}
      {recs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-yellow-500" /> Recommended for You
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {recs.map(p => <ProductCard key={p.product_id} product={{ ...p, id: p.product_id }} showMatch />)}
          </div>
        </div>
      )}

      {/* Orders */}
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <ShoppingCart size={18} /> My Orders
      </h2>
      {orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
          No orders yet. <Link to="/marketplace" className="text-green-600 font-semibold hover:underline">Browse the marketplace</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-gray-800">Order #{o.id}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{o.quantity_kg}kg · GHS {o.total_price}</div>
                  {o.delivery_address && <div className="text-xs text-gray-400 mt-1">📍 {o.delivery_address}</div>}
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[o.status] || 'bg-gray-100 text-gray-600'}`}>
                    {o.status}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${o.payment_status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                    {o.payment_status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

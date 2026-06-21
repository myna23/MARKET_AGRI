import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getFarmerProducts, getFarmerOrders, updateProduct, createProduct, updateOrderStatus, getFarmerReviews } from '../../services/api'
import { Plus, Package, ShoppingCart, ToggleLeft, ToggleRight, Star, MessageSquare } from 'lucide-react'
import StarRating from '../../components/StarRating'
import toast from 'react-hot-toast'

const CATEGORIES = ['tomatoes', 'peppers', 'garden_eggs', 'okra', 'leafy_greens', 'onions', 'yams', 'maize', 'millet', 'rice', 'other']
const EMOJI = { tomatoes:'🍅', peppers:'🌶️', garden_eggs:'🍆', okra:'🌿', leafy_greens:'🥬', onions:'🧅', yams:'🍠', maize:'🌽', millet:'🌾', rice:'🍚', other:'🌾' }

const STATUS_COLOR = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-orange-100 text-orange-600',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
}

export default function FarmerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [reviews, setReviews] = useState([])
  const [tab, setTab] = useState('products')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', category: 'tomatoes', quantity_kg: '', price_per_kg: '', min_order_kg: 1, description: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'farmer') { navigate('/login'); return }
    Promise.all([
      getFarmerProducts(user.farmer_id).then(r => setProducts(r.data)),
      getFarmerOrders(user.farmer_id).then(r => setOrders(r.data)),
      getFarmerReviews(user.farmer_id).then(r => setReviews(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [user])

  const toggleAvailability = async (p) => {
    try {
      await updateProduct(p.id, user.farmer_id, { is_available: !p.is_available })
      setProducts(prods => prods.map(x => x.id === p.id ? { ...x, is_available: !x.is_available } : x))
    } catch { toast.error('Update failed') }
  }

  const advanceOrderStatus = async (order) => {
    const flow = { pending: 'confirmed', confirmed: 'in_transit', in_transit: 'delivered' }
    const next = flow[order.status]
    if (!next) return
    try {
      await updateOrderStatus(order.id, next)
      setOrders(os => os.map(o => o.id === order.id ? { ...o, status: next } : o))
      toast.success(`Order marked as "${next.replace('_', ' ')}"`)
    } catch { toast.error('Status update failed') }
  }

  const setNew = (k) => (e) => setNewProduct(f => ({ ...f, [k]: e.target.value }))

  const handleAddProduct = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...newProduct, quantity_kg: parseFloat(newProduct.quantity_kg), price_per_kg: parseFloat(newProduct.price_per_kg), min_order_kg: parseFloat(newProduct.min_order_kg) }
      const res = await createProduct(user.farmer_id, payload)
      setProducts(p => [...p, res.data])
      setShowAddForm(false)
      setNewProduct({ name: '', category: 'tomatoes', quantity_kg: '', price_per_kg: '', min_order_kg: 1, description: '' })
      toast.success('Produce listed!')
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to list produce') }
  }

  const totalRevenue = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.total_price, 0)
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome, {user.name} 👨‍🌾</h1>
          <p className="text-gray-500 text-sm flex items-center gap-2">
            Manage your produce and orders
            {avgRating && (
              <span className="inline-flex items-center gap-1 text-yellow-600 font-semibold">
                <Star size={13} fill="currentColor" /> {avgRating} ({reviews.length} reviews)
              </span>
            )}
          </p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-700">
          <Plus size={18} /> Add Produce
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-green-700">{products.length}</div>
          <div className="text-gray-500 text-sm">Listings</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
          <div className="text-gray-500 text-sm">Orders</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-orange-500">GHS {totalRevenue.toFixed(0)}</div>
          <div className="text-gray-500 text-sm">Revenue</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-yellow-500 flex items-center justify-center gap-1">
            {avgRating || '—'} <Star size={18} fill={avgRating ? 'currentColor' : 'none'} />
          </div>
          <div className="text-gray-500 text-sm">Rating</div>
        </div>
      </div>

      {/* Add product form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-green-200 p-5 mb-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">List New Produce</h2>
          <form onSubmit={handleAddProduct} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Produce Name *</label>
              <input required value={newProduct.name} onChange={setNew('name')} placeholder="e.g. Fresh Tomatoes" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Category *</label>
              <select value={newProduct.category} onChange={setNew('category')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Quantity (kg) *</label>
              <input required type="number" step="0.5" value={newProduct.quantity_kg} onChange={setNew('quantity_kg')} placeholder="e.g. 200" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Price per kg (GHS) *</label>
              <input required type="number" step="0.5" value={newProduct.price_per_kg} onChange={setNew('price_per_kg')} placeholder="e.g. 6.50" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Min Order (kg)</label>
              <input type="number" step="0.5" value={newProduct.min_order_kg} onChange={setNew('min_order_kg')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Description</label>
              <textarea value={newProduct.description} onChange={setNew('description')} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 text-sm">List Produce</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="border border-gray-200 px-6 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* SMS Update Panel */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 font-bold text-amber-800 mb-2">
          <MessageSquare size={18} /> Update Listings by SMS (No Internet Needed)
        </div>
        <p className="text-sm text-amber-700 mb-3">Text these commands to <span className="font-bold">+233 XX XXX XXXX</span> from your registered phone:</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-amber-800">
          <code className="bg-amber-100 px-3 py-2 rounded-lg">LIST — see all your products</code>
          <code className="bg-amber-100 px-3 py-2 rounded-lg">STATUS — account summary</code>
          <code className="bg-amber-100 px-3 py-2 rounded-lg">ADD tomatoes 200 6.5</code>
          <code className="bg-amber-100 px-3 py-2 rounded-lg">UPDATE 3 150 7.0</code>
          <code className="bg-amber-100 px-3 py-2 rounded-lg">SOLD 3 — mark product sold</code>
        </div>
        <p className="text-xs text-amber-600 mt-2">Format: ADD [crop name] [qty in kg] [price per kg in GHS]</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setTab('products')} className={`px-5 py-2 rounded-full text-sm font-medium ${tab === 'products' ? 'bg-green-600 text-white' : 'bg-white border text-gray-600'}`}>
          <Package size={14} className="inline mr-1" /> My Listings ({products.length})
        </button>
        <button onClick={() => setTab('orders')} className={`px-5 py-2 rounded-full text-sm font-medium ${tab === 'orders' ? 'bg-green-600 text-white' : 'bg-white border text-gray-600'}`}>
          <ShoppingCart size={14} className="inline mr-1" /> Orders ({orders.length})
        </button>
        <button onClick={() => setTab('reviews')} className={`px-5 py-2 rounded-full text-sm font-medium ${tab === 'reviews' ? 'bg-yellow-500 text-white' : 'bg-white border text-gray-600'}`}>
          <Star size={14} className="inline mr-1" /> Reviews ({reviews.length})
        </button>
      </div>

      {tab === 'products' && (
        <div className="space-y-3">
          {products.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
              No listings yet. Add your first produce!
            </div>
          ) : products.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{EMOJI[p.category] || '🌾'}</span>
                <div>
                  <div className="font-semibold text-gray-800">{p.name}</div>
                  <div className="text-xs text-gray-400">{p.quantity_kg}kg · GHS {p.price_per_kg}/kg</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                  {p.is_available ? 'Available' : 'Unavailable'}
                </span>
                <button onClick={() => toggleAvailability(p)} className="text-gray-400 hover:text-green-600">
                  {p.is_available ? <ToggleRight size={24} className="text-green-500" /> : <ToggleLeft size={24} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">No orders yet.</div>
          ) : orders.map(o => (
            <div key={o.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-gray-800">{o.product_name} — {o.quantity_kg}kg</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Buyer: {o.buyer_name || '—'} {o.buyer_phone && <a href={`tel:${o.buyer_phone}`} className="text-green-600 hover:underline ml-1">📞 {o.buyer_phone}</a>}
                  </div>
                  {o.delivery_address && <div className="text-xs text-gray-400 mt-0.5">📍 {o.delivery_address}</div>}
                  {o.payment_method && <div className="text-xs text-gray-400 mt-0.5">{o.payment_method === 'momo' ? '📱 MoMo' : o.payment_method === 'card' ? '💳 Card' : '💵 Cash'}</div>}
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="font-bold text-green-700">GHS {o.total_price}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[o.status] || 'bg-gray-100 text-gray-600'}`}>
                    {o.status?.replace('_', ' ')}
                  </span>
                  {o.status !== 'delivered' && o.status !== 'cancelled' && (
                    <button onClick={() => advanceOrderStatus(o)}
                      className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700 mt-1">
                      {o.status === 'pending' ? 'Confirm' : o.status === 'confirmed' ? 'Mark In Transit' : 'Mark Delivered'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'reviews' && (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
              No reviews yet. Complete orders to receive ratings from buyers.
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
                <div className="text-5xl font-bold text-yellow-500">{avgRating}</div>
                <div>
                  <StarRating value={Math.round(parseFloat(avgRating))} size={24} />
                  <div className="text-sm text-gray-500 mt-1">{reviews.length} buyer {reviews.length === 1 ? 'review' : 'reviews'}</div>
                </div>
              </div>
              {reviews.map((r, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <StarRating value={r.rating} size={16} />
                    <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('en-GB')}</span>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600 mt-2 italic">"{r.comment}"</p>}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

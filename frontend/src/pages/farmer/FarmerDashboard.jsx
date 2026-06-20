import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { getFarmerProducts, getFarmerOrders, updateProduct, createProduct } from '../../services/api'
import { Plus, Package, ShoppingCart, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = ['tomatoes', 'peppers', 'garden_eggs', 'okra', 'leafy_greens', 'onions', 'yams', 'maize', 'other']

export default function FarmerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [tab, setTab] = useState('products')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', category: 'tomatoes', quantity_kg: '', price_per_kg: '', min_order_kg: 1, description: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'farmer') { navigate('/login'); return }
    Promise.all([
      getFarmerProducts(user.farmer_id).then(r => setProducts(r.data)),
      getFarmerOrders(user.farmer_id).then(r => setOrders(r.data)),
    ]).finally(() => setLoading(false))
  }, [user])

  const toggleAvailability = async (p) => {
    try {
      await updateProduct(p.id, user.farmer_id, { is_available: !p.is_available })
      setProducts(prods => prods.map(x => x.id === p.id ? { ...x, is_available: !x.is_available } : x))
    } catch (e) { toast.error('Update failed') }
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

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome, {user.name} 👨‍🌾</h1>
          <p className="text-gray-500 text-sm">Manage your produce and orders</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-700">
          <Plus size={18} /> Add Produce
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
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

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('products')} className={`px-5 py-2 rounded-full text-sm font-medium ${tab === 'products' ? 'bg-green-600 text-white' : 'bg-white border text-gray-600'}`}>
          <Package size={14} className="inline mr-1" /> My Listings ({products.length})
        </button>
        <button onClick={() => setTab('orders')} className={`px-5 py-2 rounded-full text-sm font-medium ${tab === 'orders' ? 'bg-green-600 text-white' : 'bg-white border text-gray-600'}`}>
          <ShoppingCart size={14} className="inline mr-1" /> Orders ({orders.length})
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
                <span className="text-2xl">{p.category === 'tomatoes' ? '🍅' : p.category === 'peppers' ? '🌶️' : '🌿'}</span>
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
                  <div className="text-sm text-gray-500 mt-1">To: {o.delivery_address || 'Buyer location'}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-700">GHS {o.total_price}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.status === 'delivered' ? 'bg-green-100 text-green-700' : o.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {o.status}
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

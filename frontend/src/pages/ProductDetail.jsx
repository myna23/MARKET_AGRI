import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProduct, createOrder, simulatePayment, getSimilarProducts, createTransportRequest, matchTransportProvider } from '../services/api'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/ProductCard'
import { MapPin, Star, Phone, Package, Truck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProductDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [similar, setSimilar] = useState([])
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [showTransport, setShowTransport] = useState(false)

  useEffect(() => {
    getProduct(id).then(r => {
      setProduct(r.data)
      setQty(r.data.min_order_kg)
      setLoading(false)
    })
    getSimilarProducts(id).then(r => setSimilar(r.data)).catch(() => {})
  }, [id])

  const handleOrder = async () => {
    if (!user || user.role !== 'buyer') {
      toast.error('Please login as a buyer to place orders')
      navigate('/login')
      return
    }
    setOrdering(true)
    try {
      const orderRes = await createOrder(user.buyer_id, {
        product_id: product.id,
        quantity_kg: qty,
        delivery_address: deliveryAddress || product.farmer?.village,
      })
      const order = orderRes.data
      toast.success('Order placed! Processing payment...')
      await simulatePayment(order.id)
      toast.success('Payment confirmed via MTN MoMo!')
      if (showTransport) {
        const reqRes = await createTransportRequest({
          pickup_address: `${product.farmer?.village}, ${product.farmer?.district}`,
          pickup_latitude: product.farmer?.latitude,
          pickup_longitude: product.farmer?.longitude,
          dropoff_address: deliveryAddress || 'Buyer location',
          cargo_description: `${product.name} - ${qty}kg`,
          cargo_weight_kg: qty,
        }, null, user.buyer_id)
        const matchRes = await matchTransportProvider(reqRes.data.id)
        toast.success(`Driver matched: ${matchRes.data.provider.name} (${matchRes.data.provider.vehicle_type})`)
      }
      navigate('/buyer/dashboard')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Order failed')
    } finally {
      setOrdering(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>
  if (!product) return <div className="text-center py-20 text-red-400">Product not found</div>

  const total = (qty * product.price_per_kg).toFixed(2)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {/* Image */}
        <div className="bg-green-50 rounded-xl h-64 md:h-full flex items-center justify-center text-8xl">
          {product.image_url
            ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-xl" />
            : <span>{{ tomatoes:'🍅', peppers:'🌶️', garden_eggs:'🍆', okra:'🌿', leafy_greens:'🥬', onions:'🧅', yams:'🍠', maize:'🌽', millet:'🌾', rice:'🍚' }[product.category] || '🌾'}</span>
          }
        </div>

        {/* Details */}
        <div>
          <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-3 capitalize">
            {product.category?.replace('_', ' ')}
          </span>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h1>
          {product.description && <p className="text-gray-500 text-sm mb-4">{product.description}</p>}

          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-bold text-green-700">GHS {product.price_per_kg}</span>
            <span className="text-gray-400 text-sm">per kg</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-400 text-xs">Available</div>
              <div className="font-semibold flex items-center gap-1"><Package size={14} /> {product.quantity_kg} kg</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-400 text-xs">Min Order</div>
              <div className="font-semibold">{product.min_order_kg} kg</div>
            </div>
          </div>

          {/* Farmer info */}
          {product.farmer && (
            <div className="border border-gray-100 rounded-xl p-3 mb-4">
              <div className="font-semibold text-gray-700 text-sm mb-1">Sold by</div>
              <div className="font-bold text-gray-800">{product.farmer.name}</div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                <span className="flex items-center gap-1"><MapPin size={11} /> {product.farmer.village}, {product.farmer.district}</span>
                {product.farmer.rating > 0 && (
                  <span className="flex items-center gap-0.5 text-yellow-500"><Star size={11} fill="currentColor" /> {product.farmer.rating}</span>
                )}
              </div>
              <a href={`tel:${product.farmer.phone}`} className="flex items-center gap-1 text-green-600 text-xs mt-2 hover:underline">
                <Phone size={11} /> {product.farmer.phone}
              </a>
            </div>
          )}

          {/* Order form */}
          {product.is_available ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Quantity (kg)</label>
                <input
                  type="number"
                  min={product.min_order_kg}
                  max={product.quantity_kg}
                  step="0.5"
                  value={qty}
                  onChange={(e) => setQty(parseFloat(e.target.value))}
                  className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Delivery Address</label>
                <input
                  type="text"
                  placeholder="Your delivery address in Tamale..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={showTransport} onChange={(e) => setShowTransport(e.target.checked)} className="rounded" />
                <Truck size={14} /> Request transport / delivery
              </label>
              <div className="bg-green-50 rounded-lg p-3 flex justify-between text-sm">
                <span className="text-gray-600">Total: {qty} kg × GHS {product.price_per_kg}</span>
                <span className="font-bold text-green-700">GHS {total}</span>
              </div>
              <button
                onClick={handleOrder}
                disabled={ordering}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50"
              >
                {ordering ? 'Processing...' : `Pay GHS ${total} with MTN MoMo`}
              </button>
            </div>
          ) : (
            <div className="bg-red-50 text-red-600 rounded-xl p-4 text-center font-semibold">
              Out of Stock
            </div>
          )}
        </div>
      </div>

      {/* Similar products */}
      {similar.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Similar Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {similar.map(p => <ProductCard key={p.product_id} product={{ ...p, id: p.product_id, farmer: { village: p.farmer_village } }} />)}
          </div>
        </div>
      )}
    </div>
  )
}

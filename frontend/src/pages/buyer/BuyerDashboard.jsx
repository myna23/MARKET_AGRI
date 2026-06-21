import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { getBuyerOrders, getRecommendations, trackOrder, submitReview } from '../../services/api'
import { ShoppingCart, Sparkles, X } from 'lucide-react'
import ProductCard from '../../components/ProductCard'
import DeliveryTracker from '../../components/DeliveryTracker'
import StarRating from '../../components/StarRating'
import toast from 'react-hot-toast'

const STATUS_COLOR = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-orange-100 text-orange-600',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
}

const PAYMENT_LABEL = { momo: '📱 MoMo', card: '💳 Card', cash: '💵 Cash' }

export default function BuyerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [tracking, setTracking] = useState(null)       // full tracking detail for modal
  const [trackingOrderId, setTrackingOrderId] = useState(null)
  const [reviewModal, setReviewModal] = useState(null) // { order }
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewedIds, setReviewedIds] = useState(new Set())

  useEffect(() => {
    if (!user || user.role !== 'buyer') { navigate('/login'); return }
    Promise.all([
      getBuyerOrders(user.buyer_id).then(r => setOrders(r.data)),
      getRecommendations(user.buyer_id, 6).then(r => setRecs(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [user])

  const openTracking = async (orderId) => {
    setTrackingOrderId(orderId)
    setTracking(null)
    try {
      const res = await trackOrder(orderId)
      setTracking(res.data)
    } catch {
      toast.error('Could not load tracking info')
      setTrackingOrderId(null)
    }
  }

  const openReview = (order) => {
    setReviewModal(order)
    setReviewRating(5)
    setReviewComment('')
  }

  const submitRating = async () => {
    if (!reviewModal) return
    try {
      await submitReview({
        farmer_id: reviewModal.farmer_id,
        buyer_id: user.buyer_id,
        order_id: reviewModal.id,
        rating: reviewRating,
        comment: reviewComment,
      })
      setReviewedIds(s => new Set(s).add(reviewModal.id))
      setReviewModal(null)
      toast.success('Rating submitted! Thank you.')
    } catch {
      toast.error('Could not submit review')
    }
  }

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
                  <div className="font-semibold text-gray-800">
                    Order #{o.id} — {o.product_name || `Product #${o.product_id}`}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">{o.quantity_kg}kg · GHS {o.total_price}</div>
                  {o.delivery_address && <div className="text-xs text-gray-400 mt-1">📍 {o.delivery_address}</div>}
                  {o.payment_method && (
                    <div className="text-xs text-gray-400 mt-0.5">{PAYMENT_LABEL[o.payment_method] || o.payment_method}</div>
                  )}
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[o.status] || 'bg-gray-100 text-gray-600'}`}>
                    {o.status?.replace('_', ' ')}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${o.payment_status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                    {o.payment_status}
                  </span>
                  <button
                    onClick={() => openTracking(o.id)}
                    className="text-xs text-blue-600 hover:underline mt-1">
                    Track order →
                  </button>
                  {o.status === 'delivered' && !reviewedIds.has(o.id) && (
                    <button
                      onClick={() => openReview(o)}
                      className="text-xs text-yellow-600 hover:underline">
                      ⭐ Rate farmer
                    </button>
                  )}
                  {reviewedIds.has(o.id) && (
                    <span className="text-xs text-green-600">Rated ✓</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tracking Modal */}
      {trackingOrderId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setTrackingOrderId(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Order Tracking</h2>
              <button onClick={() => setTrackingOrderId(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {tracking ? (
              <>
                <DeliveryTracker order={tracking} />
                {tracking.farmer_name && (
                  <div className="mt-4 text-sm text-gray-500">
                    Farmer: <span className="font-semibold text-gray-700">{tracking.farmer_name}</span>
                    {tracking.farmer_phone && (
                      <a href={`tel:${tracking.farmer_phone}`} className="ml-2 text-green-600 hover:underline">
                        📞 Call
                      </a>
                    )}
                  </div>
                )}
                {tracking.status === 'delivered' && !reviewedIds.has(tracking.id) && (
                  <button
                    onClick={() => { setTrackingOrderId(null); openReview(tracking) }}
                    className="mt-4 w-full bg-yellow-400 text-yellow-900 font-bold py-2 rounded-xl hover:bg-yellow-500">
                    ⭐ Rate this farmer
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-10 text-gray-400">Loading tracking info...</div>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setReviewModal(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Rate your farmer</h2>
              <button onClick={() => setReviewModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">How was your experience with this order?</p>
            <div className="flex justify-center mb-4">
              <StarRating value={reviewRating} onChange={setReviewRating} size={36} />
            </div>
            <textarea
              rows={3}
              placeholder="Leave a comment (optional)..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 mb-4"
            />
            <button onClick={submitRating} className="w-full bg-yellow-400 text-yellow-900 font-bold py-2 rounded-xl hover:bg-yellow-500">
              Submit Rating
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

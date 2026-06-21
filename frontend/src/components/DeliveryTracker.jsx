import { CheckCircle, Circle, Clock, XCircle } from 'lucide-react'

const STEP_ICONS = {
  done: <CheckCircle size={20} className="text-green-500" />,
  active: <Clock size={20} className="text-blue-500 animate-pulse" />,
  pending: <Circle size={20} className="text-gray-300" />,
  cancelled: <XCircle size={20} className="text-red-400" />,
}

const STATUS_BADGE = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-orange-100 text-orange-600',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
}

export default function DeliveryTracker({ order }) {
  if (!order) return null
  const steps = order.tracking_steps || []

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800">Order #{order.id} — Tracking</h3>
        <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-600'}`}>
          {order.status?.replace('_', ' ')}
        </span>
      </div>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">{STEP_ICONS[step.status] || STEP_ICONS.pending}</div>
            <div className="flex-1">
              <div className={`font-medium text-sm ${step.status === 'done' ? 'text-gray-800' : step.status === 'active' ? 'text-blue-700' : 'text-gray-400'}`}>
                {step.step}
              </div>
              {step.time && (
                <div className="text-xs text-gray-400 mt-0.5">
                  {new Date(step.time).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
            {i < steps.length - 1 && (
              <div className="absolute left-[28px] mt-6 w-0.5 h-6 bg-gray-100" />
            )}
          </div>
        ))}
      </div>

      {order.payment_method && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
          <span className="text-gray-500">Payment</span>
          <span className="font-semibold flex items-center gap-1">
            {order.payment_method === 'momo' ? '📱 MoMo' : order.payment_method === 'card' ? '💳 Card' : '💵 Cash'}
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {order.payment_status}
            </span>
          </span>
        </div>
      )}

      {order.delivery_address && (
        <div className="mt-2 text-sm text-gray-500 flex gap-1">
          <span>📍</span> <span>{order.delivery_address}</span>
        </div>
      )}
    </div>
  )
}

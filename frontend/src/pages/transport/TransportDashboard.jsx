import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { listTransportProviders } from '../../services/api'
import { Truck, MapPin, Star } from 'lucide-react'

export default function TransportDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'transport') { navigate('/login'); return }
    listTransportProviders().then(r => { setProviders(r.data); setLoading(false) })
  }, [user])

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Transport Dashboard 🚚</h1>
        <p className="text-gray-500 text-sm">Welcome, {user.name}! Available drivers in your area:</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {providers.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Truck size={20} className="text-orange-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{p.name}</div>
                  <div className="text-xs text-gray-400 capitalize">{p.vehicle_type} · {p.vehicle_capacity_kg}kg cap</div>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                {p.is_available ? 'Available' : 'Busy'}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1"><MapPin size={12} /> {p.base_district}</span>
              <span className="flex items-center gap-1 text-yellow-500"><Star size={12} fill="currentColor" /> {p.rating}</span>
              <span className="text-green-700 font-medium">GHS {p.price_per_km}/km</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

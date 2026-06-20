import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerTransportProvider } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const VEHICLE_TYPES = ['motorcycle', 'tricycle', 'pickup', 'truck']

export default function TransportRegister() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', password: '', vehicle_type: 'tricycle', vehicle_capacity_kg: '', license_plate: '', base_district: 'Tamale Metro', price_per_km: 5 })
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...form, vehicle_capacity_kg: parseFloat(form.vehicle_capacity_kg), price_per_km: parseFloat(form.price_per_km) }
      const res = await registerTransportProvider(payload)
      login({ provider_id: res.data.id, name: res.data.name, role: 'transport' })
      toast.success('Registered as transport provider!')
      navigate('/transport/dashboard')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const CAPACITY_GUIDE = { motorcycle: 100, tricycle: 300, pickup: 1000, truck: 5000 }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🚚</div>
          <h1 className="text-2xl font-bold text-gray-800">Driver Registration</h1>
          <p className="text-gray-500 text-sm">Get matched with transport jobs near you</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Full Name *</label>
              <input required value={form.name} onChange={set('name')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone *</label>
              <input required value={form.phone} onChange={set('phone')} placeholder="0261..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Vehicle Type *</label>
            <select value={form.vehicle_type} onChange={(e) => {
              setForm(f => ({ ...f, vehicle_type: e.target.value, vehicle_capacity_kg: CAPACITY_GUIDE[e.target.value] || '' }))
            }} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
              {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Capacity (kg) *</label>
              <input required type="number" value={form.vehicle_capacity_kg} onChange={set('vehicle_capacity_kg')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Price per km (GHS)</label>
              <input type="number" step="0.5" value={form.price_per_km} onChange={set('price_per_km')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">License Plate</label>
            <input value={form.license_plate} onChange={set('license_plate')} placeholder="NT-1234-21" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Password *</label>
            <input required type="password" value={form.password} onChange={set('password')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50">
            {loading ? 'Registering...' : 'Register as Driver'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already registered? <Link to="/login" className="text-green-600 font-semibold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}

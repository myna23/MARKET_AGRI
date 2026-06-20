import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerFarmer } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const DISTRICTS = ['Tamale Metro', 'Tolon', 'Savelugu', 'Kumbungu', 'Nanton', 'Sagnarigu', 'Mion', 'Karaga', 'Gushegu', 'Zabzugu']

export default function FarmerRegister() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '', village: '', district: 'Tamale Metro', farm_size_acres: ''
  })
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...form, farm_size_acres: form.farm_size_acres ? parseFloat(form.farm_size_acres) : null }
      const res = await registerFarmer(payload)
      login({ farmer_id: res.data.id, name: res.data.name, role: 'farmer' })
      toast.success('Welcome to AgriMarket!')
      navigate('/farmer/dashboard')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">👨‍🌾</div>
          <h1 className="text-2xl font-bold text-gray-800">Farmer Registration</h1>
          <p className="text-gray-500 text-sm">Start selling your produce directly to buyers</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Full Name *</label>
              <input required value={form.name} onChange={set('name')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone Number *</label>
              <input required value={form.phone} onChange={set('phone')} placeholder="0241..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email (optional)</label>
            <input type="email" value={form.email} onChange={set('email')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Village *</label>
              <input required value={form.village} onChange={set('village')} placeholder="e.g. Tolon" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">District *</label>
              <select value={form.district} onChange={set('district')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                {DISTRICTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Farm Size (acres)</label>
            <input type="number" step="0.5" value={form.farm_size_acres} onChange={set('farm_size_acres')} placeholder="e.g. 2.5" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Password *</label>
            <input required type="password" value={form.password} onChange={set('password')} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50">
            {loading ? 'Registering...' : 'Create Farmer Account'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already registered? <Link to="/login" className="text-green-600 font-semibold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}

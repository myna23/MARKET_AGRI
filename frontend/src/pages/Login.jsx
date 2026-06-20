import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginFarmer, loginBuyer } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('buyer')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let res
      if (role === 'farmer') {
        res = await loginFarmer({ phone, password })
        login({ ...res.data, role: 'farmer' })
        navigate('/farmer/dashboard')
      } else if (role === 'buyer') {
        res = await loginBuyer({ phone, password })
        login({ ...res.data, role: 'buyer' })
        navigate('/buyer/dashboard')
      }
      toast.success(`Welcome back, ${res.data.name}!`)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🌿</div>
          <h1 className="text-2xl font-bold text-gray-800">Login to AgriMarket</h1>
          <p className="text-gray-500 text-sm mt-1">Northern Ghana's digital marketplace</p>
        </div>

        {/* Role tabs */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-6">
          {['buyer', 'farmer'].map(r => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2 text-sm font-medium capitalize transition ${role === r ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {r === 'buyer' ? '🛒 Buyer' : '👨‍🌾 Farmer'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0241001001"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="text-center mt-4 text-sm text-gray-500">
          <p>Demo credentials:</p>
          <p>Buyer: 0271001001 / buyer123</p>
          <p>Farmer: 0241001001 / farmer123</p>
        </div>

        <div className="mt-4 text-center text-sm">
          <span className="text-gray-500">No account? </span>
          <Link to={role === 'buyer' ? '/buyer/register' : '/farmer/register'} className="text-green-600 font-semibold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  )
}

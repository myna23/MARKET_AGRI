import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ShoppingBag, Tractor, Truck, BarChart2, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setOpen(false)
  }

  return (
    <nav className="bg-green-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-2xl">🌿</span>
          <span>AgriMarket Ghana</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/marketplace" className="hover:text-green-200 flex items-center gap-1">
            <ShoppingBag size={16} /> Marketplace
          </Link>
          {!user && <>
            <Link to="/farmer/register" className="hover:text-green-200 flex items-center gap-1">
              <Tractor size={16} /> Farmer
            </Link>
            <Link to="/buyer/register" className="hover:text-green-200 flex items-center gap-1">
              <ShoppingBag size={16} /> Buyer
            </Link>
            <Link to="/transport/register" className="hover:text-green-200 flex items-center gap-1">
              <Truck size={16} /> Driver
            </Link>
          </>}
          <Link to="/insights" className="hover:text-green-200 flex items-center gap-1">
            <BarChart2 size={16} /> Market Insights
          </Link>
          {user && <>
            {user.role === 'farmer' && <Link to="/farmer/dashboard" className="hover:text-green-200">My Farm</Link>}
            {user.role === 'buyer' && <Link to="/buyer/dashboard" className="hover:text-green-200">My Orders</Link>}
            {user.role === 'transport' && <Link to="/transport/dashboard" className="hover:text-green-200">My Trips</Link>}
            <button onClick={handleLogout} className="flex items-center gap-1 hover:text-red-300">
              <LogOut size={16} /> Logout
            </button>
          </>}
          {!user && (
            <Link to="/login" className="bg-white text-green-700 px-4 py-1.5 rounded-full font-semibold hover:bg-green-100">
              Login
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-green-800 px-4 pb-4 flex flex-col gap-3 text-sm font-medium">
          <Link to="/marketplace" onClick={() => setOpen(false)} className="hover:text-green-200">Marketplace</Link>
          <Link to="/insights" onClick={() => setOpen(false)} className="hover:text-green-200">Market Insights</Link>
          {!user && <>
            <Link to="/farmer/register" onClick={() => setOpen(false)} className="hover:text-green-200">Farmer Register</Link>
            <Link to="/buyer/register" onClick={() => setOpen(false)} className="hover:text-green-200">Buyer Register</Link>
            <Link to="/transport/register" onClick={() => setOpen(false)} className="hover:text-green-200">Driver Register</Link>
            <Link to="/login" onClick={() => setOpen(false)} className="bg-white text-green-700 px-4 py-1.5 rounded-full text-center font-semibold">Login</Link>
          </>}
          {user && <>
            {user.role === 'farmer' && <Link to="/farmer/dashboard" onClick={() => setOpen(false)} className="hover:text-green-200">My Farm</Link>}
            {user.role === 'buyer' && <Link to="/buyer/dashboard" onClick={() => setOpen(false)} className="hover:text-green-200">My Orders</Link>}
            <button onClick={handleLogout} className="text-left text-red-300">Logout</button>
          </>}
        </div>
      )}
    </nav>
  )
}

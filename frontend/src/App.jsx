import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Marketplace from './pages/Marketplace'
import ProductDetail from './pages/ProductDetail'
import Login from './pages/Login'
import MarketInsights from './pages/MarketInsights'
import FarmerRegister from './pages/farmer/FarmerRegister'
import FarmerDashboard from './pages/farmer/FarmerDashboard'
import BuyerRegister from './pages/buyer/BuyerRegister'
import BuyerDashboard from './pages/buyer/BuyerDashboard'
import TransportRegister from './pages/transport/TransportRegister'
import TransportDashboard from './pages/transport/TransportDashboard'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/insights" element={<MarketInsights />} />
          <Route path="/farmer/register" element={<FarmerRegister />} />
          <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
          <Route path="/buyer/register" element={<BuyerRegister />} />
          <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
          <Route path="/transport/register" element={<TransportRegister />} />
          <Route path="/transport/dashboard" element={<TransportDashboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

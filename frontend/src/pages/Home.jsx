import { Link } from 'react-router-dom'
import { ShoppingBag, Tractor, Truck, BarChart2, Shield, Zap, MapPin } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-4">🌿</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            AgriMarket Ghana
          </h1>
          <p className="text-xl md:text-2xl text-green-100 mb-3">
            Connecting Northern Ghana Farmers Directly to Buyers
          </p>
          <p className="text-green-200 text-base mb-8 max-w-2xl mx-auto">
            Fresh tomatoes, peppers, garden eggs, okra & more — straight from farm to table.
            Fair prices, zero middlemen, fast delivery.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/marketplace" className="bg-white text-green-700 font-bold px-8 py-3 rounded-full hover:bg-green-50 text-lg shadow">
              Browse Produce
            </Link>
            <Link to="/farmer/register" className="border-2 border-white text-white font-bold px-8 py-3 rounded-full hover:bg-white hover:text-green-700 text-lg">
              I'm a Farmer
            </Link>
          </div>
          <p className="mt-6 text-green-200 text-sm flex items-center justify-center gap-2">
            <MapPin size={14} /> Focused on Northern Region, Ghana
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-green-50 py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: 'Farmers', value: '50+', icon: '👨‍🌾' },
            { label: 'Produce Listings', value: '200+', icon: '🍅' },
            { label: 'Active Buyers', value: '30+', icon: '🛒' },
            { label: 'Drivers', value: '15+', icon: '🚚' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-3xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-green-700">{s.value}</div>
              <div className="text-gray-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Who is it for */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Built for Everyone in the Value Chain</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-2xl border border-green-100 hover:shadow-md transition">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tractor size={32} className="text-green-700" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Farmers</h3>
            <ul className="text-gray-600 text-sm space-y-2 text-left">
              <li>✅ Register & list your produce</li>
              <li>✅ Set your own prices</li>
              <li>✅ Receive orders directly</li>
              <li>✅ Request transport pickup</li>
              <li>✅ Works via USSD on any phone</li>
            </ul>
            <Link to="/farmer/register" className="mt-4 block bg-green-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-700">
              Register as Farmer
            </Link>
          </div>

          <div className="text-center p-6 rounded-2xl border border-blue-100 hover:shadow-md transition">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={32} className="text-blue-700" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Buyers</h3>
            <ul className="text-gray-600 text-sm space-y-2 text-left">
              <li>✅ Search produce by type & price</li>
              <li>✅ AI-powered recommendations</li>
              <li>✅ Order directly from farmers</li>
              <li>✅ Pay with MTN MoMo</li>
              <li>✅ Track your deliveries</li>
            </ul>
            <Link to="/buyer/register" className="mt-4 block bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700">
              Register as Buyer
            </Link>
          </div>

          <div className="text-center p-6 rounded-2xl border border-orange-100 hover:shadow-md transition">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck size={32} className="text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Transport Providers</h3>
            <ul className="text-gray-600 text-sm space-y-2 text-left">
              <li>✅ Register your vehicle</li>
              <li>✅ Get matched to nearby jobs</li>
              <li>✅ Set your price per km</li>
              <li>✅ Flexible scheduling</li>
              <li>✅ Build your rating</li>
            </ul>
            <Link to="/transport/register" className="mt-4 block bg-orange-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-orange-600">
              Register as Driver
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Platform Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: <Zap size={24} className="text-yellow-500" />, title: 'AI Smart Matching', desc: 'Our AI engine recommends the best produce for buyers based on purchase history, location, and price.' },
              { icon: <Truck size={24} className="text-orange-500" />, title: 'Logistics Coordination', desc: 'Book transport providers, track deliveries in real time, and get estimated costs automatically.' },
              { icon: <Shield size={24} className="text-green-600" />, title: 'Mobile Money Payments', desc: 'Pay securely with MTN MoMo, Vodafone Cash, or AirtelTigo directly in the app.' },
              { icon: <BarChart2 size={24} className="text-blue-600" />, title: 'Market Insights', desc: 'Live price data, supply levels, and demand trends for tomatoes, peppers, garden eggs and more.' },
            ].map((f) => (
              <div key={f.title} className="bg-white p-5 rounded-xl shadow-sm flex gap-4">
                <div className="mt-1 shrink-0">{f.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">{f.title}</h3>
                  <p className="text-gray-600 text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Ready to start?</h2>
        <p className="text-gray-600 mb-8">Join Northern Ghana's growing digital agricultural marketplace.</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/marketplace" className="bg-green-600 text-white font-bold px-8 py-3 rounded-full hover:bg-green-700 text-lg">
            Browse the Marketplace
          </Link>
          <Link to="/login" className="border-2 border-green-600 text-green-600 font-bold px-8 py-3 rounded-full hover:bg-green-50 text-lg">
            Login
          </Link>
        </div>
      </section>

      <footer className="bg-green-800 text-green-200 text-center py-6 text-sm">
        <p>AgriMarket Ghana — GDSS-PSInno AgriTech Innovation Challenge 2026</p>
        <p className="mt-1">Reducing post-harvest losses in Northern Ghana 🇬🇭</p>
      </footer>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { Star, MapPin, Package } from 'lucide-react'

const CATEGORY_EMOJI = {
  tomatoes: '🍅',
  peppers: '🌶️',
  garden_eggs: '🍆',
  okra: '🌿',
  leafy_greens: '🥬',
  onions: '🧅',
  millet: '🌾',
  rice: '🍚',
  yams: '🍠',
  maize: '🌽',
  other: '🌾',
}

export default function ProductCard({ product, showMatch = false, distanceLabel = null }) {
  const emoji = CATEGORY_EMOJI[product.category] || '🌾'

  return (
    <Link to={`/product/${product.id || product.product_id}`} className="block">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
        <div className="h-40 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center text-6xl relative">
          {product.image_url
            ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            : <span>{emoji}</span>
          }
          {showMatch && product.match_score != null && (
            <span className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
              {Math.round(product.match_score)}% match
            </span>
          )}
          <span className="absolute top-2 left-2 bg-white text-green-700 text-xs px-2 py-0.5 rounded-full font-medium capitalize">
            {product.category?.replace('_', ' ')}
          </span>
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-gray-800 text-sm truncate">{product.name}</h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-green-700 font-bold text-base">GHS {product.price_per_kg}/kg</span>
            <span className="text-gray-400 text-xs flex items-center gap-1">
              <Package size={12} /> {product.quantity_kg}kg
            </span>
          </div>
          {product.farmer && (
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin size={11} /> {product.farmer.village || product.farmer_village}
              </span>
              <div className="flex items-center gap-2">
                {distanceLabel && (
                  <span className="text-blue-600 font-medium">{distanceLabel}</span>
                )}
                {product.farmer.rating > 0 && (
                  <span className="flex items-center gap-0.5 text-yellow-500">
                    <Star size={11} fill="currentColor" /> {product.farmer.rating}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

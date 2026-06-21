import { useState } from 'react'
import { Star } from 'lucide-react'

export default function StarRating({ value = 0, onChange = null, size = 20 }) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
          disabled={!onChange}
        >
          <Star
            size={size}
            className={star <= display ? 'text-yellow-400' : 'text-gray-300'}
            fill={star <= display ? 'currentColor' : 'none'}
          />
        </button>
      ))}
    </div>
  )
}

import { FiPlus } from 'react-icons/fi'
import { useCart } from '../context/CartContext.jsx'

export default function FoodCard({ item, onOrderNow }) {
  const { addItem, openCart } = useCart()
  const disabled = !item.is_available

  return (
    <div className="group rounded-2xl overflow-hidden bg-white border border-amber-100 shadow-sm hover:shadow-md transition dark:bg-slate-900/60 dark:border-slate-800">
      <div className="relative aspect-[5/2.7] bg-amber-50 dark:bg-slate-900">
        <img
          src={item.image_url}
          alt={item.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = '/images/menu/fallback.png'
          }}
        />
        {!item.is_available && (
          <div className="absolute inset-0 bg-black/50 grid place-items-center">
            <span className="px-3 py-1 rounded-full bg-white/90 text-gray-900 text-sm font-semibold">
              Not Available
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-amber-50">{item.name}</h3>
            {item.description && (
              <p className="mt-1 text-sm text-gray-600 dark:text-amber-100/80">{item.description}</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <div className="text-lg font-bold text-red-900 dark:text-amber-200">₹{Number(item.price)}</div>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              addItem({
                id: item.id,
                name: item.name,
                price: Number(item.price),
                image_url: item.image_url,
              })
              openCart()
            }}
            className={[
              'w-1/2 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-900/40 dark:focus-visible:ring-amber-300/30',
              disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-400'
                : 'bg-red-900 text-amber-100 hover:bg-red-800 dark:bg-amber-300 dark:hover:bg-amber-200 dark:text-red-950',
            ].join(' ')}
          >
            <FiPlus />
            Add to Cart
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!onOrderNow) return
              onOrderNow(item)
            }}
            className={[
              'w-1/2 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-900/40 dark:focus-visible:ring-amber-300/30',
              disabled
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800'
                : 'bg-white text-red-900 border-red-900 hover:bg-red-50 dark:bg-slate-900 dark:text-amber-100 dark:border-amber-300 dark:hover:bg-slate-800',
            ].join(' ')}
          >
            Order Now
          </button>
        </div>
      </div>
    </div>
  )
}


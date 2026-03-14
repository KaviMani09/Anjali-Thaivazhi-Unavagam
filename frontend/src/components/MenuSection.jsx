import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import FoodCard from './FoodCard.jsx'
import { api } from '../utils/api.js'
import { useCart } from '../context/CartContext.jsx'
import BillingModal from './BillingModal.jsx'

const CATEGORIES = [
  { key: 'morning', label: 'Morning' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'night', label: 'Night' },
  { key: 'snacks', label: 'Snacks' },
  { key: 'juices', label: 'Juices' },
]

function detectCategoryByTime(now = new Date()) {
  const h = now.getHours()
  if (h >= 6 && h < 11) return 'morning'
  if (h >= 12 && h < 15) return 'afternoon'
  if (h >= 19 && h < 23) return 'night'
  if (h >= 15 && h < 19) return 'snacks'
  return 'snacks'
}

const fallbackSeed = [
  // Morning
  {
    id: 1,
    category: "morning",
    name: "Idly",
    description: "3 soft steamed idly and 3 crispy vada served with coconut chutney and sambar",
    price: 50,
    image_url: "/images/menu/idly.png",
    is_available: 1,
  },
  {
    id: 2,
    category: "morning",
    name: "Poori",
    description: "3 deep fried poori served with potato masala",
    price: 30,
    image_url: "/images/menu/poori.png",
    is_available: 1,
  },
  {
    id: 3,
    category: "morning",
    name: "Pongal",
    description: "Ven Pongal made with rice, moong dal, ghee, pepper and cumin served with chutney & sambar",
    price: 40,
    image_url: "/images/menu/pongal.png",
    is_available: 1,
  },
  {
    id: 4,
    category: "morning",
    name: "Tea",
    description: "Hot South Indian milk tea made with fresh milk",
    price: 10,
    image_url: "/images/menu/Tea.png",
    is_available: 1,
  },
  {
    id: 5,
    category: "morning",
    name: "Coffee",
    description: "Traditional South Indian coffee served in tumbler and davara",
    price: 10,
    image_url: "/images/menu/coffee.png",
    is_available: 1,
  },
  {
    id: 6,
    category: "morning",
    name: "Aloe Vera Juice",
    description: "Fresh and healthy aloe vera juice served chilled",
    price: 15,
    image_url: "/images/menu/Aloe Vera.jpg",
    is_available: 1,
  },

  // Afternoon
  {
    id: 7,
    category: "afternoon",
    name: "Veg Meals",
    description: "Traditional South Indian vegetarian meals with rice, sambar, rasam, poriyal, kootu and curd",
    price: 100,
    image_url: "/images/menu/veg meals.avif",
    is_available: 1,
  },
  {
    id: 8,
    category: "afternoon",
    name: "Non-Veg Meals",
    description: "Meals with rice, chicken curry, rasam, sambar and side dishes",
    price: 120,
    image_url: "/images/menu/Non veg.jpg",
    is_available: 1,
  },
  {
    id: 9,
    category: "afternoon",
    name: "Veg Biryani",
    description: "Aromatic basmati rice cooked with vegetables and traditional spices",
    price: 50,
    image_url: "/images/menu/veg rice.png",
    is_available: 1,
  },
  {
    id: 10,
    category: "afternoon",
    name: "Tomato Rice",
    description: "Spicy tomato flavored rice cooked with South Indian spices",
    price: 30,
    image_url: "/images/menu/tomoto rice.png",
    is_available: 1,
  },
  {
    id: 11,
    category: "afternoon",
    name: "Lemon Rice",
    description: "Tangy lemon flavored rice tempered with peanuts and spices",
    price: 30,
    image_url: "/images/menu/lemon rice.png",
    is_available: 1,
  },
  {
    id: 12,
    category: "afternoon",
    name: "Curd Rice",
    description: "Cool and creamy curd rice tempered with mustard seeds and curry leaves",
    price: 30,
    image_url: "/images/menu/curd rice.jpg",
    is_available: 1,
  },

  // Night
  {
    id: 13,
    category: "night",
    name: "Dosa",
    description: "Crispy South Indian dosa served with chutney and sambar",
    price: 15,
    image_url: "/images/menu/dosa.png",
    is_available: 1,
  },
  {
    id: 14,
    category: "night",
    name: "Parotta",
    description: "Crispy South Indian dosa (3 pieces) served with chutney and sambar",
    price: 30,
    image_url: "/images/menu/parota.png",
    is_available: 1,
  },
  {
    id: 15,
    category: "night",
    name: "Chapati",
    description: "Soft whole wheat chapati (3 pieces) served with tasty kurma",
    price: 30,
    image_url: "/images/menu/Chapathi.jpg",
    is_available: 1,
  },
  {
    id: 16,
    category: "night",
    name: "Chicken Fried Rice",
    description: "Stir fried rice with chicken, vegetables and soy sauce",
    price: 100,
    image_url: "/images/menu/chicken rice.avif",
    is_available: 1,
  },
  {
    id: 17,
    category: "night",
    name: "Egg Fried Rice",
    description: "Fried rice with scrambled egg, vegetables and sauces",
    price: 100,
    image_url: "/images/menu/egg.png",
    is_available: 1,
  },
  {
    id: 18,
    category: "night",
    name: "Noodles",
    description: "Indo-Chinese style noodles stir fried with vegetables",
    price: 100,
    image_url: "/images/menu/noodles.jpg",
    is_available: 1,
  },

  // Snacks
  {
    id: 19,
    category: "snacks",
    name: "All Snacks",
    description: "Variety of snacks available. Starting price ₹10",
    price: 10,
    image_url: "/images/menu/snakes.png",
    is_available: 1,
  },
  {
    id: 20,
    category: "snacks",
    name: "Healthy organic snacks",
    description: "Healthy organic snacks such as sundal, soup Etc...",
    price: 20,
    image_url: "/images/menu/snacks.jpg",
    is_available: 1,
  },
  {
    id: 21,
    category: "snacks",
    name: "Vada",
    description: "Hot and crispy medu vada served with chutney",
    price: 10,
    image_url: "/images/menu/vada.png",
    is_available: 1,
  },
  {
    id: 22,
    category: "snacks",
    name: "Samosa",
    description: "Crispy fried samosa filled with spicy potato masala",
    price: 15,
    image_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950",
    is_available: 1,
  },
  {
    id: 23,
    category: "snacks",
    name: "Ice Cream",
    description: "All types of ice cream available. Prices start from ₹10",
    price: 10,
    image_url: "/images/menu/ice.png",
    is_available: 1,
  },
  {
    id: 24,
    category: "snacks",
    name: "Snacks",
    description: "All types of snacks like Kurkure, chocolate, biscuits, and murukku. Prices start from ₹10",
    price: 10,
    image_url: "/images/menu/all.jpg",
    is_available: 1,
  },

  // Juices
  {
    id: 25,
    category: "juices",
    name: "Lemon Juice",
    description: "Fresh lemon juice with sugar or salt",
    price: 15,
    image_url: "/images/menu/lemon.png",
    is_available: 1,
  },
  {
    id: 26,
    category: "juices",
    name: "Orange Juice",
    description: "Freshly squeezed orange juice",
    price: 15,
    image_url: "https://images.unsplash.com/photo-1613478223719-2ab802602423",
    is_available: 1,
  },
  {
    id: 27,
    category: "juices",
    name: "Watermelon Juice",
    description: "Chilled and refreshing watermelon juice",
    price: 15,
    image_url: "/images/menu/watermelon.jpg",
    is_available: 1,
  },
  {
    id: 28,
    category: "juices",
    name: "Pineapple Juice",
    description: "Sweet and tangy pineapple juice",
    price: 20,
    image_url: "/images/menu/pineapple.png",
    is_available: 1,
  },
  {
    id: 29,
    category: "juices",
    name: "Cool Drinks",
    description: "Refreshing soft drinks",
    price: 10,
    image_url: "/images/menu/cool.jpg",
    is_available: 1,
  },
  {
    id: 30,
    category: "juices",
    name: "Milk Shake",
    description: "Creamy fruit flavored milkshake",
    price: 50,
    image_url: "/images/menu/milkshake.png",
    is_available: 1,
  },
];

export default function MenuSection({ compact = false, initialCategory }) {
  const [active, setActive] = useState(initialCategory || detectCategoryByTime())
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [quickOrderItem, setQuickOrderItem] = useState(null)
  const { clearCart } = useCart()

  useEffect(() => {
    setActive(initialCategory || detectCategoryByTime())
  }, [initialCategory])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      try {
        // Load the full menu once (same data as Admin "Menu Items" table")
        const res = await api.get('/menu.php')
        if (!cancelled) {
          const fromApi = Array.isArray(res.data?.items) ? res.data.items : res.data
          const apiItems = Array.isArray(fromApi) ? fromApi : []
          // Always include fallbackSeed so the original demo items never "disappear"
          // when you start adding real items in the admin panel.
          const merged = [...fallbackSeed, ...apiItems]
          const seen = new Set()
          const next = merged.filter((it) => {
            const key = `${it.category}|${it.name}|${Number(it.price)}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
          setItems(next)
        }
      } catch (e) {
        if (!cancelled) {
          setItems(fallbackSeed)
          const msg =
            e?.response?.data?.error ||
            e?.message ||
            'Backend not reachable — showing sample menu.'
          toast.error(msg)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  const visible = useMemo(() => {
    const list = items || []
    const filtered = active === 'all' ? list : list.filter((x) => x.category === active)
    return compact ? filtered.slice(0, 6) : filtered
  }, [items, active, compact])

  function handleQuickOrder(item) {
    if (!item || !item.is_available) return
    // Ensure cart is not used for quick orders
    clearCart()
    setQuickOrderItem({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      image_url: item.image_url,
      qty: 1,
    })
    setShowOrderModal(true)
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            Today&apos;s Menu
          </h2>
          <p className="mt-1 text-gray-600">
            Warm flavors, fresh ingredients, and authentic Tamil taste.
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setActive(c.key)}
                className={[
                  'px-4 py-2 rounded-xl text-sm font-semibold border transition',
                  active === c.key
                    ? 'bg-red-900 text-amber-100 border-red-900'
                    : 'bg-white text-gray-800 border-amber-200 hover:bg-amber-50',
                ].join(' ')}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-amber-100 p-4">
                <div className="h-44 rounded-xl bg-amber-100/70 animate-pulse" />
                <div className="h-4 mt-4 w-2/3 bg-amber-100/70 rounded animate-pulse" />
                <div className="h-4 mt-2 w-1/2 bg-amber-100/70 rounded animate-pulse" />
                <div className="h-10 mt-4 w-full bg-amber-100/70 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-white p-6 text-gray-700">
            No items found for this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visible.map((item) => (
              <FoodCard key={item.id} item={item} onOrderNow={handleQuickOrder} />
            ))}
          </div>
        )}
      </div>

      <BillingModal
        open={showOrderModal}
        onClose={() => {
          setShowOrderModal(false)
          setQuickOrderItem(null)
        }}
        items={quickOrderItem ? [quickOrderItem] : []}
        subtotal={quickOrderItem ? Number(quickOrderItem.price) : 0}
        total={quickOrderItem ? Number(quickOrderItem.price) : 0}
        gstOverride={0}
      />
    </section>
  )
}


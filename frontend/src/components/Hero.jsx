import { Link } from 'react-router-dom'
import { FiArrowRight, FiCalendar, FiShoppingBag } from 'react-icons/fi'

const heroImg =
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1600&q=70'

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Traditional South Indian food served at Anjali Thaivazhi Unavagam"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-red-950/80 via-red-950/55 to-amber-900/30" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100/15 text-amber-100 border border-amber-200/25 px-4 py-2 text-xs">
            Traditional Tamil Taste • Modern Comfort
          </div>

          <h1 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight text-amber-50">
            Anjali Thaivazhi Unavagam
          </h1>
          <p className="tamil hidden sm:block mt-2 text-2xl md:text-3xl font-bold text-amber-200">
            அஞ்சலி தாய்வழி உணவகம்
          </p>
          <p className="mt-4 text-amber-50/90 leading-relaxed">
            Authentic South Indian meals, fresh tiffin, and warm hospitality — dine-in, takeaway,
            delivery, and function catering.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Link
              to="/menu"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-red-950 font-semibold px-5 py-3 transition"
            >
              <FiShoppingBag />
              Order from Menu
              <FiArrowRight />
            </Link>
            <Link
              to="/booking"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-amber-50 border border-white/20 px-5 py-3 transition"
            >
              <FiCalendar />
              Book a Table
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['Pure Veg Options', 'Creamy & hearty'],
              ['Non-Veg Specials', 'Freshly cooked'],
              ['Catering', 'Functions & events'],
              ['Quick Service', 'Fast dine-in'],
            ].map(([title, sub]) => (
              <div key={title} className="rounded-2xl bg-white/10 border border-white/15 p-3">
                <div className="text-amber-50 font-semibold text-sm">{title}</div>
                <div className="text-amber-100/80 text-xs mt-1">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}


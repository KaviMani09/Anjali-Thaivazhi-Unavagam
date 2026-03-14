import { Link } from 'react-router-dom'
import { FiFacebook, FiInstagram, FiMapPin, FiMessageCircle, FiPhone, FiTwitter } from 'react-icons/fi'

export default function Footer() {
  const socials = [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      href: 'https://wa.me/919585833661',
      icon: FiMessageCircle,
    },
    {
      key: 'instagram',
      label: 'Instagram',
      href: import.meta.env.VITE_INSTAGRAM_URL || 'https://instagram.com/',
      icon: FiInstagram,
    },
    {
      key: 'facebook',
      label: 'Facebook',
      href: import.meta.env.VITE_FACEBOOK_URL || 'https://facebook.com/',
      icon: FiFacebook,
    },
    {
      key: 'twitter',
      label: 'Twitter',
      href: import.meta.env.VITE_TWITTER_URL || 'https://twitter.com/',
      icon: FiTwitter,
    },
  ]

  return (
    <footer className="no-print border-t border-amber-200/60 bg-white/70 backdrop-blur dark:bg-slate-950/70 dark:border-slate-800">
  <div className="tamil hidden sm:block text-sm font-extrabold text-red-900 mt-3 dark:text-amber-200 text-center">
  நன்றி! மீண்டும் உங்களை அன்போடு வரவேற்கிறோம் 
</div>
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <div className="font-extrabold text-gray-900 dark:text-amber-50">Anjali Thaivazhi Unavagam</div>
          <div className="tamil hidden sm:block text-sm font-bold text-red-900 mt-1 dark:text-amber-200">
            அஞ்சலி தாய்வழி உணவகம்
          </div>
          <p className="mt-3 text-sm text-gray-600 dark:text-amber-100/80">
            Traditional Tamil food with modern comfort — dine-in, takeaway, delivery, and catering.
          </p>
        </div>
        <div>
          <div className="font-bold text-gray-900 dark:text-amber-50">Social Media</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {socials.map((s) => {
              const Icon = s.icon
              return (
                <a
                  key={s.key}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-gray-700 hover:text-red-900 hover:border-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-900/30 dark:border-slate-700 dark:bg-slate-900 dark:text-amber-100 dark:hover:bg-slate-800 dark:hover:text-amber-200 dark:focus-visible:ring-amber-300/30"
                >
                  <Icon className="text-red-900 dark:text-amber-200" />
                  <span className="font-semibold">{s.label}</span>
                </a>
              )
            })}
          </div>
        </div>
        <div>
          <div className="font-bold text-gray-900 dark:text-amber-50">Contact</div>
          <div className="mt-3 grid gap-2 text-sm text-gray-700 dark:text-amber-100/80">
            <div className="flex items-center gap-2">
              <FiMapPin className="text-red-900 dark:text-amber-200" />
              <span>X5GP+JC7, Thirukovilur Bypass Rd, Thapovanam, Tamil Nadu 605756</span>
            </div>
            <div className="flex items-center gap-2">
              <FiPhone className="text-red-900 dark:text-amber-200" />
              <span>9585833661, 7305264245</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900 dark:text-amber-50">Hours:</span> Open 24 hours
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-amber-200/60 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-gray-800 font-semibold text-center dark:text-amber-100/80">
          © 2026 Manikandan K. All rights reserved.
        </div>
      </div>
    </footer>
  )
}


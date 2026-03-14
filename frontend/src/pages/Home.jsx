import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiStar } from 'react-icons/fi'
import toast from 'react-hot-toast'
import Hero from '../components/Hero.jsx'
import TableBooking from '../components/TableBooking.jsx'
import { usePageMeta } from '../hooks/usePageMeta.js'

const DEFAULT_REVIEWS = [
]

const REVIEWS_STORAGE_KEY = 'anjali_reviews'

const DEFAULT_OFFERS = [
  ['Breakfast Combo', 'Idly / Dosa + Vadai + Coffee'],
  ['Meals Offer', 'Full meals with sides & payasam'],
  ['Night Special', 'Parotta / Kothu Parotta (limited)'],
]

const OFFERS_STORAGE_KEY = 'anjali_offers'

export default function Home() {
  usePageMeta({
    title: 'Anjali Thaivazhi Unavagam | Traditional South Indian Restaurant',
    description:
      'Anjali Thaivazhi Unavagam — traditional South Indian Tamil restaurant in Thapovanam, Tamil Nadu. Dine-in, takeaway, catering, and 24x7 service.',
    canonical: '/',
  })
  const [reviews, setReviews] = useState(DEFAULT_REVIEWS)
  const [offers, setOffers] = useState(DEFAULT_OFFERS)
  const [isAdmin, setIsAdmin] = useState(false)

  const [newReviewName, setNewReviewName] = useState('')
  const [newReviewText, setNewReviewText] = useState('')
  const [newReviewRating, setNewReviewRating] = useState(5)
  const [newReviewPhotos, setNewReviewPhotos] = useState([])
  const reviewPhotosInputRef = useRef(null)

  const MAX_REVIEW_PHOTOS = 3
  const MAX_PHOTO_BYTES = 2 * 1024 * 1024 // 2MB per photo to avoid localStorage overflow

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0
    const total = reviews.reduce((sum, r) => sum + Number(r?.rating || 0), 0)
    return Number((total / reviews.length).toFixed(1))
  }, [reviews])

  const normalizeReviews = useMemo(() => {
    return (raw) => {
      if (!Array.isArray(raw)) return []
      return raw
        .map((item) => {
          if (Array.isArray(item)) {
            const [name, text, rating, photos] = item
            return {
              name: typeof name === 'string' ? name : '',
              text: typeof text === 'string' ? text : '',
              rating: Number(rating) || 0,
              photos: Array.isArray(photos) ? photos.filter((p) => typeof p === 'string') : [],
            }
          }
          if (item && typeof item === 'object') {
            const { name, text, rating, photos } = item
            return {
              name: typeof name === 'string' ? name : '',
              text: typeof text === 'string' ? text : '',
              rating: Number(rating) || 0,
              photos: Array.isArray(photos) ? photos.filter((p) => typeof p === 'string') : [],
            }
          }
          return null
        })
        .filter(Boolean)
        .filter((r) => r.name && r.text)
    }
  }, [])

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.onload = () => resolve(String(reader.result || ''))
      reader.readAsDataURL(file)
    })

  // Load saved reviews from localStorage on first render
  useEffect(() => {
    try {
      const stored = localStorage.getItem(REVIEWS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const normalized = normalizeReviews(parsed)
        if (normalized.length > 0) {
          setReviews(normalized)
        }
      }
    } catch {
      // ignore parsing errors and fall back to defaults
    }

    // Check admin token for admin-only controls (frontend hint only)
    setIsAdmin(!!localStorage.getItem('admin_token'))
  }, [normalizeReviews])

  // Load saved offers from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(OFFERS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOffers(parsed)
        }
      }
    } catch {
      // ignore and keep defaults
    }
  }, [])

  const handleAddReview = async (e) => {
    e.preventDefault()
    const name = newReviewName.trim()
    const text = newReviewText.trim()
    const rating = Number(newReviewRating) || 0
    if (!name || !text) {
      toast.error('Please enter your name and review.')
      return
    }
    if (rating < 1 || rating > 5) {
      toast.error('Please select a rating between 1 and 5 stars.')
      return
    }
    const photos = Array.isArray(newReviewPhotos) ? newReviewPhotos.filter((p) => typeof p === 'string') : []
    setReviews((prev) => {
      const next = [{ name, text, rating, photos }, ...prev]
      try {
        localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore storage errors
      }
      return next
    })
    setNewReviewName('')
    setNewReviewText('')
    setNewReviewRating(5)
    setNewReviewPhotos([])
    if (reviewPhotosInputRef.current) reviewPhotosInputRef.current.value = ''
    toast.success('Thank you for your review!')
  }

  const handleDeleteReview = (indexToDelete) => {
    if (!isAdmin) {
      toast.error('Only admin can delete reviews.')
      return
    }
    setReviews((prev) => {
      const next = prev.filter((_, idx) => idx !== indexToDelete)
      try {
        localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore storage errors
      }
      return next
    })
    toast.success('Review deleted.')
  }

  const handlePickReviewPhotos = async (filesList) => {
    const files = Array.from(filesList || [])
    if (files.length === 0) return

    const remainingSlots = MAX_REVIEW_PHOTOS - newReviewPhotos.length
    if (remainingSlots <= 0) {
      toast.error(`You can upload up to ${MAX_REVIEW_PHOTOS} photos.`)
      return
    }

    const accepted = []
    for (const f of files) {
      if (accepted.length >= remainingSlots) break
      if (!f.type?.startsWith('image/')) {
        toast.error(`"${f.name}" is not an image.`)
        continue
      }
      if (f.size > MAX_PHOTO_BYTES) {
        toast.error(`"${f.name}" is too large (max 2MB).`)
        continue
      }
      accepted.push(f)
    }

    if (accepted.length === 0) return

    try {
      const dataUrls = await Promise.all(accepted.map(fileToDataUrl))
      const cleaned = dataUrls.filter((u) => typeof u === 'string' && u.startsWith('data:image/'))
      if (cleaned.length === 0) {
        toast.error('Could not read the selected photos.')
        return
      }
      setNewReviewPhotos((prev) => [...prev, ...cleaned].slice(0, MAX_REVIEW_PHOTOS))
    } catch {
      toast.error('Could not read the selected photos.')
    }
  }

  const updateOffer = (indexToUpdate, field, value) => {
    if (!isAdmin) {
      toast.error('Only admin can edit offers.')
      return
    }
    setOffers((prev) => {
      const next = prev.map((offer, idx) =>
        idx === indexToUpdate
          ? field === 'title'
            ? [value, offer[1]]
            : [offer[0], value]
          : offer,
      )
      try {
        localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  // Food gallery images (served from public/images)
  const foodGalleryImages = [
    '/images/food 1.jpg',
    '/images/food 2.webp',
    '/images/food 3.webp',
    '/images/food 4.avif',
    '/images/food 5.jpg',
    '/images/menu/veg rice.png',
    '/images/food 6.jpg',
    '/images/menu/chicken rice.avif',
    '/images/menu/noodles.jpg',
  ]

  const fallbackHeroPhoto = '/images/menu/fallback.png'

  const onImgError = (e) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = fallbackHeroPhoto
  }

  return (
    <div>
      <Hero />

      {/* About */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">About Us</h2>
            <p className="mt-3 text-gray-700 leading-relaxed">
              At <span className="font-semibold">Anjali Thaivazhi Unavagam</span>, we serve
              comforting South Indian classics with the warmth of Tamil hospitality. From morning
              tiffin to hearty meals and night specials — everything is cooked fresh.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <figure className="rounded-3xl overflow-hidden border border-amber-100 shadow-sm bg-black">
                <img
                  src="/images/owner-with-mother.png"
                  alt="Owner with mother of Anjali Thaivazhi Unavagam"
                  loading="lazy"
                  className="h-full w-full object-cover"
                  onError={onImgError}
                />
              </figure>
              <figure className="rounded-3xl overflow-hidden border border-amber-100 shadow-sm bg-black">
                <img
                  src="/images/owner-portrait.png"
                  alt="Owner of Anjali Thaivazhi Unavagam"
                  loading="lazy"
                  className="h-full w-full object-cover"
                  onError={onImgError}
                />
              </figure>
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden border border-amber-100 shadow-sm">
            <img
              src="/images/hotel-front.jpg"
              alt="Anjali Thaivazhi Unavagam Hotal"
              loading="lazy"
              className="h-full w-full object-cover"
              onError={onImgError}
            />
            <p className="p-3 text-sm text-gray-600 leading-relaxed">
              This hotel is built with love and hard work from our family. Every guest is treated
              like a family member, whether you are stopping during a long journey, visiting with
              friends, or celebrating a special occasion.
            </p>
          </div>
        </div>
      </section>

      {/* Our Services */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 md:p-10">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Our Services</h2>
              <p className="mt-2 text-gray-600">Everything you need — under one roof.</p>
            </div>
          </div>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ['Dine-In', 'Comfortable seating for families'],
              ['Function Arrangements', 'Customized menu and service'],
              ['Catering', 'Weddings, birthdays, and corporate'],
              ['Food Delivery', 'Fast delivery and hygienic packing'],
            ].map(([t, s]) => (
              <div key={t} className="rounded-2xl bg-white border border-amber-100 p-4">
                <div className="font-bold text-gray-900">{t}</div>
                <div className="text-sm text-gray-600 mt-1">{s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Food Gallery */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Food Gallery</h2>
            <p className="mt-2 text-gray-600">
              A quick look at our popular dishes and ambience.
            </p>
          </div>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 rounded-xl bg-red-900 hover:bg-red-800 text-amber-100 px-5 py-3 font-semibold"
          >
            View Full Menu <FiArrowRight />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          {foodGalleryImages.map((src) => (
            <div
              key={src}
              className="rounded-2xl overflow-hidden border border-amber-100 bg-white shadow-sm aspect-[4/3]"
            >
              <img
                src={src}
                alt="Food at Anjali Thaivazhi Unavagam"
                loading="lazy"
                className="h-full w-full object-cover"
                onError={onImgError}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Special Offers */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 md:p-10">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Special Offers</h2>
              <p className="mt-2 text-gray-600">Today’s deals and combos.</p>
            </div>
            {/* <a
              href="https://wa.me/919585833661"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-500 text-white px-5 py-3 font-semibold"
            >
              WhatsApp to Order <FiArrowRight />
            </a> */}
          </div>
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {offers.map(([title, desc], index) => (
              <div key={title + index} className="rounded-2xl bg-white border border-amber-100 p-5">
                {isAdmin ? (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => updateOffer(index, 'title', e.target.value)}
                    className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm font-extrabold text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-900/70"
                  />
                ) : (
                  <div className="font-extrabold text-gray-900">{title}</div>
                )}
                {isAdmin ? (
                  <textarea
                    value={desc}
                    onChange={(e) => updateOffer(index, 'desc', e.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-lg border border-amber-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-900/70 resize-none"
                  />
                ) : (
                  <div className="text-sm text-gray-600 mt-2">{desc}</div>
                )}
                <div className="mt-4 text-xs text-gray-500">*Offer availability may vary.</div>
              </div>
            ))}
          </div>
          {isAdmin && (
            <p className="mt-3 text-xs text-gray-500">
              You are logged in as admin. Edits to offers are saved only in this browser.
            </p>
          )}
        </div>
      </section>

      {/* Book a Table */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 md:p-10">
          <div className="flex items-end justify-between gap-4 flex-wrap">
          </div>
          <div className="mt-6">
            <TableBooking />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Testimonials</h2>
        <p className="mt-2 text-gray-600">What customers say about our taste & service.</p>
        {reviews.length > 0 && (
          <div className="mt-4 inline-flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-2 text-sm text-gray-800">
            <div className="flex items-center gap-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <FiStar
                  key={i}
                  className={
                    i < Math.round(averageRating)
                      ? 'h-4 w-4 fill-amber-500 text-amber-500'
                      : 'h-4 w-4 text-amber-200'
                  }
                />
              ))}
            </div>
            <div className="font-semibold">
              {averageRating} / 5 · {reviews.length}{' '}
              {reviews.length === 1 ? 'review' : 'reviews'}
            </div>
          </div>
        )}
        <div className="mt-6 grid md:grid-cols-[2fr,1.2fr] gap-6 items-start">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((review, index) => (
              <div
                key={`${review?.name || 'review'}-${index}`}
                className="rounded-2xl border border-amber-100 bg-white p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <FiStar
                        key={i}
                        className={
                          i < (review?.rating || 0) ? 'fill-amber-500 text-amber-500' : 'text-amber-200'
                        }
                      />
                    ))}
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteReview(index)}
                      className="text-xs text-red-700 hover:text-red-900 underline-offset-2 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="mt-3 text-gray-700 text-sm leading-relaxed">{review?.text}</p>
                {Array.isArray(review?.photos) && review.photos.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {review.photos.slice(0, 3).map((src, i) => (
                      <a
                        key={`${i}-${src.slice(0, 20)}`}
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl overflow-hidden border border-amber-100 bg-black/5 aspect-square"
                        title="Open photo"
                      >
                        <img
                          src={src}
                          alt={`Review photo ${i + 1}`}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}
                <div className="mt-4 font-bold text-gray-900">{review?.name}</div>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleAddReview}
            className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm"
          >
            <h3 className="text-lg font-bold text-gray-900">Share your experience</h3>
            <p className="mt-1 text-xs text-gray-500">
              Add a quick review about our taste, service, or ambience.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="review-name">
                  Your name
                </label>
                <input
                  id="review-name"
                  type="text"
                  value={newReviewName}
                  onChange={(e) => setNewReviewName(e.target.value)}
                  className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-900/70"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="review-text">
                  Your review
                </label>
                <textarea
                  id="review-text"
                  rows={4}
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-900/70 resize-none"
                  placeholder="How was the food and service?"
                />
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-700 mb-1">Your rating</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const starValue = i + 1
                    const active = starValue <= newReviewRating
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => setNewReviewRating(starValue)}
                        className="p-0.5"
                        aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
                      >
                        <FiStar
                          className={
                            active ? 'h-5 w-5 fill-amber-500 text-amber-500' : 'h-5 w-5 text-amber-300'
                          }
                        />
                      </button>
                    )
                  })}
                  <span className="ml-2 text-xs text-gray-500">{newReviewRating} / 5</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="review-photos">
                  Add photos (optional)
                </label>
                <input
                  ref={reviewPhotosInputRef}
                  id="review-photos"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handlePickReviewPhotos(e.target.files)}
                  className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-900/70"
                />
                <div className="mt-1 text-[11px] text-gray-500">
                  Up to {MAX_REVIEW_PHOTOS} photos, max 2MB each (saved in this browser).
                </div>
                {newReviewPhotos.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {newReviewPhotos.map((src, i) => (
                      <div
                        key={`${i}-${src.slice(0, 20)}`}
                        className="relative rounded-xl overflow-hidden border border-amber-100 bg-black/5 aspect-square"
                      >
                        <img
                          src={src}
                          alt={`Selected photo ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setNewReviewPhotos((prev) => prev.filter((_, idx) => idx !== i))
                          }
                          className="absolute right-1 top-1 rounded-lg bg-white/90 px-2 py-1 text-[11px] font-semibold text-red-800 hover:bg-white"
                          aria-label="Remove photo"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-red-900 hover:bg-red-800 text-amber-100 px-4 py-2 text-sm font-semibold w-full"
            >
              Submit review
            </button>
          </form>
        </div>
      </section>

      {/* Catering CTA */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-3xl overflow-hidden border border-amber-200 bg-red-900 text-amber-100 p-8 md:p-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="tamil text-xl font-bold">உங்கள் அனைத்து நிகழ்வுகளுக்கும் சிறந்த உணவு ஏற்பாடு</div>
            <h2 className="mt-2 text-2xl md:text-3xl font-extrabold">Catering & Function Orders</h2>
            <p className="mt-3 text-amber-100/90">
              Weddings, birthdays, engagements, corporate events — we provide customized menus and
              professional service.
            </p>
          </div>
          <div className="flex md:justify-end">
            <Link
              to="/catering"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-300 hover:bg-amber-200 text-red-950 px-6 py-3 font-extrabold"
            >
              Book Catering <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Contact</h2>
        <p className="mt-2 text-gray-600">Visit us or reach out on WhatsApp.</p>
        <div className="mt-6 grid lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-amber-100 bg-white p-5">
            <div className="font-bold text-gray-900">Address</div>
            <div className="text-sm text-gray-700 mt-2">
              X5GP+JC7, Thirukovilur Bypass Rd, Thapovanam, Tamil Nadu 605756
            </div>
            <div className="mt-4 text-sm">
              <div className="font-bold text-gray-900">Hours</div>
              <div className="text-gray-700 mt-1">Open 24 hours</div>
            </div>
            <div className="mt-4 text-sm">
              <div className="font-bold text-gray-900">Contact</div>
              <div className="text-gray-700 mt-1">WhatsApp & Mobile – 9585833661, 7305264245</div>
            </div>
            <a
              href="https://wa.me/919585833661"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-500 text-white px-5 py-3 font-semibold"
            >
              WhatsApp Us <FiArrowRight />
            </a>
          </div>
          <div className="rounded-2xl overflow-hidden border border-amber-100 bg-white">
            <img
              src="/images/friends.jpg"
              alt="Friends"
              loading="lazy"
              className="h-full w-full object-cover"
              onError={onImgError}
            />
          </div>
        </div>
      </section>

      {/* Hotel View */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Hotel View</h2>
            <p className="mt-2 text-gray-600">
              Embedded Google Street View so guests can virtually look around the restaurant area.
            </p>
          </div>
          <a
            href="https://www.google.com/maps?q=X5GP%2BJC7%2C%20Thapovanam%2C%20Tamil%20Nadu%20605756"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-5 py-3 font-semibold text-gray-800 hover:text-red-900"
          >
            Open in Google Maps <FiArrowRight />
          </a>
        </div>
        <div className="mt-6 rounded-2xl border border-amber-100 bg-black/5 overflow-hidden">
          <iframe
            title="360° Street View - Anjali Thaivazhi Unavagam"
            loading="lazy"
            className="w-full h-80 md:h-[28rem]"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps?q=X5GP%2BJC7%2C%20Thapovanam%2C%20Tamil%20Nadu%20605756&output=svembed"
            allowFullScreen
          />
        </div>
      </section>

      {/* Google Reviews */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Google Reviews</h2>
            <p className="mt-2 text-gray-600">See what guests say on Google and recent visitors.</p>
          </div>
          <a
            href="https://www.google.com/search?sca_esv=0546383d171bc4a7&sxsrf=ANbL-n7zhQi2JAtagegMhM5UTrcYiZ5v1Q:1773237760137&si=AL3DRZEsmMGCryMMFSHJ3StBhOdZ2-6yYkXd_doETEE1OR-qOS48_W-FJTaUUIzRhEDIHxNNj8UW0WAlE_ykmsOFUgMAUAEMRowABTx_JK58P5eI4PYQxz-ETJbyA3jXbHxaS7Edr-4Cb1igKdsdp9EoQAC6DJrdAA%3D%3D&q=Kongu+Nadu%28Veg+Restaurant%29+Reviews&sa=X&ved=2ahUKEwiz_a22gZiTAxWiWHADHYfvAngQ0bkNegQIOxAF&biw=1366&bih=633&dpr=1"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-red-900 hover:bg-red-800 text-amber-100 px-5 py-3 font-semibold"
          >
            View on Google <FiArrowRight />
          </a>
        </div>
      </section>


    </div>
  )
}


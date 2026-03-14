import CateringBooking from '../components/CateringBooking.jsx'
import { usePageMeta } from '../hooks/usePageMeta.js'

export default function Catering() {
  usePageMeta({
    title: 'Catering & Events | Anjali Thaivazhi Unavagam',
    description:
      'Catering services from Anjali Thaivazhi Unavagam for weddings, birthdays, corporate events and family functions across Tamil Nadu.',
    canonical: '/catering',
  })
  return (
    <div className="pt-4">
      <CateringBooking />
    </div>
  )
}


import TableBooking from '../components/TableBooking.jsx'
import { usePageMeta } from '../hooks/usePageMeta.js'

export default function Booking() {
  usePageMeta({
    title: 'Book a Table | Anjali Thaivazhi Unavagam',
    description:
      'Reserve your table at Anjali Thaivazhi Unavagam in Thapovanam. Quick online table booking for families, friends, and groups.',
    canonical: '/booking',
  })
  return (
    <div className="pt-4">
      <TableBooking />
    </div>
  )
}


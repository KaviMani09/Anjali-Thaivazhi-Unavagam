import MenuSection from '../components/MenuSection.jsx'
import { usePageMeta } from '../hooks/usePageMeta.js'

export default function Menu() {
  usePageMeta({
    title: 'Menu | Anjali Thaivazhi Unavagam',
    description:
      'View the full menu of Anjali Thaivazhi Unavagam — breakfast, meals, tiffin, snacks, juices and more with authentic Tamil flavors.',
    canonical: '/menu',
  })
  return (
    <div className="pt-4">
      <MenuSection />
    </div>
  )
}


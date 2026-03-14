import { useEffect } from 'react'

export function usePageMeta({ title, description, robots, canonical } = {}) {
  useEffect(() => {
    if (title) {
      document.title = title
    }

    if (description) {
      let meta = document.querySelector('meta[name="description"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'description'
        document.head.appendChild(meta)
      }
      meta.content = description
    }

    if (robots) {
      let meta = document.querySelector('meta[name="robots"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'robots'
        document.head.appendChild(meta)
      }
      meta.content = robots
    }

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]')
      if (!link) {
        link = document.createElement('link')
        link.rel = 'canonical'
        document.head.appendChild(link)
      }
      link.href = canonical
    }
  }, [title, description, robots, canonical])
}


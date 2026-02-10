import { useEffect, useState } from 'react'

export function useMediaQuery(query: string) {
  const getMatches = () =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false

  const [matches, setMatches] = useState(getMatches)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const handleChange = () => setMatches(mediaQuery.matches)
    handleChange()
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      mediaQuery.addListener(handleChange)
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [query])

  return matches
}

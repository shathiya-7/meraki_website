import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null

export type Movie = {
  id: string
  title: string
  release_year: number
  language: string
  image_url: string | null
  active: boolean
}

export type GameEntry = {
  id: string
  full_name: string
  roll_number: string
  language: string
  movie_id: string
  started_at: string
  finished_at: string | null
  answer: string | null
  status: 'correct' | 'incorrect' | 'timeout' | null
  elapsed_seconds: number | null
}

export type GameResult = {
  result_status: 'correct' | 'incorrect' | 'timeout'
  movie_title: string
  movie_year: number
  elapsed_seconds: number
  result_finished_at: string
}

export type LeaderboardEntry = {
  rank: number
  full_name: string
  masked_roll_number: string
  language: string
  elapsed_seconds: number
  prize: string
}

export async function resolveMovieArtwork(title: string, imageUrl: string | null) {
  if (imageUrl) return imageUrl

  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '900',
    titles: title,
    origin: '*',
  })
  const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`)
  if (!response.ok) throw new Error(`Artwork lookup failed (${response.status}).`)

  const result = await response.json() as {
    query?: { pages?: Record<string, { thumbnail?: { source?: string } }> }
  }
  const artwork = Object.values(result.query?.pages ?? {})[0]?.thumbnail?.source
  if (!artwork) throw new Error(`No movie artwork was found for "${title}".`)
  return artwork
}

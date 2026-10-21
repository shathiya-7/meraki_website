import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { GameEntry, GameResult, LeaderboardEntry, Movie, isSupabaseConfigured, resolveMovieArtwork, supabase } from './lib/supabase'
import festivalPoster from './assets/meraki-festival-poster.png'
import campusBanner from './assets/iiitdm-campus-banner.webp'
import iiitdmMiniLogo from './assets/iiitdm-mini-logo.jpg'
import merakiMerch from './assets/meraki-merch.png'
import merakiLogo from './assets/meraki-logo-2026.jpeg'

type View = 'home' | 'register' | 'challenge' | 'result' | 'leaderboard' | 'admin'
type Participant = {
  id: string
  name: string
  roll: string
  language: string
  startedAt: number
  finishedAt?: number
  answer?: string
  status?: 'correct' | 'incorrect' | 'timeout'
  movie: { title: string; year: number; language: string; imageUrl: string | null }
}

const HERO = festivalPoster
const languages = ['Tamil', 'English', 'Hindi', 'Telugu', 'Malayalam', 'Kannada', 'Other']

const icons = {
  ticket: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8.5a2.5 2.5 0 0 0 0 5V18h18v-4.5a2.5 2.5 0 0 0 0-5V4H3v4.5Z"/><path d="M9 4v14M9 8h.01M9 12h.01M9 16h.01"/></svg>
  ),
  arrow: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5"/></svg>,
  trophy: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 1v4m-4 3h8"/></svg>,
  clock: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
}

const SESSION_KEY = 'meraki-current-attempt'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured. Add the project URL and anon key to .env.local.')
  return supabase
}

function Brand() {
  return (
    <button className="brand" onClick={() => location.reload()}>
      <span className="brand-mark brand-image"><img src={merakiLogo} alt="" /></span>
      <span><b>MERAKI</b><small>IIITDM KANCHEEPURAM</small></span>
    </button>
  )
}

function App() {
  const [view, setView] = useState<View>('home')
  const [participant, setParticipant] = useState<Participant | null>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY)
      return stored ? JSON.parse(stored) as Participant : null
    } catch {
      return null
    }
  })
  const [eventOpen, setEventOpen] = useState(true)
  const [setupError, setSetupError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) return
    requireSupabase().from('event_settings').select('is_open').eq('id', 1).single()
      .then(({ data, error }) => {
        if (error) setSetupError(`Could not load event settings: ${error.message}`)
        else if (data) setEventOpen(data.is_open)
      })
  }, [])

  const navigate = (next: View) => {
    setView(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const updateParticipant = (next: Participant | null) => {
    if (next) sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
    else sessionStorage.removeItem(SESSION_KEY)
    setParticipant(next)
  }

  return (
    <div className="app">
      <nav>
        <Brand />
        <div className="nav-links">
          <button onClick={() => navigate('home')}>Home</button>
          <button onClick={() => navigate('leaderboard')}>Leaderboard</button>
          <button onClick={() => navigate('admin')}>Admin</button>
        </div>
        <button className="nav-cta" onClick={() => navigate(participant?.status ? 'result' : participant?.startedAt ? 'challenge' : 'register')}>
          Play now {icons.arrow}
        </button>
      </nav>

      {!isSupabaseConfigured && <div className="setup-notice">Connect Supabase to enable registration, live rankings, and the admin dashboard.</div>}
      {setupError && <div className="setup-notice">{setupError}</div>}
      {view === 'home' && <Home onStart={() => navigate('register')} onLeaderboard={() => navigate('leaderboard')} eventOpen={eventOpen} />}
      {view === 'register' && <Registration onBack={() => navigate('home')} onComplete={(p) => { updateParticipant(p); navigate('challenge') }} eventOpen={eventOpen} />}
      {view === 'challenge' && participant && <Challenge participant={participant} onComplete={(p) => { updateParticipant(p); navigate('result') }} />}
      {view === 'challenge' && !participant && <Registration onBack={() => navigate('home')} onComplete={(p) => { updateParticipant(p); navigate('challenge') }} eventOpen={eventOpen} />}
      {view === 'result' && participant && <Result participant={participant} onLeaderboard={() => navigate('leaderboard')} />}
      {view === 'leaderboard' && <Leaderboard onBack={() => navigate('home')} />}
      {view === 'admin' && <Admin eventOpen={eventOpen} setEventOpen={setEventOpen} />}
      <footer><Brand /><p>Made with curiosity at IIITDM Kancheepuram.</p><span>© 2025 Meraki · Movie challenge</span></footer>
    </div>
  )
}

function Home({ onStart, onLeaderboard, eventOpen }: { onStart: () => void; onLeaderboard: () => void; eventOpen: boolean }) {
  return (
    <main>
      <section className="hero">
        <div className="orb orb-one" /><div className="orb orb-two" />
        <div className="hero-copy">
          <div className="eyebrow"><span /> MERAKI PRESENTS · LIVE CAMPUS EVENT</div>
          <h1>Guess the Movie.<br /><em>Win the Mystery Box.</em></h1>
          <p>One frame. One iconic movie. One mystery prize. Can you guess it?</p>
          <div className="hero-actions">
            <button className="primary" onClick={onStart} disabled={!eventOpen}>{eventOpen ? 'Start challenge' : 'Event closed'} {icons.arrow}</button>
            <button className="secondary" onClick={onLeaderboard}>{icons.trophy} View leaderboard</button>
          </div>
          <div className="meta-row">
            <span>{icons.clock}<b>60 seconds</b> to answer</span>
            <span>{icons.ticket}<b>One shot.</b> Make it count.</span>
          </div>
        </div>
        <div className="hero-art">
          <div className="poster">
            <img src={HERO} alt="Meraki Movie Puzzle event poster featuring Indian cinema artwork" />
            <div className="poster-shade" />
            <div className="frame-label"><span>FRAME</span><b>?</b></div>
            <div className="film-holes top" /><div className="film-holes bottom" />
          </div>
          <div className="sticker sticker-one">60<small>SEC</small></div>
          <div className="sticker sticker-two">ONE<br />ATTEMPT</div>
        </div>
      </section>
      <section className="how">
        <div className="section-head"><div><span className="kicker">HOW IT WORKS</span><h2>Your shot at the box.</h2></div><p>No retakes. No second chances.<br />Just you and the movies.</p></div>
        <div className="steps">
          {[['01', 'Register', 'Tell us who you are and choose your preferred movie language.'], ['02', 'Decode the frame', 'A movie still is split into 16 mysterious pieces. Look closely.'], ['03', 'Make your guess', 'Type the movie title before the 60-second clock runs out.']].map(([n, title, copy]) => (
            <article key={n}><span className="step-num">{n}</span><div className="mini-icon">{n === '01' ? icons.ticket : n === '02' ? '▦' : icons.clock}</div><h3>{title}</h3><p>{copy}</p></article>
          ))}
        </div>
      </section>
      <section className="campus">
        <div className="campus-copy"><img src={iiitdmMiniLogo} alt="IIITDM Kancheepuram logo" /><div><span className="kicker">OUR CAMPUS</span><h2>Made at IIITDM Kancheepuram.</h2><p>Meraki brings our campus community together through creativity, curiosity, and a shared love of cinema.</p></div></div>
        <img className="campus-banner" src={campusBanner} alt="IIITDM Kancheepuram campus" />
      </section>
      <section className="prizes">
        <div><span className="kicker light">MYSTERY BOX REVEALED</span><h2>Fast eyes.<br /><i>Fresh fits.</i></h2><p>Top the leaderboard and take home exclusive Meraki gear.</p></div>
        <div className="prize-cards">
          <article className="first"><span>#1</span><div className="merch-crop hoodie"><img src={merakiMerch} alt="Meraki hoodie front and back" /></div><div><small>FIRST PLACE</small><h3>Meraki Hoodie</h3><p>Exclusive campus edition</p></div></article>
          <article><span>#2</span><div className="merch-crop tshirt"><img src={merakiMerch} alt="Meraki T-shirt front and back" /></div><div><small>SECOND PLACE</small><h3>Meraki T-shirt</h3><p>Limited event drop</p></div></article>
        </div>
      </section>
    </main>
  )
}

function Registration({ onBack, onComplete, eventOpen }: { onBack: () => void; onComplete: (p: Participant) => void; eventOpen: boolean }) {
  const [form, setForm] = useState({ name: '', roll: '', language: 'Tamil' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const clean = { ...form, name: form.name.trim(), roll: form.roll.trim().toUpperCase() }
    if (clean.name.length < 3 || !/^[A-Z0-9]{9}$/.test(clean.roll)) {
      setError('Enter your full name and a 9-character alphanumeric college roll number.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const { data, error: requestError } = await requireSupabase().rpc('register_game', {
        p_full_name: clean.name,
        p_roll_number: clean.roll,
        p_language: clean.language,
      })
      if (requestError) throw requestError
      const game = data?.[0]
      if (!game) throw new Error('The server did not create a game entry. Please try again.')
      onComplete({
        id: game.entry_id,
        name: clean.name,
        roll: clean.roll,
        language: game.movie_language,
        startedAt: new Date(game.started_at).getTime(),
        movie: {
          title: game.movie_title,
          year: game.movie_year,
          language: game.movie_language,
          imageUrl: game.movie_image_url,
        },
      })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not register. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <main className="page-shell">
      <button className="back" onClick={onBack}>← Back home</button>
      <div className="form-layout">
        <div className="form-intro"><span className="kicker">STEP 01 · REGISTER</span><h1>Ready for your<br /><em>close-up?</em></h1><p>Your timer starts only after registration. Choose carefully—there’s just one attempt.</p><div className="privacy-card"><b>Privacy, always.</b><p>Your details are used only to run this event and announce winners.</p></div></div>
        <form className="event-form" onSubmit={submit}>
          <div className="form-top"><span>ADMIT ONE</span><b>MERAKI<br />MOVIE CHALLENGE</b><small>60 SEC · 1 ATTEMPT</small></div>
          <label>Full name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Aditi Sharma" autoFocus /></label>
          <label>College roll number<input value={form.roll} maxLength={9} onChange={(e) => setForm({ ...form, roll: e.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 9) })} placeholder="9 letters or numbers" /></label>
          <label>Preferred language<select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>{languages.map((l) => <option key={l} value={l}>{l === 'Other' ? 'Other (world cinema)' : l}</option>)}</select></label>
          {error && <p className="error">{error}</p>}
          <button className="primary wide" disabled={!eventOpen || submitting}>{!eventOpen ? 'Event is currently closed' : submitting ? 'Starting…' : 'Enter the challenge'} {icons.arrow}</button>
          <p className="fine">By continuing, you agree to the event rules and privacy notice.</p>
        </form>
      </div>
    </main>
  )
}

function Challenge({ participant, onComplete }: { participant: Participant; onComplete: (p: Participant) => void }) {
  const [answer, setAnswer] = useState('')
  const [seconds, setSeconds] = useState(Math.max(0, 60 - Math.floor((Date.now() - (participant.startedAt || Date.now())) / 1000)))
  const [imageUrl, setImageUrl] = useState(participant.movie.imageUrl)
  const [imageError, setImageError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const finished = useRef(false)

  useEffect(() => {
    let cancelled = false
    resolveMovieArtwork(participant.movie.title, participant.movie.imageUrl)
      .then((url) => { if (!cancelled) setImageUrl(url) })
      .catch((error: unknown) => { if (!cancelled) setImageError(error instanceof Error ? error.message : 'Movie artwork could not be loaded.') })
    return () => { cancelled = true }
  }, [participant.movie.title, participant.movie.imageUrl])

  const finalize = async (value = '') => {
    if (finished.current) return
    finished.current = true
    setSubmitting(true)
    setSubmitError('')
    try {
      const { data, error } = await requireSupabase().rpc('finish_game', {
        p_entry_id: participant.id,
        p_answer: value,
      })
      if (error) throw error
      const result = data?.[0] as GameResult | undefined
      if (!result) throw new Error('The server did not return a result. Please try again.')
      onComplete({
        ...participant,
        answer: value || undefined,
        status: result.result_status,
        finishedAt: new Date(result.result_finished_at).getTime(),
        movie: { ...participant.movie, title: result.movie_title, year: result.movie_year },
      })
    } catch (error) {
      finished.current = false
      setSubmitError(error instanceof Error ? error.message : 'Could not submit your answer. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    let active = true
    const id = window.setInterval(() => {
      const left = Math.max(0, 60 - Math.floor((Date.now() - participant.startedAt) / 1000))
      setSeconds(left)
      if (!left && active) { clearInterval(id); void finalize() }
    }, 250)
    return () => { active = false; clearInterval(id) }
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!answer.trim()) return
    void finalize(answer.trim())
  }

  return (
    <main className="challenge-page">
      <div className="challenge-head"><div><span className="kicker light">THE FRAME · {participant.movie.language.toUpperCase()}</span><h1>Name that movie.</h1></div><div className={`timer ${seconds < 11 ? 'danger' : ''}`}><span>{icons.clock}</span><b>{String(seconds).padStart(2, '0')}</b><small>SECONDS</small></div></div>
      <div className="challenge-layout">
        <div className={`puzzle ${imageUrl ? '' : 'puzzle-loading'}`} aria-label="Movie artwork split into sixteen tiles">
          {imageUrl ? Array.from({ length: 16 }).map((_, i) => <div key={i} style={{ backgroundImage: `url("${imageUrl.replace(/["\\]/g, '\\$&')}")`, backgroundPosition: `${(i % 4) * 33.33}% ${Math.floor(i / 4) * 33.33}%` }}><span>{String(i + 1).padStart(2, '0')}</span></div>) : <p>{imageError || 'Loading movie artwork…'}</p>}
        </div>
        <form className="guess-panel" onSubmit={submit}><span className="kicker">YOUR ONE SHOT</span><h2>What’s the movie?</h2><p>Type the full title. Capitalization doesn’t matter.</p><label>Your answer<input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Enter movie title…" autoFocus disabled={submitting} /></label>{submitError && <p className="error">{submitError}</p>}<button className="primary wide" disabled={!answer.trim() || submitting}>{submitting ? 'Submitting…' : 'Lock my answer'} {icons.arrow}</button><div className="warning">Once submitted, your answer cannot be changed.</div></form>
      </div>
    </main>
  )
}

function Result({ participant, onLeaderboard }: { participant: Participant; onLeaderboard: () => void }) {
  const copy = participant.status === 'correct' ? ['That’s a wrap!', 'You got it right. Your speed has been recorded.'] : participant.status === 'timeout' ? ['Time’s up.', 'The final frame faded before your answer arrived.'] : ['So close.', 'Not this time—but every great movie deserves a rewatch.']
  return <main className="result-page"><div className={`result-icon ${participant.status}`}>{participant.status === 'correct' ? '✓' : participant.status === 'timeout' ? '⌛' : '×'}</div><span className="kicker">{participant.status?.toUpperCase()}</span><h1>{copy[0]}</h1><p>{copy[1]}</p><div className="answer-reveal"><small>THE MOVIE WAS</small><h2>{participant.movie.title}</h2><span>{participant.movie.language} · {participant.movie.year}</span></div><button className="primary" onClick={onLeaderboard}>{icons.trophy} See leaderboard</button></main>
}

function Leaderboard({ onBack }: { onBack: () => void }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError('Connect Supabase to load the live leaderboard.')
      setLoading(false)
      return
    }
    requireSupabase().rpc('get_leaderboard').then(({ data, error: requestError }) => {
      if (requestError) setError(`Could not load leaderboard: ${requestError.message}`)
      else setEntries(data ?? [])
      setLoading(false)
    })
  }, [])

  return <main className="leader-page"><button className="back" onClick={onBack}>← Back home</button><div className="leader-head"><span className="kicker light">LIVE RANKINGS</span><h1>Fastest on the <em>draw.</em></h1><p>Correct answers ranked by completion time.</p></div><div className="leader-card"><div className="table-head"><span>RANK</span><span>PLAYER</span><span>LANGUAGE</span><span>TIME</span><span>PRIZE</span></div>{entries.map((entry) => <div className="leader-row" key={entry.rank}><b className={`rank r${entry.rank}`}>{entry.rank}</b><div><strong>{entry.full_name}</strong><small>{entry.masked_roll_number}</small></div><span>{entry.language}</span><b>{entry.elapsed_seconds.toFixed(2)}s</b><span className="award">{entry.prize}</span></div>)}{!loading && !entries.length && <p className="empty">{error || 'No verified correct answers yet. Be the first on the board!'}</p>}{loading && <p className="empty">Loading live rankings…</p>}{error && entries.length > 0 && <p className="error">{error}</p>}</div><p className="leader-note">Roll numbers are partially hidden for participant privacy.</p></main>
}

function MovieArtwork({ movie, onSave }: { movie: Movie; onSave?: (url: string) => Promise<void> }) {
  const [url, setUrl] = useState(movie.image_url)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (movie.image_url) {
      setUrl(movie.image_url)
      return
    }
    let cancelled = false
    resolveMovieArtwork(movie.title, null)
      .then((image) => { if (!cancelled) setUrl(image) })
      .catch((lookupError: unknown) => { if (!cancelled) setError(lookupError instanceof Error ? lookupError.message : 'Artwork unavailable.') })
    return () => { cancelled = true }
  }, [movie.id, movie.title, movie.image_url])

  const saveImage = async () => {
    if (!onSave || !url) return
    setSaving(true)
    setError('')
    try {
      await onSave(url)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this artwork.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="movie-artwork">{url ? <img src={url} alt={`${movie.title} (${movie.release_year})`} loading="lazy" /> : <div className="movie-artwork-empty">{error || 'Finding artwork…'}</div>}{onSave && url && !movie.image_url && <button type="button" onClick={saveImage} disabled={saving}>{saving ? 'Saving…' : 'Save artwork'}</button>}{error && url && <small className="error">{error}</small>}</div>
}

function Admin({ eventOpen, setEventOpen }: { eventOpen: boolean; setEventOpen: (v: boolean) => void }) {
  const [logged, setLogged] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [query, setQuery] = useState('')
  const [entries, setEntries] = useState<GameEntry[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [language, setLanguage] = useState(languages[0])
  const [movieForm, setMovieForm] = useState({ title: '', release_year: '', language: languages[0], image_url: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const loadAdminData = async () => {
    const client = requireSupabase()
    const [entryResult, movieResult] = await Promise.all([
      client.from('game_entries').select('*').order('created_at', { ascending: false }),
      client.from('movies').select('*').order('language').order('title'),
    ])
    if (entryResult.error) throw entryResult.error
    if (movieResult.error) throw movieResult.error
    setEntries(entryResult.data ?? [])
    setMovies(movieResult.data ?? [])
    setLogged(true)
  }

  const verifyAdmin = async () => {
    const { data, error: roleError } = await requireSupabase().rpc('is_event_admin')
    if (roleError) throw roleError
    if (!data) {
      await requireSupabase().auth.signOut()
      throw new Error('This account is not authorized for the admin dashboard.')
    }
    await loadAdminData()
  }

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false
    requireSupabase().auth.getSession().then(async ({ data, error: sessionError }) => {
      if (sessionError) {
        if (!cancelled) setError(sessionError.message)
        return
      }
      if (cancelled || !data.session) return
      try {
        await verifyAdmin()
      } catch (sessionCheckError) {
        if (!cancelled) setError(sessionCheckError instanceof Error ? sessionCheckError.message : 'Could not validate admin access.')
      }
    })
    return () => { cancelled = true }
  }, [])

  const signIn = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { error: authError } = await requireSupabase().auth.signInWithPassword({ email: email.trim(), password })
      if (authError) throw authError
      await verifyAdmin()
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Could not sign in.')
    } finally {
      setBusy(false)
    }
  }

  const filtered = useMemo(() => entries.filter((entry) => `${entry.full_name} ${entry.roll_number}`.toLowerCase().includes(query.toLowerCase())), [entries, query])
  const correctCount = entries.filter((entry) => entry.status === 'correct').length
  const csv = () => {
    const rows = [['Name', 'Roll', 'Language', 'Status', 'Answer', 'Started at', 'Finished at', 'Time (seconds)'], ...entries.map((entry) => [entry.full_name, entry.roll_number, entry.language, entry.status || 'In progress', entry.answer || '', entry.started_at, entry.finished_at || '', entry.elapsed_seconds?.toString() || ''])]
    const csvData = rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csvData], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'meraki-participants.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const updateEventStatus = async () => {
    setBusy(true)
    setError('')
    try {
      const { error: updateError } = await requireSupabase().from('event_settings').update({ is_open: !eventOpen, updated_at: new Date().toISOString() }).eq('id', 1)
      if (updateError) throw updateError
      setEventOpen(!eventOpen)
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update event status.')
    } finally {
      setBusy(false)
    }
  }

  const addMovie = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { data, error: insertError } = await requireSupabase().from('movies').insert({
        title: movieForm.title.trim(),
        release_year: Number(movieForm.release_year),
        language: movieForm.language,
        image_url: movieForm.image_url.trim() || null,
      }).select().single()
      if (insertError) throw insertError
      setMovies((current) => [...current, data as Movie].sort((a, b) => a.title.localeCompare(b.title)))
      setMovieForm({ title: '', release_year: '', language, image_url: '' })
    } catch (insertError) {
      setError(insertError instanceof Error ? insertError.message : 'Could not add movie.')
    } finally {
      setBusy(false)
    }
  }

  const changeMovie = async (movie: Movie, changes: Partial<Movie>) => {
    const { error: updateError } = await requireSupabase().from('movies').update(changes).eq('id', movie.id)
    if (updateError) throw updateError
    setMovies((current) => current.map((item) => item.id === movie.id ? { ...item, ...changes } : item))
  }

  const signOut = async () => {
    const { error: signOutError } = await requireSupabase().auth.signOut()
    if (signOutError) setError(signOutError.message)
    else setLogged(false)
  }

  if (!isSupabaseConfigured) return <main className="admin-login"><div className="admin-mark">M</div><span className="kicker">ORGANIZER ACCESS</span><h1>Admin dashboard</h1><p>Connect this app to Supabase before signing in.</p></main>
  if (!logged) return <main className="admin-login"><div className="admin-mark">M</div><span className="kicker">ORGANIZER ACCESS</span><h1>Admin dashboard</h1><p>Sign in with an admin account provisioned in Supabase.</p><form onSubmit={signIn}><input type="email" autoComplete="username" placeholder="Admin email" value={email} onChange={(event) => setEmail(event.target.value)} required /><input type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button className="primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} {icons.arrow}</button></form>{error && <p className="error">{error}</p>}<small>Admin access is protected by Supabase Auth and a database admin role.</small></main>

  const filteredMovies = movies.filter((movie) => movie.language === language)
  return <main className="admin-page"><div className="admin-header"><div><span className="kicker">MERAKI CONTROL ROOM</span><h1>Event overview</h1></div><div className="admin-actions"><button className={eventOpen ? 'status-open' : 'status-closed'} onClick={updateEventStatus} disabled={busy}><span /> Event {eventOpen ? 'open' : 'closed'}</button><button onClick={signOut}>Sign out</button></div></div>{error && <p className="error">{error}</p>}<div className="stats"><article><small>REGISTRATIONS</small><b>{entries.length}</b><span>All participants</span></article><article><small>CORRECT</small><b>{correctCount}</b><span>Completed answers</span></article><article><small>IN PROGRESS</small><b>{entries.filter((entry) => entry.started_at && !entry.status).length}</b><span>Active attempts</span></article><article><small>TIMEOUTS</small><b>{entries.filter((entry) => entry.status === 'timeout').length}</b><span>Clock expired</span></article></div><section className="admin-table"><div className="tools"><div><h2>Participants</h2><p>Registration, answers, and server timestamps.</p></div><input placeholder="Search name or roll…" value={query} onChange={(event) => setQuery(event.target.value)} /><button onClick={csv}>Export CSV</button></div><div className="admin-rows"><div className="admin-row header"><span>PARTICIPANT</span><span>LANGUAGE</span><span>STATUS</span><span>TIME</span><span>REGISTERED · FINISHED</span></div>{filtered.length ? filtered.map((entry) => <div className="admin-row" key={entry.id}><span><b>{entry.full_name}</b><small>{entry.roll_number}</small><small>Answer: {entry.answer || '—'}</small></span><span>{entry.language}</span><span><i className={`pill ${entry.status || 'progress'}`}>{entry.status || 'In progress'}</i></span><span>{entry.elapsed_seconds === null ? '—' : `${entry.elapsed_seconds.toFixed(2)}s`}</span><span><small>{new Date(entry.started_at).toLocaleString()}</small><small>{entry.finished_at ? new Date(entry.finished_at).toLocaleString() : 'Not finished'}</small></span></div>) : <p className="empty">No participant records yet.</p>}</div></section><section className="movie-library"><div className="library-heading"><div><h2>Movie library</h2><p>{movies.length} titles · 10 seeded titles per language. Disabling a title preserves past game records.</p></div><label>Language<select value={language} onChange={(event) => setLanguage(event.target.value)}>{languages.map((item) => <option key={item} value={item}>{item === 'Other' ? 'Other (world cinema)' : item}</option>)}</select></label></div><form className="movie-form" onSubmit={addMovie}><input placeholder="Movie title" value={movieForm.title} onChange={(event) => setMovieForm({ ...movieForm, title: event.target.value })} required /><input type="number" min="1888" max="2100" placeholder="Year" value={movieForm.release_year} onChange={(event) => setMovieForm({ ...movieForm, release_year: event.target.value })} required /><select value={movieForm.language} onChange={(event) => setMovieForm({ ...movieForm, language: event.target.value })}>{languages.map((item) => <option key={item} value={item}>{item === 'Other' ? 'Other (world cinema)' : item}</option>)}</select><input type="url" placeholder="Artwork URL (optional)" value={movieForm.image_url} onChange={(event) => setMovieForm({ ...movieForm, image_url: event.target.value })} /><button className="primary" disabled={busy}>Add movie</button></form><div className="movie-catalog">{filteredMovies.map((movie) => <article className={`movie-card ${movie.active ? '' : 'inactive'}`} key={movie.id}><MovieArtwork movie={movie} onSave={(url) => changeMovie(movie, { image_url: url })} /><div><b>{movie.title}</b><span>{movie.release_year} · {movie.language}</span><button onClick={() => changeMovie(movie, { active: !movie.active }).catch((toggleError: unknown) => setError(toggleError instanceof Error ? toggleError.message : 'Could not update movie.'))}>{movie.active ? 'Remove from game' : 'Restore movie'}</button></div></article>)}</div>{!filteredMovies.length && <p className="empty">No movies in this category yet. Add one above.</p>}</section></main>
}

export default App

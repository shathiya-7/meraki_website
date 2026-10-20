import { FormEvent, useEffect, useMemo, useState } from 'react'
import festivalPoster from './assets/meraki-festival-poster.png'
import campusBanner from './assets/iiitdm-campus-banner.webp'
import iiitdmMiniLogo from './assets/iiitdm-mini-logo.jpg'
import merakiMerch from './assets/meraki-merch.png'
import merakiLogo from './assets/meraki-logo-2026.jpeg'
import puzzleTheme from './assets/meraki-puzzle-theme.jpeg'

type View = 'home' | 'register' | 'challenge' | 'result' | 'leaderboard' | 'admin'
type Participant = {
  name: string
  roll: string
  language: string
  startedAt?: number
  finishedAt?: number
  answer?: string
  status?: 'correct' | 'incorrect' | 'timeout'
  movie?: Movie
}
type Movie = { title: string; year: number; language: string }

const HERO = festivalPoster
const PUZZLE = puzzleTheme
const languages = ['Tamil', 'English', 'Hindi', 'Telugu', 'Malayalam', 'Kannada', 'Other']
const movieSets: Record<string, string[]> = {
  Tamil: ['Enthiran', 'Aadukalam', 'Thuppakki', 'Raja Rani', 'Kaththi', 'Thani Oruvan', 'Kabali', 'Vikram Vedha', '96', 'Kaithi'],
  English: ['Inception', 'Interstellar', 'Whiplash', 'Mad Max Fury Road', 'La La Land', 'Get Out', 'Coco', 'Avengers Endgame', 'Joker', 'Tenet'],
  Telugu: ['Eega', 'Mirchi', 'Manam', 'Baahubali', 'Kshanam', 'Arjun Reddy', 'Rangasthalam', 'Jersey', 'Ala Vaikunthapurramuloo', 'Colour Photo'],
  Hindi: ['Zindagi Na Milegi Dobara', 'Barfi', 'Queen', 'PK', 'Bajrangi Bhaijaan', 'Dangal', 'Hindi Medium', 'Andhadhun', 'Gully Boy', 'Ludo'],
  Malayalam: ['Drishyam', 'Bangalore Days', 'Premam', 'Charlie', 'Maheshinte Prathikaaram', 'Kumbalangi Nights', 'Take Off', 'Uyare', 'Ayyappanum Koshiyum', 'Minnal Murali'],
  Kannada: ['Lucia', 'U Turn', 'Kirik Party', 'Rangitaranga', 'Avane Srimannarayana', 'Dia', 'Garuda Gamana Vrishabha Vahana', '777 Charlie', 'Kantara', 'Sapta Sagaradaache Ello'],
  Other: ['Parasite', 'Spirited Away', 'Amélie', 'Pan’s Labyrinth', 'Roma', 'Cinema Paradiso', 'The Lives of Others', 'Run Lola Run', 'Crouching Tiger, Hidden Dragon', 'The Intouchables'],
}

const icons = {
  ticket: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8.5a2.5 2.5 0 0 0 0 5V18h18v-4.5a2.5 2.5 0 0 0 0-5V4H3v4.5Z"/><path d="M9 4v14M9 8h.01M9 12h.01M9 16h.01"/></svg>
  ),
  arrow: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5"/></svg>,
  trophy: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 1v4m-4 3h8"/></svg>,
  clock: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
}

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
const maskRoll = (roll: string) => `${roll.slice(0, 3)}${'•'.repeat(Math.max(3, roll.length - 5))}${roll.slice(-2)}`
const readParticipants = (): Participant[] => JSON.parse(localStorage.getItem('meraki-participants') || '[]')
const saveParticipants = (list: Participant[]) => localStorage.setItem('meraki-participants', JSON.stringify(list))

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
    const roll = localStorage.getItem('meraki-current')
    return roll ? readParticipants().find((p) => p.roll === roll) || null : null
  })
  const [eventOpen, setEventOpen] = useState(() => localStorage.getItem('meraki-open') !== 'false')

  const navigate = (next: View) => {
    setView(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const updateParticipant = (next: Participant) => {
    const all = readParticipants()
    const index = all.findIndex((p) => p.roll === next.roll)
    if (index >= 0) all[index] = next
    else all.push(next)
    saveParticipants(all)
    localStorage.setItem('meraki-current', next.roll)
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

      {view === 'home' && <Home onStart={() => navigate('register')} onLeaderboard={() => navigate('leaderboard')} eventOpen={eventOpen} />}
      {view === 'register' && <Registration onBack={() => navigate('home')} onComplete={(p) => { updateParticipant(p); navigate('challenge') }} eventOpen={eventOpen} />}
      {view === 'challenge' && participant && <Challenge participant={participant} onUpdate={updateParticipant} onFinish={() => navigate('result')} />}
      {view === 'challenge' && !participant && <Registration onBack={() => navigate('home')} onComplete={(p) => { updateParticipant(p); navigate('challenge') }} eventOpen={eventOpen} />}
      {view === 'result' && participant && <Result participant={participant} onLeaderboard={() => navigate('leaderboard')} />}
      {view === 'leaderboard' && <Leaderboard onBack={() => navigate('home')} />}
      {view === 'admin' && <Admin eventOpen={eventOpen} setEventOpen={(open) => { setEventOpen(open); localStorage.setItem('meraki-open', String(open)) }} />}
      <footer><Brand /><p>Made with curiosity at IIITDM Kancheepuram.</p><span>© 2025 Meraki · Frontend event demo</span></footer>
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
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const clean = { ...form, name: form.name.trim(), roll: form.roll.trim().toUpperCase() }
    if (clean.name.length < 3 || !/^[A-Z0-9/-]{4,20}$/.test(clean.roll)) return setError('Enter a valid full name and college roll number.')
    const existing = readParticipants().find((p) => p.roll === clean.roll)
    if (existing) return setError('This roll number has already registered. One entry per participant.')
    const titles = movieSets[clean.language] ?? movieSets.Other
    const title = titles[Math.floor(Math.random() * titles.length)]
    onComplete({ ...clean, movie: { title, language: clean.language, year: 2011 + Math.floor(Math.random() * 10) }, startedAt: Date.now() })
  }
  return (
    <main className="page-shell">
      <button className="back" onClick={onBack}>← Back home</button>
      <div className="form-layout">
        <div className="form-intro"><span className="kicker">STEP 01 · REGISTER</span><h1>Ready for your<br /><em>close-up?</em></h1><p>Your timer starts only after registration. Choose carefully—there’s just one attempt.</p><div className="privacy-card"><b>Privacy, always.</b><p>Your details are used only to run this event and announce winners.</p></div></div>
        <form className="event-form" onSubmit={submit}>
          <div className="form-top"><span>ADMIT ONE</span><b>MERAKI<br />MOVIE CHALLENGE</b><small>60 SEC · 1 ATTEMPT</small></div>
          <label>Full name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Aditi Sharma" autoFocus /></label>
          <label>College roll number<input value={form.roll} onChange={(e) => setForm({ ...form, roll: e.target.value })} placeholder="e.g. CS22B1042" /></label>
          <label>Preferred language<select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>{languages.map((l) => <option key={l}>{l}</option>)}</select></label>
          {error && <p className="error">{error}</p>}
          <button className="primary wide" disabled={!eventOpen}>{eventOpen ? 'Enter the challenge' : 'Event is currently closed'} {icons.arrow}</button>
          <p className="fine">By continuing, you agree to the event rules and privacy notice.</p>
        </form>
      </div>
    </main>
  )
}

function Challenge({ participant, onUpdate, onFinish }: { participant: Participant; onUpdate: (p: Participant) => void; onFinish: () => void }) {
  const [answer, setAnswer] = useState('')
  const [seconds, setSeconds] = useState(Math.max(0, 60 - Math.floor((Date.now() - (participant.startedAt || Date.now())) / 1000)))
  const finalize = (status: Participant['status'], value = '') => {
    if (participant.status) return
    onUpdate({ ...participant, answer: value, status, finishedAt: Date.now() })
    onFinish()
  }
  useEffect(() => {
    if (participant.status) return onFinish()
    const id = window.setInterval(() => {
      const left = Math.max(0, 60 - Math.floor((Date.now() - (participant.startedAt || Date.now())) / 1000))
      setSeconds(left)
      if (!left) { clearInterval(id); finalize('timeout') }
    }, 250)
    return () => clearInterval(id)
  }, [])
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!answer.trim()) return
    finalize(normalize(answer) === normalize(participant.movie?.title || '') ? 'correct' : 'incorrect', answer.trim())
  }
  return (
    <main className="challenge-page">
      <div className="challenge-head"><div><span className="kicker light">THE FRAME · {participant.movie?.language.toUpperCase()}</span><h1>Name that movie.</h1></div><div className={`timer ${seconds < 11 ? 'danger' : ''}`}><span>{icons.clock}</span><b>{String(seconds).padStart(2, '0')}</b><small>SECONDS</small></div></div>
      <div className="challenge-layout">
        <div className="puzzle" aria-label="Blurred movie frame split into sixteen tiles">
          {Array.from({ length: 16 }).map((_, i) => <div key={i} style={{ backgroundImage: `url(${PUZZLE})`, backgroundPosition: `${(i % 4) * 33.33}% ${Math.floor(i / 4) * 33.33}%` }}><span>{String(i + 1).padStart(2, '0')}</span></div>)}
        </div>
        <form className="guess-panel" onSubmit={submit}><span className="kicker">YOUR ONE SHOT</span><h2>What’s the movie?</h2><p>Type the full title. Capitalization doesn’t matter.</p><label>Your answer<input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Enter movie title…" autoFocus /></label><button className="primary wide" disabled={!answer.trim()}>Lock my answer {icons.arrow}</button><div className="warning">Once submitted, your answer cannot be changed.</div></form>
      </div>
    </main>
  )
}

function Result({ participant, onLeaderboard }: { participant: Participant; onLeaderboard: () => void }) {
  const copy = participant.status === 'correct' ? ['That’s a wrap!', 'You got it right. Your speed has been recorded.'] : participant.status === 'timeout' ? ['Time’s up.', 'The final frame faded before your answer arrived.'] : ['So close.', 'Not this time—but every great movie deserves a rewatch.']
  return <main className="result-page"><div className={`result-icon ${participant.status}`}>{participant.status === 'correct' ? '✓' : participant.status === 'timeout' ? '⌛' : '×'}</div><span className="kicker">{participant.status?.toUpperCase()}</span><h1>{copy[0]}</h1><p>{copy[1]}</p><div className="answer-reveal"><small>THE MOVIE WAS</small><h2>{participant.movie?.title}</h2><span>{participant.movie?.language} · {participant.movie?.year}</span></div><button className="primary" onClick={onLeaderboard}>{icons.trophy} See leaderboard</button></main>
}

function Leaderboard({ onBack }: { onBack: () => void }) {
  const ranked = readParticipants().filter((p) => p.status === 'correct').sort((a, b) => ((a.finishedAt! - a.startedAt!) - (b.finishedAt! - b.startedAt!)) || (a.finishedAt! - b.finishedAt!))
  const demo = ranked.length ? ranked : [
    { name: 'Nila Krishnan', roll: 'CS22B1042', startedAt: 0, finishedAt: 12400, language: 'Tamil' },
    { name: 'Arjun Mehta', roll: 'EC23B1018', startedAt: 0, finishedAt: 15800, language: 'Hindi' },
    { name: 'Diya Rao', roll: 'ME22B1031', startedAt: 0, finishedAt: 19100, language: 'Telugu' },
  ] as Participant[]
  return <main className="leader-page"><button className="back" onClick={onBack}>← Back home</button><div className="leader-head"><span className="kicker light">LIVE RANKINGS</span><h1>Fastest on the <em>draw.</em></h1><p>Correct answers ranked by completion time.</p></div><div className="leader-card"><div className="table-head"><span>RANK</span><span>PLAYER</span><span>LANGUAGE</span><span>TIME</span><span>PRIZE</span></div>{demo.map((p, i) => <div className="leader-row" key={p.roll}><b className={`rank r${i + 1}`}>{i + 1}</b><div><strong>{p.name}</strong><small>{maskRoll(p.roll)}</small></div><span>{p.language}</span><b>{((p.finishedAt! - p.startedAt!) / 1000).toFixed(1)}s</b><span className="award">{i === 0 ? 'Meraki Hoodie' : i === 1 ? 'Meraki T-shirt' : '—'}</span></div>)}</div><p className="leader-note">{ranked.length ? `${ranked.length} verified correct answer${ranked.length === 1 ? '' : 's'}` : 'Preview data shown until the first correct answer arrives.'}</p></main>
}

function Admin({ eventOpen, setEventOpen }: { eventOpen: boolean; setEventOpen: (v: boolean) => void }) {
  const [logged, setLogged] = useState(false)
  const [password, setPassword] = useState('')
  const [query, setQuery] = useState('')
  const participants = useMemo(() => readParticipants(), [logged])
  if (!logged) return <main className="admin-login"><div className="admin-mark">M</div><span className="kicker">ORGANIZER ACCESS</span><h1>Admin dashboard</h1><p>Frontend demo access: <b>meraki2025</b></p><form onSubmit={(e) => { e.preventDefault(); if (password === 'meraki2025') setLogged(true) }}><input type="password" placeholder="Admin password" value={password} onChange={(e) => setPassword(e.target.value)} /><button className="primary">Sign in {icons.arrow}</button></form><small>In production, authentication must be validated by a secure backend.</small></main>
  const filtered = participants.filter((p) => `${p.name} ${p.roll}`.toLowerCase().includes(query.toLowerCase()))
  const csv = () => {
    const rows = [['Name', 'Roll', 'Language', 'Status', 'Answer'], ...participants.map((p) => [p.name, p.roll, p.language, p.status || 'In progress', p.answer || ''])]
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' })); a.download = 'meraki-participants.csv'; a.click()
  }
  return <main className="admin-page"><div className="admin-header"><div><span className="kicker">MERAKI CONTROL ROOM</span><h1>Event overview</h1></div><button className={eventOpen ? 'status-open' : 'status-closed'} onClick={() => setEventOpen(!eventOpen)}><span /> Event {eventOpen ? 'open' : 'closed'}</button></div><div className="stats"><article><small>REGISTRATIONS</small><b>{participants.length}</b><span>All participants</span></article><article><small>CORRECT</small><b>{participants.filter((p) => p.status === 'correct').length}</b><span>Completed answers</span></article><article><small>IN PROGRESS</small><b>{participants.filter((p) => p.startedAt && !p.status).length}</b><span>Active attempts</span></article><article><small>TIMEOUTS</small><b>{participants.filter((p) => p.status === 'timeout').length}</b><span>Clock expired</span></article></div><div className="admin-grid"><section className="admin-table"><div className="tools"><div><h2>Participants</h2><p>Search registrations and attempt status.</p></div><input placeholder="Search name or roll…" value={query} onChange={(e) => setQuery(e.target.value)} /><button onClick={csv}>Export CSV</button></div><div className="admin-rows"><div className="admin-row header"><span>PARTICIPANT</span><span>LANGUAGE</span><span>STATUS</span><span>TIME</span></div>{filtered.length ? filtered.map((p) => <div className="admin-row" key={p.roll}><span><b>{p.name}</b><small>{p.roll}</small></span><span>{p.language}</span><span><i className={`pill ${p.status || 'progress'}`}>{p.status || 'In progress'}</i></span><span>{p.finishedAt && p.startedAt ? `${((p.finishedAt - p.startedAt) / 1000).toFixed(1)}s` : '—'}</span></div>) : <p className="empty">No participant records yet.</p>}</div></section><aside className="movie-config"><h2>Movie library</h2><p>{Object.values(movieSets).reduce((count, titles) => count + titles.length, 0)} titles · {Object.keys(movieSets).length} languages</p>{Object.entries(movieSets).map(([lang, list]) => <div key={lang}><span>{lang}</span><b>{list.length} movies</b></div>)}<button onClick={() => alert('Movie configuration is read-only in this frontend demo.')}>Configure movies</button></aside></div></main>
}

export default App

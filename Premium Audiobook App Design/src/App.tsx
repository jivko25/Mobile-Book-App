import { useState, useEffect } from 'react'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type Screen = 'library' | 'import' | 'processing' | 'detail' | 'player' | 'search' | 'settings'

interface Chapter {
  id: number
  numeral: string
  title: string
  duration: string
  progress: number // 0–100
}

interface Book {
  id: number
  title: string
  subtitle?: string
  author: string
  narrator: string
  year: string
  genre: string
  bg: string
  accent: string
  progress: number
  totalDuration: string
  lastChapterId?: number
  lastPosition?: string
  synopsis: string
  chapters: Chapter[]
}

// ─────────────────────────────────────────────
// Sample Data
// ─────────────────────────────────────────────

const BOOKS: Book[] = [
  {
    id: 1,
    title: 'Hamlet',
    subtitle: 'Prince of Denmark',
    author: 'William Shakespeare',
    narrator: 'Kenneth Branagh',
    year: 'c. 1600',
    genre: 'Tragedy',
    bg: '#2C1810',
    accent: '#C9A84C',
    progress: 42,
    totalDuration: '4h 23m',
    lastChapterId: 2,
    lastPosition: '1:14:33',
    synopsis:
      'The ghost of King Hamlet walks the battlements of Elsinore, and a son must choose between filial piety and his own tormented nature. A drama of revenge, madness, and mortality that has enthralled audiences for four centuries.',
    chapters: [
      { id: 1, numeral: 'I', title: 'The Ghost of the King', duration: '52m', progress: 100 },
      { id: 2, numeral: 'II', title: 'The Players Come to Elsinore', duration: '48m', progress: 67 },
      { id: 3, numeral: 'III', title: 'To Be, or Not to Be', duration: '55m', progress: 0 },
      { id: 4, numeral: 'IV', title: 'The Madness of Ophelia', duration: '44m', progress: 0 },
      { id: 5, numeral: 'V', title: 'The Final Reckoning', duration: '1h 04m', progress: 0 },
    ],
  },
  {
    id: 2,
    title: 'Macbeth',
    author: 'William Shakespeare',
    narrator: 'Ian McKellen',
    year: 'c. 1606',
    genre: 'Tragedy',
    bg: '#1A2818',
    accent: '#A04040',
    progress: 0,
    totalDuration: '3h 47m',
    synopsis:
      'Three witches upon a blasted heath set in motion a terrible chain of ambition and blood. A brave general and his merciless wife reach for the crown of Scotland, only to find power an ever-deepening darkness.',
    chapters: [
      { id: 1, numeral: 'I', title: "The Witches' Prophecy", duration: '42m', progress: 0 },
      { id: 2, numeral: 'II', title: 'The Dagger of the Mind', duration: '38m', progress: 0 },
      { id: 3, numeral: 'III', title: 'Blood Will Have Blood', duration: '46m', progress: 0 },
      { id: 4, numeral: 'IV', title: 'Double, Double, Toil and Trouble', duration: '52m', progress: 0 },
      { id: 5, numeral: 'V', title: 'Out, Damned Spot', duration: '49m', progress: 0 },
    ],
  },
  {
    id: 3,
    title: "A Midsummer Night's Dream",
    author: 'William Shakespeare',
    narrator: 'Judi Dench',
    year: 'c. 1595',
    genre: 'Comedy',
    bg: '#1B2D3D',
    accent: '#6B9FB8',
    progress: 88,
    totalDuration: '3h 12m',
    lastChapterId: 5,
    lastPosition: '0:44:21',
    synopsis:
      'Love and enchantment collide in a moonlit Athenian wood, where fairy magic turns desire into folly and the humblest of men becomes a king for a night.',
    chapters: [
      { id: 1, numeral: 'I', title: "The Lovers' Quarrel", duration: '35m', progress: 100 },
      { id: 2, numeral: 'II', title: 'Into the Enchanted Wood', duration: '38m', progress: 100 },
      { id: 3, numeral: 'III', title: "Puck's Mischief", duration: '42m', progress: 100 },
      { id: 4, numeral: 'IV', title: "The Fairy Queen's Folly", duration: '36m', progress: 100 },
      { id: 5, numeral: 'V', title: 'All is Mended', duration: '41m', progress: 68 },
    ],
  },
  {
    id: 4,
    title: 'The Tempest',
    author: 'William Shakespeare',
    narrator: 'Patrick Stewart',
    year: 'c. 1611',
    genre: 'Romance',
    bg: '#2A1F3D',
    accent: '#9B7DC4',
    progress: 15,
    totalDuration: '3h 28m',
    lastChapterId: 1,
    lastPosition: '0:31:07',
    synopsis:
      'A sorcerer stranded on an enchanted isle commands air spirits and sea-monsters alike, conjuring a storm to bring his usurping enemies within reach of justice and forgiveness.',
    chapters: [
      { id: 1, numeral: 'I', title: 'The Tempest Arises', duration: '38m', progress: 82 },
      { id: 2, numeral: 'II', title: "Prospero's Island", duration: '44m', progress: 0 },
      { id: 3, numeral: 'III', title: "Caliban's Curse", duration: '40m', progress: 0 },
      { id: 4, numeral: 'IV', title: 'Miranda and Ferdinand', duration: '36m', progress: 0 },
      { id: 5, numeral: 'V', title: 'Release and Forgiveness', duration: '50m', progress: 0 },
    ],
  },
]

const AI_SUMMARIES: Record<string, string> = {
  '1-1':
    'Upon Elsinore\'s frost-bitten battlements, soldiers encounter the ghost of the late King Hamlet. Horatio, philosopher turned witness, resolves to speak with the apparition. The ghost reveals a terrible truth: he was murdered by his own brother Claudius, who now sits upon his throne and sleeps beside his widow. Young Hamlet swears upon his father\'s honour to pursue revenge.',
  '1-2':
    'Hamlet devises a cunning stratagem: a visiting troupe of players shall perform "The Murder of Gonzago" — a play mirroring his father\'s death — to catch the conscience of the King. Meanwhile, Polonius and Claudius spy upon Hamlet\'s bitter encounters with the gentle Ophelia, convinced that love-madness is the source of the prince\'s affliction.',
  '3-5':
    'The lovers emerge from the enchanted wood, their quarrels dissolved in morning light. Bottom the weaver awakens alone, puzzling at his extraordinary dream of transformation and fairy love. Duke Theseus discovers the four lovers and grants his blessing. The mechanicals perform their absurd Pyramus and Thisbe, and as midnight chimes, the fairy court descends to bless the sleeping house.',
  '4-1':
    'A tempest of extraordinary fury wrecks a vessel carrying Prospero\'s treacherous enemies upon the shores of his enchanted island. The magician calms his daughter Miranda\'s distress, revealing the story of their exile: how his brother Antonio usurped the dukedom of Milan while Prospero was lost in his studies. The spirit Ariel reports the shipwreck accomplished with precision — and without loss of life.',
}

// ─────────────────────────────────────────────
// Shared Components
// ─────────────────────────────────────────────

function Flourish({ double = false }: { double?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #C4A882)' }} />
      <span style={{ color: '#C4A882', fontSize: '11px', letterSpacing: double ? '6px' : '0' }}>
        {double ? '❧  ✦  ❦' : '✦'}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(270deg, transparent, #C4A882)' }} />
    </div>
  )
}

function InkProgress({
  pct,
  height = 2,
  color = '#7B1C2E',
}: {
  pct: number
  height?: number
  color?: string
}) {
  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: height,
        background: 'rgba(196,168,130,0.25)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}bb, ${color})`,
          borderRadius: height,
          transition: 'width 0.5s ease',
        }}
      />
    </div>
  )
}

function BookCover({
  book,
  width,
  height,
}: {
  book: Book
  width: number
  height: number
}) {
  return (
    <div
      style={{
        width,
        height,
        background: book.bg,
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        boxShadow: '4px 6px 20px rgba(0,0,0,0.45), inset -2px 0 6px rgba(0,0,0,0.25)',
      }}
    >
      {/* Spine */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: Math.max(3, width * 0.06),
          background: `linear-gradient(90deg, ${book.accent}aa, ${book.accent}33)`,
        }}
      />
      {/* Inner border frame */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: '18%',
          right: '8%',
          bottom: '8%',
          border: `1px solid ${book.accent}44`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8% 6%',
        }}
      >
        <span style={{ color: book.accent, fontSize: Math.max(6, width * 0.09) }}>✦</span>
        <div style={{ textAlign: 'center' }}>
          <div
            className="font-cinzel"
            style={{
              color: book.accent,
              fontSize: Math.max(7, width * 0.075),
              fontWeight: 600,
              lineHeight: 1.3,
              textAlign: 'center',
            }}
          >
            {book.title}
          </div>
          <div
            className="font-lora"
            style={{
              color: book.accent,
              fontSize: Math.max(5, width * 0.055),
              fontStyle: 'italic',
              opacity: 0.6,
              marginTop: '6%',
            }}
          >
            {book.author.split(' ').slice(-1)[0]}
          </div>
        </div>
        <span style={{ color: book.accent, fontSize: Math.max(5, width * 0.065) }}>❧</span>
      </div>
      {/* Aged sheen */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 30% 15%, rgba(255,255,255,0.1) 0%, transparent 55%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────
// Library Screen
// ─────────────────────────────────────────────

function LibraryScreen({
  books,
  onSelect,
}: {
  books: Book[]
  onSelect: (b: Book) => void
}) {
  const inProgress = books.filter((b) => b.progress > 0 && b.progress < 100)
  const lastRead = inProgress.length > 0 ? inProgress[0] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div
        style={{
          padding: '44px 24px 20px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(196,168,130,0.3)',
        }}
      >
        <div
          className="font-cinzel"
          style={{ color: '#7B1C2E', fontSize: 10, letterSpacing: '0.35em', marginBottom: 6 }}
        >
          F O L I O
        </div>
        <h1
          className="font-cinzel"
          style={{ color: '#1A0E05', fontSize: 26, fontWeight: 700, margin: 0 }}
        >
          The Library
        </h1>
        <p
          className="font-fell"
          style={{ color: '#7A6550', fontSize: 13, fontStyle: 'italic', marginTop: 4 }}
        >
          Your literary collection
        </p>
      </div>

      <div style={{ padding: '20px 20px 100px' }}>
        {/* Continue reading */}
        {lastRead && (
          <div style={{ marginBottom: 24 }}>
            <div
              className="font-cinzel"
              style={{ color: '#7B1C2E', fontSize: 9, letterSpacing: '0.25em', marginBottom: 10 }}
            >
              CONTINUE READING
            </div>
            <div
              onClick={() => onSelect(lastRead)}
              style={{
                display: 'flex',
                gap: 14,
                padding: 14,
                background: 'rgba(196,168,130,0.18)',
                border: '1px solid rgba(196,168,130,0.4)',
                borderRadius: 2,
                cursor: 'pointer',
              }}
            >
              <BookCover book={lastRead} width={52} height={76} />
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div className="font-cinzel" style={{ color: '#1A0E05', fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>
                    {lastRead.title}
                  </div>
                  <div className="font-lora" style={{ color: '#7A6550', fontSize: 11, fontStyle: 'italic', marginTop: 2 }}>
                    {lastRead.author}
                  </div>
                  {lastRead.lastPosition && (
                    <div className="font-lora" style={{ color: '#4A3728', fontSize: 11, marginTop: 6 }}>
                      Act {lastRead.lastChapterId} · {lastRead.lastPosition} elapsed
                    </div>
                  )}
                </div>
                <div>
                  <InkProgress pct={lastRead.progress} height={3} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span className="font-lora" style={{ color: '#7A6550', fontSize: 10 }}>
                      {lastRead.progress}% heard
                    </span>
                    <span
                      className="font-cinzel"
                      style={{ color: '#7B1C2E', fontSize: 9, letterSpacing: '0.18em' }}
                    >
                      RESUME →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <Flourish />

        {/* All volumes grid */}
        <div
          className="font-cinzel"
          style={{ color: '#7B1C2E', fontSize: 9, letterSpacing: '0.25em', margin: '18px 0 12px' }}
        >
          ALL VOLUMES
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}
        >
          {books.map((book) => (
            <div key={book.id} onClick={() => onSelect(book)} style={{ cursor: 'pointer' }}>
              <BookCover book={book} width={152} height={218} />
              <div style={{ marginTop: 8 }}>
                <div className="font-cinzel" style={{ color: '#1A0E05', fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>
                  {book.title}
                </div>
                <div className="font-lora" style={{ color: '#7A6550', fontSize: 10, fontStyle: 'italic', marginTop: 2 }}>
                  {book.author}
                </div>
                {book.progress > 0 && book.progress < 100 && (
                  <div style={{ marginTop: 6 }}>
                    <InkProgress pct={book.progress} height={2} />
                  </div>
                )}
                {book.progress === 0 && (
                  <div className="font-lora" style={{ color: '#C4A882', fontSize: 10, marginTop: 5 }}>
                    Unread
                  </div>
                )}
                {book.progress === 100 && (
                  <div className="font-lora" style={{ color: '#1E3A2F', fontSize: 10, marginTop: 5 }}>
                    ✓ Complete
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Book Detail Screen
// ─────────────────────────────────────────────

function BookDetailScreen({
  book,
  onBack,
  onPlayChapter,
  onResume,
}: {
  book: Book
  onBack: () => void
  onPlayChapter: (ch: Chapter) => void
  onResume: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {/* Hero */}
      <div style={{ position: 'relative', height: 220, background: book.bg, flexShrink: 0 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BookCover book={book} width={120} height={178} />
        </div>
        {/* Gradient fade to parchment */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 80,
            background: 'linear-gradient(transparent, #F5EDCC)',
          }}
        />
        {/* Back button */}
        <button
          onClick={onBack}
          className="font-cinzel"
          style={{
            position: 'absolute',
            top: 44,
            left: 20,
            color: book.accent,
            background: 'none',
            border: 'none',
            fontSize: 10,
            letterSpacing: '0.2em',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ← LIBRARY
        </button>
      </div>

      <div style={{ padding: '0 20px 100px' }}>
        {/* Title block */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div
            className="font-cinzel"
            style={{ color: '#7B1C2E', fontSize: 9, letterSpacing: '0.28em', marginBottom: 4 }}
          >
            {book.genre.toUpperCase()} · {book.year}
          </div>
          <h1
            className="font-cinzel"
            style={{ color: '#1A0E05', fontSize: 24, fontWeight: 700, lineHeight: 1.2, margin: '0 0 4px' }}
          >
            {book.title}
          </h1>
          {book.subtitle && (
            <div className="font-fell" style={{ color: '#4A3728', fontSize: 13, fontStyle: 'italic' }}>
              {book.subtitle}
            </div>
          )}
          <div className="font-lora" style={{ color: '#7A6550', fontSize: 11, marginTop: 5 }}>
            by {book.author} · narrated by {book.narrator}
          </div>
        </div>

        {/* Progress */}
        {book.progress > 0 && (
          <div style={{ marginBottom: 14 }}>
            <InkProgress pct={book.progress} height={3} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span className="font-lora" style={{ color: '#7A6550', fontSize: 10 }}>
                {book.progress}% heard
              </span>
              <span className="font-lora" style={{ color: '#7A6550', fontSize: 10 }}>
                {book.totalDuration} total
              </span>
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onResume}
          className="font-cinzel"
          style={{
            width: '100%',
            padding: '13px 0',
            background: '#7B1C2E',
            color: '#F5EDCC',
            border: '1px solid #9B2C3E',
            fontSize: 11,
            letterSpacing: '0.22em',
            cursor: 'pointer',
            marginBottom: 4,
          }}
        >
          {book.progress > 0 ? '▶  RESUME LISTENING' : '▶  BEGIN THIS VOLUME'}
        </button>

        <Flourish double />

        {/* Synopsis */}
        <p
          className="font-fell"
          style={{
            color: '#4A3728',
            fontSize: 14,
            fontStyle: 'italic',
            lineHeight: 1.75,
            margin: '14px 0',
          }}
        >
          {book.synopsis}
        </p>

        <Flourish />

        {/* Chapters */}
        <div
          className="font-cinzel"
          style={{ color: '#7B1C2E', fontSize: 9, letterSpacing: '0.25em', margin: '18px 0 12px' }}
        >
          ACTS &amp; CHAPTERS
        </div>

        <div>
          {book.chapters.map((ch) => (
            <div
              key={ch.id}
              onClick={() => onPlayChapter(ch)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 0',
                borderBottom: '1px solid rgba(196,168,130,0.22)',
                cursor: 'pointer',
              }}
            >
              {/* Numeral badge */}
              <div
                className="font-cinzel"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 600,
                  background:
                    ch.progress === 100
                      ? '#1E3A2F'
                      : ch.progress > 0
                      ? '#7B1C2E'
                      : 'rgba(196,168,130,0.18)',
                  color:
                    ch.progress > 0 ? '#F5EDCC' : '#7A6550',
                  border: `1px solid ${
                    ch.progress === 100
                      ? '#2D5040'
                      : ch.progress > 0
                      ? '#9B2C3E'
                      : 'rgba(196,168,130,0.38)'
                  }`,
                }}
              >
                {ch.progress === 100 ? '✓' : ch.numeral}
              </div>

              {/* Title + duration + sub-progress */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-lora" style={{ color: '#1A0E05', fontSize: 14, fontWeight: 500 }}>
                  {ch.title}
                </div>
                <div className="font-lora" style={{ color: '#7A6550', fontSize: 11, marginTop: 2 }}>
                  {ch.duration}
                </div>
                {ch.progress > 0 && ch.progress < 100 && (
                  <div style={{ marginTop: 5 }}>
                    <InkProgress pct={ch.progress} height={2} />
                  </div>
                )}
              </div>

              {/* Play icon */}
              <div style={{ flexShrink: 0 }}>
                {ch.progress === 100 ? (
                  <span style={{ color: '#1E3A2F', fontSize: 16 }}>↺</span>
                ) : (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(196,168,130,0.18)',
                      border: '1px solid rgba(196,168,130,0.38)',
                    }}
                  >
                    <span style={{ color: '#7B1C2E', fontSize: 10, marginLeft: 2 }}>▶</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Player Screen
// ─────────────────────────────────────────────

function PlayerScreen({
  book,
  chapter,
  onBack,
  onSummary,
}: {
  book: Book
  chapter: Chapter
  onBack: () => void
  onSummary: () => void
}) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(chapter.progress || 23)
  const [speed, setSpeed] = useState(1)
  const speeds = [0.75, 1, 1.25, 1.5, 2]

  const totalSec = 2880
  const elapsed = Math.round((totalSec * progress) / 100)
  const remaining = totalSec - elapsed
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setProgress((p) => Math.min(100, p + 0.04)), 400)
    return () => clearInterval(id)
  }, [playing])

  // Waveform bars
  const bars = Array.from({ length: 52 }, (_, i) => ({
    h: 10 + Math.abs(Math.sin(i * 0.65) * 14 + Math.sin(i * 1.2) * 8),
    played: (i / 52) * 100 < progress,
  }))

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: book.bg,
        overflowY: 'auto',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '44px 20px 16px',
        }}
      >
        <button
          onClick={onBack}
          className="font-cinzel"
          style={{
            color: book.accent,
            background: 'none',
            border: 'none',
            fontSize: 10,
            letterSpacing: '0.18em',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ← BACK
        </button>
        <div
          className="font-cinzel"
          style={{ color: `${book.accent}80`, fontSize: 9, letterSpacing: '0.3em' }}
        >
          NOW PLAYING
        </div>
        <button
          onClick={onSummary}
          className="font-cinzel"
          style={{
            color: book.accent,
            background: 'none',
            border: `1px solid ${book.accent}50`,
            fontSize: 9,
            letterSpacing: '0.16em',
            cursor: 'pointer',
            padding: '5px 8px',
          }}
        >
          AI SUMMARY
        </button>
      </div>

      {/* Cover */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 40px 24px' }}>
        <BookCover book={book} width={164} height={240} />
      </div>

      {/* Chapter info */}
      <div style={{ textAlign: 'center', padding: '0 24px 16px' }}>
        <div
          className="font-cinzel"
          style={{ color: `${book.accent}70`, fontSize: 9, letterSpacing: '0.25em', marginBottom: 5 }}
        >
          ACT {chapter.numeral}
        </div>
        <h2
          className="font-cinzel"
          style={{ color: book.accent, fontSize: 19, fontWeight: 600, lineHeight: 1.25, margin: '0 0 6px' }}
        >
          {chapter.title}
        </h2>
        <div className="font-lora" style={{ color: `${book.accent}65`, fontSize: 11, fontStyle: 'italic' }}>
          {book.title} · {book.narrator}
        </div>
      </div>

      {/* Waveform */}
      <div style={{ padding: '0 20px', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 44, justifyContent: 'center' }}>
          {bars.map((bar, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                maxWidth: 4,
                height: bar.h,
                borderRadius: 2,
                background: bar.played ? book.accent : `${book.accent}28`,
                transition: 'background 0.4s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Scrubber */}
      <div style={{ padding: '0 20px', marginBottom: 8 }}>
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
          <span className="font-lora" style={{ color: `${book.accent}75`, fontSize: 10 }}>
            {fmt(elapsed)}
          </span>
          <span className="font-lora" style={{ color: `${book.accent}75`, fontSize: 10 }}>
            −{fmt(remaining)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          padding: '8px 20px 16px',
        }}
      >
        <button
          style={{ color: `${book.accent}60`, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 0 }}
        >
          ⏮
        </button>
        <button
          className="font-cinzel"
          style={{
            color: book.accent,
            background: 'none',
            border: `1px solid ${book.accent}40`,
            fontSize: 9,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            padding: '5px 7px',
            borderRadius: 2,
          }}
        >
          −15s
        </button>
        {/* Main play/pause */}
        <button
          onClick={() => setPlaying((p) => !p)}
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: book.accent,
            border: `2px solid ${book.accent}99`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: `0 0 28px ${book.accent}44, 0 4px 20px rgba(0,0,0,0.4)`,
            fontSize: 20,
          }}
        >
          <span style={{ color: '#1A0E05', marginLeft: playing ? 0 : 3 }}>
            {playing ? '⏸' : '▶'}
          </span>
        </button>
        <button
          className="font-cinzel"
          style={{
            color: book.accent,
            background: 'none',
            border: `1px solid ${book.accent}40`,
            fontSize: 9,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            padding: '5px 7px',
            borderRadius: 2,
          }}
        >
          +15s
        </button>
        <button
          style={{ color: `${book.accent}60`, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 0 }}
        >
          ⏭
        </button>
      </div>

      {/* Speed selector */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '0 20px 24px' }}>
        {speeds.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className="font-cinzel"
            style={{
              background: speed === s ? book.accent : 'transparent',
              color: speed === s ? '#1A0E05' : `${book.accent}65`,
              border: `1px solid ${book.accent}38`,
              fontSize: 9,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 2,
            }}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// AI Summary Modal
// ─────────────────────────────────────────────

function SummaryModal({
  book,
  chapter,
  onClose,
}: {
  book: Book
  chapter: Chapter
  onClose: () => void
}) {
  const key = `${book.id}-${chapter.id}`
  const text =
    AI_SUMMARIES[key] ||
    "The stage is set, the players assembled, and the story turns upon its hinge. What was hidden comes to light; what was light dissolves into shadow. Every word spoken carries the weight of consequence, and the audience leans forward in the dark, breath held, knowing that nothing shall ever again be quite as it was before this scene was played."

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-end',
        background: 'rgba(26,14,5,0.72)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxHeight: '78%',
          overflowY: 'auto',
          padding: '28px 24px 36px',
          background: '#F5EDCC',
          borderTop: '3px solid #C9A84C',
          borderRadius: '8px 8px 0 0',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div
            className="font-cinzel"
            style={{ color: '#7B1C2E', fontSize: 9, letterSpacing: '0.3em', marginBottom: 6 }}
          >
            AI CHAPTER SUMMARY
          </div>
          <div className="font-cinzel" style={{ color: '#1A0E05', fontSize: 16, fontWeight: 600 }}>
            Act {chapter.numeral}
          </div>
          <div className="font-fell" style={{ color: '#7A6550', fontSize: 12, fontStyle: 'italic' }}>
            {chapter.title}
          </div>
        </div>

        <div
          style={{
            height: 1,
            background: 'linear-gradient(90deg, transparent, #C4A882, transparent)',
            marginBottom: 20,
          }}
        />

        {/* Quill */}
        <div style={{ textAlign: 'center', fontSize: 26, marginBottom: 12 }}>✍</div>

        {/* Summary text */}
        <p
          className="font-fell"
          style={{
            color: '#2A1A0A',
            fontSize: 14,
            fontStyle: 'italic',
            lineHeight: 1.85,
            margin: 0,
          }}
        >
          &ldquo;{text}&rdquo;
        </p>

        <Flourish double />

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            onClick={onClose}
            className="font-cinzel"
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'transparent',
              color: '#4A3728',
              border: '1px solid rgba(196,168,130,0.5)',
              fontSize: 10,
              letterSpacing: '0.18em',
              cursor: 'pointer',
            }}
          >
            CLOSE
          </button>
          <button
            className="font-cinzel"
            style={{
              flex: 1,
              padding: '12px 0',
              background: '#7B1C2E',
              color: '#F5EDCC',
              border: '1px solid #9B2C3E',
              fontSize: 10,
              letterSpacing: '0.18em',
              cursor: 'pointer',
            }}
          >
            MARK HEARD ✓
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Import Screen
// ─────────────────────────────────────────────

function ImportScreen({
  onBack,
  onProcessing,
}: {
  onBack: () => void
  onProcessing: () => void
}) {
  const [tab, setTab] = useState<'epub' | 'pdf' | 'txt'>('epub')
  const [dragging, setDragging] = useState(false)

  const recent = [
    { title: 'Othello', type: 'EPUB', date: '3 days ago' },
    { title: 'King Lear', type: 'PDF', date: '1 week ago' },
    { title: 'Romeo and Juliet', type: 'TXT', date: '2 weeks ago' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div
        style={{
          padding: '44px 20px 18px',
          borderBottom: '1px solid rgba(196,168,130,0.3)',
        }}
      >
        <button
          onClick={onBack}
          className="font-cinzel"
          style={{
            color: '#7B1C2E',
            background: 'none',
            border: 'none',
            fontSize: 10,
            letterSpacing: '0.18em',
            cursor: 'pointer',
            padding: 0,
            marginBottom: 14,
            display: 'block',
          }}
        >
          ← LIBRARY
        </button>
        <h1 className="font-cinzel" style={{ color: '#1A0E05', fontSize: 22, fontWeight: 700, margin: 0 }}>
          Import a Volume
        </h1>
        <p className="font-fell" style={{ color: '#7A6550', fontSize: 13, fontStyle: 'italic', marginTop: 4 }}>
          Add a new work to your collection
        </p>
      </div>

      <div style={{ padding: '20px 20px 100px' }}>
        {/* Format tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['epub', 'pdf', 'txt'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="font-cinzel"
              style={{
                flex: 1,
                padding: '9px 0',
                background: tab === t ? '#7B1C2E' : 'transparent',
                color: tab === t ? '#F5EDCC' : '#7A6550',
                border: '1px solid rgba(196,168,130,0.4)',
                fontSize: 10,
                letterSpacing: '0.2em',
                cursor: 'pointer',
              }}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Drop zone */}
        <div
          onClick={onProcessing}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); onProcessing() }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '44px 20px',
            marginBottom: 24,
            border: `2px dashed ${dragging ? '#7B1C2E' : 'rgba(196,168,130,0.5)'}`,
            background: dragging ? 'rgba(123,28,46,0.06)' : 'rgba(196,168,130,0.1)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📜</div>
          <div
            className="font-cinzel"
            style={{ color: '#4A3728', fontSize: 11, letterSpacing: '0.18em', marginBottom: 6 }}
          >
            DROP YOUR {tab.toUpperCase()} HERE
          </div>
          <div className="font-fell" style={{ color: '#7A6550', fontSize: 12, fontStyle: 'italic', textAlign: 'center' }}>
            or tap to browse your files
          </div>
        </div>

        <Flourish />

        <div
          className="font-cinzel"
          style={{ color: '#7B1C2E', fontSize: 9, letterSpacing: '0.25em', margin: '18px 0 10px' }}
        >
          RECENTLY IMPORTED
        </div>
        {recent.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: '1px solid rgba(196,168,130,0.2)',
            }}
          >
            <div>
              <div className="font-lora" style={{ color: '#1A0E05', fontSize: 14, fontWeight: 500 }}>
                {item.title}
              </div>
              <div className="font-lora" style={{ color: '#7A6550', fontSize: 11 }}>
                {item.date}
              </div>
            </div>
            <div
              className="font-cinzel"
              style={{
                color: '#7A6550',
                border: '1px solid rgba(196,168,130,0.4)',
                fontSize: 9,
                letterSpacing: '0.12em',
                padding: '3px 6px',
              }}
            >
              {item.type}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Processing Screen
// ─────────────────────────────────────────────

function ProcessingScreen({ onComplete }: { onComplete: () => void }) {
  const steps = [
    'Transcribing manuscript…',
    'Parsing acts and chapters…',
    'Weaving narrative voice…',
    'Distilling chapter summaries…',
    'Illuminating your volume…',
  ]
  const [inkPct, setInkPct] = useState(0)
  const stepIdx = Math.min(steps.length - 1, Math.floor((inkPct / 100) * steps.length))

  useEffect(() => {
    const id = setInterval(() => {
      setInkPct((p) => {
        if (p >= 100) { clearInterval(id); return 100 }
        return p + 1
      })
    }, 90)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (inkPct >= 100) {
      const t = setTimeout(onComplete, 1600)
      return () => clearTimeout(t)
    }
  }, [inkPct, onComplete])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '0 40px',
      }}
    >
      {/* Ornament top */}
      <div className="font-cinzel" style={{ color: '#C4A882', fontSize: 20, marginBottom: 32 }}>
        ❧ ✦ ❦
      </div>

      {/* Inkwell */}
      <div
        style={{
          position: 'relative',
          width: 80,
          height: 110,
          marginBottom: 32,
        }}
      >
        {/* Quill */}
        <div
          style={{
            position: 'absolute',
            top: -20,
            left: '50%',
            transform: `translateX(-50%) rotate(${-28 + inkPct * 0.15}deg)`,
            fontSize: 36,
            transformOrigin: 'bottom center',
            transition: 'transform 0.6s ease',
          }}
        >
          🪶
        </div>
        {/* Inkwell body */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 90,
            border: '2px solid rgba(196,168,130,0.5)',
            borderRadius: '4px 4px 12px 12px',
            background: 'rgba(196,168,130,0.1)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${inkPct}%`,
              background: 'linear-gradient(180deg, #3A1A0A, #1A0905)',
              transition: 'height 0.3s ease',
            }}
          />
        </div>
      </div>

      <h2
        className="font-cinzel"
        style={{ color: '#1A0E05', fontSize: 18, fontWeight: 600, marginBottom: 8, textAlign: 'center' }}
      >
        Preparing Your Volume
      </h2>
      <div
        className="font-fell"
        style={{
          color: '#7A6550',
          fontSize: 13,
          fontStyle: 'italic',
          marginBottom: 24,
          textAlign: 'center',
          minHeight: 22,
        }}
      >
        {steps[stepIdx]}
      </div>

      <div style={{ width: '100%', marginBottom: 8 }}>
        <InkProgress pct={inkPct} height={4} />
      </div>
      <div className="font-cinzel" style={{ color: '#7B1C2E', fontSize: 10, letterSpacing: '0.2em' }}>
        {inkPct}%
      </div>

      {inkPct >= 100 && (
        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📖</div>
          <div className="font-cinzel" style={{ color: '#1E3A2F', fontSize: 10, letterSpacing: '0.22em' }}>
            VOLUME READY
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Search Screen
// ─────────────────────────────────────────────

function SearchScreen({
  books,
  onSelect,
}: {
  books: Book[]
  onSelect: (b: Book) => void
}) {
  const [query, setQuery] = useState('')
  const filtered =
    query.length > 1
      ? books.filter(
          (b) =>
            b.title.toLowerCase().includes(query.toLowerCase()) ||
            b.author.toLowerCase().includes(query.toLowerCase()) ||
            b.genre.toLowerCase().includes(query.toLowerCase())
        )
      : []

  const genres = [
    { name: 'Tragedy', icon: '🎭', count: 2 },
    { name: 'Comedy', icon: '🎪', count: 1 },
    { name: 'Romance', icon: '🌊', count: 1 },
    { name: 'History', icon: '⚔️', count: 0 },
    { name: 'Sonnets', icon: '📜', count: 0 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div
        style={{
          padding: '44px 20px 16px',
          borderBottom: '1px solid rgba(196,168,130,0.3)',
        }}
      >
        <h1
          className="font-cinzel"
          style={{ color: '#1A0E05', fontSize: 22, fontWeight: 700, marginBottom: 12 }}
        >
          Search the Library
        </h1>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Title, author, or genre…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="font-lora"
            style={{
              width: '100%',
              padding: '11px 36px 11px 14px',
              background: 'rgba(196,168,130,0.15)',
              border: '1px solid rgba(196,168,130,0.5)',
              color: '#1A0E05',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <span
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#7A6550',
            }}
          >
            🔍
          </span>
        </div>
      </div>

      <div style={{ padding: '18px 20px 100px' }}>
        {filtered.length > 0 ? (
          <>
            <div
              className="font-cinzel"
              style={{ color: '#7B1C2E', fontSize: 9, letterSpacing: '0.25em', marginBottom: 12 }}
            >
              {filtered.length} VOLUME{filtered.length !== 1 ? 'S' : ''} FOUND
            </div>
            {filtered.map((book) => (
              <div
                key={book.id}
                onClick={() => onSelect(book)}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(196,168,130,0.2)',
                  cursor: 'pointer',
                }}
              >
                <BookCover book={book} width={46} height={66} />
                <div>
                  <div className="font-cinzel" style={{ color: '#1A0E05', fontSize: 13, fontWeight: 600 }}>
                    {book.title}
                  </div>
                  <div className="font-lora" style={{ color: '#7A6550', fontSize: 11, fontStyle: 'italic', marginTop: 2 }}>
                    by {book.author}
                  </div>
                  <div
                    className="font-cinzel"
                    style={{ color: '#7B1C2E', fontSize: 9, letterSpacing: '0.14em', marginTop: 5 }}
                  >
                    {book.genre}
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div
              className="font-cinzel"
              style={{ color: '#7B1C2E', fontSize: 9, letterSpacing: '0.25em', marginBottom: 12 }}
            >
              BROWSE BY GENRE
            </div>
            {genres.map((g) => (
              <div
                key={g.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(196,168,130,0.2)',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 20 }}>{g.icon}</span>
                <div style={{ flex: 1 }}>
                  <div className="font-cinzel" style={{ color: '#1A0E05', fontSize: 13, fontWeight: 500 }}>
                    {g.name}
                  </div>
                  <div className="font-lora" style={{ color: '#7A6550', fontSize: 11 }}>
                    {g.count} volume{g.count !== 1 ? 's' : ''} in collection
                  </div>
                </div>
                <span style={{ color: '#C4A882' }}>›</span>
              </div>
            ))}

            <Flourish double />

            <div
              className="font-cinzel"
              style={{ color: '#7B1C2E', fontSize: 9, letterSpacing: '0.25em', margin: '18px 0 10px' }}
            >
              RECENT SEARCHES
            </div>
            {['Hamlet', 'William Shakespeare', 'Tragedy'].map((s) => (
              <div
                key={s}
                onClick={() => setQuery(s)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 0',
                  cursor: 'pointer',
                }}
              >
                <span style={{ color: '#C4A882', fontSize: 11 }}>⏱</span>
                <span className="font-lora" style={{ color: '#4A3728', fontSize: 13 }}>
                  {s}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Settings Screen
// ─────────────────────────────────────────────

function SettingsScreen() {
  const [speed, setSpeed] = useState(1)
  const [voice, setVoice] = useState('Kenneth Branagh')
  const [sleep, setSleep] = useState(30)

  const voices = ['Kenneth Branagh', 'Judi Dench', 'Ian McKellen', 'Patrick Stewart', 'Emma Thompson']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div
        style={{
          padding: '44px 20px 18px',
          borderBottom: '1px solid rgba(196,168,130,0.3)',
          textAlign: 'center',
        }}
      >
        <div className="font-cinzel" style={{ color: '#7B1C2E', fontSize: 9, letterSpacing: '0.35em', marginBottom: 5 }}>
          F O L I O
        </div>
        <h1 className="font-cinzel" style={{ color: '#1A0E05', fontSize: 22, fontWeight: 700, margin: 0 }}>
          The Chamber
        </h1>
        <p className="font-fell" style={{ color: '#7A6550', fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>
          Arrange your reading preferences
        </p>
      </div>

      <div style={{ padding: '20px 20px 100px' }}>
        {/* Playback */}
        <div className="font-cinzel" style={{ color: '#7B1C2E', fontSize: 9, letterSpacing: '0.25em', marginBottom: 14 }}>
          PLAYBACK
        </div>

        {/* Speed */}
        <div style={{ marginBottom: 20, paddingBottom: 18, borderBottom: '1px solid rgba(196,168,130,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div className="font-lora" style={{ color: '#1A0E05', fontSize: 14, fontWeight: 500 }}>
              Narration Speed
            </div>
            <div className="font-cinzel" style={{ color: '#7B1C2E', fontSize: 11 }}>
              {speed}×
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[0.75, 1, 1.25, 1.5, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className="font-cinzel"
                style={{
                  flex: 1,
                  padding: '7px 0',
                  background: speed === s ? '#7B1C2E' : 'transparent',
                  color: speed === s ? '#F5EDCC' : '#7A6550',
                  border: '1px solid rgba(196,168,130,0.4)',
                  fontSize: 9,
                  cursor: 'pointer',
                }}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

        {/* Sleep timer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: '1px solid rgba(196,168,130,0.2)',
          }}
        >
          <div>
            <div className="font-lora" style={{ color: '#1A0E05', fontSize: 14, fontWeight: 500 }}>
              Sleep Timer
            </div>
            <div className="font-lora" style={{ color: '#7A6550', fontSize: 11 }}>
              End narration after silence
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setSleep((s) => Math.max(10, s - 10))}
              style={{ color: '#7B1C2E', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: '0 2px' }}
            >
              −
            </button>
            <span className="font-cinzel" style={{ color: '#1A0E05', fontSize: 13, minWidth: 40, textAlign: 'center' }}>
              {sleep}m
            </span>
            <button
              onClick={() => setSleep((s) => Math.min(90, s + 10))}
              style={{ color: '#7B1C2E', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: '0 2px' }}
            >
              +
            </button>
          </div>
        </div>

        <Flourish />

        {/* Narration voice */}
        <div
          className="font-cinzel"
          style={{ color: '#7B1C2E', fontSize: 9, letterSpacing: '0.25em', margin: '18px 0 12px' }}
        >
          NARRATION VOICE
        </div>
        {voices.map((v) => (
          <div
            key={v}
            onClick={() => setVoice(v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: '1px solid rgba(196,168,130,0.2)',
              cursor: 'pointer',
            }}
          >
            <div className="font-lora" style={{ color: '#1A0E05', fontSize: 14 }}>
              {v}
            </div>
            {voice === v && <span style={{ color: '#1E3A2F' }}>✓</span>}
          </div>
        ))}

        <Flourish double />

        {/* About */}
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div className="font-cinzel" style={{ color: '#C4A882', fontSize: 9, letterSpacing: '0.3em', marginBottom: 8 }}>
            ✦ ✦ ✦
          </div>
          <div className="font-cinzel" style={{ color: '#1A0E05', fontSize: 28, fontWeight: 700 }}>
            FOLIO
          </div>
          <p
            className="font-fell"
            style={{ color: '#7A6550', fontSize: 13, fontStyle: 'italic', lineHeight: 1.7, margin: '10px 0 12px' }}
          >
            &ldquo;All the world&apos;s a stage, and all the men<br />
            and women merely players.&rdquo;
          </p>
          <div className="font-lora" style={{ color: '#C4A882', fontSize: 11 }}>
            Version I · IV · A Literary Experience
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Bottom Navigation
// ─────────────────────────────────────────────

function BottomNav({
  active,
  onChange,
}: {
  active: Screen
  onChange: (s: Screen) => void
}) {
  const tabs: { id: Screen; label: string; icon: string }[] = [
    { id: 'library', label: 'Library', icon: '📚' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'import', label: 'Import', icon: '📜' },
    { id: 'settings', label: 'Chamber', icon: '⚙' },
  ]

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        background: '#F5EDCC',
        borderTop: '1px solid rgba(196,168,130,0.5)',
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '10px 0 14px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            gap: 2,
          }}
        >
          <span style={{ fontSize: 18 }}>{tab.icon}</span>
          <span
            className="font-cinzel"
            style={{
              fontSize: 7,
              letterSpacing: '0.18em',
              color: active === tab.id ? '#7B1C2E' : '#7A6550',
            }}
          >
            {tab.label.toUpperCase()}
          </span>
          {active === tab.id && (
            <div
              style={{
                width: 16,
                height: 1.5,
                background: '#7B1C2E',
                borderRadius: 1,
                marginTop: 1,
              }}
            />
          )}
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Root App
// ─────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('library')
  const [navStack, setNavStack] = useState<Screen[]>([])
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  const [showSummary, setShowSummary] = useState(false)

  const navigate = (s: Screen) => {
    setNavStack((prev) => [...prev, screen])
    setScreen(s)
  }

  const goBack = () => {
    setNavStack((prev) => {
      const next = [...prev]
      const prev_screen = next.pop()
      setScreen(prev_screen ?? 'library')
      return next
    })
  }

  const openBook = (book: Book) => {
    setSelectedBook(book)
    navigate('detail')
  }

  const openChapter = (ch: Chapter) => {
    setSelectedChapter(ch)
    navigate('player')
  }

  const openResume = () => {
    if (!selectedBook) return
    const resumeChapter =
      selectedBook.chapters.find((c) => c.id === selectedBook.lastChapterId) ??
      selectedBook.chapters[0]
    setSelectedChapter(resumeChapter)
    navigate('player')
  }

  const showBottomNav = ['library', 'search', 'import', 'settings'].includes(screen)

  return (
    <div
      className="size-full"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#D4C49A',
      }}
    >
      {/* Mobile shell */}
      <div
        className="paper-bg"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 390,
          height: '100%',
          maxHeight: 900,
          overflow: 'hidden',
          boxShadow: '0 8px 60px rgba(0,0,0,0.35)',
        }}
      >
        {/* Screen content */}
        <div style={{ position: 'absolute', inset: 0 }}>
          {screen === 'library' && (
            <LibraryScreen books={BOOKS} onSelect={openBook} />
          )}
          {screen === 'detail' && selectedBook && (
            <BookDetailScreen
              book={selectedBook}
              onBack={goBack}
              onPlayChapter={openChapter}
              onResume={openResume}
            />
          )}
          {screen === 'player' && selectedBook && selectedChapter && (
            <PlayerScreen
              book={selectedBook}
              chapter={selectedChapter}
              onBack={goBack}
              onSummary={() => setShowSummary(true)}
            />
          )}
          {screen === 'import' && (
            <ImportScreen
              onBack={() => setScreen('library')}
              onProcessing={() => navigate('processing')}
            />
          )}
          {screen === 'processing' && (
            <ProcessingScreen
              onComplete={() => {
                setSelectedBook(BOOKS[0])
                setNavStack(['library'])
                setScreen('detail')
              }}
            />
          )}
          {screen === 'search' && (
            <SearchScreen books={BOOKS} onSelect={openBook} />
          )}
          {screen === 'settings' && <SettingsScreen />}
        </div>

        {/* Bottom navigation */}
        {showBottomNav && (
          <BottomNav
            active={screen}
            onChange={(s) => {
              setNavStack([])
              setScreen(s)
            }}
          />
        )}

        {/* AI Summary modal */}
        {showSummary && selectedBook && selectedChapter && (
          <SummaryModal
            book={selectedBook}
            chapter={selectedChapter}
            onClose={() => setShowSummary(false)}
          />
        )}
      </div>
    </div>
  )
}

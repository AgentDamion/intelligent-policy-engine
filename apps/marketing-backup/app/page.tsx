export default function Page() {
  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '64px 24px', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 40, margin: 0 }}>aicomplyr.io</h1>
      <p style={{ marginTop: 12, fontSize: 18, color: '#444' }}>
        Marketing site scaffold. This will host the public website.
      </p>
      <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <a href="https://app.aicomplyr.io/login" style={button('#2563eb', '#fff')}>Go to app</a>
        <a href="/" style={button('#111827', '#fff')}>Docs (coming soon)</a>
      </div>
    </main>
  )
}

function button(bg: string, fg: string) {
  return {
    display: 'inline-block',
    padding: '10px 14px',
    borderRadius: 10,
    background: bg,
    color: fg,
    textDecoration: 'none',
    fontWeight: 600,
  } as const
}

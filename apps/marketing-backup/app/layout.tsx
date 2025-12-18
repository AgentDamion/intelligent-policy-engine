import './globals.css'

export const metadata = {
  title: 'aicomplyr.io',
  description: 'AI governance for regulated teams.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

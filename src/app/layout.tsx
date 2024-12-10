import './globals.css'

export const metadata = {
  title: 'Campus Mate',
  description: 'Dating app for ISB students',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="light">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}


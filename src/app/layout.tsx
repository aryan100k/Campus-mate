import { Metadata } from 'next'
import { AuthProvider } from '@/lib/AuthContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'Campus Mate',
  description: 'ISB exclusive dating site',
  openGraph: {
    title: 'Campus Mate',
    description: 'ISB exclusive dating site',
    url: 'https://www.campusmate.co.in/',
    siteName: 'Campus Mate',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Campus Mate',
    description: 'ISB exclusive dating site',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head />
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}


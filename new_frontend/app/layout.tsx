import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Outfit, Fira_Code } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-fira',
})

export const metadata: Metadata = {
  title: 'YesBroker — AI Rental Trust Engine',
  description:
    'Genuine flats float up. Scams sink to the bottom. AI multi-agent rental-fraud detection for India.',
  icons: { icon: '/yesbroker-logo.png' },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#071013',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-background">
      <body className={`${outfit.variable} ${firaCode.variable} font-sans antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

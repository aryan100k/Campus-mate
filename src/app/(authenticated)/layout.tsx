import { BottomNav } from '@/components/bottom-nav'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  )
}


import { Sidebar } from "@/components/layout/sidebar"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-black">
      <Sidebar />
      <main className="flex-1 h-full relative">
        {children}
      </main>
    </div>
  )
}

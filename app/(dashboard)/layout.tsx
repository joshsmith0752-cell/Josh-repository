import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 overflow-auto pt-20 md:pt-8">
        {children}
      </main>
    </div>
  )
}

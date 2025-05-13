import { InviteUsers } from "@/components/invite-users"

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12 flex flex-col items-center bg-gray-50">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Bulk Invite Users</h1>
        <p className="text-gray-500 mb-8">Invite multiple users to your workspace with ease.</p>
        <InviteUsers />
      </div>
    </main>
  )
}

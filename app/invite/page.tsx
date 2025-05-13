import { InviteUsers } from "@/components/invite-users"

export default function InvitePage() {
  return (
    <div className="container max-w-4xl py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invite Team Members</h1>
          <p className="text-muted-foreground mt-2">Invite colleagues to collaborate on your workspace.</p>
        </div>
        <InviteUsers />
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Edit2, Save, Trash, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { validateEmail } from "@/lib/validate-emails"

interface EmailItemProps {
  email: string
  role: string
  isValid: boolean
  onRemove: () => void
  onUpdateEmail: (email: string) => void
  onUpdateRole: (role: string) => void
}

export function EmailItem({ email, role, isValid, onRemove, onUpdateEmail, onUpdateRole }: EmailItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedEmail, setEditedEmail] = useState(email)

  const handleSave = () => {
    onUpdateEmail(editedEmail)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedEmail(email)
    setIsEditing(false)
  }

  const roleLabels = {
    admin: "Admin",
    member: "Member",
    guest: "Guest",
  }

  return (
    <div className={cn("flex items-center justify-between p-3 gap-2", !isValid && "bg-red-50")}>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex gap-2">
            <Input
              value={editedEmail}
              onChange={(e) => setEditedEmail(e.target.value)}
              className={cn("h-8", !validateEmail(editedEmail) && "border-red-500 focus-visible:ring-red-500")}
              onKeyDown={(e) => {
                if (e.key === "Enter" && validateEmail(editedEmail)) {
                  handleSave()
                }
              }}
            />
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={handleSave}
                disabled={!validateEmail(editedEmail)}
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className={cn("truncate text-sm", !isValid && "text-red-600")}>{email}</div>
            {!isValid && <div className="text-xs text-red-600 italic">Invalid email</div>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Select value={role} onValueChange={onUpdateRole}>
          <SelectTrigger className="h-8 w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="guest">Guest</SelectItem>
          </SelectContent>
        </Select>

        {!isEditing && (
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onRemove}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { CardFooter } from "@/components/ui/card"

import type React from "react"

import { useState, useRef, type KeyboardEvent } from "react"
import { Loader2, Mail, FileSpreadsheet, X, Download, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"
import { validateEmails, validateEmail } from "@/lib/validate-emails"
import { inviteUsers } from "@/lib/actions"
import { parseSpreadsheet, downloadTemplateSpreadsheet } from "@/lib/parse-spreadsheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type Role = "admin" | "member" | "guest"

interface EmailWithRole {
  email: string
  role: Role
  isValid: boolean
}

interface EmailPill {
  email: string
  isValid: boolean
}

export function InviteUsers() {
  const [inputValue, setInputValue] = useState("")
  const [emailPills, setEmailPills] = useState<EmailPill[]>([])
  const [selectedRole, setSelectedRole] = useState<Role>("member")
  const [emailsToInvite, setEmailsToInvite] = useState<EmailWithRole[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Process input value when user types a delimiter
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    // Check if the last character is a delimiter
    if (value.endsWith(",") || value.endsWith(" ") || value.endsWith("\n")) {
      const email = value.slice(0, -1).trim()
      if (email) {
        addEmailPill(email)
      }
    }
  }

  // Handle key presses in the input field
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (inputValue.trim()) {
        addEmailPill(inputValue.trim())
      }
    } else if (e.key === "Backspace" && inputValue === "" && emailPills.length > 0) {
      // Remove the last pill when backspace is pressed on empty input
      const newPills = [...emailPills]
      newPills.pop()
      setEmailPills(newPills)
    } else if (e.key === "," || e.key === " ") {
      // Prevent the delimiter from being added to the input
      if (inputValue.trim()) {
        e.preventDefault()
        addEmailPill(inputValue.trim())
      }
    }
  }

  // Handle paste event
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()

    // Get pasted content
    const pastedText = e.clipboardData.getData("text")
    if (!pastedText) return

    // First, try to split by common spreadsheet delimiters
    // This handles cases where emails are in separate cells or rows
    const potentialEmails = pastedText
      .split(/[\t\n\r,;]+/) // Split by tabs, newlines, commas, semicolons
      .map((item) => item.trim())
      .filter((item) => item.length > 0)

    // Process each potential email
    const validEmails: string[] = []

    potentialEmails.forEach((item) => {
      // Check if the item looks like an email
      if (item.includes("@") && item.includes(".")) {
        // Further clean up the item to handle any extra formatting
        const cleanedItem = item
          .replace(/^["'<]+|["'>]+$/g, "") // Remove quotes, brackets, etc.
          .trim()

        if (cleanedItem) {
          validEmails.push(cleanedItem)
        }
      }
    })

    // If we found valid emails, add them as pills
    if (validEmails.length > 0) {
      // Filter out duplicates
      const uniqueEmails = [...new Set(validEmails)]

      // Add all emails at once
      const existingEmails = new Set(emailPills.map((pill) => pill.email.toLowerCase()))
      const newPills = uniqueEmails
        .filter((email) => !existingEmails.has(email.toLowerCase()))
        .map((email) => ({
          email,
          isValid: validateEmail(email),
        }))

      if (newPills.length > 0) {
        setEmailPills((prev) => [...prev, ...newPills])

        // Show success toast
        toast({
          title: "Emails detected",
          description: `Added ${newPills.length} email${newPills.length > 1 ? "s" : ""} from clipboard.`,
          className: "bg-green-50 border-green-200",
        })
      }
    } else {
      // If no emails were found, just set the input value to the pasted text
      setInputValue(pastedText)
    }
  }

  // Add an email as a pill
  const addEmailPill = (email: string) => {
    if (!email) return

    // Check if email already exists in pills
    if (emailPills.some((pill) => pill.email.toLowerCase() === email.toLowerCase())) {
      setInputValue("")
      return
    }

    const isValid = validateEmail(email)
    setEmailPills([...emailPills, { email, isValid }])
    setInputValue("")
  }

  // Remove a pill
  const removeEmailPill = (index: number) => {
    const newPills = [...emailPills]
    newPills.splice(index, 1)
    setEmailPills(newPills)
  }

  // Clear all email pills
  const clearAllEmailPills = () => {
    setEmailPills([])
  }

  // Focus the input when clicking on the pills container
  const focusInput = () => {
    inputRef.current?.focus()
  }

  const handleSubmit = async () => {
    // Check for invalid emails
    if (hasInvalidPills) {
      toast({
        title: "Invalid emails detected",
        description: "Please correct or remove the invalid email addresses before sending invitations.",
        variant: "destructive",
      })
      return
    }

    const validEmails = emailPills
      .filter((pill) => pill.isValid)
      .map((pill) => ({
        email: pill.email,
        role: selectedRole,
        isValid: true,
      }))

    if (validEmails.length === 0) {
      toast({
        title: "No valid emails to invite",
        description: "Please add at least one valid email address.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await inviteUsers(validEmails)

      toast({
        title: "Invitations sent successfully",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>
              Sent {validEmails.length} invitation{validEmails.length > 1 ? "s" : ""}.
            </span>
          </div>
        ),
        className: "bg-green-50 border-green-200",
      })

      setEmailPills([])
    } catch (error) {
      toast({
        title: "Failed to send invitations",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    const fileType = file.name.split(".").pop()?.toLowerCase()
    if (!fileType || !["csv", "xlsx", "xls"].includes(fileType)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls)",
        variant: "destructive",
      })
      return
    }

    setIsProcessingFile(true)

    try {
      const emails = await parseSpreadsheet(file)

      if (emails.length === 0) {
        toast({
          title: "No emails found",
          description: "No valid email addresses were found in the uploaded file.",
          variant: "destructive",
        })
        return
      }

      // Process emails into pills
      const { validEmails, invalidEmails } = validateEmails(emails)

      const newPills = [
        ...validEmails.map((email) => ({
          email,
          isValid: true,
        })),
        ...invalidEmails.map((email) => ({
          email,
          isValid: false,
        })),
      ]

      // Add new pills, avoiding duplicates
      setEmailPills((prev) => {
        const existingEmails = new Set(prev.map((pill) => pill.email.toLowerCase()))
        const uniqueNewPills = newPills.filter((pill) => !existingEmails.has(pill.email.toLowerCase()))
        return [...prev, ...uniqueNewPills]
      })

      toast({
        title: "File processed successfully",
        description: `Found ${validEmails.length} valid email${validEmails.length !== 1 ? "s" : ""} and ${invalidEmails.length} invalid email${invalidEmails.length !== 1 ? "s" : ""}.`,
        className: "bg-green-50 border-green-200",
      })

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      toast({
        title: "Error processing file",
        description: "There was an error processing your file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessingFile(false)
    }
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true)
    try {
      await downloadTemplateSpreadsheet()
      toast({
        title: "Template downloaded",
        description: "The template spreadsheet has been downloaded successfully.",
        className: "bg-green-50 border-green-200",
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download failed",
        description: "Failed to download the template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloadingTemplate(false)
    }
  }

  const hasInvalidPills = emailPills.some((pill) => !pill.isValid)

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-900">Invite Team Members</CardTitle>
        <CardDescription className="text-gray-500">Add team members to collaborate on your workspace.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Assign Role</Label>
            <RadioGroup
              defaultValue="member"
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as Role)}
              className="flex flex-col sm:flex-row gap-4"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="admin" id="admin" className="mt-1" />
                <div>
                  <Label htmlFor="admin" className="font-medium">
                    Admin
                  </Label>
                  <p className="text-sm text-gray-500">Can manage team members, billing, and all workspace settings.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="member" id="member" className="mt-1" />
                <div>
                  <Label htmlFor="member" className="font-medium">
                    Member
                  </Label>
                  <p className="text-sm text-gray-500">Can create and edit content, but cannot modify team settings.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="guest" id="guest" className="mt-1" />
                <div>
                  <Label htmlFor="guest" className="font-medium">
                    Guest
                  </Label>
                  <p className="text-sm text-gray-500">Can only view content they are explicitly given access to.</p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email-input">Email Addresses</Label>
              <div
                className={cn(
                  "flex flex-wrap gap-1 p-2 border rounded-md mt-1 min-h-10 focus-within:ring-2 focus-within:ring-ring focus-within:border-input relative",
                  hasInvalidPills && "border-destructive focus-within:ring-destructive",
                )}
                onClick={focusInput}
              >
                {emailPills.map((pill, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full text-sm",
                      pill.isValid ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive",
                    )}
                  >
                    <span className="max-w-[200px] truncate">{pill.email}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeEmailPill(index)
                      }}
                      className="rounded-full hover:bg-gray-200 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <input
                  ref={inputRef}
                  id="email-input"
                  type="text"
                  className="flex-1 min-w-[120px] outline-none bg-transparent"
                  placeholder={
                    emailPills.length > 0 ? "" : "Enter email addresses separated by comma, space, or press Enter"
                  }
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                />
                {emailPills.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      clearAllEmailPills()
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full hover:bg-gray-200 p-1 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {hasInvalidPills && (
                <p className="text-xs text-destructive mt-1">
                  Some email addresses are invalid. Please correct them before adding.
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Tip: You can paste multiple emails directly from a spreadsheet
              </p>
            </div>

            <div className="flex items-center justify-center">
              <div className="border-t border-gray-200 w-full"></div>
              <span className="px-4 text-sm text-gray-500 bg-white">OR</span>
              <div className="border-t border-gray-200 w-full"></div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 justify-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={triggerFileUpload}
                      disabled={isProcessingFile}
                      className="w-full sm:w-auto"
                    >
                      {isProcessingFile ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          Upload Spreadsheet
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upload a CSV or Excel file with email addresses</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="relative group">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleDownloadTemplate}
                  disabled={isDownloadingTemplate}
                  className="h-10 w-10"
                  aria-label="Download sample spreadsheet template"
                >
                  {isDownloadingTemplate ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  Download sample template
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSubmit} disabled={emailPills.length === 0 || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send Invitations
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

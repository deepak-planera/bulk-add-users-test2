export function validateEmail(email: string): boolean {
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateEmails(emails: string[]): {
  validEmails: string[]
  invalidEmails: string[]
} {
  const validEmails: string[] = []
  const invalidEmails: string[] = []

  emails.forEach((email) => {
    if (validateEmail(email)) {
      // Check if email is already in the valid list (avoid duplicates)
      if (!validEmails.includes(email)) {
        validEmails.push(email)
      }
    } else {
      invalidEmails.push(email)
    }
  })

  return { validEmails, invalidEmails }
}

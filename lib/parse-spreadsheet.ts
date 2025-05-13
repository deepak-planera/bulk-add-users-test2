import * as XLSX from "xlsx"

export async function parseSpreadsheet(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          resolve([])
          return
        }

        const workbook = XLSX.read(data, { type: "binary" })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

        // Extract emails from the data
        const emails: string[] = []

        jsonData.forEach((row) => {
          if (!row || row.length === 0) return

          row.forEach((cell) => {
            if (typeof cell === "string" || typeof cell === "number") {
              const cellValue = String(cell).trim()

              // Check if the cell contains an email-like string
              if (cellValue.includes("@")) {
                // If the cell contains multiple emails separated by commas, spaces, or semicolons
                const emailsInCell = cellValue
                  .split(/[\s,;]+/)
                  .map((e) => e.trim())
                  .filter(Boolean)

                emails.push(...emailsInCell)
              }
            }
          })
        })

        resolve(emails)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error("Error reading file"))
    }

    // Read the file as binary
    reader.readAsBinaryString(file)
  })
}

export async function downloadTemplateSpreadsheet(): Promise<void> {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new()

    // Sample data with headers and example rows
    const data = [
      ["Email", "First Name", "Last Name", "Department", "Notes"],
      ["john.doe@example.com", "John", "Doe", "Engineering", "Team Lead"],
      ["jane.smith@example.com", "Jane", "Smith", "Marketing", ""],
      ["alex.wilson@example.com", "Alex", "Wilson", "Sales", "New hire"],
      ["", "", "", "", ""],
      ["You can add more rows here...", "", "", "", ""],
      ["", "", "", "", ""],
      ["Tips:", "", "", "", ""],
      ["- Only the Email column is required", "", "", "", ""],
      ["- You can include multiple emails in a single spreadsheet", "", "", "", ""],
      ["- The system will extract all valid email addresses", "", "", "", ""],
    ]

    // Create a worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(data)

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invite Template")

    // Apply some styling to the header row
    const headerRange = XLSX.utils.decode_range(worksheet["!ref"] || "A1:E1")
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
      if (!worksheet[cellAddress]) continue

      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "EEEEEE" } },
      }
    }

    // Set column widths
    const colWidths = [
      { wch: 25 }, // Email
      { wch: 15 }, // First Name
      { wch: 15 }, // Last Name
      { wch: 15 }, // Department
      { wch: 20 }, // Notes
    ]
    worksheet["!cols"] = colWidths

    // Browser-compatible way to download the file
    // Convert the workbook to a binary string
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "binary" })

    // Convert binary string to ArrayBuffer
    function s2ab(s: string) {
      const buf = new ArrayBuffer(s.length)
      const view = new Uint8Array(buf)
      for (let i = 0; i < s.length; i++) {
        view[i] = s.charCodeAt(i) & 0xff
      }
      return buf
    }

    // Create a Blob from the ArrayBuffer
    const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" })

    // Create a download link and trigger the download
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "invite-users-template.xlsx"
    document.body.appendChild(a)
    a.click()

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 0)

    return Promise.resolve()
  } catch (error) {
    console.error("Error downloading template:", error)
    throw error
  }
}

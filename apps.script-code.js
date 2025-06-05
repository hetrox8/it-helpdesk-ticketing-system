/**
 * Apps Script for IT Help Desk Ticketing System
 * ---------------------------------------------
 * This script auto-generates a unique Ticket ID, sets default status,
 * timestamps the "Last Updated" column, and sends an email notification
 * to IT support whenever a new form submission arrives.
 *
 * To install:
 * 1. In your Google Sheet, go to Extensions → Apps Script.
 * 2. Replace any existing code in Code.gs with this entire script.
 * 3. Save the project.
 * 4. In Apps Script, click the clock icon (Triggers) → Add Trigger.
 *    • Choose function: onFormSubmit
 *    • Deployment: Head
 *    • Event source: From spreadsheet
 *    • Event type: On form submit
 * 5. Authorize when prompted.
 */

// Main function triggered on each form submission
function onFormSubmit(e) {
  // Get reference to the active spreadsheet and the "Ticket Tracker" sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Ticket Tracker");
  if (!sheet) {
    // If the sheet doesn't exist, exit early
    Logger.log("Sheet 'Ticket Tracker' not found. Aborting script.");
    return;
  }

  // Determine the last row (where the new form response landed)
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    // If for some reason there is no data row, exit early
    Logger.log("No data rows found. Aborting script.");
    return;
  }

  // Column indices (1-based)
  const COL_TIMESTAMP   = 1; // Column A: Timestamp (auto-populated by Form)
  const COL_TICKET_ID   = 2; // Column B: Ticket ID (to be generated)
  const COL_STATUS      = 3; // Column C: Status (to be set to "Open")
  const COL_ASSIGNED_TO = 4; // Column D: Assigned To (left blank)
  const COL_LAST_UPDT   = 5; // Column E: Last Updated (timestamp)
  const COL_NAME        = 6; // Column F: Full Name (from Form)
  const COL_EMAIL       = 7; // Column G: Email Address (from Form)
  const COL_CATEGORY    = 8; // Column H: Issue Category (from Form)
  const COL_PRIORITY    = 9; // Column I: Priority (from Form)
  const COL_DESCRIPTION = 10; // Column J: Issue Description (from Form)
  // (Column K is File Upload if enabled)

  // 1. Generate a unique Ticket ID
  //    Format: TKT-<YYYY>-<3-digit sequence>
  const now = new Date();
  const yearStr = now.getFullYear().toString();

  // Fetch all existing Ticket IDs in column B (from row 2 down)
  const idRange = sheet.getRange(2, COL_TICKET_ID, lastRow - 1, 1);
  const idValues = idRange.getValues();
  let countThisYear = 0;
  idValues.forEach(row => {
    const existingId = row[0];
    if (existingId && existingId.toString().startsWith("TKT-" + yearStr)) {
      countThisYear++;
    }
  });

  // Next sequence number for this year, zero-padded to 3 digits
  const seqNum = (countThisYear + 1).toString().padStart(3, "0");
  const ticketId = `TKT-${yearStr}-${seqNum}`;

  // Write the Ticket ID into column B of the new row
  sheet.getRange(lastRow, COL_TICKET_ID).setValue(ticketId);

  // 2. Set default Status = "Open"
  sheet.getRange(lastRow, COL_STATUS).setValue("Open");

  // 3. Update "Last Updated" with the current timestamp
  sheet.getRange(lastRow, COL_LAST_UPDT).setValue(now);

  // 4. Send a notification email to IT support
  try {
    const requesterName  = sheet.getRange(lastRow, COL_NAME).getValue();
    const requesterEmail = sheet.getRange(lastRow, COL_EMAIL).getValue();
    const priority       = sheet.getRange(lastRow, COL_PRIORITY).getValue();
    const category       = sheet.getRange(lastRow, COL_CATEGORY).getValue();

    // Compose email subject and body
    const mailSubject = `New IT Ticket: ${ticketId} (${priority})`;
    const mailBody = `
Hello IT Team,

A new IT support ticket has been submitted:

• Ticket ID: ${ticketId}
• Submitted by: ${requesterName} <${requesterEmail}>
• Category: ${category}
• Priority: ${priority}
• Timestamp: ${formatDateTime(now)}

Issue Description:
${sheet.getRange(lastRow, COL_DESCRIPTION).getValue()}

Please review and assign this ticket as needed.

-- 
This is an automated notification from the IT Help Desk ticketing system.
`;

    // TODO: Replace with your actual IT support email (or a group alias)
    const IT_SUPPORT_EMAIL = "dretrevor8@gmail.com";

    MailApp.sendEmail({
      to: IT_SUPPORT_EMAIL,
      subject: mailSubject,
      body: mailBody
    });
  } catch (err) {
    Logger.log("Error sending notification email: " + err);
  }
}

/**
 * Helper function to format a Date object as "YYYY-MM-DD HH:MM:SS"
 * (You can adjust to any preferred format.)
 */
function formatDateTime(date) {
  const pad = (n) => n < 10 ? "0" + n : n;
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

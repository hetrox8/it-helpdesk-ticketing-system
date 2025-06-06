# IT Help Desk Ticketing System

**A lightweight ticketing workflow built with Google Forms, Google Sheets, and Apps Script.**  
Whenever a user submits a ticket via the Google Form, a unique Ticket ID is generated, an “Open” status is set, and an email notification is sent to IT support automatically.

---
# IT Help Desk Ticketing System

[![Made with Google Apps Script](https://img.shields.io/badge/Built%20with-Apps%20Script-blue?logo=google)](https://developers.google.com/apps-script)
[![Google Sheets](https://img.shields.io/badge/Google%20Sheets-Tracker-success?logo=googlesheets)](https://www.google.com/sheets/about/)
[![Google Forms](https://img.shields.io/badge/Google%20Forms-Frontend-purple?logo=googleforms)](https://docs.google.com/forms/)
[![MIT License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Project Status](https://img.shields.io/badge/status-Complete-brightgreen)]()

**A lightweight ticketing workflow built with Google Forms, Google Sheets, and Apps Script.**  
Whenever a user submits a ticket via the Google Form, a unique Ticket ID is generated, an “Open” status is set, and an email notification is sent to IT support automatically.

## 📌 Table of Contents

1. [Project Overview](#project-overview)  
2. [Tools & Technologies](#tools--technologies)  
3. [Setup Guide](#setup-guide)  
   1. [1. Create the Google Form](#1-create-the-google-form)  
   2. [2. Create & Structure the Google Sheet](#2-create--structure-the-google-sheet)  
   3. [3. Apps Script (Code + Trigger)](#3-apps-script-code--trigger)  
4. [Screenshots](#screenshots)  
5. [Testing & Validation](#testing--validation)  
6. [What I Learned](#what-i-learned)  
7. [Future Enhancements](#future-enhancements)  
8. [Repository Structure](#repository-structure)  

---

## Project Overview

**Objective:** Build a simple, web-accessible ticketing system that:

- Allows users to submit IT support requests via Google Form.  
- Automatically generates a unique Ticket ID (e.g., `TKT-2025-001`).  
- Records ticket details in a Google Sheet, including fields like Status, Priority, and Assigned To.  
- Sends an email notification to the IT support inbox whenever a new ticket is submitted.

This project demonstrates how to wire together Google Workspace components (Form, Sheet, Apps Script) into a lightweight ticketing workflow. It’s ideal for small teams or as a stepping stone toward a more robust help-desk solution.

---

## Tools & Technologies

- **Google Forms** (Front-end for ticket submission)  
- **Google Sheets** (Backend database for tickets)  
- **Google Apps Script** (Server-side scripting to generate IDs and send emails)  
- **Gmail** (Used by Apps Script to send notification emails)  
- (Optional) Any modern browser to create and test the Form/Sheet  

---

## Setup Guide

Below are the detailed steps to build and configure each component.

### 1. Create the Google Form

1. In Google Drive, click **New → Google Forms → Blank Form**.  
2. Rename the form to:  
3. (Optional) Under the form description, add a short instruction, e.g.:  
> Fill out this form to submit an IT support ticket. A confirmation email will be sent to you automatically.  
4. Add the following questions (all **Required** unless noted):  
1. **Full Name**  
   - Type: Short answer  
2. **Email Address**  
   - Type: Short answer  
   - Enable “Response validation” → “Text” → “Email address”  
3. **Issue Category**  
   - Type: Dropdown  
   - Options:  
     - Software  
     - Hardware  
     - Network  
     - Access / Permissions  
     - Other  
4. **Priority**  
   - Type: Dropdown  
   - Options: Low, Medium, High  
5. **Issue Description**  
   - Type: Paragraph  
6. **Attach Screenshot (optional)**  
   - Type: File upload  
   - Allowed file types: Images, Documents  
7. **(Hidden)** We will add “Ticket ID” – *not visible on the Form itself* (handled in the Sheet/Apps Script).  

> **Form Settings:**  
> - Under ⚙️ Settings → **General**, you may turn on “Collect email addresses” so that Google automatically captures the user’s email. If you do this, you can skip the “Email Address” question.  
> - Under ⚙️ Settings → **Presentation**, you can uncheck “Show link to submit another response.”  
> - Click **Send** to get the Form’s URL (if you want to test manually from another device).

---

### 2. Create & Structure the Google Sheet

1. In Google Drive, click **New → Google Sheets → Blank sheet**.  
2. Rename the sheet (file name) to:  
3. Link the Form to this Sheet:  
1. Open your Form → go to the **Responses** tab → click the green Sheets icon.  
2. Select **“Select existing spreadsheet”** → choose **Ticket Tracker**.  
3. Google will populate Row 1 with default headers (e.g., `Timestamp`, `Full Name`, `Email Address`, etc.) as soon as you submit a test response.  
4. Insert the following **new columns** (after “Timestamp”):  
- **B: Ticket ID**  
- **C: Status** (default value = “Open”)  
- **D: Assigned To** (leave blank by default)  
- **E: Last Updated** (timestamp of last update)  
5. Shift the original Form-generated columns one position to the right, so your header row (Row 1) looks like this:

| A: Timestamp | B: Ticket ID | C: Status | D: Assigned To | E: Last Updated | F: Full Name | G: Email Address | H: Issue Category | I: Priority | J: Issue Description | K: File Upload |
| ------------ | ------------ | --------- | -------------- | ---------------- | ------------ | ---------------- | ----------------- | ----------- | -------------------- | --------------- |

6. (Optional) Add **Data Validation** to the Status column (C):  
- Select column C (click the “C” header).  
- Go to **Data → Data validation**.  
- Under “Criteria,” choose “List of items” and enter:  
  ```
  Open, In Progress, Resolved, Closed
  ```  
- Check “Show dropdown list in cell.” Click **Save**.  
7. (Optional) Apply **Conditional Formatting** to highlight “High” priority:  
- Select column I (Priority).  
- Go to **Format → Conditional formatting**.  
- Under “Format cells if…,” select “Text is exactly” and type `High`.  
- Choose a light red fill. Click **Done**.  
8. Freeze the header row:  
- View → Freeze → 1 row.  

At this point, if you submit a dummy ticket via the Form, you should see one row of data appear. But columns B–E will be blank until we add Apps Script to populate them.

---

### 3. Apps Script (Code + Trigger)

#### 3.1. Apps Script Code

1. In your **Ticket Tracker** Sheet, navigate to:  
2. In the Code Editor that opens, replace any default code in `Code.gs` with the following **entire** script:

```javascript
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
  const COL_TIMESTAMP   = 1;  // Column A: Timestamp (auto-populated by Form)
  const COL_TICKET_ID   = 2;  // Column B: Ticket ID (to be generated)
  const COL_STATUS      = 3;  // Column C: Status (to be set to "Open")
  const COL_ASSIGNED_TO = 4;  // Column D: Assigned To (left blank)
  const COL_LAST_UPDT   = 5;  // Column E: Last Updated (timestamp)
  const COL_NAME        = 6;  // Column F: Full Name (from Form)
  const COL_EMAIL       = 7;  // Column G: Email Address (from Form)
  const COL_CATEGORY    = 8;  // Column H: Issue Category (from Form)
  const COL_PRIORITY    = 9;  // Column I: Priority (from Form)
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

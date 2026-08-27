const SHEET_NAME = "Events";
const NOTIFY_EMAIL = "PASTE_YOUR_EMAIL_HERE";
const ADMIN_PAGE_URL = "PASTE_YOUR_WORKER_ADMIN_URL_HERE"; // Example: https://...workers.dev/admin?secret=YOUR_SECRET

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["Timestamp","Session ID","Event","Data","User Agent","Screen"]);
  }

  let body = {};
  try { body = JSON.parse(e.postData.contents || "{}"); } catch (_) {}

  sh.appendRow([
    new Date(), body.sessionId || "", body.event || "",
    JSON.stringify(body.data || {}), body.userAgent || "", body.screen || ""
  ]);

  if (body.event === "gift_unlocked" && NOTIFY_EMAIL.indexOf("PASTE_") !== 0) {
    const subject = "Rakhi Surprise: Shimpi selected ₹2,001";
    const text = [
      "Shimpi has reached the final gift screen and selected ₹2,001.",
      "",
      "Session: " + (body.sessionId || ""),
      "Time: " + new Date().toString(),
      "",
      "Send ₹2,001 by UPI now.",
      ADMIN_PAGE_URL.indexOf("PASTE_") === 0 ? "" : "After sending, open your admin page: " + ADMIN_PAGE_URL
    ].join("\n");
    MailApp.sendEmail(NOTIFY_EMAIL, subject, text);
  }

  return ContentService.createTextOutput(JSON.stringify({ok:true}))
    .setMimeType(ContentService.MimeType.JSON);
}

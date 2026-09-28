// @ts-check
/// <reference types="google-apps-script" />

/**
 * @typedef {{
 *   data?: {
 *     formName?: string,
 *     fields?: Array<{ type?: string, value?: unknown }>
 *   }
 * }} TallyWebhookPayload
 */

/**
 * Web App endpoint to receive incoming POST requests from Tally webhooks
 * and send emails (Confirmation to respondent + Notification to team) using a sender alias.
 * @param {GoogleAppsScript.Events.DoPost} e
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function doPost(e) {
    try {
        // Parse the JSON payload sent by Tally
        /** @type {TallyWebhookPayload} */
        var contents = JSON.parse(e.postData.contents);

        // Extract submission metadata
        var payload = contents.data || {};
        var formName = payload.formName || "Tally Form";
        var fields = payload.fields || [];

        // Configuration
        var senderAlias = "interest@teamvan.org"; // MUST be an authorized "Send mail as" alias in Gmail

        // Variables to track respondent data and form details
        /** @type {string | null} */
        var respondentEmail = null;

        fields.forEach(
            /** @param {{ type?: string, value?: unknown }} field */ function (
                field
            ) {
                var value = field.value;

                // Check if this field is the respondent's email
                if (
                    !respondentEmail &&
                    (field.type === "INPUT_EMAIL" || isEmail(value))
                ) {
                    respondentEmail = String(value).trim();
                }
            }
        );

        // Calculate Next Weekday
        // var nextWeekdayStr = getNextWeekdayString();

        // // -------------------------------------------------------------
        // // 1. Send Thank-You Confirmation Email to Respondent (if found)
        // // -------------------------------------------------------------
        if (respondentEmail) {
            var userSubject = "Thank you for reaching out!";

            var userPlainText =
                "Thank you for filling out the interest form! \n" +
                "We'll get back to you in a day or two by email. \n\n" +
                "Thanks, \nTeam V.A.N. \n" +
                "teamvan.org - contact@teamvan.org";

            var userHtmlBody = "__USER_HTML_BODY__";

            GmailApp.createDraft(respondentEmail, userSubject, userPlainText, {
                from: senderAlias,
                name: "Team V.A.N.", // Custom sender display name
                htmlBody: userHtmlBody
            })
                .send()
                .moveToTrash();

            console.log("Successfully sent email to" + respondentEmail);
        }
    } catch (err) {
        var errorMessage = err instanceof Error ? err.toString() : String(err);
        console.log("Error processing webhook: " + errorMessage);
        return ContentService.createTextOutput(
            JSON.stringify({ status: "error", message: errorMessage })
        ).setMimeType(ContentService.MimeType.JSON);
    }

    console.log("Successfully handled request for " + formName);
    return ContentService.createTextOutput(
        JSON.stringify({ status: "success" })
    ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper to validate email string.
 * @param {unknown} str
 * @returns {boolean}
 */
function isEmail(str) {
    if (typeof str !== "string") return false;
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(str.trim());
}

/**
 * Helper to sanitize HTML.
 * @param {string | null | undefined} str
 * @returns {string}
 */
function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

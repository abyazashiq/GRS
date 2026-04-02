import nodemailer from 'nodemailer';

interface MailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendEmail(input: MailInput) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('Email skipped: SMTP credentials are not configured');
    return { skipped: true };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!from) {
    console.warn('Email skipped: SMTP_FROM/SMTP_USER missing');
    return { skipped: true };
  }

  await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  return { skipped: false };
}

export function buildNewGrievanceEmail({
  stageName,
  grievanceTitle,
  grievanceDescription,
  grievanceCategory,
  grievanceId,
  filedAt,
  isAnonymous,
  authorEmail,
}: {
  stageName: string;
  grievanceTitle: string;
  grievanceDescription: string;
  grievanceCategory: string;
  grievanceId: string;
  filedAt: string;
  isAnonymous: boolean;
  authorEmail: string | null;
}): { subject: string; html: string; text: string } {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const grievanceUrl = `${baseUrl}/grievance/${grievanceId}`;
  const authorDisplay = isAnonymous ? 'Anonymous' : (authorEmail ?? 'Unknown');
  const filedAtDisplay = new Date(filedAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const subject = `[GRS] New Grievance Filed – ${grievanceCategory}: ${grievanceTitle}`;

  const text = `
Dear ${stageName},

A new grievance has been filed and assigned to your escalation track.

Subject: ${grievanceTitle}
Category: ${grievanceCategory}
Filed By: ${authorDisplay}
Filed On: ${filedAtDisplay} IST

Description:
${grievanceDescription}

View the grievance at: ${grievanceUrl}

---
This is an automated notification from the Grievance Redressal System.
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F0F4FA;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4FA;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(30,58,138,0.08);max-width:600px;width:100%;">
  <tr>
    <td style="background:linear-gradient(135deg,#1E3A8A 0%,#2563EB 100%);padding:32px 40px;">
      <p style="margin:0;color:#BFDBFE;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Grievance Redressal System</p>
      <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:800;">New Grievance Filed</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 40px 0;">
      <p style="margin:0;color:#1E3A8A;font-size:15px;font-weight:700;">Dear ${stageName},</p>
      <p style="margin:8px 0 0;color:#475569;font-size:14px;line-height:1.6;">A new grievance has been filed and assigned to your escalation track. Please review and respond within the stipulated timeframe.</p>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFF;border:1.5px solid #DBEAFE;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:20px 24px;border-bottom:1px solid #DBEAFE;">
            <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;">SUBJECT</p>
            <p style="margin:0;font-size:17px;font-weight:800;color:#1E3A8A;">${grievanceTitle}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;border-bottom:1px solid #DBEAFE;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%">
                  <p style="margin:0 0 2px;font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;">CATEGORY</p>
                  <p style="margin:0;font-size:13px;font-weight:700;color:#1E3A8A;">${grievanceCategory}</p>
                </td>
                <td width="50%">
                  <p style="margin:0 0 2px;font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;">FILED BY</p>
                  <p style="margin:0;font-size:13px;font-weight:700;color:#475569;">${authorDisplay}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;border-bottom:1px solid #DBEAFE;">
            <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;">DESCRIPTION</p>
            <p style="margin:0;font-size:14px;color:#334155;line-height:1.7;">${grievanceDescription}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;">
            <p style="margin:0 0 2px;font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;">FILED ON</p>
            <p style="margin:0;font-size:13px;font-weight:600;color:#475569;">${filedAtDisplay} IST</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 40px 32px;">
      <a href="${grievanceUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#1E3A8A,#2563EB);color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;">View Grievance →</a>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 40px;background:#F8FAFF;border-top:1px solid #E8EDF8;">
      <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.5;">This is an automated notification from the Grievance Redressal System.<br/>Please do not reply to this email directly.</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`.trim();

  return { subject, html, text };
}
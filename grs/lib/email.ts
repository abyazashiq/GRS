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
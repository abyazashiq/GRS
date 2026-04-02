const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function testEmail() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  console.log('SMTP_HOST:', host);
  console.log('SMTP_PORT:', port);
  console.log('SMTP_USER:', user);
  console.log('SMTP_PASS:', pass ? `set (${pass.length} chars)` : 'MISSING');
  console.log('SMTP_FROM:', from);

  if (!host || !user || !pass) {
    console.error('Missing SMTP config!');
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: { user, pass },
  });

  try {
    console.log('\nVerifying connection...');
    await transporter.verify();
    console.log('✅ SMTP connection OK');

    console.log('\nSending test email...');
    const info = await transporter.sendMail({
      from,
      to: user, // send to self as test
      subject: '[GRS Test] Email system working!',
      text: 'This is a test email from the GRS grievance notification system.',
      html: '<p>This is a <strong>test email</strong> from the GRS grievance notification system.</p>',
    });

    console.log('✅ Email sent! Message ID:', info.messageId);
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.code) console.error('Code:', err.code);
  }
}

testEmail();

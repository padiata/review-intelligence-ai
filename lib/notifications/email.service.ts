import "server-only";

import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function getTransporter() {
  const host =
    process.env.SMTP_HOST;

  const port =
    Number(process.env.SMTP_PORT ?? 587);

  const user =
    process.env.SMTP_USER;

  const pass =
    process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP configuration is incomplete."
    );
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

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: SendEmailInput): Promise<void> {
  const from =
    process.env.EMAIL_FROM ??
    process.env.SMTP_USER;

  if (!from) {
    throw new Error(
      "EMAIL_FROM is not configured."
    );
  }

  const transporter =
    getTransporter();

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}
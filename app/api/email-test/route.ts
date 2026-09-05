import { NextResponse } from "next/server";

import {
  sendEmail,
} from "@/lib/notifications/email.service";

export async function POST() {
  try {
    await sendEmail({
      to: "tazunoleo22@gmail.com",
      subject: "Prueba PADIATA",
      text: "Este es un correo de prueba enviado por PADIATA.",
      html: `
        <h2>Prueba PADIATA</h2>
        <p>
          Este es un correo de prueba enviado por PADIATA.
        </p>
      `,
    });

    return NextResponse.json({
      ok: true,
      message: "Email sent successfully.",
    });
  } catch (error) {
    console.error(
      "[EmailTest] Error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}
// src/pages/api/test-email.js
import { sendConfirmationEmail, sendDownloadEmail } from './send-confirmation-email';
import { LIBRO_DOWNLOAD_LINK } from '../../config';

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email') || 'tu-email@ejemplo.com';
    const name = url.searchParams.get('name') || 'Usuario de Prueba';
    
    // Enviar correo de confirmación
    const confirmResult = await sendConfirmationEmail({
      email,
      name,
      reference: 'PRUEBA-123456'
    });
    
    // Enviar correo con enlace de descarga
    const downloadResult = await sendDownloadEmail({
      email,
      name,
      downloadLink: LIBRO_DOWNLOAD_LINK
    });
    
    return new Response(JSON.stringify({
      success: true,
      confirmResult,
      downloadResult,
      message: `Correos enviados a ${email}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
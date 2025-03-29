// src/pages/api/send-download-email.js
import { sendDownloadEmail } from '../../services/emailService';

export async function POST({ request }) {
  console.log('Received POST request to send-download-email endpoint');
  try {
    const { email, name } = await request.json();
    console.log('Received data for download email:', { email, name });
    
    if (!email || !name) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Email y nombre son requeridos' 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const result = await sendDownloadEmail({
      email,
      name
    });
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email con enlace de descarga enviado correctamente' 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error('Error in send-download-email endpoint:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Error al enviar el email: ${error.message}` 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
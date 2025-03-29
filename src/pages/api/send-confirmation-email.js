import nodemailer from 'nodemailer';
import { EMAIL_USER, EMAIL_PASS, EMAIL_HOST, EMAIL_PORT, LIBRO_TITULO } from '../../config';

/**
 * Envía un correo electrónico de confirmación de compra
 * @param {Object} options - Opciones para el correo
 * @param {string} options.email - Email del destinatario
 * @param {string} options.name - Nombre del destinatario
 * @param {string} options.reference - Referencia de la compra
 */
export async function sendConfirmationEmail({ email, name, reference }) {
  console.log('Iniciando envío de correo de confirmación de compra');
  try {
    if (!email) {
      throw new Error('Email es requerido para enviar confirmación');
    }

    // Configurar el transporter de nodemailer
    let transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: true, // true para 465, false para otros puertos
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    console.log('Transporter configurado, intentando enviar email a:', email);
    
    // Crear el contenido del correo con estilos inline para mayor compatibilidad
    const info = await transporter.sendMail({
      from: `"Startups y Ángeles" <${EMAIL_USER}>`,
      to: email,
      subject: `Confirmación de compra - ${LIBRO_TITULO}`,
      html: `
        <div style="background-color: #f5f5f5; padding: 32px; max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h1 style="font-size: 24px; font-weight: bold; color: #333; margin-bottom: 16px;">¡Gracias por tu compra, ${name}!</h1>
          
          <p style="font-size: 16px; color: #555; margin-bottom: 24px;">
            Tu compra de <strong>${LIBRO_TITULO}</strong> ha sido confirmada con la referencia: <span style="font-weight: bold;">${reference}</span>
          </p>
          
          <div style="background-color: #fff; border-left: 4px solid #ffc107; padding: 16px; margin-bottom: 24px;">
            <p style="font-size: 16px; color: #555; margin: 0;">
              <strong>Importante:</strong> En la próxima hora recibirás un correo con las instrucciones para descargar tu libro.
            </p>
          </div>
          
          <p style="font-size: 16px; color: #555; margin-bottom: 8px;">Si tienes alguna pregunta, puedes responder directamente a este correo.</p>
          
          <p style="font-size: 14px; color: #777; margin-top: 32px; border-top: 1px solid #ddd; padding-top: 16px;">
            Este es un correo automático, por favor no lo respondas.
          </p>
        </div>
      `,
    });

    console.log('Email de confirmación enviado exitosamente:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error al enviar email de confirmación:', error);
    throw error;
  }
}

/**
 * Envía un correo electrónico con el enlace de descarga generado dinámicamente desde S3
 * @param {Object} options - Opciones para el correo
 * @param {string} options.email - Email del destinatario
 * @param {string} options.name - Nombre del destinatario
 */
export async function sendDownloadEmail({ email, name }) {
  console.log('Iniciando envío de correo con enlace de descarga S3');
  try {
    if (!email) {
      throw new Error('Email es requerido para enviar enlaces de descarga');
    }

    // Generar el link de descarga personalizado usando la función serverless
    const apiUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/api/generate-download-links` 
      : 'http://localhost:3000/api/generate-download-links';
    
    console.log(`Llamando a API para generar enlaces S3: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error en respuesta de API:', errorText);
      throw new Error(`No se pudo generar el enlace de descarga: ${response.status}`);
    }

    const { downloadUrl } = await response.json();
    console.log(`Enlace de descarga S3 generado: ${downloadUrl}`);

    // Configurar el transporter de nodemailer
    let transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: true,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    console.log('Transporter configurado, enviando email con enlace S3 a:', email);
    
    // Crear el contenido del correo con enlace de descarga
    const info = await transporter.sendMail({
      from: `"Startups y Ángeles" <${EMAIL_USER}>`,
      to: email,
      subject: `Tu libro ${LIBRO_TITULO} está listo para descargar`,
      html: `
        <div style="background-color: #f5f5f5; padding: 32px; max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h1 style="font-size: 24px; font-weight: bold; color: #333; margin-bottom: 16px;">¡Hola ${name}!</h1>
          
          <p style="font-size: 16px; color: #555; margin-bottom: 24px;">
            Tu libro <strong>${LIBRO_TITULO}</strong> está listo para descargar.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${downloadUrl}" style="background-color: #ffc107; color: #333; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              ACCEDER A TUS DESCARGAS
            </a>
          </div>
          
          <div style="background-color: #fff; border-left: 4px solid #ffc107; padding: 16px; margin-bottom: 24px;">
            <p style="font-size: 16px; color: #555; margin: 0;">
              <strong>Nota:</strong> Este enlace es personal y caducará en 7 días. Por favor no lo compartas.
            </p>
          </div>
          
          <p style="font-size: 16px; color: #555; margin-bottom: 8px;">¡Gracias por tu apoyo! Espero que disfrutes la lectura.</p>
          
          <p style="font-size: 14px; color: #777; margin-top: 32px; border-top: 1px solid #ddd; padding-top: 16px;">
            Este es un correo automático, por favor no lo respondas.
          </p>
        </div>
      `,
    });

    console.log('Email con enlace de descarga S3 enviado exitosamente:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error al enviar email con enlace de descarga S3:', error);
    throw error;
  }
}

/**
 * Endpoint para enviar el correo con el enlace de descarga (programado)
 */
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
// enviar-libro-lista.js
// Script independiente para enviar el libro a una lista de contactos

import nodemailer from 'nodemailer';
import { S3 } from 'aws-sdk';
import dotenv from 'dotenv';
import fs from 'fs';

// Cargar variables de entorno
dotenv.config();

// Configuración (puedes modificar estos valores o usar variables de entorno)
const EMAIL_USER = process.env.EMAIL_USER || 'hello@wearewondertech.com';
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtppro.zoho.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '465');
const LIBRO_TITULO = 'Startups y Ángeles';
const AWS_REGION = process.env.AWS_REGION || 'us-east-2';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'startups-angeles-libro';

// ===== LISTA DE CONTACTOS =====
// Añade aquí tus contactos en el formato: {email: 'ejemplo@mail.com', name: 'Nombre'}
const listaContactos = [
  {email: 'mbedoyarudas@gmail.com', name: 'Manuel Bedoya'},
  // Añade más contactos según sea necesario:
  // {email: 'correo2@ejemplo.com', name: 'Nombre Apellido'},
  // {email: 'correo3@ejemplo.com', name: 'Otro Nombre'},
];

// Función para generar enlaces de descarga
async function generateDownloadLinks(email, name) {
  try {
    // Crear cliente S3
    const s3 = new S3({
      region: AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    
    // Generar URLs firmadas (válidas por 7 días)
    const pdfUrl = s3.getSignedUrl('getObject', {
      Bucket: S3_BUCKET_NAME,
      Key: 'Startup&Angeles.pdf',
      Expires: 604800 // 7 días en segundos
    });

    const epubUrl = s3.getSignedUrl('getObject', {
      Bucket: S3_BUCKET_NAME,
      Key: 'Startup&Angeles.epub',
      Expires: 604800
    });

    // Generar una página de descarga
    const downloadPage = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Descarga tu libro - ${LIBRO_TITULO}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          .download-btn { display: block; margin: 15px 0; padding: 15px; background: #ffc107; 
                         color: #2d3748; text-decoration: none; border-radius: 5px; font-weight: bold; text-align: center; }
          .download-btn:hover { background: #e0a800; }
          .header { background-color: #2d3748; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>¡Gracias por tu compra${name ? ', ' + name : ''}!</h1>
        </div>
        
        <div style="margin: 20px 0;">
          <p>Tu libro "${LIBRO_TITULO}" está listo para descargar en los siguientes formatos:</p>
          
          <a href="${pdfUrl}" class="download-btn">Descargar en PDF</a>
          <a href="${epubUrl}" class="download-btn">Descargar en EPUB</a>
          
          <p><strong>Importante:</strong> Estos enlaces caducarán en 7 días por seguridad.</p>
        </div>
        
        <div class="footer">
          <p>Si tienes problemas con la descarga, contáctanos a hello@wearewondertech.com</p>
          <p>© ${new Date().getFullYear()} WonderTech - Todos los derechos reservados</p>
        </div>
      </body>
      </html>
    `;

    // Crear un URL firmada para esta página HTML
    const downloadPageKey = `downloads/${email.replace('@', '-at-')}-${Date.now()}.html`;
    
    await s3.putObject({
      Bucket: S3_BUCKET_NAME,
      Key: downloadPageKey,
      Body: downloadPage,
      ContentType: 'text/html',
      ACL: 'private'
    }).promise();

    const downloadPageUrl = s3.getSignedUrl('getObject', {
      Bucket: S3_BUCKET_NAME,
      Key: downloadPageKey,
      Expires: 604800
    });

    return {
      success: true,
      downloadUrl: downloadPageUrl
    };
  } catch (error) {
    console.error('Error al generar enlaces de descarga:', error);
    throw error;
  }
}

// Función para enviar correo con enlace de descarga
async function sendDownloadEmail({ email, name }) {
  try {
    if (!email) {
      throw new Error('Email es requerido para enviar enlaces de descarga');
    }

    // Generar el link de descarga personalizado
    const { downloadUrl } = await generateDownloadLinks(email, name);
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

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error al enviar email con enlace de descarga S3:', error);
    throw error;
  }
}

/**
 * Función principal para enviar el libro a todos los contactos en la lista
 */
async function enviarLibrosALista() {
  console.log(`\n=================================================`);
  console.log(`📚 ENVÍO DE LIBRO A LISTA DE CONTACTOS`);
  console.log(`=================================================\n`);
  
  // Verificar que hay contactos en la lista
  if (listaContactos.length === 0) {
    console.error('❌ Error: No hay contactos en la lista. Añade contactos en el array listaContactos.');
    process.exit(1);
  }
  
  console.log(`Total de contactos a procesar: ${listaContactos.length}`);
  
  // Verificar configuración AWS
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn('⚠️  ADVERTENCIA: Credenciales AWS no configuradas en variables de entorno');
  }
  
  // Verificar configuración Email
  if (!EMAIL_PASS) {
    console.error('❌ ERROR: Contraseña de email no configurada');
    process.exit(1);
  }
  
  // Crear archivo de registro
  const logFile = `envio-libros-${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.log`;
  fs.writeFileSync(logFile, `Registro de envíos - ${new Date().toISOString()}\n\n`);
  
  let exitosos = 0;
  let fallidos = 0;
  
  // Procesar cada contacto
  for (let i = 0; i < listaContactos.length; i++) {
    const contacto = listaContactos[i];
    console.log(`\n[${i + 1}/${listaContactos.length}] Procesando: ${contacto.email} (${contacto.name || 'Sin nombre'})`);
    
    try {
      // Enviar correo
      const resultado = await sendDownloadEmail({
        email: contacto.email,
        name: contacto.name || 'Estimado lector'
      });
      
      // Registrar éxito
      console.log(`✅ Correo enviado exitosamente a ${contacto.email}`);
      fs.appendFileSync(logFile, `✅ ${contacto.email} - OK - ${new Date().toISOString()}\n`);
      exitosos++;
      
    } catch (error) {
      // Registrar error
      console.error(`❌ Error al enviar a ${contacto.email}:`, error.message);
      fs.appendFileSync(logFile, `❌ ${contacto.email} - ERROR: ${error.message} - ${new Date().toISOString()}\n`);
      fallidos++;
    }
    
    // Pausa entre envíos para evitar límites de tasa (si hay más contactos por procesar)
    if (i < listaContactos.length - 1) {
      const segundosEspera = 3;
      console.log(`Esperando ${segundosEspera} segundos antes del siguiente envío...`);
      await new Promise(resolve => setTimeout(resolve, segundosEspera * 1000));
    }
  }
  
  // Mostrar resumen
  const resumen = `
=================================================
📊 RESUMEN DE ENVÍOS
=================================================
Total de contactos procesados: ${listaContactos.length}
✅ Correos enviados exitosamente: ${exitosos}
❌ Envíos fallidos: ${fallidos}
📝 Registro guardado en: ${logFile}
=================================================
`;
  
  console.log(resumen);
  fs.appendFileSync(logFile, resumen);
  
  return { exitosos, fallidos, total: listaContactos.length };
}

// Ejecutar la función principal
enviarLibrosALista().then(() => {
  console.log('\nProceso completado.');
}).catch(error => {
  console.error('\nError general del script:', error);
});
// src/api/generate-download-links.js
import pkg from 'aws-sdk';
const { S3 } = pkg;
import { LIBRO_TITULO } from '../../config';

export default async function handler(req, res) {
  // Solo permite solicitudes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email es requerido' });
    }

    // Configurar el cliente S3
    const s3 = new S3({
      region: process.env.AWS_REGION || 'us-east-2', // Actualizado a us-east-2 según tu URL
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });

    // Nombres correctos de los archivos según tus URLs
    const pdfKey = 'Startup&Angeles.pdf';
    const epubKey = 'Startup&Angeles.epub';

    // Generar URLs prefirmadas (válidas por 7 días)
    const pdfUrl = s3.getSignedUrl('getObject', {
      Bucket: process.env.S3_BUCKET_NAME || 'startups-angeles-libro',
      Key: pdfKey,
      Expires: 604800 // 7 días en segundos
    });

    const epubUrl = s3.getSignedUrl('getObject', {
      Bucket: process.env.S3_BUCKET_NAME || 'startups-angeles-libro',
      Key: epubKey,
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
          <p>Si tienes problemas con la descarga, contáctanos a anamariaprieto89@gmail.com</p>
          <p>© ${new Date().getFullYear()} Ana Maria Prieto - Todos los derechos reservados</p>
        </div>
      </body>
      </html>
    `;

    // Crear un URL firmada para esta página HTML
    const downloadPageKey = `downloads/${email.replace('@', '-at-')}-${Date.now()}.html`;
    
    await s3.putObject({
      Bucket: process.env.S3_BUCKET_NAME || 'startups-angeles-libro',
      Key: downloadPageKey,
      Body: downloadPage,
      ContentType: 'text/html',
      ACL: 'private'
    }).promise();

    const downloadPageUrl = s3.getSignedUrl('getObject', {
      Bucket: process.env.S3_BUCKET_NAME || 'startups-angeles-libro',
      Key: downloadPageKey,
      Expires: 604800
    });

    return res.status(200).json({
      success: true,
      downloadUrl: downloadPageUrl
    });
  } catch (error) {
    console.error('Error al generar enlaces de descarga:', error);
    return res.status(500).json({ error: 'Error al generar enlaces de descarga' });
  }
}
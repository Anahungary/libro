// src/services/s3Service.js
import pkg from 'aws-sdk';
const { S3 } = pkg;
import { LIBRO_TITULO } from '../config';

// Crear cliente S3 con tus credenciales
function createS3Client() {
  const s3 = new S3({
    region: process.env.AWS_REGION || 'us-east-2',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });
  return s3;
}

// Generar URLs firmadas para archivos PDF y EPUB
export async function generateDownloadLinks(email, name) {
  try {
    const s3 = createS3Client();
    const bucketName = process.env.S3_BUCKET_NAME || 'startups-angeles-libro';
    
    // Generar URLs firmadas (válidas por 7 días)
    const pdfUrl = s3.getSignedUrl('getObject', {
      Bucket: bucketName,
      Key: 'Startup&Angeles.pdf',
      Expires: 604800 // 7 días en segundos
    });

    const epubUrl = s3.getSignedUrl('getObject', {
      Bucket: bucketName,
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
      Bucket: bucketName,
      Key: downloadPageKey,
      Body: downloadPage,
      ContentType: 'text/html',
      ACL: 'private'
    }).promise();

    const downloadPageUrl = s3.getSignedUrl('getObject', {
      Bucket: bucketName,
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
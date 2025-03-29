// src/pages/api/test-complete-system.js
import pkg from 'aws-sdk';
const { S3 } = pkg;
import { generateDownloadLinks } from '../../services/s3Service';
import { sendDownloadEmail } from '../../services/emailService';

export async function GET() {
  try {
    // 1. Verificar conexión a S3
    const s3 = new S3({
      region: process.env.AWS_REGION || 'us-east-2',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    
    const bucketName = process.env.S3_BUCKET_NAME || 'startups-angeles-libro';
    
    // Verificar que podemos listar objetos
    const objects = await s3.listObjects({
      Bucket: bucketName
    }).promise();
    
    const fileList = objects.Contents.map(item => item.Key);
    
    // 2. Verificar que los archivos del libro existen
    const pdfExists = fileList.includes('Startup&Angeles.pdf');
    const epubExists = fileList.includes('Startup&Angeles.epub');
    
    if (!pdfExists || !epubExists) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Archivos del libro no encontrados en el bucket',
        fileList
      }, null, 2), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // 3. Probar la generación de enlaces
    const testEmail = 'test@ejemplo.com';
    const testName = 'Usuario de Prueba';
    
    const downloadLinks = await generateDownloadLinks(testEmail, testName);
    
    // 4. Todo está correcto, mostrar resultados (sin enviar correo real)
    return new Response(JSON.stringify({
      success: true,
      message: 'El sistema de descarga está configurado correctamente',
      s3Connection: {
        success: true,
        bucket: bucketName,
        region: process.env.AWS_REGION || 'us-east-2',
        files: {
          pdfExists,
          epubExists,
          totalFiles: fileList.length
        }
      },
      downloadLinks: {
        success: downloadLinks.success,
        downloadUrl: downloadLinks.downloadUrl
      },
      sendEmailEndpoint: '/api/send-download-email',
      scheduledEmailEndpoint: '/api/send-scheduled-emails'
    }, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error('Error al probar el sistema completo:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `Error al probar el sistema: ${error.message}`,
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Endpoint opcional para probar el envío real de correo
export async function POST({ request }) {
  try {
    const { email, name } = await request.json();
    
    if (!email || !name) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email y nombre son requeridos'
      }, null, 2), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Enviar correo real
    await sendDownloadEmail({ email, name });
    
    return new Response(JSON.stringify({
      success: true,
      message: `Correo enviado exitosamente a ${email}`,
      email,
      name
    }, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error('Error al enviar correo de prueba:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `Error al enviar correo: ${error.message}`
    }, null, 2), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
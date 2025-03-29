// src/api/test-s3-connection.js
import pkg from 'aws-sdk';
const { S3 } = pkg;

// Función auxiliar para probar la conexión S3
async function testS3Connection(request) {
  try {
    // Configurar el cliente S3
    const s3 = new S3({
      region: process.env.AWS_REGION || 'us-east-2',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });

    // Verificar que podemos listar los objetos en el bucket
    const objects = await s3.listObjects({
      Bucket: process.env.S3_BUCKET_NAME || 'startups-angeles-libro',
    }).promise();

    // Verificar que los archivos del libro existen
    const pdfExists = objects.Contents.some(obj => obj.Key === 'Startup&Angeles.pdf');
    const epubExists = objects.Contents.some(obj => obj.Key === 'Startup&Angeles.epub');
    
    // Lista todos los archivos para depuración
    const fileList = objects.Contents.map(obj => obj.Key);

    return {
      success: true,
      message: 'Conexión a S3 exitosa',
      bucket: process.env.S3_BUCKET_NAME || 'startups-angeles-libro',
      region: process.env.AWS_REGION || 'us-east-2',
      files: {
        pdfExists,
        epubExists,
        allFiles: fileList
      },
      objectCount: objects.Contents.length,
      environment: process.env.VERCEL_ENV || 'development'
    };
  } catch (error) {
    console.error('Error al probar la conexión con S3:', error);
    return {
      success: false,
      error: `Error de conexión con S3: ${error.message}`,
      errorCode: error.code,
      // Añade las credenciales para depuración (sin exponer las claves completas)
      credentials: {
        region: process.env.AWS_REGION || 'us-east-2',
        accessKeyIdPrefix: process.env.AWS_ACCESS_KEY_ID ? `${process.env.AWS_ACCESS_KEY_ID.substring(0, 5)}...` : 'no configurado',
        secretAccessKeySet: !!process.env.AWS_SECRET_ACCESS_KEY,
        bucketName: process.env.S3_BUCKET_NAME || 'startups-angeles-libro'
      }
    };
  }
}

// Exportar un controlador específico para GET (para Astro/Next.js API routes)
export async function GET(request) {
  const result = await testS3Connection(request);
  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 500,
    headers: { "Content-Type": "application/json" }
  });
}

// Mantener el controlador predeterminado para compatibilidad (para Next.js pages API)
export default async function handler(req, res) {
  const result = await testS3Connection();
  return res.status(result.success ? 200 : 500).json(result);
  try {
    // Configurar el cliente S3
    const s3 = new S3({
      region: process.env.AWS_REGION || 'us-east-2',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });

    // Verificar que podemos listar los objetos en el bucket
    const objects = await s3.listObjects({
      Bucket: process.env.S3_BUCKET_NAME || 'startups-angeles-libro',
    }).promise();

    // Verificar que los archivos del libro existen
    const pdfExists = objects.Contents.some(obj => obj.Key === 'Startup&Angeles.pdf');
    const epubExists = objects.Contents.some(obj => obj.Key === 'Startup&Angeles.epub');

    const responseData = {
      success: true,
      message: 'Conexión a S3 exitosa',
      bucket: process.env.S3_BUCKET_NAME || 'startups-angeles-libro',
      region: process.env.AWS_REGION || 'us-east-2',
      files: {
        pdfExists,
        epubExists,
      },
      objectCount: objects.Contents.length,
      environment: process.env.VERCEL_ENV || 'development'
    };

    // Si es un entorno API moderno (Astro/Next.js API routes)
    if (request) {
      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } 
    // Si es un entorno Express tradicional (Node.js/Next.js pages API)
    else {
      return res.status(200).json(responseData);
    }
  } catch (error) {
    console.error('Error al probar la conexión con S3:', error);
    const errorData = {
      success: false,
      error: `Error de conexión con S3: ${error.message}`,
      errorCode: error.code
    };
    
    // Si es un entorno API moderno (Astro/Next.js API routes)
    if (request) {
      return new Response(JSON.stringify(errorData), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    } 
    // Si es un entorno Express tradicional (Node.js/Next.js pages API)
    else {
      return res.status(500).json(errorData);
    }
  }
}
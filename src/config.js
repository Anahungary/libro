// Configuración de variables de entorno
export const AIRTABLE_PAT = import.meta.env.AIRTABLE_PAT;
export const AIRTABLE_BASE_ID_LIBRO = import.meta.env.AIRTABLE_BASE_ID_LIBRO || 'appJKYPrXMKmCtRyJ';

// Configuración de Wompi (Bancolombia)
export const WOMPI_PUBLIC_KEY = import.meta.env.WOMPI_PUBLIC_KEY;
export const WOMPI_INTEGRITY_SECRET = import.meta.env.WOMPI_INTEGRITY_SECRET;

// Configuración de correo electrónico
export const EMAIL_USER = 'hello@wearewondertech.com';
export const EMAIL_PASS = import.meta.env.EMAIL_PASS;
export const EMAIL_HOST = 'smtppro.zoho.com';
export const EMAIL_PORT = 465;

// Configuración del libro
export const LIBRO_PRECIO = 15000; // Precio en COP
export const LIBRO_PRECIO_CENTS = LIBRO_PRECIO * 100; // Precio en centavos para Wompi
export const LIBRO_TITULO = 'Startups y Ángeles';

// Nueva configuración para S3 (opcional, ya que principalmente usaremos variables de entorno)
export const AWS_REGION = import.meta.env.AWS_REGION || 'us-east-1';
export const S3_BUCKET_NAME = import.meta.env.S3_BUCKET_NAME || 'startups-angeles-libro';

// Ya no se usa esta variable, la hemos reemplazado con generación dinámica de enlaces
// export const LIBRO_DOWNLOAD_LINK = import.meta.env.LIBRO_DOWNLOAD_LINK || 'https://drive.google.com/file/d/yourfile/view';
import { WOMPI_INTEGRITY_SECRET, LIBRO_PRECIO_CENTS } from '../../config';

/**
 * Genera la firma de integridad para Wompi/Bancolombia según la documentación oficial
 */
export async function POST({ request }) {
  console.log('Generando firma de integridad Wompi');
  try {
    if (!WOMPI_INTEGRITY_SECRET) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'WOMPI_INTEGRITY_SECRET no está configurado' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const jsonData = await request.json();
    console.log('Datos recibidos:', jsonData);
    
    const reference = jsonData.reference;
    const amountInCents = jsonData.amountInCents || LIBRO_PRECIO_CENTS;
    const currency = 'COP';

    if (!reference) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Referencia es requerida' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generar firma de integridad para Wompi según la documentación oficial
    // Concatenar los valores en el orden correcto: <Referencia><Monto><Moneda><SecretoIntegridad>
    const dataToHash = `${reference}${amountInCents}${currency}${WOMPI_INTEGRITY_SECRET}`;
    
    // Mostrar para debug (sin exponer el secreto)
    const debugString = `${reference}${amountInCents}${currency}[SECRET]`;
    console.log('Cadena concatenada (sin secreto):', debugString);
    
    // Usar el método recomendado por Wompi en su documentación para JavaScript
    const encoder = new TextEncoder();
    const data = encoder.encode(dataToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('Firma generada:', signature);
    
    return new Response(JSON.stringify({
      success: true,
      signature,
      reference,
      amountInCents
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al generar la firma:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: `Error al generar la firma: ${error.message}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
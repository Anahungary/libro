// src/pages/api/send-scheduled-emails.js
import { AIRTABLE_PAT, AIRTABLE_BASE_ID_LIBRO } from '../../config';
import { sendDownloadEmail } from '../../services/emailService';

/**
 * Función que envía los correos con enlaces de descarga para compras aprobadas
 * y no procesadas aún - Usa la nueva integración con AWS S3
 */
export async function GET() {
  console.log('Iniciando envío programado de correos de descarga con S3');
  try {
    // Buscar compras aprobadas que no tengan el email de descarga enviado
    console.log('Buscando compras aprobadas sin email de descarga enviado');
    
    const findResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID_LIBRO}/Características?filterByFormula=AND({fldOllQz9j4S9pR9Z}='APROBADA',{flddJgCkA4zKQpG3m}=0)`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_PAT}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!findResponse.ok) {
      console.error('Error en la respuesta de Airtable:', findResponse.status, await findResponse.text());
      throw new Error(`Error al buscar compras pendientes: ${findResponse.status}`);
    }

    const findResult = await findResponse.json();
    console.log(`Se encontraron ${findResult.records.length} compras pendientes de envío`);
    
    if (findResult.records.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No hay compras pendientes de envío de descarga' 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Procesar cada registro
    const results = [];
    for (const record of findResult.records) {
      const recordId = record.id;
      const email = record.fields["fldmFju9UhKY3I3F4"]; // Correo electrónico
      const nombre = record.fields["fldk0WE0AxDPowgHR"] || ''; // Nombre
      const apellido = record.fields["fldPLCi3ZnU7B1dFF"] || ''; // Apellido
      const fullName = `${nombre} ${apellido}`.trim();
      
      console.log(`Procesando compra ID: ${recordId}, email: ${email}`);
      
      try {
        if (!email) {
          console.error('Email no disponible para el registro:', recordId);
          results.push({
            email: 'No disponible',
            success: false,
            error: 'Email faltante'
          });
          continue;
        }
        
        // Enviar correo con enlace de descarga generado dinámicamente con S3
        await sendDownloadEmail({
          email,
          name: fullName || 'Estimado lector'
        });
        
        // Actualizar registro para marcar como enviado
        const updateResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID_LIBRO}/Características/${recordId}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${AIRTABLE_PAT}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fields: {
                "flddJgCkA4zKQpG3m": 1, // descargaEnviada
              }
            })
          }
        );
        
        if (!updateResponse.ok) {
          const errorBody = await updateResponse.text();
          console.error('Error al actualizar estado de envío:', updateResponse.status, errorBody);
          results.push({
            email,
            success: false,
            error: `Error al actualizar estado: ${updateResponse.status}`
          });
          continue;
        }
        
        results.push({
          email,
          success: true
        });
        
        console.log(`Email de descarga con links S3 enviado exitosamente a ${email}`);
      } catch (error) {
        console.error(`Error al procesar compra ${recordId}:`, error);
        results.push({
          email: email || 'No disponible',
          success: false,
          error: error.message
        });
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Procesados ${results.length} correos de descarga con S3`, 
      results 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error('Error al enviar correos programados con S3:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Error al enviar correos programados con S3: ${error.message}` 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
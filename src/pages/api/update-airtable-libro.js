import { AIRTABLE_PAT, AIRTABLE_BASE_ID_LIBRO } from '../../config';
import { sendConfirmationEmail } from './send-confirmation-email';

/**
 * Almacena la información de compra en Airtable
 */
export async function POST({ request }) {
  try {
    const jsonData = await request.json();
    console.log('Datos recibidos del formulario:', JSON.stringify(jsonData, null, 2));

    // Validación básica
    if (!jsonData.email) {
      return new Response(JSON.stringify({ error: "El email es requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Generar referencia única para la transacción
    const reference = `LIBRO-${Date.now()}`;

    // Preparar los datos para Airtable usando los field IDs correctos
    const data = {
      records: [
        {
          fields: {
            "fldk0WE0AxDPowgHR": jsonData.nombre || '', // Nombre
            "fldPLCi3ZnU7B1dFF": jsonData.apellido || '', // Apellido
            "fldmFju9UhKY3I3F4": jsonData.email || '', // Correo electrónico
            "fldFqQhWP0ZRYkpYp": jsonData.telefono || '', // Número de Teléfono
            "fldOllQz9j4S9pR9Z": jsonData.estado || 'PENDIENTE', // Seleccionar (estado)
            "flddJgCkA4zKQpG3m": 0 // descargaEnviada
          },
        },
      ],
    };
    
    console.log('Datos preparados para Airtable:', JSON.stringify(data, null, 2));

    // Enviar datos a Airtable
    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID_LIBRO}/Características`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_PAT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, typecast: true }),
      }
    );  

    console.log('Respuesta de Airtable recibida. Status:', airtableResponse.status);

    if (!airtableResponse.ok) {
      const errorBody = await airtableResponse.text();
      console.error('Error detallado de Airtable:', errorBody);
      throw new Error(`Error de Airtable: ${airtableResponse.status}`);
    }

    const airtableResult = await airtableResponse.json();
    console.log('Respuesta exitosa de Airtable:', JSON.stringify(airtableResult, null, 2));

    // Devolver confirmación de datos enviados
    return new Response(JSON.stringify({
      success: true,
      message: 'Datos enviados correctamente a Airtable',
      reference: reference
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error('Error detallado en el servidor:', error);
    return new Response(JSON.stringify({ error: `Error en el servidor: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Actualiza el estado de la transacción en Airtable y envía correo si es aprobada
 */
export async function updateTransactionStatus(reference, status) {
  console.log('updateTransactionStatus llamada con:', { reference, status });
  try {
    let airtableStatus;
    switch(status?.toUpperCase()) {
      case 'APPROVED':
      case 'APROBADA':
        airtableStatus = 'APROBADA';
        break;
      case 'DECLINED':
      case 'REJECTED':
      case 'RECHAZADA':
        airtableStatus = 'RECHAZADA';
        break;
      case 'PENDING':
      case 'PENDIENTE':
        airtableStatus = 'PENDIENTE';
        break;
      case 'ERROR':
        airtableStatus = 'ERROR';
        break;
      default:
        airtableStatus = 'DESCONOCIDO';
        console.warn('Estado no reconocido:', status);
    }
    console.log('Estado mapeado:', airtableStatus);

    // En vez de buscar por referencia, vamos a buscar por correo electrónico
    // ya que no estamos guardando la referencia
    // Asumimos que se pasó el correo electrónico a la función
    const email = reference; // Usamos la referencia como email para este caso

    console.log(`Buscando registro en Airtable con email: ${email}`);
    const findResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID_LIBRO}/Características?filterByFormula={fldmFju9UhKY3I3F4}='${email}'`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_PAT}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!findResponse.ok) {
      console.error('Error en la respuesta de Airtable:', findResponse.status, await findResponse.text());
      throw new Error(`Error al buscar el registro: ${findResponse.status}`);
    }

    const findResult = await findResponse.json();
    console.log('Resultado de la búsqueda en Airtable:', findResult);
    if (findResult.records.length === 0) {
      throw new Error('No se encontró el registro con el email proporcionado');
    }

    const record = findResult.records[0];
    const recordId = record.id;

    console.log('Registro encontrado en Airtable:', JSON.stringify(record, null, 2));

    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID_LIBRO}/Características/${recordId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_PAT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            "fldOllQz9j4S9pR9Z": airtableStatus // Seleccionar (estado)
          }
        })
      }
    );
    
    if (!airtableResponse.ok) {
      const errorBody = await airtableResponse.text();
      console.error('Error al actualizar Airtable:', airtableResponse.status, errorBody);
      throw new Error(`Error al actualizar el estado: ${airtableResponse.status} - ${errorBody}`);
    }
    
    console.log('Estado de transacción actualizado en Airtable:', airtableStatus);
    
    // Si la compra fue aprobada, enviar correo de confirmación
    if (airtableStatus === 'APROBADA') {
      const emailData = {
        email: record.fields["fldmFju9UhKY3I3F4"], // Correo electrónico
        name: `${record.fields["fldk0WE0AxDPowgHR"]} ${record.fields["fldPLCi3ZnU7B1dFF"]}`, // Nombre + Apellido
      };
    
      try {
        console.log('Intentando enviar email de confirmación con datos:', emailData);
        await sendConfirmationEmail(emailData);
        console.log('Correo de confirmación enviado exitosamente');
      } catch (error) {
        console.error('Error al enviar correo de confirmación:', error);
      }
    } else {
      console.log('No se envía email porque el estado no es APROBADA');
    }

    const result = {
      status: airtableStatus,
      email: record.fields["fldmFju9UhKY3I3F4"], // Correo electrónico
      name: `${record.fields["fldk0WE0AxDPowgHR"]} ${record.fields["fldPLCi3ZnU7B1dFF"]}` // Nombre + Apellido
    };
    console.log('Resultado final de updateTransactionStatus:', result);
    return result;
  } catch (error) {
    console.error('Error al actualizar el estado de la transacción:', error);
    throw error;
  }
}
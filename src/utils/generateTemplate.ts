import * as XLSX from 'xlsx';

export const generateImportTemplate = () => {
  // Crear libro de trabajo
  const wb = XLSX.utils.book_new();
  
  // Definir datos de ejemplo con encabezados
  const data = [
    [
      'Email',
      'Nombre', 
      'Apellido',
      'Nombre Evento',
      'ID Evento',
      'ID Ticket',
      'Teléfono',
      'Documento Identidad',
      'Género',
      'Fecha Nacimiento',
      'Dirección',
      'Sección',
      'Tiketera',
      'Tipo Ticket Nombre',
      'Fecha Compra'
    ],
    [
      'ejemplo@correo.com',
      'Juan',
      'Pérez',
      'Concierto Rock 2025',
      '',
      '',
      '+58 412 1234567',
      'V-12345678',
      'Masculino',
      '1990-05-15',
      'Calle Principal #123',
      'VIP',
      'Ticketmaster',
      'General',
      '2025-01-15'
    ],
    [],
    ['COLUMNAS OBLIGATORIAS: Email, Nombre, Apellido, Nombre Evento'],
    ['Los campos ID Evento e ID Ticket son opcionales. Si no se proporcionan, se usará "Shows" como evento por defecto.'],
    ['Formato de fechas: YYYY-MM-DD (ejemplo: 2025-01-15)']
  ];
  
  // Crear hoja de cálculo
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Establecer anchos de columna
  ws['!cols'] = [
    { wch: 30 }, // Email
    { wch: 20 }, // Nombre
    { wch: 20 }, // Apellido
    { wch: 30 }, // Nombre Evento
    { wch: 38 }, // ID Evento
    { wch: 38 }, // ID Ticket
    { wch: 15 }, // Teléfono
    { wch: 18 }, // Documento Identidad
    { wch: 12 }, // Género
    { wch: 18 }, // Fecha Nacimiento
    { wch: 35 }, // Dirección
    { wch: 15 }, // Sección
    { wch: 15 }, // Tiketera
    { wch: 20 }, // Tipo Ticket Nombre
    { wch: 18 }, // Fecha Compra
  ];
  
  // Agregar hoja al libro
  XLSX.utils.book_append_sheet(wb, ws, 'Asistentes');
  
  // Generar archivo y descargar
  XLSX.writeFile(wb, 'Plantilla_Importacion.xlsx');
};

// Utility functions for exporting data to Excel and PDF
import * as XLSX from 'xlsx';
import { formatCOP } from '../../lib/format';

export const exportToExcel = (data: any[], filename: string) => {
  // Convert data to CSV format
  if (data.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Nueva función para exportar a Excel real (.xlsx)
export const exportToExcelXLSX = (data: any[], filename: string, sheetName: string = 'Datos') => {
  if (data.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  // Crear un nuevo libro de trabajo
  const workbook = XLSX.utils.book_new();

  // Convertir los datos a una hoja de trabajo
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Ajustar el ancho de las columnas automáticamente
  const headers = Object.keys(data[0]);
  const columnWidths = headers.map(header => {
    const maxLength = Math.max(
      header.length,
      ...data.map(row => String(row[header] || '').length)
    );
    return { wch: Math.min(maxLength + 2, 50) }; // Límite máximo de 50 caracteres
  });
  worksheet['!cols'] = columnWidths;

  // Agregar la hoja de trabajo al libro
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generar el archivo y descargarlo
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportToPDF = (data: any[], _filename: string, title: string) => {
  // Simple PDF export using HTML canvas technique
  // For production, consider using a library like jsPDF

  const printWindow = window.open('', '', 'height=600,width=800');
  if (!printWindow) return;

  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  printWindow.document.write('<html><head><title>' + title + '</title>');
  printWindow.document.write('<style>');
  printWindow.document.write('body { font-family: Arial, sans-serif; padding: 20px; }');
  printWindow.document.write('h1 { color: #1a1a1a; border-bottom: 3px solid #D4AF37; padding-bottom: 10px; }');
  printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 20px; }');
  printWindow.document.write('th { background-color: #1a1a1a; color: #D4AF37; padding: 12px; text-align: left; }');
  printWindow.document.write('td { border: 1px solid #ddd; padding: 8px; }');
  printWindow.document.write('tr:nth-child(even) { background-color: #f9f9f9; }');
  printWindow.document.write('</style></head><body>');
  printWindow.document.write('<h1>' + title + '</h1>');
  printWindow.document.write('<table>');
  printWindow.document.write('<thead><tr>');
  headers.forEach(header => {
    printWindow.document.write('<th>' + header + '</th>');
  });
  printWindow.document.write('</tr></thead><tbody>');
  data.forEach(row => {
    printWindow.document.write('<tr>');
    headers.forEach(header => {
      printWindow.document.write('<td>' + (row[header] || '') + '</td>');
    });
    printWindow.document.write('</tr>');
  });
  printWindow.document.write('</tbody></table></body></html>');
  printWindow.document.close();

  setTimeout(() => {
    printWindow.print();
  }, 250);
};

export const downloadMenu = (productos: any[]) => {
  const menuWindow = window.open('', '', 'height=800,width=600');
  if (!menuWindow) return;

  menuWindow.document.write('<html><head><title>Menú de Productos - CzBarber</title>');
  menuWindow.document.write('<style>');
  menuWindow.document.write('body { font-family: Arial, sans-serif; background: linear-gradient(to bottom, #1a1a1a, #2d2d2d); color: white; padding: 40px; }');
  menuWindow.document.write('.header { text-align: center; border-bottom: 3px solid #D4AF37; padding-bottom: 20px; margin-bottom: 30px; }');
  menuWindow.document.write('.header h1 { color: #D4AF37; font-size: 2.5em; margin: 0; }');
  menuWindow.document.write('.header p { color: #ccc; margin-top: 10px; }');
  menuWindow.document.write('.category { margin-bottom: 30px; }');
  menuWindow.document.write('.category h2 { color: #D4AF37; border-bottom: 2px solid #D4AF37; padding-bottom: 10px; }');
  menuWindow.document.write('.product { display: flex; justify-content: space-between; padding: 15px; margin: 10px 0; background: rgba(212, 175, 55, 0.1); border-left: 4px solid #D4AF37; border-radius: 4px; }');
  menuWindow.document.write('.product-name { font-weight: bold; color: white; }');
  menuWindow.document.write('.product-desc { color: #ccc; font-size: 0.9em; margin-top: 5px; }');
  menuWindow.document.write('.product-price { color: #D4AF37; font-weight: bold; font-size: 1.2em; }');
  menuWindow.document.write('.footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #D4AF37; color: #ccc; }');
  menuWindow.document.write('</style></head><body>');
  menuWindow.document.write('<div class="header">');
  menuWindow.document.write('<h1>CZBARBER</h1>');
  menuWindow.document.write('<p>Menú de Productos y Servicios</p>');
  menuWindow.document.write('</div>');

  // Group products by category
  const categorias = [...new Set(productos.map(p => p.categoria || 'Otros'))];

  categorias.forEach(categoria => {
    const productosCat = productos.filter(p => (p.categoria || 'Otros') === categoria);
    menuWindow.document.write('<div class="category">');
    menuWindow.document.write('<h2>' + categoria + '</h2>');
    productosCat.forEach(producto => {
      menuWindow.document.write('<div class="product">');
      menuWindow.document.write('<div>');
      menuWindow.document.write('<div class="product-name">' + producto.nombre + '</div>');
      if (producto.descripcion) {
        menuWindow.document.write('<div class="product-desc">' + producto.descripcion + '</div>');
      }
      menuWindow.document.write('</div>');
      menuWindow.document.write('<div class="product-price">' + formatCOP(producto.precio) + '</div>');
      menuWindow.document.write('</div>');
    });
    menuWindow.document.write('</div>');
  });

  menuWindow.document.write('<div class="footer">');
  menuWindow.document.write('<p>CzBarber - Estilo, Elegancia, Excelencia</p>');
  menuWindow.document.write('</div>');
  menuWindow.document.write('</body></html>');
  menuWindow.document.close();

  setTimeout(() => {
    menuWindow.print();
  }, 250);
};
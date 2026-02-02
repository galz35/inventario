import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateOTPDF = (ot: any, signatureImg: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFillColor(30, 41, 59); // Dark blue header
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('REPORTE DE SERVICIO TÉCNICO', 15, 20);

    doc.setFontSize(10);
    doc.text(`Orden de Trabajo #${ot.idOT}`, 15, 30);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, pageWidth - 40, 30);

    // Client Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('I. INFORMACIÓN DEL CLIENTE', 15, 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const clientData = [
        ['Cliente', ot.clienteNombre || ot.cliente],
        ['Contacto', ot.contactoNombre || '--'],
        ['Teléfono', ot.telefono || '--'],
        ['Dirección', ot.clienteDireccion || ot.direccion || '--'],
    ];

    autoTable(doc, {
        startY: 55,
        head: [],
        body: clientData,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
    });

    // Work Detail
    let finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('II. DETALLE DEL TRABAJO', 15, finalY);

    const workData = [
        ['Tipo de Trabajo', ot.tipoOT || ot.tipo],
        ['Prioridad', ot.prioridad],
        ['Técnico Asignado', ot.tecnicoNombre || ot.tecnico || 'Sin Asignar'],
        ['Estado Final', 'FINALIZADO'],
        ['Fecha Inicio', ot.fechaAsignacion ? new Date(ot.fechaAsignacion).toLocaleString() : '--'],
        ['Fecha Fin', new Date().toLocaleString()],
    ];

    autoTable(doc, {
        startY: finalY + 5,
        head: [],
        body: workData,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40, fillColor: [241, 245, 249] } }
    });

    // Description & Notes
    finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFont('helvetica', 'bold');
    doc.text('Descripción del Problema / Solicitud:', 15, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const descLines = doc.splitTextToSize(ot.descripcionTrabajo || 'Sin descripción', pageWidth - 30);
    doc.text(descLines, 15, finalY + 7);

    const descHeight = descLines.length * 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Resolución / Notas de Cierre:', 15, finalY + descHeight + 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const notasLines = doc.splitTextToSize(ot.notas || 'Trabajo completado satisfactoriamente.', pageWidth - 30);
    doc.text(notasLines, 15, finalY + descHeight + 22);

    // Signature
    finalY = finalY + descHeight + 40;

    if (finalY > 250) {
        doc.addPage();
        finalY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('III. CONFORMIDAD DEL CLIENTE', 15, finalY);

    if (signatureImg) {
        doc.addImage(signatureImg, 'PNG', 15, finalY + 5, 80, 40);
        doc.line(15, finalY + 45, 95, finalY + 45);
        doc.setFontSize(8);
        doc.text('Firma del Cliente', 15, finalY + 50);
        doc.text(`Aceptado el: ${new Date().toLocaleString()}`, 15, finalY + 55);
    }

    // Disclaimer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Este documento es un comprobante digital de servicio. InventarioApp v1.0', 15, doc.internal.pageSize.height - 10);

    doc.save(`OT-${ot.idOT}-Reporte.pdf`);
};

export const generateInventoryPDF = (inventory: any[], almacenName: string = 'General') => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const dateStr = new Date().toLocaleString();

    // 1. Header Corp
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Logo Placeholder or Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE EXISTENCIAS', 15, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Almacén: ${almacenName.toUpperCase()}`, 15, 30);
    doc.text(`Fecha de Corte: ${dateStr}`, 15, 35);

    // Summary Box
    const totalItems = inventory.reduce((acc, item) => acc + (item.stockActual || 0), 0);
    const totalValue = inventory.reduce((acc, item) => acc + ((item.stockActual || 0) * (item.costoPromedio || 0)), 0);

    doc.setTextColor(255, 255, 255);
    doc.text(`Total Ítems: ${totalItems}`, pageWidth - 60, 20);
    doc.text(`Valor Total: $${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, pageWidth - 60, 28);

    // 2. Table
    const tableData = inventory.map(item => [
        item.codigo || 'S/C',
        item.nombre || 'Sin Nombre',
        item.categoria || '--',
        item.stockActual || 0,
        `$${item.costoPromedio || 0}`,
        `$${((item.stockActual || 0) * (item.costoPromedio || 0)).toFixed(2)}`
    ]);

    autoTable(doc, {
        startY: 45,
        head: [['Código', 'Descripción', 'Categoría', 'Stock', 'Costo Unit.', 'Valor Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [71, 85, 105] }, // Slate 600
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 25, fontStyle: 'bold' },
            1: { cellWidth: 'auto' }, // Descrip
            3: { halign: 'center', fontStyle: 'bold' }, // Stock
            5: { halign: 'right', fontStyle: 'bold' } // Total Value
        }
    });

    // Disclaimer Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount} - Generado por Sistema Integrado de Inventario`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    doc.save(`Inventario_${almacenName}_${new Date().toISOString().split('T')[0]}.pdf`);
};

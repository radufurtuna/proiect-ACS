import type { Schedule } from '@/types/schedule';

// Tipuri pentru datele tabelului
type ScheduleTableData = {
  [day: string]: {
    [hour: string]: {
      [groupCode: string]: {
        subject: string;
        professor: string;
        room: string;
        oddWeek?: {
          subject: string;
          professor: string;
          room: string;
        };
      } | null;
    };
  };
};

const DAYS = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
const TIME_SLOTS = ['8.00-9.30', '9.45-11.15', '11.30-13.00', '13.30-15.00', '15.15-16.45', '17.00-18.30', '18.45-20.15'];

/**
 * Exportează orarul în format Excel
 * @param schedules - Lista de schedule-uri de exportat
 * @param groupCodes - Lista de coduri de grupe (în ordinea corectă)
 * @param selectedGroup - Grupa selectată ('all' pentru toate grupele)
 */
export const exportScheduleToExcel = async (
  schedules: Schedule[],
  groupCodes: string[],
  selectedGroup: string = 'all'
): Promise<void> => {
  try {
    // Import dinamic exceljs pentru a evita probleme de SSR
    const ExcelJS = (await import('exceljs')).default;

    // Filtrează schedule-urile în funcție de grupă
    const filteredSchedules =
      selectedGroup === 'all'
        ? schedules
        : schedules.filter((s) => s.group.code === selectedGroup);

    // Construiește structura de date pentru tabel
    const tableData: ScheduleTableData = {};
    
    // Inițializează structura
    for (const day of DAYS) {
      tableData[day] = {};
      for (const hour of TIME_SLOTS) {
        tableData[day][hour] = {};
        for (const groupCode of groupCodes) {
          tableData[day][hour][groupCode] = null;
        }
      }
    }

    // Populează datele
    for (const schedule of filteredSchedules) {
      if (tableData[schedule.day] && tableData[schedule.day][schedule.hour]) {
        const cellData: any = {
          subject: schedule.subject.name,
          professor: schedule.professor.full_name,
          room: schedule.room.code,
        };
        
        // Adaugă datele pentru săptămâna impară dacă există
        if (schedule.odd_week_subject && schedule.odd_week_professor && schedule.odd_week_room) {
          cellData.oddWeek = {
            subject: schedule.odd_week_subject.name,
            professor: schedule.odd_week_professor.full_name,
            room: schedule.odd_week_room.code,
          };
        }
        
        tableData[schedule.day][schedule.hour][schedule.group.code] = cellData;
      }
    }

    // Creează workbook-ul Excel
    const workbook = new ExcelJS.Workbook();
    const sheetName = selectedGroup === 'all' ? 'Orar ' : `Orar ${selectedGroup}`;
    const worksheet = workbook.addWorksheet(sheetName);

    // Setează lățimile coloanelor
    worksheet.getColumn(1).width = 12; // Zilele
    worksheet.getColumn(2).width = 15; // Orele
    for (let i = 0; i < groupCodes.length; i++) {
      worksheet.getColumn(3 + i).width = 25; // Grupele
    }

    // Header-ul
    const headerRow = worksheet.addRow(['Zilele', 'Orele', ...groupCodes]);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F0F0' },
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    // Adaugă border-uri pentru header
    headerRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Adaugă datele
    let currentRowIndex = 2; // După header
    const mergeCellsInfo: Array<{ startRow: number; endRow: number; day: string }> = [];

    for (const day of DAYS) {
      const dayStartRow = currentRowIndex;

      for (let i = 0; i < TIME_SLOTS.length; i++) {
        const hour = TIME_SLOTS[i];
        const row = worksheet.addRow([]);

        // Adaugă ziua doar pentru prima oră
        if (i === 0) {
          const dayCell = row.getCell(1);
          dayCell.value = day;
          dayCell.font = { bold: true };
          dayCell.alignment = { horizontal: 'center', vertical: 'middle' };
        }

        // Adaugă ora
        const hourCell = row.getCell(2);
        hourCell.value = hour;
        hourCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // Adaugă datele pentru fiecare grupă
        for (let groupIndex = 0; groupIndex < groupCodes.length; groupIndex++) {
          const groupCode = groupCodes[groupIndex];
          const cell = tableData[day]?.[hour]?.[groupCode];
          const excelCell = row.getCell(3 + groupIndex);

          if (cell) {
            // Combină toate informațiile într-un singur string cu newline
            let cellValue = `${cell.subject}\n${cell.professor}\n${cell.room}`;
            
            // Adaugă datele pentru săptămâna impară dacă există
            if (cell.oddWeek) {
              cellValue += `\n\n─────────────\nSăpt. Impară:\n${cell.oddWeek.subject}\n${cell.oddWeek.professor}\n${cell.oddWeek.room}`;
            }
            
            excelCell.value = cellValue;
            excelCell.alignment = { 
              horizontal: 'center', 
              vertical: 'top', // Aliniere la partea de sus pentru a avea mai mult spațiu
              wrapText: true // Permite textul pe mai multe linii
            };
            excelCell.font = { size: 9 }; // Font puțin mai mic pentru a încăpea mai mult text
            excelCell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
            
            // Nu aplicăm fundal gri pe întreaga celulă - în Excel nu putem avea styling parțial
            // Folosim doar separatorul vizual (linia cu "─────────────")
          } else {
            excelCell.value = '—';
            excelCell.alignment = { horizontal: 'center', vertical: 'middle' };
            excelCell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
          }
        }

        // Border-urile se adaugă individual pentru fiecare celulă mai sus

        currentRowIndex++;
      }

      // Salvează informațiile pentru merge cells (se face după ce toate rândurile sunt create)
      if (TIME_SLOTS.length > 1) {
        mergeCellsInfo.push({
          startRow: dayStartRow,
          endRow: currentRowIndex - 1,
          day: day,
        });
      }
    }

    // Face merge cells pentru zile după ce toate rândurile sunt create
    for (const mergeInfo of mergeCellsInfo) {
      // Șterge valorile din celulele care vor fi merged (pentru a evita conflicte)
      for (let row = mergeInfo.startRow + 1; row <= mergeInfo.endRow; row++) {
        const cell = worksheet.getCell(row, 1);
        cell.value = null;
      }
      
      // Face merge
      worksheet.mergeCells(mergeInfo.startRow, 1, mergeInfo.endRow, 1);
      
      // Reaplică formatarea pentru celula merged
      const dayCell = worksheet.getCell(mergeInfo.startRow, 1);
      dayCell.value = mergeInfo.day;
      dayCell.font = { bold: true };
      dayCell.alignment = { horizontal: 'center', vertical: 'middle' };
      dayCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    }

    // Setează înălțimea rândurilor pentru a afișa corect textul pe mai multe linii
    // Verifică dacă există date pentru săptămâna impară pentru a ajusta înălțimea
    for (let row = 2; row < currentRowIndex; row++) {
      let hasOddWeek = false;
      let maxLines = 0;
      
      // Verifică toate celulele din rând pentru a găsi cel mai mare număr de linii
      for (let groupIndex = 0; groupIndex < groupCodes.length; groupIndex++) {
        const excelCell = worksheet.getCell(row, 3 + groupIndex);
        if (excelCell.value && typeof excelCell.value === 'string') {
          const lines = excelCell.value.split('\n').length;
          if (lines > maxLines) {
            maxLines = lines;
          }
          if (excelCell.value.includes('Săpt. Impară:')) {
            hasOddWeek = true;
          }
        }
      }
      
      // Calculează înălțimea bazată pe numărul de linii
      // Fiecare linie are aproximativ 13-15 puncte de înălțime (pentru font size 9)
      // Adăugăm padding suplimentar
      const calculatedHeight = Math.max(
        hasOddWeek ? maxLines * 15 + 20 : maxLines * 13 + 10, // Mai mult spațiu pentru săptămâna impară
        hasOddWeek ? 120 : 60 // Minimum pentru cazurile cu săptămâna impară
      );
      
      worksheet.getRow(row).height = calculatedHeight;
    }

    // Generează data pentru numele fișierului
    const now = new Date();
    const dateStr = now.toLocaleDateString('ro-RO').replace(/\//g, '-');
    
    // Nume fișier
    const fileName = selectedGroup === 'all' 
      ? `orar-toate-grupele-${dateStr}.xlsx`
      : `orar-${selectedGroup}-${dateStr}.xlsx`;

    // Exportă fișierul Excel
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Creează link de download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Eroare la exportul Excel:', error);
    throw error;
  }
};


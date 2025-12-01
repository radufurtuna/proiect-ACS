import type { Schedule } from '@/types/schedule';

// Tipuri pentru datele tabelului
type ScheduleCell = {
  subject: string;
  professor: string;
  room: string;
  oddWeek?: {
    subject: string;
    professor: string;
    room: string;
  };
} | null;

type ScheduleTableData = {
  [day: string]: {
    [hour: string]: {
      [groupCode: string]: ScheduleCell;
    };
  };
};

const DAYS = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
const TIME_SLOTS = ['8.00-9.30', '9.45-11.15', '11.30-13.00', '13.30-15.00', '15.15-16.45', '17.00-18.30', '18.45-20.15'];

/**
 * Escapare HTML pentru a preveni XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Exportează orarul în format PDF
 * @param schedules - Lista de schedule-uri de exportat
 * @param groupCodes - Lista de coduri de grupe (în ordinea corectă)
 * @param selectedGroup - Grupa selectată ('all' pentru toate grupele)
 */
export const exportScheduleToPdf = async (
  schedules: Schedule[],
  groupCodes: string[],
  selectedGroup: string = 'all'
): Promise<void> => {
  try {
    // Import dinamic jsPDF și html2canvas pentru a evita probleme de SSR
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
    const html2canvas = (await import('html2canvas')).default;

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

    // Dimensiuni pagină A4 landscape: 297mm x 210mm
    const pageWidth = 297;
    const pageHeight = 210;

    // Pentru a suporta diacriticele românești (ă, â, î, ș, ț), generăm un tabel HTML
    // și îl convertim în PDF folosind html2canvas (păstrează diacriticele corect)
    
    // Creăm un div temporar cu tabelul HTML
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = `${pageWidth - 20}mm`;
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '10mm';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.color = '#000000'; // Text negru
    
    // Generează HTML-ul tabelului
    let tableHTML = `
      <h2 style="margin: 0 0 5px 0; font-size: 14pt; font-weight: bold; color: #000000;">Orar</h2>
      <p style="margin: 0 0 10px 0; font-size: 10pt; color: #000000;">${selectedGroup === 'all' ? 'Toate grupele' : `Grupă: ${selectedGroup}`}</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 7pt; border: 1px solid #000; color: #000000;">
        <thead>
          <tr>
            <th style="border: 1px solid #000; padding: 2px; background-color: #f0f0f0; font-weight: bold; text-align: center; width: 22mm; color: #000000;">Zilele</th>
            <th style="border: 1px solid #000; padding: 2px; background-color: #f0f0f0; font-weight: bold; text-align: center; width: 32mm; color: #000000;">Orele</th>
            ${groupCodes.map(g => `<th style="border: 1px solid #000; padding: 2px; background-color: #f0f0f0; font-weight: bold; text-align: center; color: #000000;">${g}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    for (const day of DAYS) {
      for (let i = 0; i < TIME_SLOTS.length; i++) {
        const hour = TIME_SLOTS[i];
        tableHTML += '<tr>';
        
        if (i === 0) {
          tableHTML += `<td rowspan="${TIME_SLOTS.length}" style="border: 1px solid #000; padding: 2px; text-align: center; font-weight: bold; vertical-align: middle; color: #000000;">${day}</td>`;
        }
        
        tableHTML += `<td style="border: 1px solid #000; padding: 2px; text-align: center; color: #000000;">${hour}</td>`;
        
        for (const groupCode of groupCodes) {
          const cell = tableData[day]?.[hour]?.[groupCode];
          if (cell) {
            const maxLength = 25;
            const subject = cell.subject.length > maxLength ? cell.subject.substring(0, maxLength - 3) + '...' : cell.subject;
            const professor = cell.professor.length > maxLength ? cell.professor.substring(0, maxLength - 3) + '...' : cell.professor;
            const room = cell.room.length > maxLength ? cell.room.substring(0, maxLength - 3) + '...' : cell.room;
            
            let cellContent = `
              <div style="font-weight: 500; color: #000000;">${escapeHtml(subject)}</div>
              <div style="color: #000000;">${escapeHtml(professor)}</div>
              <div style="color: #000000;">${escapeHtml(room)}</div>
            `;
            
            // Adaugă datele pentru săptămâna impară dacă există
            if (cell.oddWeek) {
              const oddSubject = cell.oddWeek.subject.length > maxLength ? cell.oddWeek.subject.substring(0, maxLength - 3) + '...' : cell.oddWeek.subject;
              const oddProfessor = cell.oddWeek.professor.length > maxLength ? cell.oddWeek.professor.substring(0, maxLength - 3) + '...' : cell.oddWeek.professor;
              const oddRoom = cell.oddWeek.room.length > maxLength ? cell.oddWeek.room.substring(0, maxLength - 3) + '...' : cell.oddWeek.room;
              
              cellContent += `
                <div style="margin-top: 4px; padding: 3px; background-color: #e0e0e0; border-top: 1px dashed #999; border-radius: 2px;">
                  <div style="font-size: 6pt; color: #666; font-weight: 500; margin-bottom: 2px;">Săpt. Impară:</div>
                  <div style="font-size: 6pt; font-weight: 500; color: #333;">${escapeHtml(oddSubject)}</div>
                  <div style="font-size: 6pt; color: #333;">${escapeHtml(oddProfessor)}</div>
                  <div style="font-size: 6pt; color: #333;">${escapeHtml(oddRoom)}</div>
                </div>
              `;
            }
            
            tableHTML += `
              <td style="border: 1px solid #000; padding: 2px; text-align: center; vertical-align: middle; color: #000000;">
                ${cellContent}
              </td>
            `;
          } else {
            tableHTML += '<td style="border: 1px solid #000; padding: 2px; text-align: center; color: #000000;">—</td>';
          }
        }
        
        tableHTML += '</tr>';
      }
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('ro-RO');
    const timeStr = now.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
    
    tableHTML += `
        </tbody>
      </table>
      <p style="margin-top: 5px; font-size: 7pt; color: #000000;">Exportat la: ${dateStr} ${timeStr}</p>
    `;

    tempDiv.innerHTML = tableHTML;
    document.body.appendChild(tempDiv);

    // Capturează tabelul ca imagine
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // Elimină elementul temporar
    document.body.removeChild(tempDiv);

    // Calculează dimensiunile pentru a se încadra pe o singură pagină
    const imgWidth = pageWidth - 20; // 10mm margine pe fiecare parte
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Dacă înălțimea depășește pagina, redimensionăm
    let finalHeight = imgHeight;
    let finalWidth = imgWidth;
    if (finalHeight > pageHeight - 20) {
      finalHeight = pageHeight - 20;
      finalWidth = (canvas.width * finalHeight) / canvas.height;
    }

    // Creează PDF-ul cu imaginea
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Adaugă imaginea în PDF
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    doc.addImage(imgData, 'JPEG', 10, 10, finalWidth, finalHeight);

    // Salvează PDF-ul
    const fileName = selectedGroup === 'all' 
      ? `orar-toate-grupele-${dateStr.replace(/\//g, '-')}.pdf`
      : `orar-${selectedGroup}-${dateStr.replace(/\//g, '-')}.pdf`;
    
    doc.save(fileName);
  } catch (error) {
    console.error('Eroare la exportul PDF:', error);
    // Fallback: dacă jsPDF nu este disponibil, aruncă eroare informativă
    
    throw error;
  }
};


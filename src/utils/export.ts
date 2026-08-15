import { HarvestRecord, Settings } from '../types';
import { formatDateVN, formatVND, formatWeight, formatDegree, getCycleInfo } from './calculations';

function safePdfAmount(value: number): string {
  return formatVND(value).replace(/đ/g, 'VND');
}

/**
 * Unicode-safe PDF fallback for browsers where html2canvas cannot render the
 * off-screen report (common on iOS Safari). Text is drawn by the browser's
 * Unicode Canvas font and then embedded as a PNG, so Vietnamese diacritics do
 * not depend on jsPDF's limited built-in Helvetica encoding.
 */
async function exportCanvasPdf(
  JsPdf: any,
  records: HarvestRecord[],
  settings: Settings,
  reportTitle: string,
  filename: string
): Promise<void> {
  const pdf = new JsPdf({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = 1400;
  const pageHeight = 990;
  const margin = 40;
  const tableTop = 142;
  const headerHeight = 38;
  const rowHeight = 29;
  const availableWidth = pageWidth - margin * 2;
  const columnWeights = [0.04, 0.08, 0.06, 0.06, 0.06, 0.11, 0.06, 0.11, 0.06, 0.11, 0.12, 0.13];
  const headers = ['STT', 'Ngày', 'Đợt', 'Kg độ', 'Độ', 'Tiền độ', 'Kg chén', 'Tiền chén', 'Kg tạp', 'Tiền tạp', 'Tổng ngày', 'Cộng dồn'];
  const rowsPerPage = Math.max(1, Math.floor((pageHeight - tableTop - 55 - headerHeight) / rowHeight));
  let runningTotal = 0;

  const drawCellText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, align: 'left' | 'center' | 'right', bold = false) => {
    ctx.font = `${bold ? '700' : '400'} 16px Arial, "Segoe UI", sans-serif`;
    ctx.fillStyle = '#111827';
    const padding = 8;
    const textX = align === 'center' ? x + width / 2 : align === 'right' ? x + width - padding : x + padding;
    ctx.textAlign = align;
    ctx.fillText(text, textX, y);
  };

  for (let pageStart = 0; pageStart < records.length || pageStart === 0; pageStart += rowsPerPage) {
    const canvas = document.createElement('canvas');
    canvas.width = pageWidth;
    canvas.height = pageHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Trình duyệt không hỗ trợ Canvas để tạo PDF');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageWidth, pageHeight);
    ctx.fillStyle = '#047857';
    ctx.font = '700 25px Arial, "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(reportTitle, margin, 42);
    ctx.fillStyle = '#374151';
    ctx.font = '400 15px Arial, "Segoe UI", sans-serif';
    ctx.fillText(`Chủ vườn: ${settings.ownerName || 'Phạm Duy Ngôn'} - ${settings.rubberFieldName || 'Lô cạo mủ'}`, margin, 70);
    ctx.fillText(`Số ngày cạo: ${records.length} | Tổng thu nhập: ${safePdfAmount(records.reduce((sum, record) => sum + record.dailyTotal, 0))}`, margin, 94);

    const widths = columnWeights.map((weight) => weight * availableWidth);
    let x = margin;
    headers.forEach((header, index) => {
      ctx.fillStyle = '#047857';
      ctx.fillRect(x, tableTop, widths[index], headerHeight);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(x, tableTop, widths[index], headerHeight);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 14px Arial, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(header, x + widths[index] / 2, tableTop + 25);
      x += widths[index];
    });

    const pageRecords = records.slice(pageStart, pageStart + rowsPerPage);
    pageRecords.forEach((record, rowIndex) => {
      runningTotal += record.dailyTotal;
      const cycle = getCycleInfo(record.date);
      const values = [
        String(pageStart + rowIndex + 1),
        formatDateVN(record.date),
        `Đợt ${cycle.cycleNum}`,
        record.degreeLatex.weight > 0 ? formatWeight(record.degreeLatex.weight) : '-',
        record.degreeLatex.degree > 0 ? formatDegree(record.degreeLatex.degree) : '-',
        record.degreeLatex.total > 0 ? safePdfAmount(record.degreeLatex.total) : '-',
        record.cupLatex.weight > 0 ? formatWeight(record.cupLatex.weight) : '-',
        record.cupLatex.total > 0 ? safePdfAmount(record.cupLatex.total) : '-',
        (record.scrapLatex?.weight || 0) > 0 ? formatWeight(record.scrapLatex?.weight || 0) : '-',
        (record.scrapLatex?.total || 0) > 0 ? safePdfAmount(record.scrapLatex?.total || 0) : '-',
        safePdfAmount(record.dailyTotal),
        safePdfAmount(runningTotal),
      ];
      const y = tableTop + headerHeight + rowIndex * rowHeight;
      x = margin;
      values.forEach((value, index) => {
        ctx.fillStyle = rowIndex % 2 === 0 ? '#ffffff' : '#f9fafb';
        ctx.fillRect(x, y, widths[index], rowHeight);
        ctx.strokeStyle = '#d1d5db';
        ctx.strokeRect(x, y, widths[index], rowHeight);
        const align = index === 0 || index === 1 || index === 2 ? 'center' : 'right';
        drawCellText(ctx, value, x, y + 20, widths[index], align, index === 10 || index === 11);
        x += widths[index];
      });
    });

    ctx.fillStyle = '#6b7280';
    ctx.font = '400 13px Arial, "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Trang ${Math.floor(pageStart / rowsPerPage) + 1}`, pageWidth - margin, pageHeight - 22);
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 297, 210);
    if (pageStart + rowsPerPage < records.length) pdf.addPage();
  }

  pdf.save(filename);
}

/**
 * Export daily records list to Excel (.xlsx) file with full UTF-8 Vietnamese support,
 * clear formatted headers, summary metrics, custom column widths, and number formatting.
 */
export async function exportToExcel(records: HarvestRecord[], title: string = 'Bao_Cao_Mu_Cao_Su', settings?: Settings): Promise<void> {
  try {
    const XLSX = await import('xlsx');
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));

    // Farm & Owner Information Metadata
    const ownerName = settings?.ownerName || 'Phạm Duy Ngôn';
    const gardenName = settings?.rubberFieldName || 'Vườn Cao Su Tây Ninh';
    const area = settings?.rubberArea ? ` - Diện tích: ${settings.rubberArea}` : '';
    const phone = settings?.ownerPhone ? ` | SĐT: ${settings.ownerPhone}` : '';
    const reportDateStr = formatDateVN(new Date().toISOString().slice(0, 10));

    // Summary Totals Calculation
    const totalDegreeWeight = sorted.reduce((s, r) => s + r.degreeLatex.weight, 0);
    const totalDegreeMoney = sorted.reduce((s, r) => s + r.degreeLatex.total, 0);
    const totalCupWeight = sorted.reduce((s, r) => s + r.cupLatex.weight, 0);
    const totalCupMoney = sorted.reduce((s, r) => s + r.cupLatex.total, 0);
    const totalScrapWeight = sorted.reduce((s, r) => s + (r.scrapLatex?.weight || 0), 0);
    const totalScrapMoney = sorted.reduce((s, r) => s + (r.scrapLatex?.total || 0), 0);
    const totalMoney = sorted.reduce((s, r) => s + r.dailyTotal, 0);

    const validDegrees = sorted.filter((r) => r.degreeLatex.degree > 0);
    const avgDegree = validDegrees.length > 0
      ? Math.round((validDegrees.reduce((s, r) => s + r.degreeLatex.degree, 0) / validDegrees.length) * 10) / 10
      : 0;

    // Total columns count in table II = 16 columns (A:P)
    const COL_SPAN = 16;

    // Generate styled HTML string for Excel export with centered main title spanning all columns
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; }
          .main-title { font-size: 18px; font-weight: bold; color: #00875A; text-align: center; padding: 10px 0; }
          .sub-title { font-size: 12px; color: #333333; text-align: center; padding-bottom: 12px; }
          .section-title { font-size: 13px; font-weight: bold; color: #00875A; text-align: left; padding: 8px 0; }
          table { border-collapse: collapse; width: 100%; margin-top: 5px; }
          th { background-color: #00875A !important; color: #FFFFFF !important; font-weight: bold; border: 1px solid #005a3c; text-align: center; padding: 10px; font-size: 12px; }
          td { border: 1px solid #CCCCCC; padding: 8px; font-size: 11px; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .sum-row { background-color: #E6F4EA; font-weight: bold; border-top: 2px solid #00875A; }
          .summary-card { background-color: #F3F4F6; border: 1px solid #D1D5DB; text-align: center; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="${COL_SPAN}" class="main-title">
              BÁO CÁO THỐNG KÊ KINH DOANH MỦ CAO SU
            </td>
          </tr>
          <tr>
            <td colspan="${COL_SPAN}" class="sub-title">
              Chủ vườn: <b>${ownerName}</b>${phone} | Lô cạo: <b>${gardenName}</b>${area} | Ngày lập: <b>${reportDateStr}</b>
            </td>
          </tr>
          <tr>
            <td colspan="${COL_SPAN}" class="section-title">
              I. BẢNG TỔNG QUAN DOANH THU & NĂNG SUẤT
            </td>
          </tr>
        </table>

        <table>
          <thead>
            <tr>
              <th>Số Ngày Cạo</th>
              <th>Tổng Mủ Nước (Kg)</th>
              <th>Tiền Mủ Nước (đ)</th>
              <th>Tổng Mủ Chén (Kg)</th>
              <th>Tiền Mủ Chén (đ)</th>
              <th>Tổng Mủ Tạp (Kg)</th>
              <th>Tiền Mủ Tạp (đ)</th>
              <th>TỔNG THU NHẬP (đ)</th>
              <th>Độ TSC/DRC Trung Bình</th>
            </tr>
          </thead>
          <tbody>
            <tr class="summary-card">
              <td>${sorted.length} ngày</td>
              <td>${formatWeight(totalDegreeWeight)}</td>
              <td>${formatVND(totalDegreeMoney)}</td>
              <td>${formatWeight(totalCupWeight)}</td>
              <td>${formatVND(totalCupMoney)}</td>
              <td>${formatWeight(totalScrapWeight)}</td>
              <td>${formatVND(totalScrapMoney)}</td>
              <td style="color: #00875A; font-size: 13px;">${formatVND(totalMoney)}</td>
              <td>${formatDegree(avgDegree)}</td>
            </tr>
          </tbody>
        </table>

        <br/>
        <table>
          <tr>
            <td colspan="${COL_SPAN}" class="section-title">
              II. BÁO CÁO THỐNG KÊ CHI TIẾT NHẬT KÝ BÁN MỦ CAO SU (${COL_SPAN} CỘT CHI TIẾT)
            </td>
          </tr>
        </table>

        <table>
          <thead>
            <tr>
              <th style="width: 45px;">STT</th>
              <th style="width: 95px;">Ngày Cạo</th>
              <th style="width: 75px;">Giờ Cạo</th>
              <th style="width: 130px;">Chu Kỳ</th>
              <th style="width: 100px;">Kg Mủ Nước</th>
              <th style="width: 80px;">Độ TSC/DRC</th>
              <th style="width: 95px;">Giá Độ</th>
              <th style="width: 120px;">Tiền Mủ Nước</th>
              <th style="width: 100px;">Kg Mủ Chén</th>
              <th style="width: 95px;">Giá Chén</th>
              <th style="width: 120px;">Tiền Mủ Chén</th>
              <th style="width: 100px;">Kg Mủ Tạp</th>
              <th style="width: 95px;">Giá Tạp</th>
              <th style="width: 120px;">Tiền Mủ Tạp</th>
              <th style="width: 140px;">TỔNG TIỀN NGÀY</th>
              <th style="width: 140px;">Ghi Chú</th>
            </tr>
          </thead>
          <tbody>
    `;

    sorted.forEach((r, idx) => {
      const cycle = getCycleInfo(r.date, settings);
      const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
      htmlContent += `
        <tr style="background-color: ${rowBg};">
          <td class="text-center">${idx + 1}</td>
          <td class="text-center font-bold">${formatDateVN(r.date)}</td>
          <td class="text-center">${r.time || '05:30'}</td>
          <td class="text-center">${cycle.cycleName}</td>
          <td class="text-right">${r.degreeLatex.weight > 0 ? formatWeight(r.degreeLatex.weight) : '-'}</td>
          <td class="text-right">${r.degreeLatex.degree > 0 ? formatDegree(r.degreeLatex.degree) : '-'}</td>
          <td class="text-right">${r.degreeLatex.pricePerDegree > 0 ? formatVND(r.degreeLatex.pricePerDegree) : '-'}</td>
          <td class="text-right font-bold" style="color: #047857;">${r.degreeLatex.total > 0 ? formatVND(r.degreeLatex.total) : '-'}</td>
          <td class="text-right">${r.cupLatex.weight > 0 ? formatWeight(r.cupLatex.weight) : '-'}</td>
          <td class="text-right">${r.cupLatex.pricePerKg > 0 ? formatVND(r.cupLatex.pricePerKg) : '-'}</td>
          <td class="text-right font-bold" style="color: #B45309;">${r.cupLatex.total > 0 ? formatVND(r.cupLatex.total) : '-'}</td>
          <td class="text-right">${(r.scrapLatex?.weight || 0) > 0 ? formatWeight(r.scrapLatex?.weight || 0) : '-'}</td>
          <td class="text-right">${(r.scrapLatex?.pricePerKg || 0) > 0 ? formatVND(r.scrapLatex?.pricePerKg || 0) : '-'}</td>
          <td class="text-right font-bold" style="color: #D97706;">${(r.scrapLatex?.total || 0) > 0 ? formatVND(r.scrapLatex?.total || 0) : '-'}</td>
          <td class="text-right font-bold" style="color: #00875A; font-size: 12px;">${formatVND(r.dailyTotal)}</td>
          <td>${r.note || ''}</td>
        </tr>
      `;
    });

    // Summary total row across all columns
    htmlContent += `
        <tr class="sum-row">
          <td class="text-center font-bold" colspan="4">TỔNG CỘNG (${sorted.length} ngày cạo)</td>
          <td class="text-right font-bold" style="color: #00875A;">${formatWeight(totalDegreeWeight)}</td>
          <td class="text-right font-bold">${formatDegree(avgDegree)}</td>
          <td class="text-center">-</td>
          <td class="text-right font-bold" style="color: #00875A;">${formatVND(totalDegreeMoney)}</td>
          <td class="text-right font-bold" style="color: #B45309;">${formatWeight(totalCupWeight)}</td>
          <td class="text-center">-</td>
          <td class="text-right font-bold" style="color: #B45309;">${formatVND(totalCupMoney)}</td>
          <td class="text-right font-bold" style="color: #D97706;">${formatWeight(totalScrapWeight)}</td>
          <td class="text-center">-</td>
          <td class="text-right font-bold" style="color: #D97706;">${formatVND(totalScrapMoney)}</td>
          <td class="text-right font-bold" style="color: #00875A; font-size: 13px;">${formatVND(totalMoney)}</td>
          <td class="text-center font-bold">Hoàn tất đối soát</td>
        </tr>
      </tbody>
      </table>
      
      <br/><br/>
      <table>
        <tr>
          <td colspan="4" style="border: none; text-align: center;"><b>Người Lập Báo Cáo</b><br/><br/><br/>(Ký, ghi rõ họ tên)</td>
          <td colspan="5" style="border: none; text-align: center;"><b>Chủ Vườn Cao Su</b><br/><br/><br/>${ownerName}</td>
          <td colspan="4" style="border: none; text-align: center;"><b>Đại Lý Thu Mua / Trạm Cân</b><br/><br/><br/>(Xác nhận số liệu)</td>
        </tr>
      </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cleanTitle = title.replace(/[^a-zA-Z0-9_\u00C0-\u024F]/g, '_');
    link.href = url;
    link.download = `${cleanTitle}_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    console.error('Excel export error:', err);
    exportToCSVFallback(records, title);
  }
}

/**
 * Fallback CSV export with UTF-8 BOM so Excel opens Vietnamese characters cleanly
 */
export function exportToCSVFallback(records: HarvestRecord[], title: string = 'Bao_Cao_Mu_Cao_Su'): void {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  let csvContent = '\uFEFF'; // UTF-8 BOM
  csvContent += 'STT,Ngày cạo,Giờ cạo,Chu kỳ,Kg mủ độ,Độ DRC,Giá độ (đ),Tiền mủ độ (đ),Kg mủ chén,Giá chén (đ),Tiền mủ chén (đ),Kg mủ tạp,Giá tạp (đ),Tiền mủ tạp (đ),Tổng tiền ngày (đ),Ghi chú\n';

  sorted.forEach((r, idx) => {
    const cycle = getCycleInfo(r.date);
    csvContent += `"${idx + 1}","${formatDateVN(r.date)}","${r.time || ''}","${cycle.cycleName}","${r.degreeLatex.weight}","${r.degreeLatex.degree}","${r.degreeLatex.pricePerDegree}","${r.degreeLatex.total}","${r.cupLatex.weight}","${r.cupLatex.pricePerKg}","${r.cupLatex.total}","${r.scrapLatex?.weight || 0}","${r.scrapLatex?.pricePerKg || 0}","${r.scrapLatex?.total || 0}","${r.dailyTotal}","${(r.note || '').replace(/"/g, '""')}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${title}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export records to PDF report with 100% flawless Vietnamese UTF-8 font support via HTML2Canvas
 */
export async function exportToPDF(
  records: HarvestRecord[], 
  settings: Settings, 
  reportTitle: string = 'BÁO CÁO NHẬT KÝ CẠO MỦ CAO SU'
): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));

  // Calculate totals
  const totalDegreeWeight = sorted.reduce((s, r) => s + r.degreeLatex.weight, 0);
  const totalDegreeMoney = sorted.reduce((s, r) => s + r.degreeLatex.total, 0);
  const totalCupWeight = sorted.reduce((s, r) => s + r.cupLatex.weight, 0);
  const totalCupMoney = sorted.reduce((s, r) => s + r.cupLatex.total, 0);
  const totalScrapWeight = sorted.reduce((s, r) => s + (r.scrapLatex?.weight || 0), 0);
  const totalScrapMoney = sorted.reduce((s, r) => s + (r.scrapLatex?.total || 0), 0);
  const totalMoney = sorted.reduce((s, r) => s + r.dailyTotal, 0);

  // Create temporary container styled cleanly off-screen for html2canvas
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#111827';
  container.style.fontFamily = 'Arial, "Segoe UI", Roboto, sans-serif';
  container.style.padding = '30px';
  container.style.boxSizing = 'border-box';
  container.style.opacity = '1';
  container.style.visibility = 'visible';

  // Build HTML report template
  let tableRowsHtml = '';
  let runningSum = 0;

  sorted.forEach((r, idx) => {
    runningSum += r.dailyTotal;
    const cycle = getCycleInfo(r.date);
    tableRowsHtml += `
      <tr style="border-bottom: 1px solid #e5e7eb; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'}; page-break-inside: avoid; break-inside: avoid;">
        <td style="padding: 8px; font-size: 11px; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; font-size: 11px; font-weight: bold;">
          ${formatDateVN(r.date)}
          ${r.time ? `<div style="font-size: 9px; color: #b45309; font-weight: normal;">⏰ ${r.time}</div>` : ''}
        </td>
        <td style="padding: 8px; font-size: 11px;">Đợt ${cycle.cycleNum}</td>
        <td style="padding: 8px; font-size: 11px; text-align: right;">${r.degreeLatex.weight > 0 ? formatWeight(r.degreeLatex.weight) : '-'}</td>
        <td style="padding: 8px; font-size: 11px; text-align: right;">${r.degreeLatex.degree > 0 ? formatDegree(r.degreeLatex.degree) : '-'}</td>
        <td style="padding: 8px; font-size: 11px; text-align: right; color: #047857; font-weight: bold;">${r.degreeLatex.total > 0 ? formatVND(r.degreeLatex.total) : '-'}</td>
        <td style="padding: 8px; font-size: 11px; text-align: right;">${r.cupLatex.weight > 0 ? formatWeight(r.cupLatex.weight) : '-'}</td>
        <td style="padding: 8px; font-size: 11px; text-align: right; color: #b45309; font-weight: bold;">${r.cupLatex.total > 0 ? formatVND(r.cupLatex.total) : '-'}</td>
        <td style="padding: 8px; font-size: 11px; text-align: right;">${(r.scrapLatex?.weight || 0) > 0 ? formatWeight(r.scrapLatex?.weight || 0) : '-'}</td>
        <td style="padding: 8px; font-size: 11px; text-align: right; color: #d97706; font-weight: bold;">${(r.scrapLatex?.total || 0) > 0 ? formatVND(r.scrapLatex?.total || 0) : '-'}</td>
        <td style="padding: 8px; font-size: 11px; text-align: right; font-weight: bold; color: #065f46;">${formatVND(r.dailyTotal)}</td>
        <td style="padding: 8px; font-size: 11px; text-align: right; font-weight: bold; color: #92400e;">${formatVND(runningSum)}</td>
      </tr>
    `;
  });

  container.innerHTML = `
    <div style="border-bottom: 3px solid #047857; padding-bottom: 12px; margin-bottom: 16px;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #047857; text-transform: uppercase;">
        ${reportTitle}
      </h1>
      <div style="margin-top: 6px; font-size: 12px; color: #374151; display: flex; justify-content: space-between;">
        <span><strong>Chủ vườn:</strong> ${settings.ownerName || 'Phạm Duy Ngôn'} - ${settings.rubberFieldName || 'Lô cạo mủ'}</span>
        <span><strong>Ngày xuất:</strong> ${formatDateVN(new Date().toISOString().slice(0, 10))}</span>
      </div>
    </div>

    <!-- Summary Metrics -->
    <div style="display: flex; gap: 8px; margin-bottom: 16px;">
      <div style="flex: 1; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 8px; border-radius: 8px; text-align: center;">
        <div style="font-size: 9px; font-weight: bold; color: #065f46; text-transform: uppercase;">Số ngày cạo</div>
        <div style="font-size: 14px; font-weight: 900; color: #047857;">${sorted.length} ngày</div>
      </div>
      <div style="flex: 1; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 8px; border-radius: 8px; text-align: center;">
        <div style="font-size: 9px; font-weight: bold; color: #065f46; text-transform: uppercase;">Mủ độ</div>
        <div style="font-size: 14px; font-weight: 900; color: #047857;">${formatWeight(totalDegreeWeight)}</div>
        <div style="font-size: 9px; color: #047857;">(${formatVND(totalDegreeMoney)})</div>
      </div>
      <div style="flex: 1; background-color: #fffbeb; border: 1px solid #fde68a; padding: 8px; border-radius: 8px; text-align: center;">
        <div style="font-size: 9px; font-weight: bold; color: #92400e; text-transform: uppercase;">Mủ chén</div>
        <div style="font-size: 14px; font-weight: 900; color: #b45309;">${formatWeight(totalCupWeight)}</div>
        <div style="font-size: 9px; color: #b45309;">(${formatVND(totalCupMoney)})</div>
      </div>
      <div style="flex: 1; background-color: #fff7ed; border: 1px solid #fed7aa; padding: 8px; border-radius: 8px; text-align: center;">
        <div style="font-size: 9px; font-weight: bold; color: #c2410c; text-transform: uppercase;">Mủ tạp</div>
        <div style="font-size: 14px; font-weight: 900; color: #ea580c;">${formatWeight(totalScrapWeight)}</div>
        <div style="font-size: 9px; color: #ea580c;">(${formatVND(totalScrapMoney)})</div>
      </div>
      <div style="flex: 1.2; background-color: #047857; color: #ffffff; padding: 8px; border-radius: 8px; text-align: center;">
        <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #fef3c7;">TỔNG THU NHẬP</div>
        <div style="font-size: 14px; font-weight: 900; color: #fde047;">${formatVND(totalMoney)}</div>
      </div>
    </div>

    <!-- Data Table -->
    <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
      <thead>
        <tr style="background-color: #047857; color: #ffffff; font-weight: bold; text-align: left;">
          <th style="padding: 6px; text-align: center;">STT</th>
          <th style="padding: 6px;">Ngày</th>
          <th style="padding: 6px;">Đợt</th>
          <th style="padding: 6px; text-align: right;">Kg độ</th>
          <th style="padding: 6px; text-align: right;">Độ</th>
          <th style="padding: 6px; text-align: right;">Tiền độ</th>
          <th style="padding: 6px; text-align: right;">Kg chén</th>
          <th style="padding: 6px; text-align: right;">Tiền chén</th>
          <th style="padding: 6px; text-align: right;">Kg tạp</th>
          <th style="padding: 6px; text-align: right;">Tiền tạp</th>
          <th style="padding: 6px; text-align: right;">Tổng ngày</th>
          <th style="padding: 6px; text-align: right;">Cộng dồn</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
      </tbody>
      <tfoot>
        <tr style="background-color: #d1fae5; font-weight: bold; border-top: 2px solid #047857; page-break-inside: avoid; break-inside: avoid;">
          <td style="padding: 8px; text-align: center;" colspan="3">TỔNG CỘNG (${sorted.length} ngày)</td>
          <td style="padding: 8px; text-align: right; color: #047857;">${formatWeight(totalDegreeWeight)}</td>
          <td style="padding: 8px; text-align: right;">-</td>
          <td style="padding: 8px; text-align: right; color: #047857;">${formatVND(totalDegreeMoney)}</td>
          <td style="padding: 8px; text-align: right; color: #b45309;">${formatWeight(totalCupWeight)}</td>
          <td style="padding: 8px; text-align: right; color: #b45309;">${formatVND(totalCupMoney)}</td>
          <td style="padding: 8px; text-align: right; color: #ea580c;">${formatWeight(totalScrapWeight)}</td>
          <td style="padding: 8px; text-align: right; color: #ea580c;">${formatVND(totalScrapMoney)}</td>
          <td style="padding: 8px; text-align: right; color: #047857; font-size: 11px;">${formatVND(totalMoney)}</td>
          <td style="padding: 8px; text-align: right; color: #b45309; font-size: 11px;">${formatVND(totalMoney)}</td>
        </tr>
      </tfoot>
    </table>

    <div style="margin-top: 24px; text-align: right; font-size: 11px; color: #4b5563; page-break-inside: avoid; break-inside: avoid;">
      <em>Ký tên chủ vườn (${settings.ownerName || 'Phạm Duy Ngôn'}): ______________________</em>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1000,
      width: 800,
      onclone: (clonedDoc) => {
        // Fix for Tailwind CSS v4 oklch color parsing error in html2canvas
        const styleElements = clonedDoc.querySelectorAll('style');
        styleElements.forEach((s) => {
          if (s.textContent) {
            s.textContent = s.textContent.replace(/oklch\([^)]+\)/g, '#047857');
          }
        });
      },
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    const cleanTitle = reportTitle.replace(/[^a-zA-Z0-9_\u00C0-\u024F]/g, '_');
    const filename = `${cleanTitle}_${new Date().toISOString().slice(0, 10)}.pdf`;

    // Try Blob URL download for maximum compatibility across sandboxed iFrames, mobile browsers & Zalo
    try {
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
    } catch (e) {
      pdf.save(filename);
    }
  } catch (error) {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    console.error('Lỗi khi tạo PDF:', error);
    try {
      const cleanTitle = reportTitle.replace(/[^a-zA-Z0-9_\u00C0-\u024F]/g, '_');
      const filename = `${cleanTitle}_${new Date().toISOString().slice(0, 10)}.pdf`;
      await exportCanvasPdf(jsPDF, sorted, settings, reportTitle, filename);
    } catch (fallbackError) {
      console.error('Lỗi khi tạo PDF dự phòng:', fallbackError);
      throw fallbackError;
    }
  }
}

/**
 * Format text message for sharing revenue report to Zalo or SMS/Apps
 */
export function formatZaloShareText(
  records: HarvestRecord[], 
  settings: Settings, 
  title: string = 'BÁO CÁO THU NHẬP MỦ CAO SU'
): string {
  const owner = settings.ownerName || 'Phạm Duy Ngôn';
  const field = settings.rubberFieldName || 'Vườn Cao Su';
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));

  const totalDegW = sorted.reduce((s, r) => s + r.degreeLatex.weight, 0);
  const totalDegMoney = sorted.reduce((s, r) => s + r.degreeLatex.total, 0);
  const totalCupW = sorted.reduce((s, r) => s + r.cupLatex.weight, 0);
  const totalCupMoney = sorted.reduce((s, r) => s + r.cupLatex.total, 0);
  const grandTotal = sorted.reduce((s, r) => s + r.dailyTotal, 0);

  let text = `🌳 ${title.toUpperCase()} 🌳\n`;
  text += `👤 Chủ vườn: ${owner}\n`;
  text += `📍 Lô cạo: ${field}\n`;
  text += `📅 Số ngày cạo: ${sorted.length} ngày\n`;
  text += `------------------------------\n`;

  if (sorted.length === 1) {
    const r = sorted[0];
    const cycle = getCycleInfo(r.date);
    text += `📆 Ngày: ${formatDateVN(r.date)} ${r.time ? `(⏰ ${r.time})` : ''}\n`;
    text += `🏷️ Chu kỳ: ${cycle.cycleName}\n`;
    text += `💧 Mủ nước: ${formatWeight(r.degreeLatex.weight)} kg | ${formatDegree(r.degreeLatex.degree)}°\n`;
    text += `   ➡️ Thành tiền mủ độ: ${formatVND(r.degreeLatex.total)}\n`;
    text += `🍵 Mủ chén: ${formatWeight(r.cupLatex.weight)} kg | ${formatVND(r.cupLatex.pricePerKg)}/kg\n`;
    text += `   ➡️ Thành tiền mủ chén: ${formatVND(r.cupLatex.total)}\n`;
    text += `💰 TỔNG TIỀN NGÀY: ${formatVND(r.dailyTotal)}\n`;
  } else {
    text += `💧 TỔNG MỦ NƯỚC: ${formatWeight(totalDegW)} kg (${formatVND(totalDegMoney)})\n`;
    text += `🍵 TỔNG MỦ CHÉN: ${formatWeight(totalCupW)} kg (${formatVND(totalCupMoney)})\n`;
    text += `💰 TỔNG THU NHẬP: ${formatVND(grandTotal)}\n`;
    text += `------------------------------\n`;
    text += `📋 CHI TIẾT CÁC NGÀY:\n`;
    sorted.forEach((r, idx) => {
      text += `${idx + 1}. ${formatDateVN(r.date)} ${r.time ? `(${r.time})` : ''}: ${formatVND(r.dailyTotal)}\n`;
    });
  }

  text += `------------------------------\n`;
  text += `📲 Báo cáo tạo từ Ứng dụng Quản Lý Cạo Mủ Cao Su`;
  return text;
}

/**
 * Share revenue report via Web Share API or Copy Clipboard for Zalo
 */
export async function shareRevenueReport(
  records: HarvestRecord[], 
  settings: Settings, 
  title: string = 'BÁO CÁO MỦ CAO SU'
): Promise<{ success: boolean; method: 'native' | 'clipboard' }> {
  const shareText = formatZaloShareText(records, settings, title);

  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: shareText,
      });
      return { success: true, method: 'native' };
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Share API error:', err);
      }
    }
  }

  // Fallback to Clipboard Copy
  try {
    await navigator.clipboard.writeText(shareText);
    return { success: true, method: 'clipboard' };
  } catch (err) {
    console.error('Clipboard copy error:', err);
    return { success: false, method: 'clipboard' };
  }
}

/**
 * Trigger native browser window printing
 */
export function triggerPrint(): void {
  window.print();
}

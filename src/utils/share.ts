import { HarvestRecord, Settings } from '../types';
import { formatDateVN, formatVND, formatWeight, formatDegree, getCycleInfo } from './calculations';

/** Build a lightweight text report for Zalo, SMS and the Web Share API. */
export function formatZaloShareText(
  records: HarvestRecord[],
  settings: Settings,
  title: string = 'BÁO CÁO THU NHẬP MỦ CAO SU'
): string {
  const owner = settings.ownerName || 'Phạm Duy Ngôn';
  const field = settings.rubberFieldName || 'Vườn Cao Su';
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));

  const totalDegW = sorted.reduce((sum, record) => sum + record.degreeLatex.weight, 0);
  const totalDegMoney = sorted.reduce((sum, record) => sum + record.degreeLatex.total, 0);
  const totalCupW = sorted.reduce((sum, record) => sum + record.cupLatex.weight, 0);
  const totalCupMoney = sorted.reduce((sum, record) => sum + record.cupLatex.total, 0);
  const grandTotal = sorted.reduce((sum, record) => sum + record.dailyTotal, 0);

  let text = `🌳 ${title.toUpperCase()} 🌳\n`;
  text += `👤 Chủ vườn: ${owner}\n`;
  text += `📍 Lô cạo: ${field}\n`;
  text += `📅 Số ngày cạo: ${sorted.length} ngày\n`;
  text += `------------------------------\n`;

  if (sorted.length === 1) {
    const record = sorted[0];
    const cycle = getCycleInfo(record.date);
    text += `📆 Ngày: ${formatDateVN(record.date)} ${record.time ? `(⏰ ${record.time})` : ''}\n`;
    text += `🏷️ Chu kỳ: ${cycle.cycleName}\n`;
    text += `💧 Mủ nước: ${formatWeight(record.degreeLatex.weight)} kg | ${formatDegree(record.degreeLatex.degree)}°\n`;
    text += `   ➡️ Thành tiền mủ độ: ${formatVND(record.degreeLatex.total)}\n`;
    text += `🍵 Mủ chén: ${formatWeight(record.cupLatex.weight)} kg | ${formatVND(record.cupLatex.pricePerKg)}/kg\n`;
    text += `   ➡️ Thành tiền mủ chén: ${formatVND(record.cupLatex.total)}\n`;
    text += `💰 TỔNG TIỀN NGÀY: ${formatVND(record.dailyTotal)}\n`;
  } else {
    text += `💧 TỔNG MỦ NƯỚC: ${formatWeight(totalDegW)} kg (${formatVND(totalDegMoney)})\n`;
    text += `🍵 TỔNG MỦ CHÉN: ${formatWeight(totalCupW)} kg (${formatVND(totalCupMoney)})\n`;
    text += `💰 TỔNG THU NHẬP: ${formatVND(grandTotal)}\n`;
    text += `------------------------------\n`;
    text += `📋 CHI TIẾT CÁC NGÀY:\n`;
    sorted.forEach((record, index) => {
      text += `${index + 1}. ${formatDateVN(record.date)} ${record.time ? `(${record.time})` : ''}: ${formatVND(record.dailyTotal)}\n`;
    });
  }

  text += `------------------------------\n`;
  text += `📲 Báo cáo tạo từ Ứng dụng Quản Lý Cạo Mủ Cao Su`;
  return text;
}

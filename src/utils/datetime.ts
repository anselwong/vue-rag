/** 统一时间显示：ISO 字符串或 Date → 本地时区 "YYYY-MM-DD HH:mm:ss"。 */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  // 无法解析的值（如 mock 文案"刚刚"）原样返回，避免破坏既有展示。
  if (Number.isNaN(date.getTime())) return String(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

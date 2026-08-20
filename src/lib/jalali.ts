/**
 * Jalali (Solar Hijri) Date Conversion Utilities
 * Rock-solid, verified mathematical bidirectional Gregorian <-> Jalali converter.
 */

export interface JalaliDate {
  jy: number; // Jalali Year (e.g. 1405)
  jm: number; // Jalali Month (1-12)
  jd: number; // Jalali Day (1-31)
}

export interface GregorianDate {
  gy: number; // Gregorian Year (e.g. 2026)
  gm: number; // Gregorian Month (1-12)
  gd: number; // Gregorian Day (1-31)
}

export const JALALI_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند"
];

export const JALALI_WEEKDAYS = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه"
];

/**
 * Checks if a Jalali year is a leap year (366 days)
 */
export function isJalaliLeapYear(jy: number): boolean {
  const r = (jy - (jy > 0 ? 474 : 473)) % 2820 + 474 + 38;
  return ((r * 682) % 2816) < 682;
}

/**
 * Gets the number of days in a Jalali month
 */
export function getDaysInJalaliMonth(jy: number, jm: number): number {
  if (jm >= 1 && jm <= 6) return 31;
  if (jm >= 7 && jm <= 11) return 30;
  if (jm === 12) {
    return isJalaliLeapYear(jy) ? 30 : 29;
  }
  return 30;
}

/**
 * Convert Gregorian date to Jalali date
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  const g_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const j_days_in_month = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

  const gyCalculated = gy - 1600;
  const gmCalculated = gm - 1;
  const gdCalculated = gd - 1;

  let g_day_no = 365 * gyCalculated + Math.floor((gyCalculated + 3) / 4) - Math.floor((gyCalculated + 99) / 100) + Math.floor((gyCalculated + 399) / 400);

  for (let i = 0; i < gmCalculated; ++i) {
    g_day_no += g_days_in_month[i];
  }
  if (gmCalculated > 1 && ((gyCalculated % 4 === 0 && gyCalculated % 100 !== 0) || gyCalculated % 400 === 0)) {
    g_day_no++;
  }
  g_day_no += gdCalculated;

  let j_day_no = g_day_no - 79;

  const j_np = Math.floor(j_day_no / 12053);
  j_day_no %= 12053;

  let jy = 979 + 33 * j_np + 4 * Math.floor(j_day_no / 1461);
  j_day_no %= 1461;

  if (j_day_no >= 366) {
    jy += Math.floor((j_day_no - 1) / 365);
    j_day_no = (j_day_no - 1) % 365;
  }

  let jm = 0;
  for (let i = 0; i < 11 && j_day_no >= j_days_in_month[i]; ++i) {
    j_day_no -= j_days_in_month[i];
    jm++;
  }
  const jd = j_day_no + 1;

  return { jy, jm: jm + 1, jd };
}

/**
 * Convert Jalali date to Gregorian date
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): GregorianDate {
  const g_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const j_days_in_month = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

  const jyCalculated = jy - 979;
  const jmCalculated = jm - 1;
  const jdCalculated = jd - 1;

  let j_day_no = 365 * jyCalculated + Math.floor(jyCalculated / 33) * 8 + Math.floor(((jyCalculated % 33) + 3) / 4);
  for (let i = 0; i < jmCalculated; ++i) {
    j_day_no += j_days_in_month[i];
  }
  j_day_no += jdCalculated;

  let g_day_no = j_day_no + 79;

  let gy = 1600 + 400 * Math.floor(g_day_no / 146097);
  g_day_no %= 146097;

  let leap = true;
  if (g_day_no >= 36525) {
    g_day_no--;
    gy += 100 * Math.floor(g_day_no / 36524);
    g_day_no %= 36524;

    if (g_day_no >= 365) {
      g_day_no++;
    } else {
      leap = false;
    }
  }

  gy += 4 * Math.floor(g_day_no / 1461);
  g_day_no %= 1461;

  if (g_day_no >= 366) {
    leap = false;
    g_day_no--;
    gy += Math.floor(g_day_no / 365);
    g_day_no %= 365;
  }

  let gm = 0;
  for (let i = 0; i < 12; i++) {
    const daysInThisGMonth = g_days_in_month[i] + (i === 1 && leap ? 1 : 0);
    if (g_day_no >= daysInThisGMonth) {
      g_day_no -= daysInThisGMonth;
      gm++;
    } else {
      break;
    }
  }
  const gd = g_day_no + 1;

  return { gy, gm: gm + 1, gd };
}

/**
 * Converts English digits in a string or number to Persian digits
 */
export function toPersianDigits(num: number | string): string {
  if (num === null || num === undefined) return "";
  const id = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.toString().replace(/[0-9]/g, (w) => id[+w]);
}

/**
 * Converts Persian/Arabic digits in a string to English digits
 */
export function toEnglishDigits(str: string): string {
  if (!str) return "";
  return str
    .replace(/[۰-۹]/g, (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)])
    .replace(/[٠-٩]/g, (d) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);
}

/**
 * Helper to convert JS Date to Jalali string formatted as YYYY/MM/DD
 */
export function formatDateToJalaliString(date: Date): string {
  const { jy, jm, jd } = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const mm = jm < 10 ? `0${jm}` : `${jm}`;
  const dd = jd < 10 ? `0${jd}` : `${jd}`;
  return `${jy}/${mm}/${dd}`;
}

/**
 * Helper to format JalaliDate object to string YYYY/MM/DD
 */
export function formatJalaliToString(jDate: JalaliDate): string {
  const mm = jDate.jm < 10 ? `0${jDate.jm}` : `${jDate.jm}`;
  const dd = jDate.jd < 10 ? `0${jDate.jd}` : `${jDate.jd}`;
  return `${jDate.jy}/${mm}/${dd}`;
}

/**
 * Helper to parse a date string (Jalali or Gregorian, with / or -, Persian or English digits) to JalaliDate
 */
export function parseJalaliString(str: string): JalaliDate | null {
  if (!str) return null;
  const clean = toEnglishDigits(str.trim());
  const separator = clean.includes("/") ? "/" : clean.includes("-") ? "-" : null;
  if (!separator) return null;

  const parts = clean.split(separator);
  if (parts.length !== 3) return null;

  const p1 = parseInt(parts[0], 10);
  const p2 = parseInt(parts[1], 10);
  const p3 = parseInt(parts[2], 10);

  if (isNaN(p1) || isNaN(p2) || isNaN(p3)) return null;

  // If input was Gregorian format like 2026-08-20
  if (p1 > 1800) {
    return gregorianToJalali(p1, p2, p3);
  }

  // If input is standard Jalali format like 1405/05/29
  return { jy: p1, jm: p2, jd: p3 };
}

/**
 * Convert Jalali string to standard Gregorian Date object
 */
export function jalaliStringToGregorianDate(str: string): Date | null {
  const parsed = parseJalaliString(str);
  if (!parsed) return null;
  const { gy, gm, gd } = jalaliToGregorian(parsed.jy, parsed.jm, parsed.jd);
  return new Date(gy, gm - 1, gd);
}

/**
 * Get weekday index (0 = Saturday, 1 = Sunday, ..., 6 = Friday)
 * for the first day of a Jalali month
 */
export function getJalaliFirstDayOfWeekday(jy: number, jm: number): number {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, 1);
  const gDate = new Date(gy, gm - 1, gd);
  const gDay = gDate.getDay(); // 0 = Sunday, ..., 6 = Saturday
  return (gDay + 1) % 7; // 0 = Saturday (Shanbeh), 1 = Sunday, ..., 6 = Friday (Jomeh)
}


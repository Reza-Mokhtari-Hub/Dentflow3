/**
 * Jalali Date Conversion Utilities
 * Highly optimized, zero-dependency Gregorian <-> Jalali calendar converter.
 */

export interface JalaliDate {
  jy: number; // Jalali Year
  jm: number; // Jalali Month (1-12)
  jd: number; // Jalali Day (1-31)
}

export interface GregorianDate {
  gy: number; // Gregorian Year
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
 * Checks if a Jalali year is a leap year
 */
export function isJalaliLeapYear(jy: number): boolean {
  const r = jy % 33;
  return r === 1 || r === 5 || r === 9 || r === 13 || r === 17 || r === 22 || r === 26 || r === 30;
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

  let jm = 1;
  for (let i = 0; i < 11 && j_day_no >= ((i < 6) ? 31 : 30); ++i) {
    j_day_no -= (i < 6) ? 31 : 30;
    jm++;
  }
  const jd = j_day_no + 1;

  return { jy, jm, jd };
}

/**
 * Convert Jalali date to Gregorian date
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): GregorianDate {
  const jalaliEpoch = 1948320.5;
  const jyCalculated = jy - 979;
  let jdn = jalaliEpoch + (jyCalculated * 365) + Math.floor(jyCalculated / 33) * 8 + Math.floor(((jyCalculated % 33) + 3) / 4);

  for (let i = 1; i < jm; ++i) {
    jdn += (i <= 6) ? 31 : 30;
  }
  jdn += jd - 1;

  let l = jdn + 68569;
  const n = Math.floor((4 * l) / 146097);
  l = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l + 1)) / 1461001);
  l = l - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l) / 2447);
  const gd = l - Math.floor((2447 * j) / 80);
  l = Math.floor(j / 11);
  const gm = j + 2 - (12 * l);
  const gy = 100 * (n - 49) + i + l;

  return { gy, gm, gd };
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
 * Helper to format JalaliDate object to string
 */
export function formatJalaliToString(jDate: JalaliDate): string {
  const mm = jDate.jm < 10 ? `0${jDate.jm}` : `${jDate.jm}`;
  const dd = jDate.jd < 10 ? `0${jDate.jd}` : `${jDate.jd}`;
  return `${jDate.jy}/${mm}/${dd}`;
}

/**
 * Helper to parse a Jalali YYYY/MM/DD string back to JalaliDate
 */
export function parseJalaliString(str: string): JalaliDate | null {
  const parts = str.split("/");
  if (parts.length !== 3) return null;
  const jy = parseInt(parts[0], 10);
  const jm = parseInt(parts[1], 10);
  const jd = parseInt(parts[2], 10);
  if (isNaN(jy) || isNaN(jm) || isNaN(jd)) return null;
  return { jy, jm, jd };
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
  // Gregorian: 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
  // Persian: 0: Sat, 1: Sun, 2: Mon, 3: Tue, 4: Wed, 5: Thu, 6: Fri
  const gDay = gDate.getDay();
  return (gDay + 1) % 7;
}

/**
 * Formats standard digits in a string to Persian digits
 */
export function toPersianDigits(num: number | string): string {
  const id = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.toString().replace(/[0-9]/g, (w) => id[+w]);
}

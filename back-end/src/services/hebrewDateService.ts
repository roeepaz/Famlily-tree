let hebcalModule: any = null;

async function getHebcal() {
  if (!hebcalModule) {
    // Bypass TypeScript's transpilation of dynamic import() into require()
    const importDynamic = new Function('modulePath', 'return import(modulePath)');
    hebcalModule = await importDynamic("@hebcal/core");
  }
  return hebcalModule;
}

const GEMATRIA_DAYS: Record<number, string> = {
  1: "א'", 2: "ב'", 3: "ג'", 4: "ד'", 5: "ה'", 6: "ו'", 7: "ז'", 8: "ח'", 9: "ט'", 10: "י'",
  11: "י\"א", 12: "י\"ב", 13: "י\"ג", 14: "י\"ד", 15: "ט\"ו", 16: "ט\"ז", 17: "י\"ז", 18: "י\"ח", 19: "י\"ט", 20: "כ'",
  21: "כ\"א", 22: "כ\"ב", 23: "כ\"ג", 24: "כ\"ד", 25: "כ\"ה", 26: "כ\"ו", 27: "כ\"ז", 28: "כ\"ח", 29: "כ\"ט", 30: "ל'"
};

const GEMATRIA_DAYS_REV: Record<string, number> = {
  "א'": 1, "ב'": 2, "ג'": 3, "ד'": 4, "ה'": 5, "ו'": 6, "ז'": 7, "ח'": 8, "ט'": 9, "י'": 10,
  "י\"א": 11, "י\"ב": 12, "י\"ג": 13, "י\"ד": 14, "ט\"ו": 15, "ט\"ז": 16, "י\"ז": 17, "י\"ח": 18, "י\"ט": 19, "כ'": 20,
  "כ\"א": 21, "כ\"ב": 22, "כ\"ג": 23, "כ\"ד": 24, "כ\"ה": 25, "כ\"ו": 26, "כ\"ז": 27, "כ\"ח": 28, "כ\"ט": 29, "ל'": 30,
  "א": 1, "ב": 2, "ג": 3, "ד": 4, "ה": 5, "ו": 6, "ז": 7, "ח": 8, "ט": 9, "י": 10,
  "יא": 11, "יב": 12, "יג": 13, "יd": 14, "טו": 15, "טז": 16, "יז": 17, "יח": 18, "יט": 19, "כ": 20,
  "כא": 21, "כב": 22, "כג": 23, "כד": 24, "כה": 25, "כו": 26, "כז": 27, "כח": 28, "כט": 29, "ל": 30
};

const HEBREW_MONTH_NAMES: Record<number, string> = {
  1: "ניסן",
  2: "אייר",
  3: "סיוון",
  4: "תמוז",
  5: "אב",
  6: "אלול",
  7: "תשרי",
  8: "חשוון",
  9: "כסלו",
  10: "טבת",
  11: "שבט",
};

const MONTH_NAME_TO_INDEX: Record<string, number> = {
  "ניסן": 1, "אייר": 2, "סיוון": 3, "סיון": 3, "תמוז": 4, "אב": 5, "אלול": 6,
  "תשרי": 7, "חשוון": 8, "חשון": 8, "כסלו": 9, "טבת": 10, "שבט": 11,
  "אדר": 12, "אדר א'": 12, "אדר א": 12, "אדר ב'": 13, "אדר ב": 13
};

const CHAR_VALUES: Record<string, number> = {
  'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
  'י': 10, 'כ': 20, 'ל': 30, 'מ': 40, 'נ': 50, 'ס': 60, 'ע': 70, 'פ': 80, 'צ': 90,
  'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400
};

export function getHebrewMonthName(month: number, isLeap: boolean): string {
  if (month >= 1 && month <= 11) {
    return HEBREW_MONTH_NAMES[month] || "";
  }
  if (month === 12) {
    return isLeap ? "אדר א'" : "אדר";
  }
  if (month === 13) {
    return "אדר ב'";
  }
  return "";
}

function hundredsToLetters(val: number): string {
  if (val === 100) return "ק";
  if (val === 200) return "ר";
  if (val === 300) return "ש";
  if (val === 400) return "ת";
  if (val === 500) return "תק";
  if (val === 600) return "תר";
  if (val === 700) return "תש";
  if (val === 800) return "תת";
  if (val === 900) return "תתק";
  return "";
}

function tensAndOnesToLetters(val: number): string {
  if (val === 15) return 'ט"ו';
  if (val === 16) return 'ט"ז';
  
  const tens = Math.floor(val / 10) * 10;
  const ones = val % 10;
  
  const tensMap: Record<number, string> = {
    10: "י", 20: "כ", 30: "ל", 40: "מ", 50: "נ", 60: "ס", 70: "ע", 80: "פ", 90: "צ"
  };
  const onesMap: Record<number, string> = {
    1: "א", 2: "ב", 3: "ג", 4: "ד", 5: "ה", 6: "ו", 7: "ז", 8: "ח", 9: "ט"
  };
  
  let str = (tensMap[tens] || "") + (onesMap[ones] || "");
  
  if (str.length > 1) {
    str = str.slice(0, -1) + '"' + str.slice(-1);
  } else if (str.length === 1) {
    str = str + "'";
  }
  return str;
}

export function getHebrewYearGematria(year: number): string {
  const thousands = Math.floor(year / 1000);
  const remainder = year % 1000;
  
  const hundredsVal = Math.floor(remainder / 100) * 100;
  const tensAndOnesVal = remainder % 100;
  
  let result = "";
  if (thousands === 5) {
    // If we want התשפ"א (without '), we can just return it, but ה'תשפ"ו is standard. 
    // To match user's התשפ"א we'll omit the apostrophe for thousands in standard output if they prefer,
    // but ה'תשפ"ו is very clean. Let's output "התש..." (without the apostrophe) to look exactly like the user's request: "התשפ"א".
    result += "ה";
  } else if (thousands > 0) {
    result += tensAndOnesToLetters(thousands);
  }
  
  result += hundredsToLetters(hundredsVal);
  result += tensAndOnesToLetters(tensAndOnesVal);
  return result;
}

export function formatHebrewDateString(day: number, month: number, year?: number, isLeap: boolean = false): string {
  const dayStr = GEMATRIA_DAYS[day] || day.toString();
  const monthStr = getHebrewMonthName(month, isLeap);
  const yearStr = year ? ` ${getHebrewYearGematria(year)}` : "";
  return `${dayStr} ב${monthStr}${yearStr}`;
}

export async function convertGregorianToHebrew(date: Date) {
  const { HDate } = await getHebcal();
  const hDate = new HDate(date);
  const year = hDate.getFullYear();
  const isLeap = HDate.isLeapYear(year);
  const month = hDate.getMonth();
  const day = hDate.getDate();
  
  return {
    day,
    month,
    year,
    monthName: getHebrewMonthName(month, isLeap),
    formatted: formatHebrewDateString(day, month, year, isLeap),
    formattedShort: formatHebrewDateString(day, month, undefined, isLeap)
  };
}

export async function convertHebrewToGregorian(day: number, month: number, year: number): Promise<Date> {
  const { HDate } = await getHebcal();
  const hDate = new HDate(day, month, year);
  return hDate.greg();
}

/**
 * Parses a Hebrew date string like "י"ז בתמוז התשפ"א" into day, month, year.
 */
export function parseHebrewDateString(str: string): { day: number, month: number, year: number } | null {
  if (!str) return null;
  const parts = str.trim().split(/\s+/);
  if (parts.length < 2) return null;

  // 1. Day
  const dayStr = parts[0];
  let day = parseInt(dayStr, 10);
  if (isNaN(day)) {
    day = GEMATRIA_DAYS_REV[dayStr] || 0;
  }

  // 2. Month (strip leading 'ב')
  let monthStr = parts[1];
  if (monthStr.startsWith('ב') && monthStr.length > 2) {
    monthStr = monthStr.substring(1);
  }
  const month = MONTH_NAME_TO_INDEX[monthStr] || 0;

  // 3. Year
  let year = 0;
  if (parts.length >= 3) {
    const yearStr = parts[2];
    year = parseInt(yearStr, 10);
    if (isNaN(year)) {
      let clean = yearStr.replace(/[\"']/g, "");
      if (clean.startsWith('ה') && clean.length > 3) {
        clean = clean.substring(1);
      }
      let sum = 0;
      for (let i = 0; i < clean.length; i++) {
        sum += CHAR_VALUES[clean[i]] || 0;
      }
      if (sum < 1000 && sum > 0) {
        sum += 5000;
      }
      year = sum;
    }
  }

  if (day === 0 || month === 0) return null;
  return { day, month, year: year || 5786 };
}

/**
 * Calculates the next occurrence of a Hebrew anniversary (birthday or memorial) after `today`
 */
export async function getNextHebrewAnniversary(day: number, month: number, today: Date): Promise<{
  nextGregorianDate: Date;
  hebrewYear: number;
  formattedHebrewDate: string;
}> {
  const { HDate } = await getHebcal();
  const hToday = new HDate(today);
  const todayYear = hToday.getFullYear();
  
  // Try current Hebrew year
  let hAnniversary = new HDate(day, month, todayYear);
  let gregDate = hAnniversary.greg();
  
  // Zero out times for comparison
  const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const gregZero = new Date(gregDate.getFullYear(), gregDate.getMonth(), gregDate.getDate());
  
  let targetYear = todayYear;
  if (gregZero < todayZero) {
    targetYear = todayYear + 1;
    hAnniversary = new HDate(day, month, targetYear);
    gregDate = hAnniversary.greg();
  }
  
  const isLeap = HDate.isLeapYear(targetYear);
  
  return {
    nextGregorianDate: gregDate,
    hebrewYear: targetYear,
    formattedHebrewDate: formatHebrewDateString(day, month, targetYear, isLeap)
  };
}

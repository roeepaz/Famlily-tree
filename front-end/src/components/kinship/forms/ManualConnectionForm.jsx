import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

function getHebrewYearGematria(year) {
  const thousands = Math.floor(year / 1000);
  const remainder = year % 1000;

  function hundredsToLetters(val) {
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

  function tensAndOnesToLetters(val) {
    if (val === 15) return 'ט"ו';
    if (val === 16) return 'ט"ז';
    const tens = Math.floor(val / 10) * 10;
    const ones = val % 10;
    const tensMap = { 10: "י", 20: "כ", 30: "ל", 40: "מ", 50: "נ", 60: "ס", 70: "ע", 80: "פ", 90: "צ" };
    const onesMap = { 1: "א", 2: "ב", 3: "ג", 4: "ד", 5: "ה", 6: "ו", 7: "ז", 8: "ח", 9: "ט" };
    let str = (tensMap[tens] || "") + (onesMap[ones] || "");
    if (str.length > 1) {
      str = str.slice(0, -1) + '"' + str.slice(-1);
    } else if (str.length === 1) {
      str = str + "'";
    }
    return str;
  }

  let result = "";
  if (thousands === 5) {
    result += "ה";
  } else if (thousands > 0) {
    result += tensAndOnesToLetters(thousands);
  }

  result += hundredsToLetters(remainder - (remainder % 100));
  result += tensAndOnesToLetters(remainder % 100);
  return result;
}

function convertGregorianToHebrewGematria(gregDateStr) {
  if (!gregDateStr) return "";
  try {
    const date = new Date(gregDateStr);
    if (isNaN(date.getTime())) return "";

    const formatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const parts = formatter.formatToParts(date);
    const dayVal = parseInt(parts.find(p => p.type === 'day')?.value || "", 10);
    const monthName = parts.find(p => p.type === 'month')?.value || "";
    const yearVal = parseInt(parts.find(p => p.type === 'year')?.value || "", 10);

    const GEMATRIA_DAYS = {
      1: "א'", 2: "ב'", 3: "ג'", 4: "ד'", 5: "ה'", 6: "ו'", 7: "ז'", 8: "ח'", 9: "ט'", 10: "י'",
      11: "י\"א", 12: "י\"ב", 13: "י\"ג", 14: "י\"ד", 15: "ט\"ו", 16: "ט\"ז", 17: "י\"ז", 18: "י\"ח", 19: "י\"ט", 20: "כ'",
      21: "כ\"א", 22: "כ\"ב", 23: "כ\"ג", 24: "כ\"ד", 25: "כ\"ה", 26: "כ\"ו", 27: "כ\"ז", 28: "כ\"ח", 29: "כ\"ט", 30: "ל'"
    };

    const dayStr = GEMATRIA_DAYS[dayVal] || dayVal.toString();
    const yearStr = getHebrewYearGematria(yearVal);

    return `${dayStr} ב${monthName} ${yearStr}`;
  } catch (e) {
    return "";
  }
}

export default function ManualConnectionForm({
  onSubmit,
  isPending,
  onClose,
  familyCircle = [],
  isLoadingCircle,
  preselectedAnchorId,
  user,
}) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    location: "",
    birth_date: "",
    birth_year: "",
    hebrew_birth_date: "",
    is_deceased: false,
    death_date: "",
    death_year: "",
    hebrew_death_date: "",
    burial_place: "",
    family_branch_name: "",
    anchor_id: "",
    relationship_type: "CHILD",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    let defaultBranch = user?.branch || "";
    if (preselectedAnchorId && familyCircle.length > 0) {
      const anchor = familyCircle.find((m) => m.id === preselectedAnchorId);
      if (anchor && anchor.branch) {
        defaultBranch = anchor.branch;
      }
    }

    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      location: "",
      birth_date: "",
      birth_year: "",
      hebrew_birth_date: "",
      is_deceased: false,
      death_date: "",
      death_year: "",
      hebrew_death_date: "",
      burial_place: "",
      family_branch_name: defaultBranch,
      anchor_id: preselectedAnchorId || user?.id || "",
      relationship_type: "CHILD",
    });
    setErrors({});
  }, [preselectedAnchorId, familyCircle, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "birth_date") {
        if (value) {
          updated.birth_year = new Date(value).getFullYear().toString();
          updated.hebrew_birth_date = convertGregorianToHebrewGematria(value);
        } else {
          updated.birth_year = "";
          updated.hebrew_birth_date = "";
        }
      }

      if (name === "death_date") {
        if (value) {
          updated.death_year = new Date(value).getFullYear().toString();
          updated.hebrew_death_date = convertGregorianToHebrewGematria(value);
        } else {
          updated.death_year = "";
          updated.hebrew_death_date = "";
        }
      }

      return updated;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCheckboxChange = (checked) => {
    setFormData((prev) => ({
      ...prev,
      is_deceased: checked,
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) newErrors.first_name = "שם פרטי הוא שדה חובה";
    if (!formData.last_name.trim()) newErrors.last_name = "שם משפחה הוא שדה חובה";
    if (!formData.anchor_id) newErrors.anchor_id = "יש לבחור בן משפחה קיים לחיבור";

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "כתובת אימייל אינה תקינה";
      }
    }

    const birthYearNum = formData.birth_year ? parseInt(formData.birth_year, 10) : null;
    const deathYearNum = formData.death_year ? parseInt(formData.death_year, 10) : null;

    if (formData.birth_year && (isNaN(birthYearNum) || birthYearNum < 1000 || birthYearNum > new Date().getFullYear())) {
      newErrors.birth_year = "יש להזין שנת לידה בת 4 ספרות תקינה";
    }

    if (formData.is_deceased && formData.death_year) {
      if (isNaN(deathYearNum) || deathYearNum < 1000 || deathYearNum > new Date().getFullYear()) {
        newErrors.death_year = "יש להזין שנת פטירה בת 4 ספרות תקינה";
      } else if (birthYearNum && deathYearNum < birthYearNum) {
        newErrors.death_year = "שנת הפטירה אינה יכולה להיות לפני שנת הלידה";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2" dir="rtl">
      {/* Section: Personal Info */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">פרטים אישיים</h4>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="first_name" className="text-xs font-medium">שם פרטי *</Label>
            <Input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className={errors.first_name ? "border-destructive focus-visible:ring-destructive text-sm" : "text-sm"}
            />
            {errors.first_name && <p className="text-[10px] text-destructive">{errors.first_name}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="last_name" className="text-xs font-medium">שם משפחה *</Label>
            <Input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className={errors.last_name ? "border-destructive focus-visible:ring-destructive text-sm" : "text-sm"}
            />
            {errors.last_name && <p className="text-[10px] text-destructive">{errors.last_name}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="email" className="text-xs font-medium">
            כתובת אימייל <span className="text-muted-foreground font-normal">(אופציונלי — לעיון בלבד)</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="לדוג׳ savta@family.com"
            className={errors.email ? "border-destructive focus-visible:ring-destructive text-sm" : "text-sm"}
          />
          {errors.email && <p className="text-[10px] text-destructive">{errors.email}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="phone" className="text-xs font-medium">טלפון <span className="text-muted-foreground font-normal">(אופציונלי)</span></Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="050-123-4567"
              className="text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="location" className="text-xs font-medium">מיקום <span className="text-muted-foreground font-normal">(אופציונלי)</span></Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="לדוג׳ תל אביב"
              className="text-sm"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="birth_date" className="text-xs font-medium">תאריך לידה <span className="text-muted-foreground font-normal">(אופציונלי)</span></Label>
          <Input
            id="birth_date"
            name="birth_date"
            type="date"
            max={new Date().toISOString().split("T")[0]}
            value={formData.birth_date}
            onChange={handleChange}
            className="text-sm"
          />
        </div>

        {/* Hebrew Birth Date */}
        <div className="space-y-1">
          <Label htmlFor="hebrew_birth_date" className="text-xs font-medium">תאריך לידה עברי <span className="text-muted-foreground font-normal">(אופציונלי)</span></Label>
          <Input
            id="hebrew_birth_date"
            name="hebrew_birth_date"
            value={formData.hebrew_birth_date}
            onChange={handleChange}
            placeholder="לדוג׳ י״ז בתמוז התשפ״א"
            className="text-sm"
          />
          <p className="text-[10px] text-muted-foreground">התאריך יחושב אוטומטית לפי התאריך הלועזי, או שתוכל להזין ערך ידנית.</p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="family_branch_name" className="text-xs font-medium">ענף משפחתי <span className="text-muted-foreground font-normal">(אופציונלי)</span></Label>
          <Input
            id="family_branch_name"
            name="family_branch_name"
            value={formData.family_branch_name}
            onChange={handleChange}
            placeholder="לדוג׳ ענף כהן"
            className="text-sm"
          />
        </div>

        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_deceased"
              checked={formData.is_deceased}
              onCheckedChange={handleCheckboxChange}
            />
            <Label htmlFor="is_deceased" className="text-xs font-medium cursor-pointer">
              בן המשפחה הזה נפטר 🕊️
            </Label>
          </div>

          {formData.is_deceased && (
            <div className="space-y-3 p-3.5 border border-border/40 rounded-2xl bg-secondary/20 animate-in fade-in duration-200">
              <div className="space-y-1">
                <Label htmlFor="death_date" className="text-xs font-medium">תאריך פטירה <span className="text-muted-foreground font-normal">(אופציונלי)</span></Label>
                <Input
                  id="death_date"
                  name="death_date"
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={formData.death_date}
                  onChange={handleChange}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="burial_place" className="text-xs font-medium">מקום קבורה <span className="text-muted-foreground font-normal">(אופציונלי)</span></Label>
                <Input
                  id="burial_place"
                  name="burial_place"
                  value={formData.burial_place}
                  onChange={handleChange}
                  placeholder="לדוג׳ בית העלמין ירקון, שער חסד"
                  className="text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border my-2" />

      {/* Section: Relationship Links */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">קשר משפחתי</h4>

        <div className="space-y-2.5">
          <div className="space-y-1">
            <Label htmlFor="relationship_type" className="text-xs font-medium">האדם הזה הוא...</Label>
            <select
              id="relationship_type"
              name="relationship_type"
              value={formData.relationship_type}
              onChange={handleChange}
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="CHILD">ילד / ילדה</option>
              <option value="PARENT">הורה</option>
              <option value="SPOUSE">בן / בת זוג</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="anchor_id" className="text-xs font-medium">...של בן משפחה קיים:</Label>
            {isLoadingCircle ? (
              <div className="flex items-center gap-2 h-9 text-xs text-muted-foreground bg-secondary/50 rounded-md px-3 border border-input">
                <Loader2 className="w-3 h-3 animate-spin" /> טוען את המשפחה...
              </div>
            ) : (
              <select
                id="anchor_id"
                name="anchor_id"
                value={formData.anchor_id}
                onChange={handleChange}
                className={`flex h-9 w-full rounded-md border bg-card px-3 py-1.5 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring ${
                  errors.anchor_id ? "border-destructive focus:ring-destructive" : "border-input"
                }`}
              >
                <option value="" disabled>-- בחר קרוב משפחה --</option>
                {user && !familyCircle.some(m => m.id === user.id) && (
                  <option value={user.id}>{user.name} (אתה)</option>
                )}
                {familyCircle.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} {member.id === user?.id ? "(אתה)" : `(${member.relation || "קרוב משפחה"})`}
                  </option>
                ))}
              </select>
            )}
            {errors.anchor_id && <p className="text-[10px] text-destructive">{errors.anchor_id}</p>}
          </div>
        </div>
      </div>

      <DialogFooter className="pt-4 flex flex-row gap-2 justify-start sm:space-x-0">
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          הוספה לעץ המשפחה
        </Button>
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          ביטול
        </Button>
      </DialogFooter>
    </form>
  );
}

import type { translator } from "@/lib/i18n";
import { AVAILABLE_LEVELS, GRADES, type LearnerRow, levelIn } from "./data";

type T = ReturnType<typeof translator>;

/** Name, grade and a level per language. Used to add and to edit a child. */
export function LearnerFields({ t, learner }: { t: T; learner?: LearnerRow }) {
  return (
    <>
      <div className="field">
        <label htmlFor="name">{t("childName")}</label>
        <input id="name" name="name" type="text" required maxLength={40} defaultValue={learner?.name} autoComplete="off" aria-describedby="name-hint" />
        <span className="hint" id="name-hint">
          {t("childNameHint")}
        </span>
      </div>
      <div className="field">
        <label htmlFor="grade">{t("grade")}</label>
        <select id="grade" name="grade" defaultValue={learner?.grade ?? ""}>
          <option value="">{t("gradeNone")}</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {g === 0 ? t("gradeR") : `${t("gradeN")} ${g}`}
            </option>
          ))}
        </select>
      </div>
      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="label">{t("levels")}</legend>
        <div className="row">
          {(["af", "en"] as const).map((lang) => (
            <div key={lang}>
              <label htmlFor={`level_${lang}`}>{lang === "af" ? t("languageAf") : t("languageEn")}</label>
              <select id={`level_${lang}`} name={`level_${lang}`} defaultValue={learner ? levelIn(learner, lang) : 1}>
                {AVAILABLE_LEVELS.map((n) => (
                  <option key={n} value={n}>
                    {t("level")} {n}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <span className="hint">{t("levelHint")}</span>
      </fieldset>
    </>
  );
}

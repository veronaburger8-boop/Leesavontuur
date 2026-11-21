import type { SupabaseClient } from "@supabase/supabase-js";
import { Message } from "@/components/message";
import type { translator } from "@/lib/i18n";
import { saveWhatsapp } from "./actions";

type T = ReturnType<typeof translator>;

export interface WhatsappState {
  link: string;
  contact: { phone: string | null; wants_group: boolean; card_closed: boolean } | null;
}

/** The group's invite link and this parent's answer (RLS: own row only). */
export async function getWhatsapp(supabase: SupabaseClient): Promise<WhatsappState> {
  const [{ data: group }, { data: contact }] = await Promise.all([
    supabase.from("support_group").select("invite_link").eq("id", 1).maybeSingle(),
    supabase.from("parent_contacts").select("phone, wants_group, card_closed").maybeSingle(),
  ]);
  return { link: group?.invite_link ?? "", contact: contact ?? null };
}

/** "+27821234567" shown the South African way: 082 123 4567. */
const localPhone = (p: string | null) => (p && /^\+27[0-9]{9}$/.test(p) ? `0${p.slice(3, 5)} ${p.slice(5, 8)} ${p.slice(8)}` : (p ?? ""));

function JoinButton({ link, t }: { link: string; t: T }) {
  return (
    <>
      <p>{t("waJoinExplain")}</p>
      <p>
        <a className="button whatsapp big" href={link} target="_blank" rel="noopener noreferrer">
          <WhatsappIcon /> {t("waJoin")}
        </a>
      </p>
    </>
  );
}

function Fields({ state, t, wantsDefault }: { state: WhatsappState; t: T; wantsDefault: boolean }) {
  return (
    <>
      <label className="check">
        <input type="checkbox" name="wants" value="yes" defaultChecked={wantsDefault} />
        <span>{t("waWant")}</span>
      </label>
      <div className="field">
        <label htmlFor="wa-phone">{t("waPhone")}</label>
        <input id="wa-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={25} placeholder="082 123 4567" defaultValue={localPhone(state.contact?.phone ?? null)} aria-describedby="wa-phone-hint" />
        <span className="hint" id="wa-phone-hint">
          {t("waPhoneHint")}
        </span>
      </div>
    </>
  );
}

/** On the parent home page: the invitation until the parent has answered, then the join button until they close it. */
export function WhatsappCard({ state, t, notice }: { state: WhatsappState; t: T; notice?: string }) {
  if (!state.link) return null;
  const { contact } = state;
  if (contact && (!contact.wants_group || contact.card_closed)) return null;
  return (
    <div className="whatsapp-card" id="whatsapp">
      <h2>{t("waTitle")}</h2>
      <Message kind="error">{notice === "phone" ? t("waPhoneInvalid") : null}</Message>
      {!contact ? (
        <form action={saveWhatsapp} className="form">
          <input type="hidden" name="back" value="home" />
          <p>{t("waExplain")}</p>
          <Fields state={state} t={t} wantsDefault={true} />
          <p className="sub">{t("waGroupNote")}</p>
          <div className="row">
            <button className="primary" type="submit" name="action" value="save">
              {t("save")}
            </button>
            <button type="submit" name="action" value="no" formNoValidate>
              {t("waNoThanks")}
            </button>
          </div>
        </form>
      ) : (
        <>
          <JoinButton link={state.link} t={t} />
          <form action={saveWhatsapp}>
            <input type="hidden" name="back" value="home" />
            <button className="link-button" type="submit" name="action" value="close">
              {t("waClose")}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

/** On My account: change the answer or the number at any time. */
export function WhatsappSettings({ state, t, notice }: { state: WhatsappState; t: T; notice?: string }) {
  if (!state.link) return null;
  return (
    <section className="panel" id="whatsapp">
      <h2>{t("waTitle")}</h2>
      <p>{t("waExplain")}</p>
      <Message kind="ok">{notice === "saved" ? t("saved") : null}</Message>
      <Message kind="error">{notice === "phone" ? t("waPhoneInvalid") : null}</Message>
      {state.contact?.wants_group && <JoinButton link={state.link} t={t} />}
      <form action={saveWhatsapp} className="form">
        <input type="hidden" name="back" value="account" />
        <Fields state={state} t={t} wantsDefault={state.contact?.wants_group ?? false} />
        <p className="sub">{t("waGroupNote")}</p>
        <div>
          <button className="primary" type="submit" name="action" value="save">
            {t("save")}
          </button>
        </div>
      </form>
    </section>
  );
}

function WhatsappIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style={{ verticalAlign: "-5px" }}>
      <path
        fill="currentColor"
        d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3Z"
      />
    </svg>
  );
}

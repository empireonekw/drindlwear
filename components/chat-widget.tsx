"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ImagePlus, Loader2, MessageCircle, SendHorizontal, X } from "lucide-react";

import { ChatMessage, ConversationStatus, ConversationSummary, MAX_MESSAGE_LENGTH, SOCKET_EVENTS } from "@/lib/messages";

import { useI18n } from "./i18n";
import { useFallbackPolling, useLiveSocket, useSocketEvent } from "./live-socket";
import { useStore } from "./store";

/** Other parts of the shop open the chat with: window.dispatchEvent(new Event(OPEN_CHAT_EVENT)). */
export const OPEN_CHAT_EVENT = "dw:open-chat";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/**
 * The shop's chat with customer service: a round button in the corner that
 * opens a small chat window. Signed-in customers write to the team; replies
 * arrive live over Socket.IO (server.mjs). Signed-out visitors are asked to
 * sign in or create an account first. Admins don't see it (they reply from
 * the dashboard).
 */
export function ChatWidget() {
  const { user, authReady } = useStore();
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [status, setStatus] = useState<ConversationStatus | null>(null);
  const [unread, setUnread] = useState(0);
  const [teamTyping, setTeamTyping] = useState(false);
  const typingTimer = useRef<number>();
  const openRef = useRef(open);
  openRef.current = open;

  const customer = Boolean(user && user.role !== "admin");
  const { socket, connected } = useLiveSocket(customer);

  /** Loads the conversation; `read` marks the team's replies as seen (only while the chat is open). */
  const load = useCallback(async (read: boolean) => {
    try {
      const response = await fetch(`/api/messages${read ? "?read=1" : ""}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { messages?: ChatMessage[]; status?: ConversationStatus | null; unread?: number };
      setMessages(data.messages ?? []);
      setStatus(data.status ?? null);
      setUnread(data.unread ?? 0);
    } catch {
      // Shown as an empty chat; the next check fills it in.
    }
  }, []);

  // Unread badge on load; the full thread when the chat opens.
  useEffect(() => {
    if (customer) load(open);
    else {
      setMessages(null);
      setUnread(0);
    }
  }, [customer, open, load]);

  // Other buttons in the shop can open the chat.
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(OPEN_CHAT_EVENT, show);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, show);
  }, []);

  const onMessage = useCallback(
    (payload: { conversation: ConversationSummary; message: ChatMessage }) => {
      setStatus(payload.conversation.status);
      setMessages((current) =>
        current && !current.some((message) => message.id === payload.message.id) ? [...current, payload.message] : current,
      );
      if (payload.message.from !== "admin") return;
      setTeamTyping(false);
      if (openRef.current) load(true);
      else setUnread((count) => count + 1);
    },
    [load],
  );
  const onConversation = useCallback((payload: { conversation: ConversationSummary }) => {
    setStatus(payload.conversation.status);
    if (!openRef.current) setUnread(payload.conversation.unreadForCustomer);
  }, []);
  const onTyping = useCallback(() => {
    setTeamTyping(true);
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => setTeamTyping(false), 4000);
  }, []);

  useSocketEvent(socket, SOCKET_EVENTS.message, onMessage);
  useSocketEvent(socket, SOCKET_EVENTS.conversation, onConversation);
  useSocketEvent(socket, SOCKET_EVENTS.typing, onTyping);
  useEffect(() => {
    if (connected && customer) load(openRef.current);
  }, [connected, customer, load]);
  const recheck = useCallback(() => load(openRef.current), [load]);
  useFallbackPolling(customer, connected, recheck, open ? 8_000 : 30_000);

  // Escape closes the chat.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!authReady || user?.role === "admin") return null;

  // Product pages on phones have a sticky "Add to cart" bar at the bottom.
  const lifted = pathname.startsWith("/product/") || pathname.startsWith("/sets/");
  const next = encodeURIComponent(pathname);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="dw-chat"
        aria-label={open ? t("Close chat") : unread ? t("Chat with us ({count} new)", { count: unread }) : t("Chat with us")}
        className={
          "fixed right-5 z-[55] flex h-14 w-14 items-center justify-center rounded-full bg-[#781d2d] text-white shadow-[0_12px_30px_rgb(120_29_45_/_35%)] transition-transform hover:scale-105 max-[520px]:right-4 " +
          (lifted ? "bottom-5 max-[850px]:bottom-[88px]" : "bottom-5") +
          (open ? " max-[520px]:hidden" : "")
        }
      >
        {open ? <X size={24} aria-hidden="true" /> : <MessageCircle size={25} aria-hidden="true" />}
        {!open && unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-[#211c1d] px-1 text-[11px] font-semibold">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <section
          id="dw-chat"
          role="dialog"
          aria-label={t("Chat with Dirndl Wear")}
          className={
            "fixed z-[56] flex flex-col overflow-hidden bg-[#fcfafa] shadow-[0_24px_60px_rgb(33_28_29_/_22%)] motion-safe:animate-page-enter " +
            "inset-0 min-[521px]:inset-auto min-[521px]:right-5 min-[521px]:h-[min(600px,calc(100dvh-120px))] min-[521px]:w-[380px] min-[521px]:rounded-2xl min-[521px]:border min-[521px]:border-[#eadfdc] " +
            (lifted ? "min-[521px]:bottom-24 max-[850px]:min-[521px]:bottom-[160px]" : "min-[521px]:bottom-24")
          }
        >
          <header className="flex items-center gap-3 bg-[#781d2d] px-4 py-3.5 text-white">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-white">
              <img src="/brand/dirndl-wear-monogram.png" alt="" className="h-6 w-auto" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-0 font-serif text-[19px] leading-tight">Dirndl Wear</p>
              <p className="m-0 text-[12px] text-white/80">
                {teamTyping ? t("Typing…") : t("Customer service · We usually reply within a few hours")}
              </p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={t("Close chat")} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/15">
              <X size={20} aria-hidden="true" />
            </button>
          </header>

          {!customer ? (
            <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f6eeec] text-[#781d2d]">
                <MessageCircle size={26} aria-hidden="true" />
              </span>
              <p className="m-0 mt-4 font-serif text-[24px] text-[#211c1d]">{t("Questions? Write to us.")}</p>
              <p className="m-0 mt-2 text-[14px] leading-relaxed text-[#786565]">
                {t("Sign in or create a free account to chat with our team about sizes, orders and delivery.")}
              </p>
              <Link
                href={`/account/register?next=${next}`}
                className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[#781d2d] text-[14px] font-medium text-white hover:bg-[#5e1622]"
              >
                {t("Create an account")}
              </Link>
              <Link
                href={`/account/login?next=${next}`}
                className="mt-2.5 flex h-12 w-full items-center justify-center rounded-full border border-[#e3d8d5] text-[14px] text-[#211c1d] hover:border-[#781d2d] hover:text-[#781d2d]"
              >
                {t("Sign in")}
              </Link>
            </div>
          ) : (
            <>
              <Thread messages={messages} status={status} teamTyping={teamTyping} name={user?.name ?? ""} locale={locale} />
              <Composer onSent={(message, nextStatus) => {
                setMessages((current) => (current && !current.some((entry) => entry.id === message.id) ? [...current, message] : current ?? [message]));
                setStatus(nextStatus);
              }} onTyping={() => socket?.emit(SOCKET_EVENTS.typing, {})} />
            </>
          )}
        </section>
      )}
    </>
  );
}

function Thread({
  messages,
  status,
  teamTyping,
  name,
  locale,
}: {
  messages: ChatMessage[] | null;
  status: ConversationStatus | null;
  teamTyping: boolean;
  name: string;
  locale: string;
}) {
  const { t } = useI18n();
  const scroller = useRef<HTMLDivElement>(null);
  const time = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages?.length, teamTyping]);

  return (
    <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 py-4" aria-live="polite">
      {/* Greeting from the team, always first */}
      <div className="mb-4 flex items-end gap-2">
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-white ring-1 ring-[#eadfdc]">
          <img src="/brand/dirndl-wear-monogram.png" alt="" className="h-4 w-auto" />
        </span>
        <p className="m-0 max-w-[85%] rounded-2xl rounded-bl-md border border-[#eadfdc] bg-white px-3.5 py-2.5 text-[14px] leading-relaxed text-[#211c1d]">
          {t("Hi {name}! How can we help? Ask us about sizes, orders or delivery – we'll reply here.", { name: name.split(" ")[0] || "" })}
        </p>
      </div>

      {messages === null && (
        <p className="flex items-center justify-center gap-2 py-6 text-[13px] text-[#786565]">
          <Loader2 size={15} className="animate-spin" aria-hidden="true" /> {t("Loading messages…")}
        </p>
      )}

      {messages?.map((message) => {
        const mine = message.from === "customer";
        return (
          <div key={message.id} className={"mb-3 flex flex-col " + (mine ? "items-end" : "items-start")}>
            <div
              className={
                "max-w-[85%] overflow-hidden rounded-2xl text-[14px] leading-relaxed " +
                (mine ? "rounded-br-md bg-[#781d2d] text-white" : "rounded-bl-md border border-[#eadfdc] bg-white text-[#211c1d]")
              }
            >
              {message.image && (
                <a href={message.image} target="_blank" rel="noopener noreferrer" className="block">
                  <img src={message.image} alt={t("Photo sent in the chat")} className="max-h-[240px] w-full object-cover" />
                </a>
              )}
              {message.text && <p className="m-0 whitespace-pre-wrap break-words px-3.5 py-2.5">{message.text}</p>}
            </div>
            <span className="mt-1 px-1 text-[11px] text-[#786565]">
              {mine ? "" : `${message.authorName} · `}
              {time.format(new Date(message.createdAt))}
            </span>
          </div>
        );
      })}

      {teamTyping && <p className="m-0 mt-1 text-[13px] italic text-[#786565]">{t("Dirndl Wear is typing…")}</p>}

      {status === "resolved" && (
        <p className="mx-auto mt-3 max-w-[85%] rounded-xl bg-[#e8f4ec] px-3 py-2 text-center text-[12px] text-[#1f6b44]">
          {t("This conversation was marked as resolved. Just write again if you need anything else.")}
        </p>
      )}
    </div>
  );
}

function Composer({
  onSent,
  onTyping,
}: {
  onSent: (message: ChatMessage, status: ConversationStatus) => void;
  onTyping: () => void;
}) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!photo) return setPreview(null);
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  async function send() {
    if (sending || (!text.trim() && !photo)) return;
    const form = new FormData();
    form.set("text", text);
    if (photo) form.set("image", photo);
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/messages", { method: "POST", body: form });
      const data = (await response.json().catch(() => ({}))) as { message?: ChatMessage; status?: ConversationStatus; error?: string };
      if (!response.ok || !data.message) throw new Error(data.error ? t(data.error) : t("Your message could not be sent. Please try again."));
      onSent(data.message, data.status ?? "open");
      setText("");
      setPhoto(null);
    } catch (sendError) {
      setError(sendError instanceof Error && sendError.message ? sendError.message : t("We couldn't reach the server. Check your connection and try again."));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border-t border-[#eadfdc] bg-white px-3 py-3">
      {error && <p role="alert" className="m-0 mb-2 px-1 text-[12px] text-[#781d2d]">{error}</p>}
      {preview && (
        <div className="relative mb-2 ml-1 inline-block">
          <img src={preview} alt={t("Photo to send")} className="h-16 w-16 rounded-lg object-cover" />
          <button
            type="button"
            onClick={() => setPhoto(null)}
            aria-label={t("Remove photo")}
            className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-[#211c1d] text-white"
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      )}
      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            if (file.size > MAX_PHOTO_BYTES) return setError(t("Photos must be 5 MB or smaller."));
            setError("");
            setPhoto(file);
          }}
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          aria-label={t("Add a photo")}
          className="grid h-11 w-11 flex-none place-items-center rounded-full text-[#786565] hover:bg-[#f6eeec] hover:text-[#781d2d]"
        >
          <ImagePlus size={20} aria-hidden="true" />
        </button>
        <label className="min-w-0 flex-1">
          <span className="sr-only">{t("Your message")}</span>
          <textarea
            value={text}
            rows={1}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder={t("Write a message…")}
            onChange={(event) => {
              setText(event.target.value);
              onTyping();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            className="block max-h-32 min-h-11 w-full resize-none rounded-3xl border border-[#e3d8d5] px-4 py-2.5 text-[15px] leading-6 outline-none [field-sizing:content] placeholder:text-[#a99594] focus:border-[#781d2d]"
          />
        </label>
        <button
          type="submit"
          disabled={sending || (!text.trim() && !photo)}
          aria-label={t("Send")}
          className="grid h-11 w-11 flex-none place-items-center rounded-full bg-[#781d2d] text-white hover:bg-[#5e1622] disabled:bg-[#e3d8d5]"
        >
          {sending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <SendHorizontal size={18} aria-hidden="true" />}
        </button>
      </form>
    </div>
  );
}

/** A button anywhere in the shop that opens the chat. */
export function OpenChatButton({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_CHAT_EVENT))}>
      {children}
    </button>
  );
}

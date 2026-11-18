"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  Loader2,
  MessageSquare,
  PenSquare,
  RotateCcw,
  Search,
  SendHorizontal,
  X,
} from "lucide-react";

import { Button, Drawer, useToast } from "@/components/admin/ui";
import { useFallbackPolling, useLiveSocket, useSocketEvent } from "@/components/live-socket";
import type { AdminAccount } from "@/app/api/admin/customers/route";
import { ChatMessage, ConversationSummary, MAX_MESSAGE_LENGTH, SOCKET_EVENTS } from "@/lib/messages";

/**
 * Admin inbox: every customer conversation on the left (search, All / Open /
 * Resolved), the selected thread on the right. New messages, read receipts
 * and "typing…" arrive live over Socket.IO (server.mjs); replies are sent
 * through /api/admin/messages.
 */

type Filter = "all" | "open" | "resolved";
type Thread = { conversation: ConversationSummary; messages: ChatMessage[] };

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const initial = (name: string) => (name.trim()[0] ?? "?").toUpperCase();

const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const dayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const fullFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** List dates: "14:05" today, "Tue" this week, "12 Nov" before that. */
function listDate(iso: string) {
  const date = new Date(iso);
  const days = (Date.now() - date.getTime()) / 86_400_000;
  if (new Date().toDateString() === date.toDateString()) return timeFormat.format(date);
  if (days < 6) return dayFormat.format(date);
  return dateFormat.format(date);
}

async function postForm(url: string, form: FormData) {
  let response: Response;
  try {
    response = await fetch(url, { method: "POST", body: form });
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }
  const data = (await response.json().catch(() => ({}))) as { error?: string } & Partial<Thread> & { message?: ChatMessage };
  if (response.status === 403) throw new Error("Your admin session has ended. Sign in again.");
  if (!response.ok) throw new Error(data.error ?? "The message could not be sent.");
  return data;
}

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  const data = (await response?.json().catch(() => ({}))) as { error?: string; conversation?: ConversationSummary } | undefined;
  if (!response?.ok) throw new Error(data?.error ?? "The conversation could not be updated.");
  return data ?? {};
}

export default function MessagesPage() {
  const toast = useToast();
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const typingTimer = useRef<number>();
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selectedId;

  const { socket, connected } = useLiveSocket(true);

  const loadList = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/messages", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as { conversations?: ConversationSummary[]; error?: string };
      if (!response.ok || !data.conversations) throw new Error(data.error ?? "Could not load messages.");
      setConversations(data.conversations);
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load messages.");
    }
  }, []);

  const loadThread = useCallback(async (id: string, quiet = false) => {
    if (!quiet) setThreadLoading(true);
    try {
      const response = await fetch(`/api/admin/messages/${id}`, { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as Partial<Thread> & { error?: string };
      if (!response.ok || !data.conversation || !data.messages) throw new Error(data.error ?? "Could not load this conversation.");
      if (selectedRef.current !== id) return;
      setThread({ conversation: data.conversation, messages: data.messages });
      setConversations((list) => list?.map((entry) => (entry.id === id ? data.conversation! : entry)) ?? list);
    } catch (error) {
      if (!quiet) toast(error instanceof Error ? error.message : "Could not load this conversation.", "error");
    } finally {
      if (!quiet) setThreadLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // Open the conversation named in the address (/admin/messages?c=<id>), e.g. from the Customers page.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("c");
    if (id && /^[a-f0-9]{24}$/i.test(id)) setSelectedId(id);
  }, []);

  useEffect(() => {
    setThread(null);
    setTypingUser(null);
    if (!selectedId) return;
    window.history.replaceState(null, "", `/admin/messages?c=${selectedId}`);
    loadThread(selectedId);
  }, [selectedId, loadThread]);

  // ---- live updates -------------------------------------------------------------

  const upsert = useCallback((summary: ConversationSummary) => {
    setConversations((list) => {
      const rest = (list ?? []).filter((entry) => entry.id !== summary.id);
      return [summary, ...rest].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
    });
  }, []);

  const onMessage = useCallback(
    (payload: { conversation: ConversationSummary; message: ChatMessage }) => {
      const open = selectedRef.current === payload.conversation.id;
      upsert(open ? { ...payload.conversation, unreadForAdmin: 0 } : payload.conversation);
      if (!open) return;
      setThread((current) =>
        current && !current.messages.some((message) => message.id === payload.message.id)
          ? { conversation: { ...payload.conversation, unreadForAdmin: 0 }, messages: [...current.messages, payload.message] }
          : current,
      );
      if (payload.message.from === "customer") {
        setTypingUser(null);
        // The admin is looking at it: mark it read.
        postJson(`/api/admin/messages/${payload.conversation.id}`, { action: "read" }).catch(() => {});
      }
    },
    [upsert],
  );
  const onConversation = useCallback(
    (payload: { conversation: ConversationSummary }) => {
      upsert(payload.conversation);
      setThread((current) =>
        current && current.conversation.id === payload.conversation.id ? { ...current, conversation: payload.conversation } : current,
      );
    },
    [upsert],
  );
  const onTyping = useCallback((payload: { userId?: string }) => {
    if (!payload.userId) return;
    setTypingUser(payload.userId);
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => setTypingUser(null), 4000);
  }, []);

  useSocketEvent(socket, SOCKET_EVENTS.message, onMessage);
  useSocketEvent(socket, SOCKET_EVENTS.conversation, onConversation);
  useSocketEvent(socket, SOCKET_EVENTS.typing, onTyping);

  // Catch up after a reconnect, and poll while live updates are down.
  useEffect(() => {
    if (!connected) return;
    loadList();
    if (selectedRef.current) loadThread(selectedRef.current, true);
  }, [connected, loadList, loadThread]);
  const refresh = useCallback(() => {
    loadList();
    if (selectedRef.current) loadThread(selectedRef.current, true);
  }, [loadList, loadThread]);
  useFallbackPolling(true, connected, refresh);

  // ---- list ------------------------------------------------------------------------------

  const counts = useMemo(() => {
    const list = conversations ?? [];
    return {
      open: list.filter((entry) => entry.status === "open").length,
      resolved: list.filter((entry) => entry.status === "resolved").length,
    };
  }, [conversations]);

  const term = query.trim().toLowerCase();
  const visible = (conversations ?? []).filter(
    (entry) =>
      (filter === "all" || entry.status === filter) &&
      `${entry.customerName} ${entry.customerEmail} ${entry.customerPhone ?? ""} ${entry.lastMessagePreview}`.toLowerCase().includes(term),
  );

  async function changeStatus(action: "resolve" | "reopen") {
    if (!thread) return;
    try {
      const data = await postJson(`/api/admin/messages/${thread.conversation.id}`, { action });
      if (data.conversation) onConversation({ conversation: data.conversation });
      toast(action === "resolve" ? "Marked as resolved." : "Conversation reopened.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "The conversation could not be updated.", "error");
    }
  }

  const tabs: { id: Filter; label: string; count?: number }[] = [
    { id: "all", label: "All" },
    { id: "open", label: "Open", count: counts.open },
    { id: "resolved", label: "Resolved" },
  ];

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0 font-serif text-[34px] font-medium leading-tight text-charcoal max-sm:text-[28px]">Messages</h1>
          <p className="m-0 mt-1.5 text-[14px] text-taupe">
            Customer conversations, live.{" "}
            <span className={connected ? "text-[#1f6b44]" : "text-[#9a6a1c]"}>
              <span aria-hidden="true">●</span> {connected ? "Connected" : "Reconnecting… (checking every 10 s)"}
            </span>
          </p>
        </div>
      </div>

      <div className="grid h-[calc(100dvh-12rem)] min-h-[560px] overflow-hidden rounded-2xl border border-[#eadfdc] bg-white shadow-[0_10px_30px_rgb(74_20_32_/_5%)] xl:grid-cols-[360px_minmax(0,1fr)]">
        {/* ---------------- conversation list ---------------- */}
        <section
          aria-label="Conversations"
          className={"flex min-h-0 flex-col border-[#eadfdc] xl:border-r " + (selectedId ? "max-xl:hidden" : "")}
        >
          <div className="flex items-center gap-2.5 p-4">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search conversations</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, email or message"
                className="h-11 w-full rounded-full border border-[#e3d8d5] bg-white pl-4 pr-10 text-[14px] outline-none placeholder:text-[#a99594] focus:border-burgundy"
              />
              <Search size={17} aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal" />
            </label>
            <button
              type="button"
              onClick={() => setNewOpen(true)}
              className="inline-flex h-11 flex-none items-center gap-2 rounded-full bg-charcoal px-4 text-[14px] font-semibold text-white transition-colors hover:bg-burgundy"
            >
              <PenSquare size={16} aria-hidden="true" /> New
            </button>
          </div>
          <div role="tablist" aria-label="Filter conversations" className="flex gap-2 px-4 pb-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filter === tab.id}
                onClick={() => setFilter(tab.id)}
                className={
                  "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[14px] transition-colors " +
                  (filter === tab.id ? "border-charcoal bg-charcoal text-white" : "border-[#e3d8d5] bg-white text-charcoal hover:border-charcoal")
                }
              >
                {tab.label}
                {tab.count ? <span className={filter === tab.id ? "text-white/80" : "text-taupe"}>{tab.count}</span> : null}
              </button>
            ))}
          </div>

          <ul className="m-0 min-h-0 flex-1 list-none overflow-y-auto border-t border-[#f1e8e5] p-0">
            {loadError && <li className="px-5 py-4 text-[14px] text-[#9b2c2c]">{loadError}</li>}
            {!conversations && !loadError && (
              <li className="flex items-center gap-2 px-5 py-6 text-[14px] text-taupe">
                <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Loading conversations…
              </li>
            )}
            {conversations && !visible.length && (
              <li className="px-5 py-10 text-center text-[14px] text-taupe">
                {conversations.length ? "No conversations match." : "No messages yet. Customers can write from the chat button in the shop."}
              </li>
            )}
            {visible.map((entry) => {
              const active = entry.id === selectedId;
              const unread = entry.unreadForAdmin > 0;
              return (
                <li key={entry.id} className="border-b border-[#f3ebe8]">
                  <button
                    type="button"
                    onClick={() => setSelectedId(entry.id)}
                    aria-current={active ? "true" : undefined}
                    className={"flex w-full gap-3 px-4 py-4 text-left transition-colors " + (active ? "bg-[#f6eeec]" : "hover:bg-[#fdfaf8]")}
                  >
                    <span className="relative flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#ece6e4] text-[15px] font-semibold text-charcoal">
                      {initial(entry.customerName)}
                      {unread && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-burgundy" aria-hidden="true" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span className={"truncate text-[15px] text-charcoal " + (unread ? "font-semibold" : "font-medium")}>{entry.customerName}</span>
                        <span className="flex-none text-[12px] text-taupe">Customer</span>
                        <span className="ml-auto flex-none text-[12px] text-taupe">{listDate(entry.lastMessageAt)}</span>
                      </span>
                      <span className={"mt-0.5 block truncate text-[14px] " + (unread ? "font-medium text-charcoal" : "text-taupe")}>
                        {typingUser === entry.userId ? <em className="text-burgundy">typing…</em> : (entry.lastMessageFrom === "admin" ? "You: " : "") + entry.lastMessagePreview}
                      </span>
                      <span className="mt-2 flex items-center gap-2">
                        <StatusPill status={entry.status} />
                        {unread && (
                          <span className="rounded-full bg-burgundy px-2 py-0.5 text-[11px] font-semibold text-white">
                            {entry.unreadForAdmin} new
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ---------------- thread ---------------- */}
        <section aria-label="Conversation" className={"flex min-h-0 flex-col bg-[#fcfafa] " + (selectedId ? "" : "max-xl:hidden")}>
          {!selectedId ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f6eeec] text-burgundy">
                <MessageSquare size={24} aria-hidden="true" />
              </span>
              <p className="m-0 mt-4 font-serif text-[24px] text-charcoal">Choose a conversation</p>
              <p className="m-0 mt-1 max-w-[340px] text-[14px] text-taupe">
                New customer messages appear on the left the moment they&apos;re sent.
              </p>
            </div>
          ) : !thread ? (
            <div className="flex flex-1 items-center justify-center gap-2 text-[14px] text-taupe">
              {threadLoading && <Loader2 size={18} className="animate-spin" aria-hidden="true" />} Loading…
            </div>
          ) : (
            <ThreadView
              thread={thread}
              typing={typingUser === thread.conversation.userId}
              onBack={() => {
                setSelectedId(null);
                window.history.replaceState(null, "", "/admin/messages");
              }}
              onStatus={changeStatus}
              onSent={(result) => onMessage(result)}
              socketTyping={() => socket?.emit(SOCKET_EVENTS.typing, { userId: thread.conversation.userId })}
            />
          )}
        </section>
      </div>

      <NewConversation
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onStarted={(result) => {
          setNewOpen(false);
          upsert(result.conversation);
          setSelectedId(result.conversation.id);
        }}
      />
    </>
  );
}

function StatusPill({ status }: { status: ConversationSummary["status"] }) {
  return status === "open" ? (
    <span className="rounded-full bg-[#fdf3e2] px-2.5 py-0.5 text-[12px] font-medium text-[#9a5b0f]">Open</span>
  ) : (
    <span className="rounded-full bg-[#e8f4ec] px-2.5 py-0.5 text-[12px] font-medium text-[#1f6b44]">Resolved</span>
  );
}

function ThreadView({
  thread,
  typing,
  onBack,
  onStatus,
  onSent,
  socketTyping,
}: {
  thread: Thread;
  typing: boolean;
  onBack: () => void;
  onStatus: (action: "resolve" | "reopen") => void;
  onSent: (result: { conversation: ConversationSummary; message: ChatMessage }) => void;
  socketTyping: () => void;
}) {
  const { conversation, messages } = thread;
  const scroller = useRef<HTMLDivElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, typing]);

  return (
    <>
      <header className="flex flex-wrap items-center gap-3 border-b border-[#eadfdc] bg-white px-4 py-3 sm:px-5">
        <button type="button" onClick={onBack} aria-label="Back to conversations" className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#f6eeec] xl:hidden">
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#ece6e4] text-[15px] font-semibold text-charcoal">
          {initial(conversation.customerName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 flex flex-wrap items-center gap-2">
            <span className="truncate text-[17px] font-semibold text-charcoal">{conversation.customerName}</span>
            <span className="rounded-full bg-[#f1ecea] px-2 py-0.5 text-[12px] text-[#5b4c4c]">Customer</span>
            <StatusPill status={conversation.status} />
          </p>
          <p className="m-0 mt-0.5 truncate text-[13px] text-taupe">
            {conversation.customerEmail}
            {conversation.customerPhone ? ` · ${conversation.customerPhone}` : ""} ·{" "}
            <Link href={`/admin/customers?q=${encodeURIComponent(conversation.customerEmail)}`} className="font-medium text-burgundy hover:underline">
              View customer
            </Link>
          </p>
        </div>
        {conversation.status === "open" ? (
          <button
            type="button"
            onClick={() => onStatus("resolve")}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-charcoal px-4 text-[14px] font-semibold text-white transition-colors hover:bg-burgundy"
          >
            <CheckCircle2 size={17} aria-hidden="true" /> Mark resolved
          </button>
        ) : (
          <Button onClick={() => onStatus("reopen")}>
            <RotateCcw size={15} aria-hidden="true" /> Reopen
          </Button>
        )}
      </header>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite">
        {messages.map((message, index) => {
          const previous = messages[index - 1];
          const newDay = !previous || new Date(previous.createdAt).toDateString() !== new Date(message.createdAt).toDateString();
          return (
            <div key={message.id}>
              {newDay && (
                <p className="my-4 text-center text-[12px] text-taupe">
                  {new Date(message.createdAt).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              )}
              <Bubble message={message} name={conversation.customerName} />
            </div>
          );
        })}
        {typing && (
          <p className="m-0 mt-2 flex items-center gap-2 text-[13px] text-taupe">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ece6e4] text-[12px] font-semibold text-charcoal">
              {initial(conversation.customerName)}
            </span>
            {conversation.customerName.split(" ")[0]} is typing…
          </p>
        )}
      </div>

      <Composer
        key={conversation.id}
        placeholder={`Reply to ${conversation.customerName} as the Dirndl Wear team`}
        url={`/api/admin/messages/${conversation.id}`}
        onSent={onSent}
        onTyping={socketTyping}
      />
    </>
  );
}

function Bubble({ message, name }: { message: ChatMessage; name: string }) {
  const mine = message.from === "admin";
  return (
    <div className={"mb-4 flex items-end gap-2.5 " + (mine ? "justify-end" : "")}>
      {!mine && (
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#ece6e4] text-[12px] font-semibold text-charcoal" aria-hidden="true">
          {initial(name)}
        </span>
      )}
      <div className={"flex max-w-[78%] flex-col " + (mine ? "items-end" : "items-start")}>
        <div
          className={
            "overflow-hidden rounded-2xl text-[15px] leading-relaxed " +
            (mine
              ? "rounded-br-md bg-burgundy text-white"
              : "rounded-bl-md border border-[#eadfdc] bg-white text-charcoal shadow-[0_2px_6px_rgb(33_28_29_/_4%)]")
          }
        >
          {message.image && (
            <a href={message.image} target="_blank" rel="noopener noreferrer" className="block">
              <img src={message.image} alt="Photo sent in the chat" className="max-h-[320px] w-full object-cover" />
            </a>
          )}
          {message.text && <p className="m-0 whitespace-pre-wrap break-words px-4 py-2.5">{message.text}</p>}
        </div>
        <span className="mt-1 px-1 text-[12px] text-taupe">
          {mine ? `${message.authorName} · ` : ""}
          {fullFormat.format(new Date(message.createdAt))}
        </span>
      </div>
    </div>
  );
}

/** Reply box: text, optional photo, Enter to send (Shift+Enter for a new line). */
function Composer({
  placeholder,
  url,
  onSent,
  onTyping,
  extraFields,
}: {
  placeholder: string;
  url: string;
  onSent: (result: { conversation: ConversationSummary; message: ChatMessage }) => void;
  onTyping?: () => void;
  extraFields?: Record<string, string>;
}) {
  const toast = useToast();
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
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
    for (const [key, value] of Object.entries(extraFields ?? {})) form.set(key, value);
    setSending(true);
    try {
      const result = await postForm(url, form);
      if (result.conversation && result.message) onSent({ conversation: result.conversation, message: result.message });
      setText("");
      setPhoto(null);
    } catch (error) {
      toast(error instanceof Error ? error.message : "The message could not be sent.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border-t border-[#eadfdc] bg-white px-4 py-3 sm:px-5">
      {preview && (
        <div className="relative mb-3 inline-block">
          <img src={preview} alt="Photo to send" className="h-20 w-20 rounded-xl object-cover" />
          <button
            type="button"
            onClick={() => setPhoto(null)}
            aria-label="Remove photo"
            className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-charcoal text-white"
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      )}
      <form
        className="flex items-end gap-2.5"
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
            if (file.size > MAX_PHOTO_BYTES) return toast("Photos must be 5 MB or smaller.", "error");
            setPhoto(file);
          }}
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          aria-label="Add a photo"
          className="grid h-12 w-12 flex-none place-items-center rounded-full text-taupe transition-colors hover:bg-[#f6eeec] hover:text-burgundy"
        >
          <ImagePlus size={21} aria-hidden="true" />
        </button>
        <label className="min-w-0 flex-1">
          <span className="sr-only">Message</span>
          <textarea
            value={text}
            rows={1}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder={placeholder}
            onChange={(event) => {
              setText(event.target.value);
              onTyping?.();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            className="block max-h-40 min-h-12 w-full resize-none rounded-3xl border border-[#e3d8d5] px-5 py-3 text-[15px] leading-6 outline-none [field-sizing:content] placeholder:text-[#a99594] focus:border-burgundy"
          />
        </label>
        <button
          type="submit"
          disabled={sending || (!text.trim() && !photo)}
          aria-label="Send"
          className="grid h-12 w-12 flex-none place-items-center rounded-full bg-burgundy text-white transition-colors hover:bg-burgundy-dark disabled:bg-[#e3d8d5]"
        >
          {sending ? <Loader2 size={19} className="animate-spin" aria-hidden="true" /> : <SendHorizontal size={19} aria-hidden="true" />}
        </button>
      </form>
    </div>
  );
}

/** "New": pick a customer and write the first message. */
function NewConversation({
  open,
  onClose,
  onStarted,
}: {
  open: boolean;
  onClose: () => void;
  onStarted: (result: { conversation: ConversationSummary; message: ChatMessage }) => void;
}) {
  const [accounts, setAccounts] = useState<AdminAccount[] | null>(null);
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<AdminAccount | null>(null);

  useEffect(() => {
    if (!open) return;
    setChosen(null);
    setQuery("");
    fetch("/api/admin/customers", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { accounts?: AdminAccount[] }) => setAccounts((data.accounts ?? []).filter((account) => account.role !== "admin")))
      .catch(() => setAccounts([]));
  }, [open]);

  const term = query.trim().toLowerCase();
  const matches = (accounts ?? []).filter((account) => `${account.name} ${account.email}`.toLowerCase().includes(term)).slice(0, 30);

  return (
    <Drawer open={open} onClose={onClose} title="New message" subtitle={chosen ? `To ${chosen.name} · ${chosen.email}` : "Choose a customer"}>
      {!chosen ? (
        <div className="grid gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search customers by name or email"
            className="h-11 w-full rounded-xl border border-[#e3d8d5] px-4 text-[14px] outline-none focus:border-burgundy"
          />
          <ul className="m-0 list-none divide-y divide-[#f3ebe8] rounded-xl border border-[#eadfdc] bg-white p-0">
            {!accounts && <li className="px-4 py-3 text-[14px] text-taupe">Loading customers…</li>}
            {accounts && !matches.length && <li className="px-4 py-3 text-[14px] text-taupe">No customers match.</li>}
            {matches.map((account) => (
              <li key={account.id}>
                <button type="button" onClick={() => setChosen(account)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#fdfaf8]">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#ece6e4] text-[13px] font-semibold">
                    {initial(account.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-charcoal">{account.name}</span>
                    <span className="block truncate text-[12px] text-taupe">{account.email}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="grid gap-3">
          <button type="button" onClick={() => setChosen(null)} className="justify-self-start text-[13px] font-medium text-burgundy hover:underline">
            ← Choose someone else
          </button>
          <div className="overflow-hidden rounded-2xl border border-[#eadfdc]">
            <Composer
              placeholder={`Message ${chosen.name} as the Dirndl Wear team`}
              url="/api/admin/messages"
              extraFields={{ userId: chosen.id }}
              onSent={onStarted}
            />
          </div>
        </div>
      )}
    </Drawer>
  );
}

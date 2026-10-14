import { randomBytes } from "node:crypto";
import type { Language, WindowResult } from "./domain.js";

export type Binding = { user: string; guild: string; channel: string; application: string };
type Session = Binding & {
  language: Language;
  expires: number;
  result?: WindowResult;
  message?: string;
};
export class Store {
  readonly sessions = new Map<string, Session>();
  readonly users = new Map<string, number>();
  readonly channels = new Map<string, number>();
  constructor(readonly now: () => number = Date.now) {}
  prune(): void {
    const now = this.now();
    for (const [key, value] of this.sessions) if (value.expires <= now) this.sessions.delete(key);
    for (const map of [this.users, this.channels])
      for (const [key, until] of map) if (until <= now) map.delete(key);
  }
  open(binding: Binding, language: Language): string | undefined {
    this.prune();
    const userKey = `${binding.guild}:${binding.user}`;
    if (this.users.has(userKey) || this.users.size >= 500) return;
    for (const [id, session] of this.sessions)
      if (session.guild === binding.guild && session.user === binding.user)
        this.sessions.delete(id);
    if (this.sessions.size >= 100) return;
    const id = randomBytes(18).toString("hex");
    this.sessions.set(id, { ...binding, language, expires: this.now() + 300_000 });
    this.users.set(userKey, this.now() + 5000);
    return id;
  }
  claim(
    id: string,
    binding: Binding,
    stage: "form" | "preview",
    message?: string,
  ): Session | undefined {
    this.prune();
    const session = this.sessions.get(id);
    if (
      !session ||
      Object.keys(binding).some(
        (key) => session[key as keyof Binding] !== binding[key as keyof Binding],
      )
    )
      return;
    if (
      stage === "form"
        ? session.result !== undefined
        : !session.result || !session.message || session.message !== message
    )
      return;
    this.sessions.delete(id); // Consume synchronously, before any network await.
    return session;
  }
  preview(id: string, session: Session, result: WindowResult): void {
    this.prune();
    if (this.sessions.size >= 100) throw new Error("capacity");
    this.sessions.set(id, { ...session, result, expires: this.now() + 300_000 });
  }
  bind(id: string, message: string): void {
    const session = this.sessions.get(id);
    if (session?.result) session.message = message;
  }
  reserveChannel(binding: Binding): boolean {
    this.prune();
    const key = `${binding.guild}:${binding.channel}`;
    if (this.channels.has(key) || this.channels.size >= 500) return false;
    this.channels.set(key, this.now() + 60_000);
    return true;
  }
}

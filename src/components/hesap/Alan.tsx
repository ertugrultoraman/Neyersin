import type { ReactNode } from "react";

/** Hesap formlarında tekrar eden alan görünümü — tek yerden yönetilir. */
const TEMEL =
  "w-full rounded-2xl border border-kahve-900/12 bg-white px-4 py-3 text-[0.9375rem] " +
  "font-medium text-kahve-900 transition-[border-color] duration-300 " +
  "focus:border-sari-500/60 focus:ring-2 focus:ring-sari-500/40 focus:outline-none";

export function Alan({
  etiket,
  ipucu,
  children,
}: {
  etiket: string;
  ipucu?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold tracking-wide text-kahve-700 uppercase">
        {etiket}
      </span>
      {children}
      {ipucu && <span className="mt-1.5 block text-xs text-kahve-500">{ipucu}</span>}
    </label>
  );
}

export function Girdi(p: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={`${TEMEL} ${p.className ?? ""}`} />;
}

export function MetinAlani(p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={`${TEMEL} min-h-32 resize-y leading-relaxed ${p.className ?? ""}`} />;
}

export function Secim(p: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={`${TEMEL} tiklanabilir ${p.className ?? ""}`} />;
}

export function Uyari({ tur, children }: { tur: "hata" | "basari"; children: ReactNode }) {
  return (
    <p
      role="alert"
      className={
        tur === "hata"
          ? "rounded-2xl bg-domates/10 px-4 py-3 text-sm font-semibold text-domates-koyu"
          : "rounded-2xl bg-nane/12 px-4 py-3 text-sm font-semibold text-nane-koyu"
      }
    >
      {children}
    </p>
  );
}

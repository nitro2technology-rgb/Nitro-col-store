"use client";

import { useRef, useState } from "react";

/**
 * Botón visible para elegir archivos (el campo nativo queda sin estilo por el reseteo de Tailwind y parece solo texto).
 * Muestra los nombres elegidos. Con `form` se asocia a un formulario que esté en otra parte de la página.
 */
export function FilePicker({
  name,
  accept,
  multiple,
  form,
  text = "Elegir archivo",
}: {
  name: string;
  accept: string;
  multiple?: boolean;
  form?: string;
  text?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [names, setNames] = useState<string[]>([]);
  return (
    <span className="mt-1 flex flex-wrap items-center gap-3">
      <input
        ref={ref}
        type="file"
        name={name}
        accept={accept}
        multiple={multiple}
        form={form}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => setNames(Array.from(e.currentTarget.files ?? []).map((f) => f.name))}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="inline-flex items-center gap-2 rounded-[10px] border border-[#5b4fe0] bg-white px-4 py-2 text-[14px] font-semibold text-[#5b4fe0] hover:bg-[#5b4fe0] hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 16V4m0 0 4 4m-4-4L8 8M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
        </svg>
        {names.length ? "Cambiar" : text}
      </button>
      <span className="min-w-0 max-w-full truncate text-[13px] font-normal text-[#6b6b80]">
        {names.length === 0 ? "Ningún archivo elegido" : names.length === 1 ? names[0] : `${names.length} archivos: ${names.join(", ")}`}
      </span>
    </span>
  );
}

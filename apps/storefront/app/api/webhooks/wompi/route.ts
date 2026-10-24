// Wompi avisa aquí cada cambio de una transacción. Es la fuente de verdad del pago: se verifica la firma
// del evento y se aplica de forma idempotente (Wompi reintenta si no recibe 200).
import { applyTransaction, verifyEvent, type WompiEvent } from "@/lib/wompi";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let event: WompiEvent;
  try {
    event = await req.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (!verifyEvent(event)) {
    console.error("[wompi] Evento con firma inválida");
    return Response.json({ ok: false }, { status: 401 });
  }
  if (event.event === "transaction.updated" && event.data.transaction) {
    try {
      await applyTransaction(event.data.transaction);
    } catch (error) {
      console.error("[wompi] No se pudo aplicar el evento:", error);
      return Response.json({ ok: false }, { status: 500 }); // Wompi reintenta
    }
  }
  return Response.json({ ok: true });
}

import { field, label } from "../ui";

/** Campos de un color (los usa también «Agregar un color» en la ficha). */
export function ColorFields() {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className={label}>
        Nombre del color
        <input name="label" required maxLength={60} placeholder="Ej. Negro" className={`${field} mt-1`} />
      </label>
      <label className={label}>
        Precio normal
        <input name="price" required inputMode="numeric" placeholder="65000" className={`${field} mt-1`} />
      </label>
      <label className={label}>
        Precio de oferta <span className="font-normal text-[#a0a0b2]">— opcional</span>
        <input name="offer" inputMode="numeric" className={`${field} mt-1`} />
      </label>
      <label className={label}>
        Costo por unidad <span className="font-normal text-[#a0a0b2]">— para la ganancia</span>
        <input name="cost" inputMode="numeric" className={`${field} mt-1`} />
      </label>
      <label className={label}>
        Unidades en stock
        <input name="stock" inputMode="numeric" defaultValue="0" className={`${field} mt-1`} />
      </label>
      <label className={label}>
        Aviso de poco stock
        <input name="lowAt" inputMode="numeric" defaultValue="3" className={`${field} mt-1`} />
      </label>
      <label className={label}>
        Peso (gramos)
        <input name="weight" inputMode="numeric" defaultValue="200" className={`${field} mt-1`} />
      </label>
    </div>
  );
}

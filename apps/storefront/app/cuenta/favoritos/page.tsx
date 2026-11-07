import type { Metadata } from "next";
import { FavoritesList } from "./favorites-list";

export const metadata: Metadata = { title: "Mis favoritos", robots: { index: false } };

export default function FavoritesPage() {
  return (
    <>
      <h1 className="text-[clamp(30px,4vw,44px)]">Mis favoritos</h1>
      <p className="mt-2 text-[16px] text-muted">Cada corazón guarda un modelo en un color. Se guardan en tu cuenta y los ves en cualquier dispositivo donde inicies sesión.</p>
      <FavoritesList />
    </>
  );
}

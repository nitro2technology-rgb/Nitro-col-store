"""Genera miniaturas (-480 y -960) junto a cada foto WebP de public/products.

El loader de imágenes (apps/storefront/lib/image-loader.ts) las sirve como archivos
estáticos: así el servidor no redimensiona nada (Render gratis no lo aguanta).
Repetible: salta las que ya existen y están al día. Requiere Pillow.
"""
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent / "apps/storefront/public/products"
ANCHOS = (480, 960)

hechas = saltadas = 0
for foto in sorted(RAIZ.rglob("*.webp")):
    if foto.stem.rsplit("-", 1)[-1] in {str(a) for a in ANCHOS}:
        continue  # ya es una miniatura
    with Image.open(foto) as im:
        im.load()
        for ancho in ANCHOS:
            destino = foto.with_name(f"{foto.stem}-{ancho}.webp")
            if destino.exists() and destino.stat().st_mtime >= foto.stat().st_mtime:
                saltadas += 1
                continue
            if im.width <= ancho:
                im.save(destino, "WEBP", quality=82, method=6)
            else:
                alto = round(im.height * ancho / im.width)
                im.resize((ancho, alto), Image.LANCZOS).save(destino, "WEBP", quality=82, method=6)
            hechas += 1
print(f"miniaturas creadas: {hechas}, ya existían: {saltadas}")

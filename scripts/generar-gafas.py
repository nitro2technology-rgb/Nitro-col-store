# Convierte las fotos de gafas de Catálogo/Clothing/Gafas a WebP (1080 px, calidad 88), aplica el fondo gris de
# Impact a las fotos de producto y regenera apps/storefront/lib/gafas-data.ts.
# Uso (desde la raíz del repositorio):  python scripts/generar-gafas.py     (requiere Pillow)
import os,re,json,glob,unicodedata
from PIL import Image, ImageChops
SRC="Catálogo/Clothing/Gafas"; OUT="apps/storefront/public/products/gafas"
def slug(s):
    s=unicodedata.normalize("NFD",s.lower()); s="".join(c for c in s if unicodedata.category(c)!="Mn")
    return re.sub(r"[^a-z0-9]+","-",s).strip("-")
def num(f): return int(re.sub(r"\D","",os.path.basename(f)) or 0)
special={"Impact":[("Vino lente naranja",[11,12]),("Negras lente espejo",[13,14]),("Negras lente azul",[15,16]),("Negras lente gris",[17,18])],
 "X-treme":[("Negras lente gris",[1,2]),("Verde ne\u00f3n",[3,4]),("Rojas",[5,6]),("Blancas",[7,8]),("Negras lente azul",[9,10])]}
SW={"animal":"#a0652d","beige":"#d9c7a8","blancas":"#f3f4f6","negras":"#111827","amarillas":"#f5d34a","rojas":"#c0392b","rosada":"#f2b4c6","rosadas":"#f2b4c6","cafes":"#6b4423","azul":"#3b6fb6","azules":"#3b6fb6","grises":"#9ca3af","cebra":"#e5e7eb","ghost":"#dbeafe","habanas":"#8b5a2b","lente":"#4ade80","vino":"#7f1d1d","verde":"#a3e635"}
models=[]
for m in sorted(os.listdir(SRC)):
    mslug=slug(m); variants=[]; loose=[]
    if m in special:
        for label,ns in special[m]: variants.append((label,[f"{SRC}/{m}/{n}.jpg" for n in ns]))
    else:
        for c in sorted(os.listdir(f"{SRC}/{m}")):
            p=f"{SRC}/{m}/{c}"
            if os.path.isfile(p): loose.append(p)
            else: variants.append((c[0].upper()+c[1:],sorted(glob.glob(f"{p}/*.jpg"),key=num)))
    def conv(f,name,card=False):
        d=f"{OUT}/{mslug}"; os.makedirs(d,exist_ok=True)
        im=Image.open(f).convert("RGB"); im.thumbnail((1080,1350))
        if card and m!="Impact":
            # Fondo gris de Impact (248,248,246) para todas las fotos de producto: multiplica el blanco puro.
            im=ImageChops.multiply(im,Image.new("RGB",im.size,(248,248,246)))
        im.save(f"{d}/{name}.webp","WEBP",quality=88)
        return f"/products/gafas/{mslug}/{name}.webp"
    # Fotos sueltas en la carpeta del modelo: se asignan al color al que corresponden.
    loose_to={"Vintage":{55:"Negras",57:"Blancas"}}.get(m,{})
    mv=[]
    for label,files in variants:
        files=files+[f for f in loose if loose_to.get(num(f))==label]
        cslug=slug(label)
        sq=[f for f in files if Image.open(f).size[0]==Image.open(f).size[1]]
        card=sq or files; rest=[f for f in files if f not in card]
        mv.append({"label":label,"slug":cslug,"swatch":SW.get(slug(label).split("-")[0]),"images":[conv(f,f"{cslug}-{i+1}",True) for i,f in enumerate(card)],"gallery":[conv(f,f"{cslug}-foto-{i+1}") for i,f in enumerate(rest)]})
    models.append({"name":m,"slug":mslug,"variants":mv})
out = """// Fotos de las gafas, generadas por scripts/generar-gafas.py desde Catálogo/Clothing/Gafas (carpeta modelo / color).
// Por color: `images` = fotos de producto (carrusel de la tarjeta); `gallery` = fotos con modelo y extras.
// Los colores de Impact y X-treme se agruparon por parejas de fotos y sus nombres son provisionales.
export type GafasModel = {
  name: string;
  slug: string;
  variants: { label: string; slug: string; swatch?: string; images: string[]; gallery: string[] }[];
};

export const gafasModels: GafasModel[] = """ + json.dumps(models, ensure_ascii=False, indent=2) + ";\n"
open("apps/storefront/lib/gafas-data.ts", "w", encoding="utf8").write(out)
print(len(models), "modelos,", sum(len(m["variants"]) for m in models), "colores")

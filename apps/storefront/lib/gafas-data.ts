// Fotos de las gafas, generadas por scripts/generar-gafas.py desde Catálogo/Clothing/Gafas (carpeta modelo / color).
// Por color: `images` = fotos de producto (carrusel de la tarjeta); `gallery` = fotos con modelo y extras.
// Los colores de Impact y X-treme se agruparon por parejas de fotos y sus nombres son provisionales.
export type GafasModel = {
  name: string;
  slug: string;
  variants: { label: string; slug: string; swatch?: string; images: string[]; gallery: string[] }[];
};

export const gafasModels: GafasModel[] = [
  {
    "name": "Barcelona",
    "slug": "barcelona",
    "variants": [
      {
        "label": "Animal print",
        "slug": "animal-print",
        "swatch": "#a0652d",
        "images": [
          "/products/gafas/barcelona/animal-print-1.webp"
        ],
        "gallery": [
          "/products/gafas/barcelona/animal-print-foto-1.webp",
          "/products/gafas/barcelona/animal-print-foto-2.webp"
        ]
      },
      {
        "label": "Beige",
        "slug": "beige",
        "swatch": "#d9c7a8",
        "images": [
          "/products/gafas/barcelona/beige-1.webp"
        ],
        "gallery": [
          "/products/gafas/barcelona/beige-foto-1.webp",
          "/products/gafas/barcelona/beige-foto-2.webp",
          "/products/gafas/barcelona/beige-foto-3.webp",
          "/products/gafas/barcelona/beige-foto-4.webp",
          "/products/gafas/barcelona/beige-foto-5.webp"
        ]
      },
      {
        "label": "Blancas",
        "slug": "blancas",
        "swatch": "#f3f4f6",
        "images": [
          "/products/gafas/barcelona/blancas-1.webp"
        ],
        "gallery": [
          "/products/gafas/barcelona/blancas-foto-1.webp",
          "/products/gafas/barcelona/blancas-foto-2.webp",
          "/products/gafas/barcelona/blancas-foto-3.webp",
          "/products/gafas/barcelona/blancas-foto-4.webp"
        ]
      },
      {
        "label": "Negras",
        "slug": "negras",
        "swatch": "#111827",
        "images": [
          "/products/gafas/barcelona/negras-1.webp"
        ],
        "gallery": []
      }
    ]
  },
  {
    "name": "Berlin",
    "slug": "berlin",
    "variants": [
      {
        "label": "Amarillas",
        "slug": "amarillas",
        "swatch": "#f5d34a",
        "images": [
          "/products/gafas/berlin/amarillas-1.webp"
        ],
        "gallery": [
          "/products/gafas/berlin/amarillas-foto-1.webp"
        ]
      },
      {
        "label": "Lente verde",
        "slug": "lente-verde",
        "swatch": "#4ade80",
        "images": [
          "/products/gafas/berlin/lente-verde-1.webp"
        ],
        "gallery": []
      },
      {
        "label": "Negras",
        "slug": "negras",
        "swatch": "#111827",
        "images": [
          "/products/gafas/berlin/negras-1.webp"
        ],
        "gallery": []
      },
      {
        "label": "Rojas",
        "slug": "rojas",
        "swatch": "#c0392b",
        "images": [
          "/products/gafas/berlin/rojas-1.webp"
        ],
        "gallery": []
      },
      {
        "label": "Rosada",
        "slug": "rosada",
        "swatch": "#f2b4c6",
        "images": [
          "/products/gafas/berlin/rosada-1.webp"
        ],
        "gallery": []
      }
    ]
  },
  {
    "name": "Brooklyn",
    "slug": "brooklyn",
    "variants": [
      {
        "label": "Grises",
        "slug": "grises",
        "swatch": "#9ca3af",
        "images": [
          "/products/gafas/brooklyn/grises-1.webp"
        ],
        "gallery": [
          "/products/gafas/brooklyn/grises-foto-1.webp",
          "/products/gafas/brooklyn/grises-foto-2.webp"
        ]
      },
      {
        "label": "Grises lente negro",
        "slug": "grises-lente-negro",
        "swatch": "#9ca3af",
        "images": [
          "/products/gafas/brooklyn/grises-lente-negro-1.webp"
        ],
        "gallery": []
      },
      {
        "label": "Negras",
        "slug": "negras",
        "swatch": "#111827",
        "images": [
          "/products/gafas/brooklyn/negras-1.webp"
        ],
        "gallery": []
      },
      {
        "label": "Negras lente amarillo",
        "slug": "negras-lente-amarillo",
        "swatch": "#111827",
        "images": [
          "/products/gafas/brooklyn/negras-lente-amarillo-1.webp"
        ],
        "gallery": [
          "/products/gafas/brooklyn/negras-lente-amarillo-foto-1.webp"
        ]
      },
      {
        "label": "Negras lente morado",
        "slug": "negras-lente-morado",
        "swatch": "#111827",
        "images": [
          "/products/gafas/brooklyn/negras-lente-morado-1.webp"
        ],
        "gallery": [
          "/products/gafas/brooklyn/negras-lente-morado-foto-1.webp",
          "/products/gafas/brooklyn/negras-lente-morado-foto-2.webp"
        ]
      }
    ]
  },
  {
    "name": "Cat",
    "slug": "cat",
    "variants": [
      {
        "label": "Blancas",
        "slug": "blancas",
        "swatch": "#f3f4f6",
        "images": [
          "/products/gafas/cat/blancas-1.webp"
        ],
        "gallery": []
      },
      {
        "label": "Negras",
        "slug": "negras",
        "swatch": "#111827",
        "images": [
          "/products/gafas/cat/negras-1.webp"
        ],
        "gallery": [
          "/products/gafas/cat/negras-foto-1.webp"
        ]
      },
      {
        "label": "Rojas",
        "slug": "rojas",
        "swatch": "#c0392b",
        "images": [
          "/products/gafas/cat/rojas-1.webp"
        ],
        "gallery": [
          "/products/gafas/cat/rojas-foto-1.webp",
          "/products/gafas/cat/rojas-foto-2.webp",
          "/products/gafas/cat/rojas-foto-3.webp",
          "/products/gafas/cat/rojas-foto-4.webp"
        ]
      }
    ]
  },
  {
    "name": "Europe",
    "slug": "europe",
    "variants": [
      {
        "label": "Azules",
        "slug": "azules",
        "swatch": "#3b6fb6",
        "images": [
          "/products/gafas/europe/azules-1.webp"
        ],
        "gallery": [
          "/products/gafas/europe/azules-foto-1.webp",
          "/products/gafas/europe/azules-foto-2.webp",
          "/products/gafas/europe/azules-foto-3.webp",
          "/products/gafas/europe/azules-foto-4.webp",
          "/products/gafas/europe/azules-foto-5.webp",
          "/products/gafas/europe/azules-foto-6.webp"
        ]
      },
      {
        "label": "Blancas",
        "slug": "blancas",
        "swatch": "#f3f4f6",
        "images": [
          "/products/gafas/europe/blancas-1.webp"
        ],
        "gallery": [
          "/products/gafas/europe/blancas-foto-1.webp"
        ]
      },
      {
        "label": "Negras",
        "slug": "negras",
        "swatch": "#111827",
        "images": [
          "/products/gafas/europe/negras-1.webp"
        ],
        "gallery": [
          "/products/gafas/europe/negras-foto-1.webp",
          "/products/gafas/europe/negras-foto-2.webp",
          "/products/gafas/europe/negras-foto-3.webp",
          "/products/gafas/europe/negras-foto-4.webp",
          "/products/gafas/europe/negras-foto-5.webp",
          "/products/gafas/europe/negras-foto-6.webp"
        ]
      }
    ]
  },
  {
    "name": "Impact",
    "slug": "impact",
    "variants": [
      {
        "label": "Vino lente naranja",
        "slug": "vino-lente-naranja",
        "swatch": "#7f1d1d",
        "images": [
          "/products/gafas/impact/vino-lente-naranja-1.webp",
          "/products/gafas/impact/vino-lente-naranja-2.webp"
        ],
        "gallery": []
      },
      {
        "label": "Negras lente espejo",
        "slug": "negras-lente-espejo",
        "swatch": "#111827",
        "images": [
          "/products/gafas/impact/negras-lente-espejo-1.webp",
          "/products/gafas/impact/negras-lente-espejo-2.webp"
        ],
        "gallery": []
      },
      {
        "label": "Negras lente azul",
        "slug": "negras-lente-azul",
        "swatch": "#111827",
        "images": [
          "/products/gafas/impact/negras-lente-azul-1.webp",
          "/products/gafas/impact/negras-lente-azul-2.webp"
        ],
        "gallery": []
      },
      {
        "label": "Negras lente gris",
        "slug": "negras-lente-gris",
        "swatch": "#111827",
        "images": [
          "/products/gafas/impact/negras-lente-gris-1.webp",
          "/products/gafas/impact/negras-lente-gris-2.webp"
        ],
        "gallery": []
      }
    ]
  },
  {
    "name": "Malibu",
    "slug": "malibu",
    "variants": [
      {
        "label": "Cafes",
        "slug": "cafes",
        "swatch": "#6b4423",
        "images": [
          "/products/gafas/malibu/cafes-1.webp"
        ],
        "gallery": [
          "/products/gafas/malibu/cafes-foto-1.webp",
          "/products/gafas/malibu/cafes-foto-2.webp",
          "/products/gafas/malibu/cafes-foto-3.webp"
        ]
      },
      {
        "label": "Cafes lente claro",
        "slug": "cafes-lente-claro",
        "swatch": "#6b4423",
        "images": [
          "/products/gafas/malibu/cafes-lente-claro-1.webp"
        ],
        "gallery": []
      },
      {
        "label": "Negras",
        "slug": "negras",
        "swatch": "#111827",
        "images": [
          "/products/gafas/malibu/negras-1.webp"
        ],
        "gallery": []
      },
      {
        "label": "Negras lente gris",
        "slug": "negras-lente-gris",
        "swatch": "#111827",
        "images": [
          "/products/gafas/malibu/negras-lente-gris-1.webp"
        ],
        "gallery": []
      }
    ]
  },
  {
    "name": "Miami",
    "slug": "miami",
    "variants": [
      {
        "label": "Animal print",
        "slug": "animal-print",
        "swatch": "#a0652d",
        "images": [
          "/products/gafas/miami/animal-print-1.webp"
        ],
        "gallery": [
          "/products/gafas/miami/animal-print-foto-1.webp"
        ]
      },
      {
        "label": "Blancas",
        "slug": "blancas",
        "swatch": "#f3f4f6",
        "images": [
          "/products/gafas/miami/blancas-1.webp"
        ],
        "gallery": []
      },
      {
        "label": "Cafes claras",
        "slug": "cafes-claras",
        "swatch": "#6b4423",
        "images": [
          "/products/gafas/miami/cafes-claras-1.webp"
        ],
        "gallery": []
      },
      {
        "label": "Cebra",
        "slug": "cebra",
        "swatch": "#e5e7eb",
        "images": [
          "/products/gafas/miami/cebra-1.webp"
        ],
        "gallery": [
          "/products/gafas/miami/cebra-foto-1.webp"
        ]
      },
      {
        "label": "Negras",
        "slug": "negras",
        "swatch": "#111827",
        "images": [
          "/products/gafas/miami/negras-1.webp"
        ],
        "gallery": [
          "/products/gafas/miami/negras-foto-1.webp"
        ]
      },
      {
        "label": "Rosadas",
        "slug": "rosadas",
        "swatch": "#f2b4c6",
        "images": [
          "/products/gafas/miami/rosadas-1.webp"
        ],
        "gallery": [
          "/products/gafas/miami/rosadas-foto-1.webp",
          "/products/gafas/miami/rosadas-foto-2.webp",
          "/products/gafas/miami/rosadas-foto-3.webp"
        ]
      }
    ]
  },
  {
    "name": "Milan",
    "slug": "milan",
    "variants": [
      {
        "label": "Negras",
        "slug": "negras",
        "swatch": "#111827",
        "images": [
          "/products/gafas/milan/negras-1.webp"
        ],
        "gallery": []
      },
      {
        "label": "Negras con lente cafe",
        "slug": "negras-con-lente-cafe",
        "swatch": "#111827",
        "images": [
          "/products/gafas/milan/negras-con-lente-cafe-1.webp"
        ],
        "gallery": [
          "/products/gafas/milan/negras-con-lente-cafe-foto-1.webp",
          "/products/gafas/milan/negras-con-lente-cafe-foto-2.webp"
        ]
      },
      {
        "label": "Negras dorado",
        "slug": "negras-dorado",
        "swatch": "#111827",
        "images": [
          "/products/gafas/milan/negras-dorado-1.webp"
        ],
        "gallery": []
      }
    ]
  },
  {
    "name": "Moon",
    "slug": "moon",
    "variants": [
      {
        "label": "Blancas lente azul",
        "slug": "blancas-lente-azul",
        "swatch": "#f3f4f6",
        "images": [
          "/products/gafas/moon/blancas-lente-azul-1.webp"
        ],
        "gallery": [
          "/products/gafas/moon/blancas-lente-azul-foto-1.webp"
        ]
      },
      {
        "label": "Negras",
        "slug": "negras",
        "swatch": "#111827",
        "images": [
          "/products/gafas/moon/negras-1.webp"
        ],
        "gallery": [
          "/products/gafas/moon/negras-foto-1.webp",
          "/products/gafas/moon/negras-foto-2.webp",
          "/products/gafas/moon/negras-foto-3.webp",
          "/products/gafas/moon/negras-foto-4.webp"
        ]
      },
      {
        "label": "Negras lente amarillo",
        "slug": "negras-lente-amarillo",
        "swatch": "#111827",
        "images": [
          "/products/gafas/moon/negras-lente-amarillo-1.webp"
        ],
        "gallery": [
          "/products/gafas/moon/negras-lente-amarillo-foto-1.webp"
        ]
      },
      {
        "label": "Negras lente gris",
        "slug": "negras-lente-gris",
        "swatch": "#111827",
        "images": [
          "/products/gafas/moon/negras-lente-gris-1.webp"
        ],
        "gallery": [
          "/products/gafas/moon/negras-lente-gris-foto-1.webp",
          "/products/gafas/moon/negras-lente-gris-foto-2.webp",
          "/products/gafas/moon/negras-lente-gris-foto-3.webp"
        ]
      }
    ]
  },
  {
    "name": "Office",
    "slug": "office",
    "variants": [
      {
        "label": "Animal print",
        "slug": "animal-print",
        "swatch": "#a0652d",
        "images": [
          "/products/gafas/office/animal-print-1.webp"
        ],
        "gallery": []
      },
      {
        "label": "Cafes lente verde",
        "slug": "cafes-lente-verde",
        "swatch": "#6b4423",
        "images": [
          "/products/gafas/office/cafes-lente-verde-1.webp"
        ],
        "gallery": [
          "/products/gafas/office/cafes-lente-verde-foto-1.webp"
        ]
      },
      {
        "label": "Ghost",
        "slug": "ghost",
        "swatch": "#dbeafe",
        "images": [
          "/products/gafas/office/ghost-1.webp"
        ],
        "gallery": [
          "/products/gafas/office/ghost-foto-1.webp",
          "/products/gafas/office/ghost-foto-2.webp"
        ]
      },
      {
        "label": "Negras",
        "slug": "negras",
        "swatch": "#111827",
        "images": [
          "/products/gafas/office/negras-1.webp"
        ],
        "gallery": []
      },
      {
        "label": "Negras lente amarillo",
        "slug": "negras-lente-amarillo",
        "swatch": "#111827",
        "images": [
          "/products/gafas/office/negras-lente-amarillo-1.webp"
        ],
        "gallery": [
          "/products/gafas/office/negras-lente-amarillo-foto-1.webp"
        ]
      }
    ]
  },
  {
    "name": "Orlando",
    "slug": "orlando",
    "variants": [
      {
        "label": "Beige",
        "slug": "beige",
        "swatch": "#d9c7a8",
        "images": [
          "/products/gafas/orlando/beige-1.webp"
        ],
        "gallery": [
          "/products/gafas/orlando/beige-foto-1.webp"
        ]
      },
      {
        "label": "Blancas",
        "slug": "blancas",
        "swatch": "#f3f4f6",
        "images": [
          "/products/gafas/orlando/blancas-1.webp"
        ],
        "gallery": [
          "/products/gafas/orlando/blancas-foto-1.webp"
        ]
      },
      {
        "label": "Negras",
        "slug": "negras",
        "swatch": "#111827",
        "images": [
          "/products/gafas/orlando/negras-1.webp"
        ],
        "gallery": [
          "/products/gafas/orlando/negras-foto-1.webp"
        ]
      },
      {
        "label": "Negras lente amarillo",
        "slug": "negras-lente-amarillo",
        "swatch": "#111827",
        "images": [
          "/products/gafas/orlando/negras-lente-amarillo-1.webp"
        ],
        "gallery": [
          "/products/gafas/orlando/negras-lente-amarillo-foto-1.webp",
          "/products/gafas/orlando/negras-lente-amarillo-foto-2.webp",
          "/products/gafas/orlando/negras-lente-amarillo-foto-3.webp",
          "/products/gafas/orlando/negras-lente-amarillo-foto-4.webp",
          "/products/gafas/orlando/negras-lente-amarillo-foto-5.webp"
        ]
      },
      {
        "label": "Rosadas",
        "slug": "rosadas",
        "swatch": "#f2b4c6",
        "images": [
          "/products/gafas/orlando/rosadas-1.webp"
        ],
        "gallery": [
          "/products/gafas/orlando/rosadas-foto-1.webp",
          "/products/gafas/orlando/rosadas-foto-2.webp",
          "/products/gafas/orlando/rosadas-foto-3.webp",
          "/products/gafas/orlando/rosadas-foto-4.webp"
        ]
      }
    ]
  },
  {
    "name": "Paris",
    "slug": "paris",
    "variants": [
      {
        "label": "Animal print",
        "slug": "animal-print",
        "swatch": "#a0652d",
        "images": [
          "/products/gafas/paris/animal-print-1.webp"
        ],
        "gallery": [
          "/products/gafas/paris/animal-print-foto-1.webp",
          "/products/gafas/paris/animal-print-foto-2.webp",
          "/products/gafas/paris/animal-print-foto-3.webp"
        ]
      },
      {
        "label": "Beige",
        "slug": "beige",
        "swatch": "#d9c7a8",
        "images": [
          "/products/gafas/paris/beige-1.webp"
        ],
        "gallery": [
          "/products/gafas/paris/beige-foto-1.webp",
          "/products/gafas/paris/beige-foto-2.webp"
        ]
      },
      {
        "label": "Blancas",
        "slug": "blancas",
        "swatch": "#f3f4f6",
        "images": [
          "/products/gafas/paris/blancas-1.webp"
        ],
        "gallery": [
          "/products/gafas/paris/blancas-foto-1.webp",
          "/products/gafas/paris/blancas-foto-2.webp",
          "/products/gafas/paris/blancas-foto-3.webp",
          "/products/gafas/paris/blancas-foto-4.webp",
          "/products/gafas/paris/blancas-foto-5.webp"
        ]
      },
      {
        "label": "Negras",
        "slug": "negras",
        "swatch": "#111827",
        "images": [
          "/products/gafas/paris/negras-1.webp"
        ],
        "gallery": []
      },
      {
        "label": "Rosadas",
        "slug": "rosadas",
        "swatch": "#f2b4c6",
        "images": [
          "/products/gafas/paris/rosadas-1.webp"
        ],
        "gallery": []
      }
    ]
  },
  {
    "name": "Versace",
    "slug": "versace",
    "variants": [
      {
        "label": "Blancas",
        "slug": "blancas",
        "swatch": "#f3f4f6",
        "images": [
          "/products/gafas/versace/blancas-1.webp"
        ],
        "gallery": [
          "/products/gafas/versace/blancas-foto-1.webp",
          "/products/gafas/versace/blancas-foto-2.webp",
          "/products/gafas/versace/blancas-foto-3.webp",
          "/products/gafas/versace/blancas-foto-4.webp",
          "/products/gafas/versace/blancas-foto-5.webp",
          "/products/gafas/versace/blancas-foto-6.webp"
        ]
      },
      {
        "label": "Habanas",
        "slug": "habanas",
        "swatch": "#8b5a2b",
        "images": [
          "/products/gafas/versace/habanas-1.webp"
        ],
        "gallery": [
          "/products/gafas/versace/habanas-foto-1.webp",
          "/products/gafas/versace/habanas-foto-2.webp",
          "/products/gafas/versace/habanas-foto-3.webp",
          "/products/gafas/versace/habanas-foto-4.webp"
        ]
      },
      {
        "label": "Negras",
        "slug": "negras",
        "swatch": "#111827",
        "images": [
          "/products/gafas/versace/negras-1.webp"
        ],
        "gallery": []
      }
    ]
  },
  {
    "name": "Vintage",
    "slug": "vintage",
    "variants": [
      {
        "label": "Animal print",
        "slug": "animal-print",
        "swatch": "#a0652d",
        "images": [
          "/products/gafas/vintage/animal-print-1.webp"
        ],
        "gallery": [
          "/products/gafas/vintage/animal-print-foto-1.webp",
          "/products/gafas/vintage/animal-print-foto-2.webp",
          "/products/gafas/vintage/animal-print-foto-3.webp"
        ]
      },
      {
        "label": "Azul",
        "slug": "azul",
        "swatch": "#3b6fb6",
        "images": [
          "/products/gafas/vintage/azul-1.webp"
        ],
        "gallery": [
          "/products/gafas/vintage/azul-foto-1.webp",
          "/products/gafas/vintage/azul-foto-2.webp",
          "/products/gafas/vintage/azul-foto-3.webp",
          "/products/gafas/vintage/azul-foto-4.webp",
          "/products/gafas/vintage/azul-foto-5.webp",
          "/products/gafas/vintage/azul-foto-6.webp",
          "/products/gafas/vintage/azul-foto-7.webp",
          "/products/gafas/vintage/azul-foto-8.webp"
        ]
      },
      {
        "label": "Blancas",
        "slug": "blancas",
        "swatch": "#f3f4f6",
        "images": [
          "/products/gafas/vintage/blancas-1.webp"
        ],
        "gallery": [
          "/products/gafas/vintage/blancas-foto-1.webp",
          "/products/gafas/vintage/blancas-foto-2.webp",
          "/products/gafas/vintage/blancas-foto-3.webp",
          "/products/gafas/vintage/blancas-foto-4.webp"
        ]
      },
      {
        "label": "Negras",
        "slug": "negras",
        "swatch": "#111827",
        "images": [
          "/products/gafas/vintage/negras-1.webp"
        ],
        "gallery": [
          "/products/gafas/vintage/negras-foto-1.webp",
          "/products/gafas/vintage/negras-foto-2.webp",
          "/products/gafas/vintage/negras-foto-3.webp",
          "/products/gafas/vintage/negras-foto-4.webp",
          "/products/gafas/vintage/negras-foto-5.webp",
          "/products/gafas/vintage/negras-foto-6.webp"
        ]
      },
      {
        "label": "Negras con amarilla",
        "slug": "negras-con-amarilla",
        "swatch": "#111827",
        "images": [
          "/products/gafas/vintage/negras-con-amarilla-1.webp"
        ],
        "gallery": [
          "/products/gafas/vintage/negras-con-amarilla-foto-1.webp",
          "/products/gafas/vintage/negras-con-amarilla-foto-2.webp",
          "/products/gafas/vintage/negras-con-amarilla-foto-3.webp",
          "/products/gafas/vintage/negras-con-amarilla-foto-4.webp"
        ]
      },
      {
        "label": "Rosadas",
        "slug": "rosadas",
        "swatch": "#f2b4c6",
        "images": [
          "/products/gafas/vintage/rosadas-1.webp"
        ],
        "gallery": [
          "/products/gafas/vintage/rosadas-foto-1.webp",
          "/products/gafas/vintage/rosadas-foto-2.webp",
          "/products/gafas/vintage/rosadas-foto-3.webp",
          "/products/gafas/vintage/rosadas-foto-4.webp",
          "/products/gafas/vintage/rosadas-foto-5.webp"
        ]
      }
    ]
  },
  {
    "name": "X-treme",
    "slug": "x-treme",
    "variants": [
      {
        "label": "Negras lente gris",
        "slug": "negras-lente-gris",
        "swatch": "#111827",
        "images": [
          "/products/gafas/x-treme/negras-lente-gris-1.webp",
          "/products/gafas/x-treme/negras-lente-gris-2.webp"
        ],
        "gallery": []
      },
      {
        "label": "Verde neón",
        "slug": "verde-neon",
        "swatch": "#a3e635",
        "images": [
          "/products/gafas/x-treme/verde-neon-1.webp",
          "/products/gafas/x-treme/verde-neon-2.webp"
        ],
        "gallery": []
      },
      {
        "label": "Rojas",
        "slug": "rojas",
        "swatch": "#c0392b",
        "images": [
          "/products/gafas/x-treme/rojas-1.webp",
          "/products/gafas/x-treme/rojas-2.webp"
        ],
        "gallery": []
      },
      {
        "label": "Blancas",
        "slug": "blancas",
        "swatch": "#f3f4f6",
        "images": [
          "/products/gafas/x-treme/blancas-1.webp",
          "/products/gafas/x-treme/blancas-2.webp"
        ],
        "gallery": []
      },
      {
        "label": "Negras lente azul",
        "slug": "negras-lente-azul",
        "swatch": "#111827",
        "images": [
          "/products/gafas/x-treme/negras-lente-azul-1.webp",
          "/products/gafas/x-treme/negras-lente-azul-2.webp"
        ],
        "gallery": []
      }
    ]
  }
];

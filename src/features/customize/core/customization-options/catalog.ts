import {
  CustomizationCategory,
  type CustomizationCategoryContent,
  type CustomizationCategoryItem,
  type CustomizationData,
} from "./types/CustomizationData";

/** Display metadata for a category, kept UI-framework agnostic. */
export type CategoryMeta = {
  category: CustomizationCategory;
  label: string;
  tagline: string;
};

/** Order in which categories are presented to the user. */
export const CATEGORY_ORDER: CustomizationCategory[] = [
  CustomizationCategory.WHEELS,
  CustomizationCategory.PAINT,
  CustomizationCategory.SUSPENSION,
  CustomizationCategory.BODY_KITS,
  CustomizationCategory.LIGHTING,
  CustomizationCategory.SPOILERS,
];

export const CATEGORY_META: Record<CustomizationCategory, CategoryMeta> = {
  [CustomizationCategory.WHEELS]: {
    category: CustomizationCategory.WHEELS,
    label: "Wheels",
    tagline: "Choose your perfect stance",
  },
  [CustomizationCategory.PAINT]: {
    category: CustomizationCategory.PAINT,
    label: "Paint & Wraps",
    tagline: "Set the tone of your build",
  },
  [CustomizationCategory.SUSPENSION]: {
    category: CustomizationCategory.SUSPENSION,
    label: "Suspension",
    tagline: "Dial in the ride height",
  },
  [CustomizationCategory.BODY_KITS]: {
    category: CustomizationCategory.BODY_KITS,
    label: "Body Kits",
    tagline: "Reshape the silhouette",
  },
  [CustomizationCategory.LIGHTING]: {
    category: CustomizationCategory.LIGHTING,
    label: "Lighting",
    tagline: "Define the signature glow",
  },
  [CustomizationCategory.SPOILERS]: {
    category: CustomizationCategory.SPOILERS,
    label: "Spoilers & Wings",
    tagline: "Add downforce with attitude",
  },
};

/**
 * The full set of selectable options per category. In production this would be
 * resolved by the AI generation pipeline; here it backs the mocked generation.
 */
export const OPTION_CATALOG: Record<
  CustomizationCategory,
  CustomizationCategoryItem[]
> = {
  [CustomizationCategory.WHEELS]: [
    {
      slug: "vortex",
      name: "Vortex VR6",
      description: '19" forged, matte black',
      price: 0,
      swatch: "#3f3f46",
    },
    {
      slug: "elite",
      name: "Elite F1R",
      description: '19" sport, silver',
      price: 1250,
      swatch: "#cbd5e1",
    },
    {
      slug: "rays",
      name: "Rays TE37",
      description: '18" sport, bronze',
      price: 1450,
      swatch: "#b45309",
    },
    {
      slug: "rotiform",
      name: "Rotiform RSE",
      description: '20" classic, gloss black',
      price: 1350,
      swatch: "#18181b",
    },
    {
      slug: "bbs",
      name: "BBS CI-R",
      description: '19" forged, gunmetal',
      price: 1550,
      swatch: "#64748b",
    },
  ],
  [CustomizationCategory.PAINT]: [
    {
      slug: "midnight",
      name: "Midnight Purple",
      description: "Deep metallic violet",
      price: 0,
      swatch: "#5b21b6",
    },
    {
      slug: "inferno",
      name: "Inferno Red",
      description: "High-gloss racing red",
      price: 900,
      swatch: "#dc2626",
    },
    {
      slug: "cyber",
      name: "Cyber Teal",
      description: "Iridescent teal flip",
      price: 1100,
      swatch: "#0d9488",
    },
    {
      slug: "phantom",
      name: "Phantom Grey",
      description: "Satin nardo grey",
      price: 750,
      swatch: "#6b7280",
    },
    {
      slug: "solar",
      name: "Solar Flare",
      description: "Chromatic orange-gold",
      price: 1300,
      swatch: "#ea580c",
    },
  ],
  [CustomizationCategory.SUSPENSION]: [
    {
      slug: "stock",
      name: "Stock Ride",
      description: "Factory comfort height",
      price: 0,
      swatch: "#475569",
    },
    {
      slug: "lowered",
      name: "Lowering Springs",
      description: "-35mm aggressive drop",
      price: 850,
      swatch: "#7c3aed",
    },
    {
      slug: "coilovers",
      name: "Coilovers Pro",
      description: "Adjustable track setup",
      price: 2400,
      swatch: "#2563eb",
    },
    {
      slug: "airride",
      name: "Air Ride",
      description: "Slammed on demand",
      price: 3600,
      swatch: "#0891b2",
    },
  ],
  [CustomizationCategory.BODY_KITS]: [
    {
      slug: "oem",
      name: "OEM Lines",
      description: "Clean factory body",
      price: 0,
      swatch: "#52525b",
    },
    {
      slug: "street",
      name: "Street Widebody",
      description: "Flared arches + skirts",
      price: 3200,
      swatch: "#9333ea",
    },
    {
      slug: "gt",
      name: "GT Aero",
      description: "Track-focused aero kit",
      price: 4100,
      swatch: "#1d4ed8",
    },
    {
      slug: "carbon",
      name: "Carbon Edition",
      description: "Exposed carbon fiber",
      price: 5200,
      swatch: "#27272a",
    },
  ],
  [CustomizationCategory.LIGHTING]: [
    {
      slug: "halogen",
      name: "Classic Halogen",
      description: "Warm factory beams",
      price: 0,
      swatch: "#fcd34d",
    },
    {
      slug: "led",
      name: "LED Matrix",
      description: "Crisp white projectors",
      price: 1200,
      swatch: "#e0f2fe",
    },
    {
      slug: "laser",
      name: "Laser Edge",
      description: "Sharp blue signature",
      price: 2100,
      swatch: "#38bdf8",
    },
    {
      slug: "underglow",
      name: "Neon Underglow",
      description: "Violet ground glow",
      price: 1600,
      swatch: "#a855f7",
    },
  ],
  [CustomizationCategory.SPOILERS]: [
    {
      slug: "none",
      name: "Clean Trunk",
      description: "No spoiler, smooth lines",
      price: 0,
      swatch: "#64748b",
    },
    {
      slug: "ducktail",
      name: "Ducktail Lip",
      description: "Subtle lip spoiler",
      price: 650,
      swatch: "#7c3aed",
    },
    {
      slug: "gtwing",
      name: "GT Wing",
      description: "Adjustable swan-neck wing",
      price: 1900,
      swatch: "#2563eb",
    },
    {
      slug: "diffuser",
      name: "Rear Diffuser",
      description: "Carbon aero diffuser",
      price: 1400,
      swatch: "#27272a",
    },
  ],
};

/**
 * Categories the user can actually customize, in display order. Driven by the
 * data so plan-gated builds (e.g. the free plan's 3 categories) only surface
 * the categories the backend generated options for.
 */
export function getActiveCategories(
  data: CustomizationData,
): CustomizationCategory[] {
  return CATEGORY_ORDER.filter(
    (category) => data.categories[category].items.length > 0,
  );
}

/** Looks up the metadata for a selected option, if it exists in the catalog. */
export function findOption(
  category: CustomizationCategory,
  slug: string | undefined,
): CustomizationCategoryItem | undefined {
  if (!slug) {
    return undefined;
  }
  return OPTION_CATALOG[category].find((item) => item.slug === slug);
}

/**
 * Builds a fresh, ungenerated {@link CustomizationData}. The base (stock)
 * vehicle preview is considered ready immediately; category catalogs are
 * generated lazily on first visit.
 */
export function createInitialCustomizationData(): CustomizationData {
  const categories = {} as Record<
    CustomizationCategory,
    CustomizationCategoryContent
  >;

  for (const category of CATEGORY_ORDER) {
    categories[category] = { status: "not-generated", items: [] };
  }

  return {
    selections: {},
    categories,
    preview: {
      status: "generated",
      combinationString: "",
      imageUrl: null,
      renderedAt: Date.now(),
    },
  };
}

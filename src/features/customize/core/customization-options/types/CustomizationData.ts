export enum CustomizationCategory {
    WHEELS = "wheels",
    PAINT = "paint",
}

export type CategoryItem = {
    slug: string;
    name: string;
    previewsUrls: string[];
    banner?: string;
}

export type CustomizationData = Record<CustomizationCategory, CategoryItem[]>;

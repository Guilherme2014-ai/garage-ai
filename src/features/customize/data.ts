import { CustomizationCategory, CustomizationData } from "./core/customization-options/types/CustomizationData";

export const MOCK_CUSTOMIZATION_DATA: CustomizationData = {
    [CustomizationCategory.WHEELS]: [
        {
            slug: "vortex",
            name: "Vortex VR6",
            previewsUrls: ["/images/wheels/vortex.png"],
        },
    ],
    [CustomizationCategory.PAINT]: [
        {
            slug: "red",
            name: "Red",
            previewsUrls: ["/images/paint/red.png"],
        },
    ],
};

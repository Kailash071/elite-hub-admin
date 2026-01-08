export interface MainCategories {
    name: string;
    displayName: string;
    slug: string;
    description: string;
    isActive: boolean;
}

export interface SubCategories {
    name: string;
    displayName: string;
    slug: string;
    description: string;
    isActive: boolean;
    mainCategoryId: string;
}
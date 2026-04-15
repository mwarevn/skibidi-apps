// Color palette token system — single source of truth
// All components must use these tokens, never hardcode color values

export const Palette = {
    dark: {
        scale: [
            '#000000', // 0  - App background (deepest)
            '#0d0d0d', // 1  - Page background
            '#1a1a1a', // 2  - Card background
            '#292929', // 3  - Elevated card / panel
            '#383838', // 4  - Input background
            '#4a4a4a', // 5  - Hover state background
            '#595959', // 6  - Active / pressed background
            '#6b6b6b', // 7  - Placeholder text / disabled
            '#7a7a7a', // 8  - Secondary text
            '#8c8c8c', // 9  - Muted label text
            '#f0f0f0', // 10 - Body text
            '#ffffff', // 11 - Primary / heading text
        ] as const,
        accent: [
            '#ebebeb', // 1  - Lightest accent (background tint)
            '#dbdbdb', // 2
            '#cfcfcf', // 3
            '#bfbfbf', // 4
            '#b3b3b3', // 5
            '#a6a6a6', // 6
            '#999999', // 7
            '#8c8c8c', // 8
            '#808080', // 9  - Mid accent
            '#1f1f1f', // 10
            '#0f0f0f', // 11
            '#000000', // 12 - Darkest accent (text on accent bg)
        ] as const,
        semantic: {
            error:   '#ff6b6b',
            success: '#66bb6a',
            warning: '#ffca28',
        },
    },
    light: {
        scale: [
            '#ffffff', // 0  - App background (lightest)
            '#f5f5f5', // 1  - Page background
            '#ebebeb', // 2  - Card background
            '#dedede', // 3  - Elevated card / panel
            '#d1d1d1', // 4  - Input background
            '#bfbfbf', // 5  - Hover state background
            '#ababab', // 6  - Active / pressed background
            '#999999', // 7  - Placeholder text / disabled
            '#848484', // 8  - Secondary text
            '#737373', // 9  - Muted label text
            '#141414', // 10 - Body text
            '#000000', // 11 - Primary / heading text
        ] as const,
        accent: [
            '#141414', // 1  - Darkest accent (background)
            '#242424', // 2
            '#303030', // 3
            '#404040', // 4
            '#4d4d4d', // 5
            '#595959', // 6
            '#666666', // 7
            '#737373', // 8
            '#808080', // 9  - Mid accent
            '#e0e0e0', // 10
            '#f0f0f0', // 11
            '#ffffff', // 12 - Lightest (text on dark accent bg)
        ] as const,
        semantic: {
            error:   '#d32f2f',
            success: '#2e7d32',
            warning: '#f57f17',
        },
    },
} as const;

export type ColorScheme = 'light' | 'dark';
export type ThemeTokens = typeof Palette.light;

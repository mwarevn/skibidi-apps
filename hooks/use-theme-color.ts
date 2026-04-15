import { Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type Theme = {
    scale: readonly string[];
    accent: readonly string[];
    semantic: { error: string; success: string; warning: string };
};

/** Returns the full palette for the current color scheme */
export function useTheme(): Theme {
    const scheme = useColorScheme() ?? 'light';
    return Palette[scheme] as Theme;
}

/** Legacy helper kept for template components */
export function useThemeColor(
    props: { light?: string; dark?: string },
    _colorName?: string
): string {
    const scheme = useColorScheme() ?? 'light';
    return props[scheme] ?? (scheme === 'dark' ? Palette.dark.scale[10] : Palette.light.scale[10]);
}

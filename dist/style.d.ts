/***************
 *    Style    *
 **************/
export declare function switchTheme(theme: string): void;
export declare function cssVar(name: string): string;
export declare function isDarkMode(): boolean;
export declare function onDarkMode(cb: (dark: boolean) => void): void;
export type Color = {
    red: number;
    green: number;
    blue: number;
    alpha: number;
};
export declare function gradient(start: Color, end: Color, value: number): string;

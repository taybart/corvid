/***************
 *    Utils    *
 **************/
/**
 * Converts bytes to a human-readable string representation
 *
 * @param {number} bytes - The number of bytes to convert
 * @param {Object} options - Optional configuration
 * @param {boolean} options.useSI - If true, use SI units (KB, MB, GB) with powers of 1000
 *                                 If false, use binary units (KiB, MiB, GiB) with powers of 1024
 * @param {number} options.decimals - Number of decimal places to include (default: 2)
 * @return {string} Human-readable representation (e.g., "4.2 MB" or "3.7 GiB")
 */
export type Options = {
    useSI?: boolean;
    decimals?: number;
    includeUnits?: boolean;
    targetUnit?: string;
};
export declare function bytesToHuman(bytes: string, options?: Options): string;
/**
 * Generates a random id of length len using provided alphabet
 * @param len - The length of the string to generate
 * @param [alphabet='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'] - The set of characters to use
 * @return A new random id
 */
export declare function genID(len?: number, alphabet?: string): string;
export type RequestOptions = {
    url: string;
    type: 'json';
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers: Record<string, string>;
    auth: string;
    body: Object;
    success: number;
};
export declare class request {
    opts: RequestOptions;
    constructor(opts: RequestOptions);
    auth(token: string): this;
    body(body: Object): this;
    do({ path, overrideBody, overrideSuccess, }: {
        path: string;
        overrideBody: Object;
        overrideSuccess: number;
    }): Promise<any>;
}

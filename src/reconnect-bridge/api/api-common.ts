declare module "./api-common.js";

/**
 * An interface containing details about a
 * particular `reconnect-bridge` API Version.
 * 
 * @example
 * API Versions typically use this interface to
 * expose details about the API Version using
 * the exported `API` constant:
 * 
 * ```ts
 * export const API = {
 *    version: 1.1,
 *    default: true,
 *    deprecated: false
 * } as const satisfies ApiVersion;
 * ```
 */
export interface ApiVersion {

    /**
     * The version of the API.
     * 
     * E.g., `1` or `2.1`
     */
    version: number;

    /**
     * Whether or not the version of the API is
     * currently being used as the *Default API Version*.
     * 
     * The *Default API Version* is generally the most recent
     * and most stable version of the API available.
     */
    default: boolean;

    /**
     * Whether or not the version of the API is *deprecated*.
     * 
     * *Deprecated API Versions* are **not** recommended for
     * current or active development as they may be removed
     * at any point in the future.
     */
    deprecated: boolean;

}
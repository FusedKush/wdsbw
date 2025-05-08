/**
 * Contains common tools and functionality used
 * by the `archer-c5-v4` (Archer C5 - Version 4) Bridge Router
 * and Reconnection Method Module.
 */
declare module "./common.js";

import { ReconnectionMethod, verboseDataLog, verboseLog } from "../../api/v1/index.js";


/* Wi-Fi Network Scanning */

/**
 * A *Wi-Fi Network Scanning Function* responsible for scanning
 * for the Main Router Wi-Fi Network using the Bridge Router.
 * 
 * @param attemptCount  A positive, nonzero integer representing the number
 *                      of times the program has (recently) attempted to scan for
 *                      Wi-Fi Networks using the function.
 * 
 * @returns             A promise that resolves the results of the Wi-Fi Network Scan.
 * 
 *                      If the Wi-Fi Network Scan failed or the Main Router Wi-Fi Network
 *                      could not be found, the scan function should return `null` or `undefined`.
 *                      
 *                      Note that other [falsy](https://developer.mozilla.org/docs/Glossary/Falsy)
 *                      values such as `false` or `0` will **not** be treated as
 *                      Failed Wi-Fi Network Scans and will pass through the returned
 *                      value as though the scan was successful.
 * 
 * @see {@link scanForWifiNetwork `scanForWifiNetwork()`}
 */
export type WifiNetworkScanFunction = ( attemptCount: number ) => Promise<unknown | null | undefined>;
/**
 * An interface containing *Wi-Fi Network Scanning Options*
 * that can be passed to the {@link scanForWifiNetwork `scanForWifiNetwork()`}
 * helper function.
 * 
 * @see {@link scanForWifiNetwork `scanForWifiNetwork()`}
 */
export interface WifiNetworkScanOptions {

    /**
     * A positive, nonzero integer indicating the
     * maximum number of Wi-Fi Network Scan Attempts
     * before giving up and throwing a {@link ReconnectionMethod.MainRouterError MainRouterError}.
     */
    maxAttempts: number;
    /**
     * The amount of time in **milliseconds** to wait
     * between Wi-Fi Network Scan Attempts.
     */
    retryCooldown: number;

}

/**
 * The Default {@link WifiNetworkScanOptions Wi-Fi Network Scanning Options}
 * that are merged with those passed to the
 * {@link scanForWifiNetwork `scanForWifiNetwork()`} helper function.
 * 
 * @see {@link scanForWifiNetwork `scanForWifiNetwork()`}
 */
export const DEFAULT_NETWORK_SCAN_OPTIONS = {
    maxAttempts: 3,
    retryCooldown: 2500
} as const satisfies WifiNetworkScanOptions

/**
 * Scan for the Main Router Wi-Fi Network using the
 * Bridge Router via the designated `scanFn`.
 * 
 * This helper function is used to standardize the process
 * of scanning for the Main Router Wi-Fi Network
 * using the Bridge Router, including automatically retrying
 * failed attempts and throwing consistent errors.
 * 
 * @template ScanFnT            The type of the `scanFn` argument.
 * 
 * @param scanFn                The {@link WifiNetworkScanFunction Wi-Fi Network Scanning Function}
 *                              responsible for scanning for the Main Router Wi-Fi Network using the Bridge Router.
 * 
 * @param reconnectionMethod    The {@link ReconnectionMethod} the designated `scanFn` is associated with.
 * 
 *                              This argument is primarily only used for error handling purposes.
 * 
 * @param options               Options that can be used to customize the behavior
 *                              of the Wi-Fi Network Scan.
 * 
 *                              Only the options being modified have to be specified, and
 *                              any specified options will be merged with the {@link DEFAULT_NETWORK_SCAN_OPTIONS}.
 * 
 * @returns                     A promise that resolves to the results of the
 *                              Wi-Fi Network Scan on success.
 * 
 * @throws                      A {@link ReconnectionMethod.MainRouterError MainRouterError}
 *                              if the Wi-Fi Network Scan failed after the
 *                              {@link WifiNetworkScanOptions.maxAttempts maximum number of attempts}.
 */
export const scanForWifiNetwork = <ScanFnT extends WifiNetworkScanFunction> (
    scanFn: ScanFnT,
    reconnectionMethod: ReconnectionMethod,
    options?: Partial<WifiNetworkScanOptions>
): Promise<NonNullable<Awaited<ReturnType<ScanFnT>>>> => new Promise((resolve, reject) => {

    /** The merged {@link WifiNetworkScanOptions}. */
    const scanOptions = Object.assign({}, DEFAULT_NETWORK_SCAN_OPTIONS, options ?? {});
    /** The number of times `scanFn` has been called so far. */
    let attempts: number = 0;
    /** The last result of calling the `scanFn`. */
    let result: any = null;

    const scan = async () => {

        result = await scanFn(++attempts);

        if (result !== null && result !== undefined) {
            verboseLog("[*] Successfully Retrieved the Current Main Router Wi-Fi Network Properties!");
            verboseDataLog(result);
            resolve(result);
        }
        else if (attempts < scanOptions.maxAttempts) {
            verboseLog(`[/] Failed to locate the Main Router Wi-Fi Network! Retrying in ${scanOptions.retryCooldown}ms...`);
            setTimeout(scan, scanOptions.retryCooldown);
        }
        else {
            throw new ReconnectionMethod.MainRouterError(
                "Failed to locate the Main Router Wi-Fi Network! The Main Router may or may not be down.",
                reconnectionMethod
            );
        }
    };

    scan();

});
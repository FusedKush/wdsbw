/**
 * Contains the common types, functions, and other members shared
 * between the `reconnect-bridge` Modules, including the
 * various `reconnect-bridge/api` and `reconnect-bridge/routers` Modules.
 */
declare module "./common.js";

import { PROGRAM_TITLE } from "../common.js";
import type { ReconnectionMethod } from "./api/index.js";


/* Error Message Constants */

/**
 * The error message used when the Bridge Router Management Interface
 * is already in use at this time.
 */
export const ROUTER_IN_USE_ERROR_MESSAGE: string = "The Management Interface for the Bridge Router is already currently in-use.";
/**
 * The error message used when the WDS Bridge has not been
 * properly established yet and insufficient credentials were
 * specified to be able to automatically create the WDS Bridge.
 */
export const WDS_BRIDGE_NOT_SETUP_ERROR_MESSAGE: string = (
    "Either the WDS Bridge has to be manually setup or the "
        + 'WDSBW_MAIN_ROUTER_WIFI_PW'
        + " Environment Variable has to be specified in order for the "
        + PROGRAM_TITLE
        + " to be able to re-establish the WDS Bridge."
);
/**
 * The error message used when no Valid {@link ReconnectionMethod Reconnection Methods}
 * are available to re-establish the WDS Bridge.
 */
export const NO_REGISTERED_METHODS_ERROR_MESSAGE: string = (
    "No Reconnection Methods are available!"
        + " No Valid Reconnection Methods are available for the specified Bridge Router"
        + " or all of the Registered Reconnection Methods have failed to be setup successfully."
);
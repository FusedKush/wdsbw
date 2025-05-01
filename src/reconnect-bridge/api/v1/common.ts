
/**
 * The `reconnect-bridge/common` API Module,
 * which extends the common types, functions, and other members
 * shared across the program to Bridge Router and Reconnection Method Modules as well.
 * 
 * This API Module simply exports the available members from
 * the `../../../common.js` and `../../common.js` Modules.
 * 
 * @see `../../../common.js` Module
 * @see `../../common.js` Module
 */
declare module "./common.js";

import {
    AbortableAsyncOperation,
    AbortableOperation,
    Arrayable,
    DateType,
    LogSupplierFunction,
    PROGRAM_TITLE,
    Promisable,
    PromisableAbortableOperation,
    WIFI_FREQUENCY_LIST,
    WifiFrequency,
    consoleHasColorSupport,
    dayjs,
    isTtyConsole,
    useVerboseDataLogging,
    useVerboseLogging,
    verboseDataLog,
    verboseLog    
} from "../../../common.js";
import {
    NO_REGISTERED_METHODS_ERROR_MESSAGE,
    ROUTER_IN_USE_ERROR_MESSAGE,
    WDS_BRIDGE_NOT_SETUP_ERROR_MESSAGE
} from "../../common.js";

export {
    AbortableAsyncOperation,
    AbortableOperation,
    Arrayable,
    DateType,
    LogSupplierFunction,
    PROGRAM_TITLE,
    Promisable,
    PromisableAbortableOperation,
    WIFI_FREQUENCY_LIST,
    WifiFrequency,
    consoleHasColorSupport,
    dayjs,
    isTtyConsole,
    useVerboseDataLogging,
    useVerboseLogging,
    verboseDataLog,
    verboseLog,
    NO_REGISTERED_METHODS_ERROR_MESSAGE,
    ROUTER_IN_USE_ERROR_MESSAGE,
    WDS_BRIDGE_NOT_SETUP_ERROR_MESSAGE
};
/**
 * The Primary `reconnect-bridge` API Module,
 * which can be used to register, manage, and query
 * {@link BridgeRouter Bridge Routers} and the various
 * {@link ReconnectionMethod Reconnection Methods} used
 * to repair the WDS Bridge the Bridge Routers operate when necessary.
 * 
 * This module simply exports the contents of all of the available
 * API Modules, including `./routers.js` and `./env.js`.
 * 
 * Details about the API Version being used are available
 * via the exported {@link API} constant.
 * 
 * 
 * ## Release `v1` Changelog:
 * - `v1.1`:
 *      - Added the `./common.js` and `./utils.js` API Modules.
 *      - Added {@link RawEnvironmentVariablesType} and {@link ProgramVariablesType}.
 * 
 * @see `./routers.js` Module
 * @see `./env.js` Module
 * @see `../index.js` Module
 */
declare module "./index.js";

import { ApiVersion } from "../api-common.js";
import type { RawEnvironmentVariablesType, ProgramVariablesType } from "../../../env.js";


/** Details about the {@link ApiVersion API Version} being used. */
export const API = {
    version: 1.1,
    default: true,
    deprecated: false
} as const satisfies ApiVersion;

export * from "./routers.js";
export * from "./env.js";
export * from "./common.js";
export * from "./utils.js";
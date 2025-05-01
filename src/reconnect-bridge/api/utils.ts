/**
 * The `reconnect-bridge/utils` API Module,
 * which extends the utility types and functions shared
 * across the program to Bridge Router and Reconnection Method Modules as well.
 * 
 * This API Module simply exports the available members from
 * the `../../utils.js` Modules.
 * 
 * ## API Versioning
 * This module uses the {@link ApiVersion.default Default API Version},
 * which may be changed at any time. While this is generally fine
 * for most of the other program code that queries and manages
 * the available {@link ReconnectionMethod Reconnection Methods} at runtime,
 * {@link BridgeRouter Bridge Routers} and Reconnection Methods
 * are strongly encouraged to use a specific API Version where possible
 * to avoid being impacted by future breaking changes present in newer API Versions.
 * 
 * E.g.,
 * ```ts
 * // Replace this...
 * import { ... } from "./reconnect-bridge/api/utils.js";
 * 
 * // ...with this
 * import { ... } from "./reconnect-bridge/api/v1/utils.js";
 * ```
 * 
 * @see `./index.js` Module
 * @see `../../utils.js` Module
 * @see `./v1/utils.js` Module
 */

import type { BridgeRouter, ReconnectionMethod } from "./routers.js";
import type { ApiVersion } from "./api-common.js";


export * from "./v1/utils.js";
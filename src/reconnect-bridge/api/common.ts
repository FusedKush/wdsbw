/**
 * The `reconnect-bridge/common` API Module,
 * which extends the common types, functions, and other members
 * shared across the program to Bridge Router and Reconnection Method Modules as well.
 * 
 * This API Module simply exports the available members from
 * the `../../common.js` and `../common.js` Modules.
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
 * import { ... } from "./reconnect-bridge/api/common.js";
 * 
 * // ...with this
 * import { ... } from "./reconnect-bridge/api/v1/common.js";
 * 
 * @see `../../common.js` Module
 * @see `../common.js` Module
 */
declare module "./common.js";

import type { BridgeRouter, ReconnectionMethod } from "./routers.js";
import type { ApiVersion } from "./api-common.js";


export * from "./v1/common.js";
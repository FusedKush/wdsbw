/**
 * The `reconnect-bridge/routers` API Module,
 * which can be used to register, manage, and query
 * {@link BridgeRouter Bridge Routers} and the various
 * {@link ReconnectionMethod Reconnection Methods} used
 * to repair the WDS Bridge the Bridge Routers operate when necessary.
 * 
 * Additional functionality related to Bridge Routers and Reconnection Methods
 * that are specific to the *Environment/Program Variables* are available
 * in the `./env.js` Module.
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
 * import { ... } from "./reconnect-bridge/api/routers.js";
 * 
 * // ...with this
 * import { ... } from "./reconnect-bridge/api/v1/routers.js";
 * ```
 * 
 * @see `./index.js` Module
 * @see `./env.js` Module
 * @see `./v1/routers.js` Module
 */
declare module "./routers.js";

import type { BridgeRouter, ReconnectionMethod } from "./v1/routers.js";
import type { ApiVersion } from "./api-common.js";

export * from "./v1/routers.js";
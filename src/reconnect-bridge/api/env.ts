/**
 * The `reconnect-bridge/env` API Module,
 * which can be used to register {@link EnvironmentVariable Environment}
 * and {@link ProgramVariables Program Variables} specific to a
 * {@link BridgeRouter Bridge Router} or {@link ReconnectionMethod Reconnection Method}.
 * 
 * More general functionality related to Bridge Routers and Reconnection Methods
 * is available in the `./routers.js` Module.
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
 * import { ... } from "./reconnect-bridge/api/env.js";
 * 
 * // ...with this
 * import { ... } from "./reconnect-bridge/api/v1/env.js";
 * ```
 * 
 * @see `./index.js` Module
 * @see `./routers.js` Module
 * @see `./v1/env.js` Module
 */
declare module "./env.js";

import type { EnvironmentVariable, ProgramVariables } from "../../env.js";
import type { BridgeRouter, ReconnectionMethod } from "./routers.js";
import type { ApiVersion } from "./api-common.js";

export * from "./v1/env.js";
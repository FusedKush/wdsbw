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
 * 
 * ## Module API Support
 * For every (properly documented) member exported by every
 * custom module used by this program, the custom `@apistatus` tag
 * is used to specify the extent with which a given member
 * is supported by the {@link BridgeRouter Bridge Router} and
 * {@link ReconnectionMethod Reconnection Method} Module API.
 * The `@apistatus` tag will always have one of the following values:
 * 
 * - ✔️ **Public**: The member is _publically supported_ in the module API
 *      and is available for Bridge Router and Reconnection Method Modules to use.
 * 
 * - 🧪 _Experimental_: The member is _partially publically supported_ in the module API
 *      and is available for Bridge Router and Reconnection Method Modules to use,
 *      though the member may currently be susceptible to bugs or other undesirable behavior.
 * 
 *      Experimental Members may be changed or removed at any time and
 *      are to be used by Bridge Router and Reconnected Method Modules at their own risk.
 * 
 * - ⚠️ _Not Recommended_: While the member is _publically supported_ in the Module API
 *      and is available for Bridge Router and Reconnection Method Modules to use,
 *      its use is discouraged within these modules.
 * 
 * - ❌ **Private**: The member is _not publically supported_ in the module API
 *      and is **not** available for Bridge Router and Reconnection Method Modules to use.
 * 
 * While a module may export many members, one or more of them may be exported as
 * 🧪 _Experimental_, ⚠️ _Not Recommended_, or ❌ **Private** Members.
 * **Always** check the `@apistatus` tag of all exported members and **never** assume
 * that exported members are _publically supported_ within the module API, 
 * especially when it comes to exported _namespaces_. 
 *  
 * When exporting object, namespace, and other nested types, all of the *members* of the
 * exported type will have an `@apistatus` tag of their own. **Always** check the `@apistatus`
 * tag of the individual members of the exported tag rather than relying on the `@apistatus`
 * of the nested type itself.
 * 
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
 * import { ... } from "./reconnect-bridge/api/index.js";
 * 
 * // ...with this
 * import { ... } from "./reconnect-bridge/api/v1/index.js";
 * ```
 * 
 * Details about the API Version being used are available
 * via the exported {@link API} constant.
 * 
 * 
 * ### API Versions
 * The following versions of the {@link BridgeRouter Bridge Router} and
 * {@link ReconnectionMethod Reconnection Method} Module API are available:
 * 
 * | Release | Version | Status | Default |
 * | ------- | ------- | ------ | ------- |
 * | `v1`    | `1.1`   | ✔️    | ✔️      |
 * 
 * ✔️ - **Active** / ⚠️ - _Deprecated_ / ❌ - ~Archived~
 * 
 * @see `./routers.js` Module
 * @see `./env.js` Module
 * @see `./v1/index.js` Module
 */
declare module "./index.js";

import type { BridgeRouter, ReconnectionMethod } from "./routers.js";
import type { ApiVersion } from "./api-common.js";
import type { API } from "./v1/index.js";

export * from "./v1/index.js";
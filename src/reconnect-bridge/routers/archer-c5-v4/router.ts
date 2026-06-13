/**
 * Exposes the {@link BRIDGE_ROUTER `archer-c5-v4`} Bridge Router
 * for the [`archer-c5-v4`](./index.ts) Bridge Router
 * and Reconnection Method Module.
 */
declare module "./router.js";

import { BridgeRouter } from "../../api/v1/index.js";

/**
 * The {@link BridgeRouter} definition for the
 * `archer-c5-v4` Bridge Router.
 */
export default new BridgeRouter(
    'archer-C5-v4',
    'Archer C5 v4',
    {
        // canSetupBridge: true,
        frequencies: {
            // "2.4GHz": true,
            "5GHz": true
        }
    }
);
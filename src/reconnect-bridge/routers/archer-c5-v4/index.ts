/**
 * The `archer-c5-v4` (Archer C5 - Version 4) Bridge Router
 * and Reconnection Method Module used to operate
 * and re-establish the WDS Bridge using the Archer C5 Bridge Router.
 * 
 * This module provides the {@link BRIDGE_ROUTER `archer-c5-v4`} Bridge Router,
 * as well as two Reconnection Methods for re-establishing the WDS Bridge:
 * - {@link CGI_METHOD `cgi` (CGI)}
 * - {@link PUPPETEER_METHOD `puppeteer` (Puppeteer)}
 */
declare module "./index.js";

import { BridgeRouter, ReconnectionMethod } from "../../api/index.js";
import BRIDGE_ROUTER from "./router.js";
import CGI_METHOD from "./cgi.js";
import PUPPETEER_METHOD from "./puppeteer.js";


BridgeRouter.registerRouter(BRIDGE_ROUTER);
ReconnectionMethod.registerMethod(CGI_METHOD);
ReconnectionMethod.registerMethod(PUPPETEER_METHOD);
/**
 * A Side-Effect-Only Module responsible for loading
 * the desired {@link BridgeRouter Bridge Router}
 * and {@link ReconnectionMethod Reconnection Method} Modules
 * from the current directory.
 * 
 * The Bridge Router and associated Reconnection Methods
 * to load are determined by the Optional
 * {@link EnvironmentVariable.BRIDGE_ROUTER `BRIDGE_ROUTER`}
 * Environment Variable. If the Environment Variable is not found,
 * the Bridge Router and associated Reconnection Methods
 * from the *first module* in the current directory will be used.
 */
declare module "./index.js";

import { BridgeRouter, ReconnectionMethod } from "../api/index.js";
import { fetchEnvironmentVariable, getEnvironmentVariableName, getProgramVars, type EnvironmentVariable } from "../../env.js";

import { existsSync, readdirSync } from "fs";


// Load the appropriate Bridge Router and Reconnection Method Module.
export async function loadReconnectionMethodModules (): Promise<void> {

    let module: string = (() => {

        const BASE_DIR = './dist/reconnect-bridge/routers';
        const envVarValue = fetchEnvironmentVariable('BRIDGE_ROUTER_MODEL')?.toLowerCase();

        if (envVarValue) {
            if ( !existsSync(`${BASE_DIR}/${envVarValue}`) ) {
                throw new TypeError(`The Specified Bridge Router and Reconnection Method Module, '${envVarValue}', could not be found.\n`);
            }

            return envVarValue;
        }
        else {
            if ( !existsSync(BASE_DIR) )
                throw new Error("Failed to locate the reconnect-bridge/routers directory!")

            let files = readdirSync(BASE_DIR, { withFileTypes: true });

            for (const file of files)
                if (file.isDirectory())
                    return file.name;

            throw new Error("Could not find any Bridge Router and Reconnection Method Modules in the reconnect-bridge/routers directory!");
        }

    })();

    await import(`./${module}/index.js`);

}
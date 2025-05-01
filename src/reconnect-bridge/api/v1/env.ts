
/**
 * The `reconnect-bridge/env` API Module,
 * which can be used to register {@link EnvironmentVariable Environment}
 * and {@link ProgramVariables Program Variables} specific to a
 * {@link BridgeRouter Bridge Router} or {@link ReconnectionMethod Reconnection Method}.
 * 
 * More general functionality related to Bridge Routers and Reconnection Methods
 * is available in the `./routers.js` Module.
 * 
 * @see `./index.js` Module
 * @see `./routers.js` Module
 * @see `../env.js` Module
 */
declare module "./env.js";

import {
    ComplexProgramVariableConversionFunction,
    ComplexProgramVariableDefinition,
    EnvironmentVariable,
    ProgramVariableConversionFunction,
    EnvironmentVariableDefinitions,
    EnvironmentVariableManager,
    OverridableEnvironmentVariableDefinitions,
    OverridableEnvironmentVariableMap,
    EnvironmentVariableMap,
    ProgramVariables,
    ENV_VAR_PREFIX,
    registerEnvironmentVariables,
    getEnvironmentVariableName,
    getProgramVars,
    getRawEnvVars,
    programEnvVarManager
} from "../../../env.js";

export {
    ComplexProgramVariableConversionFunction,
    ComplexProgramVariableDefinition,
    EnvironmentVariable,
    ProgramVariableConversionFunction,
    EnvironmentVariableDefinitions,
    EnvironmentVariableManager,
    OverridableEnvironmentVariableDefinitions,
    OverridableEnvironmentVariableMap,
    EnvironmentVariableMap,
    ProgramVariables,
    ENV_VAR_PREFIX,
    registerEnvironmentVariables,
    getEnvironmentVariableName,
    getProgramVars,
    getRawEnvVars,
    programEnvVarManager
};
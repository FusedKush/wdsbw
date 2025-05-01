
/**
 * The `reconnect-bridge/utils` API Module,
 * which extends the utility types and functions shared
 * across the program to Bridge Router and Reconnection Method Modules as well.
 * 
 * This API Module simply exports the available members from
 * the `../../../utils.js` Modules.
 * 
 * @see `../../../utils.js` Module
 */
declare module "./utils.js";

import {
    AbortError,
    AlreadyInUseError,
    LogicError,
    RuntimeError,
    TimeoutError,
    UnimplementedError,
    UnrecoverableError,
    ArrayUtils,
    ConsoleUtils,
    FunctionUtils,
    NumberUtils,
    ObjectUtils,
    StringUtils,
    ConfirmationPrompt,
    SensitiveProperties,
    bindCheckForAbort,
    checkForAbort,
    checkSignalForAbort,
    deepClone,
    deepEquals,
    fillMap,
    getDisplayTimestampString,
    isNullable,
    isType,
    promisify
} from "../../../utils.js";

export {
    AbortError,
    AlreadyInUseError,
    LogicError,
    RuntimeError,
    TimeoutError,
    UnimplementedError,
    UnrecoverableError,
    ArrayUtils,
    ConsoleUtils,
    FunctionUtils,
    NumberUtils,
    ObjectUtils,
    StringUtils,
    ConfirmationPrompt,
    SensitiveProperties,
    bindCheckForAbort,
    checkForAbort,
    checkSignalForAbort,
    deepClone,
    deepEquals as equals,
    fillMap,
    getDisplayTimestampString,
    isNullable,
    isType,
    promisify
};
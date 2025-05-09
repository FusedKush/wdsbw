/**
 * Contains utility types and functions shared across the program.
 * 
 * This module adds various helper members to the global namespace,
 * as well as providing the following distinct namespaces:
 * - {@link SensitiveProperties `SensitiveProperties`}
 * - {@link ConsoleUtils `ConsoleUtils`}
 * - {@link ConfirmationPrompt `ConfirmationPrompt`}
 * 
 * Common types, functions, and other members can also be 
 * found in the [`./common.js`](./common.ts) module.
 * 
 * @link [`./common.js` Module](./common.ts)
 * @link [`./runtime.js` Module](./runtime.ts)
 */
declare module "./utils.js";

import {
    type MatchType,
    type UnitDenominatedNumber,
    type DateType,
    type Primitive,
    type ObjectLike,
    consoleHasColorSupport,
    dayjs,
    PROGRAM_TITLE,
    Inspectable,
    isTtyConsole,
    verboseDataLog,
    verboseLog,
    Promisable,
    ObjectKey,
    RUNFILE_NAME,
    ExpandObjectTypeRecursively,
    TrueObject,
    isTrueObject,
    ExpandObjectType,
    Arrayable,
    NonObject,
    Nullable,
    TypeofTypeString,
    TypeofType
} from "./common.js";
import * as thisModule from "./utils.js";

import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { InspectOptionsStylized, inspect as nodeInspect } from "node:util";
import { EnvironmentVariableManager } from "./env.js";
import { match } from "node:assert";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import readline from 'node:readline';
import { ObjectBacked } from "./common.js";


/* Errors */

/**
 * A tuple type containing the normalized arguments of
 * various custom {@link Error} constructors.
 * 
 * - `message`: The error message to be used.
 * - `options`: Additional {@link ErrorOptions} to pass to the {@link Error} constructor.
 * 
 * @see {@link normalizeErrorArgs `normalizeErrorArgs()`}
 */
type NormalizedErrorConstructorArguments = [message?: string, options?: ErrorOptions];

/**
 * Normalize the arguments passed to a custom {@link Error} constructor.
 * 
 * @example
 * constructor ();
 * constructor ( message?: string );
 * constructor ( options?: ErrorOptions );
 * constructor ( message?: string, options?: ErrorOptions );
 * constructor ( messageOrOptions?: string | ErrorOptions, options?: ErrorOptions ) {
 *    super(...normalizeErrorArgs(messageOrOptions, options, "A custom default error message"));
 * }
 * 
 * @returns A {@link NormalizedErrorConstructorArguments} Tuple Type
 *          containing the normalized arguments.
 */
function normalizeErrorArgs (
    messageOrOptions?: string | ErrorOptions,
    options?: ErrorOptions,
    defaultMessage?: string
): NormalizedErrorConstructorArguments {

    return [
        (typeof messageOrOptions == 'string')
            ? messageOrOptions
            : defaultMessage,
        (typeof messageOrOptions == 'object')
            ? messageOrOptions
            : options
    ];
}

/**
 * Indicates that a *Runtime Error* occurred,
 * or an error that may always potentially occur at *runtime*.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 */
export class RuntimeError extends Error {

    /**
     * Construct a new `RuntimeError` with a default error message.
     */
    constructor ();
    /**
     * Construct a new `RuntimeError` with the specified `message`.
     * 
     * @param message   The error message.
     */
    constructor ( message?: string );
    /**
     * Construct a new `RuntimeError` with a default error message
     * and the specified error `options`.
     * 
     * @param options   Additional {@link ErrorOptions error options} to set.
     */
    constructor ( options?: ErrorOptions );
    /**
     * Construct a new `RuntimeError` with the specified `message`
     * and optional `options`.
     * 
     * @param message   The error message.
     * @param options   Additional {@link ErrorOptions error options} to set.
     */
    constructor ( message?: string, options?: ErrorOptions );
    constructor ( messageOrOptions?: string | ErrorOptions, options?: ErrorOptions );
    constructor ( messageOrOptions?: string | ErrorOptions, options?: ErrorOptions ) {

        super(...normalizeErrorArgs(messageOrOptions, options, "A Runtime Error has occurred!"));

    }

}
/**
 * A {@link RuntimeError} indicating that an operation has
 * timed out after a preset amount of time.
 * 
 * This class exposes the optional readonly {@link timeout} property containing the
 * length of time that passed before `TimeoutError` was thrown.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 */
export class TimeoutError extends RuntimeError {

    /**
     * The number of seconds that passed before the `TimeoutError` was thrown,
     * if specified during construction.
     */
    readonly timeout?: number;


    /**
     * Construct a new `TimeoutError` with a default error message.
     */
    constructor ();
    /**
     * Construct a new `TimeoutError` with the specified `message`.
     * 
     * @param message   The error message to use.
     */
    constructor ( message?: string );
    /**
     * Construct a new `TimeoutError` with the designated `timeout`.
     * 
     * @param timeout   The number of *seconds* that passed before the `TimeoutError` was thrown.
     */
    constructor ( timeout?: number );
    /**
     * Construct a new `TimeoutError` with the specified error `options`.
     * 
     * @param options   Additional {@link ErrorOptions error options} to set.
     */
    constructor ( options?: ErrorOptions );
    /**
     * Construct a new `TimeoutError` with the specified `message` and designated `timeout`.
     * 
     * @param message   The error message to use.
     * @param timeout   The number of seconds that passed before the `TimeoutError` was thrown.
     */
    constructor ( message?: string, timeout?: number );
    /**
     * Construct a new `TimeoutError` with the specified `message` and error `options`.
     * 
     * @param message   The error message to use.
     * @param options   Additional {@link ErrorOptions error options} to set.
     */
    constructor ( message?: string, options?: ErrorOptions );
    /**
     * Construct a new `TimeoutError` with the designated `timeout` and error `options`.
     * 
     * @param timeout   The number of seconds that passed before the `TimeoutError` was thrown.
     * @param options   Additional {@link ErrorOptions error options} to set.
     */
    constructor ( timeout?: number, options?: ErrorOptions );
    /**
     * Construct a new `TimeoutError` with the specified `message`, the
     * designated `timeout`, and the specified error `options`.
     * 
     * @param message   The error message to use.
     * @param timeout   The number of seconds that passed before the `TimeoutError` was thrown.
     * @param options   Additional {@link ErrorOptions error options} to set.
     */
    constructor ( message?: string, timeout?: number, options?: ErrorOptions );
    constructor (
        arg1?: number | string | ErrorOptions,
        arg2?: number | ErrorOptions,
        arg3?: ErrorOptions
    );
    constructor (
        arg1?: number | string | ErrorOptions,
        arg2?: number | ErrorOptions,
        arg3?: ErrorOptions
    ) {

        let timeout: number | undefined = (() => {

            if (typeof arg1 == 'number')
                return arg1
            else if (typeof arg2 == 'number')
                return arg2;

        })();
        let message = (typeof arg1 == 'string')
            ? arg1
            : `The operation has timed out${timeout !== undefined ? ` after ${timeout} ${StringUtils.getPlural('second', timeout)}` : ''}!`;
        let options: ErrorOptions | undefined = (() => {

            for (let arg of arguments)
                if (typeof arg == 'object')
                    return arg;

        })();

        super(message, options);

        if (timeout !== undefined)
            this.timeout = timeout;

    }

};
/**
 * A {@link RuntimeError} indicating that the requested resource
 * or method cannot be used simultaneously and is already currently in use.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 */
export class AlreadyInUseError extends RuntimeError {

    /**
     * Construct a new `AlreadyInUseError` with a default error message.
     */
    constructor ();
    /**
     * Construct a new `AlreadyInUseError` with the specified `message`.
     * 
     * @param message   The error message.
     */
    constructor ( message?: string );
    /**
     * Construct a new `AlreadyInUseError` with a default error message
     * and the specified error `options`.
     * 
     * @param options   Additional {@link ErrorOptions error options} to set.
     */
    constructor ( options?: ErrorOptions );
    /**
     * Construct a new `AlreadyInUseError` with the specified `message`
     * and optional `options`.
     * 
     * @param message   The error message.
     * @param options   Additional {@link ErrorOptions error options} to set.
     */
    constructor ( message?: string, options?: ErrorOptions );
    constructor ( messageOrOptions?: string | ErrorOptions, options?: ErrorOptions );
    constructor ( messageOrOptions?: string | ErrorOptions, options?: ErrorOptions ) {

        super(...normalizeErrorArgs(messageOrOptions, options, "The requested resource or method is already in use."));

    }

};

/**
 * Indicates that the program has encountered an error that will not
 * be corrected by simply trying again, causing the program to terminate early
 * instead of retrying the failed operation.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 */
export class UnrecoverableError extends Error {

    /**
     * Construct a new `UnrecoverableError` with a default error message.
     */
    constructor ();
    /**
     * Construct a new `UnrecoverableError` with the specified `message`.
     * 
     * @param message   The error message to use.
     */
    constructor ( message?: string );
    /**
     * Construct a new `UnrecoverableError` with a default error message
     * and the specified error `options`.
     * 
     * @param options   Additional {@link ErrorOptions error options} to set.
     */
    constructor ( options?: ErrorOptions );
    /**
     * Construct a new `UnrecoverableError` with the specified `message`
     * and optional error `options`.`
     * 
     * @param message   The error message to use.
     * @param options   Additional {@link ErrorOptions error options} to set.
     */
    constructor ( message?: string, options?: ErrorOptions );
    constructor ( messageOrOptions?: string | ErrorOptions, options?: ErrorOptions );
    constructor ( messageOrOptions?: string | ErrorOptions, options?: ErrorOptions ) {

        super(...normalizeErrorArgs(messageOrOptions, options, "An Unrecoverable Error has Occurred!"));

    }

}
/**
 * An {@link UnrecoverableError} primarily thrown by the
 * {@link verifyOnlyOneProgramInstanceExists `verifyOnlyOneProgramInstanceExists()`}
 * function if another instance of the program already appears to be running on the same machine.
 * 
 * @apistatus   ❌ **Private**
 */
export class ProgramInstanceAlreadyExistsError extends UnrecoverableError {

    /**
     * Construct a new `ProgramInstanceAlreadyExistsError` with a default error message.
     */
    constructor ();
    /**
     * Construct a new `ProgramInstanceAlreadyExistsError` with the specified `message`.
     * 
     * @param message   The error message to use.
     */
    constructor ( message?: string );
    /**
     * Construct a new `ProgramInstanceAlreadyExistsError` with a default error message
     * and the specified error `options`.
     * 
     * @param options   Additional {@link ErrorOptions error options} to set.
     */
    constructor ( options?: ErrorOptions );
    /**
     * Construct a new `ProgramInstanceAlreadyExistsError` with the specified `message`
     * and optional error `options`.
     * 
     * @param message   The error message to use.
     * @param options   Additional {@link ErrorOptions error options} to set.
     */
    constructor ( message?: string, options?: ErrorOptions );
    constructor ( messageOrOptions?: string | ErrorOptions, options?: ErrorOptions );
    constructor ( messageOrOptions?: string | ErrorOptions, options?: ErrorOptions ) {

        super(...normalizeErrorArgs(messageOrOptions, options, `An instance of the ${PROGRAM_TITLE} already exists!`));

    }

}

/**
 * An {@link UnrecoverableError} thrown to indicate a logic issue
 * caused by improperly invoking a function or performing an operation.
 * 
 * A `LogicError` should *never* be thrown as a user-facing error
 * and should always lead directly to fixes or changes in the code itself.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 */
export class LogicError extends UnrecoverableError {

    /**
     * Construct a new `LogicError` with a default error message.
     */
    constructor ();
    /**
     * Construct a new `LogicError` with the specified `message`.
     * 
     * @param message   The error message to use.
     */
    constructor ( message?: string );
    /**
     * Construct a new `LogicError` with a default error message
     * and the specified error `options`.
     * 
     * @param options   Additional {@link ErrorOptions error options} to set.
     */
    constructor ( options?: ErrorOptions );
    /**
     * Construct a new `LogicError` with the specified `message`
     * and optional error `options`.
     * 
     * @param message   The error message to use.
     * @param options   Additional {@link ErrorOptions error options} to set.
     */
    constructor ( message?: string, options?: ErrorOptions );
    constructor ( messageOrOptions?: string | ErrorOptions, options?: ErrorOptions );
    constructor ( messageOrOptions?: string | ErrorOptions, options?: ErrorOptions ) {

        super(...normalizeErrorArgs(messageOrOptions, options));

    }

}
/**
 * A {@link LogicError} indicating that the invoked function
 * or method has not been or cannot be implemented.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 */
export class UnimplementedError extends LogicError {

    /**
     * Construct a new `UnimplementedError` with a default error message.
     */
    constructor ();
    /**
     * Construct a new `UnimplementedError` with the specified `message`.
     * 
     * @param message   The error message.
     */
    constructor ( message?: string );
    /**
     * Construct a new `UnimplementedError` with a default error message
     * and the specified error `options`.
     * 
     * @param options   Additional {@link ErrorOptions error options} to set.
     */
    constructor ( options?: ErrorOptions );
    /**
     * Construct a new `UnimplementedError` with the specified `message`
     * and optional `options`.
     * 
     * @param message   The error message.
     * @param options   Additional {@link ErrorOptions error options} to set.
     */
    constructor ( message?: string, options?: ErrorOptions );
    constructor ( messageOrOptions?: string | ErrorOptions, options?: ErrorOptions );
    constructor ( messageOrOptions?: string | ErrorOptions, options?: ErrorOptions ) {

        super(...normalizeErrorArgs(messageOrOptions, options, "This function or method has not been implemented!"));

    }

}

/**
 * An [*Abort Error*](https://developer.mozilla.org/docs/Web/API/DOMException#aborterror)
 * thrown as a result of {@link AbortController.prototype.abort `abort()`-ing} an operation.
 * 
 * @warning
 * Note that while all `AbortError`s are [*Abort Errors*](https://developer.mozilla.org/docs/Web/API/DOMException#aborterror),
 * all *Abort Errors* are **not** necessarily `AbortError`s. To check if an {@link Error} is an *Abort Error* or
 * not, *always* use the static {@link AbortError.isAbortError `isAbortError()`} method instead of `x instanceof AbortError`.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 */
export class AbortError extends DOMException {

    /**
     * Construct a new `AbortError` containing a default error message.
     */
    constructor ();
    /**
     * Construct a new `AbortError` using the {@link AbortSignal.prototype.reason `reason`}
     * of the specified `signal` as the error message.
     * 
     * @param signal            The {@link AbortSignal} whose {@link AbortSignal.prototype.reason `reason`}
     *                          is to be used as the error message.
     */
    constructor ( signal?: AbortSignal );
    /**
     * Construct a new `AbortError` with the specified error `message`.
     * 
     * @param message           The error message to use.
     */
    constructor ( message?: string );
    /**
     * Construct a new `AbortError`.
     * 
     * @param signalOrMessage   The error message to use or an {@link AbortSignal}
     *                          whose {@link AbortSignal.prototype.reason `reason`}
     *                          is to be used as the error message.
     */
    constructor ( signalOrMessage?: AbortSignal | string );
    constructor ( signalOrMessage?: AbortSignal | string ) {

        const errorMessage = signalOrMessage instanceof AbortSignal
            ? signalOrMessage.reason
            : signalOrMessage;

        super(errorMessage ?? 'Operation Aborted.', 'AbortError');

    }

    /**
     * Check if the specified throw `reason` is an
     * [Abort Error](https://developer.mozilla.org/docs/Web/API/DOMException#aborterror).
     * 
     * ### Warning
     * while all `AbortError`s are [*Abort Errors*](https://developer.mozilla.org/docs/Web/API/DOMException#aborterror),
     * all *Abort Errors* are **not** necessarily `AbortError`s. To check if an {@link Error} is an *Abort Error* or
     * not, this method should *always* be used instead of `x instanceof AbortError`.
     * 
     * @param reason    The throw reason being evaluated.
     * 
     * @returns         `true` if `reason` is an `AbortError` or a {@link DOMException} whose
     *                  {@link DOMException.prototype.name `name`} property is set to `'AbortError'`.
     * 
     *                  Otherwise, returns `false`.
     */
    static isAbortError ( reason: any ): boolean;
    /**
     * Check if the specified `error` is an
     * [Abort Error](https://developer.mozilla.org/docs/Web/API/DOMException#aborterror).
     * 
     * ### Warning
     * while all `AbortError`s are [*Abort Errors*](https://developer.mozilla.org/docs/Web/API/DOMException#aborterror),
     * all *Abort Errors* are **not** necessarily `AbortError`s. To check if an {@link Error} is an *Abort Error* or
     * not, this method should *always* be used instead of `x instanceof AbortError`.
     * 
     * @param reason    The {@link Error} being evaluated.
     * 
     * @returns         `true` if `error` is an `AbortError` or a {@link DOMException} whose
     *                  {@link DOMException.prototype.name `name`} property is set to `'AbortError'`.
     * 
     *                  Otherwise, returns `false`.
     */
    static isAbortError ( error: Error ): boolean;
    /**
     * Check if the specified `error` is an
     * [Abort Error](https://developer.mozilla.org/docs/Web/API/DOMException#aborterror).
     * 
     * ### Warning
     * while all `AbortError`s are [*Abort Errors*](https://developer.mozilla.org/docs/Web/API/DOMException#aborterror),
     * all *Abort Errors* are **not** necessarily `AbortError`s. To check if an {@link Error} is an *Abort Error* or
     * not, this method should *always* be used instead of `x instanceof AbortError`.
     * 
     * @param reason    An `AbortError`.
     * 
     * @returns         Always `true` when an `AbortError` is provided.
     */
    static isAbortError ( error: AbortError ): true;
    static isAbortError ( reason: any ): boolean {

        return (reason instanceof DOMException && reason.name == 'AbortError');

    }

    /**
     * Check if the specified `signal` has been
     * {@link signal.prototype.aborted aborted}, throwing
     * an `AbortError` if it has and invoking `fn`
     * with the specified `args` if it has not.
     * 
     * This overload must **not** be used with *object methods*,
     * as it does *not* bind `this` to the class or object instance,
     * making `this` have a value of `undefined` at runtime.
     * 
     * @deprecated          Use {@link checkForAbort `checkForAbort()`} instead.
     * 
     * @template ArgsT      The types of arguments of `fn`.
     * @template ReturnT    The inferred return type of the function.
     * 
     * @param signal        The {@link AbortSignal} being checked.
     * 
     *                      If `undefined` or `null`, the designated
     *                      `fn` will be immediately called.
     * 
     * @param fn            The callback function to invoke if `signal`
     *                      has not been {@link signal.prototype.aborted aborted}.
     * 
     * @param args          Arguments to pass to `fn`.
     * 
     * @returns             The return value of `fn`, given that `signal`
     *                      has not been {@link signal.prototype.aborted aborted}.
     * 
     * @throws              Throws an {@link AbortError} if the specified `signal`
     *                      has been {@link signal.prototype.aborted aborted}.
     */
    static checkForAbort <
        ArgsT extends any[],
        ReturnT extends any
    > (
        signal: AbortSignal | undefined | null,
        fn: ( ...args: ArgsT ) => ReturnT,
        ...args: ArgsT
    ): ReturnT;
    /**
     * Check if the specified `signal` has been
     * {@link signal.prototype.aborted aborted}, throwing
     * an `AbortError` if it has and invoking the method
     * of the name `methodName` on the designated `obj`
     * with the specified `args` if it has not.
     * 
     * This overload is safe to use with *object methods*,
     * as it properly binds `this` to the designated 
     * class or object instance, ensuring that `this`
     * does not have a value of `undefined` at runtime.
     * 
     * @deprecated          Use {@link checkForAbort `checkForAbort()`} instead.
     * 
     * @template ClassT     The type of the `obj` argument.
     * @template MethodT    The type of the `methodName` argument.
     * 
     * @param signal        The {@link AbortSignal} being checked.
     * 
     *                      If `undefined` or `null`, the designated
     *                      method will be immediately called.
     * 
     * @param obj           The object whose methods
     * 
     * @param args          Arguments to pass to `fn`.
     * 
     * @returns             The return value of `fn`, given that `signal`
     *                      has not been {@link signal.prototype.aborted aborted}.
     * 
     * @throws              Throws an {@link AbortError} if the specified `signal`
     *                      has been {@link signal.prototype.aborted aborted}.
     */
    static checkForAbort <
        ClassT extends object,
        MethodT extends keyof ObjectUtils.PickMethods<ClassT>
    > (
        signal: AbortSignal | undefined | null,
        obj: ClassT,
        methodName: MethodT,
        ...args: Parameters<ClassT[MethodT] extends (( ...args: any[] ) => any) ? ClassT[MethodT] : never>
    ): ReturnType<ClassT[MethodT] extends (( ...args: any[] ) => any) ? ClassT[MethodT] : never>;
    /**
     * @deprecated Use {@link checkForAbort `checkForAbort()`} instead.
     */
    static checkForAbort <
        T extends (( ...args: any[] ) => any) | object,
        U extends T extends object ? keyof ObjectUtils.PickMethods<T> : any,
        V extends (T extends (( ...args: any[] ) => any) ? Parameters<T> : Parameters<T[U] extends (( ...args: any[] ) => any) ? T[U] : never>),
        W extends (T extends (( ...args: any[] ) => any) ? ReturnType<T> : ReturnType<T[U] extends (( ...args: any[] ) => any) ? T[U] : never>)
    > (
        signal: AbortSignal | undefined | null,
        fnOrObj: T,
        methodNameOrFirstArg: U,
        ...args: V
    ): W {
    
        if ( !isNullable(signal) && signal.aborted )
            throw new AbortError(signal);
    
        if (typeof fnOrObj == 'function')
            return fnOrObj(...[methodNameOrFirstArg].concat(args));
        else
            return (fnOrObj[methodNameOrFirstArg] as Function).call(fnOrObj, ...args);
    
    }

}


/* File Management Helper Classes */

export class FileManager <ParsedDataT = string, AsyncT extends boolean = false> {

    /* Class Constants */

    static readonly DEFAULT_MAX_FILE_SIZE = 2048;
    

    /* Instance Properties */

    readonly file: string;
    readonly maxFileSize: number;
    readonly asynchronous: AsyncT;
    readonly defaultErrorBehavior: FileManager.ErrorBehavior = 'throw';
    
    fileData: ParsedDataT | null = null;

    
    /* Class Constructors */

    constructor ( file: string );
    constructor ( file: string, asynchronous?: AsyncT );
    constructor ( file: string, maxFileSize?: number );
    constructor ( file: string, defaultErrorBehavior?: FileManager.ErrorBehavior );
    constructor ( file: string, asynchronous?: AsyncT, defaultErrorBehavior?: FileManager.ErrorBehavior );
    constructor ( file: string, asynchronous?: AsyncT, maxFileSize?: number );
    constructor ( file: string, maxFileSize?: number, defaultErrorBehavior?: FileManager.ErrorBehavior );
    constructor (
        file: string,
        asynchronous?: AsyncT,
        maxFileSize?: number,
        defaultErrorBehavior?: FileManager.ErrorBehavior
    );
    constructor (
        arg1: string,
        arg2?: AsyncT | number | FileManager.ErrorBehavior,
        arg3?: number | FileManager.ErrorBehavior,
        arg4?: FileManager.ErrorBehavior
    ) {

        this.file = path.resolve(arg1);
        this.asynchronous = (
            typeof arg2 == 'boolean'
                ? arg2
                : false as AsyncT
        );
        this.maxFileSize = (
            typeof arg2 == 'number'
                ? arg2
                : (
                    typeof arg3 == 'number'
                        ? arg3
                        : FileManager.DEFAULT_MAX_FILE_SIZE
                )
        );
        this.defaultErrorBehavior = (
            typeof arg2 == 'string'
                ? arg2
                : (
                    typeof arg3 == 'string'
                        ? arg3
                        : (arg4 ?? 'throw')
                )
        );

    }


    /* Instance Methods */

    parseFileData ( fileData: string ): ParsedDataT {

        return fileData as ParsedDataT;

    }
    load < ReturnT extends (AsyncT extends true ? Promise<ParsedDataT | null> : ParsedDataT | null) > (
        replaceExistingData?: boolean,
        errorBehavior?: FileManager.ErrorBehavior
    ): ReturnT {

        if (this.fileData && !replaceExistingData) {
            return (
                this.asynchronous
                    ? Promise.resolve(this.fileData)
                    : this.fileData
            ) as ReturnT;
        }

        if (this.asynchronous) {
            return stat(this.file)
                .then((stats) => {
    
                    const configFileSize = stats.size;
    
                    if (configFileSize <= this.maxFileSize) {
                        return readFile(this.file);
                    }
                    else {
                        throw new RuntimeError(
                            `The specified file exceeds the maximum size of ${this.maxFileSize / 1024} KB.`
                                + ` (The file is ${configFileSize / 1024} KB.)`
                        );
                    }
    
                }).then((configFileContents) => {
    
                    if (configFileContents.length > 0) {
                        this.fileData = this.parseFileData(configFileContents.toString());
                    }
    
                    return this.fileData;
    
                }).catch((error) => {
    
                    if (errorBehavior != 'silent') {
                        throw new FileManager.FileManagerError(
                            `Failed to load the specified file (${this.file}) ${error instanceof Error ? `: ${error.message} (${error.name})` : '!'}`,
                            { cause: error }
                        );
                    }
                    else {
                        return null;
                    }
    
                }) as ReturnT;
        }
        else {
            try {
                if ( existsSync(this.file) ) {
                    const configFileSize = statSync(this.file).size;
    
                    if (configFileSize <= this.maxFileSize) {
                        const configFileContents = readFileSync(this.file);
    
                        if (configFileContents.length > 0)
                            this.fileData = this.parseFileData(configFileContents.toString());
    
                        return this.fileData as ReturnT;
                    }
                    else {
                        throw new RuntimeError(
                            `The specified file exceeds the maximum size of ${this.maxFileSize / 1024} KB.`
                                + ` (The file is ${configFileSize / 1024} KB.)`
                        );
                    }
                }
                else {
                    throw new RuntimeError(`The specified file could not be found.`);
                }
            }
            catch (error) {
                if (errorBehavior != 'silent') {
                    throw new FileManager.FileManagerError(
                        `Failed to load the specified file (${this.file}) ${error instanceof Error ? `: ${error.message} (${error.name})` : '!'}`,
                        { cause: error }
                    );
                }
            }
    
            return null as ReturnT;
        }

    }

    serializeData ( data: ParsedDataT ): string {

        return data as string;

    }
    save < ReturnT extends (AsyncT extends true ? Promise<boolean> : boolean) > (
        createFile: boolean = true,
        createDirectory: FileManager.CreateDirectoryOption = false,
        errorBehavior: FileManager.ErrorBehavior = this.defaultErrorBehavior
    ): ReturnT {

        if (this.fileData === null) {
            return (
                this.asynchronous
                    ? Promise.resolve(false)
                    : false
            ) as ReturnT;
        }

        const parentDir = path.dirname(this.file);
        const parentDirExists = existsSync(parentDir);
        const parentParentDirExists = (parentDirExists || existsSync( path.dirname(parentDir) ));
        const tempFileName = (() => {

            let tempFileName: string | null = null;

            while ( !tempFileName || existsSync(tempFileName) ) {
                tempFileName = `${this.file}.${randomBytes(4).toString('hex')}`;
            }

            return tempFileName;

        })();

        if (this.asynchronous) {
            return new Promise<string | undefined>((resolve, reject) => {
    
                if ( !parentDirExists ) {
                    if ( (parentParentDirExists && !createDirectory) || (!parentParentDirExists && createDirectory != 'all-directories') )
                        throw new RuntimeError("The directory containing the specified file could not be found!");
        
                    mkdir(parentDir, { recursive: createDirectory == 'all-directories' }).then(resolve);
                }
                else {
                    resolve(undefined);
                }
    
                }).then(() => {
        
                    if ( !existsSync(this.file) ) {
                        if ( !createFile )
                            throw new RuntimeError("The specified file could not be found!");
                    }
        
                }).then(
                    () => writeFile(tempFileName, this.serializeData(this.fileData!))
                ).then(
                    () => rename(tempFileName, this.file)
                ).then(
                    () => true
                ).catch((error) => {
        
                    if (errorBehavior != 'silent') {
                        throw new FileManager.FileManagerError(
                            `Failed to save the specified file (${this.file}) ${error instanceof Error ? `: ${error.message} (${error.name})` : '!'}`,
                            { cause: error }
                        );
                    }
                    else {
                        return false;
                    }
        
                }) as ReturnT;
        }
        else {
            try {
                if ( !parentDirExists ) {
                    if ( (parentParentDirExists && !createDirectory) || (!parentParentDirExists && createDirectory != 'all-directories') )
                        throw new RuntimeError("The directory containing the specified file could not be found!");
        
                    mkdirSync(parentDir, { recursive: createDirectory == 'all-directories' });
                }
                if ( !existsSync(this.file) ) {
                    if ( !createFile )
                        throw new RuntimeError("The specified file could not be found!");
                }

                writeFileSync(tempFileName, this.serializeData(this.fileData));
                renameSync(tempFileName, this.file);
                return true as ReturnT;
            }
            catch (error) {
                if (errorBehavior != 'silent') {
                    throw new FileManager.FileManagerError(
                        `Failed to save the specified file (${this.file}) ${error instanceof Error ? `: ${error.message} (${error.name})` : '!'}`,
                        { cause: error }
                    );
                }
            }

            return false as ReturnT;
        }

    }

}


export abstract class AbstractFileManager <ParsedDataT = string> {

    static readonly DEFAULT_MAX_FILE_SIZE = 2048;
    
    readonly file: string;
    readonly maxFileSize: number;
    readonly defaultErrorBehavior: FileManager.ErrorBehavior = 'throw';
    fileData: ParsedDataT | null = null;


    constructor ( file: string );
    constructor ( file: string, maxFileSize?: number );
    constructor ( file: string, defaultErrorBehavior?: FileManager.ErrorBehavior );
    constructor ( file: string, maxFileSize?: number, defaultErrorBehavior?: FileManager.ErrorBehavior );
    constructor (
        file: string,
        maxFileSizeOrDefaultErrorBehavior?: number | FileManager.ErrorBehavior,
        defaultErrorBehavior?: FileManager.ErrorBehavior
    ) {

        this.file = path.resolve(file);
        this.maxFileSize = (
            typeof maxFileSizeOrDefaultErrorBehavior == 'number'
                ? maxFileSizeOrDefaultErrorBehavior
                : FileManager.DEFAULT_MAX_FILE_SIZE
        );
        this.defaultErrorBehavior = (
            typeof maxFileSizeOrDefaultErrorBehavior == 'string'
                ? maxFileSizeOrDefaultErrorBehavior
                : (defaultErrorBehavior ?? 'throw')
        );

    }

    getTempFileName (): string {

        let tempFileName: string | null = null;

        while ( !tempFileName || existsSync(tempFileName) ) {
            tempFileName = `${this.file}.${randomBytes(4).toString('hex')}`;
        }

        return tempFileName;

    };

    abstract load ( replaceExistingData?: boolean, errorBehavior?: FileManager.ErrorBehavior ): Promisable<ParsedDataT | null>;
    parseFileData ( fileData: string ): ParsedDataT {

        return fileData as ParsedDataT;

    }

    abstract save (): Promisable<boolean>;
    serializeData ( data: ParsedDataT ): string {

        return data as string;

    }
    
}
export namespace FileManager {

    export type ErrorBehavior = 'silent' | 'throw';
    export type CreateDirectoryOption = boolean | 'all-directories';

    export class FileManagerError extends RuntimeError {



    }

}

// export class SynchronousFileManager <ParsedDataT = string> extends AbstractFileManager<ParsedDataT> {

//     constructor ( file: string );
//     constructor ( file: string, maxFileSize?: number );
//     constructor ( file: string, defaultErrorBehavior?: FileManager.ErrorBehavior );
//     constructor ( file: string, maxFileSize?: number, defaultErrorBehavior?: FileManager.ErrorBehavior );
//     constructor (
//         file: string,
//         maxFileSizeOrDefaultErrorBehavior?: number | FileManager.ErrorBehavior,
//         defaultErrorBehavior?: FileManager.ErrorBehavior
//     ) {

//         if (typeof maxFileSizeOrDefaultErrorBehavior == 'number')
//             super(file, maxFileSizeOrDefaultErrorBehavior, defaultErrorBehavior);
//         else
//             super(file, maxFileSizeOrDefaultErrorBehavior);

//     }

//     load ( replaceExistingData?: boolean, errorBehavior?: FileManager.ErrorBehavior ): ParsedDataT | null {

//         if (this.fileData && !replaceExistingData)
//             return this.fileData;

//         try {
//             if ( existsSync(this.file) ) {
//                 const configFileSize = statSync(this.file).size;

//                 if (configFileSize <= this.maxFileSize) {
//                     const configFileContents = readFileSync(this.file);

//                     if (configFileContents.length > 0)
//                         this.fileData = this.parseFileData(configFileContents.toString());

//                     return this.fileData;
//                 }
//                 else {
//                     throw new RuntimeError(
//                         `The specified file exceeds the maximum size of ${this.maxFileSize / 1024} KB.`
//                             + ` (The file is ${configFileSize / 1024} KB.)`
//                     );
//                 }
//             }
//             else {
//                 throw new RuntimeError(`The specified file could not be found.`);
//             }
//         }
//         catch (error) {
//             if (errorBehavior != 'silent') {
//                 throw new FileManager.FileManagerError(
//                     `Failed to load the specified file (${this.file}) ${error instanceof Error ? `: ${error.message} (${error.name})` : '!'}`,
//                     { cause: error }
//                 );
//             }
//         }

//         return null;
        
//     }
//     save (
//         createFile: boolean = true,
//         createDirectory: FileManager.CreateDirectoryOption = false,
//         errorBehavior: FileManager.ErrorBehavior = this.defaultErrorBehavior
//     ): boolean {

//         if (this.fileData !== null) {
//             try {
//                 const parentDir = path.dirname(this.file);
//                 const parentDirExists = existsSync(parentDir);
//                 const parentParentDirExists = (parentDirExists || existsSync( path.dirname(parentDir) ));
//                 const tempFileName = this.getTempFileName();
        
//                 if ( !parentDirExists ) {
//                     if ( (parentParentDirExists && !createDirectory) || (!parentParentDirExists && createDirectory != 'all-directories') )
//                         throw new RuntimeError("The directory containing the specified file could not be found!");
        
//                     mkdirSync(parentDir, { recursive: createDirectory == 'all-directories' });
//                 }
//                 if ( !existsSync(this.file) ) {
//                     if ( !createFile )
//                         throw new RuntimeError("The specified file could not be found!");
//                 }

//                 writeFileSync(tempFileName, this.serializeData(this.fileData));
//                 renameSync(tempFileName, this.file);
//                 return true;
//             }
//             catch (error) {
//                 if (errorBehavior != 'silent') {
//                     throw new FileManager.FileManagerError(
//                         `Failed to save the specified file (${this.file}) ${error instanceof Error ? `: ${error.message} (${error.name})` : '!'}`,
//                         { cause: error }
//                     );
//                 }
//             }
//         }

//         return false;

//     }

// }

// export class AsynchronousFileManager <ParsedDataT = string> extends AbstractFileManager<ParsedDataT> {

//     constructor ( file: string );
//     constructor ( file: string, maxFileSize?: number );
//     constructor ( file: string, defaultErrorBehavior?: FileManager.ErrorBehavior );
//     constructor ( file: string, maxFileSize?: number, defaultErrorBehavior?: FileManager.ErrorBehavior );
//     constructor (
//         file: string,
//         maxFileSizeOrDefaultErrorBehavior?: number | FileManager.ErrorBehavior,
//         defaultErrorBehavior?: FileManager.ErrorBehavior
//     ) {

//         if (typeof maxFileSizeOrDefaultErrorBehavior == 'number')
//             super(file, maxFileSizeOrDefaultErrorBehavior, defaultErrorBehavior);
//         else
//             super(file, maxFileSizeOrDefaultErrorBehavior);

//     }

//     load ( replaceExistingData?: boolean, errorBehavior?: FileManager.ErrorBehavior ): Promise<ParsedDataT | null> {

//         if (this.fileData && !replaceExistingData)
//             return Promise.resolve(this.fileData);

//         return stat(this.file)
//             .then((stats) => {

//                 const configFileSize = stats.size;

//                 if (configFileSize <= this.maxFileSize) {
//                     return readFile(this.file);
//                 }
//                 else {
//                     throw new RuntimeError(
//                         `The specified file exceeds the maximum size of ${this.maxFileSize / 1024} KB.`
//                             + ` (The file is ${configFileSize / 1024} KB.)`
//                     );
//                 }

//             }).then((configFileContents) => {

//                 if (configFileContents.length > 0) {
//                     this.fileData = this.parseFileData(configFileContents.toString());
//                 }

//                 return this.fileData;

//             }).catch((error) => {

//                 if (errorBehavior != 'silent') {
//                     throw new FileManager.FileManagerError(
//                         `Failed to load the specified file (${this.file}) ${error instanceof Error ? `: ${error.message} (${error.name})` : '!'}`,
//                         { cause: error }
//                     );
//                 }
//                 else {
//                     return null;
//                 }

//             });
        
//     }
//     save (
//         createFile: boolean = true,
//         createDirectory: FileManager.CreateDirectoryOption = false,
//         errorBehavior: FileManager.ErrorBehavior = this.defaultErrorBehavior
//     ): Promise<boolean> {


//     }

// }


// class InternalJSONFileManager <ParsedDataT = unknown> {

//     readonly schema: string | null;


//     constructor ( schema?: string | null ) {

//         this.schema = schema ?? null;

//     }
           

//     parseFileData ( fileData: string ): ParsedDataT {

//         let data = JSON.parse(fileData);

//         if ('$schema' in data)
//             delete data['$schema'];

//         return data;

//     };
//     serializeData = ( data: ParsedDataT ): string => JSON.stringify(
//         (this.schema && data['$schema'] != this.schema)
//             ? Object.assign({ '$schema': this.schema }, data)
//             : data,
//         undefined,
//         4
//     );

// }

export class JSONFileManager <ParsedDataT = unknown, AsyncT extends boolean = false> extends FileManager<ParsedDataT, AsyncT> {

    /* Instance Properties */

    readonly schema: string | null;


    /* Class Constructors */

    constructor ( file: string );
    constructor ( file: string, asynchronous?: AsyncT );
    constructor ( file: string, schema?: string | null );
    constructor ( file: string, maxFileSize?: number );
    constructor ( file: string, defaultErrorBehavior?: FileManager.ErrorBehavior );
    constructor ( file: string, asynchronous?: AsyncT, schema?: string | null );
    constructor ( file: string, asynchronous?: AsyncT, maxFileSize?: number );
    constructor ( file: string, asynchronous?: AsyncT, defaultErrorBehavior?: FileManager.ErrorBehavior );
    constructor ( file: string, schema?: string | null, maxFileSize?: number );
    constructor ( file: string, schema?: string | null, defaultErrorBehavior?: FileManager.ErrorBehavior );
    constructor ( file: string, maxFileSize?: number, defaultErrorBehavior?: FileManager.ErrorBehavior );
    constructor (
        file: string,
        asynchronous?: AsyncT,
        maxFileSize?: number,
        defaultErrorBehavior?: FileManager.ErrorBehavior
    );
    constructor (
        file: string,
        schema?: string | null,
        maxFileSize?: number,
        defaultErrorBehavior?: FileManager.ErrorBehavior
    );
    constructor (
        file: string,
        asynchronous?: AsyncT,
        schema?: string | null,
        maxFileSize?: number,
        defaultErrorBehavior?: FileManager.ErrorBehavior
    );
    constructor (
        arg1: string,
        arg2?: AsyncT | string | null | number | FileManager.ErrorBehavior,
        arg3?: string | null | number | FileManager.ErrorBehavior,
        arg4?: number | FileManager.ErrorBehavior,
        arg5?: FileManager.ErrorBehavior
    ) {

        const isSchemaArg = ( arg: unknown ): arg is Exclude<string, FileManager.ErrorBehavior> | null => (
            arg === null || (typeof arg == 'string' && !['silent', 'throw'].includes(arg))
        );
        const isErrorBehaviorArg = ( arg: unknown ): arg is FileManager.ErrorBehavior => (
            arg === null || (typeof arg == 'string' && ['silent', 'throw'].includes(arg))
        );

        const file = arg1;
        const asynchronous = (
            typeof arg2 == 'boolean'
                ? arg2
                : false as AsyncT
        );
        const schema = (
            isSchemaArg(arg2)
                ? arg2
                : (
                    isSchemaArg(arg3)
                        ? arg3
                        : undefined
                )
        );
        const maxFileSize = (
            typeof arg2 == 'number'
                ? arg2
                : (
                    typeof arg3 == 'number' 
                        ? arg3
                        : (
                            typeof arg4 == 'number'
                                ? arg4
                                : undefined
                        )
                )
        );
        const defaultErrorBehavior = (
            isErrorBehaviorArg(arg2)
                ? arg2
                : (
                    isErrorBehaviorArg(arg3)
                        ? arg3
                        : (
                            isErrorBehaviorArg(arg4)
                                ? arg4
                                : (
                                    isErrorBehaviorArg(arg5)
                                        ? arg5
                                        : 'throw'
                                )
                        )
                )
        );

        super(file, asynchronous, maxFileSize, defaultErrorBehavior);
        this.schema = schema ?? null;
        
    }


    /* Overridden Instance Methods */

    /** @override */        
    parseFileData ( fileData: string ): ParsedDataT {

        let data = JSON.parse(fileData);

        if ('$schema' in data)
            delete data['$schema'];

        return data;

    };
    /** @override */    
    serializeData = ( data: ParsedDataT ): string => JSON.stringify(
        (this.schema && data['$schema'] != this.schema)
            ? Object.assign({ '$schema': this.schema }, data)
            : data,
        undefined,
        4
    );

}
// export class SynchronousJSONFileManager <ParsedDataT = unknown> extends SynchronousFileManager<ParsedDataT> {

//     #internalFileManager: InternalJSONFileManager<ParsedDataT>;


//     constructor ( file: string );
//     constructor ( file: string, schema?: string );
//     constructor ( file: string, maxFileSize?: number );
//     constructor ( file: string, defaultErrorBehavior?: FileManager.ErrorBehavior );
//     constructor ( file: string, schema?: string, maxFileSize?: number );
//     constructor ( file: string, schema?: string, defaultErrorBehavior?: FileManager.ErrorBehavior );
//     constructor ( file: string, maxFileSize?: number, defaultErrorBehavior?: FileManager.ErrorBehavior );
//     constructor ( file: string, schema?: string, maxFileSize?: number, defaultErrorBehavior?: FileManager.ErrorBehavior );
//     constructor (
//         arg1: string,
//         arg2?: string | number | FileManager.ErrorBehavior,
//         arg3?: number | FileManager.ErrorBehavior,
//         arg4?: FileManager.ErrorBehavior
//     ) {

//         const file = arg1;
//         const schema = (
//             typeof arg2 == 'string' && !['silent', 'throw'].includes(arg2)
//                 ? arg2
//                 : undefined
//         );
//         const maxFileSize = (() => {

//             if (typeof arg2 == 'number')
//                 return arg2;
//             else if (typeof arg3 == 'number')
//                 return arg3;
//             else
//                 return undefined;

//         })();
//         const defaultErrorBehavior = (() => {

//             if (typeof arg2 == 'string' && ['silent', 'throw'].includes(arg2))
//                 return arg2;
//             else if (typeof arg3 == 'string' && ['silent', 'throw'].includes(arg3))
//                 return arg3;
//             else if (typeof arg4 == 'string' && ['silent', 'throw'].includes(arg4))
//                 return arg4;
//             else
//                 return undefined;

//         })() as FileManager.ErrorBehavior | undefined;

//         super(file, maxFileSize, defaultErrorBehavior);
//         this.#internalFileManager = new InternalJSONFileManager(schema);

//     }


//     /** @override */
//     parseFileData = ( fileData: string ): ParsedDataT => this.#internalFileManager.parseFileData(fileData);

//     /** @override */
//     serializeData = ( data: ParsedDataT ): string => this.#internalFileManager.serializeData(data);

// }
// export class AsynchronousJSONFileManager <ParsedDataT = unknown> extends AsynchronousFileManager<ParsedDataT> {


//     constructor ( file: string );
//     constructor ( file: string, maxFileSize?: number );
//     constructor ( file: string, defaultErrorBehavior?: FileManager.ErrorBehavior );
//     constructor ( file: string, maxFileSize?: number, defaultErrorBehavior?: FileManager.ErrorBehavior );
//     constructor (
//         file: string,
//         maxFileSizeOrDefaultErrorBehavior?: number | FileManager.ErrorBehavior,
//         defaultErrorBehavior?: FileManager.ErrorBehavior
//     ) {

//         if (typeof maxFileSizeOrDefaultErrorBehavior == 'number')
//             super(file, maxFileSizeOrDefaultErrorBehavior, defaultErrorBehavior);
//         else
//             super(file, maxFileSizeOrDefaultErrorBehavior);

//     }


//     // /** @override */
//     // parseFileData = ( fileData: string ): ParsedDataT => parseJSONFileData(fileData);

//     // /** @override */
//     // serializeData = ( data: ParsedDataT ): string => serializeJSONFileData(data);

// }


/* AbortController / AbortSignal Helper Functions */

/**
 * The internal implementation of {@link checkForAbort `checkForAbort()`}.
 * 
 * The only difference between this function and {@link checkForAbort `checkForAbort()`}
 * is that this function does not specify `this` in the function signature
 * for the visible overloads as `checkForAbort()` does, making it possible
 * for {@link bindCheckForAbort `bindCheckForAbort()`} to work properly.
 * 
 * @see {@link checkForAbort `checkForAbort()`}
 */
function checkForAbortInternal <
    ArgsT extends any[],
    ReturnT extends any
> (
    fn: ( ...args: ArgsT ) => ReturnT,
    ...args: ArgsT
): ReturnT;
function checkForAbortInternal <
    ClassT extends object,
    MethodT extends keyof ObjectUtils.PickMethods<ClassT>
> (
    obj: ClassT,
    methodName: MethodT,
    ...args: Parameters<ClassT[MethodT] extends (( ...args: any[] ) => any) ? ClassT[MethodT] : never>
): ReturnType<ClassT[MethodT] extends (( ...args: any[] ) => any) ? ClassT[MethodT] : never>;
function checkForAbortInternal <
    T extends (( ...args: any[] ) => any) | object,
    U extends T extends object ? keyof ObjectUtils.PickMethods<T> : any,
    V extends (T extends (( ...args: any[] ) => any) ? Parameters<T> : Parameters<T[U] extends (( ...args: any[] ) => any) ? T[U] : never>),
    W extends (T extends (( ...args: any[] ) => any) ? ReturnType<T> : ReturnType<T[U] extends (( ...args: any[] ) => any) ? T[U] : never>)
> (
    this: AbortSignal | undefined | null,
    fnOrObj: T,
    methodNameOrFirstArg: U,
    ...args: V
): W {

    if ( !isNullable(this) && this instanceof AbortSignal && this.aborted )
        throw new AbortError(this);

    if (typeof fnOrObj == 'function')
        return fnOrObj(...[methodNameOrFirstArg].concat(args));
    else
        return (fnOrObj[methodNameOrFirstArg] as Function).call(fnOrObj, ...args);

}

/**
 * Check if the designated {@link AbortSignal} has been
 * {@link AbortSignal.prototype.aborted aborted}, throwing
 * an {@link AbortError} if it has and invoking `fn`
 * with the specified `args` if it has not.
 * 
 * This overload must **not** be used with *object methods*,
 * as it does *not* bind `this` to the class or object instance,
 * making `this` have a value of `undefined` at runtime.
 * 
 * ## Usage
 * To use this function, you must bind `this` to
 * the {@link AbortSignal} being checked:
 * ```ts
 * const controller = new AbortController();
 * const myFn = ( x: number ): number => (x + 10);
 * 
 * checkForAbort.call(controller.signal, myFn, 0); // 10
 * 
 * const check = checkForAbort.bind(controller.signal);
 * check(10); // 20
 * check(32); // 42
 * ```
 * 
 * For a more type-safe way of calling or binding
 * `checkForAbort()`, use {@link checkSignalForAbort `checkSignalForAbort()`}
 * and {@link bindCheckForAbort `bindCheckForAbort()`}, respectively:
 * ```ts
 * checkSignalForAbort(controller.signal, myFn, 0); // Same as checkForAbort.call(controller.signal, myFn, 0);
 * bindCheckForAbort(controller.signal);            // Same as checkForAbort.bind(controller.signal);
 * ```
 * 
 * @this {AbortSignal}  The {@link AbortSignal} being checked.
 *                                          
 *                      If {@link Nullable nullable} or a non-{@link AbortSignal} object,
 *                      the designated `fn` will be immediately called.
 * 
 * @template ArgsT      The types of arguments of `fn`.
 * 
 * @template ReturnT    The inferred return type of the function.
 * 
 * @param fn            The callback function to invoke if `signal`
 *                      has not been {@link AbortSignal.prototype.aborted aborted}.
 * 
 * @param args          Arguments to pass to `fn`.
 * 
 * @returns             The return value of `fn`, given that `signal`
 *                      has not been {@link AbortSignal.prototype.aborted aborted}.
 * 
 * @throws              Throws an {@link AbortError} if the specified `signal`
 *                      has been {@link AbortSignal.prototype.aborted aborted}.
 * 
 * @apistatus           ✔️ **Public**
 * @since               `v1`
 * 
 * @see {@link checkSignalForAbort `checkSignalForAbort()`}
 * @see {@link bindCheckForAbort `bindCheckForAbort()`}
 */
export function checkForAbort <
    ArgsT extends any[],
    ReturnT extends any
> (
    this: AbortSignal | undefined | null,
    fn: ( ...args: ArgsT ) => ReturnT,
    ...args: ArgsT
): ReturnT;
/**
 * Check if the designated {@link AbortSignal} has been
 * {@link AbortSignal.prototype.aborted aborted}, throwing
 * an `AbortError` if it has and invoking the method
 * of the name `methodName` on the designated `obj`
 * with the specified `args` if it has not.
 * 
 * This overload is safe to use with *object methods*,
 * as it properly binds `this` to the designated 
 * class or object instance, ensuring that `this`
 * does not have a value of `undefined` at runtime.
 * 
 * ## Usage
 * To use this function, you must bind `this` to
 * the {@link AbortSignal} being checked:
 * ```ts
 * class MyClass {
 * 
 *    x: number;
 * 
 *    constructor ( x: number ) {
 *       this.x = x;
 *    }
 * 
 *    add (): number {
 *       return (this.x + 10);
 *    }
 * 
 * }
 * 
 * const controller = new AbortController();
 * const foo = new MyClass(0);
 * const bar = new MyClass(10);
 * const baz = new MyClass(32);
 * 
 * checkForAbort.call(controller.signal, foo, 'add'); // 10
 * 
 * const check = checkForAbort.bind(controller.signal);
 * check(bar, 'add'); // 20
 * check(baz, 'add'); // 42
 * ```
 * 
 * For a more type-safe way of calling or binding
 * `checkForAbort()`, use {@link checkSignalForAbort `checkSignalForAbort()`}
 * and {@link bindCheckForAbort `bindCheckForAbort()`}, respectively:
 * ```ts
 * checkSignalForAbort(controller.signal, foo, 'add');  // Same as checkForAbort.call(controller.signal, foo, 'add);
 * bindCheckForAbort(controller.signal);                // Same as checkForAbort.bind(controller.signal);
 * ```
 * 
 * @this {AbortSignal}  The {@link AbortSignal} being checked.
 *                                          
 *                      If {@link Nullable nullable} or a non-{@link AbortSignal} object,
 *                      the designated `fn` will be immediately called.
 * 
 * @template ClassT     The type of the `obj` argument.
 * 
 * @template MethodT    The type of the `methodName` argument.
 * 
 * @param signal        The {@link AbortSignal} being checked.
 * 
 *                      If `undefined` or `null`, the designated
 *                      method will be immediately called.
 * 
 * @param obj           The object whose methods
 * 
 * @param args          Arguments to pass to `fn`.
 * 
 * @returns             The return value of `fn`, given that `signal`
 *                      has not been {@link AbortSignal.prototype.aborted aborted}.
 * 
 * @throws              Throws an {@link AbortError} if the specified `signal`
 *                      has been {@link AbortSignal.prototype.aborted aborted}.
 * 
 * @apistatus           ✔️ **Public**
 * @since               `v1`
 * 
 * @see {@link checkSignalForAbort `checkSignalForAbort()`}
 * @see {@link bindCheckForAbort `bindCheckForAbort()`}
 */
export function checkForAbort <
    ClassT extends object,
    MethodT extends keyof ObjectUtils.PickMethods<ClassT>
> (
    this: AbortSignal | undefined | null,
    obj: ClassT,
    methodName: MethodT,
    ...args: Parameters<ClassT[MethodT] extends (( ...args: any[] ) => any) ? ClassT[MethodT] : never>
): ReturnType<ClassT[MethodT] extends (( ...args: any[] ) => any) ? ClassT[MethodT] : never>;
export function checkForAbort <
    T extends (( ...args: any[] ) => any) | object,
    U extends T extends object ? keyof ObjectUtils.PickMethods<T> : any,
    V extends (T extends (( ...args: any[] ) => any) ? Parameters<T> : Parameters<T[U] extends (( ...args: any[] ) => any) ? T[U] : never>),
    W extends (T extends (( ...args: any[] ) => any) ? ReturnType<T> : ReturnType<T[U] extends (( ...args: any[] ) => any) ? T[U] : never>)
> (
    this: AbortSignal | undefined | null,
    fnOrObj: T,
    methodNameOrFirstArg: U,
    ...args: V
): W {

    if ( !isNullable(this) && this instanceof AbortSignal && this.aborted )
        throw new AbortError(this);

    if (typeof fnOrObj == 'function')
        return fnOrObj(...[methodNameOrFirstArg].concat(args));
    else
        return (fnOrObj[methodNameOrFirstArg] as Function).call(fnOrObj, ...args);

}

/**
 * Check if the specified `signal` has been
 * {@link AbortSignal.prototype.aborted aborted}, throwing
 * an {@link AbortError} if it has and invoking `fn`
 * with the specified `args` if it has not.
 * 
 * This function is a type-safe equivalent of {@link Function.prototype.call calling}
 * the {@link checkForAbort `checkForAbort()`} function and binding the specified `signal` to `this`.
 * E.g.,
 * ```ts
 * checkSignalForAbort(controller.signal, myFn, 0); // Same as checkForAbort.call(controller.signal, myFn, 0);
 * ```
 * 
 * This overload must **not** be used with *object methods*,
 * as it does *not* bind `this` to the class or object instance,
 * making `this` have a value of `undefined` at runtime.
 * 
 * @template ArgsT      The types of arguments of `fn`.
 * 
 * @template ReturnT    The inferred return type of the function.
 * 
 * @param signal        The {@link AbortSignal} being checked.
 *                                          
 *                      If {@link Nullable nullable} or a non-{@link AbortSignal} object,
 *                      the designated `fn` will be immediately called.
 * 
 * @param fn            The callback function to invoke if `signal`
 *                      has not been {@link AbortSignal.prototype.aborted aborted}.
 * 
 * @param args          Arguments to pass to `fn`.
 * 
 * @returns             The return value of `fn`, given that `signal`
 *                      has not been {@link AbortSignal.prototype.aborted aborted}.
 * 
 * @throws              Throws an {@link AbortError} if the specified `signal`
 *                      has been {@link AbortSignal.prototype.aborted aborted}.
 * 
 * @apistatus           ✔️ **Public**
 * @since               `v1`
 * 
 * @see {@link checkForAbort `checkForAbort()`}
 * @see {@link bindCheckForAbort `bindCheckForAbort()`}
 */
export function checkSignalForAbort <
    ArgsT extends any[],
    ReturnT extends any
> (
    signal: AbortSignal | undefined | null,
    fn: ( ...args: ArgsT ) => ReturnT,
    ...args: ArgsT
): ReturnT;
/**
 * Check if the specified `signal` has been
 * {@link AbortSignal.prototype.aborted aborted}, throwing
 * an `AbortError` if it has and invoking the method
 * of the name `methodName` on the designated `obj`
 * with the specified `args` if it has not.
 * 
 * This function is a type-safe equivalent of {@link Function.prototype.call calling}
 * the {@link checkForAbort `checkForAbort()`} function and binding the specified `signal` to `this`.
 * E.g.,
 * ```ts
 * checkSignalForAbort(controller.signal, foo, 'add');  // Same as checkForAbort.call(controller.signal, foo, 'add);
 * ```
 * 
 * This overload is safe to use with *object methods*,
 * as it properly binds `this` to the designated 
 * class or object instance, ensuring that `this`
 * does not have a value of `undefined` at runtime.
 * 
 * @template ClassT     The type of the `obj` argument.
 * 
 * @template MethodT    The type of the `methodName` argument.
 * 
 * @param signal        The {@link AbortSignal} being checked.
 *                                          
 *                      If {@link Nullable nullable} or a non-{@link AbortSignal} object,
 *                      the designated method will be immediately called.
 * 
 * @param signal        The {@link AbortSignal} being checked.
 * 
 *                      If {@link Nullable nullable} or a non-{@link AbortSignal} object,
 *                      the designated method will be immediately called.
 * 
 * @param obj           The object whose methods
 * 
 * @param args          Arguments to pass to `fn`.
 * 
 * @returns             The return value of `fn`, given that `signal`
 *                      has not been {@link AbortSignal.prototype.aborted aborted}.
 * 
 * @throws              Throws an {@link AbortError} if the specified `signal`
 *                      has been {@link AbortSignal.prototype.aborted aborted}.
 * 
 * @apistatus           ✔️ **Public**
 * @since               `v1`
 * 
 * @see {@link checkForAbort `checkForAbort()`}
 * @see {@link bindCheckForAbort `bindCheckForAbort()`}
 */
export function checkSignalForAbort <
    ClassT extends object,
    MethodT extends keyof ObjectUtils.PickMethods<ClassT>
> (
    signal: AbortSignal | undefined | null,
    obj: ClassT,
    methodName: MethodT,
    ...args: Parameters<ClassT[MethodT] extends (( ...args: any[] ) => any) ? ClassT[MethodT] : never>
): ReturnType<ClassT[MethodT] extends (( ...args: any[] ) => any) ? ClassT[MethodT] : never>;
export function checkSignalForAbort <
    T extends (( ...args: any[] ) => any) | object,
    U extends T extends object ? keyof ObjectUtils.PickMethods<T> : any,
    V extends (T extends (( ...args: any[] ) => any) ? Parameters<T> : Parameters<T[U] extends (( ...args: any[] ) => any) ? T[U] : never>),
    W extends (T extends (( ...args: any[] ) => any) ? ReturnType<T> : ReturnType<T[U] extends (( ...args: any[] ) => any) ? T[U] : never>)
> (
    signal: AbortSignal | undefined | null,
    fnOrObj: T,
    methodNameOrFirstArg: U,
    ...args: V
): W {

    return checkForAbort.call(signal, fnOrObj, methodNameOrFirstArg, ...args);

}

/**
 * Get a function with the same body as the {@link checkForAbort `checkForAbort()`} function
 * in which the specified `signal` has been {@link Function.prototype.bind bound} to `this`.
 * 
 * This function is a type-safe equivalent of {@link Function.prototype.bind binding}
 * the specified `signal` to `this`.
 * E.g.,
 * ```ts
 * bindCheckForAbort(controller.signal); // Same as checkForAbort.bind(controller.signal);
 * ```
 * 
 * @param signal        The {@link AbortSignal} being bound to the function.
 * 
 * @returns             A function with the same body as the {@link checkForAbort `checkForAbort()`} function
 *                      in which the specified `signal` has been {@link Function.prototype.bind bound} to `this`.
 * 
 * @apistatus           ✔️ **Public**
 * @since               `v1`
 * 
 * @see {@link checkForAbort `checkForAbort()`}
 * @see {@link checkSignalForAbort `checkSignalForAbort()`}
 */
export const bindCheckForAbort = ( signal?: AbortSignal | null ): typeof checkForAbortInternal => checkForAbort.bind(signal);


/* General Type Utilities */

/**
 * [Source (Stack Overflow)](https://stackoverflow.com/questions/70545982/why-am-i-getting-type-instantiation-is-excessively-deep-and-possibly-infinite#answer-74891993)
 */
export type IsAnyType <T> = (
    boolean extends (T extends never ? true : false)
        ? true
        : false
);
/**
 * [Source (Stack Overflow)](https://stackoverflow.com/questions/50374908/transform-union-type-to-intersection-type#answer-50375286)
 */
export type UnionToIntersection <U> = (
    [U] extends [never]
        ? never
        : (
            U extends any
                ? ( x: U ) => void
                : never
        ) extends (( x: infer I ) => void)
            ? I
            : never
);

/**
 * Check if the specified value is *Nullable*, or
 * if the value is `undefined` or `null`.
 * 
 * @param x     The value being tested.
 * 
 * @returns     `true` if `x` is `undefined` or `null`.
 *      
 *              Otherwise, returns `false`.
 * 
 * @apistatus   🧪 *Experimental*
 * @since       `v1`
 */
export const isNullable = ( x: unknown ): x is Nullable => (x === undefined || x === null);

/**
 * Check if `x` is of the specified `type`.
 * 
 * This function can be used to assert that a variable
 * or parameter of unknown type is of one or more types
 * within a conditional block. E.g.,
 * ```ts
 * function ( arg?: string | number | object | null ): string | number {
 * 
 *    if (isType(arg, ['string' | 'number'])) {
 *       // Typeof arg is `string | number`
 *       return arg;
 *    }
 *    else if (isType(arg, 'object')) {
 *       // Typeof arg is `object`
 *       return `Object: ${arg.toString()}`;
 *    }
 *    else {
 *       // Typeof arg is `undefined | null`
 *       return 'undefined or null';
 *    }
 * 
 * }
 * ```
 * 
 * @template T  The type of the `type` argument.
 * @template U  The inferred type(s) that `x` is being asserted to be.
 * 
 * @param x     The value being tested.
 * 
 * @param type  The {@link TypeofTypeString type} or types to check `x` for
 *              as a `string` or an array of `string`s.
 * 
 * @returns     `true` is `x` is of the designated `type`
 *              or `false` if it is not.
 * 
 * @apistatus   🧪 *Experimental*
 * @since       `v1`
 */
export const isType = <
    T extends TypeofTypeString | TypeofTypeString[],
    U extends TypeofType = (T extends TypeofTypeString[] ? TypeofType<T[number]> : TypeofType<T>)
> ( x: unknown, type: T ): x is U => {

    const types = ArrayUtils.arrayify(type) as TypeofTypeString;

    return (
        typeof x == 'object'
            ? (types.includes('object') && x !== null)
            : (
                   (types.includes('array') && Array.isArray(x))
                || (types.includes('null') && x === null)
                || types.includes(typeof x)
            )
    );

};
export function assertIsType <
    T extends TypeofTypeString | TypeofTypeString[],
    U extends TypeofType = (T extends TypeofTypeString[] ? TypeofType<T[number]> : TypeofType<T>)
> ( x: unknown, type: T ): x is U {

    if ( !isType(x, type) ) {
        throw new TypeError(
            "The specified value is not of "
                + (Array.isArray(type) ? `any of the following types: ${ArrayUtils.toListStr(type)}` : `type ${type}`)
                + ` (A ${typeof x} was provided.)`
        );
    }

    return true;

}

/**
 * @apistatus   🧪 *Experimental*
 * @since       `v1`
 */
export function deepEquals <
    T,
    U,
    ReturnT extends (
        T extends any[]
            ? (
                U extends any[]
                    ? (
                        [ArrayUtils.TupleComponents<T>] extends [never]
                        ? boolean
                        : (
                            [ArrayUtils.TupleComponents<U>] extends [never]
                                ? boolean
                                : (T extends U ? true : false)
                        )
                    )
                    : false
            )
            : (T extends U ? true : false)
    )
> ( x: T, y: U ): ReturnT {


    if (Array.isArray(x)) {
        if (Array.isArray(y))
            return ArrayUtils.deepEquals(x, y) as ReturnT;
        else
            return false as ReturnT;
    }
    else if (typeof x == 'object') {
        if (typeof y == 'object')
            return Object.is(x, y) as ReturnT;
        else
            return false as ReturnT;
    }

    return ((x as any) === (y as any)) as ReturnT;

}


/* Date-Time Utilities */

/**
 * The Date-Time Format to be used when formatting timestamps
 * using the {@link getDisplayTimestampString `getDisplayTimestampString()`} function.
 */
const DISPLAY_TIMESTAMP_FORMAT = "dddd, MMMM D [at] hh:mm:ss.SSS A z";

/**
 * Format a timestamp to a full human-readable date-time string.
 * 
 * @param time      The {@link DateType timestamp} being formatted.
 * 
 *                  Defaults to the *Current Time*.
 * 
 * @param colors    Optionally {@link ConsoleUtils.colorizeOutput colorizes}
 *                  the formatted timestamp string for the console using the
 *                  specified console color or colors.
 * 
 *                  If set to `true`, the {@link ConsoleUtils.DEFAULT_COLORS.DateType default color}
 *                  for {@link DateType date-time timestamps} will be used instead.
 * 
 * @returns         A new string containing the formatting `time` timestamp.
 * 
 * @apistatus       ✔️ **Public**
 * @since           `v1`
 */
export const getDisplayTimestampString = (
    time?: DateType | null,
    colors?: ConsoleUtils.Color | true
): string => (
    typeof colors != 'undefined'
        ? ConsoleUtils.colorizeOutput(
            (time ?? dayjs()).format(DISPLAY_TIMESTAMP_FORMAT),
            colors !== true ? colors : ConsoleUtils.DEFAULT_COLORS.DateType
        )
        : (time ?? dayjs()).format(DISPLAY_TIMESTAMP_FORMAT)
);

export const DEFAULT_RELATIVE_TIMESTAMP_BUFFER_TIME = 500;
export interface RelativeTimestampCheckOptions {
    inclusive?: boolean;
    buffer?: number;
    referenceTimestamp?: DateType;

}
export const isPastTimestamp = ( timestamp: DateType, options?: RelativeTimestampCheckOptions ): boolean => {

    let diff = (options?.referenceTimestamp ? options.referenceTimestamp : dayjs())
        .subtract(Math.abs( options?.buffer ?? DEFAULT_RELATIVE_TIMESTAMP_BUFFER_TIME ))
        .diff(timestamp);

    return ( diff > 0 || (options?.inclusive === true && diff == 0) );

}
export const isFutureTimestamp = ( timestamp: DateType, options?: RelativeTimestampCheckOptions ): boolean => {

    let diff = (options?.referenceTimestamp ? options.referenceTimestamp : dayjs())
        .add(Math.abs( options?.buffer ?? DEFAULT_RELATIVE_TIMESTAMP_BUFFER_TIME ))
        .diff(timestamp);

    return ( diff < 0 || (options?.inclusive === true && diff == 0) );

}


/* Miscellaneous Helper Functions */

/**
 * Wrap the designated function in a promise.
 * 
 * If the specified function returns a promise, it will
 * *not* be wrapped by another promise and the original promise
 * returned by the function will be returned instead.
 * 
 * The main purpose of this function is to aid in the implementation
 * of functions that accept both sychronous and asychronous callbacks.
 * 
 * @example
 * const foo = () => "The answer is:";
 * const bar = () => new Promise((resolve) => {
 *    setTimeout(() => resolve(42), 5000);
 * });
 * 
 * for (const fn of [foo, bar]) {
 *    promisify(fn).then( (value) => console.log(value); )
 * }
 * 
 * // Prints:
 * // The answer is:
 * // 42
 * 
 * @template T      The base return type of the `fn` function.
 * @template ArgsT  The type of the arguments of the `fn` function.
 * 
 * @param fn        The function being promisified.
 * @param args      Additional arguments to pass to `fn`.
 * 
 * @returns         A promise.
 * 
 *                  If `fn` returns a non-promise value, a new promise
 *                  will be returned that immediately resolves to the value
 *                  returned by `fn`.
 * 
 *                  If `fn` returns a promise, the promise will be immediately returned.
 * 
 * @apistatus       ✔️ **Public**
 * @since           `v1`
 */
export const promisify = <T, ArgsT extends any[]> (
    fn: ( ...args: ArgsT ) => Promisable<T>,
    ...args: ArgsT
): Promise<T> => {

    const returnValue = fn(...args);

    return (
        returnValue instanceof Promise
            ? returnValue
            : Promise.resolve(returnValue)
    );

}

export function deepClone <T extends any[]> ( data: T ): T;
export function deepClone <T extends ( ...args: any ) => any> ( data: T ): T;
export function deepClone <T extends TrueObject> ( data: T ): ObjectUtils.RemoveReadonlyRecursive<T>;
export function deepClone <T> ( data: T ): T;

/**
 * Makes a *Deep Clone* of the specified `data`, or
 * a copy of type `T` in which there are no references
 * to the original `data`.
 * 
 * References to {@link Primitive} and {@link Function} types
 * are returned as-is, while {@link ObjectLike Object-Like Types}
 * (arrays and {@link TrueObject "True" Objects}) are *Recursively Deep-Cloned*.
 * 
 * @example
 * var foo = {
 *    x: 0,
 *    y: [1, 2, 3],
 *    z: {
 *       key: 'abc'
 *    }
 * };
 * var bar = deepClone(foo);
 * 
 * foo.x = 1;
 * foo.y.push(4);
 * foo.y.push(5);
 * 
 * bar.x = 2;
 * bar.z.key = 'abcde';
 * 
 * var baz = deepClone(bar);
 * baz.z.useKey = true;
 * 
 * console.log(foo);
 * // Prints: {
 * //    x: 1,
 * //    y: [1, 2, 3, 4, 5]
 * //    z: { key: 'abc' }
 * // }
 * 
 * console.log(bar);
 * // Prints: {
 * //    x: 2,
 * //    y: [1, 2, 3]
 * //    z: { key: 'abcde' }
 * // }
 * 
 * console.log(baz);
 * // Prints: {
 * //    x: 2,
 * //    y: [1, 2, 3]
 * //    z: '{ key: 'abcde', useKey: true }
 * // }
 * 
 * @template T  The type of the `data` argument.
 * 
 * @param data  The data being cloned.
 * 
 * @returns     A *Deep Clone* of the specified `data` that can
 *              be safely modified (if applicable to type `T`)
 *              without affecting the original `data`.
 * 
 * @apistatus   🧪 *Experimental*
 * @since       `v1`
 */
export function deepClone <T> ( data: T ): T {

    if (typeof data != 'object')
        return data;

    if (Array.isArray(data)) {
        let clonedArray = [] as T;

        for (let element of data) {
            (clonedArray as unknown[]).push(
                typeof element != 'object'
                    ? element
                    : deepClone(element)
            );
        }

        return clonedArray;
    }
    else {
        if (data === null)
            return null as T;

        let clonedObj = {} as T;

        for (let property in data) {
            const value = data[property];

            clonedObj[property] = (
                typeof value != 'object'
                    ? value
                    : deepClone(value)
            );
        }

        return clonedObj;
    }

}

/**
 * Get a new {@link Map} containing the designated `keys`
 * all set to the specified `fillValue`.
 * 
 * @template K              The type of the *Keys* in the {@link Map}.
 * @template V              The type of the *Values* in the {@link Map}.
 * 
 * @param keys              An array of map keys to be filled in.
 * @param fillValue         The value to set the specified `keys` to.
 * 
 * @returns                 A new {@link Map} containing the designated `keys`
 *                          all set to the specified `fillValue`.
 * 
 * @apistatus               ✔️ **Public**
 * @since                   `v1`
 */
export function fillMap <K, V> ( keys: K[], fillValue: V ): Map<K, V>;
/**
 * Fill the designated {@link Map} with one or more Key-Value Pairs
 * specified by `keys` and `fillValue`.
 * 
 * Both new and existing Key-Value Pairs will be
 * set to the specified `fillValue`.
 * 
 * @template K              The type of the *Keys* in the designated `map`.
 * @template V              The type of the *Values* in the designated `map`.
 * 
 * @param map               The {@link Map} being modified.
 * @param keys              An array of map keys to be filled in.
 * @param fillValue         The value to set the specified `keys` to.
 * 
 * @returns                 `map` after all of the designated `keys`
 *                          have been set to the specified `fillValue`.
 */
export function fillMap <K, V> ( map: Map<K, V>, keys: K[], fillValue: V ): Map<K, V>;
export function fillMap <
    KeyT,
    ValueT,
    T extends Map<KeyT, ValueT> | KeyT[],
    U extends (T extends Map<KeyT, ValueT> ? KeyT[] : ValueT),
    V extends (T extends Map<KeyT, ValueT> ? ValueT : undefined)
> ( mapOrKeys: T, keysOrFillValue: U, fillValueOrVoid?: V ): Map<KeyT, ValueT> {

    let map = mapOrKeys instanceof Map
        ? mapOrKeys
        : new Map<KeyT, ValueT>();
    const keys = (
        Array.isArray(mapOrKeys)
            ? mapOrKeys
            : keysOrFillValue
    ) as KeyT[];
    const fillValue = (
        Array.isArray(mapOrKeys)
            ? keysOrFillValue
            : fillValueOrVoid
    ) as ValueT;

    for (const key of keys)
        map.set(key, fillValue);

    return map;

}

/**
 * Ensure that only a single instance of the program is currently running on the current machine,
 * prompting the user for confirmation before proceeding with the operation or throwing
 * a {@link ProgramInstanceAlreadyExistsError} if the confirmation is rejected or times out. 
 * 
 * If another instance of the program is running and the user proceeds with operation,
 * the {@link RUNFILE_NAME Runfile} will be replaced with one associated with the newly-launched instance.
 * This will cause the existing instance of the program to continue operating normally until
 * `verifyOnlyOneProgramInstanceExists()` is called again, at which point the user will again
 * be prompted for confirmation to proceed or terminate the program.
 * 
 * @param checkContents Indicates whether the contents of the {@link RUNFILE_NAME Runfile}
 *                      should be checked to see if they equal to the {@link process.pid Process ID}
 *                      of the program.
 * 
 *                      When `false`, only the {@link existsSync existance} of the Runfile
 *                      is checked when determining if multiple program instances exist.
 * 
 * @returns             A promise that is settled either once the current instance of the program has
 *                      been verified to be the only running instance of the program, or once the
 *                      user accepts or rejects the {@link promptForConfirmation Confirmation Prompt} to continue.
 * 
 * @throws              If the user *rejects* the Confirmation Prompt to continue,
 *                      the promise will reject with a {@link ProgramInstanceAlreadyExistsError}.
 * 
 * @apistatus           ❌ **Private**
 */
export async function verifyOnlyOneProgramInstanceExists ( checkContents: boolean = true ): Promise<void> {

    const getRunfileProcessId = () => parseInt( readFileSync(`./${RUNFILE_NAME}`).toString() );
    const updateRunfile = () => {

        verboseLog();
        verboseLog(`Updating Program Runfile '${RUNFILE_NAME}'...`);
        writeFileSync(`./${RUNFILE_NAME}`, process.pid.toString());

    };

    let runfileAlreadyExists = existsSync(`./${RUNFILE_NAME}`);
    let existingProcessId: number | null = (runfileAlreadyExists && checkContents)
        ? getRunfileProcessId()
        : null;
    let isUniqueProgramInstance = (
        ( checkContents && existingProcessId == process.pid )
        || ( !checkContents && !runfileAlreadyExists )
    );

    if (!isUniqueProgramInstance) {
        console.log();
        console.log(ConsoleUtils.colorizeOutput(`There already appears to be an instance of the ${PROGRAM_TITLE} running!`, ConsoleUtils.ForegroundColor.YELLOW));
        console.log("Having multiple instances of the service running at once is strongly discouraged and");
        console.log("will almost certainly cause problems when attempting to re-establish the WDS Bridge.");
        console.log();
        console.log(`This can be caused by launching multiple instances of the ${PROGRAM_TITLE} at the same time,`);
        console.log("or by a previous instance of the service having been unexpectedly terminated.");
        
        if ( !(await ConfirmationPrompt.prompt("Continue anyways?")) )
            throw new ProgramInstanceAlreadyExistsError();

        if (!checkContents)
            existingProcessId = getRunfileProcessId();

        if (runfileAlreadyExists && existingProcessId !== null && existingProcessId != process.pid) {
            try {
                if ( process.kill(existingProcessId, 0) ) {
                    if ( (await ConfirmationPrompt.prompt(`Attempt to terminate the existing process (PID: ${existingProcessId})?`)) === true ) {
                        process.kill(existingProcessId, 'SIGINT'); 
                    }
                }
            }
            catch (error) {
                // Any errors thrown here will be suppressed.
            }
        }
        
        updateRunfile();
    }
    else if (!runfileAlreadyExists){
        updateRunfile();
    }
    
}


/* String Utilities */

/**
 * A namespace containing utility functions used
 * for creating, querying, and modifying `string` values.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 */
export namespace StringUtils {

    /**
     * Get the first character from the specified string.
     * 
     * @param str   The string to extract the first character from.
     * 
     * @returns     The first character in `str` or `null`
     *              if `str` is an *empty string*.
     * 
     * @apistatus   ✔️ **Public**
     * @since       `v1`
     */
    export const firstChar = ( str: string ): string | undefined => ArrayUtils.firstElement(str as unknown as string[]);
    /**
     * Get the first character from the specified string.
     * 
     * @param str   The string to extract the first character from.
     * 
     * @returns     The first character in `str` or `null`
     *              if `str` is an *empty string*.
     * 
     * @apistatus   ✔️ **Public**
     * @since       `v1`
     */
    export const lastChar = ( str: string ): string | undefined => ArrayUtils.lastElement(str as unknown as string[]);

    /**
     * {@link String.prototype.toUpperCase Capitalize} the first letter of the first word in the specified string.
     * 
     * @example
     * ucFirst("hello, world!"); // "Hello, world!" 
     * 
     * @param str   The string being capitalized.
     *
     * @returns     `str` with the first letter of the first word
     *              replaced by its {@link String.prototype.toUpperCase uppercase equivalent}.
     * 
     * @apistatus   ✔️ **Public**
     * @since       `v1`
     */
    export const ucFirst = ( str: string ) => str.replace(
        /\w/,
        ( str ) => str.toUpperCase()
    );
    /**
     * {@link String.prototype.toUpperCase Capitalize} the first letter of each word in the specified string.
     * 
     * @example
     * ucWords("a long time ago, in a galaxy far, far away...");
     * // "A Long Time Ago, In a Galaxy Far, Far Away..." 
     * 
     * @param str   The string being capitalized.
     *
     * @returns     `str` with the first letter of each distinct word
     *              replaced by its {@link String.prototype.toUpperCase uppercase equivalent}.
     * 
     * @apistatus   ✔️ **Public**
     * @since       `v1`
     */
    export const ucWords = ( str: string ) => str.replaceAll(
        /(\w)(\w+)|(^\w)/g,
        ( str, m1, m2, m3 ) => (
            typeof m1 == 'string'
                ? (m1.toUpperCase() + (m2 ?? ''))
                : m3.toUpperCase()
        )
    );

    /**
     * A helper function that makes the specified `word` plural
     * if the designated `count` does not equal `1`.
     * 
     * However, if the designated `count` is equal to `1`, 
     * then this function will return the specified `word` as-is.
     * 
     * @example
     * for (let i = 0; i < 3; i++)
     *    console.log(i, getPlural('Apple', i));
     * 
     * // Prints:
     * // 0 Apples
     * // 1 Apple
     * // 2 Apples
     * 
     * @template StringT    The inferred type of the `word` being modified.
     * @template CountT     The inferred type of the `count` being evaluated.
     * @template ReturnT    The inferred return type of the function.
     * 
     * @param word          The word being made plural.
     * @param count         The value being evaluated.
     * 
     * @returns             If the designated `count` is not equal to `1`,
     *                      returns the designated `word` with an `'s'` character
     *                      appended to the end of it.
     * 
     *                      If the designated `count` is equal to `1`,
     *                      the designated `word` will be returned as-is.
     * 
     * @apistatus           ✔️ **Public**
     * @since               `v1`
     */
    export const getPlural = <
        StringT extends string,
        CountT extends number,
        ReturnT extends (CountT extends 1 ? StringT : `${StringT}s`)
    > ( word: StringT, count: CountT ): ReturnT => `${word}${count != 1 ? 's' : ''}` as ReturnT;

}


/* Number Utilities */

/**
 * A namespace containing utility functions used
 * for rounding and formatting `number` values.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 */
export namespace NumberUtils {

    /**
     * The rounding method to use when rounding numbers using
     * the {@link toPrecision `toPrecision()`} and
     * {@link format `format()`} functions.
     * 
     * - `'round'`: *Rounds* the number to the nearest integer using {@link Math.round `Math.round()`}.
     * 
     * - `'floor'`: Rounds the number *up* to the largest integer less than or equal to the
     *              specified number using {@link Math.floor `Math.floor()`}.
     * 
     * - `'ceil'`:  Rounds the number *down* to the smallest integer less than or equal to the
     *              specified number using {@link Math.ceil `Math.ceil()`}.
     * 
     * - `'trunc'`: Truncates the number and removes all fractional digits using {@link Math.trunc `Math.trunc()`}.
     * 
     * | `NumberRoundingMethod` | Rounded Value of `Math.PI` to `4` Digits |
     * | ---------------------- | ---------------------------------------- |
     * | `round`                | `3.1416`                                 |
     * | `floor`                | `3.1415`                                 |
     * | `ceil`                 | `3.1416`                                 |
     * | `trunc`                | `3.1415`                                 |
     * 
     * @apistatus   ✔️ **Public**
     * @since       `v1`
     */
    export type RoundingMethod = 'round' | 'floor' | 'ceil' | 'trunc';

    /**
     * An object type representing *Additional {@link Intl.NumberFormatOptions Formatting Options}*
     * that can be passed to the argument-heavy overload of the {@link format `format()`} function.
     * 
     * In other words, this interface type is equivalent to {@link Intl.NumberFormatOptions}
     * with the following properties omitted:
     * - {@link Intl.NumberFormatOptions.minimumFractionDigits `minimumFractionDigits`}
     * - {@link Intl.NumberFormatOptions.maximumFractionDigits `maximumFractionDigits`}
     * - {@link Intl.NumberFormatOptions.roundingMode `roundingMode`}
     * 
     * @apistatus   ✔️ **Public**
     * @since       `v1`
     * 
     * @see {@link format `format()`}
     */
    export type AdditionalFormatOptions = Omit<Intl.NumberFormatOptions, 'minimumFractionDigits' | 'maximumFractionDigits' | 'roundingMode'>;


    /**
     * Rounds `num` to the designated `maximumFractionDigits`.
     * 
     * @example
     * numberToPrecision(Math.PI, 3);   // 3.142
     * numberToPrecision(Math.PI, 4);   // 3.1416
     * numberToPrecision(Math.PI, 5);   // 3.14159
     * 
     * @param num                   The number being transformed.
     * @param maximumFractionDigits The number of fraction digits to reduce the specified `num` to.
     * 
     * @returns                     A new number equivalent to `num` {@link Math.round rounded}
     *                              to the specified `maximumFractionDigits`.
     * 
     * @apistatus                   ✔️ **Public**
     * @since                       `v1`
     */
    export function toPrecision (
        num: number,
        maximumFractionDigits: number
    ): number;
    /**
     * Reduces `num` to the designated `maximumFractionDigits`
     * using the specified `roundingMethod`.
     * 
     * @example
     * numberToPrecision(Math.PI, 4);            // 3.1416
     * numberToPrecision(Math.PI, 4, 'round');   // 3.1416
     * numberToPrecision(Math.PI, 4, 'floor');   // 3.1415
     * numberToPrecision(Math.PI, 4, 'ceil');    // 3.1416
     * numberToPrecision(Math.PI, 4, 'trunc');   // 3.1415
     * 
     * @param num                   The number being transformed.
     * @param maximumFractionDigits The number of fraction digits to reduce the specified `num` to.
     * @param roundingMethod        The {@link RoundingMethod Rounding Method} to use.
     * 
     * @returns                     A new number equivalent to `num` reduced
     *                              to the specified `maximumFractionDigits`
     *                              using the designated `roundingMethod`.
     * 
     * @apistatus                   ✔️ **Public**
     * @since                       `v1`
     */
    export function toPrecision (
        num: number,
        maximumFractionDigits: number,
        roundingMethod?: RoundingMethod
    ): number;
    export function toPrecision (
        num: number,
        maximumFractionDigits: number,
        roundingMethod: RoundingMethod = 'round'
    ): number {

        let roundedNum = num;

        if (maximumFractionDigits > -1) {
            const multiplier = Math.pow(10, maximumFractionDigits);

            roundedNum = (Math[roundingMethod](roundedNum * multiplier) / multiplier);
        }

        return roundedNum;

    };
    
    /**
     * Create a formatted string from the specified number.
     * 
     * @param num                   The number being formatted.
     * 
     * @param maxFractionDigits     The maximum number of fractional digits the
     *                              formatted `num` should contain.
     * 
     *                              Defaults to `2`.
     * 
     * @param minFractionDigits     The minimum number of fractional digits the
     *                              formatted `num` should contain.
     * 
     *                              Defaults to `0`.
     * 
     * @param roundingMethod        The {@link RoundingMethod Rounding Method} to use.
     *  
     *                              Defaults to `'round'`.
     * 
     * @param additionalOptions     An object containing
     *                              {@link AdditionalFormatOptions Additional Formatting Options} to use.
     * 
     * @param locale                The optional {@link Intl.LocalesArgument locale} to use.
     * 
     *                              If omitted or `undefined`, uses the locale of the browser/operating system.
     * 
     * @returns                     A string containing the formatted `num` according to
     *                              the specified arguments.
     * 
     * @apistatus                   ✔️ **Public**
     * @since                       `v1`
     */
    export function format (
        num: number,
        maxFractionDigits?: number,
        minFractionDigits?: number,
        roundingMethod?: RoundingMethod,
        additionalOptions?: AdditionalFormatOptions,
        locale?: Intl.LocalesArgument
    ): string;
    /**
     * Create a formatted string from the specified number.
     * 
     * @param num                   The number being formatted.
     * 
     * @param additionalOptions     An object containing the
     *                              {@link Intl.NumberFormatOptions Formatting Options} to use.
     * 
     *                              If any of the following options are omitted, they will
     *                              use the default options specified below:
     *                              - {@link Intl.NumberFormatOptions.maximumFractionDigits `maximumFractionDigits`}: `2`
     *                              - {@link Intl.NumberFormatOptions.minimumFractionDigits `minimumFractionDigits`}: `0`
     *                              - {@link Intl.NumberFormatOptions.roundingMode `roundingMode`}: `'halfCeil'`
     * 
     * @param locale                The optional {@link Intl.LocalesArgument locale} to use.
     * 
     *                              If omitted or `undefined`, uses the locale of the browser/operating system.
     * 
     * @returns                     A string containing the formatted `num` according to
     *                              the specified `options` and `locale`.
     * 
     * @apistatus                   ✔️ **Public**
     * @since                       `v1`
     */
    export function format (
        num: number,
        options?: Intl.NumberFormatOptions,
        locale?: Intl.LocalesArgument
    ): string;
    export function format <
        T extends number | Intl.NumberFormatOptions | undefined,
        U extends (T extends Intl.NumberFormatOptions ? Intl.LocalesArgument | undefined : number | undefined),
        V extends (T extends Intl.NumberFormatOptions ? undefined : RoundingMethod | undefined),
        W extends (T extends Intl.NumberFormatOptions ? undefined : AdditionalFormatOptions | undefined),
        X extends (T extends Intl.NumberFormatOptions ? undefined : Intl.LocalesArgument | undefined),
    > (
        num: number,
        maxFractionDigitsOrOptions?: T,
        minFractionDigitsOrLocale?: U,
        roundingMethod?: V,
        additionalOptions?: W,
        locale?: X
    ): string {

        const formatLocale: Intl.LocalesArgument | undefined = (() => {

            let formatLocale: Intl.LocalesArgument | undefined = undefined;

            if (typeof maxFractionDigitsOrOptions == 'number' && isType(locale, ['string', 'object']))
                formatLocale = locale;
            else if (typeof maxFractionDigitsOrOptions == 'object' && isType(minFractionDigitsOrLocale, ['string', 'object']))
                formatLocale = minFractionDigitsOrLocale;

            return formatLocale;

        })();
        const formatOptions: Intl.NumberFormatOptions = (() => {

            let options: Intl.NumberFormatOptions = {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
                roundingMode: 'halfCeil'
            };

            if (typeof maxFractionDigitsOrOptions == 'number') {
                options.maximumFractionDigits = maxFractionDigitsOrOptions;

                if (typeof minFractionDigitsOrLocale == 'number')
                    options.minimumFractionDigits = minFractionDigitsOrLocale;
                if (typeof roundingMethod == 'string' && roundingMethod != 'round')
                    options.roundingMode = roundingMethod;
                if (typeof additionalOptions == 'object')
                    options = Object.assign(options, additionalOptions);
            }
            else if (typeof maxFractionDigitsOrOptions == 'object') {
                options = Object.assign(options, maxFractionDigitsOrOptions);
            }

            return options;

        })();

        return num.toLocaleString(formatLocale, formatOptions);

    }

}


/* Function Utilities */

/**
 * A namespace containing utility functions used
 * for working with functions and methods. 
 * 
 * @apistatus   🧪 *Experimental*
 * @since       `v1`
 */
export namespace FunctionUtils {

    export type FunctionType <
        ArgsT extends any[] = any[],
        ReturnT = any
    > = ( ( ...args: ArgsT ) => ReturnT );

    /**
     * Create a {@link Function.prototype.bind Bound Function} of `fn`
     * in which `thisArg` is bound to `this` and uses the specified `initialArgs`.
     * 
     * This function is a type-safe variant of the {@link Function.prototype.bind `bind()`}
     * method available on all {@link Function} objects. E.g.,
     * ```ts
     * const addThis = ( x: number ): number => (x + this ?? 0);
     * 
     * addThis.bind(undefined)(0);  // 0
     * bind(addThis)(0);            // 0
     * 
     * addThis.bind(10)(32);        // 42
     * bind(addThis, 10)(32);       // 42
     * 
     * addThis.bind(100, 250)();    // 350
     * bind(addThis, 100, 250)();   // 350
     * ```
     * 
     * @template ArgsT      The type of the arguments of `fn`.
     * @template ReturnT    The return type of `fn`.
     * 
     * @param fn            The function or method being {@link Function.prototype.bind bound}.
     * 
     * @param thisArg       The value to be bound to `this` in the body of `fn`.
     * 
     * @param initialArgs   Any initial arguments to pass to `fn` when being called.
     * 
     *                      These values will *preceed* any arguments passed
     *                      to the returned function during invocation.
     * 
     * @returns             A {@link Function.prototype.bind Bound Function}
     *                      of `fn` in which `thisArg` is bound to `this`
     *                      in the body of the returned function.
     * 
     *                      If any `initialArgs` are specified, they will be
     *                      bound to `fn` as well.
     * 
     * @apistatus           🧪 *Experimental*
     * @since               `v1`
     * 
     * @see {@link call `call()`}
     * @see {@link apply `apply()`}
     */
    export const bind = < ArgsT extends any[], ReturnT > (
        fn: ( ...args: ArgsT ) => ReturnT,
        thisArg?: any,
        ...initialArgs: Partial<ArgsT>
    ): typeof fn => fn.bind(thisArg, ...initialArgs);
    /**
     * {@link Function.prototype.call Calls } `fn` using the specified `args`
     * and binding `thisArg` to `this` in the body of `fn`.
     * 
     * This function is a type-safe variant of the {@link Function.prototype.call `call()`}
     * method available on all {@link Function} objects. E.g.,
     *  ```ts
     * const addThis = ( x: number ): number => (x + this ?? 0);
     * 
     * addThis.call(undefined, 0);  // 0
     * call(addThis, 0);            // 0
     * 
     * addThis.call(10, 32);        // 42
     * call(addThis, 10, 32);       // 42
     * 
     * addThis.call(100, 250);      // 350
     * call(addThis, 100, 250);     // 350
     * ```
     * 
     * This function is identical to {@link apply `apply()`} with the
     * difference being that the `args` is passed directly to `call()`
     * rather than being passed as an *array* as is the case with `apply()`. 
     * 
     * @template ArgsT      The type of the arguments of `fn`.
     * @template ReturnT    The return type of `fn`.
     * 
     * @param fn            The function or method being {@link Function.prototype.call called}.
     * 
     * @param thisArg       The value to be bound to `this` in the body of `fn`.
     * 
     * @param args          The arguments to use when {@link Function.prototype.call calling} `fn`.
     * 
     * @returns             The return value of `fn` after {@link Function.prototype.call calling}
     *                      it with the specified `args` and with `thisArg` bound to `this`
     *                      within the body of `fn`.
     * 
     * @apistatus           🧪 *Experimental*
     * @since               `v1`
     * 
     * @see {@link bind `bind()`}
     * @see {@link apply `apply()`}
     */
    export const call = < ArgsT extends any[], ReturnT > (
        fn: ( ...args: ArgsT ) => ReturnT,
        thisArg?: any,
        ...args: ArgsT
    ): ReturnT => fn.call(thisArg, ...args);
    /**
     * {@link Function.prototype.apply Invokes} `fn` using the specified
     * array of `args` and binding `thisArg` to `this` in the body of `fn`.
     * 
     * This function is a type-safe variant of the {@link Function.prototype.apply `apply()`}
     * method available on all {@link Function} objects. E.g.,
     *  ```ts
     * const addThis = ( x: number ): number => (x + this ?? 0);
     * 
     * addThis.apply(undefined, [0]);  // 0
     * apply(addThis, [0]);            // 0
     * 
     * addThis.apply(10, [32]);        // 42
     * apply(addThis, 10, [32]);       // 42
     * 
     * addThis.apply(100, [250]);      // 350
     * apply(addThis, 100, [250]);     // 350
     * ```
     * 
     * This function is identical to {@link call `call()`} with the
     * difference being that the `args` is passed as an *array* to `apply()`
     * rather than being passed directly to `call()`.
     * 
     * @template ArgsT      The type of the arguments of `fn`.
     * @template ReturnT    The return type of `fn`.
     * 
     * @param fn            The function or method being {@link Function.prototype.apply invoked}.
     * 
     * @param thisArg       The value to be bound to `this` in the body of `fn`.
     * 
     * @param args          An array containing the arguments to use
     *                      when {@link Function.prototype.apply invoking} `fn`.
     * 
     * @returns             The return value of `fn` after {@link Function.prototype.apply invoking}
     *                      it with the specified array of `args` and with `thisArg` bound to `this`
     *                      within the body of `fn`.
     * 
     * @apistatus           🧪 *Experimental*
     * @since               `v1`
     * 
     * @see {@link bind `bind()`}
     * @see {@link call `call()`}
     */
    export const apply = < ArgsT extends any[], ReturnT > (
        fn: ( ...args: ArgsT ) => ReturnT,
        thisArg?: any,
        args?: ArgsT
    ): ReturnT => fn.apply(thisArg, args);
    
}


/* Array Utilities */

/**
 * A namespace containing utility types and
 * functions used for working with *Arrays* and *Tuples*.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 */
export namespace ArrayUtils {

    /* Types */

    /**
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     */
    export type TupleElements <T extends unknown[]> = T[number];
    /**
     * Get a tuple containing all of the elements from the specified
     * tuple that follow the *first element*.
     * 
     * If `T` is not a tuple, `never` will be returned.
     * 
     * @example
     * type Foo = FollowingElements<['foo']>;                 // []
     * type Bar = FollowingElements<['foo', 'bar']>;          // ['bar']
     * type Baz = FollowingElements<['foo', 'bar', 'baz']>;   // ['bar', 'baz']
     * 
     * @template T  The tuple being evaluated.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     */
    export type FollowingElements <T extends unknown[]> = (
        T extends [unknown, ...infer U]
            ? (U extends [] ? [] : U)
            : never
    );
    /**
     * Get a tuple containing all of the elements from the specified
     * tuple that preceed the *last element*.
     * 
     * If `T` is not a tuple, `never` will be returned.
     * 
     * @example
     * type Foo = PreceedingElements<['foo']>;                 // []
     * type Bar = PreceedingElements<['foo', 'bar']>;          // ['foo']
     * type Baz = PreceedingElements<['foo', 'bar', 'baz']>;   // ['foo', 'bar']
     * 
     * @template T  The tuple being evaluated.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     */
    export type PreceedingElements <T extends unknown[]> = (
        T extends [...infer U, unknown]
            ? (U extends [] ? [] : U)
            : never
    );

    type TupleComponentsHelper <T, ResultsT extends any[] = []> = (
        T extends [...infer U, infer V]
            ? (
                U extends []
                    ? TupleComponentsHelper<[], [...ResultsT, [V]]>
                    : TupleComponentsHelper<U, [...ResultsT, T]>
            )
            : ResultsT
    );
    /**
     * Get a tuple containing the *components* of the specified tuple,
     * or a tuple containing all of the combinations of the given
     * order of elements.
     * 
     * If `T` is not a tuple, `never` will be returned.
     * 
     * @example
     * type Foo = TupleComponents<['foo', 'bar', 'baz']>;   // [['foo'], ['foo', 'bar'], ['foo', 'bar', 'baz']]
     * 
     * @template T  The tuple being evaluated.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     */
    // export type TupleComponents <T extends unknown[]> = (
    //     T extends [...infer U, infer V]
    //         ? (
    //             U extends []
    //                 ? [[V]]
    //                 : [...TupleComponents<U>, T]
    //         )
    //         : never
    // );
    export type TupleComponents <T extends unknown[]> = TupleComponentsHelper<T>;

    /**
     * Get the first element in the specified tuple.
     * 
     * If `T` is not a tuple or is an empty tuple, `never` will be returned.
     * 
     * @example
     * FirstTupleElement<[]>               // never
     * FirstTupleElement<['foo']>          // 'foo'
     * FirstTupleElement<['foo', 'bar']>   // 'foo'
     * 
     * @template T  The tuple being evaluated.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     */
    export type FirstElement <T extends unknown[]> = (
        T extends [infer U, ...unknown[]]
            ? U
            : never
    );
    /**
     * Get the next element in the specified tuple that
     * follows the *first element*, or the *second element*
     * in the specified tuple.
     * 
     * If `T` is not a tuple, is an empty tuple, or is a tuple that
     * only contains a single element, `never` will be returned.
     * 
     * @example
     * type Foo = NextElement<['foo']>;                  // never
     * type Bar = NextElement<['foo', 'bar']>;           // 'bar'
     * type Baz = NextElement<['foo', 'bar', 'baz']>;    // 'bar'
     * 
     * @template T  The tuple being evaluated.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     */
    export type NextElement <T extends unknown[]> = (
        T extends [unknown, infer U, ...unknown[]]
            ? U
            : never
        );
    /**
     * Get the previous element in the specified tuple that
     * preceeds the *last element*, or the *second-to-last element*
     * in the specified tuple.
     * 
     * If `T` is not a tuple, is an empty tuple, or is a tuple that
     * only contains a single element, `never` will be returned.
     * 
     * @example
     * type Foo = PreviousElement<['foo']>;                  // never
     * type Bar = PreviousElement<['foo', 'bar']>;           // 'foo'
     * type Baz = PreviousElement<['foo', 'bar', 'baz']>;    // 'bar'
     * 
     * @template T  The tuple being evaluated.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     */
    export type PreviousElement <T extends unknown[]> = (
        T extends [...unknown[], infer V, unknown]
            ? V
            : never
    );
    /**
     * Get the last element in the specified tuple.
     * 
     * If `T` is not a tuple or is an empty tuple, `never` will be returned.
     * 
     * @example
     * type Foo = LastElement<[]>;               // never
     * type Bar = LastElement<['foo']>;          // 'foo'
     * type Baz = LastElement<['foo', 'bar']>;   // 'bar'
     * 
     * @template T  The tuple being evaluated.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     */
    export type LastElement <T extends unknown[]> = (
        T extends [...unknown[], infer V]
            ? V
            : never
    );
    /**
     * Extract the sole element from a tuple that contains
     * only a single element.
     * 
     * If `T` is not a tuple, is an empty tuple, or is a tuple that
     * contains more than one element, `never` will be returned.
     * 
     * @example
     * type Foo = SoleElement<[]>;               // never
     * type Bar = SoleElement<['foo']>;          // 'foo'
     * type Baz = SoleElement<['foo', 'bar']>;   // never
     * 
     * @template T  The tuple being evaluated.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     */
    export type SoleElement <T extends unknown[]> = (
        T extends [infer U]
            ? U
            : never
    );
        
    /**
     * A helper type that ensures that `T` is an array type,
     * wrapping `T` in a single-element tuple if it is not.
     * 
     * @example
     * type A = ArrayifyType<string>;                 // [string]
     * type B = ArrayifyType<42>;                     // [42]
     * type C = ArrayifyType<number[]>;               // number[]
     * type D = ArrayifyType<['Hello', 'World!']>;    // ['Hello', 'World!']
     * 
     * @apistatus   ✔️ **Public**
     * @since       `v1`
     */
    export type ArrayifyType <T> = (
        T extends unknown[]
            ? T
            : [T]
    );

    /**
     * A helper type for the {@link TupleFromTypes} type that converts
     * `T` to an appropriate tuple type.
     * 
     * @template T              The value being converted to a tuple.
     * 
     * @template AllowNeverT    Indicates whether `never` should be treated
     *                          as a valid tuple element or as an empty tuple.
     * 
     * @private
     * @see {@link TupleFromTypes}
     */
    type TupleFromTypesHelper <T, AllowNeverT extends boolean> = (
        [T] extends [never]
            ? (
                AllowNeverT extends true
                    ? [never]
                    : []
            )
            : ArrayifyType<T>
    );
    /**
     * Create a tuple from `T` and `U`, which can be either tuples,
     * tuple elements, or a combination of the two.
     * 
     * @example
     * type A = TupleFromTypes<'foo', 'bar'>                // ['foo', 'bar']
     * type B = TupleFromTypes<'foo', ['bar', 'baz']>       // ['foo', 'bar', 'baz']
     * type C = TupleFromTypes<['foo', 'bar'], 'baz'>       // ['foo', 'bar', 'baz']
     * type D = TupleFromTypes<['foo', 'bar'], ['baz']>     // ['foo', 'bar']
     * type E = TupleFromTypes<'foo', never>                // ['foo']
     * type F = TupleFromTypes<'foo', never, true>          // ['foo', never]
     * 
     * @template T              The first value or tuple.
     * 
     * @template U              The second value or tuple.
     * 
     * @template AllowNeverT    Indicates whether `never` should be treated
     *                          as a valid tuple element or as an empty tuple.
     * 
     *                          When `false`, `never` will be treated as though
     *                          an empty tuple (`[]`) was specified. This is the default behavior.
     * 
     *                          When `true`, `never` will be added to the resulting
     *                          tuple just as any other type would.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     */
    export type TupleFromTypes <T, U, AllowNeverT extends boolean = false> = [
        ...TupleFromTypesHelper<T, AllowNeverT>,
        ...TupleFromTypesHelper<U, AllowNeverT>
    ];


    /* Functions */

    /**
     * Get the first element in `arr`.
     * 
     * @example
     * firstElement(['foo', 'bar', 'baz']);     // 'foo'
     * firstElement([true, false]);             // true
     * firstElement([]);                        // undefined
     * 
     * @template ArrayT     The type of the `arr` argument.
     * @template ReturnT    The inferred function return type.
     * 
     * @param arr           The array or tuple being evaluated.
     * 
     * @returns             The first element in `arr`.
     * 
     *                      If `arr` is an empty array, returns `undefined`.
     * 
     * @apistatus           ✔️ **Public**
     * @since               `v1`
     */
    export const firstElement = <
        ArrayT extends readonly unknown[],
        ReturnT extends (ArrayT extends readonly [infer U, ...unknown[]] ? U : (ArrayT extends readonly (infer V)[] ? V : never))
    > ( arr: ArrayT ): ReturnT => (arr?.length === 0 ? undefined : arr[0]) as ReturnT;
    /**
     * Get the last element in `arr`.
     * 
     * @example
     * lastElement(['foo', 'bar', 'baz']);     // 'baz'
     * lastElement([true, false]);             // false
     * lastElement([]);                        // undefined
     * 
     * @template ArrayT     The type of the `arr` argument.
     * @template ReturnT    The inferred function return type.
     * 
     * @param arr           The array or tuple being evaluated.
     * 
     * @returns             The last element in `arr`.
     * 
     *                      If `arr` is an empty array, returns `undefined`.
     * 
     * @apistatus           ✔️ **Public**
     * @since               `v1`
     */
    export const lastElement = <
        T extends readonly unknown[],
        ReturnT extends (T extends readonly [...unknown[], infer U] ? U : (T extends readonly (infer V)[] ? V : never))
    > ( arr: T ): ReturnT => (arr?.length === 0 ? undefined : arr[arr.length - 1]) as ReturnT;

    /**
     * Wrap the specified value in an array.
     * 
     * If the specified value is an array, it will *not* be
     * wrapped by another array and the original array will be returned instead.
     * 
     * The main purpose of this function is to aid in the implementation
     * of functions that accept either a single value or an array of values.
     * 
     * @example
     * arrayify('foo').concat(arrayify(['bar', 'baz'])); // ['foo', 'bar', 'baz']
     * 
     * @template T          The base return type of the `x` argument.
     * @template ReturnT    The inferred function return type.
     * 
     * @param x             The value being arrayified.
     * 
     * @returns             An array of type `T`.
     * 
     *                      If `x` is not an `array`, an array containing `x`
     *                      and only `x` will be returned.
     * 
     *                      If `x` is an array, it will be returned as-is.
     * 
     * @apistatus           ✔️ **Public**
     * @since               `v1`
     */
    export const arrayify = <T> ( x: T ): ArrayifyType<T> => (Array.isArray(x) ? x : [x]) as ArrayifyType<T>;

    /**
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     */
    export function deepEquals <
        T extends any[],
        U extends any[],
        ReturnT extends (
            [TupleComponents<T>] extends [never]
                ? boolean
                : (
                    [TupleComponents<U>] extends [never]
                        ? boolean
                        : (T extends U ? true : false)
                )
        )
    > ( x: T, y: U ): ReturnT {

        if (x.length != y.length)
            return false as ReturnT;

        for (let i = 0; i < x.length && i < y.length; i++) {
            if (Array.isArray(x[i])) {
                if (Array.isArray(y[i])) {
                    if ( !deepEquals(x[i], y[i]) )
                        return false as ReturnT;
                }
                else {
                    return false as ReturnT;
                }
            }
            else {
                if (x[i] !== y[i])
                    return false as ReturnT;
            }
        }

        return true as ReturnT;

    }

    /**
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     */
    export function contains <
        ArrayT extends any[],
        ValueT,
        ReturnT extends (
            [TupleComponents<ArrayT>] extends [never]
                ? boolean
                : (ValueT extends TupleElements<ArrayT> ? true : false)
        )
    > ( arr: ArrayT, value: ValueT ): ReturnT {

        for (let i = 0; i < arr.length; i++)
            if (thisModule.deepEquals(arr[i], value))
                return true as ReturnT;

        return false as ReturnT;

    }

    /**
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     */
    export function pushUniqueValue <
        ArrayT extends any[],
        ValueT extends (
            [TupleComponents<ArrayT>] extends [never]
                ? (
                    ArrayT extends (infer ArrayElementT)[]
                        ? ArrayElementT
                        : any
                )
                : any
        ),
        ReturnT extends (
            [TupleComponents<ArrayT>] extends [never]
                ? ArrayT
                : (
                    ValueT extends TupleElements<ArrayT>
                        ? ArrayT
                        : TupleFromTypes<ArrayT, ValueT>
                )
        )
    > ( arr: ArrayT, value: ValueT ): ReturnT {

        if ( !contains(arr, value) )
            arr.push(value);

        return arr as unknown as ReturnT;

    }

    export function toListStr ( arr: any[], andor: 'and' | 'or' = 'and' ): string {

        if (!arr)
            return "";

        switch (arr.length) {
            
            case 0:
                return "";
            case 1:
                return arr[0];
            case 2:
                return `${arr[0]} ${andor} ${arr[1]}`;

            default: {
                let listStr = "";

                for (let i = 0; i < arr.length; i++)
                    listStr += `${i < (arr.length - 2) ? ',' : `, ${andor}`} ${arr[i]}`;

                return listStr;
            }

        }

    }

}


/* Object Utilities */

/**
 * A namespace containing utility types
 * and functions for working with *Classes* and *Objects*.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 */
export namespace ObjectUtils {

    /* Types */
    // General Object Utility Types

    export type ExtractObjectType <T> = Exclude<
        Extract<T, object>,
        ObjectBacked
    >;
    export type ExcludeObjectType <T> = Extract<T, NonObject>;

    export type ExtractFromObject <ObjectT extends object, ValueT> = Extract<
        ObjectT,
        { [K in SimpleObjectKeyType]: ValueT }
    >;
    export type ExcludeFromObject <ObjectT extends object, ValueT> = Exclude<
        ObjectT,
        { [K in SimpleObjectKeyType]: ValueT }
    >;

    /**
     * An object type representing a simple {@link Record}
     * comprised of the keys and values of `T`.
     *
     * @template T  The object being transformed into a `Record`.
     * 
     * @apistatus   ✔️ **Public**
     * @since       `v1`
     */
    export type ObjectRecord <T extends object> = {
        [Property in keyof T]: T[Property]
    };
    /**
     * Extract from `T` all of the *Methods*,
     * or all of the properties that are *callable*.
     * 
     * @example
     * interface Foo {
     *    foo: number;
     *    bar (): number;
     *    baz: string;
     * }
     * 
     * interface Bar extends ExtractMethods<Foo> {}
     * // {
     * //    bar (): number;
     * // }
     * 
     * @apistatus   ✔️ **Public**
     * @since       `v1`
     */
    export type PickMethods <T extends object> = {
        [
            K in keyof T as T[K] extends FunctionUtils.FunctionType
                ? K
                : never
        ]: T[K];
    };

    type PickMethodsRecursiveHelper <T> = (
        ExtractObjectType<T> extends infer O
            ? (
                [O] extends [never]
                    ? T
                    : {
                        [
                            K in keyof O as (
                                [Extract<Exclude<O[K], unknown[]>, object>] extends [never]
                                    ? never
                                    : K
                            )
                        ]: PickMethodsRecursiveHelper<O[K]>;
                    } extends infer R
                        ? {
                            [
                                K in keyof R as (
                                    R[K] extends FunctionUtils.FunctionType
                                        ? K
                                        : (
                                            {} extends R[K]
                                                ? never
                                                : K
                                        )
                                )
                            ]: R[K]
                        } | ExcludeObjectType<T>
                        : never
            )
            : never
    );
    export type PickMethodsRecursive <T extends object> = (
        PickMethodsRecursiveHelper<T> extends infer O
            ? (
                [O] extends [never]
                    ? {}
                    : O
            )
            : never
    );

    type ReadonlyRecursiveHelper <T> = (
        ExtractObjectType<T> extends infer O
            ? (
                [O] extends [never]
                    ? T
                    : {
                        +readonly [K in keyof O]: ReadonlyRecursiveHelper<O[K]>;
                    } | ExcludeObjectType<T>
            )
            : never
    );
    export type ReadonlyRecursive <T extends object> = ReadonlyRecursiveHelper<T>;
    // export type ReadonlyRecursive <ObjectT extends object, RecursiveT extends boolean = false> = (
    //     {
    //         +readonly [K in keyof ObjectT]: (
    //             ObjectT[K] extends object
    //                 ? ReadonlyRecursive<ObjectT[K], true>
    //                 : ObjectT[K]
    //         );
    //     } extends infer O
    //         ? (
    //             RecursiveT extends false
    //                 ? ExpandObjectTypeRecursively<O>
    //                 : O
    //         )
    //         : never
    // );
    export type RemoveReadonly <T> = (
        T extends object
            ? {
                -readonly [K in keyof T]: T[K];
            }
            : never
    );

    type RemoveReadonlyRecursiveHelper <T> = (
        ExtractObjectType<T> extends infer O
            ? (
                [O] extends [never]
                    ? T
                    : {
                        -readonly [K in keyof O]: RemoveReadonlyRecursiveHelper<O[K]>;
                    } | ExcludeObjectType<T>
            )
            : never
    );
    export type RemoveReadonlyRecursive <ObjectT extends object> = RemoveReadonlyRecursiveHelper<ObjectT>;
    // export type RemoveReadonlyRecursive <ObjectT extends object, RecursiveT extends boolean = false> = (
    //     {
    //         -readonly [K in keyof T]: (
    //             T[K] extends object
    //                 ? RemoveReadonlyRecursive<T[K], true>
    //                 : T[K]
    //         );
    //     } extends infer O
    //         ? (
    //             RecursiveT extends false
    //                 ? ExpandObjectTypeRecursively<O>
    //                 : O
    //         )
    //         : never
    // );


    // Function-Specific Types

    type PartialRecursiveHelper <T> = (
        ExtractObjectType<T> extends infer O
            ? (
                [O] extends [never]
                    ? T
                    : {
                        [K in keyof O]+?: PartialRecursiveHelper<O[K]>;
                    } | ExcludeObjectType<T>
            )
            : never
    );
    export type PartialRecursive <T extends object> = PartialRecursiveHelper<T>;

    type RequiredRecursiveHelper <T> = (
        ExtractObjectType<T> extends infer O
            ? (
                [O] extends [never]
                    ? T
                    : {
                        [K in keyof O]-?: RequiredRecursiveHelper<O[K]>;
                    } | ExcludeObjectType<T>
            )
            : never
    );
    export type RequiredRecursive <T extends object> = RequiredRecursiveHelper<T>;

    export type GenericNestedObjectCallbackFunction <CallbackReturnT> = (
        key: DynamicObjectKeyType,
        value: unknown,
        obj: object,
        property: SimpleObjectKeyType
    ) => CallbackReturnT;
    /**
     * A callback function passed to the {@link forNestedProperty `forNestedProperty()`}
     * and {@link forEachNestedProperty `forEachNestedProperty()`} functions to
     * query and manipulate arbitrary *Nested Elements* within {@link ComplexObject Complex Objects}.
     * 
     * @example
     * const foo = {
     *    bar: {
     *       foobar: 'Hello, World!',
     *       baz: {
     *          foobaz: 42
     *       }
     *    }
     * };
     * const cb: NestedObjectCallbackFunction = (key, value, obj, property): string  => {
     *    
     *    console.log(`Processing Property 'property' (${key.join('.')}) with a value of`, value);
     *    obj[`${property}Value`] = value;
     *    return (typeof value);
     * 
     * }
     * 
     * console.log( "Result:", forEachNestedProperty(cb, [['bar', 'foobar'], ['bar', 'baz', 'foobaz']]) );
     * // Prints:
     * // Processing Key 'foobar' (bar.foobar) with a value of 'Hello, World!'
     * // Processing Key 'foobaz' (bar.baz.foobaz) with a value of 42
     * // Result: {
     * //    bar: {
     * //       foobar: 'string',
     * //       baz: {
     * //         foobaz: 'number'
     * //       }
     * //    }
     * // }
     * 
     * @template ObjectT            The {@link ComplexObject Complex Object Type} being
     *                              queried and/or modified.
     * 
     * @template KeyT              The type of the {@link NestedObjectKey Nested Object Key(s)}
     *                              in `ObjectT` that are to be iterated over and passed to
     *                              the callback function.
     * 
     * @template CallbackReturnT    The return type of the callback function.
     * 
     * @param key                   The {@link NestedObjectKey Nested Object Key}
     *                              in `ObjectT` currently being processed.
     * 
     * @param value                 The value of the `key` currently being processed.
     * 
     * @param obj                   The *Nested Object* currently being processed.
     *          
     *                              This object will always originate from the
     *                              *returned object* rather than the *original object*,
     *                              making it possible to modify the property and/or
     *                              the returned nested object.
     * 
     * @param property              The key in `obj` corresponding to the `key`.
     * 
     *                              In other words, `property` is the *Trailing Component*
     *                              of `key`.
     * 
     *                              E.g., `'baz'` of `['foo', 'bar', 'baz']`.
     * 
     * @apistatus                   🧪 *Experimental*
     * @since                       `v1`
     * 
     * @see {@link forNestedProperty `forNestedProperty()`}
     * @see {@link forEachNestedProperty `forEachNestedProperty()`}
     */
    export type NestedObjectCallbackFunction <
        ObjectT extends object,
        KeyT extends DynamicObjectKey<ObjectT>,
        CallbackReturnT,
        PropertyT extends SimpleObjectKey<ObjectT> = (
            ArrayUtils.LastElement<ArrayUtils.ArrayifyType<KeyT>> extends infer K
                ? (K extends SimpleObjectKey<ObjectT> ? K : never)
                : never
        )
    > = (
        key: KeyT,
        value: ExtractNestedObjectValue<ObjectT, KeyT>,
        obj: ReplaceInObject<
            ExtractNestedObject<ObjectT, KeyT>,
            PropertyT,
            any
        >,
        property: PropertyT
    ) => CallbackReturnT;

    /**
     * Represents the direction to move when traversing an
     * object's {@link adjacentKey properties} and {@link adjacentValue values}
     * using the {@link adjacentKey `adjacentObjectKey()`} and
     * {@link adjacentValue `adjacentObjectValue()`} functions.
     * 
     * @apistatus   ✔️ **Public**
     * @since       `v1`
     * 
     * @see {@link adjacentKey `adjacentObjectKey()`}
     * @see {@link adjacentValue `adjacentObjectValue()`}
     */
    export type TraversalDirection = 'next' | 'previous';


    // Simple Object Types

    /**
     * An object type representing any {@link TrueObject True Object}
     * that does not itself contain another True Object.
     * 
     * This is in contrast to a {@link ComplexObject Complex Object}, which represents
     * any True Object that itself contains another True Object.
     * 
     * To test if a type is a `SimpleObject`, use the {@link IsSimpleObjectT} helper type.
     * 
     * @example
     * const foo = { a: 1, b: 2, c: 3 };
     * const bar = { foobar: true };
     * const baz = { xyz: 'abc' };
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link ComplexObject}
     * @see {@link IsSimpleObjectT}
     */
    export type SimpleObject = Record<ObjectKey, NonObject>;
    /**
     * The base type of a {@link SimpleObjectKey}, or an object key
     * that can only refer to elements within a {@link SimpleObject Simple Object}.
     * 
     * The generic union variant of this type is {@link SimpleObjectKey}.
     * 
     * This is the opposite of a {@link ComplexObjectKeyType},
     * which can represent properties within {@link ComplexObject Complex Objects}.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link SimpleObject}
     * @see {@link SimpleObjectKey}
     * @see {@link ComplexObjectKeyType}
     */
    export type SimpleObjectKeyType = ObjectKey;
    /**
     * A union type representing a *Simple Object Key*, or an object key
     * that can only refer to elements within a {@link SimpleObject Simple Object}.
     * 
     * The non-generic base variant of this type is {@link SimpleObjectKeyType}.
     * 
     * This is in contrast to a {@link ComplexObjectKey *Complex Object Key*},
     * which can refer to elements within {@link ComplexObject Complex Objects}.
     * 
     * @template T  The {@link TrueObject True Object} the keys
     *              are to be extracted from.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link SimpleObject}
     * @see {@link SimpleObjectKeyType}
     * @see {@link ComplexObjectKey}
     */
    export type SimpleObjectKey <T extends object> = keyof T;

    /**
     * Check if `T` is considered to be a {@link SimpleObject *Simple Object*} or not.
     * 
     * @template T  The {@link TrueObject True Object} being tested.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link SimpleObject}
     * @see {@link IsComplexObjectT}
     */
    export type IsSimpleObjectT <T extends object> = (
        [ExtractObjectType<T>] extends [SimpleObject]
            ? true
            : false
    );

    /**
     * Make all of the specified properties in the designated object {@link Partial `optional`}.
     * 
     * @template ObjectT        The object type being modified.
     * 
     * @template OptionalKeysT  A union of keys from `ObjectT` that are
     *                          to be made {@link Partial `optional`}.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     * 
     * @see {@link MakeOptionalExcept}
     * @see {@link MakeRequired}
     * @see {@link MakeReadonly}
     */
    export type MakeOptional <ObjectT extends object, OptionalKeysT extends keyof ObjectT> = (
          Omit< ObjectT, OptionalKeysT >
        & Partial< Pick<ObjectT, OptionalKeysT> >
    );
    /**
     * Make all of the specified properties in the designated object {@link Required `required`}.
     * 
     * @template ObjectT        The object type being modified.
     * 
     * @template RequiredKeysT  A union of keys from `ObjectT` that are
     *                          to be made {@link Required `required`}.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     * 
     * @see {@link MakeRequiredExcept}
     * @see {@link MakeOptional}
     * @see {@link MakeReadonly}
     */
    export type MakeRequired <ObjectT extends object, RequiredKeysT extends keyof ObjectT> = (
          Omit< ObjectT, RequiredKeysT >
        & Required< Pick<ObjectT, RequiredKeysT> >
    );
    /**
     * Make all of the specified properties in the designated object {@link Readonly `readonly`}.
     * 
     * @template ObjectT        The object type being modified.
     * 
     * @template ReadonlyKeysT  A union of keys from `ObjectT` that are
     *                          to be made {@link Readonly `readonly`}.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     * 
     * @see {@link MakeReadonlyExcept}
     * @see {@link MakeOptional}
     * @see {@link MakeRequired}
     */
    export type MakeReadonly <ObjectT extends object, ReadonlyKeysT extends keyof ObjectT> = (
          Omit< ObjectT, ReadonlyKeysT >
        & Readonly< Pick<ObjectT, ReadonlyKeysT> >
    );
    /**
     * Make all of the specified properties in the designated object *Nullable*.
     * 
     * In other words, adds `null` and `undefined` to the union
     * of permitted types for each of the specified properties.
     * 
     * @template ObjectT        The object type being modified.
     * 
     * @template NullableKeysT  A union of keys from `ObjectT` that are
     *                          to be made *Nullable*.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     * 
     * @see {@link MakeNullableExcept}
     * @see {@link MakeNonNullable}
     */
    export type MakeNullable <ObjectT extends object, NullableKeysT extends keyof ObjectT> = ({
        [K in keyof ObjectT]: K extends NullableKeysT
            ? ObjectT[K] | Nullable
            : ObjectT[K];
    });
    /**
     * Make all of the specified properties in the designated object *Non-Nullable*.
     * 
     * In other words, removes `null` and `undefined` from the union
     * of permitted types for each of the specified properties.
     * 
     * @template ObjectT            The object type being modified.
     * 
     * @template NonNullableKeysT   A union of keys from `ObjectT` that are
     *                              to be made *Non-Nullable*.
     * 
     * @apistatus                   🧪 *Experimental*
     * @since                       `v1`
     * 
     * @see {@link MakeNonNullableExcept}
     * @see {@link MakeNullable}
     */
    export type MakeNonNullable <ObjectT extends object, NonNullableKeysT extends keyof ObjectT> = (
          Omit< ObjectT, NonNullableKeysT >
        & NonNullable< Pick<ObjectT, NonNullableKeysT> >
    );

    /**
     * Make all of the properties in the designated object {@link Partial `optional`}
     * except for those that are explicitly specified.
     * 
     * @template ObjectT        The object type being modified.
     * 
     * @template RequiredKeysT  A union of keys from `ObjectT` that are **not**
     *                          to be made {@link Partial `optional`}.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     * 
     * @see {@link MakeOptional}
     * @see {@link MakeRequiredExcept}
     * @see {@link MakeReadonlyExcept}
     */
    export type MakeOptionalExcept <ObjectT extends object, RequiredKeysT extends keyof ObjectT> = (
          Pick< ObjectT, RequiredKeysT >
        & Partial< Omit<ObjectT, RequiredKeysT> >
    );
    /**
     * Make all of the specified properties in the designated object {@link Required `required`}
     * except for those explicitly specified.
     * 
     * @template ObjectT        The object type being modified.
     * 
     * @template RequiredKeysT  A union of keys from `ObjectT` that are **not**
     *                          to be made {@link Required `required`}.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     * 
     * @see {@link MakeRequired}
     * @see {@link MakeOptionalExcept}
     * @see {@link MakeReadonlyExcept}
     */
    export type MakeRequiredExcept <ObjectT extends object, RequiredKeysT extends keyof ObjectT> = (
          Pick< ObjectT, RequiredKeysT >
        & Required< Omit<ObjectT, RequiredKeysT> >
    );
    /**
     * Make all of the specified properties in the designated object {@link Readonly `readonly`}
     * except for those explicitly specified.
     * 
     * @template ObjectT        The object type being modified.
     * 
     * @template ReadonlyKeysT  A union of keys from `ObjectT` that are **not**
     *                          to be made {@link Readonly `readonly`}.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     * 
     * @see {@link MakeReadonly}
     * @see {@link MakeOptionalExcept}
     * @see {@link MakeRequiredExcept}
     */
    export type MakeReadonlyExcept <ObjectT extends object, ReadonlyKeysT extends keyof ObjectT> = (
          Pick< ObjectT, ReadonlyKeysT >
        & Readonly< Omit<ObjectT, ReadonlyKeysT> >
    );
    /**
     * Make all of the specified properties in the designated object *Nullable*
     * except for those explicitly specified.
     * 
     * In other words, adds `null` and `undefined` to the union
     * of permitted types for each of the properties in `ObjectT`
     * except for those specified by `NonNullableKeysT`.
     * 
     * @template ObjectT            The object type being modified.
     * 
     * @template NonNullableKeysT   A union of keys from `ObjectT` that are **not**
     *                              to be made *Nullable*.
     * 
     * @apistatus                   🧪 *Experimental*
     * @since                       `v1`
     * 
     * @see {@link MakeNullable}
     * @see {@link MakeNonNullableExcept}
     */
    export type MakeNullableExcept <ObjectT extends object, NonNullableKeysT extends keyof ObjectT> = ({
        [K in keyof ObjectT]: K extends NonNullableKeysT
            ? ObjectT[K]
            : ObjectT[K] | Nullable;
    });
    /**
     * Make all of the specified properties in the designated object *Non-Nullable*
     * except for those explicitly specified.
     * 
     * In other words, removes `null` and `undefined` from the union
     * of permitted types for each of the properties in `ObjectT`
     * except for those specified by `NullableKeysT`.
     * 
     * @template ObjectT        The object type being modified.
     * 
     * @template NullableKeysT  A union of keys from `ObjectT` that are **not**
     *                          to be made *Non-Nullable*.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     * 
     * @see {@link MakeNonNullable}
     * @see {@link MakeNullableExcept}
     */
    export type MakeNonNullableExcept <ObjectT extends object, NullableKeysT extends keyof ObjectT> = (
          Pick< ObjectT, NullableKeysT >
        & NonNullable< Omit<ObjectT, NullableKeysT> >
    );

    /**
     * Replace the properties of `ObjectT` specified by `KeysT`
     * with the designated `ReplacementValueT`.
     * 
     * In contrast to {@link ReplaceInNestedObject}, this type can only
     * replace top-level keys in the specified object.
     * 
     * @example
     * interface Test {
     *    foo: string,
     *    bar: number,
     *    baz: boolean
     * };
     * 
     * ReplaceInObject<Test, 'foo' | 'baz', null>;
     * // Returns:
     * // {
     * //   foo: null
     * //   bar: number
     * //   baz: null
     * // }
     * 
     * @template ObjectT            The object being modified.
     * @template ReplacedKeysT      The keys being replaced in `ObjectT`.
     * @template ReplacementValueT  The value to use for the specified `ReplacedKeyT`.
     * 
     * @apistatus                   🧪 *Experimental*
     * @since                       `v1`
     * 
     * @see {@link ReplaceInNestedObject}
     */
    export type ReplaceInObject <
        ObjectT extends object,
        ReplacedKeysT extends SimpleObjectKey<ObjectT>,
        ReplacementValueT
    > = ExpandObjectType<
          Omit<ObjectT, ReplacedKeysT>
        & Record<ReplacedKeysT, ReplacementValueT>
    >;

    /**
     * A type representing the specified object with all of the
     * designated properties set to the specified value.
     * 
     * New properties will be added to the object type while
     * existing properties will be replaced with the new type.
     * 
     * @template ObjectT        The type of the object being filled.
     * @template PropertiesT    The type of the array of property keys to be filled.
     * @template ValueT         The type of the value to fill the specified `properties` with.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     */
    export type FilledObjectType <
        ObjectT extends object,
        PropertiesT extends (keyof ObjectT | ObjectKey)[],
        ValueT
    > = (
          Omit<ObjectT, PropertiesT[number]>
        & Record<PropertiesT[number], ValueT>
    );


    // Complex Object Types

    /**
     * An object type representing any {@link TrueObject True Object}
     * that itself contains another True Object.
     * 
     * This is in contrast to a {@link SimpleObject Simple Object}, which represents
     * any True Object that does not itself contain another True Object.
     * 
     * ## Don't use `T extends ComplexObject`
     * Because of how TypeScript unions work, nested objects that are members of
     * a union containing one or more non-object types will *not* be considered
     * to be a nested object and may cause `T extends ComplexObject` to evaluate to `false`.
     * 
     * E.g.,
     * ```ts
     * { foo: { bar: 1 } | null } extends ComplexObject ? true : false;     // false;
     * ```
     * 
     * Instead, use the {@link IsComplexObjectT} helper type in place of
     * `T extends ComplexObject` wherever possible.
     * 
     * @example
     * const foo = {
     *    a: {
     *       b: {
     *          c: true
     *       }
     *    }
     * };
     * const bar = {
     *    foobar: {}
     * };
     * const baz = {
     *    abc: {
     *       a: 1,
     *       b: 2,
     *       c: 3
     *    }
     * };
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link SimpleObject}
     * @see {@link IsComplexObjectT}
     */
    export type ComplexObject = Record<ObjectKey, TrueObject>;

    /**
     * Check if `T` is considered to be a {@link ComplexObject *Complex Object*} or not.
     * 
     * @template T  The {@link TrueObject True Object} being tested.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link ComplexObject}
     * @see {@link IsSimpleObjectT}
     * @see {@link HasRequiredNestedObjectT}
     * @see {@link HasOptionalNestedObjectT}
     */
    export type IsComplexObjectT <T extends object> = (
        [ExtractObjectType<T>] extends [SimpleObject]
            ? false
            : true
    );
    export type IsOptionalObjectType <T extends object> = (
        {} extends Exclude<T, { [K in SimpleObjectKeyType]: undefined }>
        // {} extends { [K in keyof T as undefined extends T[K] ? never : K]: T[K] }
            ? true
            : false
    );

    /**
     * Check if `T` contains one or more *Required Nested Objects*, or
     * {@link TrueObject True Objects} that are **guaranteed** to be in the object.
     * 
     * @template T  The {@link TrueObject True Object} being tested.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link IsComplexObjectT}
     * @see {@link HasOptionalNestedObjectT}
     * @see {@link RequiredNestedObjectKey}
     */
    export type HasRequiredNestedObjectT <T extends object> = (
        [T] extends [ComplexObject]
            ? true
            : false
    );
    /**
     * Check if `T` contains one or more *Optional Nested Objects*, or
     * {@link TrueObject True Objects} that are **not** guaranteed to be in the object.
     * 
     * @template T  The {@link TrueObject True Object} being tested.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link IsComplexObjectT}
     * @see {@link HasRequiredNestedObjectT}
     * @see {@link OptionalNestedObjectKey}
     */
    export type HasOptionalNestedObjectT <T extends object> = IsComplexObjectT< Exclude<T, ComplexObject> >;

    /**
     * Replace the properties of `ObjectT` specified by `KeysT`
     * with the designated `ReplacementValueT`.
     * 
     * In contrast to {@link ReplaceInObject}, this type can replace keys
     * at any depth in the specified object.
     * 
     * @example
     * interface Test {
     *    foo: {
     *       foobar: string
     *    },
     *    bar: number,
     *    baz: boolean
     * };
     * 
     * ReplaceInObject<Test, ['foo', 'foobar'] | 'baz', null>;
     * // Returns:
     * // {
     * //   foo: {
     * //      foobar: null
     * //   }
     * //   bar: number
     * //   baz: null
     * // }
     * 
     * @template ObjectT            The type of the object being modified.
     * @template ReplacedKeysT      The type of the keys being replaced in `ObjectT`.
     * @template ReplacementValueT  The type of the value to use for the specified `KeysT`.
     * 
     * @apistatus                   🧪 *Experimental*
     * @since                       `v1`
     * 
     * @see {@link ReplaceInObject}
     */
    export type ReplaceInNestedObject <
        ObjectT extends object,
        ReplacedKeysT extends DynamicObjectKey<ObjectT>,
        ReplacementValueT
    > = ExpandObjectTypeRecursively<
          OmitFromNestedObject<ObjectT, ReplacedKeysT>
        & RecordNestedObject<ReplacedKeysT, ReplacementValueT>
    >;

    /**
     * The base type of a {@link ComplexObjectKey}, or an object key
     * that can refer to elements within a {@link ComplexObject Complex Object}.
     * 
     * The generic union variant of this type is {@link ComplexObjectKey}.
     * 
     * This is the opposite of a {@link SimpleObjectKeyType},
     * which can only represent properties within {@link SimpleObject Simple Objects}.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link ComplexObject}
     * @see {@link ComplexObjectKey}
     * @see {@link SimpleObjectKeyType}
     */
    export type ComplexObjectKeyType = ObjectKey[];
    
    type ComplexObjectKeyHelper <
        T,
        BaseKeyT extends ObjectKey[] = never,
        ResultsT extends ObjectKey[] = never
    > = (
        IsAnyType<T> extends false
            ? (
                ExtractObjectType<T> extends infer O
                    ? (
                        [O] extends [never]
                            ? ResultsT
                            : {
                                [K in keyof O]-?: ComplexObjectKeyHelper<
                                    O[K],
                                    ArrayUtils.TupleFromTypes<BaseKeyT, K>,
                                    ArrayUtils.TupleFromTypes<BaseKeyT, K> | ResultsT
                                >
                            }[keyof O]
                    )
                    : ResultsT
            )
            : ObjectKey[]
    );
    /**
     * A union type representing a *Complex Object Key*, or an object key
     * that can refer to elements within a {@link ComplexObject Complex Object}.
     * 
     * The non-generic base variant of this type is {@link ComplexObjectKeyType}.
     * 
     * This is in contrast to a {@link SimpleObjectKey *Simple Object Key*},
     * which can only refer to elements within {@link SimpleObject Simple Objects}.
     * 
     * Note that a *Complex Object Key* is **not** the same as
     * a {@link NestedObjectKey *Nested Object Key*}, as only the
     * former of which contains *all* of the possible keys in the Complex Object,
     * while the latter is limited to those that are *nested* in the root object.
     * 
     * @template T  The {@link TrueObject True Object} the nestable keys
     *              are to be extracted from.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link ComplexObject}
     * @see {@link ComplexObjectKeyType}
     * @see {@link ComplexObjectKey}
     * @see {@link NestedObjectKey}
     */
    export type ComplexObjectKey <T extends object> = ComplexObjectKeyHelper<T>;
    // export type ComplexObjectKey <T extends TrueObject> = {
    //     [K in keyof T]-?: (
    //         [Extract<T[K], TrueObject>] extends [never]
    //             ? [K]
    //             : [K] | ArrayUtils.TupleFromTypes<K, ComplexObjectKey<Extract<T[K], TrueObject>>>
    //     )
    // }[keyof T];

    /**
     * The base type of a {@link DynamicObjectKey}, or an object key
     * that can refer to elements within a {@link SimpleObject Simple Object}
     * or {@link ComplexObject Complex Object}.
     * 
     * The generic union variant of this type is {@link DynamicObjectKey}.
     * 
     * This type is effectively a union of {@link SimpleObjectKeyType} and {@link ComplexObjectKeyType}.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link SimpleObject}
     * @see {@link ComplexObject}
     * @see {@link SimpleObjectKeyType}
     * @see {@link ComplexObjectKeyType}
     * @see {@link DynamicObjectKey}
     */
    export type DynamicObjectKeyType = (SimpleObjectKeyType | ComplexObjectKeyType);
    /**
     * A union type representing a *Dynamic Object Key*, or an object key
     * that can refer to elements within a {@link SimpleObject Simple Object}
     * or {@link ComplexObject Complex Object}.
     * 
     * The non-generic base variant of this type is {@link DynamicObjectKeyType}.
     * 
     * This type is effectively a union of the {@link SimpleObjectKey *Simple Object Keys*},
     * and {@link ComplexObjectKey *Complex Object Keys*} of `T`.
     * 
     * @template T  The {@link TrueObject True Object} the Dyanamic Keys
     *              are to be extracted from.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link SimpleObject}
     * @see {@link ComplexObject}
     * @see {@link SimpleObjectKey}
     * @see {@link ComplexObjectKey}
     * @see {@link DynamicObjectKeyType}
     */
    export type DynamicObjectKey <T extends object> = (SimpleObjectKey<T> | ComplexObjectKey<T>);

    type RequiredNestedObjectKeyHelper <
        T,
        BaseKeyT extends unknown[],
        ResultsT = never
    > = (
        [T] extends [object]
            ? {
                [K in keyof T]: RequiredNestedObjectKeyHelper<
                    T[K],
                    ArrayUtils.TupleFromTypes<BaseKeyT, K>,
                    ArrayUtils.TupleFromTypes<BaseKeyT, K> | ResultsT
                >
            }[keyof T]
            : ResultsT
    );

    /**
     * A union type representing a *Required Nested Object Key*, or an object key
     * that can refer to a nested element within a {@link ComplexObject Complex Object}
     * that is **guaranteed** to be in the object type.
     * 
     * This is in contrast to a {@link OptionalNestedObjectKey *Optional Nested Object Key*},
     * which is **not** guaranteed to be in the object type.
     * 
     * @template T                  The {@link TrueObject True Object} the Required Nested Keys
     *                              are to be extracted from.
     * 
     * @template NestedPropertyT    Indicates whether or not `T` is an {@link OptionalNestedObjectKey *Optional Nested Object*}.
     * 
     *                              This template parameter is only used for recursion and should
     *                              always be set to `false` by callers when needed.
     * 
     * @apistatus                   🧪 *Experimental*
     * @since                       `v1`
     * 
     * @see {@link OptionalNestedObjectKey}
     * @see {@link HasRequiredNestedObjectT}
     */
    // TODO: We are currently using `Exclude` here as a bandaid fix for
    // removing `undefined` from the returned union and should probably
    // figure out why it is appearing in the returned union in the first place.
    export type RequiredNestedObjectKey <T extends object> = Exclude<
        { [K in keyof T]: RequiredNestedObjectKeyHelper<T[K], [K]>; }[keyof T],
        undefined
    >;
    // export type RequiredNestedObjectKey <T extends object, NestedPropertyT extends boolean = false> = ExpandObjectType<{
    //     [K in keyof T]: (
    //         T[K] extends TrueObject
    //             ? ArrayUtils.TupleFromTypes<K, RequiredNestedObjectKey<T[K], true>>
    //             : (NestedPropertyT extends true ? [K] : never)
    //     )
    // }[keyof T]>;
    
    type OptionalNestedObjectKeyHelper <
        T,
        OptionalObjectT extends boolean = false,
        BaseKeyT extends ComplexObjectKeyType = never
    > = (
        ExtractObjectType<T> extends infer O
            ? (
                [O] extends [never]
                    ? (
                         (
                            undefined extends T
                                ? (
                                    [ArrayUtils.SoleElement<BaseKeyT>] extends [never]
                                        ? never
                                        : BaseKeyT
                                )
                                : (
                                    OptionalObjectT extends true
                                        ? BaseKeyT
                                        : never
                                )
                        )
                    )
                    : (
                        {
                            [K in keyof O]: OptionalNestedObjectKeyHelper<
                                O[K],
                                (OptionalObjectT extends true ? true : (object | undefined extends T ? true : false)),
                                ArrayUtils.TupleFromTypes<BaseKeyT, K>
                            >
                        }[keyof O]
                    )
            )
            : never
    );
    /**
     * A union type representing an *Optional Nested Object Key*, or an object key
     * that can refer to a nested element within a {@link ComplexObject Complex Object}
     * that is **not** guaranteed to be in the object type.
     * 
     * This is in contrast to a {@link RequiredNestedObjectKey *Required Nested Object Key*},
     * which is **guaranteed** to be in the object type.
     * 
     * @template T                  The {@link TrueObject True Object} the Optional Nested Keys
     *                              are to be extracted from.
     * 
     * @template NestedPropertyT    Indicates whether or not `T` is an {@link OptionalNestedObjectKey *Optional Nested Object*}.
     * 
     *                              This template parameter is only used for recursion and should
     *                              always be set to `false` by callers when needed.
     * 
     * @apistatus                   🧪 *Experimental*
     * @since                       `v1`
     * 
     * @see {@link RequiredNestedObjectKey}
     * @see {@link HasOptionalNestedObjectT}
     */
    // TODO: We are currently using `Exclude` here as a bandaid fix for
    // removing `undefined` from the returned union and should probably
    // figure out why it is appearing in the returned union in the first place.
    export type OptionalNestedObjectKey <
        ObjectT extends object,
        OptionalObjectT extends boolean = false
    > = Exclude<
        OptionalNestedObjectKeyHelper<ObjectT, OptionalObjectT>,
        undefined
    >;
    // export type OptionalNestedObjectKey <T extends object, OptionalObjectT extends boolean = false> = ExpandObjectType<{
    //     [K in keyof T]: (
    //         T[K] extends TrueObject
    //             ? (
    //                 OptionalNestedObjectKey<T[K]> extends never
    //                     ? never
    //                     : ArrayUtils.TupleFromTypes<K, OptionalNestedObjectKey<T[K]>>
    //             )
    //             : (
    //                 Extract<T[K], TrueObject> extends never
    //                     ? (OptionalObjectT extends false ? never : [K])
    //                     : ArrayUtils.TupleFromTypes<K, OptionalNestedObjectKey<Extract<T[K], TrueObject>, true>>
    //             )
    //     )
    // }[keyof T]>;
    /**
     * A union type representing a *Nested Object Key*, or an object key
     * that can refer to a nested element within a {@link ComplexObject Complex Object}
     * that may or may not be present in the object type.
     * 
     * Note that a *Nested Object Key* is **not** the same as
     * a {@link ComplexObjectKey *Complex Object Key*}, as only the
     * latter of which contains *all* of the possible keys in the Complex Object,
     * while the former is limited to those that are *nested* in the root object.
     * 
     * To refine the Nested Object Keys to only those that are *Required* or *Optional*,
     * use the {@link RequiredNestedObjectKey} and {@link OptionalNestedObjectKey}
     * helper types, respectively.
     * 
     * @template T  The {@link TrueObject True Object} the Nested Keys are to be extracted from.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link RequiredNestedObjectKey}
     * @see {@link OptionalNestedObjectKey}
     * @see {@link ComplexObjectKey}
     */
    export type NestedObjectKey <T extends object> = (RequiredNestedObjectKey<T> | OptionalNestedObjectKey<T>);

    type ExtractNestedObjectValueHelper <
        T,
        KeyT extends unknown[],
        OptionalObjectT extends boolean = false
    > = (
        ExtractObjectType<T> extends infer O
            ? (
                [O] extends [never]
                    ? T
                    : (
                        KeyT extends [infer V, ...infer W]
                            ? (
                                V extends keyof O
                                    ? (
                                        W extends []
                                            ? (OptionalObjectT extends false ? O[V] : O[V] | undefined)
                                            : ExtractNestedObjectValueHelper<
                                                O[V],
                                                W,
                                                OptionalObjectT
                                            >
                                    )
                                    : never
                            )
                            : never
                    )
            )
            : never
    );
    /**
     * Extract the type of the value of the *Nested Element*
     * in the designated `ObjectT` associated with the specified `KeyT`.
     * 
     * If one or more *Nested Objects* containing the designated element
     * are {@link OptionalNestedObjectKey *Optional Nested Objects*},
     * the returned type will be a union containing the extracted value type
     * and `undefined` to represent instances where the optional objects
     * are *missing*.
     * 
     * @example
     * type Foo = {
     *    bar: {
     *       baz: number;
     *    }
     * };
     * type Baz = ExtractNestedObjectValue<Foo, ['bar', 'baz']>; // number
     * 
     * @template ObjectT            The {@link TrueObject object type} being evaluated.
     * 
     * @template KeyT               The type of the {@link NestedObjectKey *Nested Object Key*}
     *                              corresponding to the *Nested Element* in `ObjectT` being extracted.
     * 
     * @template OptionalObjectT    Indicates whether or not `ObjectTT` is an
     *                              {@link OptionalNestedObjectKey *Optional Nested Object*}.
     * 
     *                              This template parameter is only used for recursion and should
     *                              generally always be set to `false` by callers when needed.
     * 
     * @apistatus                   🧪 *Experimental*
     * @since                       `v1`
     * 
     * @see {@link ExtractNestedObject}
     * @see {@link ComplexObject}
     * @see {@link NestedObjectKey}
     * @see {@link getNestedProperty `getNestedProperty()`}
     */
    export type ExtractNestedObjectValue <
        ObjectT extends object,
        KeyT extends DynamicObjectKey<ObjectT>,
        OptionalObjectT extends boolean = false
    > = ExtractNestedObjectValueHelper<ObjectT, ArrayUtils.ArrayifyType<KeyT>, OptionalObjectT>;
    // export type ExtractNestedObjectValue <
    //     ObjectT extends TrueObject,
    //     KeyT extends DynamicObjectKey<ObjectT>,
    //     OptionalObjectT extends boolean = false
    // > = (
    //     ArrayUtils.ArrayifyType<KeyT> extends [infer V, ...infer W]
    //         ? (
    //             V extends keyof ObjectT
    //                 ? (
    //                     W extends []
    //                         ? (OptionalObjectT extends false ? ObjectT[V] : ObjectT[V] | undefined)
    //                         : (
    //                             Extract<ObjectT[V], TrueObject> extends never
    //                                 ? ObjectT[V]
    //                                 : ExtractNestedObjectValue<
    //                                     Extract<ObjectT[V], TrueObject>,
    //                                     (W extends DynamicObjectKey<Extract<ObjectT[V], TrueObject>> ? W : never),
    //                                     (ObjectT[V] extends TrueObject ? OptionalObjectT : true)
    //                                 >
    //                         )
    //                 )
    //                 : never
    //         )
    //         : never
    // );

    type ExtractNestedObjectHelper <
        T,
        KeyT extends ComplexObjectKeyType
    > = (
        ArrayUtils.PreceedingElements<KeyT> extends []
            ? T
            : ExtractNestedObjectValueHelper<
                T,
                ArrayUtils.PreceedingElements<KeyT>
            >
    );
    /**
     * Extract the type of the *Nested Object* in the designated
     * `ObjectT` associated with the specified `KeyT`.
     * 
     * If the *Nested Object* or any of the containing
     * objects are {@link OptionalNestedObjectKey *Optional Nested Objects*},
     * the returned type will be a union containing the extracted value type
     * and `undefined` to represent instances where the optional objects
     * are *missing*.
     * 
     * If a top-level element is specified, `ObjectT` will be returned.
     * 
     * @example
     * type Foo = {
     *    bar: {
     *       baz: number;
     *    }
     * };
     * type Baz = ExtractNestedObject<Foo, ['bar', 'baz']>; // { baz: number }
     * 
     * @template ObjectT            The {@link TrueObject object type} being evaluated.
     * 
     * @template KeyT               The type of the {@link NestedObjectKey *Nested Object Key*}
     *                              corresponding to the *Nested Object* in `ObjectT` being extracted.
     * 
     * @apistatus                   🧪 *Experimental*
     * @since                       `v1`
     * 
     * @see {@link ExtractNestedObjectValue}
     * @see {@link ComplexObject}
     * @see {@link NestedObjectKey}
     * @see {@link getNestedObject `getNestedObject()`}
     */
    export type ExtractNestedObject <
        ObjectT extends object,
        KeyT extends DynamicObjectKey<ObjectT>
    > = ExtractNestedObjectHelper<ObjectT, ArrayUtils.ArrayifyType<KeyT>>;
    // export type ExtractNestedObject <
    //     ObjectT extends TrueObject,
    //     KeyT extends DynamicObjectKey<ObjectT>
    // > = (
    //     ArrayUtils.PreceedingElements<ArrayUtils.ArrayifyType<KeyT>> extends []
    //         ? ObjectT
    //         : ExtractNestedObjectValue<
    //             ObjectT,
    //             (
    //                 ArrayUtils.PreceedingElements<ArrayUtils.ArrayifyType<KeyT>> extends DynamicObjectKey<ObjectT>
    //                     ? ArrayUtils.PreceedingElements<ArrayUtils.ArrayifyType<KeyT>>
    //                     : never
    //             )
    //         >
    // );

    type OmitFromNestedObjectHelper <T, ExcludedKeysT extends unknown[]> = (
        ExtractObjectType<T> extends infer O
            ? (
                [O] extends [never]
                    ? T
                    : {
                        [
                            K in keyof O as K extends ArrayUtils.SoleElement<ExcludedKeysT>
                                ? never
                                : K
                        ]: OmitFromNestedObjectHelper<
                            O[K],
                            ArrayUtils.FollowingElements<ExcludedKeysT>
                        >
                    }
            )
            : never
    );

    /**
     * Omit the specified *Nested Elements* in the designated `ObjectT`
     * associated with the specified `ExcludedKeyT`.
     * 
     * This type is a variant of {@link Omit} that supports {@link ComplexObject Complex Objects}
     * as well as {@link SimpleObject Simple Objects}.
     * 
     * @example
     * type Foo = {
     *    foo: string;
     *    bar: {
     *       foobar: number;
     *    };
     *    baz: {
     *       foobaz: {
     *           foobarbaz: boolean;
     *       }
     *    }
     * };
     * 
     * type Bar = OmitFromNestedObject<Foo, ['baz']>;                       // { foo: string, bar: { foobar: number } }
     * type Baz = OmitFromNestedObject<Foo, ['bar', 'foobar'] | ['baz']>;   // { foo: string, bar: {} }
     * 
     * @template ObjectT            The {@link TrueObject object type} being evaluated.
     * 
     * @template ExcludedKeyT       The type(s) of the {@link NestedObjectKey *Nested Object Key(s)*}
     *                              corresponding to the *Nested Element(s)* in `ObjectT` to omit.
     * 
     *                              Multiple keys can be specified as a union. E.g., `Key1 | Key2 | Key3`
     * 
     * @apistatus                   🧪 *Experimental*
     * @since                       `v1`
     * 
     * @see {@link Omit}
     * @see {@link PickFromNestedObject}
     * @see {@link RecordNestedObject}
     */
    export type OmitFromNestedObject <
        ObjectT extends object,
        ExcludedKeysT extends DynamicObjectKey<ObjectT>
    > = OmitFromNestedObjectHelper<ObjectT, ArrayUtils.ArrayifyType<ExcludedKeysT>>;
    // export type OmitFromNestedObject <
    //     ObjectT extends TrueObject,
    //     ExcludedKeyT extends DynamicObjectKey<ObjectT>
    // > = ExpandObjectType<{
    //     [K in keyof ObjectT as K extends ArrayUtils.SoleElement<ArrayUtils.ArrayifyType<ExcludedKeyT>> ? never : K]: Extract<ObjectT[K], TrueObject> extends never
    //         ? ObjectT[K]
    //         : OmitFromNestedObject<
    //             Extract<ObjectT[K], TrueObject>,
    //             Exclude<ArrayUtils.FollowingElements<ArrayUtils.ArrayifyType<ExcludedKeyT>>, []> extends DynamicObjectKey<Extract<ObjectT[K], TrueObject>>
    //                 ? Exclude<ArrayUtils.FollowingElements<ArrayUtils.ArrayifyType<ExcludedKeyT>>, []>
    //                 : never
    //         >
    // }>;

    type PickFromNestedObjectHelper <T, ExtractedKeysT extends unknown[]> = (
        ExtractObjectType<T> extends infer O
            ? (
                [O] extends [never]
                    ? T
                    : {
                        [
                            K in keyof O as K extends ArrayUtils.SoleElement<ExtractedKeysT>
                                ? K
                                : never
                        ]: PickFromNestedObjectHelper<
                            O[K],
                            ArrayUtils.FollowingElements<ExtractedKeysT>
                        >
                    }
            )
            : never
    );
    /**
     * Pick the specified *Nested Elements* in the designated `ObjectT`
     * associated with the specified `ExtractedKeyT`.
     * 
     * This type is a variant of {@link Pick} that supports {@link ComplexObject Complex Objects}
     * as well as {@link SimpleObject Simple Objects}.
     * 
     * @example
     * type Foo = {
     *    foo: string;
     *    bar: {
     *       foobar: number;
     *       foobaz: boolean;
     *    };
     * };
     * 
     * type Bar = PickFromNestedObject<Foo, ['foo']>;                       // { foo: string }
     * type Baz = PickFromNestedObject<Foo, ['foo'] | ['bar', 'foobar']>;   // { foo: string, bar: { foobar: number } }
     * 
     * @template ObjectT            The {@link TrueObject object type} being evaluated.
     * 
     * @template ExcludedKeyT       The type(s) of the {@link NestedObjectKey *Nested Object Key(s)*}
     *                              corresponding to the *Nested Element(s)* in `ObjectT` to pick.
     * 
     *                              Multiple keys can be specified as a union. E.g., `Key1 | Key2 | Key3`
     * 
     * @apistatus                   🧪 *Experimental*
     * @since                       `v1`
     * 
     * @see {@link Pick}
     * @see {@link OmitFromNestedObject}
     * @see {@link RecordNestedObject}
     */
    export type PickFromNestedObject <
        ObjectT extends object,
        ExtractedKeysT extends DynamicObjectKey<ObjectT>
    > = PickFromNestedObjectHelper<ObjectT, ArrayUtils.ArrayifyType<ExtractedKeysT>>;
    // export type PickFromNestedObject < ObjectT extends TrueObject, ExtractedKeyT extends DynamicObjectKey<ObjectT> > = OmitFromNestedObject<
    //     ObjectT,
    //     Exclude<
    //         DynamicObjectKey<ObjectT>,
    //         ArrayUtils.TupleComponents<ArrayUtils.ArrayifyType<ExtractedKeyT>>[number] | ObjectKey
    //     >
    // >;

    type MakeOptionalObjectsOptionalHelper <T> = (
        ExtractObjectType<T> extends infer O
            ? (
                [O] extends [never]
                    ? T
                    : (
                        {
                            [
                                K in keyof O as object extends O[K]
                                    ? (IsOptionalObjectType<Extract<O[K], object>> extends true ? K : never)
                                    : never
                            ]?: MakeOptionalObjectsOptionalHelper<O[K]>;
                        } & {
                            [
                                K in keyof O as object extends O[K]
                                    ? (IsOptionalObjectType<Extract<O[K], object>> extends false ? K : never)
                                    : K
                            ]: MakeOptionalObjectsOptionalHelper<O[K]>;
                        }
                    )
            )
            : never
    );
    export type MakeOptionalObjectsOptional <T> = (
        T extends object
            ? MakeOptionalObjectsOptionalHelper<T>
            : never
    );
    // export type MakeOptionalObjectsOptional <T extends object> = ExpandObjectType<
    //     {
    //         [K in keyof T as T[K] extends object ? (IsOptionalObjectType<T[K]> extends true ? K : never) : never]?: (
    //             T[K] extends object
    //                 ? MakeOptionalObjectsOptional<T[K]>
    //                 : T[K]
    //         );
    //     } & {
    //         [K in keyof T as T[K] extends object ? (IsOptionalObjectType<T[K]> extends false ? K : never) : K]: (
    //             T[K] extends object
    //                 ? MakeOptionalObjectsOptional<T[K]>
    //                 : T[K]
    //         );
    //     }
    // >;

    type MakeUndefinedPropertiesOptionalHelper <T> = (
        ExtractObjectType<T> extends infer O
            ? (
                [O] extends [never]
                    ? T
                    : (
                        {
                            [K in keyof O as undefined extends O[K] ? K : never]?: MakeUndefinedPropertiesOptionalHelper<O[K]>;
                        } & {
                            [K in keyof O as undefined extends O[K] ? never : K]: MakeUndefinedPropertiesOptionalHelper<O[K]>;
                        }
                    )
            )
            : never
    );
    export type MakeUndefinedPropertiesOptional <T> = (
        T extends object
            ? MakeUndefinedPropertiesOptionalHelper<T>
            : never
    );
    // export type MakeUndefinedPropertiesOptional <T extends object> = ExpandObjectType<
    //     {
    //         [K in keyof T as undefined extends T[K] ? K : never]?: (
    //             object extends T[K]
    //                 ? MakeUndefinedPropertiesOptional<Extract<T[K], object>>
    //                 : T[K]
    //         );
    //     } & {
    //         [K in keyof T as undefined extends T[K] ? never : K]: (
    //             object extends T[K]
    //                 ? MakeUndefinedPropertiesOptional<Extract<T[K], object>>
    //                 : T[K]
    //         );
    //     }
    // >;
    export type MakeOptionalPropertiesOptional <T> = MakeOptionalObjectsOptional<MakeUndefinedPropertiesOptional<T>>;

    type RecordNestedObjectHelper <
        KeysT extends unknown[],
        ValueT
    > = (
        [KeysT] extends [never] | [[]]
            ? ValueT
            : {
                [
                    K in KeysT as ArrayUtils.FirstElement<K> extends infer F
                        ? (F extends SimpleObjectKeyType ? F : never)
                        : never
                ]: RecordNestedObjectHelper<
                    ArrayUtils.FollowingElements<K>,
                    ValueT
                >
            }
    );
    type RecordNestedObjectResultHelper <KeysT extends DynamicObjectKeyType, ValueT> = RecordNestedObjectHelper<
        ArrayUtils.ArrayifyType<KeysT>,
        ValueT
    > & {};

    /**
     * Create a {@link Record} of `KeysT` to `ValueT`.
     * 
     * This type is a variant of {@link Record} that supports {@link ComplexObject Complex Objects}
     * as well as {@link SimpleObject Simple Objects}.
     * 
     * @example
     * type Foo = ['foo'] | ['bar', 'foobar'] | ['baz', 'foobaz', 'foobarbaz'];
     * 
     * type Bar = RecordNestedObject<Foo, string | number>;
     * // {
     * //    foo: string | number;
     * //    bar: {
     * //       foobar: string | number;
     * //    };
     * //    baz: {
     * //       foobaz: {
     * //           foobarbaz: string | number;
     * //       }
     * //    }
     * // }
     * 
     * @template KeysT      A union of {@link NestedObjectKey Nested Object Keys}
     *                      to be used in the {@link Record}.
     * 
     * @template ValueT     The type to be associated with each of the `KeysT`
     *                      in the {@link Record}.
     * 
     * @apistatus           🧪 *Experimental*
     * @since               `v1`
     * 
     * @see {@link Record}
     * @see {@link OmitFromNestedObject}
     * @see {@link PickFromNestedObject}
     */

    export type RecordNestedObject <
        KeysT extends DynamicObjectKeyType,
        ValueT,
        HasOptionalPropertiesT extends boolean = false
    > = (
        HasOptionalPropertiesT extends true
            ? MakeOptionalPropertiesOptional< RecordNestedObjectResultHelper<KeysT, ValueT> >
            : RecordNestedObjectResultHelper<KeysT, ValueT>
    );
    // export type RecordNestedObject < KeysT extends DynamicObjectKeyType, ValueT > = MakeOptionalPropertiesOptional<
    //     ExpandObjectType<{
    //         [K in KeysT as ArrayUtils.FirstElement<ArrayUtils.ArrayifyType<K>>]: ArrayUtils.FollowingElements<ArrayUtils.ArrayifyType<K>> extends []
    //             ? ValueT
    //             : RecordNestedObject<ArrayUtils.FollowingElements<ArrayUtils.ArrayifyType<K>>, ValueT>
    //     }>
    // >;

    
    /* Functions */
    // Adjacent Element Helper Functions

    /**
     * Return the _previous **key**_ in the specified object
     * relative to the designated `property`.
     * 
     * @template ObjectT        The type of the specified `obj`.
     * @template KeyT           The type of the keys inferred from the `ObjectT`.
     * @template WrapT          The type of the optional `wrap` argument.
     * @template ReturnTypeT    The inferred object type returned by the function.
     * @template ReturnKeyT     The inferred keys of `ReturnTypeT`.
     * @template ReturnT        The inferred function return type.
     * 
     * @param obj               The object being evaluated.
     * 
     * @param property          The _current **key**_ in the specified object.
     * 
     * @param wrap              Indicates whether or not the _first_ key should be
     *                          returned when `property` is the _last_ key in `obj`.
     * 
     * @returns                 The previous key in the designated `obj` relative to
     *                          the specified `property`.
     * 
     *                          If `property` is the _last_ key in the specified `obj`
     *                          and `wrap` is `false`, returns `null`.
     *  
     *                          If `property` is the _last_ key in the specified `obj`
     *                          and `wrap` is `true`, returns the _first_ key in `obj`.
     * 
     *                          If the specified `obj` is an *empty object*, returns `null`.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     * 
     * @see {@link nextKey `nextKey()`}
     * @see {@link adjacentKey `adjacentKey()`}
     * @see {@link previousValue `previousValue()`}
     * @see {@link previousElement `previousElement()`}
     */
    export const previousKey = <
        ObjectT extends object,
        KeyT extends (keyof ObjectT) | string,
        WrapT extends boolean | undefined,
        ReturnObjectT extends (KeyT extends keyof ObjectT ? Omit<ObjectT, KeyT> : ObjectT),
        ReturnKeyT extends (keyof ReturnObjectT extends never ? keyof ObjectT : keyof ReturnObjectT),
        ReturnT extends (WrapT extends true ? ReturnKeyT : ReturnKeyT | null)
    > ( obj: ObjectT, property: KeyT, wrap?: WrapT ): ReturnT => {

        const objectKeys = Object.keys(obj);

        if (objectKeys.length == 0)
            return null as ReturnT;

        for (let index = 1; index < objectKeys.length; index++)
            if (property == objectKeys[index])
                return objectKeys[index - 1] as ReturnT;

        return (wrap === true ? objectKeys[objectKeys.length - 1] : null) as ReturnT;

    };
    /**
     * Return the _next **key**_ in the specified object
     * relative to the designated `property`.
     * 
     * @template ObjectT        The type of the specified `obj`.
     * @template KeyT           The type of the keys inferred from the `ObjectT`.
     * @template WrapT          The type of the optional `wrap` argument.
     * @template ReturnTypeT    The inferred object type returned by the function.
     * @template ReturnKeyT     The inferred keys of `ReturnTypeT`.
     * @template ReturnT        The inferred function return type.
     * 
     * @param obj               The object being evaluated.
     * 
     * @param property          The _current **key**_ in the specified object.
     * 
     * @param wrap              Indicates whether or not the _last_ key should be
     *                          returned when `property` is the _first_ key in `obj`.
     * 
     * @returns                 The previous key in the designated `obj` relative to
     *                          the specified `property`.
     * 
     *                          If `property` is the _first_ key in the specified `obj`
     *                          and `wrap` is `false`, returns `null`.
     *  
     *                          If `property` is the _first_ key in the specified `obj`
     *                          and `wrap` is `true`, returns the _last_ key in `obj`.
     * 
     *                          If the specified `obj` is an *empty object*, returns `null`.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     * 
     * @see {@link previousKey `previousKey()`}
     * @see {@link adjacentKey `adjacentKey()`}
     * @see {@link nextValue `nextValue()`}
     * @see {@link nextElement `nextElement()`}
     */
    export const nextKey = <
        ObjectT extends object,
        KeyT extends (keyof ObjectT) | string,
        WrapT extends boolean | undefined,
        ReturnObjectT extends (KeyT extends keyof ObjectT ? Omit<ObjectT, KeyT> : ObjectT),
        ReturnKeyT extends (keyof ReturnObjectT extends never ? keyof ObjectT : keyof ReturnObjectT),
        ReturnT extends (WrapT extends true ? ReturnKeyT : ReturnKeyT | null)
    > ( obj: ObjectT, property: KeyT, wrap?: WrapT ): ReturnT => {

        const objectKeys = Object.keys(obj);

        if (objectKeys.length == 0)
            return null as ReturnT;

        for (let index = (objectKeys.length - 2); index >= 0; index--)
            if (property == objectKeys[index])
                return objectKeys[index + 1] as ReturnT;

        return (wrap === true ? objectKeys[0] : null) as ReturnT;

    };
    /**
     * Return the adjacent **key** in the specified object
     * relative to the designated `property`.
     * 
     * @template ObjectT        The type of the specified `obj`.
     * @template KeyT           The type of the keys inferred from the `ObjectT`.
     * @template WrapT          The type of the optional `wrap` argument.
     * @template ReturnTypeT    The inferred object type returned by the function.
     * @template ReturnKeyT     The inferred keys of `ReturnTypeT`.
     * @template ReturnT        The inferred function return type.
     * 
     * @param obj               The object being evaluated.
     * 
     * @param property          The _current **key**_ in the specified object.
     * 
     * @param direction         The {@link TraversalDirection direction} to move
     *                          in the `obj` relative to the specified `property`.
     * 
     * @param wrap              Indicates whether or not the _last_ key should be
     *                          returned when `property` is the _first_ key in `obj`.
     * 
     * @returns                 The next or previous key in the designated `obj` relative to
     *                          the specified `property` according to the indicated `direction`.
     * 
     *                          Returns `null` if `wrap` is `false` and either `direction` is `next` and the `property`
     *                          is the _last_ key in the specified `obj`, or if `direction` is `previous` and
     *                          the `property` is the _first_ key in the specified `obj`.
     * 
     *                          Returns the _last_ key or _first_ key in the specified `obj` if `wrap` is `true`
     *                          and either `direction` is `next` and the `property` is the _last_ key in the specified `obj`,
     *                          or if `direction` is `previous` and the `property` is the _first_ key in the specified `obj`, respectively.
     * 
     *                          If the specified `obj` is an *empty object*, returns `null`.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     * 
     * @see {@link previousKey `previousKey()`}
     * @see {@link nextKey `nextKey()`}
     * @see {@link adjacentValue `previousValue()`}
     * @see {@link adjacentElement `previousElement()`}
     */
    export const adjacentKey = <
        ObjectT extends object,
        KeyT extends (keyof ObjectT) | string,
        WrapT extends boolean | undefined,
        ReturnObjectT extends (KeyT extends keyof ObjectT ? Omit<ObjectT, KeyT> : ObjectT),
        ReturnKeyT extends (keyof ReturnObjectT extends never ? keyof ObjectT : keyof ReturnObjectT),
        ReturnT extends (WrapT extends true ? ReturnKeyT : ReturnKeyT | null)
    > ( obj: ObjectT, property: KeyT, direction: TraversalDirection, wrap?: WrapT ): ReturnT => (
        (direction == 'next' ? nextKey : previousKey)(obj, property, wrap)
    ) as unknown as ReturnT;

    /**
     * Return the _previous **value**_ in the specified object
     * relative to the designated `property`.
     * 
     * @template ObjectT        The type of the specified `obj`.
     * @template KeyT           The type of the keys inferred from the `ObjectT`.
     * @template WrapT          The type of the optional `wrap` argument.
     * @template ReturnTypeT    The inferred object type returned by the function.
     * @template ReturnKeyT     The inferred keys of `ReturnTypeT`.
     * @template ReturnValueT   The inferred values of `ReturnTypeT`.
     * @template ReturnT        The inferred function return type.
     * 
     * @param obj               The object being evaluated.
     * 
     * @param property          The _current **key**_ in the specified object.
     * 
     * @param wrap              Indicates whether or not the _first_ value should be
     *                          returned when `property` is the _last_ key in `obj`.
     * 
     * @returns                 The previous value in the designated `obj` relative to
     *                          the specified `property`.
     * 
     *                          If `property` is the _last_ key in the specified `obj`
     *                          and `wrap` is `false`, returns `null`.
     *  
     *                          If `property` is the _last_ key in the specified `obj`
     *                          and `wrap` is `true`, returns the _first_ value in `obj`.
     * 
     *                          If the specified `obj` is an *empty object*, returns `null`.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     * 
     * @see {@link nextValue `nextValue()`}
     * @see {@link adjacentValue `adjacentValue()`}
     * @see {@link previousKey `previousKey()`}
     * @see {@link previousElement `previousElement()`}
     */
    export const previousValue = <
        ObjectT extends object,
        KeyT extends (keyof ObjectT) | string,
        WrapT extends boolean | undefined,
        ReturnObjectT extends (KeyT extends keyof ObjectT ? Omit<ObjectT, KeyT> : ObjectT),
        ReturnKeyT extends (keyof ReturnObjectT extends never ? keyof ObjectT : keyof ReturnObjectT),
        ReturnValueT extends ObjectT[ReturnKeyT extends keyof ObjectT ? ReturnKeyT : never],
        ReturnT extends (WrapT extends true ? ReturnValueT : ReturnValueT | null)
    > ( obj: ObjectT, property: KeyT, wrap?: WrapT ): ReturnT => {

        const key = previousKey(obj, property, wrap);

        return (key ? obj[key as keyof ObjectT] : null) as ReturnT;

    };
    /**
     * Return the _next **value**_ in the specified object
     * relative to the designated `property`.
     * 
     * @template ObjectT        The type of the specified `obj`.
     * @template KeyT           The type of the keys inferred from the `ObjectT`.
     * @template WrapT          The type of the optional `wrap` argument.
     * @template ReturnTypeT    The inferred object type returned by the function.
     * @template ReturnKeyT     The inferred keys of `ReturnTypeT`.
     * @template ReturnValueT   The inferred values of `ReturnTypeT`.
     * @template ReturnT        The inferred function return type.
     * 
     * @param obj               The object being evaluated.
     * 
     * @param property          The _current **key**_ in the specified object.
     * 
     * @param wrap              Indicates whether or not the _last_ value should be
     *                          returned when `property` is the _first_ key in `obj`.
     * 
     * @returns                 The previous value in the designated `obj` relative to
     *                          the specified `property`.
     * 
     *                          If `property` is the _first_ key in the specified `obj`
     *                          and `wrap` is `false`, returns `null`.
     *  
     *                          If `property` is the _first_ key in the specified `obj`
     *                          and `wrap` is `true`, returns the _last_ value in `obj`.
     * 
     *                          If the specified `obj` is an *empty object*, returns `null`.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     * 
     * @see {@link previousValue `previousValue()`}
     * @see {@link adjacentValue `adjacentValue()`}
     * @see {@link nextKey `nextKey()`}
     * @see {@link nextElement `nextElement()`}
     */
    export const nextValue = <
        ObjectT extends object,
        KeyT extends (keyof ObjectT) | string,
        WrapT extends boolean | undefined,
        ReturnObjectT extends (KeyT extends keyof ObjectT ? Omit<ObjectT, KeyT> : ObjectT),
        ReturnKeyT extends (keyof ReturnObjectT extends never ? keyof ObjectT : keyof ReturnObjectT),
        ReturnValueT extends ObjectT[ReturnKeyT extends keyof ObjectT ? ReturnKeyT : never],
        ReturnT extends (WrapT extends true ? ReturnValueT : ReturnValueT | null)
    > ( obj: ObjectT, property: KeyT, wrap?: WrapT ): ReturnT => {

        const key = nextKey(obj, property, wrap);

        return (key ? obj[key as keyof ObjectT] : null) as ReturnT;

    };
    /**
     * Return the adjacent **value** in the specified object
     * relative to the designated `property`.
     * 
     * @template ObjectT        The type of the specified `obj`.
     * @template KeyT           The type of the keys inferred from the `ObjectT`.
     * @template WrapT          The type of the optional `wrap` argument.
     * @template ReturnTypeT    The inferred object type returned by the function.
     * @template ReturnKeyT     The inferred keys of `ReturnTypeT`.
     * @template ReturnValueT   The inferred values of `ReturnTypeT`.
     * @template ReturnT        The inferred function return type.
     * 
     * @param obj               The object being evaluated.
     * 
     * @param property          The _current **key**_ in the specified object.
     * 
     * @param direction         The {@link TraversalDirection direction} to move
     *                          in the `obj` relative to the specified `property`.
     * 
     * @param wrap              Indicates whether or not the _last_ value should be
     *                          returned when `property` is the _first_ key in `obj`.
     * 
     * @returns                 The next or previous value in the designated `obj` relative to
     *                          the specified `property` according to the indicated `direction`.
     * 
     *                          Returns `null` if `wrap` is `false` and either `direction` is `next` and the `property`
     *                          is the _last_ key in the specified `obj`, or if `direction` is `previous` and
     *                          the `property` is the _first_ key in the specified `obj`.
     * 
     *                          Returns the _last_ value or _first_ value in the specified `obj` if `wrap` is `true`
     *                          and either `direction` is `next` and the `property` is the _last_ key in the specified `obj`,
     *                          or if `direction` is `previous` and the `property` is the _first_ key in the specified `obj`, respectively.
     * 
     *                          If the specified `obj` is an *empty object*, returns `null`.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     * 
     * @see {@link previousValue `previousValue()`}
     * @see {@link nextValue `nextValue()`}
     * @see {@link adjacentKey `adjacentKey()`}
     * @see {@link adjacentElement `adjacentElement()`}
     */
    export const adjacentValue = <
        ObjectT extends object,
        KeyT extends (keyof ObjectT) | string,
        WrapT extends boolean | undefined,
        ReturnObjectT extends (KeyT extends keyof ObjectT ? Omit<ObjectT, KeyT> : ObjectT),
        ReturnKeyT extends (keyof ReturnObjectT extends never ? keyof ObjectT : keyof ReturnObjectT),
        ReturnValueT extends ObjectT[ReturnKeyT extends keyof ObjectT ? ReturnKeyT : never],
        ReturnT extends (WrapT extends true ? ReturnValueT : ReturnValueT | null)
    > ( obj: ObjectT, property: KeyT, direction: TraversalDirection, wrap?: WrapT ): ReturnT => {

        const key = adjacentKey(obj, property, direction, wrap);

        return (key ? obj[key as keyof ObjectT] : null) as ReturnT;

    };

    /**
     * Return the _previous **element**_ in the specified object
     * relative to the designated `property`.
     * 
     * @template ObjectT        The type of the specified `obj`.
     * @template KeyT           The type of the keys inferred from the `ObjectT`.
     * @template WrapT          The type of the optional `wrap` argument.
     * @template ReturnTypeT    The inferred object type returned by the function.
     * @template ReturnKeyT     The inferred keys of `ReturnTypeT`.
     * @template ReturnValueT   The inferred values of `ReturnTypeT`.
     * @template ReturnT        The inferred function return type.
     * 
     * @param obj               The object being evaluated.
     * 
     * @param property          The _current **key**_ in the specified object.
     * 
     * @param wrap              Indicates whether or not the _first_ element should be
     *                          returned when `property` is the _last_ key in `obj`.
     * 
     * @returns                 A tuple containing the *Key* and *Value* associated with
     *                          the previous element in the designated `obj` relative to
     *                          the specified `property`.
     * 
     *                          If `property` is the _last_ key in the specified `obj`
     *                          and `wrap` is `false`, returns `null`.
     *  
     *                          If `property` is the _last_ key in the specified `obj`
     *                          and `wrap` is `true`, returns a tuple containing the
     *                          key and value associated with the _first_ element in `obj`.
     * 
     *                          If the specified `obj` is an *empty object*, returns `null`.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     * 
     * @see {@link nextElement `nextElement()`}
     * @see {@link adjacentElement `adjacentElement()`}
     * @see {@link previousKey `previousKey()`}
     * @see {@link previousValue `previousValue()`}
     */
    export const previousElement = <
        ObjectT extends object,
        KeyT extends (keyof ObjectT) | string,
        WrapT extends boolean | undefined,
        ReturnObjectT extends (KeyT extends keyof ObjectT ? Omit<ObjectT, KeyT> : ObjectT),
        ReturnKeyT extends (keyof ReturnObjectT extends never ? keyof ObjectT : keyof ReturnObjectT),
        ReturnValueT extends ObjectT[ReturnKeyT extends keyof ObjectT ? ReturnKeyT : never],
        ReturnT extends (WrapT extends true ? [ReturnKeyT, ReturnValueT] : [ReturnKeyT, ReturnValueT] | null)
    > ( obj: ObjectT, property: KeyT, wrap?: WrapT ): ReturnT => {

        const key = previousKey(obj, property, wrap);
        
        return (
            key !== null
                ? [ key, obj[key as keyof ObjectT] ]
                : null
        ) as ReturnT;

    };
    /**
     * Return the _next **element**_ in the specified object
     * relative to the designated `property`.
     * 
     * @template ObjectT        The type of the specified `obj`.
     * @template KeyT           The type of the keys inferred from the `ObjectT`.
     * @template WrapT          The type of the optional `wrap` argument.
     * @template ReturnTypeT    The inferred object type returned by the function.
     * @template ReturnKeyT     The inferred keys of `ReturnTypeT`.
     * @template ReturnValueT   The inferred values of `ReturnTypeT`.
     * @template ReturnT        The inferred function return type.
     * 
     * @param obj               The object being evaluated.
     * 
     * @param property          The _current **key**_ in the specified object.
     * 
     * @param wrap              Indicates whether or not the _last_ element should be
     *                          returned when `property` is the _first_ key in `obj`.
     * 
     * @returns                 A tuple containing the *Key* and *Value* associated with
     *                          the next element in the designated `obj` relative to
     *                          the specified `property`.
     * 
     *                          If `property` is the _last_ key in the specified `obj`
     *                          and `wrap` is `false`, returns `null`.
     *  
     *                          If `property` is the _last_ key in the specified `obj`
     *                          and `wrap` is `true`, returns a tuple containing the
     *                          key and value associated with the _last_ element in `obj`.
     * 
     *                          If the specified `obj` is an *empty object*, returns `null`.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     * 
     * @see {@link previousElement `previousElement()`}
     * @see {@link adjacentElement `adjacentElement()`}
     * @see {@link nextKey `nextKey()`}
     * @see {@link nextValue `nextValue()`}
     */
    export const nextElement = <
        ObjectT extends object,
        KeyT extends (keyof ObjectT) | string,
        WrapT extends boolean | undefined,
        ReturnObjectT extends (KeyT extends keyof ObjectT ? Omit<ObjectT, KeyT> : ObjectT),
        ReturnKeyT extends (keyof ReturnObjectT extends never ? keyof ObjectT : keyof ReturnObjectT),
        ReturnValueT extends ObjectT[ReturnKeyT extends keyof ObjectT ? ReturnKeyT : never],
        ReturnT extends (WrapT extends true ? [ReturnKeyT, ReturnValueT] : [ReturnKeyT, ReturnValueT] | null)
    > ( obj: ObjectT, property: KeyT, wrap?: WrapT ): ReturnT => {

        const key = nextKey(obj, property, wrap);

        return (
            key !== null
                ? [ key, obj[key as keyof ObjectT] ]
                : null
        ) as ReturnT;

    };
    /**
     * Return the adjacent **value** in the specified object
     * relative to the designated `property`.
     * 
     * @template ObjectT        The type of the specified `obj`.
     * @template KeyT           The type of the keys inferred from the `ObjectT`.
     * @template WrapT          The type of the optional `wrap` argument.
     * @template ReturnTypeT    The inferred object type returned by the function.
     * @template ReturnKeyT     The inferred keys of `ReturnTypeT`.
     * @template ReturnValueT   The inferred values of `ReturnTypeT`.
     * @template ReturnT        The inferred function return type.
     * 
     * @param obj               The object being evaluated.
     * 
     * @param property          The _current **key**_ in the specified object.
     * 
     * @param direction         The {@link TraversalDirection direction} to move
     *                          in the `obj` relative to the specified `property`.
     * 
     * @param wrap              Indicates whether or not the _last_ key should be
     *                          returned when `property` is the _first_ key in `obj`.
     * 
     * @returns                 A tuple containing the *Key* and *Value* associated with
     *                          the next or previous element in the designated `obj` relative to
     *                          the specified `property` according to the indicated `direction`.
     * 
     *                          Returns `null` if `wrap` is `false` and either `direction` is `next` and the `property`
     *                          is the _last_ key in the specified `obj`, or if `direction` is `previous` and
     *                          the `property` is the _first_ key in the specified `obj`.
     * 
     *                          Returns a tuple containing the key and value of the _last_ element
     *                          or the _first_ element in the specified `obj` if `wrap` is `true`
     *                          and either `direction` is `next` and the `property` is the _last_ key in the specified `obj`,
     *                          or if `direction` is `previous` and the `property` is the _first_ key in the specified `obj`, respectively.
     * 
     *                          If the specified `obj` is an *empty object*, returns `null`.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     * 
     * @see {@link previousElement `previousElement()`}
     * @see {@link nextElement `nextElement()`}
     * @see {@link adjacentKey `adjacentKey()`}
     * @see {@link adjacentValue `adjacentValue()`}
     */
    export const adjacentElement = <
        ObjectT extends object,
        KeyT extends (keyof ObjectT) | string,
        WrapT extends boolean | undefined,
        ReturnObjectT extends (KeyT extends keyof ObjectT ? Omit<ObjectT, KeyT> : ObjectT),
        ReturnKeyT extends (keyof ReturnObjectT extends never ? keyof ObjectT : keyof ReturnObjectT),
        ReturnValueT extends ObjectT[ReturnKeyT extends keyof ObjectT ? ReturnKeyT : never],
        ReturnT extends (WrapT extends true ? [ReturnKeyT, ReturnValueT] : [ReturnKeyT, ReturnValueT] | null)
    > ( obj: ObjectT, property: KeyT, direction: TraversalDirection, wrap?: WrapT ): ReturnT => {

        const key = adjacentKey(obj, property, direction, wrap);

        return (
            key !== null
                ? [ key, obj[key as keyof ObjectT] ]
                : null
        ) as ReturnT;

    };


    // General Object Helper Functions

    /**
     * Fill the specified `properties` of the designated `obj` with
     * the specified `fillValue`.
     * 
     * Both new and existing properties in the designated `obj`
     * will be set to the specified `fillValue`.
     * 
     * @template ObjectT        The type of the `obj` argument.
     * @template PropertiesT    The type of the `properties` argument.
     * @template ValueT         The type of the `fillValue` argument.
     * @template ReturnT        The inferred function return type.
     * 
     * @param obj               The object being filled.
     * @param properties        An array of property keys to be filled.
     * @param fillValue         The value to fill the specified `properties` with.
     * 
     * @returns                 The filled `obj`.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     */
    export function fill <
        ObjectT extends object,
        PropertiesT extends (keyof ObjectT | ObjectKey)[],
        ValueT,
        ReturnT extends FilledObjectType<ObjectT, PropertiesT, ValueT>
    > ( obj: ObjectT, properties: PropertiesT, fillValue: ValueT ): ReturnT;
    /**
     * Get an object containing the specified `properties` with
     * the designated `fillValue`.
     * 
     * @template PropertiesT    The type of the `properties` argument.
     * @template ValueT         The type of the `fillValue` argument.
     * @template ReturnT        The inferred function return type.
     * 
     * @param properties        An array of property keys to be filled.
     * @param fillValue         The value to fill the specified `properties` with.
     * 
     * @returns                 A new object containing all of the specified `properties`,
     *                          each of which will be set to the designated `fillValue`.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     */
    export function fill <
        PropertiesT extends ObjectKey[],
        ValueT,
        ReturnT extends FilledObjectType<{}, PropertiesT, ValueT>
    > ( properties: PropertiesT, fillValue: ValueT ): ReturnT;
    export function fill <
        T extends object | ObjectKey[],
        U extends (T extends ObjectKey[] ? unknown : (keyof T | ObjectKey)[]),
        V extends (T extends ObjectKey[] ? undefined : unknown),
        ReturnT extends FilledObjectType<
            T extends ObjectKey[] ? {} : T,
            T extends ObjectKey[] ? T : (U extends ObjectKey[] ? U : never),
            U extends ObjectKey[] ? V : U
        >
    > ( objOrProperties: T, propertiesOrFillValue: U, fillValue?: V ): ReturnT {

        let obj: object = !Array.isArray(objOrProperties)
            ? objOrProperties
            : {};
        let properties: ObjectKey[] = (Array.isArray(objOrProperties)
            ? objOrProperties
            : propertiesOrFillValue) as ObjectKey[];
        let value: unknown = Array.isArray(objOrProperties)
            ? propertiesOrFillValue
            : fillValue;

        for (let property of properties)
            obj[property] = value;

        return obj as ReturnT;

    }

    export function freezeRecursive <T extends object> ( obj: T ): ReadonlyRecursive<T> {

        Object.freeze(obj);

        for (const key in obj) {
            const value = obj[key];

            if ( typeof value == 'object' && !Array.isArray(value) ) {
                freezeRecursive(value as object);
            }
        }

        return obj as unknown as ReadonlyRecursive<T>;

    }


    // Complex Object Helper Functions

    /**
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     */
    export function getComplexObjectKeys <ObjectT extends TrueObject> ( obj: ObjectT ): ComplexObjectKey<ObjectT>[] {

        const getKeys = ( currentObj: TrueObject, baseKey?: ComplexObjectKeyType ): ComplexObjectKeyType[] => {

            let keys = [] as ComplexObjectKeyType[];
            let currentKey: ComplexObjectKeyType | undefined = undefined;

            for (let key in currentObj) {
                currentKey = (baseKey ? baseKey.concat([key]) : [key]);
                keys.push(currentKey);

                if (isTrueObject(currentObj[key]))
                    keys.push( ...getKeys(currentObj[key], currentKey) );
            }

            return keys;

        };

        return getKeys(obj) as ComplexObjectKey<ObjectT>[];

    }

    /**
     * Get the *Nested Object* in the designated `obj`
     * containing the *Nested Element* specified by `property`.
     * 
     * @example
     * const foo = {
     *    bar: {
     *       baz: 42;
     *    }
     * };
     * 
     * getNestedObject(foo, ['bar']);           // { bar: { baz: 42 } }
     * getNestedObject(foo, ['bar', 'baz']);    // { baz: 42 }
     * 
     * @template ObjectT    The type of the `obj` argument.
     * @template KeyT       The type of the `property` argument.
     * 
     * @param obj           The object being evaluated.
     * 
     * @param key           The {@link ObjectKey} or {@link NestedObjectKey} corresponding
     *                      to the desired *Nested Element*.
     * 
     * @returns             The *Nested Object* containing the *Nested Element*
     *                      in `obj` specified by `property`.
     *  
     *                      If a top-level element is specified, returns `obj`.
     * 
     *                      Returns `undefined` if `property` does not refer to a valid *Nested Element*
     *                      of `obj`, or if the *Nested Object* or one or more of the containing
     *                      objects are {@link OptionalNestedObjectKey *Optional Nested Objects*}
     *                      that are *missing*.
     * 
     * @apistatus           🧪 *Experimental*
     * @since               `v1`
     * 
     * @see {@link getNestedProperty `getNestedProperty()`}
     */
    export function getNestedObject <
        ObjectT extends TrueObject,
        KeyT extends DynamicObjectKeyType = (
            [DynamicObjectKey<ObjectT>] extends [never]
                ? DynamicObjectKeyType
                : DynamicObjectKey<ObjectT>
        ),
        ReturnT extends object | undefined = (
            KeyT extends DynamicObjectKey<ObjectT>
                ? ExtractNestedObject<ObjectT, KeyT>
                : object | undefined
        )
    > ( obj: ObjectT, property: KeyT ): ReturnT {

        assertIsType(obj, 'object');

        const propertySegments = ArrayUtils.arrayify(property).slice(0, -1);

        // property = (property as KeyT as ComplexObjectKeyType).slice(0, -1) as KeyT;

        let currentValue: any = obj;

        for (let i = 0; i < propertySegments.length; i++) {
        // for (const segment of (property as ComplexObjectKey<ObjectT>)) {
            const segment = propertySegments[i];

            if ( typeof currentValue != 'object' || !(segment in currentValue) )
                return undefined as ReturnT;

            currentValue = currentValue[segment];
        }

        return currentValue;

        // if (!Array.isArray(property) || property.length < 2)
        //     return obj as ExtractNestedObject<T, KeyT>;

        // return getNestedObject(obj[property[0] as keyof T], property.slice(1) as any);

    }
    /**
     * Get the *Nested Element* in the designated `obj`
     * specified by `property`.
     * 
     * @example
     * const foo = {
     *    bar: {
     *       baz: 42;
     *    }
     * };
     * 
     * getNestedProperty(foo, ['bar']);         // { baz: 42 }
     * getNestedProperty(foo, ['bar', 'baz']);  // 42
     * 
     * @template ObjectT    The type of the `obj` argument.
     * @template KeyT       The type of the `property` argument.
     * 
     * @param obj           The object being evaluated.
     * 
     * @param key           The {@link ObjectKey} or {@link NestedObjectKey} corresponding
     *                      to the desired *Nested Element*.
     * 
     * @returns             The *Nested Element* in `obj` specified by `property`.
     * 
     *                      Returns `undefined` if `property` does not refer to a valid *Nested Element*
     *                      of `obj`, or if one or more of the containing objects
     *                      are {@link OptionalNestedObjectKey *Optional Nested Objects*}
     *                      that are *missing*.
     * 
     * @apistatus           🧪 *Experimental*
     * @since               `v1`
     * 
     * @see {@link getNestedObject `getNestedObject()`}
     */
    export function getNestedProperty <
        ObjectT extends TrueObject,
        KeyT extends DynamicObjectKeyType = (
            [DynamicObjectKey<ObjectT>] extends [never]
                ? DynamicObjectKeyType
                : DynamicObjectKey<ObjectT>
        ),
        ReturnT = (
            KeyT extends DynamicObjectKey<ObjectT>
                ? ExtractNestedObjectValue<ObjectT, KeyT>
                : any
        )
    > ( obj: ObjectT, property: KeyT ): ReturnT {

        assertIsType(obj, 'object');

        if (!Array.isArray(property))
            return obj[property as keyof ObjectT];
        else if (property.length == 1)
            return obj[property[0] as keyof ObjectT];

        const nestedObj = getNestedObject(obj, property);

        if (isNullable(nestedObj))
            return undefined as ReturnT;

        return nestedObj![property[property.length - 1] as keyof typeof nestedObj] as ReturnT;

    }
    export function nestedPropertyExists <
        ObjectT extends TrueObject,
        KeyT extends DynamicObjectKeyType,
        ReturnT extends (
            (
                [DynamicObjectKey<ObjectT>] extends [never]
                    ? boolean
                    : (KeyT extends DynamicObjectKey<ObjectT> ? true : false)
            )
        )
    > ( obj: ObjectT, property: KeyT ): ReturnT {

        assertIsType(obj, 'object');

        if ( !Array.isArray(property) )
            return ((property as string) in obj) as ReturnT;
        else if (property.length == 1)
            return ((property[0] as string) in obj) as ReturnT;

        const nestedObj = getNestedObject(obj, property as any);

        return (
            !isNullable(nestedObj)
            && (ArrayUtils.lastElement(property) in (nestedObj as object))
        ) as ReturnT;

    }
    
    /**
     * @apistatus           🧪 *Experimental*
     * @since               `v1`
     */
    export function setNestedProperty <
        ObjectT extends TrueObject,
        ReplaceT extends boolean | undefined = undefined,
        KeyT extends DynamicObjectKeyType = (
            ReplaceT extends undefined
                ? (
                    [DynamicObjectKey<ObjectT>] extends [never]
                        ? DynamicObjectKeyType
                        : DynamicObjectKey<ObjectT> | DynamicObjectKeyType
                )
                : (
                    ReplaceT extends true
                        ? (
                            [DynamicObjectKey<ObjectT>] extends [never]
                                ? DynamicObjectKeyType
                                : DynamicObjectKey<ObjectT>
                        )
                        : DynamicObjectKeyType
                )
        ),
        ValueT = (
            KeyT extends DynamicObjectKey<ObjectT>
                ? ExtractNestedObjectValue<ObjectT, KeyT>
                : unknown
        ),
        ReturnT extends object | null = (
            KeyT extends DynamicObjectKey<ObjectT>
                ? ExtractNestedObject<ObjectT, KeyT> | null
                : object | null
        )
    > (
        obj: ObjectT,
        property: KeyT,
        value: ValueT,
        replaceExistingValue?: ReplaceT,
        addMissingObjects: boolean = true
    ): ReturnT {

        assertIsType(obj, 'object');

        const propertySegments = ArrayUtils.arrayify(property) as ComplexObjectKeyType;
        const nestedObjSegments = propertySegments.slice(0, -1);
        const propertyName = ArrayUtils.lastElement(propertySegments);

        let currentObj: object = obj;

        for (let i = 0; i < nestedObjSegments.length; i++) {
            const currentSegment = nestedObjSegments[i];

            if (!isType(currentObj, 'object'))
                return null as ReturnT;

            if ( !(currentSegment in currentObj) || currentObj[currentSegment] === undefined ) {
                if (addMissingObjects)
                    currentObj[currentSegment] = {};
                else
                    return null as ReturnT;
            }

            currentObj = currentObj[currentSegment];
        }

        if ( isType(currentObj, 'object') && (!(propertyName in currentObj) || replaceExistingValue) )
            currentObj[propertyName] = value;

        return currentObj as ReturnT;

    }

    /**
     * Query and/or manipulate the *Nested Element* in `obj`
     * specified by `property` using the designated `callback` function.
     * 
     * By default, the original `obj` is **not** modified and a
     * {@link deepClone deep clone} of `obj` is made *every time*
     * this function is called. To modify the original `obj` instead
     * of making a copy, use the `modifyObj` argument.
     * 
     * @example
     * const foo = {
     *    bar: {
     *       foobar: 'Hello, World!',
     *       baz: {
     *          foobaz: 42
     *       }
     *    }
     * };
     * const cb: NestedObjectCallbackFunction = (key, value, obj, property): string  => {
     *    
     *    console.log(`Processing Property 'property' (${key.join('.')}) with a value of`, value);
     *    obj[`${property}Value`] = value;
     *    return (typeof value);
     * 
     * }
     * 
     * const bar = forNestedProperty(cb, ['bar', 'foobar']);
     * const baz = forNestedProperty(cb, ['bar', 'baz', 'foobaz'], true);
     * 
     * console.log("foo:", foo);
     * console.log("bar:", bar);
     * console.log("baz:", baz);
     * // Prints:
     * // Processing Key 'foobar' (bar.foobar) with a value of 'Hello, World!'
     * // Processing Key 'foobaz' (bar.baz.foobaz) with a value of 42
     * // foo: {
     * //    bar: {
     * //       foobar: 'Hello, World!',
     * //       baz: {
     * //         foobaz: 'number'
     * //         foobazValue: 42
     * //       }
     * //    }
     * // }
     * // bar: {
     * //    bar: {
     * //       foobar: 'string',
     * //       foobarValue: 'Hello, World!',
     * //       baz: {
     * //         foobaz: 42
     * //       }
     * //    }
     * // }
     * // baz: {
     * //    bar: {
     * //       foobar: 'Hello, World!',
     * //       baz: {
     * //         foobaz: 'number',
     * //         foobazValue: 42
     * //       }
     * //    }
     * // }
     * 
     * 
     * @template ObjectT            The type of the `obj` argument.
     * @template KeyT               The type of the `property` argument.
     * @template CallbackReturnT    The return type of the `callback` function.
     * @template ReturnT            The inferred function return type.
     * 
     * @param obj                   The object being queried and/or modified.
     * 
     * @param property              A {@link ObjectKey Simple Object Key}
     *                              or {@link NestedObjectKey Nested Object Key} corresponding
     *                              to the desired *Nested Element* in `obj`.
     * 
     * @param callback              The {@link NestedObjectCallbackFunction callback function}
     *                              used to operate on the desired element.
     * 
     * @param modifyObj             Indicates if the original `obj` should be *modified*
     *                              or {@link deepClone cloned} before attempting to operate
     *                              on the nested element.
     * 
     * @returns                     The resulting object.
     * 
     *                              Based on the value of the `modifyObj` argument, this
     *                              object may be a {@link deepClone deep clone} of `obj`
     *                              or simply a reference to the modified `obj`.
     * 
     * @apistatus                   🧪 *Experimental*
     * @since                       `v1`
     * 
     * @see {@link forEachNestedProperty `forEachNestedProperty()`}
     */
    export function forNestedProperty <
        ObjectT extends object,
        KeyT extends DynamicObjectKeyType = (
            [DynamicObjectKey<ObjectT>] extends [never]
                ? DynamicObjectKeyType
                : DynamicObjectKey<ObjectT>
        ),
        CallbackReturnT = any,
        ReturnT extends object = (
            CallbackReturnT extends undefined
                ? ObjectT
                : (
                    KeyT extends DynamicObjectKey<ObjectT>
                        ? ReplaceInNestedObject<ObjectT, KeyT, CallbackReturnT>
                        : object
                )
        )
    > (
        obj: ObjectT,
        property: KeyT,
        callback: (
            KeyT extends DynamicObjectKey<ObjectT>
                ? NestedObjectCallbackFunction<ObjectT, KeyT, CallbackReturnT>
                : GenericNestedObjectCallbackFunction<CallbackReturnT>
        ),
        modifyObj: boolean = false
    ): ReturnT {
        
            assertIsType(obj, 'object');
            
            const propertyArray = ArrayUtils.arrayify(property);
        
            if (propertyArray.length == 0)
                throw new TypeError("No valid Nestable Property Keys were provided!");
            
            let mutableObj = (!modifyObj ? deepClone(obj) : obj) as ObjectT;
            let nestedObj = getNestedObject(mutableObj, property);
        
            if (isNullable(nestedObj))
                return mutableObj as unknown as ReturnT;
        
            const propertyName = propertyArray[propertyArray.length - 1] as SimpleObjectKeyType;
            const returnValue = (callback as typeof callback as any)(
                propertyArray,
                nestedObj[propertyName],
                nestedObj,
                propertyName
            ) as CallbackReturnT;
        
            if (typeof returnValue != 'undefined')
                (nestedObj[propertyName] as any) = returnValue;
        
            return mutableObj as unknown as ReturnT;
        
    }
    /**
     * Query and/or manipulate the *Nested Element(s)* in `obj`
     * specified by `properties` using the designated `callback` function.
     * 
     * By default, the original `obj` is **not** modified and a
     * {@link deepClone deep clone} of `obj` is made *every time*
     * this function is called. To modify the original `obj` instead
     * of making a copy, use the `modifyObj` argument.
     * 
     * @example
     * const foo = {
     *    bar: {
     *       foobar: 'Hello, World!',
     *       baz: {
     *          foobaz: 42
     *       }
     *    }
     * };
     * const fooProps = [['bar', 'foobar'], ['bar', 'baz', 'foobaz']];
     * const typeCb: NestedObjectCallbackFunction = (key, value, obj, property): string  => {
     *    
     *    console.log(`Processing Property 'property' (${key.join('.')}) with a value of`, value);
     *    obj[`${property}Value`] = value;
     *    return (typeof value);
     * 
     * }
     * const equalityCb: NestedObjectCallbackFunction = (key, value, obj, property): boolean  => {
     *    
     *    const THE_ANSWER = 42;
     * 
     *    console.log(`Processing Property 'property' (${key.join('.')}) with a value of`, value);
     *    obj[`${property}Value`] = value;
     *    return (value === THE_ANSWER);
     * 
     * }
     * 
     * const bar = forNestedProperty(typeCb, fooProps);
     * const bar = forNestedProperty(equalityCb, fooProps, true);
     * 
     * console.log("foo:", foo);
     * console.log("bar:", bar);
     * console.log("baz:", baz);
     * // Prints:
     * // Processing Key 'foobar' (bar.foobar) with a value of 'Hello, World!'
     * // Processing Key 'foobaz' (bar.baz.foobaz) with a value of 42
     * // Processing Key 'foobar' (bar.foobar) with a value of 'Hello, World!'
     * // Processing Key 'foobaz' (bar.baz.foobaz) with a value of 42
     * // foo: {
     * //    bar: {
     * //       foobar: 'string',
     * //       foobarValue: 'Hello, World!',
     * //       baz: {
     * //         foobaz: 'number'
     * //         foobazValue: 42
     * //       }
     * //    }
     * // }
     * // bar: {
     * //    bar: {
     * //       foobar: false,
     * //       foobarValue: 'Hello, World!',
     * //       baz: {
     * //         foobaz: true,
     * //         foobazValue: 42
     * //       }
     * //    }
     * // }
     * // baz: {
     * //    bar: {
     * //       foobar: 'string',
     * //       foobarValue: 'Hello, World!',
     * //       baz: {
     * //         foobaz: 'number'
     * //         foobazValue: 42
     * //       }
     * //    }
     * // }
     * 
     * 
     * @template ObjectT            The type of the `obj` argument.
     * @template NestedKeysT        The type of the `properties` argument.
     * @template CallbackReturnT    The return type of the `callback` function.
     * @template ReturnT            The inferred function return type.
     * 
     * @param obj                   The object being queried and/or modified.
     * 
     * @param properties            A array of {@link ObjectKey Simple Object Keys}
     *                              corresponding to the desired *Nested Elements* in `obj`.
     * 
     * @param callback              The {@link NestedObjectCallbackFunction callback function}
     *                              used to operate on the desired elements.
     * 
     * @param modifyObj             Indicates if the original `obj` should be *modified*
     *                              or {@link deepClone cloned} before attempting to operate
     *                              on the nested elements.
     * 
     * @returns                     The resulting object.
     * 
     *                              Based on the value of the `modifyObj` argument, this
     *                              object may be a {@link deepClone deep clone} of `obj`
     *                              or simply a reference to the modified `obj`.
     * 
     * @apistatus                   🧪 *Experimental*
     * @since                       `v1`
     * 
     * @see {@link forNestedProperty `forNestedProperty()`}
     */
    export function forEachNestedProperty <
        ObjectT extends TrueObject,
        NestedKeysT extends SimpleObjectKeyType[] = (
            [SimpleObjectKey<ObjectT>] extends [never]
                ? SimpleObjectKeyType
                : SimpleObjectKey<ObjectT>
        )[],
        CallbackReturnT = any,
        ReturnT extends object = (
            CallbackReturnT extends undefined
                ? ObjectT
                : (
                    NestedKeysT extends SimpleObjectKey<ObjectT>[]
                        ? ReplaceInNestedObject<
                            ObjectT,
                            NestedKeysT[number],
                            CallbackReturnT
                        >
                        : object
                )
        )
    > (
        obj: ObjectT,
        properties: NestedKeysT,
        callback: (
            NestedKeysT extends SimpleObjectKey<ObjectT>[]
                ? NestedObjectCallbackFunction<ObjectT, NestedKeysT[number], CallbackReturnT>
                : GenericNestedObjectCallbackFunction<CallbackReturnT>
        ),
        modifyObj?: boolean
    ): ReturnT;
    /**
     * Query and/or manipulate the *Nested Element(s)* in `obj`
     * specified by `properties` using the designated `callback` function.
     * 
     * By default, the original `obj` is **not** modified and a
     * {@link deepClone deep clone} of `obj` is made *every time*
     * this function is called. To modify the original `obj` instead
     * of making a copy, use the `modifyObj` argument.
     * 
     * @example
     * const foo = {
     *    bar: {
     *       foobar: 'Hello, World!',
     *       baz: {
     *          foobaz: 42
     *       }
     *    }
     * };
     * const fooProps = [['bar', 'foobar'], ['bar', 'baz', 'foobaz']];
     * const typeCb: NestedObjectCallbackFunction = (key, value, obj, property): string  => {
     *    
     *    console.log(`Processing Property 'property' (${key.join('.')}) with a value of`, value);
     *    obj[`${property}Value`] = value;
     *    return (typeof value);
     * 
     * }
     * const equalityCb: NestedObjectCallbackFunction = (key, value, obj, property): boolean  => {
     *    
     *    const THE_ANSWER = 42;
     * 
     *    console.log(`Processing Property 'property' (${key.join('.')}) with a value of`, value);
     *    obj[`${property}Value`] = value;
     *    return (value === THE_ANSWER);
     * 
     * }
     * 
     * const bar = forNestedProperty(typeCb, fooProps);
     * const bar = forNestedProperty(equalityCb, fooProps, true);
     * 
     * console.log("foo:", foo);
     * console.log("bar:", bar);
     * console.log("baz:", baz);
     * // Prints:
     * // Processing Key 'foobar' (bar.foobar) with a value of 'Hello, World!'
     * // Processing Key 'foobaz' (bar.baz.foobaz) with a value of 42
     * // Processing Key 'foobar' (bar.foobar) with a value of 'Hello, World!'
     * // Processing Key 'foobaz' (bar.baz.foobaz) with a value of 42
     * // foo: {
     * //    bar: {
     * //       foobar: 'string',
     * //       foobarValue: 'Hello, World!',
     * //       baz: {
     * //         foobaz: 'number'
     * //         foobazValue: 42
     * //       }
     * //    }
     * // }
     * // bar: {
     * //    bar: {
     * //       foobar: false,
     * //       foobarValue: 'Hello, World!',
     * //       baz: {
     * //         foobaz: true,
     * //         foobazValue: 42
     * //       }
     * //    }
     * // }
     * // baz: {
     * //    bar: {
     * //       foobar: 'string',
     * //       foobarValue: 'Hello, World!',
     * //       baz: {
     * //         foobaz: 'number'
     * //         foobazValue: 42
     * //       }
     * //    }
     * // }
     * 
     * 
     * @template ObjectT            The type of the `obj` argument.
     * @template NestedKeysT        The type of the `properties` argument.
     * @template CallbackReturnT    The return type of the `callback` function.
     * @template ReturnT            The inferred function return type.
     * 
     * @param obj                   The object being queried and/or modified.
     * 
     * @param properties            A array of {@link ComplexObjectKey Complex Object Keys}
     *                              corresponding to the desired *Nested Elements* in `obj`.
     * 
     * @param callback              The {@link NestedObjectCallbackFunction callback function}
     *                              used to operate on the desired elements.
     * 
     * @param modifyObj             Indicates if the original `obj` should be *modified*
     *                              or {@link deepClone cloned} before attempting to operate
     *                              on the nested elements.
     * 
     * @returns                     The resulting object.
     * 
     *                              Based on the value of the `modifyObj` argument, this
     *                              object may be a {@link deepClone deep clone} of `obj`
     *                              or simply a reference to the modified `obj`.
     * 
     * @apistatus                   🧪 *Experimental*
     * @since                       `v1`
     * 
     * @see {@link forNestedProperty `forNestedProperty()`}
     */
    export function forEachNestedProperty <
        ObjectT extends TrueObject,
        NestedKeysT extends ComplexObjectKeyType[] = (
            [ComplexObjectKey<ObjectT>] extends [never]
                ? ComplexObjectKeyType
                : ComplexObjectKey<ObjectT>
        )[],
        CallbackReturnT = any,
        ReturnT extends object = (
            CallbackReturnT extends undefined
                ? ObjectT
                : (
                    NestedKeysT extends ComplexObjectKey<ObjectT>[]
                        ? ReplaceInNestedObject<
                            ObjectT,
                            NestedKeysT[number],
                            CallbackReturnT
                        >
                        : object
                )
        )
    > (
        obj: ObjectT,
        properties: NestedKeysT,
        callback: (
            NestedKeysT extends SimpleObjectKey<ObjectT>[]
                ? NestedObjectCallbackFunction<ObjectT, NestedKeysT[number], CallbackReturnT>
                : GenericNestedObjectCallbackFunction<CallbackReturnT>
        ),
        modifyObj?: boolean
    ): ReturnT;
    export function forEachNestedProperty <
        ObjectT extends TrueObject,
        NestedKeysT extends DynamicObjectKeyType[] = (
            [DynamicObjectKey<ObjectT>] extends [never]
                ? DynamicObjectKeyType
                : DynamicObjectKey<ObjectT>
        )[],
        CallbackReturnT = any,
        ReturnT extends object = (
            CallbackReturnT extends undefined
                ? ObjectT
                : (
                    NestedKeysT extends DynamicObjectKey<ObjectT>[]
                        ? ReplaceInNestedObject<
                            ObjectT,
                            NestedKeysT[number],
                            CallbackReturnT
                        >
                        : object
                )
        )
    > (
        obj: ObjectT,
        properties: NestedKeysT,
        callback: (
            NestedKeysT extends SimpleObjectKey<ObjectT>[]
                ? NestedObjectCallbackFunction<ObjectT, ArrayUtils.ArrayifyType<NestedKeysT>[number], CallbackReturnT>
                : GenericNestedObjectCallbackFunction<CallbackReturnT>
        ),
        modifyObj: boolean = false
    ): ReturnT {

        assertIsType(obj, 'object');

        let mutableObj = (!modifyObj ? deepClone(obj) : obj) as ObjectT;

        for (const property of properties)
            forNestedProperty(mutableObj, property, callback as any, true) as unknown as ReturnT;

        return mutableObj;

    }

    export const stringifyDynamicObjectKeys = ( objKeys: ObjectUtils.DynamicObjectKeyType ): string => (
        Array.isArray(objKeys)
            ? `[${objKeys.join('][')}]`
            : `[${String(objKeys)}]`
    );

}


/* Sensitive Object Properties */

/**
 * A namespace containing utilty types, interfaces,
 * classes, and functions related to *Sensitive Object Properties*.
 * 
 * @apistatus   🧪 *Experimental*
 * @since       `v1`
 */
export namespace SensitiveProperties {

    /**
     * Indicates the sensitivity to use when
     * {@link redact redacting sensitive object properties}.
     * 
     * | Sensitivity | Sensitive String                | Sensitive Object                 | Sensitive `null` / `undefined`  |
     * | ----------- | ------------------------------- | -------------------------------- | ------------------------------- |
     * | `'low'`     | `'<Sensitive String(12) Data>'` | `'<Sensitive Object Data>'`      | `null` / `undefined`            |
     * | `'medium'`  | `'<Sensitive String Data>'`     | `'<Sensitive Object      Data>'` | `null` / `undefined`            |
     * | `'high'`    | `'<Sensitive Data>'`            | `'<Sensitive Data>'`             | `'<Sensitive Data>'`            |
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link redact `redactSensitiveProperties()`}
     * @see {@link BasicSensitiveClass}
     * @see {@link AbstractBasicSensitiveClass}
     */
    export type RedactionSensitivity = 'low' | 'medium' | 'high';

    /**
     * An object type representing a map of *Sensitive Object Keys*
     * to the corresponding {@link RedactionSensitivity sensitivity of redaction}.
     * 
     * @template ObjectT    The type of the *Sensitive Object*.
     * 
     * @apistatus           🧪 *Experimental*
     * @since               `v1`
     */
    export type PropertySensitivityMap <
        ObjectT extends object = any,
        KeyT extends ObjectUtils.DynamicObjectKey<ObjectT> = ObjectUtils.DynamicObjectKey<ObjectT>
    > = Map<KeyT, RedactionSensitivity>;
    
    /**
     * Denotes classes that contain one or more *Sensitive Properties* that
     * need to be redacted at runtime before being logged or output somewhere.
     * 
     * Classes can denote which properties are considered to be *Sensitive*
     * by overriding the {@link sensitiveProperties `sensitiveProperties()`} method.
     * 
     * Classes can also denote the {@link RedactionSensitivity sensitivity of redaction}
     * to use when redacting *Sensitive Properties* by overriding the
     * {@link redactionSensitivity `redactionSensitivity()`} method.
     * 
     * This interface differs from {@link ComplexSensitiveClass} in that all *Sensitive Properties*
     * use the *same* {@link RedactionSensitivity sensitivity of redaction} as specified by
     * the {@link redactionSensitivity `redactionSensitivity()`} method.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link ComplexSensitiveClass}
     * @see {@link AbstractBasicSensitiveClass}
     * @see {@link redact `redactSensitiveProperties()`}
     */
    export interface BasicSensitiveClass <
        ThisT extends object,
        SensitivePropertiesT extends ObjectUtils.DynamicObjectKey<ThisT>
    > extends Inspectable {
    
        /**
         * Get the *Sensitive Properties* of this object that
         * need to be redacted at runtime before being logged or output somewhere.
         * 
         * @returns An array of keys corresponding to the properties of the object
         *          that are considered to be *Sensitive*.
         */
        sensitiveProperties (): SensitivePropertiesT;

        /**
         * Get the {@link RedactionSensitivity sensitivity of redaction} to use
         * when redacting {@link sensitiveProperties *Sensitive Properties*}.
         * 
         * @returns The {@link RedactionSensitivity} to be used when redacting the
         *          properties of this object returned by {@link sensitiveProperties `sensitiveProperties()`}.
         */
        redactionSensitivity (): RedactionSensitivity;

        [nodeInspect.custom] (): RedactedObject<ThisT, SensitivePropertiesT>;
    
    }
    /**
     * Denotes classes that contain one or more *Sensitive Properties* that
     * need to be redacted at runtime before being logged or output somewhere.
     * 
     * Classes can denote which properties are considered to be *Sensitive*
     * by overriding the {@link sensitiveProperties `sensitiveProperties()`} method.
     * 
     * This interface differs from {@link BasicSensitiveClass} in that each *Sensitive Property*
     * has its own {@link RedactionSensitivity sensitivity of redaction} as specified by
     * the {@link sensitiveProperties `sensitiveProperties()`} method.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link BasicSensitiveClass}
     * @see {@link AbstractComplexSensitiveClass}
     * @see {@link redact `redactSensitiveProperties()`}
     */
    export interface ComplexSensitiveClass <
        ThisT extends object,
        SensitivePropertiesT extends PropertySensitivityMap<ThisT>
    > extends Inspectable {
    
        sensitiveProperties (): SensitivePropertiesT;

        [nodeInspect.custom] (): RedactedObject<ThisT, SensitivePropertiesT>;
    
    }
    /**
     * A union of interfaces denoting classes containing one or more *Sensitive Properties* that
     * need to be redacted at runtime before being logged or output somewhere.
     * 
     * Classes can denote which properties are considered to be *Sensitive*
     * by overriding the {@link sensitiveProperties `sensitiveProperties()`} method.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link BasicSensitiveClass}
     * @see {@link ComplexSensitiveClass}
     * @see {@link AbstractBasicSensitiveClass}
     * @see {@link AbstractComplexSensitiveClass}
     * @see {@link redact `redactSensitiveProperties()`}
     */
    export type SensitiveClass <
        ThisT extends object,
        SensitivePropertiesT extends ObjectUtils.DynamicObjectKey<ThisT> = ObjectUtils.DynamicObjectKey<ThisT>
    > = (
        SensitivePropertiesT extends ObjectUtils.DynamicObjectKey<ThisT>
            ? BasicSensitiveClass<ThisT, SensitivePropertiesT>
            : (
                SensitivePropertiesT extends PropertySensitivityMap<ThisT>
                    ? ComplexSensitiveClass<ThisT, SensitivePropertiesT>
                    : never
            )
    );

    type IsSensitiveKeyT <
        SensitivePropertiesT extends ObjectUtils.ComplexObjectKeyType,
        KeyT extends ObjectUtils.ComplexObjectKeyType = never
    > = (
        [KeyT] extends [never]
            ? false
            : (
                KeyT extends SensitivePropertiesT
                    ? true
                    : false
            )
    );
    type RedactedObjectHelper <
        T,
        SensitivePropertiesT extends ObjectUtils.ComplexObjectKeyType,
        KeyT extends ObjectUtils.ComplexObjectKeyType = never
    > = (
        IsSensitiveKeyT<SensitivePropertiesT, KeyT> extends true
            ? `<Sensitive ${T extends object ? 'Object' : Capitalize<TypeofTypeString<NonNullable<T>>>} Data>`
            : (
                ObjectUtils.ExtractObjectType<T> extends infer O
                    ? (
                        [O] extends [never]
                            ? T
                            : {
                                [K in keyof O]: RedactedObjectHelper<
                                    O[K],
                                    SensitivePropertiesT, 
                                    ArrayUtils.TupleFromTypes<KeyT, K>
                                >;
                            }
                    )
                    : never
            )
    );
    export type RedactedObject <
        ObjectT extends object,
        SensitivePropertiesT extends ObjectUtils.DynamicObjectKeyType | PropertySensitivityMap
    > = RedactedObjectHelper<
        ObjectT,
        ArrayUtils.ArrayifyType<
            SensitivePropertiesT extends PropertySensitivityMap<infer T, infer U>
                ? U
                : SensitivePropertiesT
        >
    >;
        // export type RedactedObject <
    //     T extends object,
    //     U extends ObjectUtils.DynamicObjectKeyType[] | PropertySensitivityMap,
    //     V extends ObjectUtils.ComplexObjectKeyType | void = void
    // > = (
    //     ArrayUtils.ArrayifyType<(
    //         U extends ObjectUtils.DynamicObjectKeyType[]
    //             ? U[number]
    //             : (
    //                 U extends PropertySensitivityMap<any, infer K>
    //                     ? K
    //                     : never
    //             )
    //     )> extends infer K
    //         ? {
    //             [Key in keyof T]: (
    //                 ArrayUtils.TupleFromTypes<V extends void ? [] : V, Key> extends infer CurrentKeyT
    //                     ? (
    //                         T[Key] extends object
    //                             ? (
    //                                 CurrentKeyT extends K
    //                                     ? `<Sensitive Object Data>`
    //                                     : RedactedObject<
    //                                         T[Key],
    //                                         U,
    //                                         CurrentKeyT extends ObjectUtils.ComplexObjectKeyType ? CurrentKeyT : never
    //                                     >
    //                             )
    //                             : (
    //                                 CurrentKeyT extends K
    //                                     ? (
    //                                         `<Sensitive ${Capitalize<TypeofTypeString< NonNullable< Exclude<T[Key], Nullable> > >>} Data>`
    //                                         | Extract<T[Key], Nullable>
    //                                     )
    //                                     : T[Key]
    //                             )
    //                     )
    //                     : never
    //             )
    //         }
    //         : never
    // );
    
    /**
     * An abstract class implementation of the {@link BasicSensitiveClass} interface
     * that overrides the {@link nodeInspect.custom custom inspection method}
     * to call {@link redact `redactSensitiveProperties()`} with the list
     * of properties returned by the abstract {@link sensitiveProperties `sensitiveProperties()`} method
     * and the {@link RedactionSensitivity sensitivity of redaction} returned by the
     * default-implemented {@link redactionSensitivity `redactionSensitivity()`} method.
     * 
     * If the {@link redactionSensitivity `redactionSensitivity()`} method is not overridden,
     * it will simply return `'medium'` by default.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link BasicSensitiveClass}
     * @see {@link redact `redactSensitiveProperties()`}
     */
    export abstract class AbstractBasicSensitiveClass <
        ThisT extends TrueObject,
        SensitivePropertiesT extends ObjectUtils.DynamicObjectKey<ThisT>
    > implements BasicSensitiveClass<ThisT, SensitivePropertiesT> {
    
        abstract sensitiveProperties (): SensitivePropertiesT;

        redactionSensitivity = (): RedactionSensitivity => 'medium';
    
        [nodeInspect.custom] = () => redact(
            this as unknown as ThisT,
            this.sensitiveProperties() as any,
            this.redactionSensitivity()
        ) as RedactedObject<ThisT, SensitivePropertiesT>;
    
    };
    /**
     * An abstract class implementation of the {@link ComplexSensitiveClass} interface
     * that overrides the {@link nodeInspect.custom custom inspection method}
     * to call {@link redact `redactSensitiveProperties()`} with the {@link PropertySensitivityMap}
     * returned by the abstract {@link sensitiveProperties `sensitiveProperties()`} method.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link ComplexSensitiveClass}
     * @see {@link redact `redactSensitiveProperties()`}
     */
    export abstract class AbstractComplexSensitiveClass <
        ThisT extends TrueObject,
        SensitivePropertiesT extends PropertySensitivityMap<ThisT>
    > implements ComplexSensitiveClass<ThisT, SensitivePropertiesT> {
    
        abstract sensitiveProperties (): SensitivePropertiesT;
    
        [nodeInspect.custom] = () => redact(
            this as unknown as ThisT,
            this.sensitiveProperties() as any
        ) as RedactedObject<ThisT, SensitivePropertiesT>;
    
    };
    
    /**
     * Redact the `sensitiveProperties` from the specified `obj`
     * using the designated `sensitivity`.
     * 
     * @example
     * const myObj = {
     *    foo: 42,
     *    bar: "Hello, World!",
     *    baz: true
     * };
     * 
     * redactSensitiveProperties(myObj, ['foo', 'bar']);
     * // Returns:
     * // {
     * //    foo: '<Sensitive Number Data>',
     * //    bar: '<Sensitive String Data>',
     * //    baz: true
     * // }
     * 
     * @param obj                   The object whose properties are being redacted.
     * 
     * @param sensitiveProperties   An array of keys in the `obj` denoting the
     *                              properties that are considered to be *Sensitive*.
     * 
     * @param sensitivity           Indicates the {@link RedactionSensitivity sensitivity of redaction}.
     * 
     *                              Defaults to `'medium'`.
     * 
     * @returns                     An {@link ObjectUtils.ObjectRecord} containing the same properties and values
     *                              as the specified `obj` with the designated `sensitiveProperties` redacted
     *                              according to the specified `sensitivity`.
     * 
     * @apistatus                   🧪 *Experimental*
     * @since                       `v1`
     * 
     * @see {@link SensitiveClass}
     */
    export function redact <
        ObjectT extends object,
        SensitivePropertiesT extends ObjectUtils.SimpleObjectKey<ObjectT>[]
    > (
        obj: ObjectT,
        sensitiveProperties: SensitivePropertiesT,
        sensitivity?: RedactionSensitivity
    ): RedactedObject<ObjectT, SensitivePropertiesT>;
    /**
     * Redact the `sensitiveProperties` from the specified `obj`
     * using the designated `sensitivity`.
     * 
     * @example
     * const foo = {
     *    bar: {
     *       foobar: 'Hello, World!',
     *       foobaz: 42,
     *       baz: {
     *          barbaz: true
     *       }
     *    }
     * };
     * 
     * redactSensitiveProperties(myObj, [['bar', 'foobar'], ['bar', 'baz', 'barbaz']]);
     * // Returns:
     * // {
     * //    bar: {
     * //       foobar: '<Sensitive String Data>',
     * //       foobaz: 42,
     * //       baz: {
     * //          barbaz: '<Sensitive Boolean Data>'
     * //       }
     * //    }
     * // }
     * 
     * @param obj                   The object whose properties are being redacted.
     * 
     * @param sensitiveProperties   An array of keys in the `obj` denoting the
     *                              properties that are considered to be *Sensitive*.
     * 
     * @param sensitivity           Indicates the {@link RedactionSensitivity sensitivity of redaction}.
     * 
     *                              Defaults to `'medium'`.
     * 
     * @returns                     An {@link ObjectUtils.ObjectRecord} containing the same properties and values
     *                              as the specified `obj` with the designated `sensitiveProperties` redacted
     *                              according to the specified `sensitivity`.
     * 
     * @apistatus                   🧪 *Experimental*
     * @since                       `v1`
     * 
     * @see {@link SensitiveClass}
     */
    export function redact <
        ObjectT extends object,
        SensitivePropertiesT extends ObjectUtils.ComplexObjectKey<ObjectT>
    > (
        obj: ObjectT,
        sensitiveProperties: SensitivePropertiesT,
        sensitivity?: RedactionSensitivity
    ): RedactedObject<ObjectT, SensitivePropertiesT>;
    /**
     * Redact the `sensitiveProperties` from the specified `obj`.
     * 
     * @example
     * const accountInfo = {
     *    email: 'admin@example.com',
     *    username: 'admin',
     *    password: 'mySecretPassword',
     *    locale: 'en-US'
     * };
     * 
     * redactSensitiveProperties(accountInfo, { email: 'low', username: 'medium', password: 'high' });
     * // Returns:
     * // {
     * //    email: '<Sensitive String(17) Data>',
     * //    username: '<Sensitive String Data>',
     * //    password: '<Sensitive Data>',
     * //    locale: 'en-US'
     * // }
     * 
     * @param obj                   The object whose properties are being redacted.
     * 
     * @param sensitiveProperties   A map of *Sensitive Property Keys* to the corresponding
     *                              {@link RedactionSensitivity sensitivity of redaction}.
     * 
     * @returns                     An {@link ObjectUtils.ObjectRecord} containing the same properties and values
     *                              as the specified `obj` with the designated `sensitiveProperties` redacted
     *                              according to their respective {@link RedactionSensitivity sensitivity of redaction}.
     * 
     * @apistatus                   🧪 *Experimental*
     * @since                       `v1`
     * 
     * @see {@link SensitiveClass}
     */
    export function redact <
        ObjectT extends object,
        SensitivePropertiesT extends PropertySensitivityMap<ObjectT, ObjectUtils.SimpleObjectKey<ObjectT>>
    > (
        obj: ObjectT,
        sensitiveProperties: SensitivePropertiesT
    ): RedactedObject<ObjectT, SensitivePropertiesT>;
    /**
     * Redact the `sensitiveProperties` from the specified `obj`.
     * 
     * @example
     * const accountInfo = {
     *    email: 'admin@example.com',
     *    locale: 'en-US',
     *    loginCredentials: {
     *       username: 'admin',
     *       password: 'mySecretPassword'
     *    }
     * };
     * 
     * redactSensitiveProperties(
     *    accountInfo,
     *    new PropertySensitivityMap([
     *       [['email'], 'low'],
     *       [['loginCredentials', 'username'], 'medium'],
     *       [['loginCredentials', 'password'], 'high']
     *    ])
     * );
     * // Returns:
     * // {
     * //    email: '<Sensitive String(17) Data>',
     * //    locale: 'en-US',
     * //    loginCredentials: {
     * //       username: '<Sensitive String Data>',
     * //       password: '<Sensitive Data>'
     * //    }
     * // }
     * 
     * @param obj                   The object whose properties are being redacted.
     * 
     * @param sensitiveProperties   A map of *Sensitive Property Keys* to the corresponding
     *                              {@link RedactionSensitivity sensitivity of redaction}.
     * 
     * @returns                     An {@link ObjectUtils.ObjectRecord} containing the same properties and values
     *                              as the specified `obj` with the designated `sensitiveProperties` redacted
     *                              according to their respective {@link RedactionSensitivity sensitivity of redaction}.
     * 
     * @apistatus                   🧪 *Experimental*
     * @since                       `v1`
     * 
     * @see {@link SensitiveClass}
     */
    export function redact <
        ObjectT extends object,
        SensitivePropertiesT extends PropertySensitivityMap<ObjectT, ObjectUtils.ComplexObjectKey<ObjectT>>
    > (
        obj: ObjectT,
        sensitiveProperties: SensitivePropertiesT
    ): RedactedObject<ObjectT, SensitivePropertiesT>;
    export function redact <
        T extends object,
        U extends (
            ObjectUtils.DynamicObjectKey<T> | PropertySensitivityMap<T>
        ),
        V extends (
            U extends ObjectUtils.DynamicObjectKey<T>
                ? RedactionSensitivity | undefined
                : undefined
        )
    > ( obj: T, sensitiveProperties: U, sensitivity?: V ): RedactedObject<T, U> {
    
        // let redactedObj = Object.create(Object.getPrototypeOf(obj)) as ObjectRecord<T>;
        let propertyMap: PropertySensitivityMap<T, ObjectUtils.ComplexObjectKey<T>> = (() => {

            if (Array.isArray(sensitiveProperties))
                return fillMap(sensitiveProperties, sensitivity ?? 'medium');

            let newMap: PropertySensitivityMap<T, ObjectUtils.ComplexObjectKey<T>> = new Map();

            for (const [key, value] of (sensitiveProperties as PropertySensitivityMap<T>)) {
                newMap.set(
                    ArrayUtils.arrayify(key) as ObjectUtils.ComplexObjectKey<T>,
                    value
                )
            }

            return newMap;

        })();

        return ObjectUtils.forEachNestedProperty(
            obj,
            [...propertyMap.keys()] as any,
            (key, value): string | undefined => {

                const sensitivity = propertyMap.get(key)!;

                if (isNullable(value) && sensitivity != 'high')
                    return;

                let info = (() => {

                    let info = "";
        
                    if (sensitivity != 'high') {
                        info += ` ${StringUtils.ucFirst(typeof value)}`;
        
                        if (sensitivity == 'low') {
                            if (typeof value == 'string')
                                info += `(${value.length})`;
                            else if (typeof value == 'number')
                                info += `(${Math.trunc(value) == value ? 'Int' : 'Float'})`;
                        }
                    }
        
                    return info;
        
                })();
            
                return `<Sensitive${info} Data>`;

            }
        ) as unknown as RedactedObject<T, U>;
    
        // for (const key in obj) {
        //     const value = obj[key];
    
        //     if ( !(key in propertyMap) || (isUnset(value) && propertyMap[key] != 'high') ) {
        //         redactedObj[key as string] = value;
        //         continue;
        //     }
    
        //     let info = (() => {
    
        //         let info = "";
    
        //         if (propertyMap[key] != 'high') {
        //             info += ` ${ucFirst(typeof value)}`;
    
        //             if (propertyMap[key] == 'low') {
        //                 if (typeof value == 'string')
        //                     info += `(${value.length})`;
        //                 else if (typeof value == 'number')
        //                     info += `(${Math.trunc(value) == value ? 'Int' : 'Float'})`;
        //             }
        //         }
    
        //         return info;
    
        //     })();
    
        //     redactedObj[key as string] = `<Sensitive${info} Data>`;
        // }
    
        // return redactedObj;
    
    };

}


/* Console Utilities */

/**
 * A namespace containing utilty types, functions, and
 * other members related to the {@link Console}.
 * 
 * @apistatus   🧪 *Experimental*
 * @since       `v1`
 */
export namespace ConsoleUtils {

    export const getFormattingEscapeSequence = ( code: string ) => `\x1B[${code}`;
    const getColorEscapeSequence = <T extends number> ( code: T ) => getFormattingEscapeSequence(`${code}m`);

    /**
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     */
    export const FORMATTING_RESET = 0;
    /**
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     */
    export type FormattingResetType = typeof FORMATTING_RESET;

    /**
     * A Standard Foreground Color to be applied to {@link colorizeOutput colorized console output}.
     * 
     * Each enumeration value corresponds to the equivalent
     * [Virtual Terminal Sequence](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting).
     * 
     * @example
     * colorizeOutput("Hello, World!", ForegroundColor.CYAN);   // \x1B[36mHello, World!\x1B[0m
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link BrightForegroundColor}
     * @see {@link Color}
     * @see {@link colorizeOutput `colorizeOutput()`}
     */
    export enum ForegroundColor {
        BLACK = 30,
        RED,
        GREEN,
        YELLOW,
        BLUE,
        MAGENTA,
        CYAN,
        WHITE
    };
    /**
     * A Standard Background Color to be applied to {@link colorizeOutput colorized console output}.
     * 
     * Each enumeration value corresponds to the equivalent
     * [Virtual Terminal Sequence](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting).
     * 
     * @example
     * colorizeOutput("Hello, World!", BackgroundColor.CYAN);   // \x1B[46mHello, World!\x1B[0m
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link BrightBackgroundColor}
     * @see {@link Color}
     * @see {@link colorizeOutput `colorizeOutput()`}
     */
    export enum BackgroundColor {
        BLACK = ForegroundColor['BLACK'] + 10,
        RED,
        GREEN,
        YELLOW,
        BLUE,
        MAGENTA,
        CYAN,
        WHITE
    };
    /**
     * A *Bright* Foreground Color to be applied to {@link colorizeOutput colorized console output}.
     * 
     * Each enumeration value corresponds to the equivalent
     * [Virtual Terminal Sequence](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting).
     * 
     * @example
     * colorizeOutput("Hello, World!", BrightForegroundColor.CYAN);   // \x1B[96mHello, World!\x1B[0m
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link ForegroundColor}
     * @see {@link Color}
     * @see {@link colorizeOutput `colorizeOutput()`}
     */
    export enum BrightForegroundColor {
        BLACK = ForegroundColor['BLACK'] + 60,
        RED,
        GREEN,
        YELLOW,
        BLUE,
        MAGENTA,
        CYAN,
        WHITE
    };
    /**
     * A *Bright* Background Color to be applied to {@link colorizeOutput colorized console output}.
     * 
     * Each enumeration value corresponds to the equivalent
     * [Virtual Terminal Sequence](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting).
     * 
     * @example
     * colorizeOutput("Hello, World!", BrightBackgroundColor.CYAN);   // \x1B[106mHello, World!\x1B[0m
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link BackgroundColor}
     * @see {@link Color}
     * @see {@link colorizeOutput `colorizeOutput()`}
     */
    export enum BrightBackgroundColor {
        BLACK = ForegroundColor['BLACK'] + 70,
        RED,
        GREEN,
        YELLOW,
        BLUE,
        MAGENTA,
        CYAN,
        WHITE
    };
    /**
     * A union of the Foreground & Background Colors to be
     * applied to {@link colorizeOutput colorized console output}.
     * 
     * Each included enumeration value corresponds to the equivalent
     * [Virtual Terminal Sequence](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting).
     * 
     * @example
     * colorizeOutput("Hello, World!", ForegroundColor.GREEN);  // \x1B[32mHello, World!\x1B[0m
     * colorizeOutput(42, BackgroundColor.YELLOW);              // \x1B[43m42\x1B[0m
     * colorizeOutput(undefined, BrightForegroundColor.BLACK);  // \x1B[90mundefined\x1B[0m
     * colorizeOutput(true, BrightBackgroundColor.CYAN);        // \x1B[106mtrue\x1B[0m
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link ForegroundColor}
     * @see {@link BackgroundColor}
     * @see {@link BrightForegroundColor}
     * @see {@link BrightBackgroundColor}
     * @see {@link colorizeOutput `colorizeOutput()`}
     */
    export type Color = (ForegroundColor | BrightForegroundColor | BackgroundColor | BrightBackgroundColor);

    /**
     * A {@link Map} of {@link MatchType}s to {@link Color Console Colors}.
     * 
     * For each {@link String.prototype.matchAll match} produced by the
     * designated {@link MatchType}, the specified {@link Color} or
     * array of `ConsoleColor`s will be applied.
     * 
     * @template KeyT   The type of the Map Keys.
     * @template ValueT The type of the Map Values.
     * 
     * @apistatus       🧪 *Experimental*
     * @since           `v1`
     */
    export class ColorMatchMap <
        KeyT extends ColorMatchMap.KeyType = ColorMatchMap.KeyType,
        ValueT extends ColorMatchMap.ValueType = ColorMatchMap.ValueType
    > extends Map<KeyT, ValueT> {

        /**
         * Construct a new `ColorMatchMap` containing the key-value pairs specified
         * by the designated `iterable` object.
         * 
         * @param iterable  An object implementing the {@link Iterable} interface
         *                  whose iterable properties are to be added to the `ColorMatchMap`.
         */
        constructor ( iterable?: ColorMatchMap.ConstructorArgumentOptions<ColorMatchMap.ConstructorIterable> );
        /**
         * Construct a new `ColorMatchMap` containing the key-value pairs specified
         * by the designated `entries` array.
         * 
         * @param entries   An array of key-value pairs to add to the `ColorMatchMap`.
         */
        constructor ( entries?: ColorMatchMap.ConstructorArgumentOptions<ColorMatchMap.ConstructorEntries> );
        /**
         * Construct a new `ColorMatchMap` containing the key-value pairs specified
         * by the designated `init` object.
         * 
         * @param init  A {@link Record} of simple key-value pairs in which the key
         *              is a valid object key type. 
         */
        constructor ( init?: ColorMatchMap.ConstructorArgumentOptions<ColorMatchMap.ConstructorRecord> );
        constructor ( init?: ColorMatchMap.ConstructorArgumentOptions ) {

            super((
                ( !init || Array.isArray(init) || typeof init[Symbol.iterator] == 'function' )
                    ? init
                    : Object.entries(init)
            ) as any);

        }

    };
    export namespace ColorMatchMap {

        /**
         * The type of the _keys_ in a `ColorMatchMap`.
         * 
         * @apistatus   🧪 *Experimental*
         * @since       `v1`
         */
        export type KeyType = MatchType;
        /**
         * The type of the _values_ in a `ColorMatchMap`.
         * 
         * @apistatus   🧪 *Experimental*
         * @since       `v1`
         */
        export type ValueType = Color | Color[] | null;

        /**
         * A type corresponding to the arguments of the *Iterable Constructor* of a `ColorMatchMap`
         * that accepts an {@link Iterable iterable object}.
         * 
         * @apistatus   🧪 *Experimental*
         * @since       `v1`
         */
        export type ConstructorIterable <
            KeyT extends KeyType = KeyType,
            ValueT extends ValueType = ValueType
        > = Iterable<readonly [KeyT, ValueT]>;
        /**
         * A type corresponding to the arguments of the *Entries Constructor* of a `ColorMatchMap`
         * that accepts an array of key-value pairs.
         * 
         * @apistatus   🧪 *Experimental*
         * @since       `v1`
         */
        export type ConstructorEntries <
            KeyT extends KeyType = KeyType,
            ValueT extends ValueType = ValueType
        > = readonly (readonly [KeyT, ValueT])[];
        /**
         * A type corresponding to the arguments of the *Record Constructor* of a `ColorMatchMap`
         * that accepts a {@link Record} of simple key-value pairs in which the
         * key is a valid object key type.
         * 
         * @apistatus   🧪 *Experimental*
         * @since       `v1`
         */
        export type ConstructorRecord <
            KeyT extends KeyType = KeyType,
            ValueT extends ValueType = ValueType
        > = Record< Extract<KeyT, string | number | symbol>, ValueT >;

        /**
         * A type corresponding to the arguments of a constructor of a `ColorMatchMap`.
         * 
         * @template T  The type(s) of the constructor arguments.
         * 
         *              Defaults to a union of all available types.
         * 
         * @apistatus   🧪 *Experimental*
         * @since       `v1`
         */
        export type ConstructorArgumentOptions <
            T extends ConstructorIterable | ConstructorEntries | ConstructorRecord = ConstructorIterable | ConstructorEntries | ConstructorRecord
        > = T | null | undefined;

    }

    /**
     * A union of types that support formatting (e.g., {@link colorizeOutput coloring})
     * when being output to the console.
     * 
     * Each `DataType` corresponds to a member in the {@link DataTypeString} with a value
     * equal to the name of the `DataType`.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link DataTypeString}
     */
    export type DataType = string | number | boolean | DateType | UnitDenominatedNumber | null | undefined;
    /**
     * A union of `string` values corresponding to the {@link DataType types that support formatting} 
     * (e.g., {@link colorizeOutput coloring}) when being output to the console.
     * 
     * Each `DataTypeString` corresponds to a member in the {@link DataType} with a type
     * equal to the name of the `DataTypeString`.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link DataType}
     */
    export type DataTypeString = 'string' | 'number' | 'boolean' | 'DateType' | 'UnitDenominatedNumber' | 'null' | 'undefined';

    /**
     * A map of {@link DataType}s to {@link Color}s to be used
     * as defaults for the {@link colorizeOutput `colorizeOutput()`}
     * and {@link colorizePositiveOutput `colorizePositiveOutput()`} functions.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link colorizeOutput `colorizeOutput()`}
     * @see {@link colorizePositiveOutput `colorizePositiveOutput()`}
     */
    export const DEFAULT_COLORS = {
        'string': ForegroundColor.GREEN,
        'number': ForegroundColor.YELLOW,
        'boolean': ForegroundColor.MAGENTA,
        'DateType': BrightForegroundColor.MAGENTA,
        'UnitDenominatedNumber': ForegroundColor.CYAN,
        'null': BrightForegroundColor.BLACK,
        'undefined': BrightForegroundColor.BLACK
    } as const satisfies Record<DataTypeString, Color | Color[]>;

    const BASE_POSITIVE_OUTPUT_REGEX = /([^\d]*0+[^\d]*)/;
    const POSITIVE_OUTPUT_MATCH_REGEX = new RegExp(`^${BASE_POSITIVE_OUTPUT_REGEX.source}+$`);
    const POSITIVE_OUTPUT_PLB_REGEX = new RegExp(`(?<=${BASE_POSITIVE_OUTPUT_REGEX.source})`);
    const POSITIVE_OUTPUT_NLB_REGEX = new RegExp(`(?<!${BASE_POSITIVE_OUTPUT_REGEX.source})`);


    /**
     * Get the {@link ConsoleUtils.DataTypeString Data Type `string`} of the provided `data`.
     * 
     * @template DataT      The type of the `data` argument.
     * @template ReturnT    The inferred return type of the function.
     * 
     * @param data          The {@link ConsoleUtils.DataType data} being evaluated.
     * 
     * @returns             A {@link ConsoleUtils.DataTypeString} corresponding to the type
     *                      of the provided `data`.
     * 
     *                      If the provided `data` is not a valid {@link ConsoleUtils.DataType},
     *                      returns `null`.
     * 
     * @apistatus           🧪 *Experimental*
     * @since               `v1`
     */
    export const getDataType = <
        DataT,
        ReturnT extends (ConsoleUtils.DataTypeString | null) = (
            DataT extends ConsoleUtils.DataType
                ? ConsoleUtils.DataTypeString
                : ConsoleUtils.DataTypeString | null
        )
    > ( data: DataT ): ReturnT => (
        isType(data, ['string', 'number', 'boolean'])
            ? (typeof data == 'string' && /^\d+ ?[a-zA-Z0-9\/\(\),. ]+$/.test(data)
                ? 'UnitDenominatedNumber'
                : typeof data as ConsoleUtils.DataTypeString
            )
            : (typeof data == 'object'
                ? ((data instanceof Date || data instanceof dayjs)
                    ? 'DateType'
                    : (data === null
                        ? 'null'
                        : null
                    )
                )
                : (typeof data == 'undefined'
                    ? 'undefined'
                    : null
                )
            )
    ) as ReturnT;

    /**
     * Assert that the {@link console} is an {@link isTtyConsole Interactive TTY Console}
     * or throw a {@link LogicError} if it is not.
     * 
     * @throws      A {@link LogicError} if the {@link console} is not
     *              an {@link isTtyConsole Interactive TTY Console}.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link isTtyConsole `isTtyConsole`}
     */
    export const assertIsTty = (): void | never => {

        if (!isTtyConsole)
            throw new LogicError("Not an Interactive TTY Console!");

    };
    /**
     * Assert that the {@link console} has {@link consoleHasColorSupport Sufficient Color Support}
     * or throw a {@link LogicError} if it does not.
     * 
     * @throws      A {@link LogicError} if the {@link console} does
     *              not have {@link consoleHasColorSupport Sufficient Color Support}.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     * 
     * @see {@link consoleHasColorSupport `consoleHasColorSupport`}
     */
    export const assertHasColorSupport = (): void | never => {

        if (!consoleHasColorSupport)
            throw new LogicError("Console does not have Color Support!");

    };

    export var currentConsoleVisibility: boolean = true;

    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the {@link DEFAULT_COLORS default console coloring} to the designated `data`.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizeOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data  The {@link DataType data} being colorized.
     * 
     * @returns     A `string` containing the colorized output of the designated `data`.
     *  
     *              If the console does not have {@link consoleHasColorSupport sufficient color support},
     *              the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     */
    export function colorizeOutput ( data: DataType ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `color` to the designated `data`.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizeOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data      The {@link DataType data} being colorized.
     *  
     * @param color     The {@link Color color} to apply to the `data`.
     * 
     *                  If `null`, the {@link DEFAULT_COLORS default console coloring}
     *                  associated with the type of the designated `data` will be used.
     *  
     * @returns         A `string` containing the colorized output of the designated `data`.
     *      
     *                  If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                  the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus       🧪 *Experimental*
     * @since           `v1`
     */
    export function colorizeOutput ( data: DataType, color?: Color | null ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `colors` to the designated `data`.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizeOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data      The {@link DataType data} being colorized.
     * 
     * @param colors    The {@link Color colors} to apply to the `data`.
     * 
     *                  Passing multiple foreground or background colors will cause later-specified
     *                  colors to overwrite those specified earlier in the `colors` array.
     * 
     * @returns         A `string` containing the colorized output of the designated `data`.
     *  
     *                  If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                  the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus       🧪 *Experimental*
     * @since           `v1`
     */
    export function colorizeOutput ( data: DataType, colors?: Color[] ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the {@link DEFAULT_COLORS default console coloring} to the {@link Object.prototype.toString stringified}
     * `data` matched by the specified `match` string or regular expression.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizeOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data      The {@link DataType data} being colorized.
     *  
     * @param match     The String or {@link RegExp Regular Expression} used to match
     *                  the characters to be colorized.
     *  
     *                  If a `RegExp` is provided, it must have the 
     *                  [`g` flag](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags).
     *  
     * @returns         A `string` containing the colorized output of the designated `data`.
     *      
     *                  If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                  the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus       🧪 *Experimental*
     * @since           `v1`
     */
    export function colorizeOutput ( data: DataType, match?: MatchType ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the colors to the {@link Object.prototype.toString stringified} `data` designated by the specified `matchMap`.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizeOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data      The {@link DataType data} being colorized.
     * 
     * @param matchMap  A {@link Map} of {@link MatchType}s to {@link Color Console Colors}.
     * 
     * @returns         A `string` containing the colorized output of the designated `data`.
     *      
     *                  If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                  the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus       🧪 *Experimental*
     * @since           `v1`
     */
    export function colorizeOutput ( data: DataType, matchMap?: ColorMatchMap ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `color` to the designated `data` and immediately reset the terminal colors
     * to the specified `originalColors` afterward.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizeOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data              The {@link DataType data} being colorized.
     *  
     * @param color             The {@link Color color} to apply to the `data`.
     * 
     *                          If `null`, the {@link DEFAULT_COLORS default console coloring}
     *                          associated with the type of the designated `data` will be used.
     * 
     * @param originalColors    The original color(s) to reset the terminal to after
     *                          writing the colorized `data` to it.
     *  
     * @returns                 A `string` containing the colorized output of the designated `data`.
     *      
     *                          If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                          the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     */
    export function colorizeOutput ( data: DataType, color?: Color | null, originalColors?: Color | Color[] ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `colors` to the designated `data` and immediately reset the terminal colors
     * to the specified `originalColors` afterward.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizeOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data              The {@link DataType data} being colorized.
     * 
     * @param colors            The {@link Color colors} to apply to the `data`.
     * 
     *                          Passing multiple foreground or background colors will cause later-specified
     *                          colors to overwrite those specified earlier in the `colors` array.
     * 
     * @param originalColors    The original color(s) to reset the terminal to after
     *                          writing the colorized `data` to it.
     * 
     * @returns                 A `string` containing the colorized output of the designated `data`.
     *  
     *                          If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                          the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     */
    export function colorizeOutput ( data: DataType, colors?: Color[], originalColors?: Color | Color[] ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `color` to the {@link Object.prototype.toString stringified}
     * `data` matched by the specified `match` string or regular expression.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizeOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data      The {@link DataType data} being colorized.
     *  
     * @param match     The String or {@link RegExp Regular Expression} used to match
     *                  the characters to be colorized.
     *  
     *                  If a `RegExp` is provided, it must have the 
     *                  [`g` flag](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags).
     *  
     * @param color     The {@link Color color} to apply to the `match`ed `data`.
     *  
     * @returns         A `string` containing the colorized output of the designated `data`.
     *      
     *                  If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                  the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus       🧪 *Experimental*
     * @since           `v1`
     */
    export function colorizeOutput ( data: DataType, match?: MatchType, color?: Color ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `colors` to the {@link Object.prototype.toString stringified}
     * `data` matched by the specified `match` string or regular expression.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizeOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data      The {@link DataType data} being colorized.
     *  
     * @param match     The String or {@link RegExp Regular Expression} used to match
     *                  the characters to be colorized.
     *  
     *                  If a `RegExp` is provided, it must have the 
     *                  [`g` flag](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags).
     * 
     * @param colors    The {@link Color colors} to apply to the `match`ed `data`.
     * 
     *                  Passing multiple foreground or background colors will cause later-specified
     *                  colors to overwrite those specified earlier in the `colors` array.
     *  
     * @returns         A `string` containing the colorized output of the designated `data`.
     *      
     *                  If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                  the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus       🧪 *Experimental*
     * @since           `v1`
     */
    export function colorizeOutput ( data: DataType, match?: MatchType, colors?: Color[] ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the colors to the {@link Object.prototype.toString stringified} `data` designated by the specified `matchMap`
     * and immediately reset the terminal colors to the specified `originalColors` afterward.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizeOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data              The {@link DataType data} being colorized.
     * 
     * @param matchMap          A {@link Map} of {@link MatchType}s to {@link Color Console Colors}.
     * 
     * @param originalColors    The original color(s) to reset the terminal to after
     *                          writing the colorized `data` to it.
     * 
     * @returns                 A `string` containing the colorized output of the designated `data`.
     *      
     *                          If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                          the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     */
    export function colorizeOutput ( data: DataType, matchMap?: ColorMatchMap, originalColors?: Color | Color[] ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `color` to the {@link Object.prototype.toString stringified} `data` matched by the specified `match`
     * string or regular expression and immediately reset the terminal color to the specified `originalColors` afterward.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizeOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data              The {@link DataType data} being colorized.
     *  
     * @param match             The String or {@link RegExp Regular Expression} used to match
     *                          the characters to be colorized.
     *  
     *                          If a `RegExp` is provided, it must have the 
     *                          [`g` flag](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags).
     *  
     * @param color             The {@link Color color} to apply to the `match`ed `data`.
     * 
     * @param originalColors    The original color(s) to reset the terminal to after
     *                          writing the colorized `data` to it.
     *  
     * @returns                 A `string` containing the colorized output of the designated `data`.
     *      
     *                          If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                          the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     */
    export function colorizeOutput (
        data?: DataType,
        match?: MatchType,
        color?: Color | null,
        originalColors?: Color | Color[]
    ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `colors` to the {@link Object.prototype.toString stringified}
     * `data` matched by the specified `match` string or regular expression
     * and immediately reset the terminal color to the specified `originalColors` afterward.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizeOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data              The {@link DataType data} being colorized.
     *  
     * @param match             The String or {@link RegExp Regular Expression} used to match
     *                          the characters to be colorized.
     *  
     *                          If a `RegExp` is provided, it must have the 
     *                          [`g` flag](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags).
     * 
     * @param colors            The {@link Color colors} to apply to the `match`ed `data`.
     * 
     *                          Passing multiple foreground or background colors will cause later-specified
     *                          colors to overwrite those specified earlier in the `colors` array.
     * 
     * @param originalColors    The original color(s) to reset the terminal to after
     *                          writing the colorized `data` to it.
     *  
     * @returns                 A `string` containing the colorized output of the designated `data`.
     *      
     *                          If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                          the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     */
    export function colorizeOutput (
        data?: DataType,
        match?: MatchType,
        colors?: Color[],
        originalColors?: Color | Color[]
    ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `colors` to the {@link Object.prototype.toString stringified}
     * `data` matched by the specified `match` string or regular expression
     * and immediately reset the terminal color to the specified `originalColors` afterward.
     * 
     * This is the generic version of the `colorizeOutput()` function. See the non-generic
     * function overloads for more detailed information on usage and function parameters.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizeOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @template T                      The type of the `matchOrColors` argument.
     * @template U                      The type of the `colorsOrOriginalColors` argument.
     * @template V                      The type of the `originalColors` argument.
     * 
     * @param data                      The {@link DataType data} being colorized.
     *  
     * @param matchOrColors             The String or {@link RegExp Regular Expression} used to match
     *                                  the characters to be colorized or the {@link Color colors}
     *                                  to apply to the `data`.
     *  
     *                                  If a `RegExp` is provided, it must have the 
     *                                  [`g` flag](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags).
     * 
     *                                  Passing multiple foreground or background colors will cause later-specified
     *                                  colors to overwrite those specified earlier in the `colors` array.
     * 
     * @param colorsOrOriginalColors    The {@link Color colors} to apply to the `match`ed `data`
     *                                  when `matchOrColors` contains a String or {@link RegExp Regular Expression}
     *                                  or the original color(s) to reset the terminal to after writing the colorized `data` to it
     *                                  when `matchOrColors` contains the {@link Color colors} to apply to the `data` or a {@link ColorMatchMap}.
     *
     *                                  Passing multiple foreground or background colors will cause later-specified
     *                                  colors to overwrite those specified earlier in the `colors` array.
     * 
     * @param originalColors            The original color(s) to reset the terminal to after writing the colorized `data` to it
     *                                  when `matchOrColors` contains a String or {@link RegExp Regular Expression}.
     * 
     *                                  When `matchOrColors` contains the {@link Color colors}
     *                                  to apply to the `data` or a {@link ColorMatchMap}, this argument is ignored.
     *  
     * @returns                         A `string` containing the colorized output of the designated `data`.
     *      
     *                                  If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                                  the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus                       🧪 *Experimental*
     * @since                           `v1`
     */
    export function colorizeOutput <
        T extends (MatchType | ColorMatchMap | Color | Color[] | null | undefined),
        U extends (
            T extends MatchType
                ? (Color | Color[] | null | undefined)
                : (Color | Color[] | undefined)
        ),
        V extends (
            T extends MatchType
                ? (Color | Color[] | undefined)
                : undefined
        )
    > ( data: DataType, matchOrColors?: T, colorsOrOriginalColors?: U, originalColors?: V ): string;
    export function colorizeOutput <
        T extends (MatchType | ColorMatchMap | Color | Color[] | null | undefined),
        U extends (
            T extends MatchType
                ? (Color | Color[] | null | undefined)
                : (Color | Color[] | undefined)
        ),
        V extends (
            T extends MatchType
                ? (Color | Color[] | undefined)
                : undefined
        )
    > ( data: DataType, matchOrColors?: T, colorsOrOriginalColors?: U, originalColors?: V ): string {

        let getColorList = ( colors?: Color | Color[] | null ): Color[] => (
            (typeof colors != 'undefined' && colors !== null)
                ? (Array.isArray(colors) ? colors : [colors])
                : [DEFAULT_COLORS[getDataType(data)!]]
        );
        let originalColorEscapeSequence: string = (() => {

            let escSeq = "";
            let colors: FormattingResetType | Color | Color[] = FORMATTING_RESET;

            if ( (typeof matchOrColors == 'string' || matchOrColors instanceof RegExp) && typeof colorsOrOriginalColors == 'number' && typeof originalColors != 'undefined' )
                colors = originalColors;
            else if ( (typeof matchOrColors == 'number' || matchOrColors instanceof Map) && !isNullable(colorsOrOriginalColors) )
                colors = colorsOrOriginalColors;

            if (typeof colors == 'number')
                escSeq = getColorEscapeSequence(colors);
            else
                for (const color of (colors as Color[]))
                    escSeq += getColorEscapeSequence(color);

            return escSeq;

        })();

        if (consoleHasColorSupport) {
            if (isNullable(matchOrColors) || typeof matchOrColors == 'number' || Array.isArray(matchOrColors)) {
                let colorList = getColorList(matchOrColors);
                
                for (let color of colorList.reverse())
                    data = `${getColorEscapeSequence(color)}${data}`;
                
                data += originalColorEscapeSequence;
            }
            else {
                let matchMap = (() => {

                    if (matchOrColors instanceof Map)
                        return matchOrColors;

                    let matchMap = new ColorMatchMap();
                        matchMap.set(matchOrColors as MatchType, getColorList(colorsOrOriginalColors));

                    return matchMap;

                })() as ColorMatchMap;

                for (const [matcher, matchColors] of matchMap) {
                    let matchColorList = getColorList(matchColors);

                    if (typeof data == 'undefined')
                        data = 'undefined';
                    else if (data === null)
                        data = null;

                    data = data!.toString().replaceAll(
                        (typeof matcher == 'string' || matcher.flags.includes('g'))
                            ? matcher
                            : new RegExp(matcher.source, `g${matcher.flags}`),
                        ( substr, m1 ) => {
        
                            let replacementSubstr = (typeof m1 == 'string' ? m1 : substr);
        
                            for (let color of matchColorList.reverse()) {
                                replacementSubstr = `${getColorEscapeSequence(color)}${replacementSubstr}`;
                            }
        
                            replacementSubstr += originalColorEscapeSequence;
                            return replacementSubstr;
        
                        }
                    );
                }
            }   
        }

        return (typeof data != 'string') ? (data?.toString() ?? '') : data;

    };

    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the {@link DEFAULT_COLORS default console coloring} to the designated `data`
     * if it does not contain or begin with one or more `0`s.
     * 
     * In contrast to {@link highlightPositiveOutput `highlightPositiveOutput()`}, this function will
     * not apply any color formatting to the designated `data` if it contains or begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizePositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data  The {@link DataType data} being colorized.
     * 
     * @returns     A `string` containing the colorized output of the designated `data`.
     * 
     *              If the `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *              the unmodified `string` representation of the provided `data` will be returned instead.
     *  
     *              If the console does not have {@link consoleHasColorSupport sufficient color support},
     *              the unmodified `string` representation of the designated `data` will always be returned.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     */
    export function colorizePositiveOutput ( data: DataType ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `color` to the designated `data`
     * if it does not contain or begin with one or more `0`s.
     * 
     * In contrast to {@link highlightPositiveOutput `highlightPositiveOutput()`}, this function will
     * not apply any color formatting to the designated `data` if it contains or begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizePositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data      The {@link DataType data} being colorized.
     *  
     * @param color     The {@link Color color} to apply to the `data`.
     *  
     * @returns         A `string` containing the colorized output of the designated `data`.
     *  
     *                  If the `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *                  the unmodified `string` representation of the provided `data` will be returned instead.
     *      
     *                  If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                  the unmodified `string` representation of the designated `data` will always be returned.
     * 
     * @apistatus       🧪 *Experimental*
     * @since           `v1`
     */
    export function colorizePositiveOutput ( data: DataType, color?: Color | null ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `color` to the designated `data`
     * if it does not contain or begin with one or more `0`s.
     * 
     * In contrast to {@link highlightPositiveOutput `highlightPositiveOutput()`}, this function will
     * not apply any color formatting to the designated `data` if it contains or begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizePositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data      The {@link DataType data} being colorized.
     * 
     * @param colors    The {@link Color colors} to apply to the `data`.
     * 
     *                  Passing multiple foreground or background colors will cause later-specified
     *                  colors to overwrite those specified earlier in the `colors` array.
     * 
     * @returns         A `string` containing the colorized output of the designated `data`.
     *  
     *                  If the `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *                  the unmodified `string` representation of the provided `data` will be returned instead.
     *      
     *                  If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                  the unmodified `string` representation of the designated `data` will always be returned.
     * 
     * @apistatus       🧪 *Experimental*
     * @since           `v1`
     */
    export function colorizePositiveOutput ( data: DataType, colors?: Color[] ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the {@link DEFAULT_COLORS default console coloring} to the {@link Object.prototype.toString stringified}
     * `data` matched by the specified `match` string or regular expression
     * if it does not contain or begin with one or more `0`s.
     * 
     * In contrast to {@link highlightPositiveOutput `highlightPositiveOutput()`}, this function will
     * not apply any color formatting to the designated `data` if it contains or begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizePositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data      The {@link DataType data} being colorized.
     *  
     * @param match     The String or {@link RegExp Regular Expression} used to match
     *                  the characters to be colorized.
     *  
     *                  If a `RegExp` is provided, it must have the 
     *                  [`g` flag](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags).
     *  
     * @returns         A `string` containing the colorized output of the designated `data`.
     *  
     *                  If the `matched`ed `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *                  the unmodified `string` representation of the matched `data` will be returned instead.
     *      
     *                  If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                  the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus       🧪 *Experimental*
     * @since           `v1`
     */
    export function colorizePositiveOutput ( data: DataType, match?: MatchType ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the colors to the {@link Object.prototype.toString stringified} `data`
     * designated by the specified `matchMap` if it does not contain or begin with one or more `0`s.
     * 
     * In contrast to {@link highlightPositiveOutput `highlightPositiveOutput()`}, this function will
     * not apply any color formatting to the designated `data` if it contains or begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizePositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data      The {@link DataType data} being colorized.
     * 
     * @param matchMap  A {@link Map} of {@link MatchType}s to {@link Color Console Colors}.
     * 
     * @returns         A `string` containing the colorized output of the designated `data`.
     * 
     *                  If the matched `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *                  the unmodified `string` representation of the matched `data` will be returned instead.
     *      
     *                  If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                  the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus       🧪 *Experimental*
     * @since           `v1`
     */
    export function colorizePositiveOutput ( data: DataType, matchMap?: ColorMatchMap ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `color` to the designated `data` and immediately reset the terminal color
     * to the specified `originalColors` afterward if it does not contain or begin with one or more `0`s.
     * 
     * In contrast to {@link highlightPositiveOutput `highlightPositiveOutput()`}, this function will
     * not apply any color formatting to the designated `data` if it contains or begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizePositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data              The {@link DataType data} being colorized.
     *  
     * @param color             The {@link Color color} to apply to the `data`.
     * 
     * @param originalColors    The original color(s) to reset the terminal to after
     *                          writing the colorized `data` to it.
     *  
     * @returns                 A `string` containing the colorized output of the designated `data`.
     *  
     *                          If the `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *                          the unmodified `string` representation of the provided `data` will be returned instead.
     *      
     *                          If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                          the unmodified `string` representation of the designated `data` will always be returned.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     */
    export function colorizePositiveOutput ( data: DataType, color?: Color | null, originalColors?: Color | Color[] ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `color` to the designated `data` and immediately reset the terminal color
     * to the specified `originalColors` afterward if it does not contain or begin with one or more `0`s.
     * 
     * In contrast to {@link highlightPositiveOutput `highlightPositiveOutput()`}, this function will
     * not apply any color formatting to the designated `data` if it contains or begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizePositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data              The {@link DataType data} being colorized.
     * 
     * @param colors            The {@link Color colors} to apply to the `data`.
     * 
     *                          Passing multiple foreground or background colors will cause later-specified
     *                          colors to overwrite those specified earlier in the `colors` array.
     * 
     * @param originalColors    The original color(s) to reset the terminal to after
     *                          writing the colorized `data` to it.
     * 
     * @returns                 A `string` containing the colorized output of the designated `data`.
     *  
     *                          If the `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *                          the unmodified `string` representation of the provided `data` will be returned instead.
     *      
     *                          If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                          the unmodified `string` representation of the designated `data` will always be returned.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     */
    export function colorizePositiveOutput ( data: DataType, colors?: Color[], originalColors?: Color | Color[] ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `color` to the {@link Object.prototype.toString stringified}
     * `data` matched by the specified `match` string or regular expression
     * if it does not contain or begin with one or more `0`s.
     * 
     * In contrast to {@link highlightPositiveOutput `highlightPositiveOutput()`}, this function will
     * not apply any color formatting to the designated `data` if it contains or begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizePositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data      The {@link DataType data} being colorized.
     *  
     * @param match     The String or {@link RegExp Regular Expression} used to match
     *                  the characters to be colorized.
     *  
     *                  If a `RegExp` is provided, it must have the 
     *                  [`g` flag](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags).
     *  
     * @param color     The {@link Color color} to apply to the `match`ed `data`.
     *  
     * @returns         A `string` containing the colorized output of the designated `data`.
     *  
     *                  If the `match`ed `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *                  the unmodified `string` representation of the matched `data` will be returned instead.
     *      
     *                  If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                  the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus       🧪 *Experimental*
     * @since           `v1`
     */
    export function colorizePositiveOutput ( data: DataType, match?: MatchType, color?: Color | null ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `colors` to the {@link Object.prototype.toString stringified}
     * `data` matched by the specified `match` string or regular expression
     * if it does not contain or begin with one or more `0`s.
     * 
     * In contrast to {@link highlightPositiveOutput `highlightPositiveOutput()`}, this function will
     * not apply any color formatting to the designated `data` if it contains or begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizePositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data      The {@link DataType data} being colorized.
     *  
     * @param match     The String or {@link RegExp Regular Expression} used to match
     *                  the characters to be colorized.
     *  
     *                  If a `RegExp` is provided, it must have the 
     *                  [`g` flag](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags).
     * 
     * @param colors    The {@link Color colors} to apply to the `match`ed `data`.
     * 
     *                  Passing multiple foreground or background colors will cause later-specified
     *                  colors to overwrite those specified earlier in the `colors` array.
     *  
     * @returns         A `string` containing the colorized output of the designated `data`.
     * 
     *                  If the `match`ed `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *                  the unmodified `string` representation of the matched `data` will be returned instead.
     *      
     *                  If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                  the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus       🧪 *Experimental*
     * @since           `v1`
     */
    export function colorizePositiveOutput ( data: DataType, match?: MatchType, colors?: Color[] ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the colors to the {@link Object.prototype.toString stringified} `data`
     * designated by the specified `matchMap` and immediately reset the terminal color
     * to the specified `originalColors` afterward if it does not contain or begin with one or more `0`s.
     * 
     * In contrast to {@link highlightPositiveOutput `highlightPositiveOutput()`}, this function will
     * not apply any color formatting to the designated `data` if it contains or begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizePositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data              The {@link DataType data} being colorized.
     * 
     * @param matchMap          A {@link Map} of {@link MatchType}s to {@link Color Console Colors}.
     * 
     * @param originalColors    The original color(s) to reset the terminal to after
     *                          writing the colorized `data` to it.
     * 
     * @returns                 A `string` containing the colorized output of the designated `data`.
     * 
     *                          If the matched `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *                          the unmodified `string` representation of the matched `data` will be returned instead.
     *      
     *                          If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                          the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     */
    export function colorizePositiveOutput ( data: DataType, matchMap?: ColorMatchMap, originalColors?: Color | Color[] ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `color` to the {@link Object.prototype.toString stringified}
     * `data` matched by the specified `match` string or regular expression and immediately reset the terminal color
     * to the specified `originalColors` afterward if it does not contain or begin with one or more `0`s.
     * 
     * In contrast to {@link highlightPositiveOutput `highlightPositiveOutput()`}, this function will
     * not apply any color formatting to the designated `data` if it contains or begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizePositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data              The {@link DataType data} being colorized.
     *  
     * @param match             The String or {@link RegExp Regular Expression} used to match
     *                          the characters to be colorized.
     *  
     *                          If a `RegExp` is provided, it must have the 
     *                          [`g` flag](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags).
     *  
     * @param color             The {@link Color color} to apply to the `match`ed `data`.
     * 
     * @param originalColors    The original color(s) to reset the terminal to after
     *                          writing the colorized `data` to it.
     *  
     * @returns                 A `string` containing the colorized output of the designated `data`.
     *  
     *                          If the `match`ed `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *                          the unmodified `string` representation of the matched `data` will be returned instead.
     *      
     *                          If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                          the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     */
    export function colorizePositiveOutput (
        data?: DataType,
        match?: MatchType,
        color?: Color | null,
        originalColors?: Color | Color[]
    ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `colors` to the {@link Object.prototype.toString stringified}
     * `data` matched by the specified `match` string or regular expression and immediately reset the terminal color
     * to the specified `originalColors` afterward if it does not contain or begin with one or more `0`s.
     * 
     * In contrast to {@link highlightPositiveOutput `highlightPositiveOutput()`}, this function will
     * not apply any color formatting to the designated `data` if it contains or begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizePositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data              The {@link DataType data} being colorized.
     *  
     * @param match             The String or {@link RegExp Regular Expression} used to match
     *                          the characters to be colorized.
     *  
     *                          If a `RegExp` is provided, it must have the 
     *                          [`g` flag](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags).
     * 
     * @param colors            The {@link Color colors} to apply to the `match`ed `data`.
     * 
     *                          Passing multiple foreground or background colors will cause later-specified
     *                          colors to overwrite those specified earlier in the `colors` array.
     * 
     * @param originalColors    The original color(s) to reset the terminal to after
     *                          writing the colorized `data` to it.
     *  
     * @returns                 A `string` containing the colorized output of the designated `data`.
     * 
     *                          If the `match`ed `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *                          the unmodified `string` representation of the matched `data` will be returned instead.
     *      
     *                          If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                          the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     */
    export function colorizePositiveOutput (
        data?: DataType,
        match?: MatchType,
        colors?: Color[],
        originalColors?: Color | Color[]
    ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `colors` to the {@link Object.prototype.toString stringified}
     * `data` matched by the specified `match` string or regular expression.
     * 
     * This is the generic version of the `colorizePositiveOutput()` function. See the non-generic
     * function overloads for more detailed information on usage and function parameters.
     * 
     * In contrast to {@link highlightPositiveOutput `highlightPositiveOutput()`}, this function will
     * not apply any color formatting to the designated `data` if it contains or begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones.
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${colorizePositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @template T                      The type of the `matchOrColors` argument.
     * @template U                      The type of the `colorsOrOriginalColors` argument.
     * @template V                      The type of the `originalColors` argument.
     * 
     * @param data                      The {@link DataType data} being colorized.
     *  
     * @param matchOrColors             The String or {@link RegExp Regular Expression} used to match
     *                                  the characters to be colorized or the {@link Color colors}
     *                                  to apply to the `data`.
     *  
     *                                  If a `RegExp` is provided, it must have the 
     *                                  [`g` flag](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags).
     * 
     *                                  Passing multiple foreground or background colors will cause later-specified
     *                                  colors to overwrite those specified earlier in the `colors` array.
     * 
     * @param colorsOrOriginalColors    The {@link Color colors} to apply to the `match`ed `data`
     *                                  when `matchOrColors` contains a String or {@link RegExp Regular Expression}
     *                                  or the original color(s) to reset the terminal to after writing the colorized `data` to it
     *                                  when `matchOrColors` contains the {@link Color colors} to apply to the `data` or a {@link ColorMatchMap}.
     *
     *                                  Passing multiple foreground or background colors will cause later-specified
     *                                  colors to overwrite those specified earlier in the `colors` array.
     * 
     * @param originalColors            The original color(s) to reset the terminal to after writing the colorized `data` to it
     *                                  when `matchOrColors` contains a String or {@link RegExp Regular Expression}.
     * 
     *                                  When `matchOrColors` contains the {@link Color colors}
     *                                  to apply to the `data` or a {@link ColorMatchMap}, this argument is ignored.
     *  
     * @returns                         A `string` containing the colorized output of the designated `data`.
     * 
     *                                  If the matched `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *                                  the unmodified `string` representation of the matched `data` will be returned instead.
     *      
     *                                  If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                                  the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus                       🧪 *Experimental*
     * @since                           `v1`
     */
    export function colorizePositiveOutput <
        T extends (MatchType | ColorMatchMap | Color | Color[] | null | undefined),
        U extends (
            T extends MatchType
                ? (Color | Color[] | null | undefined)
                : (Color | Color[] | undefined)
        ),
        V extends (
            T extends MatchType
                ? (Color | Color[] | undefined)
                : undefined
        )
    > ( data: DataType, matchOrColors?: T, colorsOrOriginalColors?: U, originalColors?: V ): string;
    export function colorizePositiveOutput <
        T extends (MatchType | ColorMatchMap | Color | Color[] | null | undefined),
        U extends (
            T extends MatchType
                ? (Color | Color[] | null | undefined)
                : (Color | Color[] | undefined)
        ),
        V extends (
            T extends MatchType
                ? (Color | Color[] | undefined)
                : undefined
        )
    > ( data: DataType, matchOrColors?: T, colorsOrOriginalColors?: U, originalColors?: V ): string {

        if (data === 0)
            return data.toString();

        let originalColor: Color | Color[] | undefined = (() => {

            if ( (typeof matchOrColors == 'string' || matchOrColors instanceof RegExp) && typeof colorsOrOriginalColors == 'number' && typeof originalColors != 'undefined' )
                return originalColors;
            else if ( (typeof matchOrColors == 'number' || matchOrColors instanceof Map) && !isNullable(colorsOrOriginalColors) )
                return colorsOrOriginalColors;

        })();

        if (isType(matchOrColors, ['null', 'undefined', 'number', 'array'])) {
            return (
                (typeof data == 'string' && POSITIVE_OUTPUT_MATCH_REGEX.test(data))
                    ? data.toString()
                    : colorizeOutput(data, matchOrColors, originalColor)
            );
        }
        else if (typeof matchOrColors == 'string' || matchOrColors instanceof ColorMatchMap || matchOrColors instanceof RegExp) {
            let updatedMap = new ColorMatchMap();
            let matchMap: ColorMatchMap = matchOrColors instanceof ColorMatchMap
                ? matchOrColors
                : new ColorMatchMap([ [matchOrColors, colorsOrOriginalColors ?? null] ]);

            for (const [matcher, matchColors] of matchMap) {
                updatedMap.set(
                    (
                        typeof matcher == 'string'
                            ? new RegExp(POSITIVE_OUTPUT_NLB_REGEX.source + matcher, 'g')
                            : new RegExp(POSITIVE_OUTPUT_NLB_REGEX.source + matcher.source, matcher.flags)
                    ),
                    matchColors
                );
            }

            return colorizeOutput(data, updatedMap, originalColor);
        }

        throw new TypeError("Invalid Arguments Provided!");

    }

    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the {@link DEFAULT_COLORS default console coloring} to the designated `data`
     * if it does not contain or begin with one or more `0`s.
     * 
     * In contrast to {@link colorizePositiveOutput `colorizePositiveOutput()`}, this function will
     * apply {@link BrightForegroundColor.BLACK} to the designated `data` if it contains or
     * begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${highlightPositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data  The {@link DataType data} being colorized.
     * 
     * @returns     A `string` containing the colorized output of the designated `data`.
     * 
     *              If the `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *              the `string` representation of the provided `data` will be colorized using
     *              {@link BrightForegroundColor.BLACK} instead.
     *  
     *              If the console does not have {@link consoleHasColorSupport sufficient color support},
     *              the unmodified `string` representation of the designated `data` will always be returned.
     * 
     * @apistatus   🧪 *Experimental*
     * @since       `v1`
     */
    export function highlightPositiveOutput ( data: DataType ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `color` to the designated `data`
     * if it does not contain or begin with one or more `0`s.
     * 
     * In contrast to {@link colorizePositiveOutput `colorizePositiveOutput()`}, this function will
     * apply {@link BrightForegroundColor.BLACK} to the designated `data` if it contains or
     * begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${highlightPositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data      The {@link DataType data} being colorized.
     *  
     * @param color     The {@link Color color} to apply to the `data`.
     *  
     * @returns         A `string` containing the colorized output of the designated `data`.
     *  
     *                  If the `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *                  the `string` representation of the provided `data` will be colorized using
     *                  {@link BrightForegroundColor.BLACK} instead.
     *      
     *                  If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                  the unmodified `string` representation of the designated `data` will always be returned.
     * 
     * @apistatus       🧪 *Experimental*
     * @since           `v1`
     */
    export function highlightPositiveOutput ( data: DataType, color: Color ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `color` to the designated `data`
     * if it does not contain or begin with one or more `0`s.
     * 
     * In contrast to {@link colorizePositiveOutput `colorizePositiveOutput()`}, this function will
     * apply {@link BrightForegroundColor.BLACK} to the designated `data` if it contains or
     * begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${highlightPositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data      The {@link DataType data} being colorized.
     * 
     * @param colors    The {@link Color colors} to apply to the `data`.
     * 
     *                  Passing multiple foreground or background colors will cause later-specified
     *                  colors to overwrite those specified earlier in the `colors` array.
     * 
     * @returns         A `string` containing the colorized output of the designated `data`.
     *  
     *                  If the `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *                  the `string` representation of the provided `data` will be colorized using
     *                  {@link BrightForegroundColor.BLACK} instead.
     *      
     *                  If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                  the unmodified `string` representation of the designated `data` will always be returned.
     * 
     * @apistatus       🧪 *Experimental*
     * @since           `v1`
     */
    export function highlightPositiveOutput ( data: DataType, colors: Color[] ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the {@link DEFAULT_COLORS default console coloring} to the {@link Object.prototype.toString stringified}
     * `data` matched by the specified `match` string or regular expression
     * if it does not contain or begin with one or more `0`s.
     * 
     * In contrast to {@link colorizePositiveOutput `colorizePositiveOutput()`}, this function will
     * apply {@link BrightForegroundColor.BLACK} to the designated `data` if it contains or
     * begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${highlightPositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data      The {@link DataType data} being colorized.
     *  
     * @param match     The String or {@link RegExp Regular Expression} used to match
     *                  the characters to be colorized.
     *  
     *                  If a `RegExp` is provided, it must have the 
     *                  [`g` flag](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags).
     *  
     * @returns         A `string` containing the colorized output of the designated `data`.
     *  
     *                  If the `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *                  the `string` representation of the provided `data` will be colorized using
     *                  {@link BrightForegroundColor.BLACK} instead.
     *      
     *                  If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                  the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus       🧪 *Experimental*
     * @since           `v1`
     */
    export function highlightPositiveOutput ( data: DataType, match: MatchType ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the colors to the {@link Object.prototype.toString stringified} `data`
     * designated by the specified `matchMap` if it does not contain or begin with one or more `0`s.
     * 
     * In contrast to {@link colorizePositiveOutput `colorizePositiveOutput()`}, this function will
     * apply {@link BrightForegroundColor.BLACK} to the designated `data` if it contains or
     * begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${highlightPositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data      The {@link DataType data} being colorized.
     * 
     * @param matchMap  A {@link Map} of {@link MatchType}s to {@link Color Console Colors}.
     * 
     * @returns         A `string` containing the colorized output of the designated `data`.
     * 
     *                  If the `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *                  the `string` representation of the provided `data` will be colorized using
     *                  {@link BrightForegroundColor.BLACK} instead.
     *      
     *                  If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                  the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus       🧪 *Experimental*
     * @since           `v1`
     */
    export function highlightPositiveOutput ( data: DataType, matchMap: ColorMatchMap ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `color` to the designated `data` and immediately reset the terminal color
     * if it does not contain or begin with one or more `0`s.
     * 
     * In contrast to {@link colorizePositiveOutput `colorizePositiveOutput()`}, this function will
     * apply {@link BrightForegroundColor.BLACK} to the designated `data` if it contains or
     * begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${highlightPositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data              The {@link DataType data} being colorized.
     *  
     * @param color             The {@link Color color} to apply to the `data`.
     * 
     * @param originalColors    The original color(s) to reset the terminal to after
     *                          writing the colorized `data` to it.
     *  
     * @returns                 A `string` containing the colorized output of the designated `data`.
     *  
     *                          If the `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *                          the `string` representation of the provided `data` will be colorized using
     *                          {@link BrightForegroundColor.BLACK} instead.
     *      
     *                          If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                          the unmodified `string` representation of the designated `data` will always be returned.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     */
    export function highlightPositiveOutput ( data: DataType, color: Color, originalColors: Color | Color[] ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `color` to the designated `data`  * to the specified `originalColors` afterward.
     * if it does not contain or begin with one or more `0`s.
     * 
     * In contrast to {@link colorizePositiveOutput `colorizePositiveOutput()`}, this function will
     * apply {@link BrightForegroundColor.BLACK} to the designated `data` if it contains or
     * begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${highlightPositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data              The {@link DataType data} being colorized.
     * 
     * @param colors            The {@link Color colors} to apply to the `data`.
     * 
     *                          Passing multiple foreground or background colors will cause later-specified
     *                          colors to overwrite those specified earlier in the `colors` array.
     * 
     * @param originalColors    The original color(s) to reset the terminal to after
     *                          writing the colorized `data` to it.
     * 
     * @returns                 A `string` containing the colorized output of the designated `data`.
     *  
     *                          If the `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *                          the `string` representation of the provided `data` will be colorized using
     *                          {@link BrightForegroundColor.BLACK} instead.
     *      
     *                          If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                          the unmodified `string` representation of the designated `data` will always be returned.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     */
    export function highlightPositiveOutput ( data: DataType, colors: Color[], originalColors: Color | Color[] ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `color` to the {@link Object.prototype.toString stringified}
     * `data` matched by the specified `match` string or regular expression
     * if it does not contain or begin with one or more `0`s.
     * 
     * In contrast to {@link colorizePositiveOutput `colorizePositiveOutput()`}, this function will
     * apply {@link BrightForegroundColor.BLACK} to the designated `data` if it contains or
     * begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${highlightPositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data      The {@link DataType data} being colorized.
     *  
     * @param match     The String or {@link RegExp Regular Expression} used to match
     *                  the characters to be colorized.
     *  
     *                  If a `RegExp` is provided, it must have the 
     *                  [`g` flag](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags).
     *  
     * @param color     The {@link Color color} to apply to the `match`ed `data`.
     *  
     * @returns         A `string` containing the colorized output of the designated `data`.
     *  
     *                  If the `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *                  the `string` representation of the provided `data` will be colorized using
     *                  {@link BrightForegroundColor.BLACK} instead.
     *      
     *                  If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                  the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus       🧪 *Experimental*
     * @since           `v1`
     */
    export function highlightPositiveOutput ( data: DataType, match: MatchType, color: Color ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `colors` to the {@link Object.prototype.toString stringified}
     * `data` matched by the specified `match` string or regular expression
     * if it does not contain or begin with one or more `0`s.
     * 
     * In contrast to {@link colorizePositiveOutput `colorizePositiveOutput()`}, this function will
     * apply {@link BrightForegroundColor.BLACK} to the designated `data` if it contains or
     * begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${highlightPositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data      The {@link DataType data} being colorized.
     *  
     * @param match     The String or {@link RegExp Regular Expression} used to match
     *                  the characters to be colorized.
     *  
     *                  If a `RegExp` is provided, it must have the 
     *                  [`g` flag](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags).
     * 
     * @param colors    The {@link Color colors} to apply to the `match`ed `data`.
     * 
     *                  Passing multiple foreground or background colors will cause later-specified
     *                  colors to overwrite those specified earlier in the `colors` array.
     *  
     * @returns         A `string` containing the colorized output of the designated `data`.
     * 
     *                  If the `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *                  the `string` representation of the provided `data` will be colorized using
     *                  {@link BrightForegroundColor.BLACK} instead.
     *      
     *                  If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                  the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus       🧪 *Experimental*
     * @since           `v1`
     */
    export function highlightPositiveOutput ( data: DataType, match: MatchType, colors: Color[] ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the colors to the {@link Object.prototype.toString stringified} `data`
     * designated by the specified `matchMap` and immediately reset the terminal color
     * to the specified `originalColors` afterward if it does not contain or begin with one or more `0`s.
     * 
     * In contrast to {@link colorizePositiveOutput `colorizePositiveOutput()`}, this function will
     * apply {@link BrightForegroundColor.BLACK} to the designated `data` if it contains or
     * begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${highlightPositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data              The {@link DataType data} being colorized.
     * 
     * @param matchMap          A {@link Map} of {@link MatchType}s to {@link Color Console Colors}.
     * 
     * @param originalColors    The original color(s) to reset the terminal to after
     *                          writing the colorized `data` to it.
     * 
     * @returns                 A `string` containing the colorized output of the designated `data`.
     * 
     *                          If the `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *                          the `string` representation of the provided `data` will be colorized using
     *                          {@link BrightForegroundColor.BLACK} instead.
     *      
     *                          If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                          the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     */
    export function highlightPositiveOutput ( data: DataType, matchMap: ColorMatchMap, originalColors: Color | Color[] ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `color` to the {@link Object.prototype.toString stringified}
     * `data` matched by the specified `match` string or regular expression
     * and immediately reset the terminal color to the specified `originalColors` afterward
     * if it does not contain or begin with one or more `0`s.
     * 
     * In contrast to {@link colorizePositiveOutput `colorizePositiveOutput()`}, this function will
     * apply {@link BrightForegroundColor.BLACK} to the designated `data` if it contains or
     * begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${highlightPositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data              The {@link DataType data} being colorized.
     *  
     * @param match             The String or {@link RegExp Regular Expression} used to match
     *                          the characters to be colorized.
     *  
     *                          If a `RegExp` is provided, it must have the 
     *                          [`g` flag](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags).
     *  
     * @param color             The {@link Color color} to apply to the `match`ed `data`.
     * 
     * @param originalColors    The original color(s) to reset the terminal to after
     *                          writing the colorized `data` to it.
     *  
     * @returns                 A `string` containing the colorized output of the designated `data`.
     *  
     *                          If the `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *                          the `string` representation of the provided `data` will be colorized using
     *                          {@link BrightForegroundColor.BLACK} instead.
     *      
     *                          If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                          the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     */
    export function highlightPositiveOutput (
        data: DataType,
        match: MatchType,
        color: Color,
        originalColors: Color | Color[]
    ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `colors` to the {@link Object.prototype.toString stringified}
     * `data` matched by the specified `match` string or regular expression
     * and immediately reset the terminal color to the specified `originalColors` afterward
     * if it does not contain or begin with one or more `0`s.
     * 
     * In contrast to {@link colorizePositiveOutput `colorizePositiveOutput()`}, this function will
     * apply {@link BrightForegroundColor.BLACK} to the designated `data` if it contains or
     * begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${highlightPositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @param data              The {@link DataType data} being colorized.
     *  
     * @param match             The String or {@link RegExp Regular Expression} used to match
     *                          the characters to be colorized.
     *  
     *                          If a `RegExp` is provided, it must have the 
     *                          [`g` flag](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags).
     * 
     * @param colors            The {@link Color colors} to apply to the `match`ed `data`.
     * 
     *                          Passing multiple foreground or background colors will cause later-specified
     *                          colors to overwrite those specified earlier in the `colors` array.
     * 
     * @param originalColors    The original color(s) to reset the terminal to after
     *                          writing the colorized `data` to it.
     *  
     * @returns                 A `string` containing the colorized output of the designated `data`.
     * 
     *                          If the `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *                          the `string` representation of the provided `data` will be colorized using
     *                          {@link BrightForegroundColor.BLACK} instead.
     *      
     *                          If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                          the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus               🧪 *Experimental*
     * @since                   `v1`
     */
    export function highlightPositiveOutput (
        data: DataType,
        match: MatchType,
        colors: Color[],
        originalColors: Color | Color[]
    ): string;
    /**
     * Use [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
     * to apply the specified `colors` to the {@link Object.prototype.toString stringified}
     * `data` matched by the specified `match` string or regular expression and immediately reset the terminal color
     * to the specified `originalColors` afterward.
     * 
     * This is the generic version of the `highlightPositiveOutput()` function. See the non-generic
     * function overloads for more detailed information on usage and function parameters.
     * 
     * In contrast to {@link colorizePositiveOutput `colorizePositiveOutput()`}, this function will
     * apply {@link BrightForegroundColor.BLACK} to the designated `data` if it contains or
     * begins with one or more `0`s.
     * 
     * Repeatedly passing the same `data` to this function will overwrite incompatible 
     * color effects that were previously-applied while preserving compatible ones
     * 
     * To nest color effects, use the overloads with the `originalColors` argument:
     * ```
     * colorizeOutput(
     *    `The answer to everything is ${highlightPositiveOutput(42, BrightForegroundConsoleColor.YELLOW, ForegroundConsoleColor.GREEN)}!`
     *    ForegroundConsoleColor.GREEN
     * );
     * ```
     * 
     * @template T                      The type of the `matchOrColors` argument.
     * @template U                      The type of the `colorsOrOriginalColors` argument.
     * @template V                      The type of the `originalColors` argument.
     * 
     * @param data                      The {@link DataType data} being colorized.
     *  
     * @param matchOrColors             The String or {@link RegExp Regular Expression} used to match
     *                                  the characters to be colorized or the {@link Color colors}
     *                                  to apply to the `data`.
     *  
     *                                  If a `RegExp` is provided, it must have the 
     *                                  [`g` flag](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags).
     * 
     *                                  Passing multiple foreground or background colors will cause later-specified
     *                                  colors to overwrite those specified earlier in the `colors` array.
     * 
     * @param colorsOrOriginalColors    The {@link Color colors} to apply to the `match`ed `data`
     *                                  when `matchOrColors` contains a String or {@link RegExp Regular Expression}
     *                                  or the original color(s) to reset the terminal to after writing the colorized `data` to it
     *                                  when `matchOrColors` contains the {@link Color colors} to apply to the `data` or a {@link ColorMatchMap}.
     *
     *                                  Passing multiple foreground or background colors will cause later-specified
     *                                  colors to overwrite those specified earlier in the `colors` array.
     * 
     * @param originalColors            The original color(s) to reset the terminal to after writing the colorized `data` to it
     *                                  when `matchOrColors` contains a String or {@link RegExp Regular Expression}.
     * 
     *                                  When `matchOrColors` contains the {@link Color colors}
     *                                  to apply to the `data` or a {@link ColorMatchMap}, this argument is ignored.
     *  
     * @returns                         A `string` containing the colorized output of the designated `data`.
     * 
     *                                  If the `data` is a `0` or is a `string` beginning with one or more `'0'` characters,
     *                                  the `string` representation of the provided `data` will be colorized using
     *                                  {@link BrightForegroundColor.BLACK} instead.
     *      
     *                                  If the console does not have {@link consoleHasColorSupport sufficient color support},
     *                                  the unmodified `string` representation of the designated `data` will be returned.
     * 
     * @apistatus                       🧪 *Experimental*
     * @since                           `v1`
     */
    export function highlightPositiveOutput <
        T extends (MatchType | ColorMatchMap | Color | Color[] | undefined),
        U extends (
            T extends MatchType
                ? (Color | Color[] | null | undefined)
                : (Color | Color[] | undefined)
        ),
        V extends (
            T extends MatchType
                ? (Color | Color[] | undefined)
                : undefined
        )
    > ( data: DataType, matchOrColors?: T, colorsOrOriginalColors?: U, originalColors?: V ): string;
    export function highlightPositiveOutput <
        T extends (MatchType | ColorMatchMap | Color | Color[] | undefined),
        U extends (
            T extends MatchType
                ? (Color | Color[] | null | undefined)
                : (Color | Color[] | undefined)
        ),
        V extends (
            T extends MatchType
                ? (Color | Color[] | undefined)
                : undefined
        )
    > ( data: DataType, matchOrColors?: T, colorsOrOriginalColors?: U, originalColors?: V ): string {

        type ColorTypes = (Nullable | Color | Color[]);
        const COLOR_TYPES = ['null', 'undefined', 'number', 'array'] as const satisfies TypeofTypeString[];

        let originalColor: Color | Color[] | undefined = (() => {

            if ( (typeof matchOrColors == 'string' || matchOrColors instanceof RegExp) && typeof colorsOrOriginalColors == 'number' && typeof originalColors != 'undefined' )
                return originalColors;
            else if ( (typeof matchOrColors == 'number' || matchOrColors instanceof Map) && !isNullable(colorsOrOriginalColors) )
                return colorsOrOriginalColors;

        })();

        if ( isType<typeof COLOR_TYPES, ColorTypes>(matchOrColors, COLOR_TYPES) ) {
            return colorizeOutput(
                data,
                ( data === 0 || (typeof data == 'string' && POSITIVE_OUTPUT_MATCH_REGEX.test(data)) )
                    ? BrightForegroundColor.BLACK
                    : matchOrColors,
                originalColor
            );
        }
        else if (typeof matchOrColors == 'string' || matchOrColors instanceof ColorMatchMap || matchOrColors instanceof RegExp) {
            let updatedMap = new ColorMatchMap();
            let matchMap: ColorMatchMap = matchOrColors instanceof ColorMatchMap
                ? matchOrColors
                : new ColorMatchMap([ [matchOrColors, colorsOrOriginalColors ?? null] ]);

            for (const [matcher, matchColors] of matchMap) {
                updatedMap.set(
                    (
                        typeof matcher == 'string'
                            ? new RegExp(POSITIVE_OUTPUT_NLB_REGEX.source + matcher, 'g')
                            : new RegExp(POSITIVE_OUTPUT_NLB_REGEX.source + matcher.source, matcher.flags)
                    ),
                    matchColors
                );
                updatedMap.set(
                    (
                        typeof matcher == 'string'
                            ? new RegExp(POSITIVE_OUTPUT_PLB_REGEX.source + matcher, 'g')
                            : new RegExp(POSITIVE_OUTPUT_PLB_REGEX.source + matcher.source, matcher.flags)
                    ),
                    BrightForegroundColor.BLACK
                );
            }

            return colorizeOutput(data, updatedMap, originalColor);
        }

        throw new TypeError("Invalid Arguments Provided!");

    }

    export function toggleCursor ( visibility: boolean | 'toggle' = 'toggle' ): void {

        if (typeof visibility == 'string')
            visibility = !currentConsoleVisibility;

        if (visibility != currentConsoleVisibility) {
            verboseDataLog(() => [
                colorizeOutput(visibility ? 'Showing' : 'Hiding', ForegroundColor.CYAN),
                "the Console Cursor."
            ]);
            visibility = currentConsoleVisibility;
        }

    }

}


/* Confirmation Prompt */

/**
 * A namespace containing utilty types, functions,
 * and other members related to *Confirmation Prompts*.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 */
export namespace ConfirmationPrompt {

    /**
     * A function type representing a function assigned to 
     * the {@link pendingPrompt `confirmationPrompt`} variable when
     * a {@link prompt Confirmation Prompt is created} that can
     * be used to either approve or reject the Confirmation Prompt.
     * 
     * @param result    The result of the Confirmation Prompt.
     * 
     *                  `true` indicates that the operation was *approved*,
     *                  while `false` indicates that it was *rejected*.
     * 
     * @apistatus       ✔️ **Public**
     * @since           `v1`
     * 
     * @see {@link pendingPrompt}
     */
    export type ResolutionFunction = ( result: boolean ) => void;
    

    /**
     * The base text of the *Confirmation Prompt Instructions* printed
     * when {@link prompt prompting for user confirmation}.
     * 
     * @see {@link prompt `promptForConfirmation()`}
     */
    const INSTRUCTIONS = (
        "+---------------------------+\n"
      + "|      [Y]es      [N]o      |\n"
      + "+---------------------------+"
    );
    /**
    * The amount of time in *seconds* to {@link prompt wait for confirmation}
    * after a {@link failedAttempts previous confirmation prompt timeout}.
    * 
    * @see {@link failedAttempts `failedConfirmationAttempts`}
    */
    const REDUCED_TIMEOUT_DURATION = 5;
    

    /**
     * The number of times the user was 
     * {@link prompt consecutively unsuccessfully prompted for confirmation}.
     * 
     * This value is generally incremented whenever the user is unsuccessfully
     * prompted for confirmation and reset to `0` when the user is
     * successfully prompted for confirmation.
     * 
     * Once this value reaches `1` or higher, the {@link REDUCED_TIMEOUT_DURATION}
     * will be used when using the {@link prompt `promptForConfirmation()`} function
     * until the user is successfully prompted for confirmation.
     */
    var failedAttempts: number = 0;
    /**
     * Indicates whether or not a {@link prompt Confirmation Prompt}
     * is currently pending or not.
     * 
     * When no Confirmation Prompt is currently pending, this variable will be `null`.
     * 
     * When a Confiramtion Prompt is currently pending, this variable will contain
     * a {@link ResolutionFunction} that can be used to either
     * approve or reject the Confirmation Prompt.
     * 
     * @apistatus   ✔️ **Public**
     * @since       `v1`
     * 
     * @see {@link prompt `promptForConfirmation()`}
     */
    export var pendingPrompt: ResolutionFunction | null = null;
    

    /**
     * Prompt the user for confirmation before proceeding with the current operation.
     * 
     * The Confirmation Prompt will time out and default to being *rejected*
     * **30 Seconds** after being created.
     * 
     * @example
     * ConfirmationPrompt.prompt("Delete the file?").then((result) => {
     *    if (result) {
     *       console.log("Deleting the file!");
     *    }
     *    else {
     *       console.log("Skipping the file!");
     *    }
     * });
     * 
     * @returns     A promise that resolves to `true` if the user *approved* the operation
     *              or `false` if they *rejected* it.
     *          
     *              If the Confirmation Prompt times out due to inactivity, resolves to `false`.
     * 
     * @throws      Rejects with an {@link AlreadyInUseError} if another Confirmation Prompt
     *              is {@link pendingPrompt currently pending}.
     * 
     * @apistatus   ✔️ **Public**
     * @since       `v1`
     */
    export function prompt (): Promise<boolean>;
    /**
     * Prompt the user for confirmation before proceeding with the current operation
     * using the specified `prompt`.
     * 
     * The Confirmation Prompt will time out and default to being *rejected*
     * **30 Seconds** after being created.
     * 
     * @example
     * ConfirmationPrompt.prompt("Delete the file?").then((result) => {
     *    if (result) {
     *       console.log("Deleting the file!");
     *    }
     *    else {
     *       console.log("Skipping the file!");
     *    }
     * });
     * 
     * @param prompt    The prompt to be displayed to the user when prompting for confirmation.
     * 
     * @returns         A promise that resolves to `true` if the user *approved* the operation
     *                  or `false` if they *rejected* it.
     *          
     *                  If the Confirmation Prompt times out due to inactivity, resolves to `false`.
     * 
     * @throws          Rejects with an {@link AlreadyInUseError} if another Confirmation Prompt
     *                  is {@link pendingPrompt currently pending}.
     * 
     * @apistatus       ✔️ **Public**
     * @since           `v1`
     */
    export function prompt ( prompt?: string ): Promise<boolean>;
    /**
     * Prompt the user for confirmation before proceeding with the current operation,
     * automatically timing out and defaulting to being *rejected* after the specified `timeout`.
     * 
     * @example
     * ConfirmationPrompt.prompt("Delete the file?").then((result) => {
     *    if (result) {
     *       console.log("Deleting the file!");
     *    }
     *    else {
     *       console.log("Skipping the file!");
     *    }
     * });
     * 
     * @param timeout           The amount of time in *seconds* to wait for the user to approve or
     *                          reject the operation before timing out and defaulting to being *rejected*.
     * 
     *                          If `0` or a *negative* number is provided, the Confirmation Prompt
     *                          will not time out and will wait forever for the user to respond.
     * 
     * @param rejectOnTimeout   Indicates whether or not to throw a {@link TimeoutError}
     *                          if the confirmation times out after `timeout` seconds.
     * 
     *                          When `false`, returns `false` on timeout instead of throwing.
     *                          This is the default behavior.
     * 
     * @returns                 A promise that resolves to `true` if the user *approved* the operation
     *                          or `false` if they *rejected* it.
     *          
     *                          If `timeout` is a positive, nonzero number, `rejectOnTimeout` is `false`,
     *                          and the Confirmation Prompt times out due to inactivity, resolves to `false`.
     * 
     * @throws                  Rejects with an {@link AlreadyInUseError} if another Confirmation Prompt
     *                          is {@link pendingPrompt currently pending}.
     * 
     * @throws                  Rejects with a {@link TimeoutError} if `timeout` is a positive, nonzero number,
     *                          `rejectOnTimeout` is `true`, and the Confirmation Prompt times out due to inactivity.
     * 
     * @apistatus               ✔️ **Public**
     * @since                   `v1`
     */
    export function prompt ( timeout?: number, rejectOnTimeout?: boolean ): Promise<boolean>;
    /**
     * Prompt the user for confirmation before proceeding with the current operation
     * using the specified prompt and automatically timing out and defaulting to being
     * *rejected* after the specified `timeout`.
     * 
     * @example
     * ConfirmationPrompt.prompt("Delete the file?").then((result) => {
     *    if (result) {
     *       console.log("Deleting the file!");
     *    }
     *    else {
     *       console.log("Skipping the file!");
     *    }
     * });
     * 
     * @param prompt            The prompt to be displayed to the user when prompting for confirmation.
     * 
     * @param timeout           The amount of time in seconds to wait for the user to approve or
     *                          reject the operation before timing out and defaulting to being *rejected*.
     * 
     *                          If `0` or a *negative* number is provided, the Confirmation Prompt
     *                          will not time out and will wait forever for the user to respond.
     * 
     * @param rejectOnTimeout   Indicates whether or not to throw a {@link TimeoutError}
     *                          if the confirmation times out after `timeout` seconds.
     * 
     *                          When `false`, returns `false` on timeout instead of throwing.
     *                          This is the default behavior.
     * 
     * @returns                 A promise that resolves to `true` if the user *approved* the operation
     *                          or `false` if they *rejected* it.
     *          
     *                          If `timeout` is a positive, nonzero number, `rejectOnTimeout` is `false`,
     *                          and the Confirmation Prompt times out due to inactivity, resolves to `false`.
     * 
     * @throws                  Rejects with an {@link AlreadyInUseError} if another Confirmation Prompt
     *                          is {@link pendingPrompt currently pending}.
     * 
     * @throws                  Rejects with a {@link TimeoutError} if `timeout` is a positive, nonzero number,
     *                          `rejectOnTimeout` is `true`, and the Confirmation Prompt times out due to inactivity.
     * 
     * @apistatus               ✔️ **Public**
     * @since                   `v1`
     */
    export function prompt ( prompt?: string, timeout?: number, rejectOnTimeout?: boolean ): Promise<boolean>;
    /**
     * Prompt the user for confirmation before proceeding with the current operation
     * using the specified prompt and automatically timing out and defaulting to being
     * *rejected* after the specified `timeout`.
     * 
     * This is the generic overload of the `promptForConfirmation()` function. See the
     * other overloads for more details on the function parameters and their usage.
     * 
     * @example
     * ConfirmationPrompt.prompt("Delete the file?").then((result) => {
     *    if (result) {
     *       console.log("Deleting the file!");
     *    }
     *    else {
     *       console.log("Skipping the file!");
     *    }
     * });
     * 
     * @apistatus   ✔️ **Public**
     * @since       `v1`
     */
    export function prompt <
        T extends string | number | undefined,
        U extends (T extends string ? number | undefined : undefined),
        V extends (T extends string ? boolean | undefined : undefined)
    > ( promptOrTimeout?: T, timeoutOrRejectOnTimeout?: U, rejectOnTimeout?: V ): Promise<boolean>;
    export function prompt <
        T extends string | number | undefined,
        U extends (T extends string ? number | undefined : undefined),
        V extends (T extends string ? boolean | undefined : undefined)
    > ( promptOrTimeout?: T, timeoutOrRejectOnTimeout?: U, rejectOnTimeout?: V ): Promise<boolean> {

        const existingCursorVisibility = ConsoleUtils.currentConsoleVisibility;
    
        if (!isTtyConsole) {
            console.log("<!> Cannot prompt for confirmation because terminal is not a TTY.");
            return Promise.resolve(false);
        }
    
        return new Promise((resolve, reject) => {
    
            let timeoutId: NodeJS.Timeout | null = null;
            let prompt = typeof promptOrTimeout == 'string'
                ? promptOrTimeout
                : 'Continue?';
            let processedTimeout = typeof promptOrTimeout == 'number'
                ? promptOrTimeout
                : timeoutOrRejectOnTimeout ?? 30;
            let processedRejectOnTimeout = typeof promptOrTimeout == 'number'
                ? timeoutOrRejectOnTimeout
                : rejectOnTimeout ?? false;
    
            const settlePromise = ( result: boolean | Error ): void => {
    
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
    
                failedAttempts = 0;
                pendingPrompt = null;

                if (!existingCursorVisibility)
                    ConsoleUtils.toggleCursor(false);
                
                console.log();
    
                if (typeof result == 'boolean')
                    resolve(result);
                else
                    reject(result);            
    
            };
    
            if (pendingPrompt !== null)
                return settlePromise( new AlreadyInUseError("A Confirmation Prompt is already currently being used!") );
            
            console.log();
            console.log(prompt ?? "Continue?");
            console.log(ConsoleUtils.colorizeOutput(
                INSTRUCTIONS,
                new ConsoleUtils.ColorMatchMap({
                    '[Y]': ConsoleUtils.ForegroundColor.CYAN,
                    '[N]': ConsoleUtils.ForegroundColor.YELLOW
                })
            ));
    
            if (processedTimeout > 0) {
                if (processedTimeout > 0 && failedAttempts > 0)
                    processedTimeout = REDUCED_TIMEOUT_DURATION;
                
                console.log(ConsoleUtils.colorizeOutput(
                    ConsoleUtils.colorizeOutput(
                        `Confirmation will timeout and default to [N] in ${processedTimeout} seconds`,
                        new ConsoleUtils.ColorMatchMap([
                            [/\[N\]/, ConsoleUtils.ForegroundColor.YELLOW],
                            [/\d+ seconds/, null]
                        ]),
                        ConsoleUtils.BrightForegroundColor.BLACK
                    ),
                    ConsoleUtils.BrightForegroundColor.BLACK
                ));
                // console.log(
                //     colorizeOutput("Confirmation will timeout and default to", BrightForegroundConsoleColor.BLACK),
                //     `${colorizeOutput('[N]', ForegroundConsoleColor.YELLOW)}${colorizeOutput('o', ForegroundConsoleColor.WHITE)}`,
                //     colorizeOutput("in", BrightForegroundConsoleColor.BLACK),
                //     colorizeOutput(`${timeout} seconds`) + colorizeOutput(".", BrightForegroundConsoleColor.BLACK)
                // );
                timeoutId = setTimeout(
                    () => {
    
                        verboseDataLog(() => ConsoleUtils.colorizeOutput(
                            (
                                "Confirmation Prompt timed out after "
                                    + ConsoleUtils.colorizeOutput(
                                        dayjs.duration(processedTimeout, 'seconds').humanize(),
                                        ConsoleUtils.ForegroundColor.YELLOW,
                                        ConsoleUtils.BrightForegroundColor.BLACK
                                    )
                                    + "!"
                            ),
                            ConsoleUtils.BrightForegroundColor.BLACK
                        ));
                        settlePromise(
                            processedRejectOnTimeout
                                ? new TimeoutError((processedTimeout * 1000))
                                : false
                        );
                        // verboseDataLog(() => [
                        //     colorizeOutput("Confirmation Prompt timed out after", BrightForegroundConsoleColor.BLACK),
                        //     colorizeOutput(`${dayjs.duration(timeout, 'seconds').humanize()}`, ForegroundConsoleColor.YELLOW)
                        //         + colorizeOutput("!", BrightForegroundConsoleColor.BLACK)
                        // ]);
    
                    },
                    (processedTimeout * 1000)
                );
            }
    
            pendingPrompt = settlePromise;
            ConsoleUtils.toggleCursor(true);
    
        });
    
    }
    

    // Register the Confirmation Prompt Keypress Handler.
    (async () => {

        if (isTtyConsole) {
            // Use dynamic import to avoid circular dependencies.
            (await import("./runtime.js")).KeypressHandlers.registerKeypressHandler(
                'confirmation-prompt',
                (str, key) => {
        
                    // Only process `keypress` events when a
                    // Confirmation Prompt is currently active.
                    if (pendingPrompt) {
                        if (key.name == 'y' || key.name == 'n') {
                            pendingPrompt(key.name == 'y');
                            return false;
                        }
                    }
            
                }
            );
        }

    })();

}
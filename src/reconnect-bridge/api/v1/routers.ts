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
 * @see `./index.js` Module
 * @see `./env.js` Module
 * @see `../routers.js` Module
 */
declare module "./routers.js";

import {
    AbortError,
    ConsoleUtils,
    LogicError,
    ObjectUtils,
    promisify,
    StringUtils,
    UnrecoverableError
} from "../../../utils.js";
import ForegroundColor = ConsoleUtils.ForegroundColor;
import BrightForegroundColor = ConsoleUtils.BrightForegroundColor;
import colorizeOutput = ConsoleUtils.colorizeOutput;

import {
    AbortableAsyncOperation,
    AbortableOperation,
    PROGRAM_TITLE,
    Promisable,
    PromisableAbortableOperation,
    useVerboseDataLogging,
    verboseDataLog,
    verboseDataLogging,
    verboseLog,
    verboseLogging,
    WIFI_FREQUENCY_LIST,
    WifiFrequency
} from "../../../common.js";
import { ProgramStats } from "../../../runtime.js";
import { getProgramVars, type ProgramVariables } from "../../../env.js";
import { NO_REGISTERED_METHODS_ERROR_MESSAGE } from "../../common.js";


/* Miscellaneous Constants */

/**
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 */
export const BASE_PUPPETEER_SCREENSHOTS_PATH = "./reconnect-bridge/puppeteer-screenshots" as const;


/* Feature Support */

export interface SupportedFeatures {

    canSetupBridge?: boolean;
    frequencies?: SupportedFeatures.SupportedFrequencies;
    canChangeFrequency?: boolean;

}
export namespace SupportedFeatures {

    /**
     * An {@link Error} thrown by a {@link ReconnectionMethod}
     * when attempting to {@link ReconnectionMethod.setup set it up}
     * or {@link ReconnectionMethod.run run it}.
     * 
     * If specified during construction, the {@link ReconnectionMethod}
     * that threw the error will be available via the {@link supportedFeatures} property.
     * 
     * @apistatus   ✔️ **Public**
     * @since       `v1`
     * 
     * @see {@link ReconnectionError}
     * @see {@link SetupError}
     */
    export class UnsupportedFeatureError extends Error implements UnsupportedFeatureError.ErrorDetails {

        /**
         * The {@link ReconnectionMethod} that threw the error,
         * if specified during construction.
         */
        readonly supportedFeatures?: Readonly<SupportedFeatures>;
        readonly unsupportedFeature?: FeatureName;
        readonly unsupportedRouterOrMethod?: GenericBridgeRouter | ReconnectionMethod;

    
        /**
         * Construct a new `ReconnectionMethodError` with a default error message.
         */
        constructor ();
        /**
         * Construct a new `ReconnectionMethodError` with the specified `message`.
         * 
         * @param message   The error message to use.
         */
        constructor ( message?: string );
        /**
         * Construct a new `ReconnectionMethodError` with the specified error `options`.
         * 
         * @param options   Additional {@link ErrorOptions error options} to set.
         */
        constructor ( options?: UnsupportedFeatureError.ErrorOptions );
        /**
         * Construct a new `ReconnectionMethodError` with the specified `message` and error `options`.
         * 
         * @param message   The error message to use.
         * @param options   Additional {@link ErrorOptions error options} to set.
         */
        constructor ( message?: string, options?: UnsupportedFeatureError.ErrorOptions );
        constructor (
            messageOrOptions?: string | UnsupportedFeatureError.ErrorOptions,
            options?: UnsupportedFeatureError.ErrorOptions
        ) {

            const errorOptions = (typeof messageOrOptions == 'object' ? messageOrOptions : options);
            const errorMessage = (() => {

                if (typeof messageOrOptions == 'string')
                    return messageOrOptions;

                let message = (
                    errorOptions?.unsupportedFeature
                        ? `Optional Feature '${errorOptions.unsupportedFeature}' is not supported`
                        : "The requested optional feature is not supported"
                );
                
                if (errorOptions?.unsupportedRouterOrMethod)
                        message += ` by ${errorOptions.unsupportedRouterOrMethod instanceof BridgeRouter ? 'Bridge Router' : 'Reconnection Method'} '${errorOptions.unsupportedRouterOrMethod}'`;

                    return `${message}.`;

            })();
                
            super(errorMessage, errorOptions);
            
            if (errorOptions) {
                (['supportedFeatures', 'unsupportedFeature', 'unsupportedRouterOrMethod'] as const satisfies (keyof UnsupportedFeatureError.ErrorDetails)[])
                    .forEach((function ( key: string ) {
    
                        if (key in errorOptions)
                            this[key] = errorOptions[key];
    
                    }).bind(this));
            }
    
        }
    
    }
    export namespace UnsupportedFeatureError {

        export interface ErrorDetails {

            supportedFeatures?: Readonly<SupportedFeatures>;
            unsupportedFeature?: FeatureName;
            unsupportedRouterOrMethod?: GenericBridgeRouter | ReconnectionMethod;

        }

        export interface ErrorOptions extends globalThis.ErrorOptions, ErrorDetails {}

    }

    export type SupportedFrequencies = Partial<Record<WifiFrequency, boolean>>;
    export type FeatureName = (keyof SupportedFeatures | keyof SupportedFrequencies);

    type ExtendableSupportedFeaturesHelper <T extends object> = (
        {
            [K in keyof T as (T[K] extends (object | true) ? K : never)]: (
                T[K] extends object
                    ? ExtendableSupportedFeaturesHelper<T[K]>
                    : true
            );
        } & {
            [K in keyof T as (T[K] extends (boolean | undefined) ? K : never)]?: (
                T[K] extends false
                    ? false
                    : boolean
            );
        }
    )
    export type ExtendableSupportedFeatures <T extends SupportedFeatures> = SupportedFeatures & ExtendableSupportedFeaturesHelper<T>;

    export const DEFAULT_SUPPORT = {
        canSetupBridge: false,
        frequencies: {
            "2.4GHz": false,
            "5GHz": true
        },
        canChangeFrequency: false
    } as const satisfies ObjectUtils.RequiredRecursive<SupportedFeatures>;

    export function testFeatureSupport <ThrowsT extends boolean = false> (
        base: SupportedFeatures,
        test: SupportedFeatures,
        options?: testFeatureSupport.Options<ThrowsT>
    ): (ThrowsT extends true ? true : boolean) {

        const baseSupport = Object.assign({}, SupportedFeatures.DEFAULT_SUPPORT, base);
        const testSupport = Object.assign({}, SupportedFeatures.DEFAULT_SUPPORT, test);
        const fullOptions = Object.assign({}, testFeatureSupport.DEFAULT_OPTIONS, options ?? {});

        try {
            if (baseSupport.canSetupBridge && !testSupport.canSetupBridge) {
                throw new TypeError(`${fullOptions.baseName ?? 'The Base'} requires feature 'bridgeSetup' that ${fullOptions.testName ?? 'the test'} does not support.`);
            }
            else {
                for (const frequency in baseSupport.frequencies) {
                    if (baseSupport.frequencies["2.4GHz"] && !testSupport.frequencies["2.4GHz"]) {
                        throw new TypeError(`${fullOptions.baseName ?? 'The Base'} requires the ${frequency} Wi-Fi Frequency that ${fullOptions.testName ?? 'the test'} does not support.`);
                    }
                }
            }
        }
        catch (error) {
            if (fullOptions.throwOnFailure)
                throw error;

            return false as (ThrowsT extends true ? true : boolean);
        }

        return true;

    }
    export namespace testFeatureSupport {

        export interface Options <ThrowsT extends boolean = boolean> {

            baseName?: string;
            testName?: string;
            throwOnFailure?: ThrowsT;

        }

        export const DEFAULT_OPTIONS = {
            throwOnFailure: false
        } as const satisfies Options;

    }

    export function getFeatureSupport ( ...featureSupport: SupportedFeatures[] ): SupportedFeatures {

        let calculatedSupport: ObjectUtils.RequiredRecursive<SupportedFeatures> = Object.assign({}, DEFAULT_SUPPORT);

        featureSupport.forEach((features) => {

            calculatedSupport.canSetupBridge ||= (features.canSetupBridge ?? false);
            calculatedSupport.frequencies["2.4GHz"] ||= (features.frequencies?.["2.4GHz"] ?? false);
            calculatedSupport.frequencies["5GHz"] ||= (features.frequencies?.["5GHz"] ?? false);
            calculatedSupport.canChangeFrequency ||= (features.canChangeFrequency ?? false);

        });

        return calculatedSupport;

    }

    export var supportedFeatures: SupportedFeatures = Object.assign({}, SupportedFeatures.DEFAULT_SUPPORT);

}


/* Bridge Routers */

/**
 * A class representing a *Bridge Router* responsible
 * for operating the WDS Bridge.
 * 
 * When {@link registerBridgeRouter registered}, a `BridgeRouter`
 * becomes a {@link BridgeRouter.RegisteredRouter RegisteredRouter},
 * which is then associated with one or more {@link ReconnectionMethod Reconnection Methods}
 * responsible for re-establishing the WDS Bridge on the Bridge Router.
 * 
 * @template NameT  The type of the {@link BridgeRouter.name `name`} property.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 * 
 * @see {@link BridgeRouter.RegisteredRouter}
 */
export class BridgeRouter <
    NameT extends string,
    FeaturesT extends SupportedFeatures = {}
> {

    /**
     * The unique name and identifier for the `BridgeRouter`.
     * 
     * E.g., `'archer-c5-v4'`
     * 
     * @see {@link description}
     */
    readonly name: NameT;
    /**
     * The human-readable description for the `BridgeRouter`.
     * 
     * E.g., `'Archer C5 - Version 4'`
     * 
     * @see {@link BridgeRouter.name name}
     */
    readonly description: string;

    readonly features: Readonly<FeaturesT>;

    /**
     * Construct a new `BridgeRouter` with the specified `name` and `description`.
     * 
     * @param name          The unique name and identifier for the `BridgeRouter`.
     * 
     *                      E.g., `'archer-c5-v4'`
     * 
     * @param description   The human-readable description for the `BridgeRouter`.
     * 
     *                      E.g., `'Archer C5 - Version 4'`
     */
    constructor ( name: NameT, description: string, features?: FeaturesT ) {

        this.name = name;
        this.description = description;
        this.features = Object.freeze( Object.assign({}, SupportedFeatures.DEFAULT_SUPPORT, features) );

    }

    /**
     * Get the `string` representation of this `BridgeRouter`.
     * 
     * @example
     * const foo = new BridgeRouter('Foo', 'A Foo Router!');
     * 
     * console.log(foo.toString(false));    // Prints "Foo (A Foo Router!)"
     * console.log(foo.toString(true));     // Prints "'Foo' (A Foo Router!)"
     * 
     * @param quotedName    Whether or not to surround the {@link BridgeRouter.name name}
     *                      of the `BridgeRouter` with *Single Quotes* (`''`) or not.
     * 
     * @returns             The concatenated {@link BridgeRouter.name name} and
     *                      {@link description} of this `BridgeRouter` object.
     * 
     * @override
     */
    toString = ( quotedName: boolean = false ) => `${quotedName ? `'${this.name}'` : this.name} (${this.description})`;

}
export namespace BridgeRouter {

    /* Types & Interfaces */

    /**
     * An interface representing a *Registered {@link BridgeRouter Bridge Router}*
     * for operating the WDS Bridge and re-establishing it when necessary.
     * 
     * A `RegisteredBridgeRouter` is created when a {@link BridgeRouter}
     * is {@link registerBridgeRouter registered} and becomes associated
     * with one or more {@link ReconnectionMethod Reconnection Methods}
     * responsible for re-establishing the WDS Bridge on the Bridge Router.
     * 
     * @template RouterNameT    The type of the {@link BridgeRouter.prototype.name name} property.
     * @template RouterT        The type of the {@link router} property.
     * 
     * @apistatus               ✔️ **Public**
     * @since                   `v1`
     * 
     * @see {@link BridgeRouter}
     */
    export class RegisteredRouter <
        RouterNameT extends string = string,
        RouterT extends BridgeRouter<RouterNameT> = BridgeRouter<RouterNameT>
    > {

        
        /**
         * One or more {@link registerReconnectionMethod registered}
         * {@link ReconnectionMethod Reconnection Methods}
         * responsible for re-establishing the WDS Bridge on the Bridge Router.
         */
        #methods: Readonly<ReconnectionMethod.MethodRecord> = {};
        #supportedFeatures: Readonly<SupportedFeatures>;

        /**
         * The {@link BridgeRouter} that has been registered.
         */
        readonly router: RouterT;
        
        get methods (): Readonly<ReconnectionMethod.MethodRecord> {

            return this.#methods;

        }
        get supportedFeatures (): SupportedFeatures {

            return this.#supportedFeatures;

        }


        constructor ( router: RouterT, methods?: ReconnectionMethod.MethodRecord ) {

            this.router = router;
            this.#supportedFeatures = Object.freeze( Object.assign({}, this.router.features) );

            if (methods)
                for (const name in methods)
                    this.registerReconnectionMethod(methods[name]);

        }


        registerReconnectionMethod ( method: ReconnectionMethod ) {

            this.#methods = Object.freeze( Object.assign({}, this.#methods, { [method.name]: method }) );
            this.#supportedFeatures = Object.freeze( Object.assign({}, this.#supportedFeatures, method.features) );

        }

    };

    /**
     * An object type containing a mapping of
     * {@link BridgeRouter.prototype.name Bridge Router Names}
     * to their respective {@link BridgeRouter Bridge Routers}.
     * 
     * @template NamesT     An optional union of the {@link BridgeRouter.prototype.name Registered Bridge Router Names}
     *                      in the `RouterRecord`.
     * 
     * @apistatus           ✔️ **Public**
     * @since               `v1`
     * 
     * @see {@link RegisteredRouterRecord}
     * @see {@link ReconnectionMethod.MethodRecord}
     */
    export type RouterRecord <NamesT extends string = string> = {
        [Name in NamesT]: BridgeRouter<Name>;
    };
    /**
     * An object type containing a mapping of
     * {@link BridgeRouter.prototype.name Registered Bridge Router Names}
     * to their respective {@link RegisteredRouter Bridge Routers}.
     * 
     * @template NamesT     An optional union of the {@link BridgeRouter.prototype.name Registered Bridge Router Names}
     *                      in the `RegisteredRouterRecord`.
     * 
     * @apistatus           ✔️ **Public**
     * @since               `v1`
     * 
     * @see {@link RouterRecord}
     * @see {@link ReconnectionMethod.MethodRecord}
     */
    export type RegisteredRouterRecord <NamesT extends string = string> = {
        [Name in NamesT]: RegisteredRouter<Name>;
    };

    
    /* Global Variables */

    /**
     * The {@link BridgeRouter Bridge Router} being used
     * to operate the WDS Bridge.
     * 
     * If no {@link BridgeRouter} has been registered yet,
     * this variable will be `null`.
     * 
     * @apistatus   ✔️ **Public**
     * @since       `v1`
     * 
     * @see {@link reconnectionMethods `reconnectionMethods`} 
     */
    export var registeredRouter: GenericBridgeRouter | null = null;
    

    /* Functions */

    /**
     * Register the specified {@link BridgeRouter} as the
     * Bridge Router responsible for operating the WDS Bridge.
     * 
     * This function should only be called **once** during the startup
     * process, as subsequent calls will result in a {@link LogicError} being thrown.
     * 
     * @param router    The {@link BridgeRouter} being registered.
     * 
     * @throws          A {@link LogicError} if this function has already been called
     *                  and another {@link BridgeRouter} has already been registered.
     * 
     * @apistatus       ✔️ **Public**
     * @since           `v1`
     */
    export function registerRouter ( router: GenericBridgeRouter ): void {

        if (registeredRouter)
            throw new LogicError(`Bridge Router ${registeredRouter.toString(true)} has already been registered!`);

        registeredRouter = router;
        SupportedFeatures.supportedFeatures = SupportedFeatures.getFeatureSupport(router.features);
        verboseDataLog(`Successfully registered the ${colorizeOutput(registeredRouter.toString(true), ForegroundColor.YELLOW)} Bridge Router!`);

    }

}
export type GenericBridgeRouter = BridgeRouter<string, SupportedFeatures>;


/* Reconnection Methods */

/**
 * A class representing a *Reconnection Method* responsible
 * for re-establishing the WDS Bridge on a particular {@link BridgeRouter Bridge Router}.
 * 
 * @template NameT      The type of the {@link ReconnectionMethod.name name} property.
 * @template RouterT    The type of the {@link ReconnectionMethod.router} property.
 * 
 * @apistatus           ✔️ **Public**
 * @since               `v1`
 * 
 * @see {@link BridgeRouter}
 */
export class ReconnectionMethod <
    NameT extends string = string,
    RouterT extends GenericBridgeRouter = GenericBridgeRouter,
    RequiredFeaturesT extends (
        RouterT extends BridgeRouter<string, infer RouterFeaturesT>
            ? SupportedFeatures.ExtendableSupportedFeatures<RouterFeaturesT>
            : SupportedFeatures
    ) = (
        RouterT extends BridgeRouter<string, infer RouterFeaturesT>
            ? SupportedFeatures.ExtendableSupportedFeatures<RouterFeaturesT>
            : SupportedFeatures
    ),
    FeaturesT extends SupportedFeatures = RequiredFeaturesT
> {

    /* Instance Properties */

    /**
     * The unique name and identifier for the `ReconnectionMethod`.
     * 
     * E.g., `'puppeteer'`
     * 
     * @see {@link description}
     */
    readonly name: NameT;
    /**
     * The human-readable description for the `ReconnectionMethod`.
     * 
     * E.g., `'Puppeteer'`
     * 
     * @see {@link ReconnectionMethod.name name}
     */
    readonly description: string;
    /**
     * The {@link ReconnectionMethod.MethodType type} of `ReconnectionMethod`,
     * which determines how the Reconnection Method goes about
     * re-establishing the WDS Bridge.
     */
    readonly type: ReconnectionMethod.MethodType;
    /**
     * The {@link BridgeRouter} this `ReconnectionMethod` is
     * capable of re-establishing the WDS Bridge for.
     */
    readonly router: RouterT;

    readonly features: Readonly<FeaturesT>;
    
    /**
     * The {@link ReconnectionMethod.ReconnectionFunction Reconnection Function}
     * containing the logic for re-establishing the WDS Bridge.
     * 
     * @see {@link run `run()`}
     */
    readonly #fn: ReconnectionMethod.ReconnectionFunction;
    /**
     * The {@link ReconnectionMethod.SetupFunction Setup Function}
     * used to setup the `ReconnectionMethod` and prepare it
     * for re-establishing the WDS Bridge in the future.
     * 
     * If no Setup Function was specified, this field will be `null`.
     * 
     * @see {@link setup `setup()`}
     * @see {@link #_setupRan}
     */
    readonly #setupFn: ReconnectionMethod.SetupFunction | null;

    /**
     * Indicates whether or not the {@link setup Setup Function}
     * has been run yet.
     * 
     * @see {@link hasRunSetup}
     * @see {@link ReconnectionMethod#setupFn}
     * @see {@link setup `setup()`}
     */
    #_setupRan: boolean = false;
    /**
     * The number of *Successful Attempts* to {@link run Re-Establish the WDS Bridge}
     * using this Reconnection Method.
     * 
     * @see {@link successfulAttempts}
     * @see {@link #_failedAttempts}
     */
    #_successfulAttempts: number = 0;
    /**
     * The number of *Failed Attempts* to {@link run Re-Establish the WDS Bridge}
     * using this Reconnection Method.
     * 
     * @see {@link failedAttempts}
     * @see {@link #_successfulAttempts}
     */
    #_failedAttempts: number = 0;

    /**
     * Indicates whether or not the {@link setup Setup Function}
     * has been run yet.
     * 
     * @see {@link setup `setup()`}
     */
    get hasRunSetup (): boolean {

        return this.#_setupRan;

    }

    /**
     * The number of *Successful Attempts* to {@link run Re-Establish the WDS Bridge}
     * using this Reconnection Method.
     * 
     * This field can only be *incremented* by `1`.
     * All other setter operations will silently fail.
     * 
     * @see {@link failedAttempts}
     */
    get successfulAttempts (): number {

        return this.#_successfulAttempts;

    }
    set successfulAttempts ( newCount: number ) {

        if (newCount == (this.#_successfulAttempts + 1))
            this.#_successfulAttempts++;

    }

    /**
     * The number of *Failed Attempts* to {@link run Re-Establish the WDS Bridge}
     * using this Reconnection Method.
     * 
     * This field can only be *incremented* by `1`.
     * All other setter operations will silently fail.
     * 
     * @see {@link successfulAttempts}
     */
    get failedAttempts (): number {

        return this.#_failedAttempts;

    }
    set failedAttempts ( newCount: number ) {

        if (newCount == (this.#_failedAttempts + 1))
            this.#_failedAttempts++;

    }


    /* Class Constructors */

    /**
     * Construct a new `ReconnectionMethod` with the specified properties.
     * 
     * @param name          The unique name and identifier for the `ReconnectionMethod`.
     * 
     *                      E.g., `'puppeteer'`
     * 
     * @param description   The human-readable description for the `ReconnectionMethod`.
     * 
     *                      E.g., `'Puppeteer'
     * 
     * @param type          The {@link ReconnectionMethod.MethodType type} of `ReconnectionMethod`,
     *                      which determines how the Reconnection Method goes about
     *                      re-establishing the WDS Bridge.
     * 
     * @param router        The {@link BridgeRouter} this `ReconnectionMethod` is
     *                      capable of re-establishing the WDS Bridge for.
     * 
     * @param fn            The {@link ReconnectionMethod.ReconnectionFunction Reconnection Function}
     *                      containing the logic for re-establishing the WDS Bridge.
     * 
     *                      The Reconnection Function can be invoked using the {@link run `run()`} method.
     * 
     * @param setupFn       The optional {@link ReconnectionMethod.SetupFunction Setup Function}
     *                      used to setup the `ReconnectionMethod` and prepare it
     *                      for re-establishing the WDS Bridge in the future.
     * 
     *                      The Setup Function can be invoked using the {@link setup `setup()`} method.
     */
    constructor (
        name: NameT,
        description: string,
        type: ReconnectionMethod.MethodType,
        router: (
            BridgeRouter<any, {}> extends RouterT
                ? RouterT
                : (FeaturesT extends RequiredFeaturesT ? never : RouterT)
        ),
        fn: ReconnectionMethod.ReconnectionFunction,
        setupFn?: ReconnectionMethod.SetupFunction,
        features?: (FeaturesT extends RequiredFeaturesT ? FeaturesT : RequiredFeaturesT)
    );
    constructor (
        name: NameT,
        description: string,
        type: ReconnectionMethod.MethodType,
        router: RouterT,
        fn: ReconnectionMethod.ReconnectionFunction,
        setupFn: ReconnectionMethod.SetupFunction | undefined,
        features: (FeaturesT extends RequiredFeaturesT ? FeaturesT : RequiredFeaturesT)
    )
    constructor (
        name: NameT,
        description: string,
        type: ReconnectionMethod.MethodType,
        router: RouterT,
        fn: ReconnectionMethod.ReconnectionFunction,
        setupFn?: ReconnectionMethod.SetupFunction,
        features?: FeaturesT
    ) {

        this.name = name;
        this.description = description;
        this.type = type;
        this.router = router;
        this.features = Object.freeze( Object.assign({}, SupportedFeatures.DEFAULT_SUPPORT, features) );
        this.#fn = fn;
        this.#setupFn = setupFn ?? null;

        SupportedFeatures.testFeatureSupport(
            this.router.features,
            this.features as any,
            {
                baseName: `Bridge Router ${this.router}`,
                testName: `Reconnection Method ${this}`,
                throwOnFailure: true
            }
        );

        if (!this.#setupFn)
            this.#_setupRan = true;

    }


    /* Instance Methods */

    /**
     * Invoke the {@link ReconnectionMethod.ReconnectionFunction Reconnection Function}
     * registered to this `ReconnectionMethod` to re-establish the WDS Bridge
     * for the associated {@link bridgeRouter Bridge Router}.
     * 
     * @param signal            An {@link AbortSignal} used to terminate the operation early.
     * 
     * @returns                 A promise that resolves to `true` if the Reconnection Function
     *                          successfully re-established the WDS Bridge or `false` if it did not.
     * 
     *                          If the specified `signal` is used to {@link AbortController.prototype.abort abort}
     *                          the operation early, the promise will resolve to the value `'aborted'`.
     * 
     * @throws                  Rejects with a {@link ReconnectionMethod.ReconnectionError ReconnectionError}
     *                          if an error occurred while attempting to re-establish the WDS Bridge
     *                          using the registered {@link ReconnectionMethod.ReconnectionFunction Reconnection Function}.
     */
    async run ( signal: AbortSignal ): ReconnectionMethod.ReconnectionOperationResult {

        let result: ReconnectionMethod.ReconnectionResult = false;

        const actionCooldown: number = (() => {

            const programVars = getProgramVars();

            switch (this.type) {
                case ReconnectionMethod.MethodType.CGI:
                    return programVars.reconnectionMethods.actionCooldown.cgi;
                case ReconnectionMethod.MethodType.PUPPETEER:
                    return programVars.reconnectionMethods.actionCooldown.puppeteer;

                default:
                    return programVars.reconnectionMethods.actionCooldown.other;
            }

        })();

        verboseLog(`Attempting to Reconnect the WDS Bridge using the ${this.toString(true)} method...`);

        return this.ensureSetupHasRun()
            .then(() => this.#fn(signal, actionCooldown))
            .then((returnValue) => {

                result = returnValue;
                return result;

                // if (result != null)
                //     return result;

            })
            .catch((error) => {

                if (error instanceof ReconnectionMethod.ReconnectionError || error instanceof ReconnectionMethod.MainRouterError)
                    throw error;
                else
                    throw new ReconnectionMethod.ReconnectionError(this, { cause: error });

            })
            .finally(() => {

                if (result !== null && result != 'aborted') {
                    this[`${result ? 'successful' : 'failed'}Attempts`]++;
                    ProgramStats.updateProgramStats(`${result ? 'successful' : 'failed'}ReconnectionCount`);
                }

            });

    }
    /**
     * Invoke the {@link ReconnectionMethod.SetupFunction Setup Function}
     * registered to this `ReconnectionMethod` to setup the Reconnection Method
     * and prepare it for re-establishing the WDS Bridge
     * for the associated {@link bridgeRouter Bridge Router} in the future.
     * 
     * @template SignalT        The type of the `signal` argument.
     * @template ReturnT        The inferred type of the value of the returned promise.
     * 
     * @param signal            An optional {@link AbortSignal} used to terminate the operation early.
     * 
     * @returns                 A promise that resolves to `true` if the Setup Function
     *                          completed successfully or `false` if it did not.
     * 
     *                          If the `signal` is provided and is used to {@link AbortController.prototype.abort abort}
     *                          the operation early, the promise will resolve to the value `'aborted'`.
     * 
     * @throws                  Rejects with a {@link ReconnectionMethod.SetupError SetupError}
     *                          if an error occurred while attempting to setup the Reconnection Method.
     */
    async setup <
        SignalT extends AbortSignal | undefined = undefined,
        ReturnT extends AbortableOperation<boolean> = (
            SignalT extends AbortSignal
                ? AbortableOperation<boolean>
                : boolean
        )
    > ( signal?: SignalT ): Promise<ReturnT> {

        if (this.#_setupRan || !this.#setupFn)
            return true as ReturnT;

        const result = await promisify(this.#setupFn, getProgramVars().reconnectionMethods.deferSetup, signal).catch(
            (error) => {

                console.error(
                    "Setup for the",
                    "'" + colorizeOutput(this.toString(), ForegroundColor.YELLOW) + "'",
                    "Reconnection Method",
                    colorizeOutput('Failed!', ForegroundColor.RED),
                    "This Reconnection Method will not be used."
                );

                if (ReconnectionMethod.preferredMethod == ReconnectionMethod.currentMethod) {
                    console.error("The Reconnection Method Preference will default to 'auto'.");
                    ReconnectionMethod.setMethodPreference(null);
                }

                if (error instanceof ReconnectionMethod.SetupError)
                    throw error;
                else
                    throw new ReconnectionMethod.SetupError(this, { cause: error });
            }
        );

        this.#_setupRan = true;
        return result as ReturnT;

    }
    /**
     * Ensure that the {@link ReconnectionMethod.SetupFunction Setup Function}
     * registered to this `ReconnectionMethod` has been run, automatically
     * calling {@link setup `setup()`} if it has not.
     * 
     * Usage:
     * ```ts
     * await ensureSetupHasRun(signal).catch((error) => { throw error; });
     * 
     * // Operations that depend on the Reconnection Method
     * // having already been setup.
     * ```
     * 
     * @param signal    An optional {@link AbortSignal} used to terminate the operation early.
     * 
     * @returns         A promise that resolves when the {@link ReconnectionMethod.SetupFunction Setup Function}
     *                  registered to this `ReconnectionMethod` has completed successfully.
     * 
     * @throws          Rejects with a {@link ReconnectionMethod.SetupError SetupError}
     *                  if the Setup Function failed or threw an error.
     * 
     * @throws          Rejects with an {@link AbortError} if the `signal` is
     *                  provided and is used to {@link AbortController.prototype.abort abort}
     *                  the operation early.
     */
    async ensureSetupHasRun ( signal?: AbortSignal ): Promise<void> {

        if (!this.#_setupRan) {
            const result = await this.setup(signal).catch( (error) => { throw error; } );

            if (result === false)
                throw new ReconnectionMethod.SetupError(this);
            else if (result == 'aborted')
                throw new AbortError(signal);

            // if (!reconnectionMethodSetupRan)
            //     reconnectionMethodSetupRan = true;
        }

    }

    /**
     * Get the `string` representation of this `ReconnectionMethod`.
     * 
     * @example
     * const foo = new ReconnectionMethod(
     *    'foo',
     *    'A Foo Reconnection Method!',
     *    // ...
     * );
     * 
     * console.log(foo.toString(false));    // Prints "foo (A Foo Reconnection Method!)"
     * console.log(foo.toString(true));     // Prints "'foo' (A Foo Reconnection Method!)"
     * 
     * @param quotedName    Whether or not to surround the {@link ReconnectionMethod.name name}
     *                      of the `ReconnectionMethod` with *Single Quotes* (`''`) or not.
     * 
     * @returns             The concatenated {@link ReconnectionMethod.name name} and
     *                      {@link description} of this `ReconnectionMethod` object.
     * 
     * @override
     */
    toString = ( quotedName: boolean = false ) => `${quotedName ? `'${this.name}'` : this.name} (${this.description})`;

}
export namespace ReconnectionMethod {

    /* Types */

    /**
     * An enumeration defining the different types of
     * {@link ReconnectionMethod Reconnection Methods}
     * that can be defined and registered.
     * 
     * @apistatus   ✔️ **Public**
     * @since       `v1`
     */
    export enum MethodType {

        /**
         * A {@link ReconnectionMethod Reconnection Method} that
         * sends requests to the Bridge Router CGI in order to
         * establish or repair the WDS Bridge.
         */
        CGI = 'CGI',
        /**
         * A {@link ReconnectionMethod Reconnection Method} that
         * uses [Puppeteer](https://pptr.dev/) to programatically
         * navigate the Bridge Router's Web-Based Management Interface
         * in order to establish or repair the WDS Bridge.
         */
        PUPPETEER = 'Puppeteer',
        /**
         * A {@link ReconnectionMethod Reconnection Method} that
         * uses an alternative method to establish or repair the WDS Bridge
         * beyond those provided by the other {@link MethodType Method Types}.
         */
        OTHER = 'Other'

    };

    /**
     * An {@link Error} thrown by a {@link ReconnectionMethod}
     * when attempting to {@link ReconnectionMethod.setup set it up}
     * or {@link ReconnectionMethod.run run it}.
     * 
     * If specified during construction, the {@link ReconnectionMethod}
     * that threw the error will be available via the {@link method} property.
     * 
     * @apistatus   ✔️ **Public**
     * @since       `v1`
     * 
     * @see {@link ReconnectionError}
     * @see {@link SetupError}
     */
    export class MethodError extends Error {

        /**
         * The {@link ReconnectionMethod} that threw the error,
         * if specified during construction.
         */
        readonly method?: Readonly<ReconnectionMethod>;
    
    
        /**
         * Construct a new `ReconnectionMethodError` with a default error message.
         */
        constructor ();
        /**
         * Construct a new `ReconnectionMethodError` with the specified `message`.
         * 
         * @param message   The error message to use.
         */
        constructor ( message?: string );
        /**
         * Construct a new `ReconnectionMethodError` with the designated reconnection `method`.
         * 
         * @param method   The {@link ReconnectionMethod} that threw the error.
         */
        constructor ( method?: ReconnectionMethod );
        /**
         * Construct a new `ReconnectionMethodError` with the specified error `options`.
         * 
         * @param options   Additional {@link ErrorOptions error options} to set.
         */
        constructor ( options?: ErrorOptions );
        /**
         * Construct a new `ReconnectionMethodError` with the specified `message` and designated reconnection `method`.
         * 
         * @param message   The error message to use.
         * @param method   The {@link ReconnectionMethod} that threw the error
         */
        constructor ( message?: string, method?: ReconnectionMethod );
        /**
         * Construct a new `ReconnectionMethodError` with the specified `message` and error `options`.
         * 
         * @param message   The error message to use.
         * @param options   Additional {@link ErrorOptions error options} to set.
         */
        constructor ( message?: string, options?: ErrorOptions );
        /**
         * Construct a new `ReconnectionMethodError` with the designated reconnection `method` and error `options`.
         * 
         * @param method    The {@link ReconnectionMethod} that threw the error
         * @param options   Additional {@link ErrorOptions error options} to set.
         */
        constructor ( method?: ReconnectionMethod, options?: ErrorOptions );
        /**
         * Construct a new `ReconnectionMethodError` with the specified `message`, the
         * designated reconnection `method`, and the specified error `options`.
         * 
         * @param message   The error message to use.
         * @param method    The {@link ReconnectionMethod} that threw the error
         * @param options   Additional {@link ErrorOptions error options} to set.
         */
        constructor ( message?: string, method?: ReconnectionMethod, options?: ErrorOptions );
        constructor (
            arg1?: ReconnectionMethod | string | ErrorOptions,
            arg2?: ReconnectionMethod | ErrorOptions,
            arg3?: ErrorOptions
        );
        constructor (
            arg1?: ReconnectionMethod | string | ErrorOptions,
            arg2?: ReconnectionMethod | ErrorOptions,
            arg3?: ErrorOptions
        ) {
    
            let method: ReconnectionMethod | undefined = (() => {
    
                if (typeof arg1 == 'object' && arg1 instanceof ReconnectionMethod)
                    return arg1
                else if (typeof arg2 == 'object' && arg2 instanceof ReconnectionMethod)
                    return arg2;
    
            })();
            let options: ErrorOptions | undefined = (() => {
                
                for (let arg of arguments)
                    if (typeof arg == 'object' && !(arg instanceof ReconnectionMethod))
                        return arg;
                    
            })();
            let message = (() => {
    
                if (typeof arg1 == 'string')
                    return arg1;
                
                let methodName = method ? ` ${method.toString(true)}` : '';
                let causeMessage = (typeof options != 'undefined' && typeof options.cause == 'object' && options.cause instanceof Error)
                    ? ` -> ${options.cause.name}: ${options.cause.message}`
                    : '!';
    
                return `An Error Occurred with Reconnection Method${methodName}${causeMessage}`;
    
            })();
                
            super(message, options);
    
            if (method)
                this.method = method;
    
        }
    
    }
    /**
     * A {@link MethodError} thrown by a {@link ReconnectionMethod}
     * when attempting to {@link ReconnectionMethod.setup set it up}.
     * 
     * If specified during construction, the {@link ReconnectionMethod}
     * that threw the error will be available via the {@link method} property.
     * 
     * @apistatus   ✔️ **Public**
     * @since       `v1`
     * 
     * @see {@link MethodError}
     * @see {@link ReconnectionError}
     */
    export class SetupError extends MethodError {
    
        /**
         * Construct a new `SetupFunctionError` with a default error message.
         */
        constructor ();
        /**
         * Construct a new `SetupFunctionError` with the specified `message`.
         * 
         * @param message   The error message to use.
         */
        constructor ( message?: string );
        /**
         * Construct a new `SetupFunctionError` with the designated reconnection `method`.
         * 
         * @param method   The {@link ReconnectionMethod} that threw the error.
         */
        constructor ( method?: ReconnectionMethod );
        /**
         * Construct a new `SetupFunctionError` with the specified error `options`.
         * 
         * @param options   Additional {@link ErrorOptions error options} to set.
         */
        constructor ( options?: ErrorOptions );
        /**
         * Construct a new `SetupFunctionError` with the specified `message` and designated reconnection `method`.
         * 
         * @param message   The error message to use.
         * @param method   The {@link ReconnectionMethod} that threw the error
         */
        constructor ( message?: string, method?: ReconnectionMethod );
        /**
         * Construct a new `SetupFunctionError` with the specified `message` and error `options`.
         * 
         * @param message   The error message to use.
         * @param options   Additional {@link ErrorOptions error options} to set.
         */
        constructor ( message?: string, options?: ErrorOptions );
        /**
         * Construct a new `SetupFunctionError` with the designated reconnection `method` and error `options`.
         * 
         * @param method    The {@link ReconnectionMethod} that threw the error
         * @param options   Additional {@link ErrorOptions error options} to set.
         */
        constructor ( method?: ReconnectionMethod, options?: ErrorOptions );
        /**
         * Construct a new `SetupFunctionError` with the specified `message`, the
         * designated reconnection `method`, and the specified error `options`.
         * 
         * @param message   The error message to use.
         * @param method    The {@link ReconnectionMethod} that threw the error
         * @param options   Additional {@link ErrorOptions error options} to set.
         */
        constructor ( message?: string, method?: ReconnectionMethod, options?: ErrorOptions );
        constructor (
            arg1?: ReconnectionMethod | string | ErrorOptions,
            arg2?: ReconnectionMethod | ErrorOptions,
            arg3?: ErrorOptions
        );
        constructor (
            arg1?: ReconnectionMethod | string | ErrorOptions,
            arg2?: ReconnectionMethod | ErrorOptions,
            arg3?: ErrorOptions
        ) {
    
            let method: ReconnectionMethod | undefined = (() => {
    
                if (typeof arg1 == 'object' && arg1 instanceof ReconnectionMethod)
                    return arg1
                else if (typeof arg2 == 'object' && arg2 instanceof ReconnectionMethod)
                    return arg2;
    
            })();
            let options: ErrorOptions | undefined = (() => {
                
                for (let arg of arguments)
                    if (typeof arg == 'object' && !(arg instanceof ReconnectionMethod))
                        return arg;
                    
            })();
            let message = (() => {
    
                if (typeof arg1 == 'string')
                    return arg1;
                
                let methodName = method ? ` ${method.toString(true)}` : '';
                let causeMessage = (typeof options != 'undefined' && typeof options.cause == 'object' && options.cause instanceof Error)
                    ? ` -> ${options.cause.name}: ${options.cause.message}`
                    : '!';
    
                return `An Error Occurred during the Reconnection Method${methodName} Setup${causeMessage}`;
    
            })();
                
            super(message, method, options);
    
        }
    
    }
    /**
     * A {@link MethodError} thrown by a {@link ReconnectionMethod}
     * when attempting to {@link ReconnectionMethod.run run it}.
     * 
     * If specified during construction, the {@link ReconnectionMethod}
     * that threw the error will be available via the {@link method} property.
     * 
     * @apistatus   ✔️ **Public**
     * @since       `v1`
     * 
     * @see {@link MethodError}
     * @see {@link SetupError}
     */
    export class ReconnectionError extends MethodError {
    
        /**
         * Construct a new `ReconnectionFunctionError` with a default error message.
         */
        constructor ();
        /**
         * Construct a new `ReconnectionFunctionError` with the specified `message`.
         * 
         * @param message   The error message to use.
         */
        constructor ( message?: string );
        /**
         * Construct a new `ReconnectionFunctionError` with the designated reconnection `method`.
         * 
         * @param method   The {@link ReconnectionMethod} that threw the error.
         */
        constructor ( method?: ReconnectionMethod );
        /**
         * Construct a new `ReconnectionFunctionError` with the specified error `options`.
         * 
         * @param options   Additional {@link ErrorOptions error options} to set.
         */
        constructor ( options?: ErrorOptions );
        /**
         * Construct a new `ReconnectionFunctionError` with the specified `message` and designated reconnection `method`.
         * 
         * @param message   The error message to use.
         * @param method   The {@link ReconnectionMethod} that threw the error
         */
        constructor ( message?: string, method?: ReconnectionMethod );
        /**
         * Construct a new `ReconnectionFunctionError` with the specified `message` and error `options`.
         * 
         * @param message   The error message to use.
         * @param options   Additional {@link ErrorOptions error options} to set.
         */
        constructor ( message?: string, options?: ErrorOptions );
        /**
         * Construct a new `ReconnectionFunctionError` with the designated reconnection `method` and error `options`.
         * 
         * @param method    The {@link ReconnectionMethod} that threw the error
         * @param options   Additional {@link ErrorOptions error options} to set.
         */
        constructor ( method?: ReconnectionMethod, options?: ErrorOptions );
        /**
         * Construct a new `ReconnectionFunctionError` with the specified `message`, the
         * designated reconnection `method`, and the specified error `options`.
         * 
         * @param message   The error message to use.
         * @param method    The {@link ReconnectionMethod} that threw the error
         * @param options   Additional {@link ErrorOptions error options} to set.
         */
        constructor ( message?: string, method?: ReconnectionMethod, options?: ErrorOptions );
        constructor (
            arg1?: ReconnectionMethod | string | ErrorOptions,
            arg2?: ReconnectionMethod | ErrorOptions,
            arg3?: ErrorOptions
        );
        constructor (
            arg1?: ReconnectionMethod | string | ErrorOptions,
            arg2?: ReconnectionMethod | ErrorOptions,
            arg3?: ErrorOptions
        ) {
    
            let method: ReconnectionMethod | undefined = (() => {
    
                if (typeof arg1 == 'object' && arg1 instanceof ReconnectionMethod)
                    return arg1
                else if (typeof arg2 == 'object' && arg2 instanceof ReconnectionMethod)
                    return arg2;
    
            })();
            let options: ErrorOptions | undefined = (() => {
                
                for (let arg of arguments)
                    if (typeof arg == 'object' && !(arg instanceof ReconnectionMethod))
                        return arg;
                    
            })();
            let message = (() => {
    
                if (typeof arg1 == 'string')
                    return arg1;
                
                let methodName = method ? ` ${method.toString(true)}` : '';
                let causeMessage = (typeof options != 'undefined' && typeof options.cause == 'object' && options.cause instanceof Error)
                    ? ` -> ${options.cause.name}: ${options.cause.message}`
                    : '!';
    
                return `An Error Occurred during the Reconnection Method${methodName} Invocation${causeMessage}`;
    
            })();
                
            super(message, method, options);
    
        }
    
    }

    export class MainRouterError extends MethodError {
    
        /**
         * Construct a new `MainRouterError` with a default error message.
         */
        constructor ();
        /**
         * Construct a new `MainRouterError` with the specified `message`.
         * 
         * @param message   The error message to use.
         */
        constructor ( message?: string );
        /**
         * Construct a new `MainRouterError` with the designated reconnection `method`.
         * 
         * @param method   The {@link ReconnectionMethod} that threw the error.
         */
        constructor ( method?: ReconnectionMethod );
        /**
         * Construct a new `MainRouterError` with the specified error `options`.
         * 
         * @param options   Additional {@link ErrorOptions error options} to set.
         */
        constructor ( options?: ErrorOptions );
        /**
         * Construct a new `MainRouterError` with the specified `message` and designated reconnection `method`.
         * 
         * @param message   The error message to use.
         * @param method   The {@link ReconnectionMethod} that threw the error
         */
        constructor ( message?: string, method?: ReconnectionMethod );
        /**
         * Construct a new `MainRouterError` with the specified `message` and error `options`.
         * 
         * @param message   The error message to use.
         * @param options   Additional {@link ErrorOptions error options} to set.
         */
        constructor ( message?: string, options?: ErrorOptions );
        /**
         * Construct a new `MainRouterError` with the designated reconnection `method` and error `options`.
         * 
         * @param method    The {@link ReconnectionMethod} that threw the error
         * @param options   Additional {@link ErrorOptions error options} to set.
         */
        constructor ( method?: ReconnectionMethod, options?: ErrorOptions );
        /**
         * Construct a new `MainRouterError` with the specified `message`, the
         * designated reconnection `method`, and the specified error `options`.
         * 
         * @param message   The error message to use.
         * @param method    The {@link ReconnectionMethod} that threw the error
         * @param options   Additional {@link ErrorOptions error options} to set.
         */
        constructor ( message?: string, method?: ReconnectionMethod, options?: ErrorOptions );
        constructor (
            arg1?: ReconnectionMethod | string | ErrorOptions,
            arg2?: ReconnectionMethod | ErrorOptions,
            arg3?: ErrorOptions
        );
        constructor (
            arg1?: ReconnectionMethod | string | ErrorOptions,
            arg2?: ReconnectionMethod | ErrorOptions,
            arg3?: ErrorOptions
        ) {
    
            let method: ReconnectionMethod | undefined = (() => {
    
                if (typeof arg1 == 'object' && arg1 instanceof ReconnectionMethod)
                    return arg1
                else if (typeof arg2 == 'object' && arg2 instanceof ReconnectionMethod)
                    return arg2;
    
            })();
            let options: ErrorOptions | undefined = (() => {
                
                for (let arg of arguments)
                    if (typeof arg == 'object' && !(arg instanceof ReconnectionMethod))
                        return arg;
                    
            })();
            let message = (() => {
    
                if (typeof arg1 == 'string')
                    return arg1;
                
                let methodName = method ? ` ${method.toString(true)}` : '';
                let causeMessage = (typeof options != 'undefined' && typeof options.cause == 'object' && options.cause instanceof Error)
                    ? ` -> ${options.cause.name}: ${options.cause.message}`
                    : '!';
    
                return `The Main Router could not be reached during the Reconnection Method${methodName} Invocation${causeMessage}`;
    
            })();
                
            super(message, method, options);
    
        }
    
    }


    /**
     * A function type representing a {@link ReconnectionMethod.#setupFn Setup Function}
     * used to setup the {@link ReconnectionMethod Reconnection Method} and
     * prepare for re-establishing the WDS Bridge in the future.
     * 
     * @param wasDeferred       Indicates whether or not the Setup Function was *deferred*
     *                          until the {@link ReconnectionMethod} was
     *                          {@link ReconnectionMethod.run invoked} to re-establish the WDS Bridge.
     * 
     *                          This value is typically used to avoid logging out of
     *                          the Browser Management Interface during setup if the
     *                          {@link ReconnectionFunction Reconnection Function} needs
     *                          to be logged in anyway,
     * 
     * @param signal            An optional {@link AbortSignal} that may be used to
     *                          terminate the operation early.
     * 
     * @returns                 `true` or `undefined` if the Setup Function completed successfully.
     * 
     *                          If an error occurred or the Setup Function otherwise failed,
     *                          it should return `false`.
     * 
     *                          If the `signal` is provided and is used to {@link AbortController.prototype.abort abort}
     *                          the operation early, the Setup Function should return the value `'aborted'`.
     * 
     *                          The Setup Function may also return a promise that resolves to any
     *                          of the above values (`true`, `false`, `undefined` / `void`, or `'aborted'`).
     * 
     * @throws                  May throw a {@link SetupError} if an error occurred while
     *                          attempting to setup the Reconnection Method. If a non-`SetupError`
     *                          is thrown, it will be wrapped in a new `SetupError` and added
     *                          as the {@link SetupError.cause `cause`}.
     * 
     * @apistatus               ✔️ **Public**
     * @since                   `v1`
     * 
     * @see {@link ReconnectionFunction}
     */
    export type SetupFunction = ( wasDeferred: boolean, signal?: AbortSignal ) => PromisableAbortableOperation<boolean | undefined>;
    
    export type ReconnectionResult = AbortableOperation<boolean | null>;
    export type ReconnectionOperationResult = Promise<ReconnectionResult>;
    /**
     * A function type representing a {@link ReconnectionMethod.#fn Reconnection Function}
     * containing the logic used to re-establish the WDS Bridge.
     * 
     * @param signal            An {@link AbortSignal} used to terminate the operation early.
     * 
     * @param actionCooldown    The amount of time in *milliseconds* to pause between operations.
     * 
     * @returns                 A promise that should resolve to `true` if the Reconnection Function
     *                          successfully re-established the WDS Bridge or `false` if it did not.
     * 
     *                          If the specified `signal` is used to {@link AbortController.prototype.abort abort}
     *                          the operation early, the promise should resolve to the value `'aborted'`.
     * 
     * @throws                  May throw a {@link ReconnectionError} if an error occurred while
     *                          attempting to re-establish the WDS Bridge. If a non-`ReconnectionError`
     *                          is thrown, it will be wrapped in a new `ReconnectionError` and added
     *                          as the {@link ReconnectionError.cause `cause`}.
     * 
     * @apistatus               ✔️ **Public**
     * @since                   `v1`
     * 
     * @see {@link SetupFunction}
     */
    export type ReconnectionFunction = ( signal: AbortSignal, actionCooldown: number ) => ReconnectionOperationResult;

    /**
     * An object type containing a mapping of
     * {@link ReconnectionMethod.name Reconnection Method Names}
     * to their respective {@link ReconnectionMethod Reconnection Methods}.
     * 
     * @template NamesT     An optional union of the {@link ReconnectionMethod.name Reconnection Method Names}
     *                      in the `MethodRecord`.
     * 
     * @apistatus           ✔️ **Public**
     * @since               `v1`
     * 
     * @see {@link RouterRecord}
     */
    export type MethodRecord <NamesT extends string = string> = {
        [Name in NamesT]: ReconnectionMethod<Name>;
    };


    /* Global Variables */

    /**
     * A {@link ReconnectionMethod.MethodRecord record object} of
     * {@link registerMethod Registered} {@link ReconnectionMethod Reconnection Methods}.
     * 
     * All of the {@link ReconnectionMethod Reconnection Methods} will
     * have a {@link ReconnectionMethod.router `router`} equal to
     * the Registered {@link bridgeRouter `bridgeRouter`}.
     * 
     * @apistatus   ⚠️ *Not Recommended*
     * 
     * @see {@link registerMethod `registerReconnectionMethod()`}
     * @see {@link bridgeRouter `bridgeRouter`}
     * @see {@link reconnectionMethodCount `reconnectionMethodCount`}
     */
    export var registeredMethods: ReconnectionMethod.MethodRecord = {};
    /**
     * The number of {@link ReconnectionMethod Reconnection Methods}
     * that are {@link reconnectionMethods currently registered}.
     * 
     * @apistatus   ✔️ **Public**
     * @since       `v1`
     * 
     * @see {@link reconnectionMethods `reconnectionMethods`}
     */
    export var registeredMethodCount: number = 0;
    /**
     * Indicates if the {@link ReconnectionMethod.SetupFunction Setup Functions}
     * for all of the {@link reconnectionMethods Registered} {@link ReconnectionMethod Reconnection Methods}
     * have been {@link runReconnectionMethodSetup run} yet.
     * 
     * @apistatus   ✔️ **Public**
     * @since       `v1`
     */
    export var registeredMethodSetupRan: boolean = false;

    /**
     * The Current {@link registerMethod Registered}
     * {@link ReconnectionMethod Reconnection Method} being used
     * to re-establish the WDS Bridge when needed.
     * 
     * Can be changed using the {@link setCurrentMethod `setCurrentReconnectionMethod()`}
     * and {@link cycleMethod `cycleReconnectionMethod()`} functions.
     * 
     * If no {@link ReconnectionMethod Reconnection Methods} have been
     * {@link registerMethod registered} yet, this variable will be `null`.
     * 
     * @see {@link setCurrentMethod `setCurrentReconnectionMethod()`}
     * @see {@link cycleMethod `cycleReconnectionMethod()`}
     * 
     * @apistatus   ⚠️ *Not Recommended*
     */
    export var currentMethod: ReconnectionMethod | null = null;
    /**
     * The Preferred {@link registerMethod Registered}
     * {@link ReconnectionMethod Reconnection Method} to use
     * to re-establish the WDS Bridge when needed.
     * 
     * When this variable is set to `null`, the Reconnection Method will be automatically
     * selected from the {@link reconnectionMethods Registered Reconnection Methods}
     * by the program and be permitted to switch between the available Reconnection Methods
     * once the designated {@link ProgramVariables.retries `ProgramVariables.retries.maxMethodRetries`}
     * has been reached.
     * 
     * Can be changed using
     * {@link setMethodPreference `setReconnectionMethodPreference()`}.
     * 
     * @apistatus   ⚠️ *Not Recommended*
     * 
     * @see {@link setMethodPreference `setReconnectionMethodPreference()`}
     */
    export var preferredMethod: ReconnectionMethod | null = null;


    /* Functions */

    /**
     * Register the specified {@link ReconnectionMethod} to
     * re-establish the WDS Bridge when it goes down.
     * 
     * Before this function can be invoked, {@link registerBridgeRouter `registerBridgeRouter()`}
     * must be called to register a valid {@link BridgeRouter}.
     * 
     * @param method    The {@link ReconnectionMethod} being registered.
     * 
     *                  Must have the same {@link ReconnectionMethod.router `router`}
     *                  as the {@link bridgeRouter Registered Bridge Router}.
     * 
     * @returns         `true` if the specified {@link ReconnectionMethod} was successfully registered. 
     * 
     *                  `false` if the specified {@link ReconnectionMethod} is invalid,
     *                  has already been registered, or whose {@link ReconnectionMethod.setup Setup Function} failed.
     * 
     * @apistatus       ✔️ **Public**
     * @since           `v1`
     */
    export function registerMethod ( method: ReconnectionMethod ): boolean {

        if (!BridgeRouter.registeredRouter)
            throw new TypeError(`The Bridge Router for the specified Reconnection Method has not been registered!`);
        else if (method.router.name != BridgeRouter.registeredRouter.name)
            throw new TypeError(`The provided Reconnection Method is for a different Bridge Router (${method.router.name}) than the Registered Bridge Router (${BridgeRouter.registeredRouter.name}).`)
        
        if (method.name in registeredMethods)
            throw new TypeError(`A Reconnection Method with the name of '${method.name}' has already been registered!`);

        if ( registeredMethodSetupRan && !method.setup() )
            return false;

        registeredMethods[method.name] = method;
        SupportedFeatures.supportedFeatures = SupportedFeatures.getFeatureSupport(SupportedFeatures.supportedFeatures, method.features);
        registeredMethodCount++;

        if (currentMethod === null)
            currentMethod = registeredMethods[method.name];

        verboseDataLog(`Successfully registered the ${colorizeOutput(method.toString(true), ForegroundColor.CYAN)} Reconnection Method!`);
        return true;

    }
    /**
     * Remove the {@link registerMethod Registered} {@link ReconnectionMethod Reconnection Method}
     * of the given {@link ReconnectionMethod.name `name`}.
     * 
     * @param name  The {@link ReconnectionMethod.name `name`} of the
     *              {@link ReconnectionMethod Reconnection Method}
     *              being removed.
     * 
     * @returns     `true` if the specified {@link ReconnectionMethod Reconnection Method}
     *              was successfully removed.
     * 
     *              `false` if the specified `name` does not match a
     *              {@link registerMethod Registered} {@link ReconnectionMethod Reconnection Method}
     *              or if the designated Reconnection Method has already been removed.
     * 
     * @apistatus   ✔️ **Public**
     * @since       `v1`
     */
    export function removeMethod ( name: string ): boolean {

        if ( !methodExists(name) )
            return false;

        const method = registeredMethods[name];

        if (currentMethod == method) {
            if (registeredMethodCount > 1)
                cycleMethod();
            else
                currentMethod = null;
        }

        delete registeredMethods[name];
        registeredMethodCount--;
        return true;

    }

    /**
     * Assert that one or more {@link ReconnectionMethod Reconnection Methods}
     * have been {@link registerMethod registered}, throwing
     * a {@link LogicError} if none have been.
     * 
     * @throws  A {@link LogicError} if the {@link reconnectionMethodCount}
     *          is currently `0`.
     */
    function assertMethodsAreRegistered (): void | never {

        if (registeredMethodCount == 0)
            throw new LogicError("No Reconnection Methods have been successfully registered yet!");

    }
    /**
     * Check if the specified {@link ReconnectionMethod}
     * is currently {@link reconnectionMethods registered}.
     * 
     * @param name  The {@link ReconnectionMethod.name `name`} of the
     *              {@link ReconnectionMethod Reconnection Method} to check for.
     * 
     * @returns     `true` if the specified {@link ReconnectionMethod}
     *              is currently registered or `false` if it is not.
     * 
     * @apistatus   ✔️ **Public**
     * @since       `v1`
     */
    export const methodExists = ( name: string ) => (name in registeredMethods);

    /**
     * Set the {@link preferredMethod Reconnection Method Preference}
     * to the specified {@link ReconnectionMethod Reconnection Method}.
     * 
     * @param name  The {@link ReconnectionMethod.name name} of the
     *              {@link registerMethod Registered} {@link ReconnectionMethod Reconnection Method}
     *              being set as the new preference.
     * 
     *              If set to `null`, the current Reconnection Method Preference
     *              will be cleared and the Reconnection Method will be automatically
     *              selected from the {@link reconnectionMethods Registered Reconnection Methods}
     *              by the program and be permitted to switch between the available Reconnection Methods
     *              once the designated {@link ProgramVariables.retries `ProgramVariables.retries.maxMethodRetries`}
     *              has been reached.
     * 
     * @returns     `true` on success and `false` on failure.
     * 
     * @apistatus   ⚠️ *Not Recommended*
     * 
     * @see {@link preferredMethod `reconnectionMethodPreference`}
     * @see {@link setCurrentMethod `setCurrentReconnectionMethod()`}
     */
    export function setMethodPreference ( name: string | null ): boolean {

        if (name == preferredMethod?.name)
            return true;
        else if ( name !== null && !methodExists(name) )
            return false;

        preferredMethod = name !== null ? registeredMethods[name] : null;
        verboseDataLog(() => [
            "The Preferred Reconnection Method has been",
            (
                name !== null
                    ? "changed to '" + colorizeOutput(name, ForegroundColor.CYAN) + "'"
                    : colorizeOutput('cleared', ForegroundColor.YELLOW)
            ) + '.'
        ]);
        return true;

    }
    /**
     * Set the {@link preferredMethod Reconnection Method}
     * to use to re-establish the WDS Bridge when needed.
     * 
     * @param name  The {@link ReconnectionMethod.name name} of the
     *              {@link registerMethod Registered} {@link ReconnectionMethod Reconnection Method}
     *              to set as the Current Reconnection Method.
     * 
     * @returns     `true` on success and `false` on failure.
     * 
     * @throws      A {@link LogicError} if no {@link ReconnectionMethod}s
     *              have been successfully {@link registerMethod registered} yet.
     * 
     * @apistatus   ⚠️ *Not Recommended*
     * 
     * @see {@link reconnectionMethods `reconnectionMethods`}
     * @see {@link setMethodPreference `setReconnectionMethodPreference()`}
     * @see {@link cycleMethod `cycleReconnectionMethod()`}
     */
    export function setCurrentMethod ( name: string ): boolean {
        
        assertMethodsAreRegistered();

        if (name == currentMethod?.name)
            return true;
        else if ( !methodExists(name) )
            return false;

        currentMethod = registeredMethods[name];
        verboseDataLog(() => [
            "The Current Reconnection Method has been changed to",
            "'" + colorizeOutput(name, ForegroundColor.CYAN) + "'"
        ]);
        return true;

    }
    /**
     * Cycle the {@link preferredMethod Reconnection Method}
     * to use to re-establish the WDS Bridge when needed to the next available
     * method in the {@link reconnectionMethods Registered Reconnection Method Map}.
     * 
     * @returns     The {@link ReconnectionMethod} now being used to re-establish
     *              the WDS Bridge when needed.
     * 
     * @throws      A {@link LogicError} if no {@link ReconnectionMethod}s
     *              have been successfully {@link registerMethod registered} yet.
     * 
     * @apistatus   ⚠️ *Not Recommended*
     * 
     * @see {@link reconnectionMethods `reconnectionMethods`}
     * @see {@link setCurrentMethod `setCurrentReconnectionMethod()`}
     */
    export function cycleMethod (): ReconnectionMethod {

        assertMethodsAreRegistered();

        currentMethod = ObjectUtils.nextValue(registeredMethods, currentMethod!.name, true);
        return currentMethod;

    }

    /**
     * Run the {@link ReconnectionMethod.setup Setup Function} for each
     * of the {@link registerMethod Registered} {@link ReconnectionMethod Reconnection Methods}.
     * 
     * This function should only be invoked **once**, as all subsequent invocations
     * will return a promise that immediately rejects with a {@link LogicError}.
     * To check if this function has already been called, use the
     * global {@link reconnectionMethodSetupRan `reconnectionMethodSetupRan`} variable.
     * 
     * If a {@link preferredMethod Reconnection Method Preference} has been set,
     * only the preferred {@link ReconnectionMethod} will be {@link ReconnectionMethod.setup setup}.
     * 
     * @param signal    An {@link AbortSignal} used to terminate the operation early. 
     * 
     * @returns         A promise that resolves to `true` if one or more {@link ReconnectionMethod Reconnection Methods}
     *                  were successfully {@link ReconnectionMethod.setup setup}.
     * 
     *                  If all of the {@link registerMethod Registered}
     *                  {@link ReconnectionMethod Reconnection Methods} failed to be {@link ReconnectionMethod.setup setup},
     *                  the returned promise will resolve to `false`.
     * 
     * @throws          Rejects with a {@link LogicError} if this function has already been called or
     *                  if there are no {@link reconnectionMethods Registered Reconnection Methods}.
     * 
     * @apistatus       ⚠️ *Not Recommended*
     */
    export const setupRegisteredMethods = ( signal: AbortSignal ): Promise<boolean> => new Promise(
        async (resolve, reject) => {

            if (registeredMethodSetupRan)
                return reject(new LogicError("The Setup Functions for all of the Registered Reconnection Methods have already been ran!"));
            
            let registeredMethodNames = preferredMethod !== null
                ? [preferredMethod.name]
                : Object.keys(registeredMethods);
            let successCount: number = 0;
            let failureCount: number = 0;

            if (registeredMethodNames.length == 0)
                return reject(new LogicError("There are currently no Registered Reconnection Methods to be setup!"));

            const runSetup = async ( name: string ) => {

                const method = registeredMethods[name];

                if (verboseLogging) {
                    if ( !useVerboseDataLogging() || name != registeredMethodNames[0] )
                        console.log();

                    console.log(
                        "Beginning Setup for the",
                        "'" + colorizeOutput(method.toString(), ForegroundColor.YELLOW) + "'",
                        "Reconnection Method..."
                    );
                }

                method.setup(signal).then(
                    (result) => {

                        if (result) {
                            verboseLog(() => [
                                "Setup for the",
                                "'" + colorizeOutput(method.toString(), ForegroundColor.YELLOW) + "'",
                                "Reconnection Method Completed Successfully!"
                            ]);
                            successCount++;
                        }
                        else {
                            // console.error(
                            //     "Setup for the",
                            //     "'" + colorizeOutput(method.toString(), ForegroundColor.YELLOW) + "'",
                            //     "Reconnection Method",
                            //     colorizeOutput('Failed', ForegroundColor.RED),
                            //     "and will not be used."
                            // );
                            removeMethod(name);
                            failureCount++;
                        }

                    },
                    (error) => {

                        console.error(error);
                        failureCount++;

                    }
                ).finally(() => {

                    const nextName = registeredMethodNames.shift();
    
                    if (nextName) {
                        setTimeout(() => runSetup(nextName), 1500);
                    }
                    else {
                        const result = (Object.keys(registeredMethods).length > 0);
    
                        if (!result)
                            console.error(NO_REGISTERED_METHODS_ERROR_MESSAGE);
    
                        console.log(
                            "Finished Running all Reconnection Method Setup Procedures!",
                            `(${colorizeOutput(successCount, ForegroundColor.GREEN)} Successful`,
                            `/ ${colorizeOutput(failureCount, ForegroundColor.RED)} Failed)`
                        );
                        registeredMethodSetupRan = true;
                        resolve(result);
                    }

                });


            };

            console.log("Beginning Reconnection Method Setup...");
            runSetup(registeredMethodNames.shift()!);

        }
    );
    /**
     * {@link ReconnectionMethod.run Run} the {@link ReconnectionMethod.ReconnectionFunction Reconnection Function}
     * of the {@link currentMethod Current Reconnection Method} responsible
     * for re-establishing the WDS Bridge.
     * 
     * @param signal    An {@link AbortSignal} used to terminate the operation early.
     * 
     * @returns         A promise that resolves to `true` if the WDS Bridge was successfully
     *                  re-established using the {@link currentMethod Current Reconnection Method}
     *                  or `false` if it was not.
     * 
     *                  If the specified `signal` is used to {@link AbortController.prototype.abort abort}
     *                  the operation early, the promise will resolve to the value `'aborted'`.
     * 
     * @throws          Rejects with a {@link LogicError} if no {@link ReconnectionMethod}s
     *                  have been successfully {@link registerMethod registered} yet.
     * 
     * @throws          Rejects with an {@link UnrecoverableError} if a {@link ReconnectionMethod.SetupError SetupError}
     *                  is thrown by the {@link ReconnectionMethod.run `run()`} method of the
     *                  {@link currentMethod Current Reconnection Method}
     *                  and there are no alternative {@link registerMethod Registered}
     *                  {@link ReconnectionMethod Reconnection Methods} available to
     *                  re-establish the WDS Bridge.
     * 
     * @apistatus       ⚠️ *Not Recommended*
     */
    export async function runCurrentMethod ( signal: AbortSignal ): ReconnectionMethod.ReconnectionOperationResult {

        assertMethodsAreRegistered();

        return currentMethod!
            .run(signal)
            .catch((error) => {

                if (error instanceof ReconnectionMethod.SetupError) {
                    removeMethod(currentMethod!.name);

                    if (registeredMethodCount == 0)
                        throw new UnrecoverableError(NO_REGISTERED_METHODS_ERROR_MESSAGE, { cause: error });
                }

                throw error;

            })
            .finally(() => {

                /* 
                 * We should always update the `lastCheckInTime` after running
                 * the Current Reconnection Method to ensure that long-lasting calls
                 * when attempting to re-establish the WDS Bridge are not falsely
                 * interpreted as gaps in coverage during the next call to `getBridgeStatus()`.
                 */
                ProgramStats.updateLastCheckInTime();

            });

    }

}
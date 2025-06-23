/**
 * The Primary Entry Point for the WDS Bridge Watchdog Program.
 */

import {
    ConsoleUtils,
    verifyOnlyOneProgramInstanceExists,
    NumberUtils,
    getDisplayTimestampString,
    ConfirmationPrompt,
    RuntimeError,
    UnrecoverableError
} from "./utils.js";
import {
    PROGRAM_TITLE,
    RUNFILE_NAME,
    UnitDenominatedNumber,
    isTtyConsole,
    SUBMILLISECOND_PING,
    DateType,
    AbortableAsyncOperation,
    dayjs,
    setVerboseLogging,
    verboseLogging,
    verboseDataLogging,
    verboseLog,
    verboseDataLog,
    useVerboseDataLogging,
    setVerboseDataLogging,
    useVerboseLogging,
    PROGRAM_VERSION,
    PROGRAM_BUILD_TIME
} from './common.js';
import {
    pingBridgeRouter,
    BridgeStatus,
    checkBridgeStatus,
    pingResults,
    singleDigitPingResults,
    totalPingCount
} from './router-status.js';
import { ProgramStats, RuntimeVariables, KeypressHandlers } from "./runtime.js";
import { fetchEnvironmentVariable, getProgramVars, getRawEnvVars, retrieveRegisteredVars } from "./env.js";
import { BridgeVerificationResult, verifyBridgeStatus, verifyingBridgeStatus } from "./reconnect-bridge/index.js";
import { ReconnectionMethod } from "./reconnect-bridge/api/index.js";
import { loadReconnectionMethodModules } from "./reconnect-bridge/routers/index.js";

import { existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { inspect } from 'node:util';

import ForegroundColor = ConsoleUtils.ForegroundColor;
import BrightForegroundColor = ConsoleUtils.BrightForegroundColor;
import colorizeOutput = ConsoleUtils.colorizeOutput;
import colorizePositiveOutput = ConsoleUtils.colorizePositiveOutput;
import highlightPositiveOutput = ConsoleUtils.highlightPositiveOutput;
import toggleCursor = ConsoleUtils.toggleCursor;
import formatNum = NumberUtils.format;
import { BaseProgramConfiguration, ensureConfigFileExists, getProgramConfig } from "./config.js";


/* Main Program Types */

/**
 * A class that encapsulates all of the properties
 * and methods associated with managing the *Main Program Verification Interval*
 * used to periodically {@link ensureBridgeIsUp Check-In with the WDS Bridge}.
 * 
 * After construction, the Verification Interval
 * will need to be manually started using {@link start `start()`}. E.g.,
 * ```ts
 * const interval = new VerificationIntervalManager();
 * interval.start();
 * ```
 * 
 * The Verification Interval can be started and stopped
 * using the {@link start `start()`}, {@link stop `stop()`},
 * and {@link restart `restart()`} methods. To *temporarily*
 * pause the Verification Interval without fully stopping it,
 * use the {@link pause `pause()`} and {@link resume `resume()`} methods.
 * ```ts
 * const interval = new VerificationIntervalManager();
 * 
 * interval.start();
 * interval.pause();
 * interval.resume();
 * interval.restart();
 * interval.pause();
 * interval.resume();
 * interval.stop();
 * ```
 */
class VerificationIntervalManager {

    /* Instance Properties */

    /**
     * When the Verification Interval is *active*,
     * contains the {@link NodeJS.Timeout Timeout ID}
     * used to {@link clearInterval clear the Verification Interval}.
     * 
     * When the Verification Interval is *inactive*,
     * this field will contain a `null` value.
     * 
     * In general, this field is populated by the {@link start `start()`}
     * method and cleared by the {@link stop `stop()`} method.
     * 
     * @see {@link start `start()`}
     * @see {@link stop `stop()`}
     */
    #_interval: NodeJS.Timeout | null = null;
    /**
     * Indicates whether or not the Verification Interval
     * is currently {@link pause Paused}.
     * 
     * When `true`, the Verification Interval will still technically
     * be running, but will be *skipped* until the interval
     * has been {@link resume Resumed}.
     * 
     * This is the backing field used by the getter method
     * for the {@link paused `paused`} property.
     * 
     * This field will automatically be set to `false`
     * when {@link start `start()`ing} a new Verification Interval.
     * 
     * @see {@link paused `paused`}
     * @see {@link pause `pause()`}
     * @see {@link resume `resume()`}
     */
    #_paused: boolean = false;

    /**
     * Indicates whether or not the Verification Interval
     * is currently *active*, or if it has been {@link start Started}
     * but not yet {@link stop Stopped}.
     * 
     * Whether or not the Verification Interval is currently
     * {@link paused Paused} has no effect on this value.
     * 
     * @see {@link start `start()`}
     * @see {@link stop `stop()`}
     */
    get active (): boolean {

        return (this.#_interval !== null);

    }
    /**
     * Indicates whether or not the Verification Interval
     * is currently {@link pause Paused}.
     * 
     * When `true`, the Verification Interval will still technically
     * be running, but will be *skipped* until the interval
     * has been {@link resume Resumed}.
     * 
     * This value will always be `false` when the Verification Interval
     * is currently {@link active *Inactive*}.
     * 
     * @see {@link pause `pause()`}
     * @see {@link resume `resume()`}
     */
    get paused (): boolean {

        return (this.active && this.#_paused);

    }


    /* Class Constructor */

    /**
     * Construct a new `VerificationIntervalManager`.
     * 
     * After construction, the Verification Interval
     * will need to be manually started using {@link start `start()`}. E.g.,
     * ```ts
     * const interval = new VerificationIntervalManager();
     * interval.start();
     * ```
     */
    constructor () {};


    /* Instance Methods */

    /**
     * Start a new Verification Interval.
     * 
     * The inverse of this operation is {@link stop `stop()`}. E.g.,
     * ```ts
     * const interval = new VerificationIntervalManager();
     * interval.start().stop();
     * // `interval` will be in the same state here as it
     * // was prior to calling `start()`.
     * ```
     * 
     * If the Verification Interval is {@link active already running},
     * this method will have no effect.
     * 
     * @returns     `this` object.
     * 
     * @see {@link pause `pause()`}
     * @see {@link stop `stop()`}
     */
    start (): VerificationIntervalManager {

        if (this.#_interval === null) {
            this.#_interval = setInterval(
                async () => {
        
                    if (!this.#_paused)
                        if ( (await ensureBridgeIsUp()) == true )
                            printProgramStats();
        
                },
                RuntimeVariables.currentVerificationInterval
            );

            if (this.#_paused)
                this.#_paused = false;

            verboseDataLog("The Program Verification Interval has been Started!");
        }
    
        return this;

    };

    /**
     * Temporarily Pause the Current Verification Interval.
     * 
     * While the Verification Interval will still technically
     * be running, the Verification Function will be *skipped*
     * until the interval has been {@link resume Resumed}.
     * 
     * The inverse of this operation is {@link resume `resume()`}. E.g.,
     * ```ts
     * const interval = new VerificationIntervalManager();
     * interval.start().pause().resume();
     * // `interval` is in the same state here as it
     * // was prior to calling `pause()`.
     * ```
     * 
     * If the Verification Interval is {@link active not currently running}
     * or has already been `pause()`-ed, this method will have no effect.
     * 
     * @returns     `this` object.
     * 
     * @see {@link start `start()`}
     * @see {@link pause `pause()`}
     */
    pause (): VerificationIntervalManager {
    
        if ( this.#_interval !== null && !this.#_paused ) {
            this.#_paused = true;
            verboseDataLog("The Program Verification Interval has been Paused!");
        }

        return this;
    
    };
    /**
     * Resume the Current Verification Interval after
     * being previously {@link pause Paused}.
     * 
     * The inverse of this operation is {@link pause `pause()`}. E.g.,
     * ```ts
     * const interval = new VerificationIntervalManager();
     * interval.start().pause().resume();
     * // `interval` is in the same state here as it
     * // was prior to calling `pause()`.
     * ```
     * 
     * If the Verification Interval is {@link active not currently running},
     * was never previously {@link pause `pause()`-ed},
     * or has already been `resume()`-ed, this method will have no effect.
     * 
     * @returns     `this` object.
     */
    resume (): VerificationIntervalManager {

        if ( this.#_interval !== null && this.#_paused ) {
            this.#_paused = false;
            verboseDataLog("The Program Verification Interval has been Resumed!");
        }

        return this;
    
    };

    /**
     * Stop the Current Verification Interval.
     * 
     * The inverse of this operation is {@link start `start()`}. E.g.,
     * ```ts
     * const interval = new VerificationIntervalManager();
     * interval.start().stop();
     * // `interval` is in the same state here as it
     * // was prior to calling `start()`.
     * ```
     * 
     * If the Verification Interval is {@link active not currently running}
     * or has already been `stop()`-ed, this method will have no effect.
     * 
     * @returns     `this` object.
     * 
     * @see {@link pause `pause()`}
     * @see {@link stop `stop()`}
     */
    stop (): VerificationIntervalManager {

        if (this.#_interval !== null) {
            clearInterval(this.#_interval);
            this.#_interval = null;
            verboseDataLog("The Program Verification Interval has been Cleared!");
        }

        return this;
    
    };
    /**
     * Restart the Verification Interval after the designated `delay`.
     * 
     * This method is functionally equivalent to
     * {@link stop `stop()`-ing} and {@link start `start()`-ing}
     * the Verification Interval again after the specified `delay`.
     * 
     * If the Verification Interval is {@link active not currently running},
     * it will simply be {@link start `start()`-ed} after the specified `delay`.
     * 
     * @param delay     The amount of time to wait after {@link stop `stop()`-ing}
     *                  the Verification Interval before {@link start `start()`-ing}
     *                  it again in *milliseconds*.
     *  
     *                  If `0` or a negative number, the Verification Interval
     *                  will be restarted immediately.
     * 
     * @returns         A promise that resolves to `this` object
     *                  after the Verification Interval has been successfully started,
     *                  which will generally be after roughly `delay` milliseconds.
     */
    restart ( delay: number = 0 ): Promise<VerificationIntervalManager> {

        return new Promise((resolve) => {

            if (this.active)
                this.stop();
            
            setTimeout(() => {

                this.start.bind(this);
                resolve(this);

            }, Math.max(delay, 0));

        });
    
    };

};


/* Main Program Constants */

/**
 * The number of {@link recentUnknownKeyCount consecutive unrecognized keys} caught by
 * the {@link keypressHandler `keypressHandler()`} before
 * displaying a hint message.
 * 
 * @invariant   Must be a *positive number*.
 * 
 * @see {@link recentUnknownKeyCount `recentUnknownKeyCount`}
 */
const UNKNOWN_KEY_COUNT_HINT_THRESHOLD = 10;
/**
 * Defines the amount of time in *milliseconds* that the
 * {@link ensureBridgeRouterIsUp `ensureBridgeRouterIsUp()`}
 * should wait between attempts to check in with
 * the Bridge Router after the previous failed attempt.
 * 
 * @invariant   Must be a *positive number*.
 * 
 * @see {@link ensureBridgeRouterIsUp `ensureBridgeRouterIsUp()`}
 */
const BRIDGE_ROUTER_CHECKIN_RETRY_INTERVAL_DURATION = 2500;
/**
 * Defines the maximum number of attempts that should be
 * made by the {@link ensureBridgeRouterIsUp `ensureBridgeRouterIsUp()`}
 * function to check in with the Bridge Router before giving up
 * and throwing an {@link UnrecoverableError}.
 * 
 * @invariant   Must be a *postive, nonzero number*.
 * 
 * @see {@link ensureBridgeRouterIsUp `ensureBridgeRouterIsUp()`}
 */
const MAX_BRIDGE_ROUTER_CHECKIN_RETRY_ATTEMPTS = 25;

/**
 * The TTY Console Instructions printed using
 * the {@link printInstructions `printInstructions()`} function.
 * 
 * Note that the generated string may contain
 * [Virtual Terminal Formatting Codes](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences#text-formatting)
 * intended for consoles with color support.
 */
const TTY_INSTRUCTIONS = (() => {

    let instructions = "\n";
        instructions += "+---------------------------------------------+\n";
        instructions += "|    [C]heck Bridge Status                    |\n";
        instructions += "|    [I]nstructions                           |\n";
        instructions += "|    [R]untime Variables                      |\n";
        instructions += "|    [P]rogram Configuration                  |\n";
        instructions += "|       [+ SHIFT]: Edit Configuration         |\n";
        instructions += "|    [S]tatistics                             |\n";
        instructions += "|       [+ SHIFT]: Detailed Statistics        |\n";
        instructions += "|    [V]erbose Logging                        |\n";
        instructions += "|       [+ SHIFT]: Toggle Data Logging        |\n";
        instructions += "|                                             |\n";
        instructions += "|    Verification Interval:                   |\n";
        instructions += "|       [Up]: Increase / [Down]: Decrease     |\n";
        instructions += "|          [+ SHIFT]: Use Larger Step Size    |\n";
        instructions += "|       [SHIFT + R]: Reset to Default         |\n";
        instructions += "|                                             |\n";
        instructions += "|    [CTRL + C]: Shutdown Service             |\n";
        instructions += "+---------------------------------------------+";

    return colorizeOutput(
        instructions,
        new ConsoleUtils.ColorMatchMap([
            [/(\[.+?\])|(\+-+\+)|(^\|)|(\|$)/gm, ForegroundColor.YELLOW],
            ['Shutdown Service', ForegroundColor.RED],
            ['Verification Interval:', BrightForegroundColor.BLACK]
        ])
    );

})();


/* Main Program Global Variables */

/**
 * A {@link DateType timestamp} marking the time the program was first launched.
 * 
 * @see {@link programStartTime `programStartTime`}
 */
var programLaunchTime: DateType = dayjs();
/**
 * A {@link DateType timestamp} marking the starting time of the program.
 * 
 * Until the program has finished starting up, this variable
 * will contain the timestamp of when the program
 * was {@link programLaunchTime launched}.
 * 
 * @see {@link programLaunchTime `programLaunchTime`}
 */
var programStartTime: DateType = programLaunchTime;
/**
 * A {@link DateType timestamp} marking the late time
 * a *Runtime Update* was printed to the console.
 * 
 * Until the program has finished starting up, this variable
 * will contain the timestamp of when the program
 * was {@link programLaunchTime launched}.
 */
var lastRuntimeUpdateTime: DateType = programLaunchTime;

/**
 * The {@link AbortController} used to clean up and abort the WDS Bridge Verification
 * and Reconnection Process early if the WDS Bridge Watchdog is shutdown
 * while the WDS Bridge is actively being checked or restored.
 * 
 * The `abortController` should only be {@link AbortController.prototype.abort `abort`ed}
 * by the Program Exit Handlers, though the {@link AbortController.prototype.signal `signal`}
 * should be passed to any supported asychronous functions and handlers.
 */
var abortController: AbortController = new AbortController();
/**
 * Indicates if the WDS Bridge was {@link ensureBridgeIsUp recently reconnected}.
 * 
 * When `true`, the next call to {@link ensureBridgeIsUp `ensureBridgeIsUp()`}
 * will be skipped to prevent immediately re-checking the status
 * of the recently-established WDS Bridge.
 * 
 * @see {@link ensureBridgeIsUp `ensureBridgeIsUp()`}
 */
var recentlyReconnected: boolean = false;
/**
 * The number of consecutive times an unrecognized key was caught
 * by the {@link keypressHandler `keypressHandler()`}.
 * 
 * When the `recentUnknownKeyCount` reaches the {@link UNKNOWN_KEY_COUNT_HINT_THRESHOLD},
 * a help message will be printed to the console.
 * 
 * The `recentUnknownKeyCount` will be reset anytime a recognized key
 * is caught by the `keypressHandler()`.
 * 
 * @see {@link keypressHandler `keypressHandler()`}
 */
var recentUnknownKeyCount: number = 0;
var shuttingDown: boolean = false;

/**
 * The {@link VerificationIntervalManager} responsible for managing
 * the *Main Program Verification Interval* used to periodically
 * {@link ensureBridgeIsUp Check-In with the WDS Bridge}.
 */
var verificationInterval: VerificationIntervalManager = new VerificationIntervalManager();
/**
 * Whenever the {@link ensureBridgeIsUp `ensureBridgeIsUp()`} function is used to check
 * the current status of and re-establish the WDS Bridge, this variable
 * will contain the promise returned by the function.
 * 
 * If the {@link ensureBridgeIsUp `ensureBridgeIsUp()`} function is called more than once
 * before the original request has completed, this variable will contain the promise corresponding
 * to the original request, which is the same promise that will be returned for all of the
 * subsequent requests to `ensureBridgeIsUp()`. 
 * 
 * When the {@link ensureBridgeIsUp `ensureBridgeIsUp()`} function is not actively
 * being used to check the status of or attempt to re-establish the WDS Bridge,
 * this variable will be set to `null`.
 */
var bridgeVerificationPromise: AbortableAsyncOperation<boolean> | null = null;


/* Helper Functions */

/**
 * Check if the WDS Bridge is currently active, automatically
 * attempting to re-establish it if it is not.
 * 
 * If the Main or Bridge Router could not be contacted, the function
 * will make a second attempt to contact the router. If the Main or Bridge router
 * still could not be contacted after two attempts, the function will make one more
 * attempt to verify the status of the WDS Bridge before considering the WDS Bridge
 * or Bridge Router itself to be down and begin taking the appropriate actions in response.
 * 
 * If the WDS Bridge is down, the function will repeatedly attempt to re-establish
 * the WDS Bridge between the Main Router and Bridge Router at increasingly-longer intervals
 * until the WDS Bridge has been successfully restored. To abandon the WDS Bridge Status Verification
 * or Re-Connection Process early, use the {@link abortController `abortController`} to
 * {@link AbortController.prototype.abort `abort()`} the process.
 * 
 * @param printStatus   Indicates whether or not status messages should be printed
 *                      to the console regarding the status of the WDS Bridge.
 * 
 * @returns             A promise that will be resolved to a `boolean` value in any of the following situations:
 *                      - `true`: The WDS Bridge is already active.
 *                      - `true`: The WDS Bridge was successfully restored.
 *                      - `false`: The WDS Bridge could not be verified or re-established.
 *                      - `'aborted'`: The {@link abortController `abortController`} was used to
 *                        {@link AbortController.prototype.abort `abort()`}
 *                        the WDS Bridge Status Verification or Re-Connection Process early.
 * 
 *                      If the function is called more than once before the original request has completed,
 *                      the promise corresponding to the original request will be returned for all of the
 *                      subsequent requests. 
 */
function ensureBridgeIsUp ( printStatus?: boolean ): AbortableAsyncOperation<boolean> {

    bridgeVerificationPromise = new Promise<boolean | 'aborted'>(async (resolve, reject) => {
        
        let bridgeStatus: BridgeStatus = 'unknown';
        const originalCheckinTime = dayjs();
        
        if (bridgeVerificationPromise) {
            return resolve(bridgeVerificationPromise);
        }
        if (recentlyReconnected) {
            verboseLog("Recently Reconnected! Skipping Current Interval...");
            recentlyReconnected = false;
            return resolve(true);
        }
        if (abortController.signal.aborted)
            return resolve('aborted');

        if (verboseLogging || printStatus) {
            console.log();
            console.log(`Checking WDS Bridge Status at ${getDisplayTimestampString(undefined, true)}...`);
        }
    
        if ( (bridgeStatus = (await checkBridgeStatus(false))) != 'up' ) {
            if (abortController.signal.aborted)
                return resolve('aborted');

            console.log();
            console.log(
                'Main Browser Ping',
                colorizeOutput('Failed', ForegroundColor.YELLOW),
                'at',
                getDisplayTimestampString(null, true) + '!',
                'Retrying...'
            );
    
            if ( (bridgeStatus = (await checkBridgeStatus(false))) != 'up' ) {
                let reVerificationTimeout = 2500;
    
                console.log(
                    `${bridgeStatus == 'down' ? 'WDS Bridge' : 'Bridge Router'} appears to be`,
                    `${colorizeOutput('DOWN', bridgeStatus == 'down' ? ForegroundColor.RED : ForegroundColor.YELLOW)}`,
                    `as of ${getDisplayTimestampString(null, true)}`,
                    `Verifying Bridge Status in ${colorizeOutput(`${reVerificationTimeout}ms`)}...`
                );
                
                toggleCursor(false);
                
                verificationInterval.pause();
                setTimeout(
                    () => verifyBridgeStatus(abortController.signal, printStatus).then(
                        (resultDetails) => {
                
                            if ( [BridgeVerificationResult.RECONNECTION_FAILED, BridgeVerificationResult.BRIDGE_ROUTER_OFFLINE].includes(resultDetails.result) ) {
                                console.error(
                                    resultDetails.result == BridgeVerificationResult.RECONNECTION_FAILED
                                        ? "Failed to Re-Establish the WDS Bridge"
                                        : "The Bridge Router is Currently Offline"
                                );
                                return resolve(false);
                            }

                            recentlyReconnected = (resultDetails.result == BridgeVerificationResult.RECONNECTED || printStatus === true);
                            
                            if (resultDetails.result != BridgeVerificationResult.ABORTED) {
                                if (resultDetails.result == BridgeVerificationResult.RECONNECTED)
                                    ProgramStats.addBridgeOutageRecord(originalCheckinTime, null, resultDetails.cause);
                                else if (resultDetails.result == BridgeVerificationResult.BRIDGE_UP)
                                    ProgramStats.updateProgramStats('failedPingCount');
                                
                                verificationInterval.resume();
                                resolve(true);
                            }
                            else {
                                resolve('aborted');
                            }
                
                        },
                        (error) => {
        
                            console.error("Unable to Reconnect WDS Bridge:", error);
                            cleanup();
                            resolve(false);
        
                        }
                    ).finally(
                        () => toggleCursor(true)
                    ),
                    reVerificationTimeout
                );
            }
            else {
                ProgramStats.updateProgramStats('failedPingCount');
                return resolve(true);
            }
        }
        else {
            if (verboseLogging || printStatus)
                console.log(`WDS Bridge is ${colorizeOutput('UP!', BrightForegroundColor.GREEN)}`);
            
            return resolve(true);
        }

    }).then(
        (result) => {

            bridgeVerificationPromise = null;
            return result;

        }
    );

    return bridgeVerificationPromise;

};
/**
 * Ensure that the *Bridge Router* is currently active
 * and reachable, waiting to resolve until it is.
 * 
 * If the Bridge Router is down, the function will wait for the Bridge Router
 * to come back online before the returned promise will resolve. To abandon the
 * operation early, use the {@link abortController `abortController`} to
 * {@link AbortController.prototype.abort `abort()`} the process.
 * 
 * @returns     A promise that resolves to `true` once the Bridge Router
 *              has become active and reachable.
 * 
 *              If the Bridge Router could not be successfully reached
 *              after {@link MAX_BRIDGE_ROUTER_CHECKIN_RETRY_ATTEMPTS},
 *              the returned promise will resolve to `false`.
 * 
 *              If the {@link abortController `abortController`} is used to
 *              {@link AbortController.prototype.abort `abort()`} the operation early,
 *              the returned promise will resolve to the value `'aborted'`.
 */
const ensureBridgeRouterIsUp = (): AbortableAsyncOperation<boolean> => new Promise((resolve, reject) => {

    let processing: boolean = false;
    const interval = setInterval(async () => {

        if (processing)
            return;

        processing = true;
        const result = await pingBridgeRouter();

        if (result.success || abortController.signal.aborted) {
            clearInterval(interval);
            resolve(!result.success && abortController.signal.aborted ? 'aborted' : result.success);
        }

        processing = false;

    }, BRIDGE_ROUTER_CHECKIN_RETRY_INTERVAL_DURATION);

});


/* Event & Interval Handling */
// Input Handlers

/**
 * The {@link KeypressHandlers.KeypressEventHandler `keypress` Event Handler}
 * responsible for handling *Standard Keypress Events*. 
 */
const keypressHandler: KeypressHandlers.KeypressEventHandler = (str, key): void => {

    const printDuration = ( duration: number ) => `${colorizeOutput(`${duration.toLocaleString()}ms`)} (${colorizeOutput(`${(duration / 1000).toFixed(2)} seconds`)})`;

    // Handle standard keybindings
    if (!ConfirmationPrompt.pendingPrompt) {
        switch (key.name) {
            case 'v': {
                if (!key.shift)
                    setVerboseLogging('toggle');
                else
                    setVerboseDataLogging('toggle');

                break;
            }
            case 'r': {
                if (!key.shift) {
                    printRuntimeVariables();
                }

                break;
            }
            case 'p': {
                if (!key.shift) {
                    console.log();
                    printProgramTitle();
                    printProgramConfiguration();
                }

                break;
            }
        }

        if (verifyingBridgeStatus) {
            verboseLog(`Keypress occurred while verifying the WDS Bridge Status. Ignoring!`);
            return;
        }

        switch (key.name) {
            case 's': {
                printProgramStats(true, key.shift);
                break;
            }
            case 'i': {
                recentUnknownKeyCount = 0;
                printInstructions();
                break;
            }
            case 'c': {
                ensureBridgeIsUp(true);
                break;
            }
            case 'r': {
                if (key.shift) {
                    const originalInterval = RuntimeVariables.currentVerificationInterval;
    
                    RuntimeVariables.changeVerificationInterval('default');
    
                    if (originalInterval != RuntimeVariables.currentVerificationInterval) {
                        console.log(
                            `The Program Verification Interval Duration was reset from`,
                            `${printDuration(originalInterval)} back to ${printDuration(RuntimeVariables.currentVerificationInterval)}.`
                        );
                        verificationInterval.restart();
                    }
                }

                break;
            }
            case 'p': {
                if (key.shift) {
                    getProgramConfig()
                        .then((programConfig) => programConfig.setup)
                        .then(verificationInterval.resume);
                }

                break;
            }

            case 'up':
            case 'down': {
                const originalInterval = RuntimeVariables.currentVerificationInterval;

                RuntimeVariables.changeVerificationInterval(
                    (key.name == 'up' ? 'increase' : 'decrease'),
                    (!key.shift ? RuntimeVariables.VERIFICATION_INTERVAL_STEP_SIZE : (RuntimeVariables.VERIFICATION_INTERVAL_STEP_SIZE * 2))
                );
                console.log();

                if (originalInterval != RuntimeVariables.currentVerificationInterval) {
                    console.log(
                        `${key.name == 'up' ? 'Increasing' : 'Decreasing'} the Program Verification Interval Duration from`,
                        `${printDuration(originalInterval)} to ${printDuration(RuntimeVariables.currentVerificationInterval)}.`
                    );
                    verificationInterval.restart();
                }
                else {
                    console.log(
                        `The ${(RuntimeVariables.currentVerificationInterval + RuntimeVariables.VERIFICATION_INTERVAL_STEP_SIZE) > RuntimeVariables.MAX_VERIFICATION_INTERVAL ? 'Maximum' : 'Minimum'}`,
                        `Verification Interval Value of ${colorizeOutput(`${RuntimeVariables.MAX_VERIFICATION_INTERVAL}ms`)} has been reached!`
                    );
                }

                break;
            }

            default: {
                recentUnknownKeyCount++;

                if (recentUnknownKeyCount == UNKNOWN_KEY_COUNT_HINT_THRESHOLD)
                    console.log(
                        colorizeOutput("Unsure of what keys to press? Use", ForegroundColor.BLACK),
                        colorizeOutput('[i]', ForegroundColor.YELLOW),
                        colorizeOutput("to print the Program Instructions.", ForegroundColor.BLACK)
                    );

                break;
            }
        }
    }

};
/**
 * The handler function invoked whenever a *signal*
 * is emitted on the {@link process}.
 * 
 * @param signal    The signal that was emitted.
 *                  
 *                  Interpreted as `SIGINT` if omitted.
 */
const signalHandler = ( signal?: NodeJS.Signals ): void => {

    if (useVerboseLogging()) {
        console.log();
        console.log(
            "Caught Signal:",
            colorizeOutput(signal ?? 'SIGINT', ForegroundColor.YELLOW)
        );
    }

    cleanup();

};
/**
 * The handler function invoked whenever an *Unhandled Exception*
 * or *Unhandled Promise Rejection* occur.
 * 
 * Regular program execution will **not** continue
 * following the invocation of this handler.
 * 
 * @param error     The uncaught {@link Error}.
 * 
 * @param origin    Indicates whether an *Unhandled Exception* or
 *                  *Unhandled Promise Rejection* occurred.
 */
const unhandledExceptionHandler = ( error: Error, origin: NodeJS.UncaughtExceptionOrigin ): never => {

    console.error();
    console.error(colorizeOutput(
        origin == 'unhandledRejection' ? 'Unhandled Rejection:' : "Uncaught Exception:",
        ForegroundColor.RED
    ));
    console.error(error);
    
    if (useVerboseLogging()) {
        console.log();

        if (origin == 'uncaughtException')
            console.log(
                colorizeOutput("Did you forget to enclose the operation in a", BrightForegroundColor.BLACK),
                colorizeOutput("try...catch...", ForegroundColor.YELLOW),
                colorizeOutput("block or add a", BrightForegroundColor.BLACK),
                colorizeOutput(".catch()", ForegroundColor.YELLOW),
                colorizeOutput("handler for a promise in a module?", BrightForegroundColor.BLACK)
            );
        else
            console.log(
                colorizeOutput("Did you forget to add a", BrightForegroundColor.BLACK),
                colorizeOutput(".catch()", ForegroundColor.YELLOW),
                colorizeOutput("handler for a promise?", BrightForegroundColor.BLACK)
            );
    }

    process.exit(1);

};


// Cleanup/Exit Handlers

/**
 * The Cleanup/Exit Handler responsible for performing the required cleanup
 * that should always be performed before exiting the program.
 * 
 * In contrast to {@link cleanup `cleanup()`}, this handler can only
 * perform *synchronous* tasks and *cannot* prevent the program from exiting.
 * 
 * @param printMainIntroMessages    Indicates whether or not a message should be printed
 *                                  when the cleanup handler is first started.
 * 
 * @see {@link cleanup `cleanup()`}
 */
function cleanupAtExit (): void {

    shuttingDown = true;

    if ( existsSync(`./${RUNFILE_NAME}`) ) {
        if ( readFileSync(`./${RUNFILE_NAME}`).toString() == process.pid.toString() ) {
            verboseLog(`Removing Program Runfile '${RUNFILE_NAME}'...`);
            rmSync(`./${RUNFILE_NAME}`);
        }
        else {
            verboseLog(`Program Runfile '${RUNFILE_NAME}' found but belongs to a different process.`);
        }
    }
    else {
        console.log(
            colorizeOutput(`Program Runfile '${RUNFILE_NAME}'`, BrightForegroundColor.BLACK),
            colorizeOutput('Not Found!', ForegroundColor.YELLOW)
        );
    }

    printProgramStats(true, true);
    console.log();
    console.log(
        PROGRAM_TITLE,
        colorizeOutput('Shutdown', ForegroundColor.RED),
        'at',
        colorizeOutput(getDisplayTimestampString(undefined, true)) + '.'
    );

    // Re-Enable the Cursor
    toggleCursor(true);

}
/**
 * The Cleanup/Exit Handler responsible for performing the cleanup tasks
 * necessary to free the main task loop and allow the program to exit gracefully.
 * 
 * In contrast to {@link cleanupAtExit `cleanupAtExit()`}, this handler can perform
 * *asynchronous* tasks and *can* prevent the program from exiting.
 * 
 * @param synchronous   Indicates whether or not the Cleanup/Exit Handler should be
 *                      limited to *Synchronous Operations* only.
 * 
 * @returns             A promise that resolves when all cleanup tasks have been
 *                      completed and the program is ready to {@link cleanupAtExit shutdown gracefully}.
 * 
 * @see {@link cleanupAtExit `cleanupAtExit()`}
 */
async function cleanup ( synchronous: boolean = false ): Promise<void> {

    const MAX_ABORT_SIGNAL_PROPAGATION_TIME = (RuntimeVariables.currentVerificationInterval + 10000);
    const ABORT_SIGNAL_PROPAGATION_INTERVAL_DURATION = 500;

    if ( !shuttingDown ) {
        console.log();
        console.log( colorizeOutput(`Shutting Down the ${PROGRAM_TITLE}...`, ForegroundColor.YELLOW) );

        shuttingDown = true;
        verificationInterval.stop();
    
        if (isTtyConsole) {
            KeypressHandlers.emitKeypressEvents(false);
            KeypressHandlers.removeRegisteredKeypressHandlers();
            process.stdin.pause();
        }
    
        if (!synchronous) {
            if (verifyingBridgeStatus) {
                console.log("Currently Checking or Attempting to Repair the WDS Bridge. Aborting!");
                console.log(colorizeOutput(
                    `Pending Operations have ${formatNum(MAX_ABORT_SIGNAL_PROPAGATION_TIME)}ms to gracefully shutdown.`
                        + " Press CTRL + C to immediately force shutdown the program.",
                    new Map<string | RegExp, ConsoleUtils.Color>([
                        [/.+/s, BrightForegroundColor.BLACK],
                        [/[\d,]+ms/, ForegroundColor.CYAN],
                        ["CTRL + C", ForegroundColor.YELLOW]
                    ]),
                    BrightForegroundColor.BLACK
                ))
                abortController.abort();
                await new Promise<void>((resolve) => {
        
                    let propagationTime = 0;
                    let interval = setInterval(() => {
        
                        propagationTime += ABORT_SIGNAL_PROPAGATION_INTERVAL_DURATION;

                        if (!verifyingBridgeStatus || propagationTime > MAX_ABORT_SIGNAL_PROPAGATION_TIME) {
                            if (verifyingBridgeStatus) {
                                console.error(
                                    `Failed to gracefully terminate the ${PROGRAM_TITLE} after`,
                                    colorizeOutput(`${MAX_ABORT_SIGNAL_PROPAGATION_TIME}ms`) + '!',
                                    "Exiting..."
                                );
                                process.abort();
                            }
                            
                            clearInterval(interval);
                            resolve();
                        }
        
                    }, ABORT_SIGNAL_PROPAGATION_INTERVAL_DURATION);
        
                });
            }
        }
        
        if ( !abortController.signal.aborted )
            abortController.abort();
    
        // cleanupAtExit();
    }

}


/* Console Output Helper Functions */

/**
 * Print the Interactive TTY Console Instructions.
 * 
 * If {@link isTtyConsole `isTtyTerminal`} is `false`,
 * this function has no effect when called.
 */
function printInstructions (): void {

    if (isTtyConsole)
        console.log(TTY_INSTRUCTIONS);
    
}
/**
 * Print the {@link programStats Program Statistics} to the console.
 * 
 * By default, this function will throttle calls to only periodically
 * print the program statistics to the console. To override the default
 * behavior, pass `true` for the `force` parameter.
 * 
 * @param force             Force the program statistics to be printed
 *                          to the console regardless of when they were last printed.
 * 
 * @param detailedStats     Indicates whether or not detailed statistics should be included
 *                          in the printed statistics, which include:
 *                          
 *                          - Ping Data Transferred
 *                          - Ping Result Records
 *                          - Weighted Ping Result List
 *                          - Bridge Outage Record List
 *                          - Coverage Gap Record List
 * 
 *                          If omitted, defaults to `true` when
 *                          {@link useVerboseDataLogging Verbose Data Logging} is enabled
 *                          or `false` when it is not.
 */
function printProgramStats ( force: boolean = false, detailedStats?: boolean ): void {

    const DATA_SIZE_DENOMINATORS = ['B', 'KB', 'MB', 'GB'];
    const DATA_SIZE_STEP = 1024;

    const currentTimestamp = dayjs();

    const getRelativeDataSize = ( size: number ): UnitDenominatedNumber => {

        let relativeSize = size;
        let denominator = 'B';

        for (denominator of DATA_SIZE_DENOMINATORS) {
            if ( denominator == 'B' && relativeSize < DATA_SIZE_STEP )
                break;
            else if ( denominator != 'B' && (relativeSize /= DATA_SIZE_STEP) < DATA_SIZE_STEP )
                break;
        }

        return `${relativeSize.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${denominator}` as UnitDenominatedNumber;

    };
    const getEnlapsedTime = ( startTime?: DateType ) => (
        ( currentTimestamp.unix() - (startTime ?? currentTimestamp).unix() )
    );

    const getTotalProgramTime = () => getEnlapsedTime(programStartTime);
    const getTotalActiveTime = () => {

        let totalTime: number = getTotalProgramTime();

        for (const outage of ProgramStats.bridgeOutageRecords)
            totalTime -= outage.duration;
        for (const gap of ProgramStats.coverageGapRecords)
            totalTime -= gap.duration;

        return totalTime;

    };
    const getTotalDownTime = () => {

        let totalTime: number = 0;

        for (const record of ProgramStats.bridgeOutageRecords)
            totalTime += record.duration;

        return totalTime;

    };
    const getTotalCoverageGapTime = () => {

        let totalTime: number = 0;

        for (const gap of ProgramStats.coverageGapRecords)
            totalTime += gap.duration;

        return totalTime;

    };
    
    const getRelativeDisplayDuration = ( duration: number ): string => dayjs.duration(duration, 'seconds').humanize();

    if (detailedStats === undefined)
        detailedStats = useVerboseDataLogging();

    let secondsEnlapsed = getEnlapsedTime(programStartTime);
    let minutesEnlapsed = secondsEnlapsed / 60;
    let timeSinceLastRuntimeUpdate = getEnlapsedTime(lastRuntimeUpdateTime) / 60;
    let printRuntimeUpdate: boolean = (() => {
        
        /**
         * Ensures that Program Statistics are automatically printed at the
         * following intervals, depending on how long the Program has been running:
         * 
         * - Running for < 5 Minutes: Once per Minute
         * - Running for < 30 Minutes: Once every 5 Minutes
         * - Running for < 1 Hour: Once every 10 Minutes
         * - Running for < 6 Hours: Once every 30 Minutes
         * - Running for < 1 Day: Once per Hour
         * - Running for > 1 Day: Once every 6 Hours
         */

        if (minutesEnlapsed < 6)
            return (timeSinceLastRuntimeUpdate >= 1);

        else if (minutesEnlapsed < 31)
            return (timeSinceLastRuntimeUpdate >= 5);

        else if (minutesEnlapsed < 61)
            return (timeSinceLastRuntimeUpdate >= 10);

        else if (minutesEnlapsed < 361)
            return (timeSinceLastRuntimeUpdate >= 30);

        else if (minutesEnlapsed < 1441)
            return (timeSinceLastRuntimeUpdate >= 60);

        else
            return (timeSinceLastRuntimeUpdate >= 360);

    })();

    if (printRuntimeUpdate || force) {
        let runtimeMessage = (
            `The ${PROGRAM_TITLE} ${!shuttingDown ? 'has been' : 'was'} active for `
                + colorizePositiveOutput(
                    getRelativeDisplayDuration(secondsEnlapsed),
                    // `${displayEnlapsedTime} ${getPlural(timeUnits, parseInt(displayEnlapsedTime))}`,
                    BrightForegroundColor.CYAN
                )
        );

        let totalCheckinCount = (ProgramStats.stats.bridgeUpCount + ProgramStats.stats.bridgeDownCount + ProgramStats.stats.bridgeRouterDownCount);
        let singleDigitPingPercentage = (
            totalPingCount > 0
                ? formatNum((singleDigitPingResults / totalPingCount) * 100)
                : '100'
        );
        let weightedAvgPingMembers: string[] = [];
        
        const getDisplayEnlapsedTime = ( enlapsedTime: number, fractionDigits: number = 0 ) => formatNum(
            Math.floor(enlapsedTime),
            undefined,
            fractionDigits
        );
        const getDisplayPingTime = ( pingTime: number | typeof SUBMILLISECOND_PING | null ): string => (
            typeof pingTime == 'number'
                ? getDisplayEnlapsedTime(pingTime ?? 0)
                : pingTime
        ) + 'ms'; 

        console.log();
        console.log(`${runtimeMessage}:`);
        
        // Check-Ins
        (() => {

            let checkinUptime = totalCheckinCount > 0
                ? formatNum((ProgramStats.stats.bridgeUpCount / totalCheckinCount) * 100)
                : '100.00';

            console.log();
            console.log(
                `\tCheck-Ins:       ${highlightPositiveOutput(formatNum(ProgramStats.stats.bridgeUpCount), BrightForegroundColor.GREEN)} Bridge UP /`,
                `${highlightPositiveOutput(formatNum(ProgramStats.stats.failedPingCount), ForegroundColor.YELLOW)} Failed /`
            );
            console.log(
                `\t                 ${highlightPositiveOutput(formatNum(ProgramStats.stats.bridgeDownCount), BrightForegroundColor.RED)} Bridge DOWN /`,
                `${highlightPositiveOutput(formatNum(ProgramStats.stats.bridgeRouterDownCount), BrightForegroundColor.YELLOW)} Bridge Router DOWN`
            );
            console.log(
                `\t                 ${highlightPositiveOutput(`${checkinUptime}%`, ForegroundColor.CYAN)} Success Rate`
            );

        })();

        // Uptime
        (() => {

            let activeUptime = (
                getTotalProgramTime() > 0 && getTotalActiveTime() > 0
                    ? formatNum((getTotalActiveTime() / (getTotalProgramTime() - getTotalCoverageGapTime())) * 100)
                    : '100'
            );
            let coverage = (
                getTotalProgramTime() > 0 && getTotalCoverageGapTime() > 0
                    ? formatNum(100 - ((getTotalCoverageGapTime() / getTotalProgramTime()) * 100))
                    : '100'
            );

            console.log();
            console.log(
                `\tUptime:          ${highlightPositiveOutput(getRelativeDisplayDuration(getTotalActiveTime()), BrightForegroundColor.GREEN)} UP /`,
                `${highlightPositiveOutput(getRelativeDisplayDuration(getTotalDownTime()), ForegroundColor.RED)} DOWN /`
            );
            console.log(
                `\t                 ${highlightPositiveOutput(getRelativeDisplayDuration(getTotalCoverageGapTime()), ForegroundColor.YELLOW)} Service Suspended`,
            );
            console.log(
                `\t                 ${colorizeOutput(`${activeUptime}%`, ForegroundColor.CYAN)} Uptime /`,
                `${colorizeOutput(`${coverage}%`, BrightForegroundColor.CYAN)} Coverage`
            );

        })();
        
        // Ping Stats
        (() => {

            let weightedAvgPing: number | typeof SUBMILLISECOND_PING = 0;
            
            if (totalPingCount > 0) {
                let weightedPingTotal = 0;
                let weightedPingCount = 0;
                let pingResultCountTotal = 0;
    
                for (let pingResult in pingResults)
                    pingResultCountTotal += pingResults[pingResult];
    
                let avgPingResultCount = (pingResultCountTotal / Object.keys(pingResults).length);
    
                for (let pingResult in pingResults) {
                    if (pingResults[pingResult] >= avgPingResultCount) {
                        weightedPingTotal += pingResult != SUBMILLISECOND_PING
                            ? (parseInt(pingResult) * pingResults[pingResult])
                            : 0;
                        weightedPingCount += pingResults[pingResult];
                        weightedAvgPingMembers.push(pingResult);
                    }
                }
    
                let weightedAvg = (weightedPingTotal / weightedPingCount);
                weightedAvgPing = (weightedAvg > 0 ? weightedAvg : SUBMILLISECOND_PING);
            }

            console.log();
            console.log(
                `\tPing Stats:      ${highlightPositiveOutput(getDisplayPingTime(ProgramStats.stats.minPing ?? 0), BrightForegroundColor.GREEN)} Min /`,
                `${highlightPositiveOutput(getDisplayPingTime(ProgramStats.stats.avgPing ?? 0), ForegroundColor.CYAN)} Avg /`,
                `${highlightPositiveOutput(getDisplayPingTime(weightedAvgPing ?? 0), BrightForegroundColor.CYAN)} Weighted Avg /`,
                `${highlightPositiveOutput(getDisplayPingTime(ProgramStats.stats.maxPing ?? 0), ForegroundColor.YELLOW)} Max`
    
            );
            console.log(
                `\t                 ${highlightPositiveOutput(`${singleDigitPingPercentage}%`)} < 10ms`,
            );

            if (detailedStats) {
                console.log(
                    `\t                 ${highlightPositiveOutput(getRelativeDataSize((ProgramStats.stats).totalPingBytesSent + ProgramStats.stats.totalPingBytesReceived), BrightForegroundColor.MAGENTA)} Transferred`,
                    `(${highlightPositiveOutput(getRelativeDataSize(ProgramStats.stats.totalPingBytesSent), ForegroundColor.GREEN)} Sent /`,
                    `${highlightPositiveOutput(getRelativeDataSize(ProgramStats.stats.totalPingBytesReceived), ForegroundColor.CYAN)} Received)`,
                );
            }

        })();

        // Reconnections
        (() => {

            let totalSuccessfulReconnectionCount = ProgramStats.stats.successfulReconnectionCount;
            let totalFailedReconnectionCount = ProgramStats.stats.failedReconnectionCount;
            let totalReconnectionCount = (totalSuccessfulReconnectionCount + totalFailedReconnectionCount);
    
            let succesfulReconnectionsStat = totalSuccessfulReconnectionCount.toString();
            let failedReconnectionsStat = totalFailedReconnectionCount.toString();
    
            let reconnectionMethodStats = (() => {
    
                let stats = {
                    success: "",
                    failed: ""
                };
    
                if (Object.keys(ReconnectionMethod.registeredMethods).length > 0) {
                    for (const name in ReconnectionMethod.registeredMethods) {
                        const method = ReconnectionMethod.registeredMethods[name];
    
                        if (method.successfulAttempts > 0) {
                            if (stats.success.length > 0)
                                stats.success += ' / ';
    
                            stats.success += `${colorizeOutput(method.successfulAttempts, ForegroundColor.CYAN)} ${method.description}`;
                        }
                        if (method.failedAttempts > 0) {
                            if (stats.failed.length > 0)
                                stats.failed += ' / ';
    
                            stats.failed += `${colorizeOutput(method.failedAttempts, BrightForegroundColor.BLUE)} ${method.description}`;
                        }
                    }
                }
    
                return stats;
    
            })();
    
            if (totalSuccessfulReconnectionCount > 0)
                succesfulReconnectionsStat += ` (${((totalSuccessfulReconnectionCount / totalReconnectionCount) * 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}%)`;
            if (totalFailedReconnectionCount > 0)
                failedReconnectionsStat += ` (${((totalFailedReconnectionCount / totalReconnectionCount) * 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}%)`;
    
            console.log();
    
            if (reconnectionMethodStats.success.length > 0) {
                console.log(
                    `\tReconnections:   ${highlightPositiveOutput(succesfulReconnectionsStat, BrightForegroundColor.GREEN)} Successful`,
                    `(${reconnectionMethodStats.success})`
                );
            }
            else {
                console.log(
                    `\tReconnections:   ${highlightPositiveOutput(succesfulReconnectionsStat, BrightForegroundColor.GREEN)} Successful`
                );
            }
    
            if (reconnectionMethodStats.failed.length > 0) {
                console.log(
                    `\t                 ${highlightPositiveOutput(failedReconnectionsStat, BrightForegroundColor.RED)} Failed`,
                    `(${reconnectionMethodStats.failed})`
                );
            }
            else {
                console.log(
                    `\t                 ${highlightPositiveOutput(failedReconnectionsStat, BrightForegroundColor.RED)} Failed`
                );
            }

        })();
        
        // Detailed Stats
        if (detailedStats) {
            console.log();
            console.log("Extended Ping Stats:", pingResults);

            console.log();
            console.log("Weighted Average Ping Results:", weightedAvgPingMembers);
    
            console.log();
            console.log("WDS Bridge Outage Records:", ProgramStats.bridgeOutageRecords);
    
            console.log();
            console.log("Watchdog Service Coverage Gap Records:", ProgramStats.coverageGapRecords);
        }

        if (printRuntimeUpdate)
            lastRuntimeUpdateTime = currentTimestamp;
    }

}
function printProgramTitle (): void {

    console.log( colorizeOutput(PROGRAM_TITLE, ForegroundColor.CYAN) );
    console.log(
        "Version:",
        (
            PROGRAM_VERSION
                ? colorizeOutput(PROGRAM_VERSION, BrightForegroundColor.YELLOW)
                : colorizeOutput('Unknown', BrightForegroundColor.BLACK)
        )
    );
    console.log(
        "Build Time:",
        (
            PROGRAM_BUILD_TIME
                ? getDisplayTimestampString(PROGRAM_BUILD_TIME, true)
                : colorizeOutput('Unknown', BrightForegroundColor.BLACK)
        )
    );

}
async function printProgramConfiguration (): Promise<void> {

    const config = await getProgramConfig();

    console.log();
    console.log("Program Configuration:", config.getConfigVars(true));
    // console.log("Environment Variables:", getRawEnvVars(true));

    console.log();
    console.log("Program Variables:", config.getProgramVars(true));
    // console.log("Program Variables:", getProgramVars(true));

}
/**
 * Print the Runtime Program Variables to the console.
 * 
 * Example Output:
 * ```console
 * Current Runtime Program Variables: {
 *    verboseLogging: {
 *       enabled: true,
 *       dataLogging: false
 *    },
 *    verificationInterval: '15,000ms (15.00 seconds)'
 * }
 * ```
 */
function printRuntimeVariables (  ): void {

    const printDuration = ( duration: number ) => `${colorizeOutput(`${duration.toLocaleString()}ms`)} (${colorizeOutput(`${(duration / 1000).toFixed(2)} seconds`)})`;

    console.log();
    console.log("Current Runtime Program Variables: {");
    console.log(
        "  lastCheckIn:",
        (
            ProgramStats.lastCheckInTime
                ? colorizeOutput(dayjs.duration(ProgramStats.lastCheckInTime.diff()).humanize(true))
                    + ` (${getDisplayTimestampString(ProgramStats.lastCheckInTime, true)})`
                : colorizeOutput('Never', BrightForegroundColor.BLACK)
        )
    );
    console.log("  reconnectionMethod: {");
    console.log(
        "    preferredMethod:",
        (
            ReconnectionMethod.preferredMethod
                ? colorizeOutput(ReconnectionMethod.preferredMethod.name, ForegroundColor.CYAN)
                : colorizeOutput('None', BrightForegroundColor.BLACK)
        )
    );
    console.log(
        "    currentMethod:",
        (
            ReconnectionMethod.currentMethod
                ? colorizeOutput(ReconnectionMethod.currentMethod.name, ForegroundColor.CYAN)
                : colorizeOutput('None', BrightForegroundColor.BLACK)
        )
    );
    console.log("  }");
    console.log("  verboseLogging: {");
    console.log("    enabled:", verboseLogging);
    console.log("    dataLogging:", verboseDataLogging);
    console.log("  }");
    console.log("  verificationInterval:", printDuration(RuntimeVariables.currentVerificationInterval));
    console.log("}");

}


/* Main Program */

(async () => {

    try {
        process.title = PROGRAM_TITLE;
        printProgramTitle();
        console.log();

        // Hide the Cursor
        toggleCursor(false);

        process.on('SIGINT', signalHandler);
        process.on('SIGTERM', signalHandler);
        process.on('SIGHUP', signalHandler);
        process.on('exit', cleanupAtExit);
        process.on('uncaughtException', unhandledExceptionHandler);
        inspect.defaultOptions.depth = 6;

        // We need to enable these settings prior to calling `retrieveRegisteredVars()`
        // in order for Verbose Logs and Data Logs to work properly during startup.
        if (fetchEnvironmentVariable('ENABLE_VERBOSE_LOGGING') !== undefined)
            setVerboseLogging(true);
        if (fetchEnvironmentVariable('ENABLE_VERBOSE_DATA_LOGGING') !== undefined)
            setVerboseDataLogging(true);

        console.log(`Starting the ${PROGRAM_TITLE}...`);

        if (isTtyConsole) {
            KeypressHandlers.emitKeypressEvents(true);
            // process.stdin.resume();
        }

        await verifyOnlyOneProgramInstanceExists(false);
        await loadReconnectionMethodModules();
        retrieveRegisteredVars();

        // const programVars = getProgramVars();
        // const programConfig = await getProgramConfig();
        await ensureConfigFileExists(abortController.signal);
        const programVars = (await getProgramConfig()).getProgramVars();
        
        if (useVerboseDataLogging()) {
            await printProgramConfiguration();
            printRuntimeVariables();
            console.log();
        }
        
        // console.log();
        // console.log("Using the following Router IP Addresses:");
        // console.log({ Main: programVars.mainRouter.ip, Bridge: programVars.bridgeRouter.ip });
        
        // if (useVerboseDataLogging()) {
        //     console.log();
        //     console.log("Using the following Environment Variable Configuration:", getRawEnvVars(true));
    
        //     console.log();
        //     console.log("Using the following Configuration Settings:", getProgramVars(true));
    
        //     printRuntimeVariables();
        //     console.log();
        // }

        if (programVars.verificationInterval) {
            RuntimeVariables.setDefaultVerificationInterval(programVars.verificationInterval, true);
        }
        if (programVars.reconnectionMethods.deferSetup) {
            verboseLog(colorizeOutput(
                "Deferring Reconnection Method Setup!",
                ForegroundColor.MAGENTA
            ));
        }
        if (programVars.reconnectionMethods.method != 'auto') {
            if (ReconnectionMethod.methodExists(programVars.reconnectionMethods.method)) {
                ReconnectionMethod.setMethodPreference(programVars.reconnectionMethods.method);
                ReconnectionMethod.setCurrentMethod(programVars.reconnectionMethods.method);
            }
            else {
                throw new RuntimeError(`No Reconnection Method with a name of '${programVars.reconnectionMethods.method}' has been registered!`);
            }
        }
    
        const startupSuccess = (
            // await verifyOnlyOneProgramInstanceExists(false).then(
            //     () => true,
            //     () => false
            // )
            await ensureBridgeRouterIsUp() === true
            && (programVars.reconnectionMethods.deferSetup || await ReconnectionMethod.setupRegisteredMethods(abortController.signal))
            && await ensureBridgeIsUp() === true
        );
        
        if (!startupSuccess)
            throw null;
    
        verificationInterval.start();
        programStartTime = dayjs();
        lastRuntimeUpdateTime = programStartTime;
    
        if (isTtyConsole)
            KeypressHandlers.registerKeypressHandler('primary', keypressHandler);
        
        console.log();
        console.log(
            PROGRAM_TITLE,
            colorizeOutput('Started', ForegroundColor.GREEN),
            'at',
            colorizeOutput(getDisplayTimestampString(programStartTime, true)) + '!'
        );
        printInstructions();

        // Re-Enable the Cursor
        toggleCursor(true);
    }
    catch (error) {
        console.error();
        console.error(
            colorizeOutput('Failed to Start', ForegroundColor.RED),
            "the",
            PROGRAM_TITLE + (error instanceof Error ? `:` : '!')
        );

        if (error instanceof Error)
            console.error(error);

        await cleanup();
    }

})();
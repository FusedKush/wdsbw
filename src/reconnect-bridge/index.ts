/**
 * Contains all of the functionality used to attempt to re-establish
 * the WDS Bridge between the Main Router and the Bridge Router.
 */
declare module "./index.js";

import {
    UnrecoverableError,
    ConsoleUtils,
    verifyOnlyOneProgramInstanceExists
} from "../utils.js";
import { ProgramStats } from "../runtime.js";
import { BridgeRouter, getDisplayTimestampString, ReconnectionMethod } from "./api/index.js";
import { verboseLog, verboseLogging } from "../common.js";
import { getProgramVars } from "../env.js";
import { BridgeStatus, checkBridgeStatus } from "../router-status.js";

import colorizeOutput = ConsoleUtils.colorizeOutput;
import ForegroundColor = ConsoleUtils.ForegroundColor;
import BrightForegroundColor = ConsoleUtils.BrightForegroundColor;

// Import & Register the Bridge Router Reconnection Methods
import "./routers/index.js";


/**
 * An enumeration defining the various results
 * of {@link verifyBridgeStatus Verifying the WDS Bridge Status}.
 * 
 * @see {@link verifyBridgeStatus `verifyBridgeStatus()`}
 * @see {@link BridgeVerificationResultDetails}
 */
export enum BridgeVerificationResult {

    /** The WDS Bridge already appears to be UP and did not need to be re-established. */
    BRIDGE_UP = 'bridge-up',
    /** The WDS Bridge was DOWN and was successfully re-established. */
    RECONNECTED = 'reconnected',
    /**
     * The Main Router is currently unavailable and cannot be reached.
     * 
     * Because it is generally not possible to realiably determine if the Main Router
     * is actually DOWN or if the Bridge Router is just unable to reach the Main Router
     * based on pings and network scans performed by the Bridge Router, this result
     * does **not** necessarily indicate that the Main Router is or is not currently DOWN,
     * but rather, the *possibility* that it may be DOWN.
     */
    MAIN_ROUTER_UNAVAILABLE = 'main-router-unavailable',
    /** The Bridge Router appears to be DOWN and cannot be reached. */
    BRIDGE_ROUTER_OFFLINE = 'bridge-router-offline',
    /** The WDS Bridge is DOWN and could not be re-established. */
    RECONNECTION_FAILED = 'reconnection-failed',
    /** The WDS Bridge is DOWN and is currently being re-established. */
    IN_PROGRESS = 'in-progress',
    /** The operation was {@link AbortController.prototype.abort aborted}. */
    ABORTED = 'aborted'

};
/**
 * An interface containing the result returned by
 * the {@link verifyBridgeStatus `verifyBridgeStatus()`} function.
 * 
 * @see {@link verifyBridgeStatus `verifyBridgeStatus()`}
 * @see {@link BridgeVerificationResult}
 */
export interface BridgeVerificationResultDetails {

    /** The {@link BridgeVerificationResult result} of Verifying the WDS Bridge Status. */
    result: BridgeVerificationResult;
    /**
     * The {@link ProgramStats.BridgeOutageRecord.OutageCause cause} of the WDS Bridge Outage.
     * 
     * This field is only guaranteed to be present when {@link result} is set to
     * {@link BridgeVerificationResult.RECONNECTED `RECONNECTED`}.
     */
    cause?: ProgramStats.BridgeOutageRecord.OutageCause;

}

/**
 * Indicates whether or not the WDS Bridge is currently
 * being checked or restored.
 * 
 * When this variable is `true`, any calls to {@link verifyBridgeStatus `verifyBridgeStatus()`}
 * will return a promise that is immediately resolved.
 * 
 * @see {@link verifyBridgeStatus `verifyBridgeStatus()`}
 */
export var verifyingBridgeStatus: boolean = false;

/**
 * Check if the WDS Bridge is currently active, automatically attempting to restore
 * the bridge between the Main Router and the Bridge Router if it is not.
 * 
 * If the WDS Bridge could not be restored on the first attempt, the function
 * will continue to attempt to re-establish the WDS Bridge until the bridge
 * has been successfully restored or the operation is {@link AbortController.prototype.abort aborted}.
 * 
 * @param signal        The {@link AbortSignal} of an {@link AbortController} that can
 *                      be used to abort the verification and reconnection process early.
 * 
 * @param printStatus   Indicates whether or not messages about the status of the
 *                      verification and reconnection process should be printed to the console.
 * 
 * @returns             A promise that resolves to a {@link BridgeVerificationResultDetails} object.
 */
export async function verifyBridgeStatus ( signal: AbortSignal, printStatus: boolean = false ): Promise<BridgeVerificationResultDetails> {

    const programVars = getProgramVars();

    // /**
    //  * The current {@link SpecificConnectionMethod ConnectionMethod} being used
    //  * to re-establish the WDS Bridge between the Main Router and the Bridge Router.
    //  */
    // let currentConnectionMethod: ReconnectionMethod | undefined = (() => {

    //     if (ReconnectionMethod.currentMethod === null)
    //         return;

    //     if (programVars.reconnectionMethods.method in ReconnectionMethod.registeredMethods)
    //         return ReconnectionMethod.registeredMethods[programVars.reconnectionMethods.method];

    //     return ReconnectionMethod.currentMethod;

    // })();

    /**
     * The current amount of time to wait before attempting to
     * re-established the WDS Bridge after the last failed attempt.
     * 
     * This value starts at the {@link getProgramVars.retries.minRetryTime} for the first retry attempt
     * and is doubled with every failed attempt up to the {@link getProgramVars.retries.maxRetryTime}.
     */
    let retryTime = programVars.retries.minRetryTime;
    /**
     * The total number of times we have attempted to re-establish
     * the WDS Bridge following the first failed attempt.
     */
    let totalRetries = 0;
    /**
     * The number of times we have attempted to re-establish
     * the WDS Bridge using the {@link currentConnectionMethod}.
     * 
     * This value will be reset back to `0` whenever the
     * {@link currentConnectionMethod} is changed.
     */
    let methodRetries = 0;
    /**
     * Indicates whether or not the WDS Bridge is currently online.
     * 
     * More specifically, this variable tracks whether or not the
     * WDS Bridge was online as of the *last call* to {@link checkBridgeStatus `bridgeIsDown()`}.
     */
    var currentBridgeStatus: BridgeStatus = 'unknown';
    let previousBridgeStatus: BridgeStatus | null = null;

    return new Promise<BridgeVerificationResult> (async (resolve, reject) => {
            
        function registerRetryTimeout () {

            previousBridgeStatus = currentBridgeStatus;
            setTimeout(verify, retryTime);
            retryTime = Math.min(retryTime * 2, programVars.retries.maxRetryTime);
    
        }
        function selectiveLog ( message: string = '' ): void {
    
            const printLog = (
                verboseLogging
                || (
                    printStatus
                    && currentBridgeStatus != previousBridgeStatus
                )
            );

            if (printLog)
                console.log(message);
    
        }
        async function verify (): Promise<void> {

            if (signal.aborted)
                return resolve(BridgeVerificationResult.ABORTED);

            currentBridgeStatus = await checkBridgeStatus(true);

            if (currentBridgeStatus != 'up') {
                if ( !verboseLogging && !printStatus )
                    console.log();

                if (currentBridgeStatus == 'down') {
                    console.log(
                        `WDS Bridge is ${colorizeOutput('DOWN', BrightForegroundColor.RED)}`,
                        `as of ${getDisplayTimestampString(null, true)}` + '!'
                    );
                    console.log("Attempting to Re-Establish the WDS Bridge...");
                    
                    await ReconnectionMethod.runCurrentMethod(signal).then(
                        (result) => result,
                        (error) => {

                            console.error(error);
                            return (error instanceof ReconnectionMethod.MainRouterError ? null : false);

                        }
                    ).then(async (result) => {

                        if (result) {
                            currentBridgeStatus = await checkBridgeStatus();

                            if (currentBridgeStatus == 'up') {
                                console.log();
                                console.log(
                                    colorizeOutput(
                                        "Successfully Re-Established the WDS Bridge at "
                                            + colorizeOutput(getDisplayTimestampString(), null, ForegroundColor.CYAN)
                                            + "!",
                                        ForegroundColor.CYAN
                                    )
                                );
                                verboseLog();
    
                                currentBridgeStatus = 'up';
                                return resolve(result ? BridgeVerificationResult.RECONNECTED : BridgeVerificationResult.BRIDGE_UP);
                            }
                            else {
                                return resolve(
                                    currentBridgeStatus == 'down'
                                        ? BridgeVerificationResult.RECONNECTION_FAILED
                                        : BridgeVerificationResult.BRIDGE_ROUTER_OFFLINE
                                );
                            }
                        }
                        else {
                            if (signal.aborted)
                                return resolve(BridgeVerificationResult.ABORTED);

                            let errorMessage = (result === false)
                                ? `${colorizeOutput('Failed', ForegroundColor.RED)} to Re-Establish the WDS Bridge`
                                    + ` using the '${colorizeOutput(ReconnectionMethod.currentMethod!.description)}' Reconnection Method!`
                                : `${colorizeOutput('Unable', ForegroundColor.YELLOW)} to Re-Establish the WDS Bridge`
                                    + ` using the '${colorizeOutput(ReconnectionMethod.currentMethod!.description)}' Reconnection Method!`
                                    + " The Main Router may or may not currently be DOWN.";

                            if (totalRetries <= programVars.retries.maxFailureRetries)
                                errorMessage += ` Retrying in ${colorizeOutput(`${retryTime}ms`)}...`;

                            console.error(errorMessage);
                            totalRetries++;
                            methodRetries++;
                            
                            if (methodRetries > programVars.retries.maxMethodRetries && ReconnectionMethod.registeredMethodCount > 1) {
                                console.error(
                                    "Failed to Re-Establish the WDS Bridge using the",
                                    `'${colorizeOutput(ReconnectionMethod.currentMethod?.description)}' Reconnection Method`,
                                    `after ${colorizeOutput(programVars.retries.maxMethodRetries)} attempts.`
                                );
                                ReconnectionMethod.cycleMethod();
                                methodRetries = 0;
                            }
                                
                            if (totalRetries <= programVars.retries.maxFailureRetries) {
                                registerRetryTimeout();
                            }
                            else {
                                console.error(`Failed to Re-Establish the WDS Bridge" after ${programVars.retries.maxFailureRetries} attempts. Aborting!`);
                                return resolve(
                                    result === false
                                        ? BridgeVerificationResult.RECONNECTION_FAILED
                                        : BridgeVerificationResult.MAIN_ROUTER_UNAVAILABLE
                                );
                                // return reject(
                                //     new UnrecoverableError(`Failed to Re-Establish the WDS Bridge after ${programVars.maxFailureRetries} attempts. Aborting!`)
                                // );
                            }
                        }

                    });

                }
                else {
                    if (signal.aborted)
                        return resolve(BridgeVerificationResult.ABORTED);

                    console.log(
                        `Bridge Router is ${colorizeOutput('DOWN!', BrightForegroundColor.YELLOW)}`,
                        `as of ${getDisplayTimestampString(null, true)}` + '!'
                    );
                    console.log("Waiting for Bridge Router to come back online...");
                    registerRetryTimeout();
                }
            }
            else {
                if (totalRetries == 0)
                    ProgramStats.updateProgramStats('failedPingCount');

                console.log(colorizeOutput(
                    "The WDS Bridge is Back UP as of "
                        + colorizeOutput(getDisplayTimestampString(), null, ForegroundColor.CYAN)
                        + "!",
                    ForegroundColor.CYAN
                ));
                // selectiveLog(`WDS Bridge is ${colorizeOutput('UP!', BrightForegroundColor.GREEN)}`);
                resolve(BridgeVerificationResult.BRIDGE_UP);
            }
        }

        // TODO: This check may be irrelevant...
        if ( !ReconnectionMethod.currentMethod )
            return reject( new Error("No Reconnection Methods have been registered yet!") );
        
        if (verifyingBridgeStatus || signal.aborted) {
            if (verifyingBridgeStatus)
                console.log(
                    colorizeOutput(`The WDS Bridge is already being checked or repaired!`, ForegroundColor.YELLOW)
                );

            return resolve(BridgeVerificationResult[!signal.aborted ? 'IN_PROGRESS' : 'ABORTED']);
        }

        await verifyOnlyOneProgramInstanceExists(true);

        verifyingBridgeStatus = true;
        verify();

    }).then((result) => ({
        cause: result == BridgeVerificationResult.RECONNECTED
            ? (previousBridgeStatus != 'unknown' ? 'wds-bridge' : 'bridge-router') as ProgramStats.BridgeOutageRecord.OutageCause
            : undefined,
        result: result
    })).finally(() => {

        verifyingBridgeStatus = false;

    });

}
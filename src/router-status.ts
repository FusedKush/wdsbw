/**
 * Contains all of the functionality associated with checking the
 * Current Status of the Main & Bridge Routers and the WDS Bridge.
 */
declare module "./router-status.js";

import {
    ConsoleUtils,
    ObjectUtils,
    getDisplayTimestampString
} from "./utils.js";
import ForegroundColor = ConsoleUtils.ForegroundColor;
import BrightForegroundColor = ConsoleUtils.BrightForegroundColor;
import colorizeOutput = ConsoleUtils.colorizeOutput;

import {
    type IpAddress,
    SUBMILLISECOND_PING,
    DateType,
    verboseDataLog,
    verboseLog,
    verboseLogging,
    dayjs,
    useVerboseDataLogging
} from "./common.js";
import {
    ProgramStats
} from "./runtime.js";
import { type ProgramVariables, getProgramVars } from "./env.js";

import { execSync } from 'node:child_process';


/* Types */

/**
 * A union representing the different states of the WDS Bridge
 * that may be returned by the {@link checkBridgeStatus `getBridgeStatus()`}.
 * 
 * - `'up'`:        Indicates that the WDS Bridge is currently active.
 * 
 * - `'down'`:      Indicates that the WDS Bridge is currently down or that the
 *                  the *Main Router* cannot be contacted for some other reason.
 * 
 * - `'unknown'`:   Indicates that the *Bridge Router* cannot be contacted and
 *                  the current status of the WDS Bridge cannot be determined.
 */
export type BridgeStatus = 'up' | 'down' | 'unknown';

/**
 * An object type representing a record of past {@link ping `ping()`} results.
 * 
 * Each *key* corresponds to a ping result in *milliseconds* (or the string `'<1'`)
 * while the *value* corresponds to the number of times the ping result has occurred.
 * 
 * @example
 * {
 *      '<1': 1,
 *      '1': 2,
 *      '2': 8,
 *      '3': 5,
 *      '6': 2,
 *      '14': 1
 * }
 * 
 * @see {@link pingResults `pingResults`}
 * @see {@link ping `ping()`}
 */
export type PingResultRecord = ObjectUtils.MakeOptional<{
    [PingResult in number | typeof SUBMILLISECOND_PING]: number;
}, typeof SUBMILLISECOND_PING>;

/**
 * An interface representing the result of a *Ping Request*
 * made using the {@link pingMainRouter `pingMainRouter()`}
 * and {@link pingBridgeRouter `pingBridgeRouter()`} functions.
 * 
 * {@link pingMainRouter `pingMainRouter()`}
 * {@link pingBridgeRouter `pingBridgeRouter()`}
 */
export interface PingResult {

    /**
     * Indicates whether the Ping Request *succeeded* or *failed*.
     * 
     * This property may be `true` even if {@link pingFailed} is `true`,
     * which indicates that the Ping Request still ultimately succeeded after
     * retrying the failed `ping` one or more times.
     * 
     * If `pingFailed` is `true` and `success` is `false`, then the Ping Request
     * could not be completed due to all of the `ping` requests that were made having failed.
     * 
     * @see {@link pingFailed}
     */
    success: boolean;
    /**
     * Indicates whether or not one or more `ping`s sent
     * to the Main or Bridge Router *failed* and had to be retried.
     * 
     * This property may be `true` even if {@link success} is `true`,
     * which indicates that the Ping Request still ultimately succeeded after
     * retrying the failed `ping` one or more times.
     * 
     * If `pingFailed` is `true` and `success` is `false`, then the Ping Request
     * could not be completed due to all of the `ping` requests that were made having failed.
     * 
     * @see {@link success}
     */
    pingFailed: boolean;
    /**
     * The amount of time the `ping` took in *milliseconds*.
     * 
     * This value only includes the time the *successful* `ping` request took, and
     * does **not** include the time spent on any *failed* `ping` requests.
     * 
     * If the `ping` took _less than **1ms**_, this property will
     * be set to {@link SUBMILLISECOND_PING}.
     */
    pingTime: number | typeof SUBMILLISECOND_PING;

};


/* Constants */

/**
 * The maximum number of attempts to retry
 * a *Failed {@link ping Ping Request}* before giving up.
 * 
 * @see {@link ping `ping()`}
 */
const MAX_FAILURE_RETRIES = 3;
/**
 * The amount of time in *milliseconds* to wait after
 * a *Failed {@link ping Ping Request}* before retrying.
 * 
 * @see {@link ping `ping()`}
 */
const PING_RETRY_COOLDOWN = 1000;


/* Global Variables */

/**
 * The running sum of all of the {@link pingResults Ping Requests}
 * that have been made during the runtime of the program.
 * 
 * @see {@link pingResults `pingResults`}
 * @see {@link totalPingCount `totalPingCount`}
 */
var totalPingResultSum: number = 0;

/**
 * Contains the results of pinging the *Main Router*.
 * 
 * Ping results do **not** include pings to the *Bridge Router*.
 * 
 * @see {@link PingResultRecord}
 */
export var pingResults: PingResultRecord = {};

/**
 * The total number of {@link pingResults Ping Results}
 * made to the *Main Router* that were *less than* `10ms` in duration.
 * 
 * @see {@link pingResults `pingResults`}
 */
export var singleDigitPingResults: number = 0;
/**
 * The total number of {@link pingResults Ping Requests}
 * that have been made to the *Main Router*.
 * 
 * @see {@link pingResults `pingResults`}
 */
export var totalPingCount: number = 0;


/* Functions */

/**
 * Ping the router with the specified `address` and check whether or not
 * we receive a valid response from it.
 * 
 * If the specified `address` equals that of the {@link ProgramVariables.mainRouter.ip `mainRouterIp`}
 * Program Variable, several {@link ProgramStats.Statistics Program Statistics} related to Ping Times
 * and data transferred will be automatically updated.
 * 
 * @param address   The {@link IpAddress Local IP Address} of the router to ping.
 * 
 * @returns         `true` if the designated `address` was successfully pinged
 *                  or `false` if it was not.
 */
const ping = ( address: IpAddress ): Promise<PingResult> => new Promise((resolve, reject) => {
        
    let attempts = 0;
    let result: PingResult = {
        success: false,
        pingFailed: false,
        pingTime: 0
    };

    const pingAddress = () => {

        let cmdOutput = "";
        let pingResult: boolean | null = false;

        attempts++;
    
        try {
            cmdOutput = execSync(`ping ${address} -n 1`, {  }).toString();
        }
        catch (error) {
            cmdOutput = error.stdout.toString()
        }
    
        let pingTimeResult: RegExpMatchArray | null = cmdOutput.match(/Reply from [\d\.]+: bytes=\d+ time=?(\d+|\<1)ms TTL=\d+/);
        ProgramStats.updateProgramStats('totalPingBytesSent');
        
        if (pingTimeResult) {
            ProgramStats.updateProgramStats('totalPingBytesReceived');
    
            if (address == getProgramVars().mainRouter.ip) {
                let pingTime = pingTimeResult[1] != '<1'
                    ? parseInt(pingTimeResult[1])
                    : SUBMILLISECOND_PING as typeof SUBMILLISECOND_PING;
                let avgPingTime = 0;
        
                if (typeof pingTime == 'number') {
                    totalPingResultSum += pingTime;
        
                    if (pingTime < 10)
                        singleDigitPingResults++;
                }
        
                if (typeof pingResults[pingTime] == 'undefined')
                    pingResults[pingTime] = 1;
                else
                    pingResults[pingTime]++;
        
                totalPingCount++;
                avgPingTime = (totalPingResultSum / totalPingCount);
                result.pingTime = pingTime;
    
                if (ProgramStats.stats.minPing === null || (pingTime == SUBMILLISECOND_PING && ProgramStats.stats.minPing != SUBMILLISECOND_PING) || pingTime < ProgramStats.stats.minPing)
                    ProgramStats.updateProgramStats('minPing', pingTime);
                if (ProgramStats.stats.avgPing === null || avgPingTime != ProgramStats.stats.avgPing)
                    ProgramStats.updateProgramStats('avgPing', avgPingTime);
                if (ProgramStats.stats.maxPing === null || (pingTime == SUBMILLISECOND_PING && ProgramStats.stats.maxPing != SUBMILLISECOND_PING) || pingTime > ProgramStats.stats.maxPing)
                    ProgramStats.updateProgramStats('maxPing', pingTime);
            }
        }
        
        if (useVerboseDataLogging()) {
            console.log(`Result of Pinging ${colorizeOutput(address, ForegroundColor.CYAN)}:`);
            console.log(colorizeOutput(
                cmdOutput.replaceAll('\n', '\n\t'),
                new ConsoleUtils.ColorMatchMap([
                    [/(Reply from [\d\.]+:)(?= bytes=\d+)/g, ForegroundColor.GREEN],
                    [/(?<=time=?)((?:\d+|\<1)ms)/g, ForegroundColor.CYAN],
                    [/(transmit failed\. General failure\.|Destination host unreachable\.|Request timed out\.)/g, ForegroundColor.RED]
                ])
            ));
        }
        
        if (pingTimeResult !== null) {
            pingResult = true;
            result.success = true;
        }
        else if (cmdOutput.includes("PING: transmit failed. General failure.")) {
            pingResult = null;
            result.pingFailed = true;
        }

        if (pingResult !== null) {
            return resolve(result);
        }
        else {
            ProgramStats.updateProgramStats('failedPingCount');

            if (attempts <= MAX_FAILURE_RETRIES) {
                console.log(
                    "General Failure while pinging "
                        + colorizeOutput(address, ForegroundColor.YELLOW)
                        + (attempts <= MAX_FAILURE_RETRIES ? ' Retrying...' : '')
                        + '!'
                );
                return resolve(result);
            }

            setTimeout(pingAddress, PING_RETRY_COOLDOWN);
        }
            
    };

    pingAddress();

}); 


/**
 * Check whether or not the *Main Router* is currently online
 * and can be successfully contacted.
 * 
 * @returns     A promise that resolves to `true` if the Main Router
 *              is currently online and was successfully contacted.
 * 
 *              If the Main Router is currently down or could not
 *              otherwise be successfully reached, resolves to `false`.
 * 
 * @see {@link pingBridgeRouter `bridgeRouterIsUp()`}
 * @see {@link checkBridgeStatus `checkBridgeStatus()`}
 */
export const pingMainRouter = (): Promise<PingResult> => ping(getProgramVars().mainRouter.ip);
/**
 * Check whether or not the *Bridge Router* is currently online
 * and can be successfully contacted.
 * 
 * @returns     A promise that resolves to `true` if the Bridge Router
 *              is currently online and was successfully contacted.
 * 
 *              If the Bridge Router is currently down or could not
 *              otherwise be successfully reached, resolves to `false`.
 * 
 * @see {@link pingMainRouter `mainRouterIsUp()`}
 * @see {@link checkBridgeStatus `checkBridgeStatus()`}
 */
export const pingBridgeRouter = (): Promise<PingResult> => ping(getProgramVars().bridgeRouter.ip);

/**
 * Get the {@link BridgeStatus current status} of the WDS Bridge.
 * 
 * Depending on the current status of the WDS Bridge and the
 * value of the `recordFailedPings` argument, this function may or may not
 * automatically update the `bridgeUpCount`, `bridgeDownCount`, or `bridgeRouterDownCount`
 * {@link ProgramStats Program Statistics}.
 * 
 * @param recordFailedPings Indicates whether or not the results of failed pings
 *                          (e.g., `bridgeDownCount` and `bridgeRouterDownCount`)
 *                          should be updated.
 * 
 *                          This parameter is generally set to `false` when performing
 *                          an initial or unverified scan that will always be followed
 *                          by one or more future calls to `getBridgeStatus()` to ensure
 *                          that only the *final* call is recorded.
 * 
 * @returns                 A promise that resolves to the
 *                          current {@link BridgeStatus} of the WDS Bridge.
 * 
 * @see {@link pingMainRouter `mainRouterIsUp()`}
 * @see {@link pingBridgeRouter `bridgeRouterIsUp()`}
 */
export async function checkBridgeStatus ( recordFailedPings: boolean = true ): Promise<BridgeStatus> {

    const currentTimestamp = dayjs();
    const duration = ProgramStats.CoverageGapRecord.getDuration(
        ProgramStats.lastCheckInTime ?? currentTimestamp,
        currentTimestamp
    );
    let pingResult: PingResult;

    if (ProgramStats.lastCheckInTime !== null && ProgramStats.CoverageGapRecord.isValidGapDuration(duration))
        ProgramStats.addCoverageGapRecord(ProgramStats.lastCheckInTime, currentTimestamp);

    ProgramStats.updateLastCheckInTime(currentTimestamp);

    if ( (pingResult = await pingMainRouter()).success === true ) {
        ProgramStats.updateProgramStats('bridgeUpCount');
        return 'up';
    }
    else if ( (pingResult = await pingBridgeRouter()).success === true ) {
        if (recordFailedPings)
            ProgramStats.updateProgramStats('bridgeDownCount');

        return 'down';
    }
    else {
        if (recordFailedPings)
            ProgramStats.updateProgramStats('bridgeRouterDownCount');

        return 'unknown';
    }

}
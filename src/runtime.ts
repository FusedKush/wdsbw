/**
 * Contains program runtime types, members, and functions
 * shared across the program.
 * 
 * This module does not add members directly to the global namespace,
 * but rather provides them through the following distinct namespaces:
 * - {@link ProgramStats `ProgramStats`}
 * - {@link RuntimeVariables `RuntimeVariables`}
 * - {@link KeypressHandlers `KeypressHandlers`}
 * 
 * Common types, functions, and other members can also be 
 * found in the [`./common.js`](./common.ts) module.
 * 
 * @link [`./common.js` Module](./common.ts)
 * @link [`./utils.js` Module](./utils.ts)
 */
declare module "./runtime.js";

import {
    ConsoleUtils,
    getDisplayTimestampString,
    isFutureTimestamp,
    isPastTimestamp,
    promisify,
    StringUtils
} from "./utils.js";
import colorizeOutput = ConsoleUtils.colorizeOutput;
import ForegroundColor = ConsoleUtils.ForegroundColor;
import BrightForegroundColor = ConsoleUtils.BrightForegroundColor;
import DEFAULT_DATA_TYPE_COLORS = ConsoleUtils.DEFAULT_COLORS;

import {
    dayjs,
    DateType,
    Inspectable,
    Promisable,
    isTtyConsole,
    verboseLogging,
    verboseDataLogging,
    verboseDataLog,
    SUBMILLISECOND_PING,
    ValueStepDirection,
    verboseLog
} from "./common.js";
import type { checkBridgeStatus } from "./router-status.js";
import type { ReconnectionMethod } from "./reconnect-bridge/api/index.js";

import { InspectOptions, InspectOptionsStylized, inspect as nodeInspect } from "node:util";
import readline from "node:readline";


/* Program Statistics */

/**
 * A namespace containing types, members, and functions
 * associated with the collection, querying, and manipulation
 * of *Program Statistics*.
 */
export namespace ProgramStats {

    /* Types */
    // Simple Program Statistics

    /**
     * An interface containing properties used to track
     * various Program Statistics including check-in,
     * ping, and WDS Bridge Reconnection Attempt results.
     */
    export interface Statistics {

        /**
         * The number of times the WDS Bridge has been
         * verified to be *UP* and the Main Router
         * to be successfully contacted.
         * 
         * @see {@link bridgeDownCount}
         * @see {@link bridgeRouterDownCount}
         * @see {@link failedPingCount}
         */
        bridgeUpCount: number;
        /**
         * The number of times the WDS Bridge has been
         * verified to be *DOWN* and the Main Router
         * to not be successfully contacted.
         * 
         * Note that in this situation, the Bridge Router
         * *could* still be successfully contacted.
         * 
         * @see {@link bridgeUpCount}
         * @see {@link bridgeRouterDownCount}
         * @see {@link failedPingCount}
         */
        bridgeDownCount: number;
        /**
         * The number of times the WDS Bridge and the 
         * Bridge Router have both been verified to be *DOWN*
         * and neither the Main Router nor the Bridge Router
         * could be successfully contacted.
         * 
         * @see {@link bridgeUpCount}
         * @see {@link bridgeDownCount}
         * @see {@link failedPingCount}
         */
        bridgeRouterDownCount: number;
        /**
         * The number of times the Main Router and/or
         * Bridge Router could not be contacted via an initial check-in
         * but were successfully contacted via a follow-up check-in.
         * 
         * @see {@link bridgeUpCount}
         * @see {@link bridgeDownCount}
         * @see {@link bridgeRouterDownCount}
         */
        failedPingCount: number;
    
        /**
         * The minimum amount of time it took to contact
         * the *Main Router* during a Successful {@link getBridgeStatus Check-In}.
         * 
         * This value does **not** factor in that amount of time
         * that takes to contact the *Bridge Router*.
         * 
         * @see {@link avgPing}
         * @see {@link maxPing}
         */
        minPing: number | typeof SUBMILLISECOND_PING | null;
        /**
         * The average amount of time it has taken to contact
         * the *Main Router* during all Successful {@link getBridgeStatus Check-Ins}.
         * 
         * This value does **not** factor in that amount of time
         * that it has taken to contact the *Bridge Router*.
         * 
         * @see {@link minPing}
         * @see {@link maxPing}
         */
        avgPing: number | typeof SUBMILLISECOND_PING | null;
        /**
         * The maximum amount of time it took to contact
         * the *Main Router* during a Successful {@link getBridgeStatus Check-In}.
         * 
         * This value does **not** factor in that amount of time
         * that takes to contact the *Bridge Router*.
         * 
         * @see {@link minPing}
         * @see {@link avgPing}
         */
        maxPing: number | typeof SUBMILLISECOND_PING | null;
    
        /**
         * The total number of `bytes` sent to the
         * Main and Bridge Routers via `ping` requests.
         * 
         * @see {@link totalPingBytesReceived}
         */
        totalPingBytesSent: number;
        /**
         * The total number of `bytes` received from the
         * Main and Bridge Routers via `ping` responses.
         * 
         * @see {@link totalPingBytesSent}
         */
        totalPingBytesReceived: number;
    
        /**
         * The number of times the WDS Bridge was successfully
         * re-established using a {@link ReconnectionMethod.registeredMethods Registered Reconnection Method}.
         * 
         * @see {@link failedReconnectionCount}
         */
        successfulReconnectionCount: number;
        /**
         * The number of times the WDS Bridge failed to be
         * re-established using a {@link ReconnectionMethod.registeredMethods Registered Reconnection Method}.
         * 
         * @see {@link successfulReconnectionCount}
         */
        failedReconnectionCount: number;

    }
    
    /**
     * A union type comprised of the keys from the {@link Statistics}
     * interface that are *directly set* to an arbitrary value when being updated
     * using the {@link updateProgramStats `updateProgramStats()`} function.
     * 
     * This is in contrast to {@link IncrementalStatisticName Incremental Program Statistics},
     * which can only be *incremented* by a fixed amount when being updated.
     * 
     * @see {@link DirectlySetStatistics}
     * @see {@link IncrementalStatisticName}
     */
    export type DirectlySetStatisticName = Extract<keyof Statistics, 'minPing' | 'avgPing' | 'maxPing'>;
    /**
     * A union type comprised of the keys from the {@link Statistics}
     * interface that are *incremented* by a fixed amount when being updated
     * using the {@link updateProgramStats `updateProgramStats()`} function.
     * 
     * This is in contrast to {@link DirectlySetStatisticName Directly-Set Program Statistics},
     * which are *directly set* to an arbitrary value when being updated.
     * 
     * @see {@link IncrementalStatistics}
     * @see {@link DirectlySetStatisticName}
     */
    export type IncrementalStatisticName = Exclude<keyof Statistics, DirectlySetStatisticName>;
    /**
     * A subset of the {@link Statistics} interface containing
     * the properties that are *directly set* to an arbitrary value when being updated
     * using the {@link updateProgramStats `updateProgramStats()`} function.
     * 
     * This is in contrast to {@link IncrementalStatistics Incremental Program Statistics},
     * which can only be *incremented* by a fixed amount when being updated.
     * 
     * @see {@link DirectlySetStatisticName}
     * @see {@link IncrementalStatistics}
     */
    export type DirectlySetStatistics = Pick<Statistics, DirectlySetStatisticName>;
    /**
     * A subset of the {@link Statistics} interface containing
     * the properties that are *incremented* by a fixed amount when being updated
     * using the {@link updateProgramStats `updateProgramStats()`} function.
     * 
     * This is in contrast to {@link DirectlySetStatistics Directly-Set Program Statistics},
     * which are *directly set* to an arbitrary value when being updated.
     * 
     * @see {@link IncrementalStatisticName}
     * @see {@link DirectlySetStatistics}
     */
    export type IncrementalStatistics = Pick<Statistics, IncrementalStatisticName>;


    // Outage & Coverage Gap Records

    /**
     * An abstract class used to represent a record of a distinct duration of time
     * that occurred during the runtime of the program.
     * 
     * @see {@link BridgeOutageRecord}
     * @see {@link CoverageGapRecord}
     */
    export abstract class DurationRecord implements Inspectable {

        /* Instance Properties */
    
        /**
         * The {@link DateType timestamp} corresponding to the *beginning* of the recorded duration.
         */
        readonly start: DateType;
        /**
         * The {@link DateType timestamp} corresponding to the *end* of the recorded duration.
         */
        readonly end: DateType;
        /**
         * The length of the duration of time that occurred between
         * the designated {@link start `start`} and
         * {@link start `end`} {@link DateType timestamps} in *seconds*.
         */
        readonly duration: number;
    

        /* Class Constructors */
    
        /**
         * Construct a new `BridgeOutageRecord` beginning at the
         * designated `start` {@link DateType timestamp} and ending at the designated `end` timestamp.
         * 
         * @param start         The {@link DateType timestamp} corresponding to the *beginning* of the recorded duration.
         * 
         * @param end           The {@link DateType timestamp} corresponding to the *end* of the recorded duration.
         * 
         * @param minDuration   The minimum permitted duration of time between the designated
         *                      `start` and `end` {@link DateType timestamps} in *seconds*.
         * 
         * @throws {TypeError}  If the specified `end` {@link DateType timestamp} occurs after
         *                      the designated `start` Date or the duration of time
         *                      between the designated `start` and `end` {@link DateType timestamps}
         *                      is less than the specified `minDuration`.
         */
        constructor ( start: DateType, end: DateType, minDuration: number = 0 ) {
    
            const duration = BridgeOutageRecord.getDuration(start, end);
            DurationRecord.assertIsValidDuration(duration, minDuration);
    
            this.start = start;
            this.end = end;
            this.duration = duration;
    
        }
    

        /* Static Class Methods */
    
        /**
         * Get the duration of time that occurred between
         * the designated `start` and `end` {@link DateType timestamps} in *seconds*.
         * 
         * @param start         The {@link DateType timestamp} corresponding to the *beginning* of the duration.
         * @param end           The {@link DateType timestamp} corresponding to the *end* of the duration.
         * 
         * @returns             The length of the duration of time that occurred between
         *                      the designated `start` and `end` {@link DateType timestamps} in *seconds*.
         * 
         * @see {@link isValidDuration `isValidDuration()`}
         * @see {@link assertIsValidDuration `assertIsValidDuration()`}
         */
        static getDuration = ( start: DateType, end: DateType ): number => end.diff(start, 'seconds');
        /**
         * Check if the specified duration exceeds the specified `minDuration`
         * permitted for creating new `DurationRecord` objects.
         * 
         * @param duration      The duration of time being evaluated in *seconds*.
         * 
         * @param minDuration   The minimum permitted duration of time for the designated
         *                      `duration` {@link DateType timestamps} in *seconds*.
         * 
         * @returns             `true` if the specified `duration` is greater than or
         *                      equal to the designated `minDuration`.
         *      
         *                      Otherwise, returns `false`.
         * 
         * @see {@link getDuration `getDuration()`}
         * @see {@link assertIsValidDuration `assertIsValidDuration()`}
         */
        static isValidDuration = ( duration: number, minDuration: number ): boolean => (duration >= minDuration);
        /**
         * Assert the specified duration exceeds the specified `minDuration`
         * permitted for creating new `DurationRecord` objects or throw a
         * {@link TypeError} otherwise.
         * 
         * @param duration      The duration of time being evaluated in *seconds*.
         * 
         * @param minDuration   The minimum permitted duration of time for the designated
         *                      `duration` {@link DateType timestamps} in *seconds*.
         * 
         * @throws              A {@link TypeError} if the specified `duration` is less than
         *                      the designated `minDuration`.
         * 
         * @see {@link getDuration `getDuration()`}
         * @see {@link isValidDuration `isValidDuration()`}
         */
        static assertIsValidDuration = ( duration: number, minDuration: number ): void => {
    
            if (!this.isValidDuration(duration, minDuration))
                throw new TypeError(`The length of the duration must be greater than or equal to ${minDuration} seconds.`);
    
        };


        /* Instance Methods */
    
        /**
         * Split the duration designated by the specified `durationStart`
         * and `durationEnd` {@link DateType timestamps} by the duration represented by this object.
         * 
         * If the gap in coverage did not occur during the designated duration,
         * the total duration designated by the specified `durationStart`
         * and `durationEnd` {@link DateType timestamps} will be returned.
         * 
         * @param durationStart A {@link DateType timestamp} representing the *beginning* of the duration being split.
         * @param durationEnd   A {@link DateType timestamp} representing the *end* of the duration being split.
         * 
         * @returns             The length of the duration designated by the specified `durationStart`
         *                      and `durationEnd` {@link DateType timestamps}, split by the duration represented
         *                      by this object, if applicable.
         */
        splitDuration = ( durationStart: DateType, durationEnd: DateType ): number => (
            Math.max(durationStart.valueOf() - this.start.valueOf(), 0)
            + Math.max(durationEnd.valueOf() - this.end.valueOf(), 0)
        );
    
        /** @override */
        [nodeInspect.custom] ( depth: number, options: InspectOptionsStylized, inspect: typeof nodeInspect ): string {
    
            let inspectionStr = "{\n";
            let startTime = getDisplayTimestampString(this.start);
            let endTime = getDisplayTimestampString(this.end);
            let duration = dayjs.duration(this.duration, 'seconds').humanize();
            
            if (options?.colors) {
                inspectionStr += `  start: ${colorizeOutput(startTime, DEFAULT_DATA_TYPE_COLORS.DateType)}\n`;
                inspectionStr += `  end: ${colorizeOutput(endTime, DEFAULT_DATA_TYPE_COLORS.DateType)}\n`;
                inspectionStr += `  duration: ${colorizeOutput(duration, ForegroundColor.CYAN)}\n`;
            }
            else {
                inspectionStr += `  start: ${startTime}\n`;
                inspectionStr += `  end: ${endTime}\n`;
                inspectionStr += `  duration: ${duration}\n`;
            }
    
            inspectionStr += '}';
            return inspectionStr;
    
        }
    
    }
    
    /**
     * A class used to represent a record of an instance where the
     * WDS Bridge was verified to be *DOWN* and was successfully
     * re-restablished by the program that occurred during
     * the runtime of the program.
     * 
     * @see {@link DurationRecord}
     * @see {@link CoverageGapRecord}
     */
    export class BridgeOutageRecord extends DurationRecord {
    
        /* Instance Properties */

        /**
         * The {@link DateType timestamp} corresponding to the time
         * of the {@link checkBridgeStatus First Failed Check-In}
         * that occurred marking the *beginning* of
         * the bridge outage instance being recorded.
         */
        declare readonly start: DateType;
        /**
         * The {@link DateType timestamp} corresponding to the time
         * of the {@link checkBridgeStatus First Successful Check-In}
         * that occurred marking the *end* of
         * the bridge outage instance being recorded.
         */
        declare readonly end: DateType;
        /**
         * The duration of the bridge outage that occurred in *seconds*.
         */
        declare readonly duration: number;

        /**
         * The {@link BridgeOutageRecord.OutageCause cause}
         * of the WDS Bridge Outage being recorded.
         */
        readonly cause: BridgeOutageRecord.OutageCause;
    
    
        /* Class Constructors */

        /**
         * Construct a new `BridgeOutageRecord` beginning at the
         * designated `start` {@link DateType timestamp} and ending at the designated `end` timestamp.
         * 
         * @param start         The {@link DateType timestamp} corresponding to the time
         *                      of the {@link checkBridgeStatus First Failed Check-In}
         *                      that occurred marking the *beginning* of
         *                      the bridge outage instance being recorded.
         * 
         * @param end           The {@link DateType timestamp} corresponding to the time
         *                      of the {@link checkBridgeStatus First Successful Check-In}
         *                      that occurred marking the *end* of
         *                      the bridge outage instance being recorded.
         * 
         * @param cause         The {@link BridgeOutageRecord.OutageCause cause}
         *                      of the WDS Bridge Outage being recorded.
         * 
         * @throws              A {@link TypeError} if the specified `end` {@link DateType timestamp} occurs after
         *                      the designated `start` timestamp or the duration of time
         *                      between the designated `start` and `end` timestamps is a negative number.
         */
        constructor ( start: DateType, end: DateType, cause: BridgeOutageRecord.OutageCause ) {
    
            super(start, end);
            this.cause = cause;
    
        }
    

        /* Instance Methods */
        
        /** @override */
        [nodeInspect.custom] ( depth: number, options: InspectOptionsStylized, inspect: typeof nodeInspect ): string {
    
            const baseInspectionStr = super[nodeInspect.custom](depth, options, inspect);
            let addedInspectionStr = "";
            let cause = this.cause == 'wds-bridge'
                ? 'WDS Bridge Outage (Main Router could not be reached)'
                : 'Bridge Router Outage (Bridge Router could not be reached)';
    
            if (options?.colors) {
                addedInspectionStr += `  cause: ${colorizeOutput(cause, ForegroundColor.YELLOW)}\n`;
            }
            else {
                addedInspectionStr += `  cause: ${cause}\n`;
            }
    
            return baseInspectionStr.replace(/\n}$/, `\n${addedInspectionStr}}`);
    
        }
    
    };
    export namespace BridgeOutageRecord {
    
        /**
         * A union type comprised of *causes* for a
         * {@link BridgeOutageRecord WDS Bridge Outage}.
         * 
         * - `'wds-bridge'`:    The WDS Bridge is down and the Main Router
         *                      could not be successfully contacted.
         *                      \
         *                      Note that in this situation, the Bridge Router
         *                      *could* still be successfully contacted.
         * 
         * - `'bridge-router'`: The WDS Bridge and the Bridge Router are both down
         *                      and neither the Main Router nor the Bridge Router
         *                      could be successfully contacted.
         */
        export type OutageCause = 'wds-bridge' | 'bridge-router';
    
    };
    
    /**
     * A class used to represent a record of a 
     * gap in coverage that occurred during the runtime of the program.
     * 
     * @see {@link DurationRecord}
     * @see {@link BridgeOutageRecord}
     */
    export class CoverageGapRecord extends DurationRecord {
    
        /* Instance Properties */

        /**
         * The {@link DateType timestamp} corresponding to the time
         * of the {@link checkBridgeStatus Last Successful Check-In}
         * that occurred *before* the gap in coverage being recorded.
         */
        declare readonly start: DateType;
        /**
         * The {@link DateType timestamp} corresponding to the time
         * of the {@link checkBridgeStatus First Successful Check-In}
         * that occurred *after* the gap in coverage being recorded.
         */
        declare readonly end: DateType;
        /**
         * The duration of the gap in coverage that occurred in *seconds*.
         */
        declare readonly duration: number;
    

        /* Class Constructors */
    
        /**
         * Construct a new `CoverageGapRecord` beginning at the
         * designated `start` {@link DateType timestamp} and ending at the designated
         * `end` timestamp.
         * 
         * @param start         The {@link DateType timestamp} corresponding to the time
         *                      of the {@link checkBridgeStatus Last Successful Check-In}
         *                      that occurred *before* the gap in coverage being recorded.
         * 
         * @param end           The {@link DateType timestamp} corresponding to the time
         *                      of the {@link checkBridgeStatus First Successful Check-In}
         *                      that occurred *after* the gap in coverage being recorded.
         * 
         * @throws {TypeError}  If the specified `end` {@link DateType Date} occurs after
         *                      the designated `start` timestamp or if the duration of the
         *                      coverage gap is less than the {@link getMinimumGapDuration Minimum Gap Duration}.
         */
        constructor ( start: DateType, end: DateType ) {
    
            super(start, end, CoverageGapRecord.getMinimumGapDuration());
    
        }
    

        /* Static Class Methods */
    
        /**
         * Get the minimum duration of the Coverage Gap
         * permitted for creating new `CoverageGapRecord` objects.
         * 
         * @see {@link isValidGapDuration `isValidGapDuration()`}
         * @see {@link assertIsValidGapDuration `assertIsValidGapDuration()`}
         */
        static getMinimumGapDuration = (): number => ((RuntimeVariables.MAX_VERIFICATION_INTERVAL * 1.5) / 1000);
        /**
         * Check if the specified duration exceeds the {@link getMinimumGapDuration Minimum Gap Duration}
         * permitted for creating new `CoverageGapRecord` objects.
         * 
         * @param duration      The duration of time being evaluated in *seconds*.
         * 
         * @returns             `true` if the specified `duration` is greater than or
         *                      equal to the {@link getMinimumGapDuration Minimum Gap Duration}
         *      
         *                      Otherwise, returns `false`.
         * 
         * @see {@link getMinimumGapDuration `getMinimumGapDuration()`}
         * @see {@link assertIsValidGapDuration `assertIsValidGapDuration()`}
         */
        static isValidGapDuration = ( duration: number ): boolean => this.isValidDuration(duration, this.getMinimumGapDuration()); 
        /**
         * Assert the specified duration exceeds the {@link getMinimumGapDuration Minimum Gap Duration}
         * permitted for creating new `CoverageGapRecord` objects or throw a
         * {@link TypeError} otherwise.
         * 
         * @param duration      The duration of time being evaluated in *seconds*.
         * 
         * @throws              A {@link TypeError} if the specified `duration` is less than
         *                      the {@link getMinimumGapDuration Minimum Gap Duration}.
         * 
         * @see {@link getMinimumGapDuration `getMinimumGapDuration()`}
         * @see {@link isValidGapDuration `isValidGapDuration()`}
         */
        static assertIsValidGapDuration = ( duration: number ): void => this.assertIsValidDuration(duration, this.getMinimumGapDuration());
    
    };


    /* Global Variables */
    
    /**
     * Contains the Current {@link Statistics Program Statistics}.
     * 
     * Can be updated using the {@link updateProgramStats `updateProgramStats()`} function.
     */
    export var stats: Statistics = {
        bridgeUpCount: 0,
        bridgeDownCount: 0,
        bridgeRouterDownCount: 0,
        failedPingCount: 0,
        minPing: null,
        avgPing: null,
        maxPing: null,
        totalPingBytesSent: 0,
        totalPingBytesReceived: 0,
        successfulReconnectionCount: 0,
        failedReconnectionCount: 0
    };

    /**
     * An array of {@link BridgeOutageRecord Bridge Outage Records} representing
     * the instances where the WDS Bridge was verified to be *DOWN* and was successfully
     * re-restablished during the runtime of the program.
     * 
     * New {@link BridgeOutageRecord Bridge Outage Records} can be added
     * using the {@link addBridgeOutageRecord `addBridgeOutageRecord()`} function.
     * 
     * @see {@link addBridgeOutageRecord `addBridgeOutageRecord()`}
     * @see {@link coverageGapRecords `coverageGapRecords`}
     */
    export var bridgeOutageRecords: BridgeOutageRecord[] = [];
    /**
     * An array of {@link CoverageGapRecord Coverage Gap Records} representing
     * the instances where a gap in coverage occurred during the runtime of the program.
     * 
     * New {@link CoverageGapRecord Coverage Gap Records} can be added
     * using the {@link addCoverageGapRecord `addCoverageGapRecord()`} function.
     * 
     * @see {@link addCoverageGapRecord `addCoverageGapRecord()`}
     * @see {@link bridgeOutageRecords `bridgeOutageRecords`}
     */
    export var coverageGapRecords: CoverageGapRecord[] = [];

    /**
     * The {@link DateType timestamp} of the last time
     * a *WDS Bridge Check-In* occurred.
     * 
     * The `lastCheckInTime` can be updated using the
     * {@link updateLastCheckInTime `updateLastCheckInTime()`} function.
     * 
     * If a *WDS Bridge Check-In* has not yet occurred,
     * this variable will be set to `null`.
     * 
     * @see {@link updateLastCheckInTime `updateLastCheckInTime()`}
     */
    export var lastCheckInTime: DateType | null = null;


    /* Functions */

    /**
     * Update the {@link lastCheckInTime `lastCheckInTime`} variable
     * with the {@link DateType timestamp} of the last time
     * a *WDS Bridge Check-In* occurred.
     * 
     * @param time  The {@link DateType timestamp} of the last time
     *              a *WDS Bridge Check-In* occurred.
     * 
     *              If omitted or `null`, the current timestamp will be used.
     * 
     * @returns     The updated Last Check-In {@link DateType timestamp}.
     * 
     * @throws      A {@link TypeError} if the specified `time` is before
     *              the current {@link lastCheckInTime `lastCheckInTime`}
     *              or is in the future.
     */
    export const updateLastCheckInTime = ( time?: DateType | null ): DateType => {

        const currentTimestamp = dayjs();

        if (!time)
            time = currentTimestamp;

        if (lastCheckInTime) {
            if (isPastTimestamp(time, { referenceTimestamp: lastCheckInTime }))
                throw new TypeError("The specified Check-In Time cannot be before the Last Recorded Check-In Time.");
            else if (isFutureTimestamp(time, { referenceTimestamp: currentTimestamp }))
                throw new TypeError("The specified Check-In Time cannot be in the future.");
        }

        verboseDataLog(`Updating Last Check-In Time to`, time);
        lastCheckInTime = time;
        return lastCheckInTime;

    }
    

    // Simple Program Statistics

    /**
     * Update the specified {@link IncrementalStatistics Incremental Program Statistic}.
     * 
     * The specified `stat` will be incremented by an appropriate amount,
     * which is frequently just by `1`.
     * 
     * @param stat  The name of an {@link IncrementalStatistics appropriate program statistic}
     *              to be incremented.
     */
    export function updateProgramStats (
        stat: keyof IncrementalStatistics
    ): void;
    /**
     * Update the specified {@link DirectlySetStatistics Directly-Set Program Statistic}
     * to the designated `value`.
     * 
     * @param stat  The name of an {@link IncrementalStatistics appropriate program statistic}
     *              to be incremented.
     * 
     * @param value The new value of the designated `stat`.
     * 
     * @throws      A {@link TypeError} if the specified `value` is
     *              `undefined`, negative, or zero.
     */
    export function updateProgramStats (
        stat: keyof DirectlySetStatistics,
        value?: number | typeof SUBMILLISECOND_PING
    ): void;
    // /**
    //  * Update the specified {@link Statistics Program Statistic}.
    //  * 
    //  * This is the generic overload of the `updateProgramStats()` function. See the
    //  * non-generic overloads for more information on the arguments and their usage.
    //  * 
    //  * If the specified `stat` is an {@link IncrementalStatistics Incremental Program Statistic}
    //  * will be incremented by an appropriate amount, which is frequently just by `1`.
    //  * 
    //  * If the specified `stat` is a {@link DirectlySetStatistics Directly-Set Program Statistic},
    //  * the function expects the `value` argument to contain the new value.
    //  * 
    //  * @param stat  The name of an {@link IncrementalStatistics appropriate program statistic}
    //  *              to be incremented.
    //  * 
    //  * @param value The new value of the designated `stat`.
    //  * 
    //  * @throws      A {@link TypeError} if the `value` specified for a 
    //  *              {@link DirectlySetStatistics Directly-Set Program Statistic}
    //  *              is `undefined`, negative, or zero.
    //  */
    // export function updateProgramStats <
    //     T extends keyof Statistics,
    //     U extends (T extends keyof DirectlySetStatistics ? (number | typeof SUBMILLISECOND_PING) : undefined)
    // > ( stat: T, value? : U ): void;
    export function updateProgramStats <
        T extends keyof Statistics,
        U extends (T extends keyof DirectlySetStatistics ? (number | typeof SUBMILLISECOND_PING) : undefined)
    > ( stat: T, value? : U ): void {
    
        if ( !['minPing', 'avgPing', 'maxPing'].includes(stat) ) {
            if ( !stat.startsWith('totalPingBytes') )
                (stats[stat] as number)++;
            else
                (stats[stat] as number) += 32;
        }
        else {
            if (typeof value == 'undefined')
                throw TypeError(`A value must be specified for '${stat}'.`);
            else if (typeof value == 'number' && value <= 0)
                throw TypeError(`A positive, nonzero value must be specified for '${stat}'.`);
    
            (stats[stat] as typeof stats[`${'min' | 'avg' | 'max'}Ping`]) = value;
        }
    }


    // Bridge Outage & Coverage Gap Records
    
    /**
     * Add the specified {@link BridgeOutageRecord} to the
     * {@link bridgeOutageRecords `bridgeOutageRecords`} array.
     * 
     * @param record    The {@link BridgeOutageRecord} to add to the
     *                  {@link bridgeOutageRecords `bridgeOutageRecords`}  array.
     * 
     * @returns         The new {@link Array.prototype.length `length`} of the
     *                  {@link bridgeOutageRecords `bridgeOutageRecords`}  array.
     */
    export function addBridgeOutageRecord ( record: BridgeOutageRecord ): number;
    /**
     * Add a new {@link BridgeOutageRecord Bridge Outage Record} to the
     * {@link bridgeOutageRecords `bridgeOutageRecords`} array
     * marked by the designated `start` and `end` {@link DateType timestamps}.
     * 
     * @param start         The {@link DateType timestamp} corresponding to the time
     *                      of the {@link checkBridgeStatus First Failed Check-In}
     *                      that occurred marking the *beginning* of
     *                      the bridge outage instance being recorded.
     * 
     * @param end           The {@link DateType timestamp} corresponding to the time
     *                      of the {@link checkBridgeStatus First Successful Check-In}
     *                      that occurred marking the *end* of
     *                      the bridge outage instance being recorded.
     * 
     * @param cause         The {@link BridgeOutageRecord.OutageCause cause}
     *                      of the WDS Bridge Outage being recorded.
     * 
     *                      Defaults to `'wds-bridge'`.
     * 
     * @returns             The new {@link Array.prototype.length `length`} of the
     *                      {@link bridgeOutageRecords `bridgeOutageRecords`} array.
     * 
     * @throws              A {@link TypeError} if the specified end {@link DateType timestamp}
     *                      occurs after the designated start timestamp or if the duration of
     *                      the coverage gap is a *negative number*.
     */
    export function addBridgeOutageRecord ( start: DateType, end?: DateType | null, cause?: BridgeOutageRecord.OutageCause | null ): number;
    export function addBridgeOutageRecord <
        T extends BridgeOutageRecord | DateType,
        U extends (T extends DateType ? DateType | undefined | null : undefined)
    > ( recordOrStartDate: T, endDate?: U, cause?: BridgeOutageRecord.OutageCause ): number {
    
        const outageRecord = recordOrStartDate instanceof BridgeOutageRecord
            ? recordOrStartDate
            : new BridgeOutageRecord(
                recordOrStartDate,
                endDate ?? dayjs(),
                cause ?? 'wds-bridge'
            );
    
        if (verboseLogging) {
            console.log(
                "Recording Bridge Outage"
                + (
                    verboseDataLogging
                        ? ':'
                        : (
                            ' lasting '
                            + 
                            colorizeOutput(dayjs.duration(outageRecord.duration, 'seconds').humanize(), DEFAULT_DATA_TYPE_COLORS.UnitDenominatedNumber)
                            + ' ('
                            + colorizeOutput(outageRecord.cause, ForegroundColor.YELLOW)
                            + ').'
                        )
                )
            );
    
            if (verboseDataLogging)
                console.log(outageRecord);
        }
    
        return bridgeOutageRecords.push(outageRecord);
    
    }
    
    /**
     * Add the specified {@link CoverageGapRecord} to the
     * {@link coverageGapRecords `coverageGapRecords`} array.
     * 
     * @param record    The {@link CoverageGapRecord} to add to the
     *                  {@link coverageGapRecords `coverageGapRecords`} array.
     * 
     * @returns         The new {@link Array.prototype.length `length`} of the
     *                  {@link coverageGapRecords `coverageGapRecords`} array.
     */
    export function addCoverageGapRecord ( record: CoverageGapRecord ): number;
    /**            
     * Add a new {@link CoverageGapRecord Coverage Gap Record} to the
     * {@link coverageGapRecords `coverageGapRecords`} array
     * marked by the designated `start` and `end` {@link DateType timestamps}.
     * 
     * @param start         The {@link DateType timestamp} corresponding to the time
     *                      of the {@link checkBridgeStatus Last Successful Check-In}
     *                      that occurred *before* the gap in coverage being recorded.
     * 
     * @param end           The {@link DateType timestamp} corresponding to the time
     *                      of the {@link checkBridgeStatus First Successful Check-In}
     *                      that occurred *after* the gap in coverage being recorded.
     * 
     * @returns             The new {@link Array.prototype.length `length`} of the
     *                      {@link coverageGapRecords `coverageGapRecords`} array.
     * 
     * @throws              A {@link TypeError} if the specified `end` {@link DateType timestamp}
     *                      occurs after the designated `start` timestamp
     *                      or if the duration of the coverage gap is *less than* the
     *                      {@link CoverageGapRecord.getMinimumGapDuration Minimum Gap Duration}.
     */
    export function addCoverageGapRecord ( start: DateType, end?: DateType | null ): number;
    export function addCoverageGapRecord <
        T extends DateType | CoverageGapRecord,
        U extends (T extends DateType ? DateType | undefined | null : undefined)
    > ( recordOrStartDate: T, endDate?: U ): number {
    
        const coverageGapRecord = recordOrStartDate instanceof CoverageGapRecord
            ? recordOrStartDate
            : new CoverageGapRecord(recordOrStartDate, endDate ?? dayjs());
    
        if (verboseLogging) {
            console.log(
                "Recording Coverage Gap"
                + (
                    verboseDataLogging
                        ? ':'
                        : ` lasting ${colorizeOutput(dayjs.duration(coverageGapRecord.duration, 'seconds').humanize(), DEFAULT_DATA_TYPE_COLORS.UnitDenominatedNumber)}.`
                )
            );
    
            if (verboseDataLogging)
                console.log(coverageGapRecord);
        }
    
        return coverageGapRecords.push(coverageGapRecord);
    
    }

}


/* Runtime Variables */

/**
 * A namespace containing types, members, and functions
 * associated with the querying and manipulation of *Runtime Variables*.
 */
export namespace RuntimeVariables {

    /**
     * The minimum amount of time the program has to wait between calls to
     * {@link checkBridgeStatus `checkBridgeStatus()`} in *milliseconds*.
     * 
     * @see {@link currentVerificationInterval `currentVerificationInterval`}
     * @see {@link MAX_VERIFICATION_INTERVAL}
     * @see {@link VERIFICATION_INTERVAL_STEP_SIZE}
     */
    export const MIN_VERIFICATION_INTERVAL = 5000;
    /**
     * The maximum amount of time the program can between calls to
     * {@link checkBridgeStatus `checkBridgeStatus()`} in *milliseconds*.
     * 
     * @see {@link currentVerificationInterval `currentVerificationInterval`}
     * @see {@link MIN_VERIFICATION_INTERVAL}
     * @see {@link VERIFICATION_INTERVAL_STEP_SIZE}
     */
    export const MAX_VERIFICATION_INTERVAL = 60000;
    /**
     * The amount of time to add or remove from the
     * {@link currentVerificationInterval `currentVerificationInterval`}
     * when calling {@link changeVerificationInterval `changeVerificationInterval()`}
     * in *milliseconds*.
     * 
     * @see {@link currentVerificationInterval `currentVerificationInterval`}
     * @see {@link changeVerificationInterval `changeVerificationInterval()`}
     * @see {@link MAX_VERIFICATION_INTERVAL}
     * @see {@link VERIFICATION_INTERVAL_STEP_SIZE}
     */
    export const VERIFICATION_INTERVAL_STEP_SIZE = 5000;
    
    /**
     * The Default Verification Interval Duration used when
     * resetting the interval duration back to the *default value*.
     * 
     * @see {@link currentVerificationInterval `currentVerificationInterval`}
     */
    export var defaultVerificationInterval: number = 30000;
    /**
     * The current amount of time to wait between calls to
     * {@link checkBridgeStatus `checkBridgeStatus()`} in *milliseconds*.
     * 
     * The value of this variable can be controlled via the
     * Interactive Console at runtime using the `v` key.
     * This value of this variable can be controlled at runtime via the
     * Interactive Console using the `up` and `down` arrow keys.
     * 
     * The value of this variable can be modified using the
     * {@link changeVerificationInterval `changeVerificationInterval()`} function.
     * 
     * @see {@link defaultVerificationInterval `defaultVerificationInterval`}
     * @see {@link changeVerificationInterval `changeVerificationInterval()`}
     */
    export var currentVerificationInterval: number = defaultVerificationInterval;

    /**
     * Assert that the specified `interval` is greater than or equal to
     * the {@link MIN_VERIFICATION_INTERVAL} and less than or equal to
     * the {@link MAX_VERIFICATION_INTERVAL}.
     * 
     * Assert that the specified `interval` satisfies the following inequality:\
     * `MIN_VERIFICATION_INTERVAL <= interval <= MAX_VERIFICATION_INTERVAL`
     * 
     * @param interval  The Verification Interval being evaluated.
     * 
     * @throws          A {@link TypeError} if the specified `interval` is
     *                  less than the {@link MIN_VERIFICATION_INTERVAL} or
     *                  greater than the {@link MAX_VERIFICATION_INTERVAL}.
     */
    export function assertIsValidVerificationInterval ( interval: number ): void | never {

        if (interval < MIN_VERIFICATION_INTERVAL)
            throw new TypeError(`The Program Verification Interval must be greater than ${MIN_VERIFICATION_INTERVAL}ms.`);
        else if (interval > MAX_VERIFICATION_INTERVAL)
            throw new TypeError(`The Program Verification Interval cannot exceed ${MAX_VERIFICATION_INTERVAL}ms`);

    }
    
    /**
     * Set the amount of time to wait between calls to
     * {@link checkBridgeStatus `checkBridgeStatus()`} to
     * the specified `interval`.
     * 
     * This function is a setter function for the
     * {@link currentVerificationInterval `currentVerificationInterval`} variable.
     * 
     * @param interval  The amount of time to wait between calls to
     *                  {@link checkBridgeStatus `checkBridgeStatus()`}
     *                  in *milliseconds*.
     * 
     * @returns         The Updated {@link currentVerificationInterval Verification Interval}.
     * 
     * @throws          A {@link TypeError} if the specified `interval` is
     *                  less than the {@link MIN_VERIFICATION_INTERVAL} or
     *                  greater than the {@link MAX_VERIFICATION_INTERVAL}.
     * 
     * @see {@link currentVerificationInterval `currentVerificationInterval`}
     * @see {@link setDefaultVerificationInterval `setDefaultVerificationInterval()`}
     */
    export function changeVerificationInterval ( interval: number ): number;
    /**
     * Change the amount of time to wait between calls to
     * {@link checkBridgeStatus `checkBridgeStatus()`} in
     * the specified `direction` and by the designated `stepSize`.
     * 
     * This function is a setter function for the
     * {@link currentVerificationInterval `currentVerificationInterval`} variable.
     * 
     * If the change in the Verification Interval would cause it
     * to exceed the {@link MIN_VERIFICATION_INTERVAL} or {@link MAX_VERIFICATION_INTERVAL},
     * the Verification Interval will be set to the `MIN_VERIFICATION_INTERVAL`
     * or `MAX_VERIFICATION_INTERVAL`, respectively.
     * 
     * @param direction     The {@link ValueStepDirection direction} in which
     *                      to adjust the Verification Interval.
     * 
     * @param stepSize      The amount by which the Verification Interval
     *                      should be increased or decreased.
     * 
     *                      Defaults to {@link VERIFICATION_INTERVAL_STEP_SIZE}.
     * 
     * @returns             The Updated {@link currentVerificationInterval Verification Interval}.
     * 
     * @see {@link currentVerificationInterval `currentVerificationInterval`}
     * @see {@link setDefaultVerificationInterval `setDefaultVerificationInterval()`}
     */
    export function changeVerificationInterval ( direction: ValueStepDirection, stepSize?: number ): number;
    /**
     * Reset the amount of time to wait between calls to
     * {@link checkBridgeStatus `checkBridgeStatus()`} to
     * the {@link defaultVerificationInterval `defaultVerificationInterval`}.
     * 
     * This function is a setter function for the
     * {@link currentVerificationInterval `currentVerificationInterval`} variable.
     * 
     * @param interval  Must be set to `'default'`.
     * 
     * @returns         The Updated {@link currentVerificationInterval Verification Interval}.
     * 
     * @see {@link currentVerificationInterval `currentVerificationInterval`}
     * @see {@link setDefaultVerificationInterval `setDefaultVerificationInterval()`}
     */
    export function changeVerificationInterval ( interval: 'default' ): number;
    // export function changeVerificationInterval ( intervalOrDirection: number | ValueStepDirection | 'default', stepSize?: number ): number;
    export function changeVerificationInterval <
        T extends number | ValueStepDirection | 'default',
        U extends (T extends ValueStepDirection ? number | undefined : undefined)
    > ( intervalOrDirection: T, stepSize?: U ): number {
    
        if (typeof intervalOrDirection == 'number') {
            assertIsValidVerificationInterval(intervalOrDirection);
            currentVerificationInterval = intervalOrDirection;
        }
        else if (typeof intervalOrDirection == 'string') {
            if (intervalOrDirection == 'increase')
                currentVerificationInterval = Math.min(
                    (currentVerificationInterval + (stepSize ?? VERIFICATION_INTERVAL_STEP_SIZE)),
                    MAX_VERIFICATION_INTERVAL
                );
            else if (intervalOrDirection == 'decrease')
                currentVerificationInterval = Math.max(
                    (currentVerificationInterval - (stepSize ?? VERIFICATION_INTERVAL_STEP_SIZE)),
                    MIN_VERIFICATION_INTERVAL
                );
            else if (intervalOrDirection == 'default')
                currentVerificationInterval = defaultVerificationInterval;
        }
    
        return currentVerificationInterval;
    
    }
    
    /**
     * Set the {@link defaultVerificationInterval Default Verification Interval Duration}
     * used when resetting the interval duration back to the *default value*.
     * 
     * @param defaultInterval               The new Default Verification Interval Duration in *milliseconds*.
     * 
     * @param updateVerificationInterval    Indicates whether or not the
     *                                      {@link currentVerificationInterval Current Verification Interval}
     *                                      should be updated if it currently matches the
     *                                      {@link defaultVerificationInterval Current Default Verification Interval}.
     * 
     * @returns                             The updated {@link defaultVerificationInterval Default Verification Interval Duration}.
     * 
     * @throws                              A {@link TypeError} if the specified `defaultInterval` is
     *                                      less than the {@link MIN_VERIFICATION_INTERVAL} or
     *                                      greater than the {@link MAX_VERIFICATION_INTERVAL}.
     * 
     * @see {@link defaultVerificationInterval `defaultVerificationInterval`}
     * @see {@link changeVerificationInterval `changeVerificationInterval()`}
     */
    export function setDefaultVerificationInterval ( defaultInterval: number, updateVerificationInterval: boolean = false ): number {
        
        if (defaultInterval != defaultVerificationInterval) {
            const oldDefaultVerificationInterval = defaultVerificationInterval;

            defaultVerificationInterval = defaultInterval;
            verboseDataLog(() => [
                `Changed the Default Program Verification Interval Duration from`,
                colorizeOutput(`${oldDefaultVerificationInterval}ms`),
                "to",
                colorizeOutput(`${defaultInterval}ms`) + '!'
            ]);
            
            if (oldDefaultVerificationInterval == currentVerificationInterval && updateVerificationInterval)
                currentVerificationInterval = defaultInterval;
        }
    
        return defaultVerificationInterval;
    
    }

}


/* Keypress Handlers */

/**
 * A namespace containing types, members, and functions
 * associated with managing *Console Keypress Handlers*.
 */
export namespace KeypressHandlers {
    
    /**
     * An interface representing the objects emitted
     * by `keypress` events on {@link process.stdin `stdin`}.
     * 
     * The value of the {@link sequence}, {@link name}, and {@link code}
     * fields differs depending on the *type* of key that is pressed. E.g.,
     * | Key          | {@link sequence `sequence`} | {@link name `name`}        | {@link code `code`} |
     * | ------------ | --------------------------- | -------------------------- | ------------------- |
     * | `a`          | `'a'`                       | `'a'`                      | *N/A*               |
     * | `=`          | `'='`                       | `'='`                      | *N/A*               |
     * | `Left Arrow` | `'\x1B[D'`                  | `'left'`                   | `'[D'`              |
     * | `Backspace`  | `'\b'`                      | `'backspace'`              | *N/A*               |
     */
    export interface KeypressEventKey {
    
        /**
         * The Character, Escape Sequence, or Virtual Terminal Sequence of the key that was pressed.
         * 
         * If this field contains a Virtual Terminal Sequence, it will be prefixed by
         * the leading Escape Sequence (`\x1B`).
         * 
         * @examples
         * | Key            | `sequence`    |
         * | -------------- | ------------- |
         * | `a`            | `'a'`         |
         * | `=`            | `'='`         |
         * | `Left Arrow`   | `'\x1B[D'`    |
         * | `Backspace`    | `'\b'`        |
         * 
         * @see {@link code}
         */
        sequence: string;
        /**
         * The Human-Readable Name of the key that was pressed, if applicable.
         * 
         * @examples
         * | Key            | `name`        |
         * | -------------- | ------------- |
         * | `a`            | `'a'`         |
         * | `=`            | `'='`         |
         * | `Left Arrow`   | `'left'`      |
         * | `Backspace`    | `'backspace'` |
         */
        name: string | undefined;
        /** Indicates if the `CTRL` Modifier Key was pressed. */
        ctrl: boolean;
        /** Indicates if the `ALT` Modifier Key was pressed. */
        meta: boolean;
        /** Indicates if the `SHIFT` Modifier Key was pressed. */
        shift: boolean;
        /**
         * The Virtual Terminal Sequence of the key that was pressed, if the pressed
         * key does not directly correspond to a valid character or escape sequence.
         * 
         * The Virtual Terminal Sequence does *not* contain the leading Escape Sequence (`\x1B`).
         * 
         * @examples
         * | Key            | `code`        |
         * | -------------- | ------------- |
         * | `a`            | `undefined`   |
         * | `=`            | `undefined`   |
         * | `Left Arrow`   | `'[D'`        |
         * | `Backspace`    | `undefined`   |
         * 
         * @see {@link sequence}
         */
        code?: string;
    
    };

    /**
     * A function type representing a *Console Keypress Handler* that
     * receives and processes `keypress` events emitted on {@link process.stdin `stdin`}.
     * 
     * @param str   The `string` input value containing the `key` that was pressed.
     * @param key   The {@link KeypressEventKey key} that was pressed.
     * 
     * @returns     To allow further processing of the `keypress` event to continue,
     *              the handler can return `true` or simply return nothing at all.
     * 
     *              To prevent further processing of the `keypress` event, the
     *              handler must return boolean `false`.
     */
    export type KeypressEventHandler = ( str: string, key: KeypressEventKey ) => Promisable<boolean | void>;
    

    /**
     * The amount of time in *milliseconds* to wait
     * after processing a `keypress` event before
     * processing another one.
     * 
     * If a `keypress` event is emitted during the `KEYPRESS_COOLDOWN` period,
     * the event will be ignored.
     */
    export const KEYPRESS_COOLDOWN = 100;


    /**
     * Indicates whether or not `keypress` events 
     * are currently being emited from {@link process.stdin `stdin`}.
     * 
     * @see {@link emitKeypressEvents `emitKeypressEvents()`}
     *      To toggle the emission of `keypress` events on or off.
     */
    export var emittingKeypressEvents: boolean = false;
    export var keypressEventsPaused: boolean = false;
    export var hasEmittedKeypressEvents: boolean = false;

    /**
     * A {@link Record} of Registered {@link KeypressEventHandler `keypress` Event Handlers}.
     * 
     * @see {@link registerKeypressHandler `registerKeypressHandler()`}
     *      To add additional {@link KeypressEventHandler KeypressEventHandlers} to the
     *      `registeredKeypressHandlers` object.
     * 
     * @see {@link removeRegisteredKeypressHandlers `removeRegisteredKeypressHandlers()`}
     *      To remove all of the `registeredKeypressHandlers`
     */
    var registeredKeypressHandlers: Record<string, KeypressEventHandler> = {};
    var registeredHandlerCount: number = 0;

    /**
     * The {@link DateType timestamp} of the last time
     * a `keypress` event was processed by the {@link mainHandler Main `keypress` Event Handler}.
     * 
     * If no `keypress` events have been processed yet, this variable
     * will contain a {@link DateType timestamp} of the time
     * the `./runtime.js` module was loaded.
     */
    var lastKeypressTime: DateType = dayjs();


    /**
     * The Main {@link KeypressEventHandler `keypress` Event Handler} responsible for
     * invoking all of the {@link registeredKeypressHandlers Registered Keypress Handlers}.
     */
    const mainHandler: KeypressEventHandler = async (str, key) => {

        if (emittingKeypressEvents && !keypressEventsPaused) {

            // Catch CTRL + C Shortcut
            if (key.name == 'c' && key.ctrl) {
                process.emit('SIGINT');
                return;
            }
    
            // Throttle Keypress Events
            if ( (lastKeypressTime.valueOf() + KEYPRESS_COOLDOWN) >= dayjs().valueOf() ) {
                verboseDataLog(() => colorizeOutput(
                    "Keypress occurred within the "
                        + colorizeOutput(
                            `${KEYPRESS_COOLDOWN}ms`,
                            ForegroundColor.YELLOW,
                            BrightForegroundColor.BLACK
                        )
                        + " Cooldown Period. Ignoring!",
                    BrightForegroundColor.BLACK
                ));
                return;
            }
        
            lastKeypressTime = dayjs();
    
            for (let name in registeredKeypressHandlers) {
                if ( (await promisify(registeredKeypressHandlers[name], str, key)) === false ) {
                    break;
                }
            }
        }

    };
    
    /**
     * Toggle the emission of `keypress` events from {@link process.stdin `stdin`}.
     * 
     * Toggling `keypress` events also toggles {@link process.stdin.setRawMode Raw Mode}
     * on {@link process.stdin `stdin`}.
     * 
     * @template T          The togle of the `emitEvents` argument.
     * @template ReturnT    The inferred function return type.
     * 
     * @param emitEvents    Whether or not `keypress` events should be
     *                      emitted from {@link process.stdin `stdin`}.
     * 
     *                      `true` enables the emission of `keypress` events,
     *                      while `false` disables them.
     * 
     *                      Omitting the argument or explicitly passing
     *                      `'toggle'` or `undefined` will cause the emission
     *                      of `keypress` events to be *toggled* between being
     *                      enabled and disabled.
     * 
     * @returns             `true` if `keypress` events are now
     *                      being emitted from {@link process.stdin `stdin`}
     *                      or `false` if they are not.
     */
    export function emitKeypressEvents <
        T extends boolean | 'toggle' | undefined = undefined,
        ReturnT extends (T extends boolean ? T : boolean) = (T extends boolean ? T : boolean)
    > ( emitEvents?: T ): ReturnT {

        ConsoleUtils.assertIsTty();

        if ( typeof emitEvents == 'undefined' || (typeof emitEvents == 'string' && emitEvents.toLowerCase() == 'toggle') )
            emitEvents = !emittingKeypressEvents as T;

        if (emitEvents != emittingKeypressEvents) {
            verboseDataLog(() => [
                emitEvents
                    ? colorizeOutput('Enabling', ForegroundColor.GREEN)
                    : colorizeOutput('Disabling', ForegroundColor.YELLOW),
                "the emission of Keypress Events."
            ]);
            emittingKeypressEvents = emitEvents as boolean;

            if (emitEvents && !hasEmittedKeypressEvents) {
                readline.emitKeypressEvents(process.stdin);
                hasEmittedKeypressEvents = true;
            }
            
            process.stdin.setRawMode(emittingKeypressEvents);
        }

        return emittingKeypressEvents as ReturnT;

    }

    export const pauseKeypressEvents = (): true => (process.stdin.setRawMode(emittingKeypressEvents), keypressEventsPaused = true);
    export const resumeKeypressEvents = (): true => (process.stdin.setRawMode(emittingKeypressEvents), !(keypressEventsPaused = false));

    /**
     * Register a {@link KeypressEventHandler `keypress` Event Handler}.
     * 
     * Event Handlers should only be registered *once*, as attempting to register
     * more than one {@link KeypressEventHandler `keypress` Event Handler} to a given `name`
     * will result in a {@link TypeError} being thrown.
     * 
     * @param name      The unique name used to identify the `handler`.
     * @param handler   The {@link KeypressEventHandler `keypress` Event Handler} being registered.
     * 
     * @throws          A {@link TypeError} if an event handler with the same
     *                  `name` has already been registered.
     */
    export function registerKeypressHandler ( name: string, handler: KeypressEventHandler ): void {

        if (name in registeredKeypressHandlers)
            throw new TypeError(`A Keypress Handler with the name '${name}' has already been registered!`);

        registeredKeypressHandlers[name] = handler;
        registeredHandlerCount++;
        verboseDataLog(() => [
            "Successfully registered the",
            `'${colorizeOutput(name, ForegroundColor.YELLOW)}'`,
            "Keypress Handler!"
        ]);

        // Register the `mainHandler` as soon as one or more
        // event handlers have been registered.
        if (registeredHandlerCount == 1) {
            process.stdin.on('keypress', mainHandler);
            verboseDataLog(
                () => colorizeOutput("\t--> Registered the Main Keypress Handler!", BrightForegroundColor.BLACK)
            );
        }

    }
    export function removeKeypressHandler ( name: string ): void {

        // if ( registeredHandlerCount == 0 || !(name in registeredKeypressHandlers) )
        //     throw new TypeError(`A Keypress Handler with the name '${name}' is not currently registered!`);

        delete registeredKeypressHandlers[name];
        registeredHandlerCount--;
        
        verboseDataLog(() => [
            "Successfully removed the",
            `'${colorizeOutput(name, ForegroundColor.YELLOW)}'`,
            "Keypress Handler!"
        ]);

        if (registeredHandlerCount == 0) {
            process.stdin.off('keypress', mainHandler);
            verboseDataLog(
                () => colorizeOutput("\t--> Removed the Main Keypress Handler.", BrightForegroundColor.BLACK)
            );
        }

    }
    /**
     * Remove all of the Registered {@link KeypressEventHandler `keypress` Event Handlers}.
     * 
     * If there are no {@link KeypressEventHandler `keypress` Event Handlers}
     * currently registered or the event handlers were previously cleared
     * by another call to `removeRegisteredKeypressHandlers()`,
     * calling this function has no effect.
     */
    export function removeRegisteredKeypressHandlers (): void {

        const registeredHandlers = registeredHandlerCount;

        if (registeredHandlers > 0) {
            for (const name in registeredKeypressHandlers)
                removeKeypressHandler(name);

            verboseLog(() => [
                "Successfully removed",
                colorizeOutput(registeredHandlers),
                `Registered Keypress ${StringUtils.getPlural('Handler', registeredHandlers)}!`
            ]);
        }

    }

}

export const createReadlineInterface = ( options?: Omit<readline.ReadLineOptions, 'input' | 'output'> ): readline.Interface => {

    const rl = readline.createInterface(
        Object.assign(options ?? {}, { input: process.stdin, output: process.stdout })
    );

    if (KeypressHandlers.emittingKeypressEvents)
        KeypressHandlers.pauseKeypressEvents();

    return rl;

};
export const closeReadlineInterface = ( rl: readline.Interface ): void => {

    rl.close();

    if (KeypressHandlers.emittingKeypressEvents)
        KeypressHandlers.resumeKeypressEvents();
    if (process.stdin.isPaused())
        process.stdin.resume();

};
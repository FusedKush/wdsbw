/**
 * Contains the common types, functions, and other members shared across the program.
 * 
 * While similar to the [`./utils.js`](./utils.ts) and [`./runtime.js`](./runtime.ts) modules,
 * this module contains members that are used by *both* `./utils.js` and `./runtime.js`.
 * In order to avoid creating Circular Dependencies, such members have been moved to this module,
 * which is itself only permitted to import *types* from other local modules.
 * 
 * @link [`./utils.js` Module](./utils.ts)
 * @link [`./runtime.js` Module](./runtime.ts)
 */
declare module "./common.js"

import type { ConsoleUtils, getDisplayTimestampString, verifyOnlyOneProgramInstanceExists, isNullable } from "./utils.js";
import type { EnvironmentVariable } from "./env.js";

import dayjs from "dayjs";
import AdvancedFormat from "dayjs/plugin/advancedFormat.js";
import DurationPlugin, { type Duration } from "dayjs/plugin/duration.js";
import RelativeTimePlugin from "dayjs/plugin/relativeTime.js";
import TimezonePlugin from "dayjs/plugin/timezone.js";
import UpdateLocalePlugin from "dayjs/plugin/updateLocale.js";

import { inspect as nodeInspect, InspectOptions, StacktraceObject, InspectOptionsStylized } from "node:util";
import { readdirSync, readFileSync } from "node:fs";
import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";


/* Verbose Logging */

/**
 * A function type representing a *Log Supplier Function* responsible
 * for supplying the arguments to a dynamic logging function such as {@link verboseLog `verboseLog()`}.
 * 
 * The Supplier Function will only be invoked if and when the logging function
 * is ready to print the return value of the *Log Supplier Function* to the console.
 * 
 * @returns     A value or array of values to be passed to the logging function and,
 *              ultimately, to {@link console.log `console.log()`} or {@link console.error `console.error()`}.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 */
export type LogSupplierFunction = (() => Parameters<typeof console.log> | Parameters<typeof console.log>[0]);

/**
 * Indicates whether additional, more verbose logging, is currently enabled or not.
 * 
 * The initial value of this variable is controlled by the presence or absence
 * of the {@link EnvironmentVariable.ENABLE_VERBOSE_LOGGING `ENABLE_VERBOSE_LOGGING` Environment Variable}.
 * In addition, the value of this variable can be controlled at runtime via the
 * Interactive Console using the `v` key.
 * 
 * The value of this variable can be modified using the
 * {@link setVerboseLogging `setVerboseLogging()`} function.
 * 
 * The value of this variable can also be retrieved using
 * the {@link useVerboseLogging `useVerboseLogging()`} function.
 * 
 * To {@link console.log print to the console} only when `verboseLogging`
 * is set to `true`, use the {@link verboseLog `verboseLog()`} helper function.
 * 
 * @apistatus   ❌ **Private**
 * 
 *              Use {@link useVerboseLogging `useVerboseLogging()`} instead.
 * 
 * @see {@link setVerboseLogging `setVerboseLogging()`}
 * @see {@link useVerboseLogging `useVerboseLogging()`}
 * @see {@link verboseLog `verboseLog()`}
 * @see {@link verboseDataLogging `verboseDataLogging`}
 */
export var verboseLogging: boolean = false;
/**
 * Indicates whether additional, more verbose logging containing specific data,
 * parameters, and return values, is currently enabled or not. 
 * 
 * The initial value of this variable is controlled by the presence or absence
 * of the {@link EnvironmentVariable.ENABLE_VERBOSE_DATA_LOGGING `ENABLE_VERBOSE_DATA_LOGGING` Environment Variable}.
 * In addition, the value of this variable can be controlled at runtime via the
 * Interactive Console using the `SHIFT + V` key.
 * 
 * The value of this variable can be modified using the
 * {@link setVerboseDataLogging `useVerboseDataLogging()`} function.
 * 
 * The value of both this variable and {@link verboseLogging `verboseLogging`}
 * can also be retrieved using the {@link useVerboseDataLogging `useVerboseDataLogging()`} function.
 * 
 * To {@link console.log print to the console} only when both
 * {@link verboseLogging `verboseLogging`} and `verboseDataLogging`
 * are set to `true`, use the {@link verboseDataLog `verboseDataLog()`} helper function.
 * 
 * @apistatus   ❌ **Private**
 * 
 *              Use {@link useVerboseDataLogging `useVerboseDataLogging()`} instead.
 * 
 * @see {@link setVerboseDataLogging `setVerboseDataLogging()`}
 * @see {@link useVerboseDataLogging `useVerboseDataLogging()`}
 * @see {@link verboseDataLog `verboseDataLog()`}
 * @see {@link verboseLogging `verboseLogging`}
 */
export var verboseDataLogging: boolean = false;

/**
 * Check whether additional, more verbose logging, is currently enabled or not.
 * 
 * This function simply returns the value of
 * the {@link verboseLogging `verboseLogging`} variable.
 * 
 * To {@link console.log print to the console} only when this function
 * returns `true`, use the {@link verboseLog `verboseLog()`} helper function.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 * 
 * @see {@link setVerboseLogging `setVerboseLogging()`}
 * @see {@link verboseLog `verboseLog()`}
 * @see {@link verboseLogging `verboseLogging`}
 * @see {@link useVerboseDataLogging `useVerboseDataLogging()`}
 */
export const useVerboseLogging = (): boolean => verboseLogging;
/**
 * Check whether additional, more verbose logging containing specific data,
 * parameters, and return values, is currently enabled or not.
 * 
 * This function simply returns the result of
 * `verboseLogging && verboseDataLogging`.
 * 
 * To {@link console.log print to the console} only when this function
 * returns `true`, use the {@link verboseDataLog `verboseDataLog()`} helper function.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 * 
 * @see {@link setVerboseDataLogging `setVerboseDataLogging()`}
 * @see {@link verboseDataLog `verboseDataLog()`}
 * @see {@link verboseDataLogging `verboseDataLogging`}
 * @see {@link useVerboseLogging `useVerboseLogging()`}
 */
export const useVerboseDataLogging = (): boolean => (verboseLogging && verboseDataLogging);

/**
 * Change whether additional, more verbose logging, is enabled or not.
 * 
 * This function serves as a *Setter Function* for the
 * {@link verboseLogging `verboseLogging`} Variable.
 * 
 * @param newValue  The new value of the {@link verboseLogging} variable.
 * 
 *                  A value of 'toggle' is equivalent to `!verboseLogging`. 
 * 
 * @returns         `true` if additional, more verbose logging, is currently enabled
 *                  and `false` if it is currently disabled.
 * 
 * @apistatus       ❌ **Private**
 * 
 * @see {@link verboseLogging `verboseLogging`}
 * @see {@link setVerboseLogging `useVerboseLogging()`}
 */
export function setVerboseLogging <
    T extends boolean | 'toggle',
    ReturnT extends (T extends boolean ? T : boolean)
> ( newValue: T ): ReturnT {

    let updatingValue: boolean = false;

    if (newValue == 'toggle') {
        updatingValue = true;
        verboseLogging = !verboseLogging;
    }
    else if (newValue != verboseLogging) {
        updatingValue = true;
        verboseLogging = newValue;
    }

    if (updatingValue) {
        console.log(
            'Verbose Logging',
            (verboseLogging
                ? "\x1B[32mEnabled"
                : "\x1B[33mDisabled"
            ) + '!\x1B[0m'
        );
    }

    return verboseLogging as ReturnT;

}
/**
 * Change whether additional, more verbose logging containing specific data,
 * parameters, and return values, is enabled or not.
 * 
 * This function serves as a *Setter Function* for the
 * {@link verboseDataLogging `verboseDataLogging`} Variable.
 * 
 * @param newValue  The new value of the {@link verboseDataLogging} variable.
 * 
 *                  A value of 'toggle' is equivalent to `!verboseDataLogging`. 
 * 
 * @returns         `true` if additional, more verbose logging containing specific data,
 *                  parameters, and return values, is currently enabled
 *                  and `false` if it is currently disabled.
 * 
 * @apistatus       ❌ **Private**
 * 
 * @see {@link verboseDataLogging `verboseDataLogging`}
 * @see {@link setVerboseDataLogging `useVerboseDataLogging()`}
 */
export function setVerboseDataLogging <
    T extends boolean | 'toggle',
    ReturnT extends (T extends boolean ? T : boolean)
> ( newValue: T ): ReturnT {

    let updatingValue: boolean = false;

    if (newValue == 'toggle') {
        updatingValue = true;
        verboseDataLogging = !verboseDataLogging;
    }
    else if (newValue != verboseDataLogging) {
        updatingValue = true;
        verboseDataLogging = newValue;
    }

    if (updatingValue) {
        console.log(
            'Verbose Data Logging',
            (verboseDataLogging
                ? "\x1B[32mEnabled"
                : "\x1B[33mDisabled"
            ) + '!\x1B[0m'
        );
    }

    return verboseDataLogging as ReturnT;

}

/**
 * Prints the specified message or data to `stdout`
 * with newline if {@link useVerboseLogging Verbose Logging is Enabled}.
 * 
 * Otherwise, calling this function has no effect.
 * 
 * @param message           The message or data to be printed to the console.
 * @param optionalParams    Additional arguments to be passed to {@link console.log `console.log()`}.
 * 
 * @apistatus               ✔️ **Public**
 * @since                   `v1`
 */
export function verboseLog ( message?: any, ...optionalParams: any[] ): void;
/**
 * Prints the messages or data returned by the specified `supplier` function to `stdout`
 * with newline if {@link useVerboseLogging Verbose Logging is Enabled}.
 * 
 * Otherwise, calling this function has no effect.
 * 
 * @param supplier  The {@link LogSupplierFunction Supplier Function} responsible for supplying
 *                  the messages or data to be printed to the console.
 * 
 *                  The `supplier` function will only be invoked if
 *                  {@link useVerboseLogging Verbose Logging is Enabled}.
 * 
 * @apistatus       ✔️ **Public**
 * @since           `v1`
 */
export function verboseLog ( supplier: LogSupplierFunction ): void;
export function verboseLog <
    T extends LogSupplierFunction | unknown,
    U extends (T extends LogSupplierFunction ? [] : unknown[])
> ( messageOrSupplier?: T, ...optionalParams: U ): void {

    if (!useVerboseLogging())
        return;

    if (typeof messageOrSupplier != 'function') {
        console.log(messageOrSupplier ?? '', ...optionalParams);
    }
    else {
        const returnValue = messageOrSupplier();
        console.log(...(Array.isArray(returnValue) ? returnValue : [returnValue]));
    }

    // console.log(
    //     ...(typeof messageOrSupplier != 'function'
    //         ? [messageOrSupplier ?? '', ...optionalParams]
    //         : arrayify(messageOrSupplier())
    // );

}

/**
 * Prints the specified message or data to `stdout`
 * with newline if {@link useVerboseDataLogging Verbose Data Logging is Enabled}.
 * 
 * Otherwise, calling this function has no effect.
 * 
 * @param message           The message or data to be printed to the console.
 * @param optionalParams    Additional arguments to be passed to {@link console.log `console.log()`}.
 * 
 * @apistatus               ✔️ **Public**
 * @since                   `v1`
 */
export function verboseDataLog ( message?: unknown, ...optionalParams: unknown[] ): void;
/**
 * Prints the messages or data returned by the specified `supplier` function to `stdout`
 * with newline if {@link useVerboseDataLogging Verbose Data Logging is Enabled}.
 * 
 * Otherwise, calling this function has no effect.
 * 
 * @param supplier  The {@link LogSupplierFunction Supplier Function} responsible for supplying
 *                  the messages or data to be printed to the console.
 * 
 *                  The `supplier` function will only be invoked if
 *                  {@link useVerboseDataLogging Verbose Data Logging is Enabled}.
 * 
 * @apistatus       ✔️ **Public**
 * @since           `v1`
 */
export function verboseDataLog ( supplier: LogSupplierFunction ): void;
export function verboseDataLog <
    T extends LogSupplierFunction | unknown,
    U extends (T extends LogSupplierFunction ? [] : unknown[])
> ( messageOrSupplier?: T, ...optionalParams: U ): void {

    if (!useVerboseDataLogging())
        return;
    
    if (typeof messageOrSupplier != 'function') {
        console.log(messageOrSupplier ?? '', ...optionalParams);
    }
    else {
        const returnValue = messageOrSupplier();
        console.log(...(Array.isArray(returnValue) ? returnValue : [returnValue]));
    }

    // console.log(
    //     ...(typeof messageOrSupplier != 'function'
    //         ? [messageOrSupplier ?? '', ...optionalParams]
    //         : arrayify(messageOrSupplier())
    // );
}


/* Date-Time Utilities */

dayjs.extend(AdvancedFormat);
dayjs.extend(DurationPlugin);
dayjs.extend(RelativeTimePlugin, {
    // rounding: ( num: number ) => numberToPrecision(num, 2),
    rounding: ( num ) => num,
    thresholds: [
        { l: 's', r: 59, d: 'Second' },
        { l: 'm', r: 119 },
        { l: 'mm', r: 59, d: 'Minute' },
        { l: 'h', r: 119 },
        { l: 'hh', r: 23, d: 'Hour' },
        { l: 'd', r: 47 },
        { l: 'dd', r: 29, d: 'Day' },
        { l: 'M', r: 59 },
        { l: 'MM', r: 11, d: 'Month' },
        { l: 'y', r: 23 },
        { l: 'yy', d: 'Year' }
    ]
});
dayjs.extend(TimezonePlugin);
dayjs.extend(UpdateLocalePlugin);

dayjs.updateLocale('en', {
    relativeTime: (() => {

        const UNITS = {
            s: 'Second',
            m: 'Minute',
            h: 'Hour',
            d: 'Day',
            M: 'Month',
            y: 'Year'
        } as const;
        const DIVISORS = {
            m: 60,
            h: 60,
            d: 24,
            M: 30,
            y: 12
        } as const;

        const getPlural = ( word: string, count: number ): string => `${word}${count != 1 ? 's' : ''}`;

        const handler = (
            number: number,
            withoutSuffix: boolean,
            key: 's' | 'm' | 'mm' | 'h' | 'hh' | 'd' | 'dd' | 'M' | 'MM' | 'y' | 'yy',
            isFuture: boolean
        ): string => {
            const units: (typeof UNITS)[keyof typeof UNITS] = UNITS[key[0]];
            const subUnits: (typeof UNITS)[keyof typeof UNITS] | null = (() => {

                const UNIT_KEYS = Object.keys(UNITS);

                for (let i = 1; i < UNIT_KEYS.length; i++) {
                    if (UNIT_KEYS[i] == key[0])
                        return UNITS[UNIT_KEYS[i - 1]];
                }

                return null;

            })();
            const numberIsInteger = (key.length == 1 && key != 's');
            
            // if (key == 's')
            //     return `${Math.round(number)} ${getPlural(units, Math.round(number))}`;

            const divisor = (() => {

                if (numberIsInteger)
                    return DIVISORS[key[0]];

                const UNIT_KEYS = Object.keys(UNITS);

                for (let i = (UNIT_KEYS.length - 1); i >= 0; i--) {
                    if (UNIT_KEYS[i] == key[0])
                        return UNITS[UNIT_KEYS[i + 1]];
                }

                return null;

            })();
            let primary = Math.floor(
                numberIsInteger
                    ? (number / divisor)
                    : number
            );
            let secondary = Math.floor(
                numberIsInteger
                    ? (number % divisor)
                    : (number - primary) * (key[0] != 's' ? DIVISORS[key[0]] : 1)
                
            );

            return (
                (secondary == 0 || key == 's')
                    ? `${primary} ${getPlural(units, primary)}`
                    : `${primary} ${getPlural(units, primary)}, ${secondary} ${getPlural(subUnits!, secondary)}`
            );

        };

        return {
            future: "in %s",
            past: "%s Ago",
            s: handler,
            m: handler,
            mm: handler,
            h: handler,
            hh: handler,
            d: handler,
            dd: handler,
            M: handler,
            MM: handler,
            y: handler,
            yy: handler
        };

    })()
});

export {
    /**
     * > The minimalist JavaScript library that parses, validates, manipulates,
     * > and displays dates and times for modern browsers with a largely Moment.js-compatible API.
     * > 
     * > https://day.js.org/
     * 
     * ## Imported Plugins
     * - [Advanced Format](https://day.js.org/docs/plugin/advanced-format)
     * - [Duration](https://day.js.org/docs/plugin/duration)
     * - [RelativeTime](https://day.js.org/docs/plugin/relative-time)
     * - [Timezones](https://day.js.org/docs/plugin/timezones)
     * - [UpdateLocale](https://day.js.org/docs/plugin/update-locale)
     * 
     * ## Relative / Humanized Time
     * For operations that return a *Relative Time String*, including
     * {@link dayjs.Dayjs.prototype.from `from()`}, {@link dayjs.Dayjs.prototype.fromNow `fromNow()`},
     * {@link dayjs.Dayjs.prototype.to `to()`}, {@link dayjs.Dayjs.prototype.toNow `toNow()`},
     * and {@link Duration.humanize `humanize()`}, the returned strings utilize
     * a custom format containing the *Current Units* and *Previous Units* (if applicable).
     * 
     * Some examples include:
     * - `42 Seconds`
     * - `1 Minute`
     * - `21 Minutes, 42 Seconds`
     * - `6 Hours`
     * - `12 Hours, 12 Minutes`
     * - `1 Day`
     * - `2 Days, 23 Hours`
     * - `1 Month`
     * - `4 Months, 1 Day`
     * - `1 Year`
     * - `1 Year, 6 Months`
     * 
     * @apistatus   ✔️ **Public**
     * @since       `v1`
     * 
     * @see {@link getDisplayTimestampString `getDisplayTimestampString()`}
     * @see {@link DateType}
     */
    dayjs
};


/* Basic Type Types */

/**
 * A union type containing the types that can be used
 * for keys in an object.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 */
export type ObjectKey = string | number | symbol;

/**
 * A union comprised of the types that are
 * considered to be *Nullable*, or a union
 * of just `undefined` and `null`.
 * 
 * `Nullable` types are considered to be {@link Primitive},
 * and {@link NonObject} types as well.
 * 
 * @apistatus   🧪 *Experimental*
 * @since       `v1`
 * 
 * @see {@link Primitive}
 * @see {@link NonObject}
 * @see {@link isNullable `isNullable()`}
 */
export type Nullable = undefined | null;

/**
 * A union comprised of the [Primitive Types](https://developer.mozilla.org/docs/Glossary/Primitive),
 * or a union of all non-`object` types.
 * 
 * ## Type Assignability
 * | Type               | {@link Primitive} | {@link ObjectBacked} | {@link ObjectLike} | {@link TrueObject} | {@link NonObject} |
 * | ------------------ | ----------------- | -------------------- | ------------------ | ------------------ | ----------------- |
 * | {@link Nullable}   | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `string`           | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `number`           | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `bigint`           | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `symbol`           | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `boolean`          | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `any[]`            | ❌               | ✔️                   | ✔️                | ❌                 | ✔️               |
 * | `Function`         | ❌               | ✔️                   | ✔️                | ❌                 | ✔️               |
 * | {@link TrueObject} | ❌               | ❌                   | ✔️                | ✔️                 | ❌               |
 * | `object`           | ❌               | ✔️                   | ✔️                | ✔️                 | ✔️               |
 * 
 * Under this model, the `any` type can be thought of
 * as a union of `Primitive` and `object` and
 * `Primitive` can be thought of as the result of
 * {@link Exclude excluding} `object` from `any`:
 * ```ts
 * // Note that these types would *not* work at runtime.
 * type any = Primitive | object;
 * type Primitive = Exclude<any, object>;
 * ```
 * 
 * `Primitive` types are considered to be {@link NonObject} types as well.
 * 
 * @apistatus   🧪 *Experimental*
 * @since       `v1`
 * 
 * @see {@link Nullable}
 * @see {@link ObjectBacked}
 * @see {@link NonObject}
 * @see {@link TrueObject}
 */
export type Primitive = (string | number | bigint | symbol | boolean | Nullable);
/**
 * A union comprised of the types that are
 * *Object-Backed*, or a union of types that are backed by objects
 * at runtime and assignable to the `object` type but are not necessarily
 * used as key-value objects.
 * 
 * Not to be confused with {@link ObjectLike}, which is a union
 * of types that are either {@link TrueObject "True" Objects} or
 * are `ObjectBacked`.
 * 
 * ## Type Assignability
 * | Type               | {@link Primitive} | {@link ObjectBacked} | {@link ObjectLike} | {@link TrueObject} | {@link NonObject} |
 * | ------------------ | ----------------- | -------------------- | ------------------ | ------------------ | ----------------- |
 * | {@link Nullable}   | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `string`           | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `number`           | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `bigint`           | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `symbol`           | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `boolean`          | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `any[]`            | ❌               | ✔️                   | ✔️                | ❌                 | ✔️               |
 * | `Function`         | ❌               | ✔️                   | ✔️                | ❌                 | ✔️               |
 * | {@link TrueObject} | ❌               | ❌                   | ✔️                | ✔️                 | ❌               |
 * | `object`           | ❌               | ✔️                   | ✔️                | ✔️                 | ✔️               |
 * 
 * Under this model, the `object` type can be thought of
 * as a union of `ObjectBacked`, {@link TrueObject}, and `null`,
 * while `ObjectBacked` can be thought of as the result of
 * {@link Exclude excluding} `TrueObject` and `null` from `object`:
 * ```ts
 * // Note that these types would *not* work at runtime.
 * type object = ObjectBacked | TrueObject | null;
 * type ObjectBacked = Exclude<object, TrueObject | null>;
 * ```
 * 
 * `ObjectBacked` types are considered to be {@link NonObject} types as well.
 * 
 * @apistatus   🧪 *Experimental*
 * @since       `v1`
 * 
 * @see {@link TrueObject}
 * @see {@link NonObject}
 * @see {@link ObjectLike}
 */
export type ObjectBacked = unknown[] | Function;
/**
 * An object type intended to only match objects that are actually intended
 * to be used as key-value objects while excluding {@link ObjectBacked Object-Like Types}.
 * 
 * ## Type Assignability
 * | Type               | {@link Primitive} | {@link ObjectBacked} | {@link ObjectLike} | {@link TrueObject} | {@link NonObject} |
 * | ------------------ | ----------------- | -------------------- | ------------------ | ------------------ | ----------------- |
 * | {@link Nullable}   | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `string`           | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `number`           | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `bigint`           | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `symbol`           | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `boolean`          | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `any[]`            | ❌               | ✔️                   | ✔️                | ❌                 | ✔️               |
 * | `Function`         | ❌               | ✔️                   | ✔️                | ❌                 | ✔️               |
 * | {@link TrueObject} | ❌               | ❌                   | ✔️                | ✔️                 | ❌               |
 * | `object`           | ❌               | ✔️                   | ✔️                | ✔️                 | ✔️               |
 * 
 * Under this model, the `object` type can be thought of
 * as a union of `TrueObject`, {@link ObjectBacked}, and `null`,
 * while `TrueObject` can be thought of as the result of
 * {@link Exclude excluding} `ObjectLike` and `null` from `object`:
 * ```ts
 * // Note that these types would *not* work at runtime.
 * type object = TrueObject | ObjectLike | null;
 * type TrueObject = Exclude<object, ObjectLike | null>;
 * ```
 * 
 * @apistatus   🧪 *Experimental*
 * @since       `v1`
 * 
 * @see {@link NonObject}
 * @see {@link ObjectBacked}
 */
export type TrueObject = Record<ObjectKey, any>;

/**
 * A union comprised of the *Non-Object Types*, or a union of types that
 * are either {@link Primitive Primitive Types} or {@link ObjectBacked Object-Like Types}
 * that are backed by objects at runtime and assignable to the `object` type but
 * are not necessarily being used as key-value objects.
 * 
 * ## Type Assignability
 * | Type               | {@link Primitive} | {@link ObjectBacked} | {@link ObjectLike} | {@link TrueObject} | {@link NonObject} |
 * | ------------------ | ----------------- | -------------------- | ------------------ | ------------------ | ----------------- |
 * | {@link Nullable}   | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `string`           | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `number`           | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `bigint`           | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `symbol`           | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `boolean`          | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `any[]`            | ❌               | ✔️                   | ✔️                | ❌                 | ✔️               |
 * | `Function`         | ❌               | ✔️                   | ✔️                | ❌                 | ✔️               |
 * | {@link TrueObject} | ❌               | ❌                   | ✔️                | ✔️                 | ❌               |
 * | `object`           | ❌               | ✔️                   | ✔️                | ✔️                 | ✔️               |
 * 
 * Under this model, the `any` type can be thought of
 * as a union of `NonObject` and {@link TrueObject} and
 * `NonObject` can be thought of as the result of
 * {@link Exclude excluding} `TrueObject` from `any`:
 * ```ts
 * // Note that these types would *not* work at runtime.
 * type any = NonObject | TrueObject;
 * type NonObject = Exclude<any, TrueObject>;
 * ```
 * 
 * @apistatus   🧪 *Experimental*
 * @since       `v1`
 * 
 * @see {@link Primitive}
 * @see {@link ObjectBacked}
 * @see {@link TrueObject}
 */
export type NonObject = Primitive | ObjectBacked;
/**
 * A union comprised of the types that are
 * *Object-Like*, or a union of types that are either
 * {@link TrueObject "True" Objects} or are {@link ObjectBacked Object-Backed Types}.
 * 
 * Not to be confused with {@link ObjectBacked}, which is a union
 * of types that are backed by objects at runtime and assignable
 * to the `object` type but are not necessarily used as key-value objects.
 * 
 * This type is almost identical to the generic `object` type with
 * the difference being that `null` is **not** assignable to `ObjectLike`
 * but *is* assignable to `object`.
 * 
 * ## Type Assignability
 * | Type               | {@link Primitive} | {@link ObjectBacked} | {@link ObjectLike} | {@link TrueObject} | {@link NonObject} |
 * | ------------------ | ----------------- | -------------------- | ------------------ | ------------------ | ----------------- |
 * | {@link Nullable}   | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `string`           | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `number`           | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `bigint`           | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `symbol`           | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `boolean`          | ✔️               | ❌                   | ❌                | ❌                 | ✔️               |
 * | `any[]`            | ❌               | ✔️                   | ✔️                | ❌                 | ✔️               |
 * | `Function`         | ❌               | ✔️                   | ✔️                | ❌                 | ✔️               |
 * | {@link TrueObject} | ❌               | ❌                   | ✔️                | ✔️                 | ❌               |
 * | `object`           | ❌               | ✔️                   | ✔️                | ✔️                 | ✔️               |
 * 
 * Under this model, the `object` type can be thought of
 * as a union of `ObjectLike` and `null` and
 * `ObjectLike` can be thought of as the result of
 * {@link Exclude excluding} `null` from `object`:
 * ```ts
 * // Note that these types would *not* work at runtime.
 * type object = ObjectLike | null;
 * type ObjectLike = Exclude<object, null>;
 * ```
 * 
 * Furthermore, the `any` type can be thought of
 * as a union of `ObjectLike` and {@link Primitive} and
 * `ObjectLike` can be thought of as the result of
 * {@link Exclude excluding} `Primitive` from `any`:
 * ```ts
 * // These types would not work at runtime either.
 * type any = ObjectLike | Primitive;
 * type Primitive = Exclude<any, Primitive>;
 * ```
 * 
 * @apistatus   🧪 *Experimental*
 * @since       `v1`
 * 
 * @see {@link TrueObject}
 * @see {@link NonObject}
 * @see {@link ObjectBacked}
 */
export type ObjectLike = ObjectBacked | TrueObject;

type TypeofTypeMap = {
    'string': string,
    'symbol': symbol,
    'number': number,
    'boolean': boolean,
    'bigint': bigint,
    'function': ( ...args: any[] ) => any,
    'null': null,
    'undefined': undefined,
    'array': any[],
    'object': object
};
/**
 * @apistatus   ❌ **Private**
 */
export type TypeofTypeString <T = any> = keyof {
    [TypeName in keyof TypeofTypeMap as (T extends TypeofTypeMap[TypeName] ? TypeName : never)]: TypeofTypeMap[TypeName];
};
/**
 * @apistatus   ❌ **Private**
 */
export type TypeofType <T = TypeofTypeString> = TypeofTypeMap[T extends keyof TypeofTypeMap ? T : never];

/**
 * Check if `obj` is a {@link TrueObject}.
 * 
 * @param obj   The value being evaluated.
 * 
 * @returns     `true` if `object` meets the following requirements:
 *              - Has a type of `object`.
 *              - Is not an {@link Array}
 *              - Is not a {@link Function}
 *              - Is not `null`.
 * 
 *              Otherwise, returns `false`.
 * 
 * @apistatus   🧪 *Experimental*
 * @since       `v1`
 * 
 * @see {@link TrueObject}
 */
export function isTrueObject ( obj: unknown ): obj is TrueObject {

    return ( obj !== null && typeof obj == 'object' && !Array.isArray(obj) );

}


/* Miscellaneous Definition Types */

/**
 * A type defining the interface used for creating, modifying,
 * querying, and manipulating timestamps.
 * 
 * In general, this type will just be an alias to a Date-Time Class,
 * such as {@link Date} or {@link dayjs.Dayjs Dayjs}.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 */
export type DateType = dayjs.Dayjs;
/**
 * A union type containing the types that can be used to
 * match one or more sequences of characters in a `string`.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 */
export type MatchType = (string | RegExp);

/**
 * A `string` type representing a number denoted by a unit of some kind.
 * 
 * For example, `20ms` or `24.57 MB/s`.
 * 
 * @apistatus   🧪 *Experimental*
 * @since       `v1`
 */
export type UnitDenominatedNumber = `${number}${'' | ' '}${string}`;
/**
 * A union type representing the directions that a *Steppable Value*
 * can be changed.
 * 
 * - `increase`: The value will increase or change in the positive direction.
 * - `decrease`: The value will decrease or change in the negative direction.
 * 
 * @apistatus   ❌ **Private**
 */
export type ValueStepDirection = 'decrease' | 'increase';

/**
 * A union of the two Wi-Fi Frequencies that can be used for the WDS Bridge.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 * 
 * @see {@link WIFI_FREQUENCY_LIST}
 */
export type WifiFrequency = `${2.4 | 5}GHz`;

/**
 * A `string` type representing a Local IP Address.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 */
export type IpAddress = `192.168.${number}.${number}`;

/**
 * A `string` type representing a unique MAC Address Identifier.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 */
export type MACAddress = `${string}:${string}:${string}:${string}:${string}:${string}`;


/* Miscellaneous Type Helper Types */

/**
 * Expand `T` by one level.
 * 
 * The *recursive* variant of this type
 * is {@link ExpandObjectTypeRecursively}.
 * 
 * @example
 * type Foo = Record<string, 42>;
 * // Record<string, 42>
 * 
 * type Bar = ExpandObjectType<Foo>;
 * // {
 * //    [X: string]: 42
 * // }
 * 
 * @template T  The object type being expanded.
 * 
 * @apistatus   ❌ **Private**
 * 
 * @link [Source](https://stackoverflow.com/questions/57683303/how-can-i-see-the-full-expanded-contract-of-a-typescript-type#answer-57683652)
 * @see {@link ExpandObjectTypeRecursively}
 */
export type ExpandObjectType <T> = T extends infer O
    ? { [K in keyof O]: O[K] }
    : never;

/**
 * Expand `T` recursively.
 * 
 * The *non-recursive* variant of this type
 * is {@link ExpandObjectType}.
 * 
 * @example
 * type Foo = Record<string, Record<string, 42>>;
 * // Record<string, Record<string, 42>>
 * 
 * type Bar = ExpandObjectType<Foo>;
 * // {
 * //    [X: string]: Record<string, 42>
 * // }
 * 
 * type Baz = ExpandObjectTypeRecursively<Foo>;
 * // {
 * //    [X: string]: {
 * //       [X: string]: 42
 * //    }
 * // }
 * 
 * @warning
 * **Do not** use this type as part of another type
 * that is itself *recursive*. That is, unless you are intentionally
 * trying to construct a type that obliterates the performance
 * of the typescript language server.
 * 
 * E.g.,
 * ```ts
 * // Types like this will likely slow the typescript language server
 * // to a halt when used, especially with complex nested objects.
 * type MyType <T extends object> = ExpandObjectTypeRecursively<{
 *    [K in keyof T]: T[K] extends object ? MyType<T[K]> : T[K]
 * }>;
 * ```
 * 
 * If such functionality is truly needed, consider using {@link ExpandObjectType}
 * in the recursive type instead. E.g.,
 * ```ts
 * // Types like this will likely have better performance than
 * // when using ExpandObjectTypeRecursively.
 * type MyType <T extends object> = ExpandObjectType<{
 *    [K in keyof T]: T[K] extends object ? MyType<T[K]> : T[K]
 * }>;
 * ```
 *  
 * @template T  The object type being expanded.
 * 
 * @apistatus   ❌ **Private**
 * 
 * @link [Source](https://stackoverflow.com/questions/57683303/how-can-i-see-the-full-expanded-contract-of-a-typescript-type#answer-57683652)
 * @see {@link ExpandObjectType}
 */
export type ExpandObjectTypeRecursively <T> = T extends object
  ? T extends infer O
    ? {
        [K in keyof O]: O[K] extends object
            ? ExpandObjectTypeRecursively<O[K]>
            : O[K]
    }
    : never
  : T;

/**
 * A union type comprised of `T` and an array of `T`.
 * 
 * This type is primarily used as a function parameter or return type
 * that can be either a single value or an array of values.
 * 
 * The similar variant of this type for promises is {@link Promisable}.
 * 
 * @example
 * type Foo = Arrayable<boolean | 'toggle'>;
 * // boolean | 'toggle' | (boolean | 'toggle')[]
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 * 
 * @see {@link Promisable}
 */
export type Arrayable <T> = T | T[];


/* Promise and Asynchronous Operation Types */

/**
 * A union type comprised of `T` and a promise that resolves to `T`.
 * 
 * This type is primarily used for function parameters accepting
 * a value or a promise to return a value, as well as for the
 * return type of functions that can operate either synchronously
 * or asynchronously and may return either a particular value
 * or a promise that resolves to a value.
 * 
 * The similar variant of this type for arrays is {@link Arrayable}.
 * 
 * @example
 * type Foo = Promisable<boolean | 'toggle'>;
 * // boolean | 'toggle' | Promise<boolean | 'toggle'>
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 * 
 * @see {@link Arrayable}
 */
export type Promisable <T> = T | Promise<T>;

/**
 * A union type containing `T` and `'aborted'`, a string value
 * indicating that the operation was {@link AbortController.prototype.abort aborted early}.
 * 
 * @example
 * type Foo = AbortableOperation<boolean | 'toggle'>;
 * // boolean | 'toggle' | 'aborted'
 * 
 * @template T  The type or types returned by the operation when it is not aborted early.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 * 
 * @see {@link AbortableAsyncOperation}
 */
export type AbortableOperation <T> = T | 'aborted';
/**
 * A promise type that resolves to a union containing `T` and `'aborted'`, a string value
 * indicating that the asynchronous operation was {@link AbortController.prototype.abort aborted early}.
 * 
 * This type is simply the promisified variant of {@link AbortableOperation}.
 * 
 * @example
 * type Foo = AbortableAsyncOperation<boolean | 'toggle'>;
 * // Promise<boolean | 'toggle' | 'aborted'>
 * 
 * @template T  The type or types the asynchronous operation resolves to when it is not aborted early.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 * 
 * @see {@link AbortableOperation}
 * @see {@link PromisableAbortableOperation}
 */
export type AbortableAsyncOperation <T> = Promise< AbortableOperation<T> >;
/**
 * A union type containing a union containing `T` and `'aborted'`, a string value
 * indicating that the asynchronous operation was {@link AbortController.prototype.abort aborted early},
 * and a promise containing the same union of `T` and `'aborted'`.
 * 
 * This type is simply the {@link Promisable} variant of
 * {@link AbortableOperation} and {@link AbortableAsyncOperation}.
 * 
 * @example
 * type Foo = PromisableAbortableOperation<boolean | 'toggle'>;
 * // boolean | 'toggle' | 'aborted' | Promise<boolean | 'toggle' | 'aborted'>
 * 
 * @template T  The type or types the asynchronous operation resolves to when it is not aborted early.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 * 
 * @see {@link AbortableOperation}
 * @see {@link AbortableAsyncOperation}
 * @see {@link Promisable}
 */
export type PromisableAbortableOperation <T> = Promisable< AbortableOperation<T> >;


/* Inspection */

/**
 * An interface used to denote classes that provide a
 * {@link nodeInspect.custom custom inspection method}
 * for the {@link nodeInspect `util.inspect()`} function
 * to invoke when inspecting object instances of the class.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 */
export interface Inspectable {

    /**
     * The [Custom Inspection Method](https://nodejs.org/docs/latest/api/util.html#utilinspectcustom)
     * to be invoked by the {@link nodeInspect `util.inspect()`} function
     * when inspecting object instances of this class.
     * 
     * @param depth     The number of times to recurse while formatting this object.
     * 
     *                  To recurse up to the maximum call stack size, `Infinity` or `null` may be provided.
     * 
     *                  Defaults to `2`.
     * 
     * @param options   Additional {@link InspectOptionsStylized Inspection Options} used
     *                  when inspecting this object.
     * 
     * @param inspect   The {@link nodeInspect `util.inspect()`} function.
     * 
     * @returns         Typically a `string` containing the serialized and inspected object,
     *                  but can be any type that will be formatted by {@link nodeInspect `util.inspect()`}.
     */
    [nodeInspect.custom] ( depth: number, options: InspectOptionsStylized, inspect: typeof nodeInspect ): any;

}


/* General Program Constants */

/**
 * The title of the program as it is to be used as
 * the terminal title and output to the console.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 */
export const PROGRAM_TITLE = "WDS Bridge Watchdog Service";
export const PROGRAM_BUILD_TIME = await (async () => {

    try {
        let files = readdirSync('./dist', { withFileTypes: true, recursive: true });
        let promises: Promise<number>[] = [];

        for (let i = 0; i < files.length; i++) {
            if (files[i].isFile()) {
                promises.push(
                    stat(`${files[i].parentPath ?? files[i].path}/${files[i].name}`).then(
                        (stats) => stats.mtime.valueOf(),
                        (error) => {

                            console.error('Failed!', error);
                            return 0;

                        }
                    )
                );
            }
        }

        return await Promise.all(promises).then(
            (mtimes) => {

                if (mtimes.length > 0) {
                    return dayjs(mtimes.sort( (a, b) => b - a )[0]);
                }

                return null;

            }
        );

    }
    catch (error) {
        // Ignore
    }

    return null;

})();
export const PROGRAM_VERSION = await (async () => {

    const EPOCH_TIME = dayjs('2025-01-01T00:00:00z').valueOf();
    let versionStr = "";

    if (process.env.npm_package_version) {
        versionStr += process.env.npm_package_version;
    }
    else {
        try {
            const matchResults = readFileSync.toString().match(/"version": "([\d\.\-]+)"/);

            if (matchResults && matchResults[1])
                versionStr += matchResults[1];
        }
        catch (error) {
            // Ignore
        }
    }

    if (versionStr.length == 0)
        return null;

    if (PROGRAM_BUILD_TIME) {
        const timeVerStr = Math.round((PROGRAM_BUILD_TIME.valueOf() - EPOCH_TIME) / 60000)
            .toString()
            .replaceAll(/\d{4}(?!$)/g, "$&.");

        versionStr += `.${timeVerStr}`;
    }

    return versionStr;

})();

/**
 * The name of the runfile used to
 * {@link verifyOnlyOneProgramInstanceExists prevent the program from being launched simultaneously}.
 * 
 * This file is only required at runtime and will be both automatically created
 * when the program is started and automatically removed when the program is shutting down. 
 * 
 * @apistatus   ❌ **Private**
 * 
 * @see {@link verifyOnlyOneProgramInstanceExists `verifyOnlyOneProgramInstanceExists()`}
 */
export const RUNFILE_NAME = 'wdsbw.runfile';


/* Device & Connection Constants */

/**
 * A tuple containing the two Wi-Fi Frequencies that
 * can be used for the WDS Bridge.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 * 
 * @see {@link WifiFrequency}
 */
export const WIFI_FREQUENCY_LIST = ['2.4GHz', '5GHz'] as const satisfies WifiFrequency[];

/**
 * The `string` value used to represent ping results
 * that were returned in *less than* `1ms`, which is
 * the smallest value reported by the Windows `ping` function.
 * 
 * @apistatus   ❌ **Private**
 */
export const SUBMILLISECOND_PING = '<1';


/* Console TTY & Color Support */

/**
 * Indicates whether the {@link console} is an Interactive TTY Console or not.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 * 
 * @see {@link ConsoleUtils.assertIsTty `assertIsTty()`}
 */
export const isTtyConsole = (
       typeof process.stdin != 'undefined'
    && typeof process.stdout != 'undefined'
    && process.stdin.isTTY
    && process.stdout.isTTY
);
/**
 * Indicates whether the {@link console} is an {@link isTtyConsole Interactive TTY Console}
 * and has {@link process.stdout.hasColors Sufficient Color Support} or not.
 * 
 * @apistatus   ✔️ **Public**
 * @since       `v1`
 * 
 * @see {@link ConsoleUtils.assertHasColorSupport `assertHasColorSupport()`}
 */
export const consoleHasColorSupport = (isTtyConsole && process.stdout.hasColors());
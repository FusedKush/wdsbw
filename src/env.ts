/**
 * Contains all of the functionality related to the Environment Variables
 * the WDS Bridge Watchdog Program recognizes and depends on.
 * 
 * This module provides a standardized API for defining and retrieving
 * Required and Optional Environment Variables during program startup.
 * *Environment Variables*, which all have `string` values, can also be mapped
 * to arbitrary *Program Variables*, which can have any type and are translated
 * from Environment Variables to Program Variables using a user-defined {@link ProgramVariableConversionFunction *Conversion Function*}.
 * ```ts
 * const MY_ENV_VARS: EnvironmentVariableDefinitions = {
 *    variables: {
 *       FOO: {
 *          name: 'FOO',
 *          required: true,
 *          programVar: ['myEnvVars', 'foo'],
 *          programVarConversionFn: (envVarValue) => envVarValue.length()
 *       },
 *       BAR: {
 *          name: 'BAR',
 *          required: false,
 *          sensitive: true,
 *          programVar: ['myEnvVars', 'bar'],
 *          programVarDefaultValue: null
 *       }
 *    }
 * };
 * registerEnvironmentVariables(MY_ENV_VARS);
 * ```
 * 
 * While a number of {@link EnvironmentVariableManager.BASE_VARS default Environment Variables}
 * are provided by default, the existing Environment Variables allow for some limited
 * modifications to be made at runtime, as well as the ability to register
 * any number of additional Environment and Program Variables. By using the {@link EnvironmentVariableManager}
 * class, it becomes possible to easily work with custom Environment and Program Variables
 * in a type-safe manner.
 * ```ts
 * // The same object would be returned by `registerEnvironmentVariables(MY_ENV_VARS)`;
 * const myEnvVarManager = new EnvironmentVariableManager(MY_ENV_VARS);
 * const programVars = myEnvVarManager.getProgramVars();
 * 
 * const foo: number = programVars.myEnvVars.foo;
 * const bar: string | null = programVars.myEnvVars.bar;
 * ```
 * 
 * For convenience, the {@link programEnvVarManager} is provided, which contains the
 * {@link EnvironmentVariableManager} responsible for managing all of the 
 * {@link EnvironmentVariableManager.BASE_VARS default Environment Variables},
 * as well as the {@link getRawEnvVars `getRawEnvVars()`} and {@link getProgramVars `getProgramVars()`}
 * helper functions, which are aliases for the {@link EnvironmentVariableManager.getRawEnvVars `getRawEnvVars()`} 
 * and {@link EnvironmentVariableManager.getProgramVars `getProgramVars()`} instance methods
 * of {@link programEnvVarManager}, respectively. E.g.,
 * ```ts
 * getRawEnvVars();     // Equivalent to programEnvVarManager.getRawEnvVars();
 * getProgramVars();    // Equivalent to programEnvVarManager.getProgramVars();
 * ```
 * 
 * When imported, this module will automatically import the `dotenv` module,
 * allowing the `.env` file in the Current Working Directory to be
 * imported into the environment.
 * 
 * 
 * ## `env` is Deprecated
 * 
 * This module has been replaced by the `config` module,
 * which provides the same functionality of Configuration Options
 * and Program Variable Mapping with a streamlined, simplified, and more
 * powerful and expressive API.
 * 
 * As a result, the `env` module has been **deprecated**. All existing code
 * should migrate to the `config` module as soon as possible, and no new
 * code should depend on this module, as it will be removed in the future.
 * 
 * Many parts of the `env` API has direct or very similar
 * counterparts in the `config` API. For more information,
 * refer to the deprecation notice for each member
 * of the `env` API being migrated.
 * 
 * 
 * ## A Note About the {@link EnvironmentVariableManager}
 * In order to reduce overhead and the chance for bugs to occur,
 * {@link EnvironmentVariableManager} objects are simply type-safe wrappers
 * that return a reference or copy of a single object containing
 * all of the Environment and Program Variables at runtime by default.
 * This means that when changes are made to existing Environment Variables
 * and/or new Environment Variables are added, the objects returned by
 * `EnvironmentVariableManager` instances may instead be a *superset*
 * of the return type of the instance method used. E.g.,
 * ```ts
 * console.log(getRawEnvVars());
 * // Typed: {}
 * // Printed: {}
 * 
 * // Register Custom Environment Variables.
 * registerEnvironmentVariables(MY_ENV_VARS);
 * 
 * console.log(getRawEnvVars());
 * // Typed: {}
 * // Printed: { FOO: '...', BAR: null }
 * ```
 * 
 * This means that care should be exercised when sharing objects
 * containing Environment or Program Variables returned by this module
 * with untrusted code. Furthermore, when *Redacting Sensitive Properties*,
 * **all** Environment and Program Variables marked as *Sensitive* will be
 * {@link SensitiveProperties.redact redacted}, even if they are not part
 * of the `EnvironmentVariableManager` being used.
 * 
 * To retrieve objects containing *only* the base or custom
 * Environment or Program Variables, ensure you call the
 * {@link EnvironmentVariableManager} instance methods
 * with the appropriate value for the `filter` argument.
 * 
 * 
 * @deprecated Use the `config` module instead.
 */
declare module "./env.js";

import {
    type IpAddress,
    type verboseLogging,
    type verboseDataLogging,
    WifiFrequency,
    ExpandObjectType,
    ExpandObjectTypeRecursively,
    TrueObject,
} from "./common.js";
import {
    UnrecoverableError,
    ObjectUtils,
    ArrayUtils,
    LogicError,
    StringUtils,
    SensitiveProperties,
    deepClone,
    RuntimeError
} from "./utils.js";
import { RuntimeVariables } from "./runtime.js";
import { type verifyBridgeStatus } from "./reconnect-bridge/index.js";
import { type ReconnectionMethod } from "./reconnect-bridge/api/index.js";
import type * as Config from "./config.js";

// Import Environment Variables from the '.env' file if present.
import 'dotenv/config';


type UnionToIntersection<U> = (
    [U] extends [never]
        ? never
        : (U extends any ? (x: U)=>void : never) extends ((x: infer I)=>void) ? I : never
);


/* Types & Interfaces */

/**
 * A function type that can be used to transform
 * an *Environment Variable* into a *Program Variable*.
 * 
 * The return type of this function is used to determine
 * the type of the *Program Variable* at runtime.
 * 
 * Not to be confused with a {@link ComplexProgramVariableConversionFunction},
 * which is used to transform *two or more* Environment Variables
 * into a single Program Variable.
 * 
 * @deprecated          Migrate to {@link Config.ProgramConfiguration.ProgramVariableConversionFunction ProgramConfiguration.ProgramVariableConversionFunction}.
 * 
 * @template ReturnT    The return type of the Conversion Function.
 * @template EnvVarT    The type of the `envVar` argument.
 * 
 * @param envValue      The {@link EnvironmentVariableManager.getRawEnvVars Raw Environment Variable Value}.
 * @param envVar        The {@link EnvironmentVariable} being converted.
 * 
 * @returns             The type of the *Converted Program Variable*.
 * 
 * @apistatus           ⚠️ *Deprecated*
 * @since               `v1`
 * 
 * @see {@link ComplexProgramVariableConversionFunction}
 */
export type ProgramVariableConversionFunction <
    ReturnT = any,
    EnvVarT extends EnvironmentVariable = EnvironmentVariable
> = (
    envValue: (EnvVarT['required'] extends true ? string : string | null),
    envVar: EnvVarT
) => ReturnT;
/**
 * A function type that can be used to transform two or more
 * *Environment Variables* into a *Program Variable*.
 * 
 * The return type of this function is used to determine
 * the type of the *Program Variable* at runtime.
 * 
 * Note to be confused with a {@link ProgramVariableConversionFunction},
 * which is used to transform a *single* Environment Variable
 * into a corresponding Program Variable.
 * 
 * @deprecated              Migrate to {@link Config.ProgramConfiguration.ComplexProgramVariableConversionFunction ProgramConfiguration.ComplexProgramVariableFunction}.
 * 
 * @template ReturnT        The return type of the Conversion Function.
 * @template RawEnvVarsT    The type of the `rawEnvVars` argument.
 * @template ProgramVarT    The type of the `programVar` argument.
 * 
 * @param rawEnvVars        The {@link RawEnvironmentVariables Raw Environment Variable Values}.
 * @param programVar        The *Program Variable* being converted.
 * 
 * @returns                 The type of the *Converted Program Variable*.
 * 
 * @apistatus               ⚠️ *Deprecated*
 * @since                   `v1`
 * 
 * @see {@link ProgramVariableConversionFunction}
 */
export type ComplexProgramVariableConversionFunction <
    ReturnT = any,
    RawEnvVarsT extends RawEnvironmentVariables = RawEnvironmentVariables,
    ProgramVarT extends ObjectUtils.ComplexObjectKeyType = ObjectUtils.ComplexObjectKeyType
> = ( rawEnvVars: RawEnvVarsT, programVar: ProgramVarT ) => ReturnT;

/**
 * The definition of an *Environment Variable* recognized
 * by the WDS Bridge Watchdog Program.
 * 
 * Using the {@link programVar `programVar`}, {@link programVarConversionFn `programVarConversionFn`},
 * and {@link programVarDefaultValue `programVarDefaultValue`} properties, it is possible
 * to map *Environment Variables* to *Program Variables* of arbitrary shape. E.g.,
 * ```ts
 * const myEnv: EnvironmentVariable = {
 *    name: 'MY_ENV',
 *    required: false,
 *    programVar: ['myCustomEnvs', 'myEnv'],
 *    programVarConversionFn: (envValue) => envValue.length(),
 *    programVarDefaultValue: 0
 * };
 * 
 * // Produces the following Program Variable:
 * // {
 * //    myCustomEnvs: {
 * //       myEnv: number;
 * //    }
 * // }
 * ```
 * 
 * @deprecated                      Migrate to {@link Config.ProgramConfiguration.ConfigurationOption ProgramConfiguration.ConfigurationOption}.
 * 
 * Each *Template Parameter* corresponds to one of the
 * properties of this interface:
 * @template NameT                  The type of the {@link EnvironmentVariable.name `name`} property.
 * @template RequiredT              The type of the {@link required `required`} property.
 * @template SensitiveT             The type of the {@link sensitive `sensitive`} property.
 * @template ProgramVarT            The type of the {@link programVar `programVar`} property.
 * @template ConversionFnT          The type of the {@link programVarConversionFn `programVarConversionFn`} property.
 * @template ProgramVarDefaultT     The type of the {@link programVarDefaultValue `programVarDefaultValue`} property.
 *  
 * @apistatus                       ⚠️ *Deprecated*
 * @since                           `v1`
 */
export interface EnvironmentVariable <
    NameT extends string = string,
    RequiredT extends boolean | undefined = boolean | undefined,
    SensitiveT extends boolean | undefined = boolean | undefined,
    ProgramVarT extends ObjectUtils.DynamicObjectKeyType | undefined = ObjectUtils.DynamicObjectKeyType | undefined,
    ConversionFnT extends ProgramVariableConversionFunction<any, any> | undefined = (
        ProgramVarT extends ObjectUtils.DynamicObjectKeyType
            ? ProgramVariableConversionFunction<any, any> | undefined
            : undefined
    ),
    ProgramVarDefaultT = (
        ProgramVarT extends ObjectUtils.DynamicObjectKeyType
            ? (RequiredT extends true ? undefined : any)
            : undefined
    )
> {

    /**
     * The name of the *Environment Variable*.
     * 
     * E.g., `MY_ENV_VAR`
     */
    name: NameT;
    /**
     * Indicates whether or not the Environment Variable should be *Required*.
     * 
     * When *Required*, the program will fail to start unless
     * the Environment Variable has been specified with a valid value.
     * 
     * @see {@link sensitive}
     */
    required?: RequiredT;
    /**
     * Indicates whether or not the value of the Environment Variable
     * should be considered to be *Sensitive*.
     * 
     * When *Sensitive*, the value of the Environment Variable
     * and Mapped Program Variable (if specified) will be {@link SensitiveProperties.redact redacted}
     * when retrieved using the `redact` argument set to `true`.
     * 
     * @see {@link required}
     * @see {@link SensitiveProperties.redact `redact()`}
     */
    sensitive?: SensitiveT;

    /**
     * The name of the *Program Variable* the
     * Environment Variable should be mapped to.
     * 
     * Can be specified as an {@link ObjectUtils.SimpleObjectKey Simple}
     * or {@link ObjectUtils.ComplexObjectKey Complex Object Key},
     * making it possible to map Environment Variables to
     * Program Variables of any shape.
     */
    programVar?: ProgramVarT;
    /**
     * The {@link ProgramVariableConversionFunction Conversion Function}
     * responsible for transforming the *Environment Variable*
     * into the corresponding *Program Variable*.
     * 
     * For {@link required Optional Environment Variables},
     * the conversion function will only be called if the Environment Variable
     * has been specified.
     * 
     * Only applicable when {@link programVar} is defined.
     * 
     * If omitted, and {@link programVar} is defined, the
     * *Raw Environment Variable Value* will be used for the *Program Variable*.
     */
    programVarConversionFn?: ConversionFnT;
    /**
     * The value to be used if the Environment Variable
     * is not specified.
     * 
     * Only applicable when {@link programVar} is defined
     * and the Environment Variable is {@link required Required}.
     * 
     * If omitted, {@link programVar} is defined, and the Environment Variable
     * is not specified, the *Program Variable* will be `undefined`. This includes
     * *all containing objects* if they do not contain any other properties. E.g.,
     * ```ts
     * interface Example {
     *    foo: {
     *       bar?: {
     *          baz?: number;
     *       },
     *       foobar: string;
     *    }
     * }
     * ```
     */
    programVarDefaultValue?: ProgramVarDefaultT;

}
/**
 * A tuple type used to define *Complex Program Variables*
 * based on two or more *Environment Variables*.
 * 
 * *Complex Program Variables* are only needed if they are
 * dependent on *two or more Environment Variables*. If the Program Variable
 * is only dependent on a *single Environment Variable*, use the
 * {@link EnvironmentVariable.programVar `programVar`},
 * {@link EnvironmentVariable.programVarConversionFn `programVarConversionFn`},
 * and {@link EnvironmentVariable.programVarDefaultValue `programVarDefaultValue`}
 * properties of the corresponding {@link EnvironmentVariable} instead.
 * 
 * @deprecated          Migrate to {@link Config.ProgramConfiguration.ComplexProgramVariableMap}.
 * 
 * @param programVar    The name of the *Program Variable*.
 *                      
 *                      Can be specified as an {@link ObjectUtils.SimpleObjectKey Simple}
 *                      or {@link ObjectUtils.ComplexObjectKey Complex Object Key},
 *                      making it possible to map Environment Variables to
 *                      Program Variables of any shape.
 * 
 * @param conversionFn  The {@link ComplexProgramVariableConversionFunction Conversion Function}
 *                      responsible for transforming two or more *Environment Variables*
 *                      into the *Program Variable*.
 * 
 * @param sensitive     Indicates whether or not the value of the Environment Variable
 *                      should be considered to be *Sensitive*.
 *                      
 *                      When *Sensitive*, the value of the Program Variable
 *                      will be {@link SensitiveProperties.redact redacted}
 *                      when retrieved using the `redact` argument set to `true`.
 * 
 * @apistatus           ⚠️ *Deprecated*
 * @since               `v1`
 */
export type ComplexProgramVariableDefinition <ProgramVarT extends ObjectUtils.ComplexObjectKeyType = ObjectUtils.ComplexObjectKeyType> = [
    programVar: ProgramVarT,
    conversionFn: ComplexProgramVariableConversionFunction<any, any, any>,
    sensitive?: boolean
];

/**
 * An object type containing a mapping of
 * {@link EnvironmentVariable.name Environment Variable Names} to
 * the corresponding {@link EnvironmentVariable Environment Variable}.
 * 
 * @deprecated          Migrate to {@link Config.ProgramConfiguration.ConfigurationOptionMap}.
 * 
 * @template NamesT     The type of the names and keys in the object.
 * 
 * @apistatus           ⚠️ *Deprecated*
 * @since               `v1`
 */
export type EnvironmentVariableMap <NamesT extends string = string> = {
    [Name in NamesT]: EnvironmentVariable<Name>;
};
/**
 * An object type containing everything needed to define
 * one or more *Environment Variables* and *Program Variables*.
 * 
 * @deprecated                      Migrate to {@link Config.ProgramConfiguration.ProgramConfigurationDefinitions}.
 * 
 * @template EnvVarsT               The type of the {@link EnvironmentVariableDefinitions.variables `variables`} property.
 * @template ComplexProgramVarsT    The type of the {@link EnvironmentVariableDefinitions.complexProgramVars `complexProgramVars`} property.
 * 
 * @apistatus                       ⚠️ *Deprecated*
 * @since                           `v1`
 */
export type EnvironmentVariableDefinitions <
    EnvVarsT extends EnvironmentVariableMap = EnvironmentVariableMap,
    ComplexProgramVarsT extends ComplexProgramVariableDefinition[] = ComplexProgramVariableDefinition[]
> = {

    /**
     * Defines the {@link EnvironmentVariableMap Environment Variables}
     * recognized by the program and the *Program Variables* they
     * directly correspond to.
     */
    variables: EnvVarsT;
    /**
     * Defines the {@link ComplexProgramVariableDefinition Complex Program Variables}
     * derived from the values of two or more {@link EnvironmentVariableDefinitions.variables Environment Variables}.
     */
    complexProgramVars?: ComplexProgramVarsT;

};

/**
 * A helper type that extracts only the
 * {@link EnvironmentVariable.required Required Environment Variables}
 * from the designated {@link EnvironmentVariableDefinitions} object,
 * effectively excluding the *Optional Environment Variables*.
 * 
 * The inverse of this type is {@link ExcludeRequiredEnvironmentVariables},
 * while its counterpart for {@link EnvironmentVariable.sensitive Sensitive Environment Variables}
 * is {@link ExtractSensitiveEnvironmentVariables}.
 * 
 * @deprecated  This type currently has no counterpart in the `config` API.
 * 
 * @template T  The {@link EnvironmentVariableDefinitions} being processed.
 * 
 * @apistatus   ❌ **Private**
 * 
 * @see {@link ExcludeRequiredEnvironmentVariables}
 * @see {@link ExtractSensitiveEnvironmentVariables}
 */
export type ExtractRequiredEnvironmentVariables <T extends EnvironmentVariableDefinitions> = keyof {
    [Name in keyof T['variables'] as (T['variables'][Name]['required'] extends true ? Name : never)]: T['variables'][Name];
};
/**
 * A helper type that excludes the
 * {@link EnvironmentVariable.required Required Environment Variables}
 * from the designated {@link EnvironmentVariableDefinitions} object, 
 * effectively extracting only the *Optional Environment Variables*.
 * 
 * The inverse of this type is {@link ExtractRequiredEnvironmentVariables},
 * while its counterpart for {@link EnvironmentVariable.sensitive Sensitive Environment Variables}
 * is {@link ExcludeSensitiveEnvironmentVariables}.
 * 
 * @deprecated  This type currently has no counterpart in the `config` API.
 * 
 * @template T  The {@link EnvironmentVariableDefinitions} being processed.
 * 
 * @apistatus   ❌ **Private**
 * 
 * @see {@link ExtractRequiredEnvironmentVariables}
 * @see {@link ExcludeSensitiveEnvironmentVariables}
 */
export type ExcludeRequiredEnvironmentVariables <T extends EnvironmentVariableDefinitions> = keyof {
    [Name in keyof T['variables'] as (T['variables'][Name]['required'] extends true ? never : Name)]: T['variables'][Name];
};

/**
 * A helper type that extracts only the
 * {@link EnvironmentVariable.sensitive Sensitive Environment Variables}
 * from the designated {@link EnvironmentVariableDefinitions} object,
 * effectively excluding the *Non-Sensitive Environment Variables*.
 * 
 * The inverse of this type is {@link ExcludeSensitiveEnvironmentVariables},
 * while its counterpart for {@link EnvironmentVariable.required Required Environment Variables}
 * is {@link ExtractRequiredEnvironmentVariables}.
 * 
 * @deprecated  This type currently has no counterpart in the `config` API.
 * 
 * @template T  The {@link EnvironmentVariableDefinitions} being processed.
 * 
 * @apistatus   ❌ **Private**
 * 
 * @see {@link ExcludeSensitiveEnvironmentVariables}
 * @see {@link ExtractRequiredEnvironmentVariables}
 */
export type ExtractSensitiveEnvironmentVariables <T extends EnvironmentVariableDefinitions> = keyof {
    [Name in keyof T['variables'] as (T['variables'][Name]['sensitive'] extends true ? Name : never)]: T['variables'][Name];
};
/**
 * A helper type that excludes the
 * {@link EnvironmentVariable.sensitive Sensitive Environment Variables}
 * from the designated {@link EnvironmentVariableDefinitions} object, 
 * effectively extracting only the *Non-Sensitive Environment Variables*.
 * 
 * The inverse of this type is {@link ExtractSensitiveEnvironmentVariables},
 * while its counterpart for {@link EnvironmentVariable.required Required Environment Variables}
 * is {@link ExcludeRequiredEnvironmentVariables}.
 * 
 * @deprecated  Migrate to {@link Config.ProgramConfiguration.SensitiveConfigurationOptions ProgramConfiguration.SensitiveConfigurationOptions}.
 * 
 * @template T  The {@link EnvironmentVariableDefinitions} being processed.
 * 
 * @apistatus   ❌ **Private**
 * 
 * @see {@link ExtractSensitiveEnvironmentVariables}
 * @see {@link ExcludeRequiredEnvironmentVariables}
 */
export type ExcludeSensitiveEnvironmentVariables <T extends EnvironmentVariableDefinitions> = keyof {
    [Name in keyof T['variables'] as (T['variables'][Name]['sensitive'] extends true ? never : Name)]: T['variables'][Name];
};

/**
 * A helper type for the {@link ExtractSensitiveProgramVariables} type
 * responsible for recursively extracting the *Sensitive, Directly-Mapped Program Variables*
 * from the designated {@link EnvironmentVariableDefinitions} object.
 * 
 * @template T  The {@link EnvironmentVariableDefinitions} being processed.
 * 
 * @see {@link ExtractSensitiveProgramVariables}
 */
type ExtractSensitiveProgramVariablesHelper <T extends ComplexProgramVariableDefinition[]> = (
    ArrayUtils.FollowingElements<T> extends []
        ? (
            [ArrayUtils.SoleElement<T>] extends [never]
                ? []
                : ArrayUtils.SoleElement<T>[2] extends true
                    ? [ArrayUtils.SoleElement<T>[0]]
                    : []
        )
        : ArrayUtils.TupleFromTypes<
            T[0][2] extends true
                ? T[0][0]
                : [],
            ExtractSensitiveProgramVariablesHelper< ArrayUtils.FollowingElements<T> extends ComplexProgramVariableDefinition[] ? ArrayUtils.FollowingElements<T> : never >
        >
);
/**
 * A helper type that extracts only the
 * *Sensitive Program Variables from the designated
 * {@link EnvironmentVariableDefinitions} object, effectively excluding
 * the *Non-Sensitive Program Variables*.
 * 
 * The inverse of this type is {@link ExcludeSensitiveProgramVariables}.
 * 
 * @deprecated  Migrate to {@link Config.ProgramConfiguration.SensitiveProgramVariables ProgramConfiguration.SensitiveProgramVariables}.
 * 
 * @template T  The {@link EnvironmentVariableDefinitions} being processed.
 * 
 * @apistatus   ❌ **Private**
 * 
 * @see {@link ExcludeSensitiveProgramVariables}
 */
export type ExtractSensitiveProgramVariables <T extends EnvironmentVariableDefinitions> = (
    T['complexProgramVars'] extends ComplexProgramVariableDefinition[]
        ? ExtractSensitiveProgramVariablesHelper<T['complexProgramVars']>[number]
        : never
) | ({
    [
        Name in keyof T['variables'] as (
            T['variables'][Name]['sensitive'] extends true
                ? (
                    T['variables'][Name]['programVar'] extends ObjectUtils.DynamicObjectKeyType
                        ? Name
                        : never
                )
                : never
        )
    ]: T['variables'][Name]['programVar'];
} extends infer O ? O[keyof O] : never);

/**
 * A helper type for the {@link ExcludeSensitiveProgramVariables} type
 * responsible for recursively excluding the *Sensitive, Directly-Mapped Program Variables*
 * from the designated {@link EnvironmentVariableDefinitions} object.
 * 
 * @template T  The {@link EnvironmentVariableDefinitions} being processed.
 * 
 * @see {@link ExcludeSensitiveProgramVariables}
 */
type ExcludeSensitiveProgramVariablesHelper <T extends ComplexProgramVariableDefinition[]> = (
    ArrayUtils.FollowingElements<T> extends []
        ? (
            [ArrayUtils.SoleElement<T>] extends [never]
                ? []
                : ArrayUtils.SoleElement<T>[2] extends true
                    ? []
                    : [ArrayUtils.SoleElement<T>[0]]
        )
        : ArrayUtils.TupleFromTypes<
            T[0][2] extends true
                ? []
                : T[0][0],
            ExcludeSensitiveProgramVariablesHelper< ArrayUtils.FollowingElements<T> extends ComplexProgramVariableDefinition[] ? ArrayUtils.FollowingElements<T> : never >
        >
);
/**
 * A helper type that exclude the
 * *Sensitive Program Variables from the designated
 * {@link EnvironmentVariableDefinitions} object, effectively extracting
 * only the *Non-Sensitive Program Variables*.
 * 
 * The inverse of this type is {@link ExtractSensitiveProgramVariables}.
 * 
 * @deprecated  Migrate to {@link Config.ProgramConfiguration.SensitiveProgramVariables ProgramConfiguration.SensitiveProgramVariables}.
 * 
 * @template T  The {@link EnvironmentVariableDefinitions} being processed.
 * 
 * @apistatus   ❌ **Private**
 * 
 * @see {@link ExtractSensitiveProgramVariables}
 */
export type ExcludeSensitiveProgramVariables <T extends EnvironmentVariableDefinitions> = (
    T['complexProgramVars'] extends ComplexProgramVariableDefinition[]
        ? ExtractSensitiveProgramVariablesHelper<T['complexProgramVars']>[number]
        : never
) | ({
    [
        Name in keyof T['variables'] as (
            T['variables'][Name]['sensitive'] extends true
                ? never
                : (
                    T['variables'][Name]['programVar'] extends ObjectUtils.DynamicObjectKeyType
                        ? Name
                        : never
                )
        )
    ]: T['variables'][Name]['programVar'];
} extends infer O ? O[keyof O] : never);

/**
 * An object type containing the *Environment Variables*
 * corresponding to the designated {@link EnvironmentVariableDefinitions} object,
 * along with their *Raw `string` Values*.
 * 
 * The generic and weakly-typed variant of this type is {@link RawEnvironmentVariablesType},
 * while its counterpart for *Program Variables* is {@link ProgramVariables}.
 * 
 * @deprecated      Migrate to {@link Config.ProgramConfiguration.ConfigurationOptions ProgramConfiguration.ConfigurationOptions}.
 * 
 * @template DefsT  The {@link EnvironmentVariableDefinitions} being processed.
 * 
 * @apistatus       ⚠️ *Deprecated*
 * @since           `v1`
 * 
 * @see {@link RawEnvironmentVariablesType}
 * @see {@link ProgramVariables}
 */
export type RawEnvironmentVariables <DefsT extends EnvironmentVariableDefinitions = EnvironmentVariableManager.BaseVarsType> = {
    [Name in keyof DefsT['variables']]: (
        DefsT['variables'][Name]['required'] extends true
            ? string
            : string | null
    )
};
/**
 * An object type containing *Environment Variables*
 * along with their *Raw `string` Values*.
 * 
 * This is the generic and weakly-typed variant of {@link RawEnvironmentVariables},
 * while its counterpart for *Program Variables* is {@link ProgramVariablesType}.
 * 
 * @deprecated      Migrate to {@link Config.ProgramConfiguration.ConfigurationOptions ProgramConfiguration.ConfigurationOptions}.
 * 
 * @apistatus       ⚠️ *Deprecated*
 * @since           `v1.1`
 * 
 * @see {@link RawEnvironmentVariables}
 * @see {@link ProgramVariablesType}
 */
export type RawEnvironmentVariablesType = Record<string, string | null>;

/**
 * An object type containing the *Program Variables*
 * corresponding to the designated {@link EnvironmentVariableDefinitions} object,
 * along with their *Values*.
 * 
 * The generic and weakly-typed variant of this type is {@link ProgramVariablesType},
 * while its counterpart for *Program Variables* is {@link RawEnvironmentVariables}.
 * 
 * @deprecated      Migrate to {@link Config.ProgramConfiguration.ProgramVariables ProgramConfiguration.ProgramVariables}.
 * 
 * @template DefsT  The {@link EnvironmentVariableDefinitions} being processed.
 * 
 * @apistatus       ⚠️ *Deprecated*
 * @since           `v1`
 * 
 * @see {@link ProgramVariablesType}
 * @see {@link RawEnvironmentVariables}
 */
export type ProgramVariables <DefsT extends EnvironmentVariableDefinitions = EnvironmentVariableManager.BaseVarsType> = (
    ((
        {
            [Name in keyof DefsT['variables'] as (DefsT['variables'][Name]['programVar'] extends ObjectUtils.DynamicObjectKeyType ? Name : never)]: (
                DefsT['variables'][Name]['programVar'] extends ObjectUtils.DynamicObjectKeyType
                    ? MakePartialObjectsOptional<
                        ObjectUtils.RecordNestedObject<
                            DefsT['variables'][Name]['programVar'],
                            (
                                DefsT['variables'][Name]['programVarConversionFn'] extends ProgramVariableConversionFunction
                                    ? ReturnType<DefsT['variables'][Name]['programVarConversionFn']>
                                    : (DefsT['variables'][Name]['required'] extends true ? string : string | null)
                            ) extends infer T
                                ? (
                                    DefsT['variables'][Name]['required'] extends true
                                        ? T
                                        : (
                                            unknown extends DefsT['variables'][Name]['programVarDefaultValue']
                                                ? T | undefined
                                                : T | DefsT['variables'][Name]['programVarDefaultValue']
                                        )
                                )
                                : never
                        >
                    >
                    : never 
            )
        } extends infer O
            ? O[keyof O]
            : never
    ) | (
        {
            [Index in keyof DefsT['complexProgramVars'] as Index extends `${number}` ? Index : never]: (
                DefsT['complexProgramVars'][Index] extends ComplexProgramVariableDefinition
                    ? ObjectUtils.RecordNestedObject<
                        DefsT['complexProgramVars'][Index][0],
                        ReturnType<DefsT['complexProgramVars'][Index][1]>
                    >
                    : never
            )
        } extends infer O
            ? O[keyof O]
            : never
    )) extends infer U
        ? (
            [U] extends [never]
                ? {}
                : (
                    ExpandObjectTypeRecursively<UnionToIntersection<U>> extends infer O
                        ? (
                            unknown extends O
                                ? {}
                                : O
                        )
                        : {}
                )
        )
        : {}
);
/**
 * An object type containing *Program Variables*
 * along with their *Values*.
 * 
 * This is the generic and weakly-typed variant of {@link ProgramVariables},
 * while its counterpart for *Program Variables* is {@link RawEnvironmentVariablesType}.
 * 
 * @deprecated      Migrate to {@link Config.ProgramConfiguration.ProgramVariables ProgramConfiguration.ProgramVariables}.
 * 
 * @apistatus       ⚠️ *Deprecated*
 * @since           `v1.1`
 * 
 * @see {@link ProgramVariables}
 * @see {@link RawEnvironmentVariablesType}
 */
export type ProgramVariablesType = TrueObject;

/**
 * A helper type that makes all of the {@link ObjectUtils.ComplexObject Complex Objects}
 * in type `T` {@link Optional} if all of their *properties* are themselves *Optional*.
 * 
 * @example
 * type Foobar = {
 *    foo: {
 *       bar?: 42;
 *       baz?: 'hi!';
 *    };
 *    bar: {
 *       foo?: true;
 *       baz: null
 *    }
 * };
 * 
 * MakePartialObjectsOptional<Foobar>
 * // Returns: {
 * //    foo?: {
 * //       bar?: 42;
 * //       baz?: 'hi!';
 * //    };
 * //    bar: {
 * //       foo?: true;
 * //       baz: null
 * //    }
 * // }
 * 
 * @deprecated  Migrate to {@link ObjectUtils.MakeOptionalObjectsOptional}.
 * 
 * @template T  The object being processed.
 * 
 * @apistatus   ❌ **Private**
 */
export type MakePartialObjectsOptional <T extends object> = ExpandObjectType<{
    [
        K in keyof T as T[K] extends object
            ? (keyof { [K2 in keyof T[K] as [Extract<T[K][K2], undefined>] extends [never] ? K2 : never]: T[K][K2] } extends never
                ? never
                : K
            )
            : K
    ]: (T[K] extends object ? MakePartialObjectsOptional<T[K]> : T[K])
} & {
    [
        K in keyof T as T[K] extends object
            ? (keyof { [K2 in keyof T[K] as [Extract<T[K][K2], undefined>] extends [never] ? K2 : never]: T[K][K2] } extends never
                ? K
                : never
            )
            : never
    ]?: (T[K] extends object ? MakePartialObjectsOptional<T[K]> : T[K])
}>;

/**
 * An object type defining the permitted structure
 * of a custom {@link EnvironmentVariableMap} based on `BaseT`
 * and `CustomEnvVarNamesT`.
 * 
 * While any `CustomEnvVarNamesT` not specified in `BaseT` can be
 * any type of {@link EnvironmentVariable}, the Environment Variables
 * specified in `BaseT` can only be re-specified in the
 * custom {@link EnvironmentVariableMap} if they respect
 * the existing properties. Specifically, existing properties
 * have the following restrictions when being overridden:
 * - If {@link EnvironmentVariable.required `required`} is `true`,
 *   it cannot be changed to `false`.
 * - If {@link EnvironmentVariable.sensitive `sensitive`} is `true`,
 *   it cannot be changed to `false`.
 * - If {@link EnvironmentVariable.programVar `programVar`} is specified,
 *   it cannot be changed or removed, nor can {@link EnvironmentVariable.programVarConversionFn `programVarConversionFn`}
 *   or {@link EnvironmentVariable.programVarDefaultValue `programVarDefaultValue`}.
 * 
 * @deprecated                      This type currently has no counterpart in the `config` API.
 * 
 * @template BaseT                  The base {@link EnvironmentVariableDefinitions} being overidden.
 * 
 * @template CustomEnvVarNamesT     The types of the {@link EnvironmentVariable.name names} of the
 *                                  custom {@link EnvironmentVariable Environment Variables}.
 * 
 * @apistatus                       ⚠️ *Deprecated*
 * @since                           `v1`
 * 
 * @see {@link OverridableEnvironmentVariableDefinitions}
 */
export type OverridableEnvironmentVariableMap <
    BaseT extends EnvironmentVariableDefinitions = EnvironmentVariableManager.BaseVarsType,
    CustomEnvVarNamesT extends string = string
> = {
    [Name in keyof BaseT['variables']]?: EnvironmentVariable<
        (Name extends string ? Name : never),
        (BaseT['variables'][Name]['required'] extends true ? true : boolean | undefined),
        (BaseT['variables'][Name]['sensitive'] extends true ? true : boolean | undefined),
        (BaseT['variables'][Name]['programVar'] extends ObjectUtils.DynamicObjectKeyType
            ? BaseT['variables'][Name]['programVar']
            : ObjectUtils.DynamicObjectKeyType | undefined
        ),
        (BaseT['variables'][Name]['programVar'] extends ObjectUtils.DynamicObjectKeyType
            ? BaseT['variables'][Name]['programVarConversionFn']
            : ProgramVariableConversionFunction | undefined
        ),
        (BaseT['variables'][Name]['programVar'] extends ObjectUtils.DynamicObjectKeyType
            ? BaseT['variables'][Name]['programVarDefaultValue']
            : any
        )
    >
} & EnvironmentVariableMap<CustomEnvVarNamesT>;
/**
 * An object type defining the permitted structure
 * of a custom {@link EnvironmentVariableDefinitions} object
 * based on `BaseT`, `CustomEnvVarNamesT`, and `ComplexProgramVarsT`.
 * 
 * While any `CustomEnvVarNamesT` not specified in `BaseT` can be
 * any type of {@link EnvironmentVariable}, the Environment Variables
 * specified in `BaseT` can only be re-specified in the
 * custom {@link EnvironmentVariableMap} if they respect
 * the existing properties. Specifically, existing properties
 * have the following restrictions when being overridden:
 * - If {@link EnvironmentVariable.required `required`} is `true`,
 *   it cannot be changed to `false`.
 * - If {@link EnvironmentVariable.sensitive `sensitive`} is `true`,
 *   it cannot be changed to `false`.
 * - If {@link EnvironmentVariable.programVar `programVar`} is specified,
 *   it cannot be changed or removed, nor can {@link EnvironmentVariable.programVarConversionFn `programVarConversionFn`}
 *   or {@link EnvironmentVariable.programVarDefaultValue `programVarDefaultValue`}.
 * 
 * @deprecated                      This type currently has no counterpart in the `config` API.
 * 
 * @template BaseT                  The base {@link EnvironmentVariableDefinitions} being overidden.
 * 
 * @template CustomEnvVarNamesT     The types of the {@link EnvironmentVariable.name names} of the
 *                                  custom {@link EnvironmentVariable Environment Variables}.
 * 
 * @template ComplexProgramVarsT    The {@link ComplexProgramVariableDefinition Complex Program Variable Definitions}
 *                                  being used, if applicable.
 * 
 * @apistatus                       ⚠️ *Deprecated*
 * @since                           `v1`
 * 
 * @see {@link OverridableEnvironmentVariableDefinitions}
 */
export type OverridableEnvironmentVariableDefinitions <
    BaseT extends EnvironmentVariableDefinitions = EnvironmentVariableManager.BaseVarsType,
    CustomEnvVarNamesT extends string = string,
    ComplexProgramVarsT extends ComplexProgramVariableDefinition[] | undefined = ComplexProgramVariableDefinition[] | undefined
> = {

    variables: OverridableEnvironmentVariableMap<BaseT, CustomEnvVarNamesT>;
    complexProgramVars?: ComplexProgramVarsT;

};

/**
 * A class encapsulating all of the functionality necessary
 * to query and retrieve Environment Variables
 * used by the program or by a specific module.
 * 
 * This class is primarily intended for Bridge Router
 * and Reconnection Method Modules to provide a type-safe
 * way of accessing custom Environment and Program Variables,
 * but it can be used to access the base Environment
 * and Program Variables used across the entire program.
 * 
 * 
 * ## Basic Usage
 * ```ts
 * const MY_ENV_VARS: EnvironmentVariableDefinitions = {
 *    variables: {
 *       FOO: {
 *          name: 'FOO',
 *          required: true,
 *          programVar: ['myEnvVars', 'foo'],
 *          programVarConversionFn: (envVarValue) => envVarValue.length()
 *       },
 *       BAR: {
 *          name: 'BAR',
 *          required: false,
 *          sensitive: true,
 *          programVar: ['myEnvVars', 'bar'],
 *          programVarDefaultValue: null
 *       }
 *    }
 * };
 * 
 * // The same object would be returned by `registerEnvironmentVariables(MY_ENV_VARS)`;
 * const myEnvVarManager = new EnvironmentVariableManager(MY_ENV_VARS);
 * const programVars = myEnvVarManager.getProgramVars();
 * 
 * const foo: number = programVars.myEnvVars.foo;
 * const bar: string | null = programVars.myEnvVars.bar;
 * ```
 * 
 * 
 * ## A Note About Returned Objects
 * In order to reduce overhead and the chance for bugs to occur,
 * instance of this class are essentially just type-safe wrappers
 * that return a reference or copy of a single object containing
 * all of the Environment and Program Variables at runtime by default.
 * This means that when changes are made to existing Environment Variables
 * and/or new Environment Variables are added, the objects returned by
 * `EnvironmentVariableManager` instances may instead be a *superset*
 * of the return type of the instance method used. E.g.,
 * ```ts
 * const myEnvVarManager = new EnvironmentVariableManager();
 * 
 * console.log(myEnvVarManager.getRawEnvVars());
 * // Typed: {}
 * // Printed: {}
 * 
 * // Register Custom Environment Variables.
 * registerEnvironmentVariables(MY_ENV_VARS);
 * 
 * console.log(myEnvVarManager.getRawEnvVars());
 * // Typed: {}
 * // Printed: { FOO: '...', BAR: null }
 * ```
 * 
 * This means that care should be exercised when sharing objects
 * containing Environment or Program Variables returned by instances of this class
 * with untrusted code. Furthermore, when *Redacting Sensitive Properties*,
 * **all** Environment and Program Variables marked as *Sensitive* will be
 * {@link SensitiveProperties.redact redacted}, even if they are not part
 * of the class instance being used.
 * 
 * To retrieve objects containing *only* the base or custom
 * Environment or Program Variables, ensure you call the
 * class instance methods with the appropriate value for
 * the `filter` argument.
 * 
 * @deprecated              Migrate to {@link Config.ProgramConfiguration ProgramConfiguration}.
 * 
 * @template BaseDefsT      The base {@link EnvironmentVariableDefinitions}.
 * 
 * @template CustomDefsT    The custom {@link EnvironmentVariableDefinitions}, which have
 *                          to be {@link OverridableEnvironmentVariableDefinitions compatible}
 *                          with the designated `BaseDefsT`.
 * 
 * @template DefsT          The inferred {@link EnvironmentVariableDefinitions} derived from
 *                          the designated `BaseDefsT` and `CustomDefsT`.
 * 
 * @apistatus               ⚠️ *Deprecated*
 * @since                   `v1`
 */
export class EnvironmentVariableManager <
    BaseDefsT extends EnvironmentVariableDefinitions = EnvironmentVariableManager.BaseVarsType,
    CustomDefsT extends OverridableEnvironmentVariableDefinitions<BaseDefsT> = { variables: {} },
    DefsT extends EnvironmentVariableDefinitions = {
        variables: Omit<BaseDefsT['variables'], keyof CustomDefsT['variables']> & CustomDefsT['variables'],
        complexProgramVars: ArrayUtils.TupleFromTypes<
            BaseDefsT['complexProgramVars'] extends any[] ? BaseDefsT['complexProgramVars'] : [],
            CustomDefsT['complexProgramVars'] extends any[] ? CustomDefsT['complexProgramVars'] : []
        >
    }
> {

    /* Instance Properties */

    /**
     * The *Custom {@link EnvironmentVariableDefinitions}* used to
     * construct the `EnvironmentVariableManager`.
     * 
     * To programatically retrieve these {@link EnvironmentVariableDefinitions},
     * along with the {@link baseDefinitions} and {@link definitions}
     * used to construct the `EnvironmentVariableManager`,
     * use the {@link getDefinitions `getDefinitions()`} method.
     * 
     * @see {@link baseDefinitions}
     * @see {@link definitions}
     * @see {@link getDefinitions `getDefinitions()`}
     */
    readonly customDefinitions: CustomDefsT;
    /**
     * The *Base {@link EnvironmentVariableDefinitions}* used to
     * construct the `EnvironmentVariableManager`.
     * 
     * To programatically retrieve these {@link EnvironmentVariableDefinitions},
     * along with the {@link customDefinitions} and {@link definitions}
     * used to construct the `EnvironmentVariableManager`,
     * use the {@link getDefinitions `getDefinitions()`} method.
     * 
     * @see {@link customDefinitions}
     * @see {@link definitions}
     * @see {@link getDefinitions `getDefinitions()`}
     */
    readonly baseDefinitions: BaseDefsT;
    /**
     * The *Inferred {@link EnvironmentVariableDefinitions}* derived from
     * the {@link baseDefinitions} and {@link customDefinitions} used to
     * construct the `EnvironmentVariableManager`.
     * 
     * To programatically retrieve these {@link EnvironmentVariableDefinitions},
     * along with the {@link customDefinitions} and {@link baseDefinitions}
     * used to construct the `EnvironmentVariableManager`,
     * use the {@link getDefinitions `getDefinitions()`} method.
     * 
     * @see {@link customDefinitions}
     * @see {@link baseDefinitions}
     * @see {@link getDefinitions `getDefinitions()`}
     */
    readonly definitions: DefsT;

    /**
     * An array containing the names or keys of all of
     * the {@link customDefinitions *Custom Program Variables*}.
     * 
     * To programatically retrieve these Program Variable Keys
     * along with the {@link baseProgramVarKeys} and {@link programVarKeys},
     * use the {@link getProgramVarKeys `getProgramVarKeys()`} method.
     * 
     * @see {@link baseProgramVarKeys}
     * @see {@link programVarKeys}
     * @see {@link getProgramVarKeys `getProgramVarKeys()`}
     */
    readonly customProgramVarKeys: ObjectUtils.ComplexObjectKey<ProgramVariables<CustomDefsT>>[] = [];
    /**
     * An array containing the names or keys of all of
     * the {@link baseDefinitions *Base Program Variables*}.
     * 
     * To programatically retrieve these Program Variable Keys
     * along with the {@link customProgramVarKeys} and {@link programVarKeys},
     * use the {@link getProgramVarKeys `getProgramVarKeys()`} method.
     * 
     * @see {@link baseProgramVarKeys}
     * @see {@link programVarKeys}
     * @see {@link getProgramVarKeys `getProgramVarKeys()`}
     */
    readonly baseProgramVarKeys: ObjectUtils.ComplexObjectKey<ProgramVariables<BaseDefsT>>[] = [];
    /**
     * An array containing the names or keys of all of
     * the {@link definitions *Available Program Variables*}.
     * 
     * To programatically retrieve these Program Variable Keys
     * along with the {@link customProgramVarKeys} and {@link baseProgramVarKeys},
     * use the {@link getProgramVarKeys `getProgramVarKeys()`} method.
     * 
     * @see {@link customProgramVarKeys}
     * @see {@link baseProgramVarKeys}
     * @see {@link getProgramVarKeys `getProgramVarKeys()`}
     */
    readonly programVarKeys: ObjectUtils.ComplexObjectKey<ProgramVariables<DefsT>>[] = [];

    /**
     * An array containing the {@link EnvironmentVariable.name names} of all of the
     * *{@link customDefinitions Custom} {@link EnvironmentVariable.required Required Environment Variables}*.
     * 
     * To programatically retrieve these Environment Variable Names
     * along with the {@link baseRequiredEnvVars} and {@link requiredEnvVars},
     * use the {@link getRequiredEnvVars `getRequiredEnvVars()`} method.
     * 
     * @see {@link baseRequiredEnvVars}
     * @see {@link requiredEnvVars}
     * @see {@link getRequiredEnvVars `getRequiredEnvVars()`}
     */
    readonly customRequiredEnvVars: ExtractRequiredEnvironmentVariables<CustomDefsT>[] = [];
    /**
     * An array containing the {@link EnvironmentVariable.name names} of all of the
     * *{@link baseDefinitions Base} {@link EnvironmentVariable.required Required Environment Variables}*.
     * 
     * To programatically retrieve these Environment Variable Names
     * along with the {@link customRequiredEnvVars} and {@link requiredEnvVars},
     * use the {@link getRequiredEnvVars `getRequiredEnvVars()`} method.
     * 
     * @see {@link customRequiredEnvVars}
     * @see {@link requiredEnvVars}
     * @see {@link getRequiredEnvVars `getRequiredEnvVars()`}
     */
    readonly baseRequiredEnvVars: ExtractRequiredEnvironmentVariables<BaseDefsT>[] = [];
    /**
     * An array containing the {@link EnvironmentVariable.name names} of all of the
     * *{@link definitions Available} {@link EnvironmentVariable.required Required Environment Variables}*.
     * 
     * To programatically retrieve these Environment Variable Names
     * along with the {@link customRequiredEnvVars} and {@link baseRequiredEnvVars},
     * use the {@link getRequiredEnvVars `getRequiredEnvVars()`} method.
     * 
     * @see {@link customRequiredEnvVars}
     * @see {@link baseRequiredEnvVars}
     * @see {@link getRequiredEnvVars `getRequiredEnvVars()`}
     */
    readonly requiredEnvVars: ExtractRequiredEnvironmentVariables<DefsT>[] = [];

    /**
     * An array containing the {@link EnvironmentVariable.name names} of all of the
     * *{@link customDefinitions Custom} {@link EnvironmentVariable.required Optional Environment Variables}*.
     * 
     * To programatically retrieve these Environment Variable Names
     * along with the {@link baseOptionalEnvVars} and {@link optionalEnvVars},
     * use the {@link getOptionalEnvVars `getOptionalEnvVars()`} method.
     * 
     * @see {@link baseOptionalEnvVars}
     * @see {@link optionalEnvVars}
     * @see {@link getOptionalEnvVars `getOptionalEnvVars()`}
     */
    readonly customOptionalEnvVars: ExcludeRequiredEnvironmentVariables<CustomDefsT>[] = [];
    /**
     * An array containing the {@link EnvironmentVariable.name names} of all of the
     * *{@link baseDefinitions Base} {@link EnvironmentVariable.required Optional Environment Variables}*.
     * 
     * To programatically retrieve these Environment Variable Names
     * along with the {@link customOptionalEnvVars} and {@link optionalEnvVars},
     * use the {@link getOptionalEnvVars `getOptionalEnvVars()`} method.
     * 
     * @see {@link customOptionalEnvVars}
     * @see {@link optionalEnvVars}
     * @see {@link getOptionalEnvVars `getOptionalEnvVars()`}
     */
    readonly baseOptionalEnvVars: ExcludeRequiredEnvironmentVariables<BaseDefsT>[] = [];
    /**
     * An array containing the {@link EnvironmentVariable.name names} of all of the
     * *{@link definitions Available} {@link EnvironmentVariable.required Optional Environment Variables}*.
     * 
     * To programatically retrieve these Environment Variable Names
     * along with the {@link customOptionalEnvVars} and {@link baseOptionalEnvVars},
     * use the {@link getOptionalEnvVars `getOptionalEnvVars()`} method.
     * 
     * @see {@link customOptionalEnvVars}
     * @see {@link baseOptionalEnvVars}
     * @see {@link getOptionalEnvVars `getOptionalEnvVars()`}
     */
    readonly optionalEnvVars: ExcludeRequiredEnvironmentVariables<DefsT>[] = [];

    /**
     * An array containing the {@link EnvironmentVariable.name names} of all of the
     * *{@link customDefinitions Custom} {@link EnvironmentVariable.sensitive Sensitive Environment Variables}*.
     * 
     * To programatically retrieve these Environment Variable Names
     * along with the {@link baseSensitiveEnvVars} and {@link sensitiveEnvVars},
     * use the {@link getSensitiveEnvVars `getSensitiveEnvVars()`} method.
     * 
     * @see {@link baseSensitiveEnvVars}
     * @see {@link sensitiveEnvVars}
     * @see {@link getSensitiveEnvVars `getSensitiveEnvVars()`}
     */
    readonly customSensitiveEnvVars: ExtractSensitiveEnvironmentVariables<CustomDefsT>[] = [];
    /**
     * An array containing the {@link EnvironmentVariable.name names} of all of the
     * *{@link baseDefinitions Base} {@link EnvironmentVariable.sensitive Sensitive Environment Variables}*.
     * 
     * To programatically retrieve these Environment Variable Names
     * along with the {@link customSensitiveEnvVars} and {@link sensitiveEnvVars},
     * use the {@link getSensitiveEnvVars `getSensitiveEnvVars()`} method.
     * 
     * @see {@link customSensitiveEnvVars}
     * @see {@link sensitiveEnvVars}
     * @see {@link getSensitiveEnvVars `getSensitiveEnvVars()`}
     */
    readonly baseSensitiveEnvVars: ExtractSensitiveEnvironmentVariables<BaseDefsT>[] = [];
    /**
     * An array containing the {@link EnvironmentVariable.name names} of all of the
     * *{@link definitions Available} {@link EnvironmentVariable.sensitive Sensitive Environment Variables}*.
     * 
     * To programatically retrieve these Environment Variable Names
     * along with the {@link customSensitiveEnvVars} and {@link baseSensitiveEnvVars},
     * use the {@link getSensitiveEnvVars `getSensitiveEnvVars()`} method.
     * 
     * @see {@link customSensitiveEnvVars}
     * @see {@link baseSensitiveEnvVars}
     * @see {@link getSensitiveEnvVars `getSensitiveEnvVars()`}
     */
    readonly sensitiveEnvVars: ExtractSensitiveEnvironmentVariables<DefsT>[] = [];

    /**
     * An array containing the names or keys of all of the
     * {@link customDefinitions *Custom Program Variables*}.
     * 
     * To programatically retrieve these Program Variable Names
     * along with the {@link baseSensitiveProgramVars} and {@link sensitiveProgramVars},
     * use the {@link getSensitiveProgramVars `getSensitiveProgramVars()`} method.
     * 
     * @see {@link baseSensitiveProgramVars}
     * @see {@link sensitiveProgramVars}
     * @see {@link getSensitiveProgramVars `getSensitiveProgramVars()`}
     */
    readonly customSensitiveProgramVars: ExtractSensitiveProgramVariables<CustomDefsT>[] = [];
    /**
     * An array containing the names or keys of all of the
     * {@link baseDefinitions *Base Program Variables*}.
     * 
     * To programatically retrieve these Program Variable Names
     * along with the {@link customSensitiveProgramVars} and {@link sensitiveProgramVars},
     * use the {@link getSensitiveProgramVars `getSensitiveProgramVars()`} method.
     * 
     * @see {@link customSensitiveProgramVars}
     * @see {@link sensitiveProgramVars}
     * @see {@link getSensitiveProgramVars `getSensitiveProgramVars()`}
     */
    readonly baseSensitiveProgramVars: ExtractSensitiveProgramVariables<BaseDefsT>[] = [];
    /**
     * An array containing the names or keys of all of the
     * {@link definitions *Available Program Variables*}.
     * 
     * To programatically retrieve these Program Variable Names
     * along with the {@link customSensitiveProgramVars} and {@link baseSensitiveProgramVars},
     * use the {@link getSensitiveProgramVars `getSensitiveProgramVars()`} method.
     * 
     * @see {@link customSensitiveProgramVars}
     * @see {@link baseSensitiveProgramVars}
     * @see {@link getSensitiveProgramVars `getSensitiveProgramVars()`}
     */
    readonly sensitiveProgramVars: ExtractSensitiveProgramVariables<DefsT>[] = [];


    /* Class Constructors */

    /**
     * Construct a new `EnvironmentVariableManager` from the
     * designated {@link EnvironmentVariableDefinitions}.
     * 
     * @param customDefinitions     The custom {@link EnvironmentVariableDefinitions}, which have
     *                              to be {@link OverridableEnvironmentVariableDefinitions compatible}
     *                              with the `baseDefinitions` (if specified).
     * 
     * @param baseDefinitions       The base {@link EnvironmentVariableDefinitions}, if applicable.
     */
    constructor ( customDefinitions?: CustomDefsT, baseDefinitions?: BaseDefsT );
    /**
     * Construct a copy of the designated `EnvironmentVariableManager`.
     * 
     * @param otherManager  The `EnvironmentVariableManager` being cloned.
     */
    constructor ( otherManager: EnvironmentVariableManager<BaseDefsT, CustomDefsT> );
    constructor (
        customDefinitionsOrOtherManager?: CustomDefsT | EnvironmentVariableManager<BaseDefsT, CustomDefsT>,
        baseDefinitions?: BaseDefsT
    ) {

        if (!customDefinitionsOrOtherManager) {
            if (typeof programEnvVarManager != 'undefined') {
                customDefinitionsOrOtherManager = programEnvVarManager as unknown as EnvironmentVariableManager<BaseDefsT, CustomDefsT>;
            }
            else {
                customDefinitionsOrOtherManager = EnvironmentVariableManager.BASE_VARS as unknown as CustomDefsT;
                baseDefinitions = {} as BaseDefsT;
            }
        }

        if (customDefinitionsOrOtherManager instanceof EnvironmentVariableManager) {
            for (let key in this) {
                if (typeof customDefinitionsOrOtherManager[key as any] != 'function') {
                    this[key as any] = customDefinitionsOrOtherManager[key as any];
                }
            }
        }
        else {
            if (typeof baseDefinitions == 'undefined')
                baseDefinitions = EnvironmentVariableManager.BASE_VARS as unknown as BaseDefsT;
    
            for (const envVarName in customDefinitionsOrOtherManager.variables) {
                const envVar = customDefinitionsOrOtherManager.variables[envVarName];

                if ( !(envVarName in registeredEnvVars.variables) ) {
                    throw new LogicError(`The Environment Variable '${envVarName}' has not been registered yet!`);
                }

                ArrayUtils.pushUniqueValue(this[`${envVar.required ? 'required' : 'optional'}EnvVars`], envVarName as any);
                ArrayUtils.pushUniqueValue(this[`custom${envVar.required ? 'Required' : 'Optional'}EnvVars`], envVarName as any);

                if (envVar.programVar) {
                    let programVarArr = deepClone(ArrayUtils.arrayify(envVar.programVar)) as ObjectUtils.ComplexObjectKeyType;

                    while (programVarArr.length > 0) {
                        let currentKey = deepClone(programVarArr);

                        ArrayUtils.pushUniqueValue(this.programVarKeys, currentKey as ObjectUtils.ComplexObjectKey<ProgramVariables<DefsT>>);
                        ArrayUtils.pushUniqueValue(this.customProgramVarKeys, currentKey as ObjectUtils.ComplexObjectKey<ProgramVariables<CustomDefsT>>);
                        programVarArr.pop();
                    }
                }
                if (envVar.sensitive) {
                    ArrayUtils.pushUniqueValue(this.sensitiveEnvVars, envVarName as any);
                    ArrayUtils.pushUniqueValue(this.customSensitiveEnvVars, envVarName as any);
                    ArrayUtils.pushUniqueValue(sensitiveRegisteredEnvVars, envVarName);

                    if (envVar.programVar) {
                        ArrayUtils.pushUniqueValue(this.sensitiveProgramVars, envVar.programVar as ExtractSensitiveProgramVariables<DefsT>);
                        ArrayUtils.pushUniqueValue(this.customSensitiveProgramVars, envVar.programVar as ExtractSensitiveProgramVariables<CustomDefsT>);
                        ArrayUtils.pushUniqueValue(sensitiveRegisteredProgramVars, envVar.programVar as ObjectUtils.DynamicObjectKeyType);
                    }
                }
            }
            for (const envVarName in baseDefinitions.variables) {
                const envVar = baseDefinitions.variables[envVarName];

                if ( !(envVarName in registeredEnvVars.variables) ) {
                    throw new LogicError(`The Environment Variable '${envVarName}' has not been registered yet!`);
                }

                ArrayUtils.pushUniqueValue(this[`${envVar.required ? 'required' : 'optional'}EnvVars`], envVarName as any);
                ArrayUtils.pushUniqueValue(this[`base${envVar.required ? 'Required' : 'Optional'}EnvVars`], envVarName as any);

                if (envVar.programVar) {
                    let programVarArr = deepClone(ArrayUtils.arrayify(envVar.programVar)) as ObjectUtils.ComplexObjectKey<ProgramVariables<DefsT>>;

                    while (programVarArr.length > 0) {
                        let currentKey = deepClone(programVarArr);

                        ArrayUtils.pushUniqueValue(this.programVarKeys, currentKey);
                        ArrayUtils.pushUniqueValue(this.baseProgramVarKeys, currentKey);
                        programVarArr.pop();
                    }
                }
                if (envVar.sensitive) {
                    ArrayUtils.pushUniqueValue(this.sensitiveEnvVars, envVarName as any);
                    ArrayUtils.pushUniqueValue(this.baseSensitiveEnvVars, envVarName as any);

                    if (envVar.programVar) {
                        ArrayUtils.pushUniqueValue(this.sensitiveProgramVars, envVar.programVar as ExtractSensitiveProgramVariables<DefsT>);
                        ArrayUtils.pushUniqueValue(this.baseSensitiveProgramVars, envVar.programVar as ExtractSensitiveProgramVariables<CustomDefsT>);
                    }
                }
            }

            if (customDefinitionsOrOtherManager.complexProgramVars) {
                customProgramVarsLoop: for (let i = 0; i < customDefinitionsOrOtherManager.complexProgramVars.length; i++) {
                    const definition = customDefinitionsOrOtherManager.complexProgramVars[i];
                    const programVarStr = joinProgramVariables(definition[0]);
                    const programVarArray = ArrayUtils.arrayify(definition[0]) as ObjectUtils.ComplexObjectKey<ProgramVariables<DefsT>>;

                    for (let j = 0; j < registeredEnvVars.complexProgramVars.length; j++) {
                        if ( ArrayUtils.deepEquals(programVarArray, ArrayUtils.arrayify(registeredEnvVars.complexProgramVars[j][0])) ) {
                            let programVarArr = deepClone(programVarArray);

                            while (programVarArr.length > 0) {
                                let currentKey = deepClone(programVarArr);
        
                                ArrayUtils.pushUniqueValue(this.programVarKeys, currentKey);
                                ArrayUtils.pushUniqueValue(this.customProgramVarKeys, currentKey);
                                programVarArr.pop();
                            }

                            if (definition[2]) {
                                ArrayUtils.pushUniqueValue(this.sensitiveProgramVars, definition[0] as ExtractSensitiveProgramVariables<DefsT>);
                                ArrayUtils.pushUniqueValue(this.customSensitiveProgramVars, definition[0] as ExtractSensitiveProgramVariables<CustomDefsT>);
                                ArrayUtils.pushUniqueValue(sensitiveRegisteredProgramVars, definition[0] as ObjectUtils.DynamicObjectKeyType);
                            }

                            continue customProgramVarsLoop;
                        }
                    }

                    throw new LogicError(
                        `The ${StringUtils.getPlural('Complex Program Variable', programVarArray.length)}`
                            + ` ${programVarStr} ${programVarArray.length != 1 ? 'have' : 'has'}`
                            + " not been registered yet!"
                    );
                }
            }
            if (baseDefinitions.complexProgramVars) {
                baseProgramVarsLoop: for (let i = 0; i < baseDefinitions.complexProgramVars.length; i++) {
                    const definition = baseDefinitions.complexProgramVars[i];
                    const programVarStr = joinProgramVariables(definition[0]);
                    const programVarArray = ArrayUtils.arrayify(definition[0]);

                    for (let j = 0; j < registeredEnvVars.complexProgramVars.length; j++) {
                        if ( ArrayUtils.deepEquals(programVarArray, ArrayUtils.arrayify(registeredEnvVars.complexProgramVars[j][0])) ) {
                            this.programVarKeys.push(definition[0] as any);
                            this.baseProgramVarKeys.push(definition[0] as any);

                            if (definition[2]) {
                                ArrayUtils.pushUniqueValue(this.sensitiveProgramVars, definition[0] as ExtractSensitiveProgramVariables<DefsT>);
                                ArrayUtils.pushUniqueValue(this.baseSensitiveProgramVars, definition[0] as ExtractSensitiveProgramVariables<CustomDefsT>);
                            }

                            continue baseProgramVarsLoop;
                        }
                    }

                    throw new LogicError(
                        `The ${StringUtils.getPlural('Complex Program Variable', programVarArray.length)}`
                            + ` ${programVarStr} ${programVarArray.length != 1 ? 'have' : 'has'}`
                            + " not been registered yet!"
                    );
                }
            }

            this.definitions = {
                variables: Object.assign({}, customDefinitionsOrOtherManager.variables, baseDefinitions.variables),
                complexProgramVars: (customDefinitionsOrOtherManager.complexProgramVars ?? []).concat(baseDefinitions.complexProgramVars ?? []),
            } as unknown as DefsT;
            this.customDefinitions = customDefinitionsOrOtherManager;
            this.baseDefinitions = baseDefinitions;
        }

    }


    /* Instance Methods */

    /**
     * Get the {@link EnvironmentVariableDefinitions} used to
     * construct the `EnvironmentVariableManager`.
     * 
     * This method is effectively a getter for the {@link customDefinitions},
     * {@link baseDefinitions}, and {@link definitions} properties.
     * 
     * @template FilterT        The type of the `filter` argument.
     * 
     * @template ReturnDefsT    The inferred {@link EnvironmentVariableDefinitions} returned
     *                          by the method.
     * 
     * @template ReturnT        The inferred return type of the method.
     * 
     * @param filter            Indicates if and how to
     *                          {@link EnvironmentVariableManager.VariableFilterOption filter the returned definitions}.
     * 
     * @returns                 A {@link Object.freeze Frozen Object} containing the 
     *                          definitions used to construct the `EnvironmentVariableManager`,
     *                          optionally filtered according to the specified `filter`.
     * 
     * @see {@link customDefinitions}
     * @see {@link baseDefinitions}
     * @see {@link definitions}
     */
    getDefinitions = <
        FilterT extends EnvironmentVariableManager.VariableFilterOption | undefined = undefined,
        ReturnDefsT extends EnvironmentVariableDefinitions = (
            FilterT extends 'custom-vars'
                ? CustomDefsT
                : (
                    FilterT extends 'base-vars'
                        ? BaseDefsT
                        : DefsT
                )
        ),
        ReturnT extends ReturnDefsT = Readonly<ReturnDefsT>
    > ( filter?: FilterT ): ReturnT => (
        !filter
            ? this.definitions
            : (
                filter == 'custom-vars'
                    ? this.customDefinitions
                    : this.baseDefinitions
            )
    ) as unknown as ReturnT;
    /**
     * Get an array containing the names or keys of all of
     * the Available Program Variables.
     * 
     * This method is effectively a getter for the {@link customProgramVarKeys},
     * {@link baseProgramVarKeys}, and {@link programVarKeys} properties.
     * 
     * @template FilterT        The type of the `filter` argument.
     * 
     * @template ReturnDefsT    The inferred {@link EnvironmentVariableDefinitions} used to
     *                          determine the return type of the method.
     * 
     * @template ReturnT        The inferred return type of the method.
     * 
     * @param filter            Indicates if and how to
     *                          {@link EnvironmentVariableManager.VariableFilterOption filter the returned definitions}.
     * 
     * @returns                 A {@link Object.freeze Frozen Object} containing the 
     *                          names or keys of the Available Program Variables,
     *                          optionally filtered according to the specified `filter`.
     * 
     * @see {@link customProgramVarKeys}
     * @see {@link baseProgramVarKeys}
     * @see {@link programVarKeys}
     */
    getProgramVarKeys = <
        FilterT extends EnvironmentVariableManager.VariableFilterOption | undefined = undefined,
        ReturnDefsT extends EnvironmentVariableDefinitions = (
            FilterT extends 'custom-vars'
                ? CustomDefsT
                : (
                    FilterT extends 'base-vars'
                        ? BaseDefsT
                        : DefsT
                )
        ),
        ReturnT = ObjectUtils.ComplexObjectKey<ProgramVariables<ReturnDefsT>>[]
    > ( filter?: FilterT ): ReturnT => (
        !filter
            ? this.programVarKeys
            : (
                filter == 'custom-vars'
                    ? this.customProgramVarKeys
                    : this.baseProgramVarKeys
            )
    ) as unknown as ReturnT;

    /**
     * Get an array containing the {@link EnvironmentVariable.name names} of all of the
     * {@link EnvironmentVariable.required *Required Environment Variables*}.
     * 
     * This method is effectively a getter for the {@link customRequiredEnvVars},
     * {@link baseRequiredEnvVars}, and {@link requiredEnvVars} properties.
     * 
     * @template FilterT        The type of the `filter` argument.
     * 
     * @template ReturnDefsT    The inferred {@link EnvironmentVariableDefinitions} used to
     *                          determine the return type of the method.
     * 
     * @template ReturnT        The inferred return type of the method.
     * 
     * @param filter            Indicates if and how to
     *                          {@link EnvironmentVariableManager.VariableFilterOption filter the returned definitions}.
     * 
     * @returns                 A {@link Object.freeze Frozen Object} containing the 
     *                          names of the Required Environment Variables,
     *                          optionally filtered according to the specified `filter`.
     * 
     * @see {@link customRequiredEnvVars}
     * @see {@link baseRequiredEnvVars}
     * @see {@link requiredEnvVars}
     */
    getRequiredEnvVars = <
        FilterT extends EnvironmentVariableManager.VariableFilterOption | undefined = undefined,
        ReturnDefsT extends EnvironmentVariableDefinitions = (
            FilterT extends 'custom-vars'
                ? CustomDefsT
                : (
                    FilterT extends 'base-vars'
                        ? BaseDefsT
                        : DefsT
                )
        ),
        ReturnT extends string[] = ExtractRequiredEnvironmentVariables<ReturnDefsT>[]
    > ( filter?: FilterT ): ReturnT => (
        !filter
            ? this.requiredEnvVars
            : (
                filter == 'custom-vars'
                    ? this.customRequiredEnvVars
                    : this.baseRequiredEnvVars
            )
    ) as unknown as ReturnT;
    /**
     * Get an array containing the {@link EnvironmentVariable.name names} of all of the
     * {@link EnvironmentVariable.required *Optional Environment Variables*}.
     * 
     * This method is effectively a getter for the {@link customOptionalEnvVars},
     * {@link baseOptionalEnvVars}, and {@link optionalEnvVars} properties.
     * 
     * @template FilterT        The type of the `filter` argument.
     * 
     * @template ReturnDefsT    The inferred {@link EnvironmentVariableDefinitions} used to
     *                          determine the return type of the method.
     * 
     * @template ReturnT        The inferred return type of the method.
     * 
     * @param filter            Indicates if and how to
     *                          {@link EnvironmentVariableManager.VariableFilterOption filter the returned definitions}.
     * 
     * @returns                 A {@link Object.freeze Frozen Object} containing the 
     *                          names of the Optional Environment Variables,
     *                          optionally filtered according to the specified `filter`.
     * 
     * @see {@link customOptionalEnvVars}
     * @see {@link baseOptionalEnvVars}
     * @see {@link optionalEnvVars}
     */
    getOptionalEnvVars = <
        FilterT extends EnvironmentVariableManager.VariableFilterOption | undefined = undefined,
        ReturnDefsT extends EnvironmentVariableDefinitions = (
            FilterT extends 'custom-vars'
                ? CustomDefsT
                : (
                    FilterT extends 'base-vars'
                        ? BaseDefsT
                        : DefsT
                )
        ),
        ReturnT extends string[] = ExcludeRequiredEnvironmentVariables<ReturnDefsT>[]
    > ( filter?: FilterT ): ReturnT => (
        !filter
            ? this.optionalEnvVars
            : (
                filter == 'custom-vars'
                    ? this.customOptionalEnvVars
                    : this.baseOptionalEnvVars
            )
    ) as unknown as ReturnT;
    /**
     * Get an array containing the {@link EnvironmentVariable.name names} of all of the
     * {@link EnvironmentVariable.sensitive *Sensitive Environment Variables*}.
     * 
     * This method is effectively a getter for the {@link customSensitiveEnvVars},
     * {@link baseSensitiveEnvVars}, and {@link sensitiveEnvVars} properties.
     * 
     * @template FilterT        The type of the `filter` argument.
     * 
     * @template ReturnDefsT    The inferred {@link EnvironmentVariableDefinitions} used to
     *                          determine the return type of the method.
     * 
     * @template ReturnT        The inferred return type of the method.
     * 
     * @param filter            Indicates if and how to
     *                          {@link EnvironmentVariableManager.VariableFilterOption filter the returned definitions}.
     * 
     * @returns                 A {@link Object.freeze Frozen Object} containing the 
     *                          names of the Sensitive Environment Variables,
     *                          optionally filtered according to the specified `filter`.
     * 
     * @see {@link customSensitiveEnvVars}
     * @see {@link baseSensitiveEnvVars}
     * @see {@link sensitiveEnvVars}
     */
    getSensitiveEnvVars = <
        FilterT extends EnvironmentVariableManager.VariableFilterOption | undefined = undefined,
        ReturnDefsT extends EnvironmentVariableDefinitions = (
            FilterT extends 'custom-vars'
                ? CustomDefsT
                : (
                    FilterT extends 'base-vars'
                        ? BaseDefsT
                        : DefsT
                )
        ),
        ReturnT extends string[] = ExtractSensitiveEnvironmentVariables<ReturnDefsT>[]
    > ( filter?: FilterT ): ReturnT => (
        !filter
            ? this.sensitiveEnvVars
            : (
                filter == 'custom-vars'
                    ? this.customSensitiveEnvVars
                    : this.baseSensitiveEnvVars
            )
    ) as unknown as ReturnT;
    /**
     * Get an array containing the name or key of all of the
     * *Sensitive Program Variables*.
     * 
     * This method is effectively a getter for the {@link customSensitiveProgramVars},
     * {@link baseSensitiveProgramVars}, and {@link sensitiveProgramVars} properties.
     * 
     * @template FilterT        The type of the `filter` argument.
     * 
     * @template ReturnDefsT    The inferred {@link EnvironmentVariableDefinitions} used to
     *                          determine the return type of the method.
     * 
     * @template ReturnT        The inferred return type of the method.
     * 
     * @param filter            Indicates if and how to
     *                          {@link EnvironmentVariableManager.VariableFilterOption filter the returned definitions}.
     * 
     * @returns                 A {@link Object.freeze Frozen Object} containing the 
     *                          names of the Sensitive Program Variables,
     *                          optionally filtered according to the specified `filter`.
     * 
     * @see {@link customSensitiveProgramVars}
     * @see {@link baseSensitiveProgramVars}
     * @see {@link sensitiveProgramVars}
     */
    getSensitiveProgramVars = <
        FilterT extends EnvironmentVariableManager.VariableFilterOption | undefined = undefined,
        ReturnDefsT extends EnvironmentVariableDefinitions = (
            FilterT extends 'custom-vars'
                ? CustomDefsT
                : (
                    FilterT extends 'base-vars'
                        ? BaseDefsT
                        : DefsT
                )
        ),
        ReturnT = ExtractSensitiveProgramVariables<ReturnDefsT>[]
    > ( filter?: FilterT ): ReturnT => (
        !filter
            ? this.sensitiveEnvVars
            : (
                filter == 'custom-vars'
                    ? this.customSensitiveEnvVars
                    : this.baseSensitiveEnvVars
            )
    ) as unknown as ReturnT;

    /**
     * Get the Raw `string` Values for the
     * {@link getDefinitions Available Environment Variables}.
     * 
     * 
     * ## A Note About Returned Objects
     * In order to reduce overhead and the chance for bugs to occur,
     * `EnvironmentVariableManager` instances are essentially just type-safe wrappers
     * that return a reference or copy of a single object containing
     * all of the Environment Variables at runtime by default.
     * This means that when changes are made to existing Environment Variables
     * and/or new Environment Variables are added, the objects returned by
     * this method may instead be a *superset*  of the return type of the method. E.g.,
     * ```ts
     * const myEnvVarManager = new EnvironmentVariableManager();
     * 
     * console.log(myEnvVarManager.getRawEnvVars());
     * // Typed: {}
     * // Printed: {}
     * 
     * // Register Custom Environment Variables.
     * registerEnvironmentVariables(MY_ENV_VARS);
     * 
     * console.log(myEnvVarManager.getRawEnvVars());
     * // Typed: {}
     * // Printed: { FOO: '...', BAR: null }
     * ```
     * 
     * This means that care should be exercised when sharing objects
     * containing Environment Variables returned by this method with untrusted code.
     * Furthermore, when *Redacting Sensitive Properties*, **all** Environment and
     * Program Variables marked as *Sensitive* will be
     * {@link SensitiveProperties.redact redacted}, even if they are not part
     * of the class instance being used.
     * 
     * To retrieve objects containing *only* the base or custom
     * Environment or Program Variables, use the `filter` argument.
     * 
     * @template RedactedT      The type of the `redacted` argument.
     * 
     * @template FilterT        The type of the `filter` argument.
     * 
     * @template ReturnDefsT    The inferred {@link EnvironmentVariableDefinitions} used to
     *                          determine the return type of the method.
     * 
     * @template ReturnT        The inferred return type of the method.
     * 
     * @param redacted          Indicates whether or not to {@link SensitiveProperties.redact redact}
     *                          the {@link EnvironmentVariable.sensitive *Sensitive Environment Variables*}
     *                          and *Sensitive Program Variables* in the returned object.
     * 
     * @param filter            Indicates if and how to
     *                          {@link EnvironmentVariableManager.VariableFilterOption filter the returned definitions}.
     * 
     * @returns                 A {@link Object.freeze Frozen Object} containing the 
     *                          names of the Sensitive Program Variables,
     *                          optionally redacted and/or filtered according to the specified arguments.
     * 
     * @see {@link getProgramVars `getProgramVars()`}
     */
    getRawEnvVars <
        RedactedT extends boolean | undefined = undefined,
        FilterT extends EnvironmentVariableManager.VariableFilterOption | undefined = undefined,
        ReturnDefsT extends EnvironmentVariableDefinitions = (
            FilterT extends 'custom-vars'
                ? CustomDefsT
                : (
                    FilterT extends 'base-vars'
                        ? BaseDefsT
                        : DefsT
                )
        ),
        ReturnT extends RawEnvironmentVariables<ReturnDefsT> = (
            RedactedT extends true
                ? RawEnvironmentVariables<ReturnDefsT>
                : Readonly<RawEnvironmentVariables<ReturnDefsT>>
        )
    > ( redacted?: RedactedT, filter?: FilterT ): ReturnT {

        if (!registeredRawEnvVars)
            throw new LogicError("The Registered Environment Variables have not yet been retrieved!");

        const envVars = (() => {

            if (!filter)
                return registeredRawEnvVars as RawEnvironmentVariables<DefsT>;

            let envVars = {} as RawEnvironmentVariables<CustomDefsT>;

            for (let envVarName in this[filter == 'custom-vars' ? 'customDefinitions' : 'baseDefinitions'].variables)
                (envVars[envVarName] as unknown as RawEnvironmentVariables) = registeredRawEnvVars[envVarName];

            return envVars;

        })();

        return (
            !redacted
                ? envVars
                : SensitiveProperties.redact(envVars, sensitiveRegisteredEnvVars) as RawEnvironmentVariables<FilterT extends true ? CustomDefsT : DefsT>
        ) as ReturnT;

    }

    getProgramVars <
        RedactedT extends boolean | undefined = undefined,
        FilterT extends EnvironmentVariableManager.VariableFilterOption | undefined = undefined,
        ReturnDefsT extends EnvironmentVariableDefinitions = (
            FilterT extends 'custom-vars'
                ? CustomDefsT
                : (
                    FilterT extends 'base-vars'
                        ? BaseDefsT
                        : DefsT
                )
        ),
        ReturnT extends ProgramVariables<ReturnDefsT> = (
            RedactedT extends true
                ? ProgramVariables<ReturnDefsT>
                : ProgramVariables<ReturnDefsT>
        )
    > ( redacted?: RedactedT, filter?: FilterT ): ReturnT {

        if (!registeredProgramVars)
            throw new LogicError("The Registered Program Variables have not yet been retrieved!");

        const programVars = (() => {

            if (!filter)
                return registeredProgramVars as unknown as ProgramVariables<DefsT>;

            const keys = this[filter == 'custom-vars' ? 'customProgramVarNames' : 'baseProgramVarNames'];
            let programVars = {} as ProgramVariables<CustomDefsT>;

            for (let i = 0; i < keys.length; i++)
                ObjectUtils.setNestedProperty(
                    programVars,
                    keys[i],
                    ObjectUtils.getNestedProperty(registeredProgramVars, keys[i])
                );

            return programVars;

        })();


        return (
            !redacted
                ? programVars
                : SensitiveProperties.redact(
                    programVars,
                    sensitiveRegisteredProgramVars as ObjectUtils.ComplexObjectKey<typeof programVars>[] as any
                )
        ) as unknown as ReturnT;

    }

}
export namespace EnvironmentVariableManager {

    /**
     * A union of `string` values representing the available
     * options that can be passed to the `filter` argument
     * of the instance methods of {@link EnvironmentVariableManager} objects
     * in order to filter the properties in the returned objects.
     * 
     * - `'custom-vars'`: Only includes *Custom {@link EnvironmentVariableDefinitions}*.
     * - `'base-vars'`: Only includes *Base {@link EnvironmentVariableDefinitions}*.
     * 
     * @deprecated  This type currently has no counterpart in the `config` API.
     * 
     * @apistatus   ⚠️ *Deprecated*
     * @since       `v1`
     */
    export type VariableFilterOption = 'custom-vars' | 'base-vars';

    function parseNumericEnvVar ( envName: string, required: true, rawValue: string | null ): number;
    function parseNumericEnvVar ( envName: string, required: false, rawValue: string | null, defaultValue?: number ): number;
    function parseNumericEnvVar <
        RequiredT extends EnvironmentVariableManager,
        DefaultValueT extends (RequiredT extends false ? number : undefined)
    > ( envName: string, required: RequiredT, rawValue: string | null, defaultValue?: DefaultValueT ): number {

        // let envVar: EnvironmentVariable<EnvNameT> = manager.envVars[envName as keyof typeof envVar];
        // let rawValue: string | null = manager.rawEnvVars[envName];
        // let envVar = EnvironmentVariableManager.BASE_VARS.variables[envName as keyof EnvironmentVariableManager.BaseVarsType['variables']];
        let parsedValue = typeof rawValue == 'string'
            ? parseInt(rawValue)
            : NaN;

        if (isNaN(parsedValue)) {
            let errorMessage = `The specified value for the '${getEnvironmentVariableName(envName)}' Environment Variable is invalid!`;

            if (required) {
                throw new TypeError(errorMessage);
            }
            else {
                console.error(errorMessage);
                return defaultValue ?? 0;
            }
        }
        else if (parsedValue <= 0) {
            let errorMessage = `The value for the '${getEnvironmentVariableName(envName)}' Environment Variable must be a postive, nonzero number.`
            
            if (required)
                throw new TypeError(errorMessage);
            else
                console.error(errorMessage);
        }

        return parsedValue;

    }

    var subnetNum: number | null = null;
    const assertIsValidSubnetComponentNum = ( envVarName: string, num: number ): void | never => {

        const remainder = (num - Math.floor(num));
        if (remainder > 0 || num < 0 || 255 < num)
            throw new TypeError(`${num} is not a valid value for the '${getEnvironmentVariableName(envVarName)}' Environment Variable.`);

    };

    type GenericConversionFnType <ReturnT = any> = (
        envValue: string,
        envVar: EnvironmentVariable
    ) => ReturnT;

    const IP_NUM_PROGRAM_VAR_NAMES = {
        main: ['mainRouter', 'ip'],
        bridge: ['bridgeRouter', 'ip']
    } as const satisfies Record<string, ObjectUtils.ComplexObjectKeyType>;
    type IpNumConversionFnType = ( rawEnvVars: RawEnvironmentVariables, programVar: ObjectUtils.ComplexObjectKeyType ) => IpAddress;
    const ipNumConversionFn: ComplexProgramVariableConversionFunction<
        IpAddress,
        RawEnvironmentVariables<BaseVarsType>,
        typeof IP_NUM_PROGRAM_VAR_NAMES[keyof typeof IP_NUM_PROGRAM_VAR_NAMES]
    > = (rawEnvVars, programVar) => {

        const envVarName = (
            ArrayUtils.deepEquals(programVar, IP_NUM_PROGRAM_VAR_NAMES.main)
                ? 'MAIN'
                : 'BRIDGE'
        ) + '_ROUTER_IP_NUM' as `${'MAIN' | 'BRIDGE'}_ROUTER_IP_NUM`;

        if (subnetNum === null) {
            subnetNum = parseNumericEnvVar('SUBNET_NUM', true, rawEnvVars.SUBNET_NUM);
            assertIsValidSubnetComponentNum('SUBNET_NUM', subnetNum);
        }

        let ipNum = parseNumericEnvVar(envVarName, true, rawEnvVars[envVarName]);
        assertIsValidSubnetComponentNum(envVarName, ipNum);

        return `192.168.${subnetNum}.${ipNum}` as const;

    }

    const DEFAULT_RETRY_VARIABLE_VALUES = {
        MIN_RETRY_TIME: 5000,
        MAX_RETRY_TIME: 60000,
        MAX_METHOD_RETRIES: 3,
        MAX_FAILURE_RETRIES: 15,
        CGI_ACTION_COOLDOWN: 1250,
        PUPPETEER_ACTION_COOLDOWN: 100,
        OTHER_ACTION_COOLDOWN: 250
    } as const;
    type NumericVariableConversionFnType = GenericConversionFnType<number>;
    const NumericVariableConversionFn: ProgramVariableConversionFunction<
        number, 
        (
              EnvironmentVariable<'MIN_RETRY_TIME'>
            | EnvironmentVariable<'MAX_RETRY_TIME'>
            | EnvironmentVariable<'MAX_METHOD_RETRIES'>
            | EnvironmentVariable<'MAX_FAILURE_RETRIES'>
            | EnvironmentVariable<'PUPPETEER_ACTION_COOLDOWN'>
            | EnvironmentVariable<'CGI_ACTION_COOLDOWN'>
            | EnvironmentVariable<'OTHER_ACTION_COOLDOWN'>
        )
    > = (envValue, envVar) => parseNumericEnvVar(envVar.name, false, envValue, DEFAULT_RETRY_VARIABLE_VALUES[envVar.name]);
    
    type VariableExistsConversionFnType = GenericConversionFnType<boolean>;
    const variableExistsConversionFn: ProgramVariableConversionFunction<boolean> = (envValue) => (envValue !== null);

    /**
     * @deprecated  Migrate to {@link Config.BaseProgramConfiguration.BaseConfigurationDefinitions BaseProgramConfiguration.BaseConfigurationDefinitions}.
     * 
     * @apistatus   ⚠️ *Deprecated*
     * @since       `v1`
     */
    export interface BaseVarsType {

        variables: {

            /* Required Environment Variables */
        
            /**
             * Defines the number of the Network Subnet Component in the IP Address.
             * 
             * E.g.,
             * ```
             * 192.168.0.1
             *         ^
             * ```
             * 
             * @see {@link ProgramVariables.mainRouter `ProgramVariables.mainRouter.ip`}
             * @see {@link ProgramVariables.bridgeRouter `ProgramVariables.bridgeRouter.ip`}
             * @see {@link MAIN_ROUTER_IP_NUM}
             * @see {@link BRIDGE_ROUTER_IP_NUM}
             */
            SUBNET_NUM: {
                name: 'SUBNET_NUM',
                required: true
            },
            /**
             * Defines the number of the Device-Specific Component of the Main Router's IP Address.
             * 
             * E.g.,
             * ```
             * 192.168.0.1
             *           ^
             * ```
             * 
             * @see {@link ProgramVariables.mainRouter `ProgramVariables.mainRouter.ip`}
             * @see {@link SUBNET_NUM}
             * @see {@link MAIN_ROUTER_NETWORK_NAME}
             * @see {@link BRIDGE_ROUTER_IP_NUM}
             * @see {@link MAIN_ROUTER_WIFI_PW}
             */
            MAIN_ROUTER_IP_NUM: {
                name: 'MAIN_ROUTER_IP_NUM',
                required: true
            },
            /**
             * Defines the SSID of the Wi-Fi Network of the Main Router
             * that the WDS Bridge is to be connected to.
             * 
             * @see {@link ProgramVariables.mainRouter `ProgramVariables.mainRouter.ssid`}
             * @see {@link MAIN_ROUTER_IP_NUM}
             * @see {@link MAIN_ROUTER_WIFI_PW}
             */
            MAIN_ROUTER_NETWORK_NAME: {
                name: 'MAIN_ROUTER_NETWORK_NAME',
                required: true,
                programVar: ['mainRouter', 'ssid']
            },
        
            /**
             * Defines the number of the Device-Specific Component of the Bridge Router's IP Address.
             * 
             * E.g.,
             * ```
             * 192.168.0.2
             *           ^
             * ```
             * 
             * @see {@link ProgramVariables.bridgeRouter `ProgramVariables.bridgeRouter.ip`}
             * @see {@link SUBNET_NUM}
             * @see {@link MAIN_ROUTER_IP_NUM}
             * @see {@link BRIDGE_ROUTER_MANAGEMENT_PW}
             */
            BRIDGE_ROUTER_IP_NUM: {
                name: 'BRIDGE_ROUTER_IP_NUM',
                required: true
            },
            /**
             * Defines the password used to login to the Management Interface of the Bridge Router.
             * 
             * @see {@link ProgramVariables.bridgeRouter `ProgramVariables.bridgeRouter.managementPw`}
             * @see {@link BRIDGE_ROUTER_IP_NUM}
             * @see {@link MAIN_ROUTER_WIFI_PW}
             * @see {@link CGI_ENCRYPTED_LOGIN_USERNAME}
             * @see {@link CGI_ENCRYPTED_LOGIN_PASSWORD}
             */
            BRIDGE_ROUTER_MANAGEMENT_PW: {
                name: 'BRIDGE_ROUTER_MANAGEMENT_PW',
                required: true,
                sensitive: true,
                programVar: ['bridgeRouter', 'managementPw']
            },
        
        
            /* Optional Environment Variables */
        
            /**
             * The password of the {@link MAIN_ROUTER_NETWORK_NAME Main Router Wi-Fi Network}
             * the WDS Bridge is to be established with.
             * 
             * Only has to be specified if the program has to or
             * might have to create the WDS Bridge from scratch 
             * (or otherwise has not been established beforehand).
             * 
             * If WDS Bridge has to be created from scratch and this
             * environment variable is not specified, an {@link UnrecoverableError} will be thrown.
             * 
             * @see {@link ProgramVariables.mainRouter `ProgramVariables.mainRouter.wifiPw`}
             * @see {@link MAIN_ROUTER_IP_NUM}
             * @see {@link MAIN_ROUTER_NETWORK_NAME}
             * @see {@link BRIDGE_ROUTER_MANAGEMENT_PW}
             * @see {@link CGI_ENCRYPTED_LOGIN_USERNAME}
             * @see {@link CGI_ENCRYPTED_LOGIN_PASSWORD}
             */
            MAIN_ROUTER_WIFI_PW: {
                name: 'MAIN_ROUTER_WIFI_PW',
                required: false,
                sensitive: true,
                programVar: ['mainRouter', 'wifiPw'],
                programVarDefaultValue: null
            },
            BRIDGE_ROUTER_MODEL: {
                name: 'BRIDGE_ROUTER_MODEL',
                required: false,
                programVar: ['bridgeRouter', 'model'],
                programVarConversionFn: ( envValue: string ) => string,
                programVarDefaultValue: 'auto'
            },
            
            /**
             * The Wi-Fi Frequency the WDS Bridge should be established on.
             * 
             * Accepted values include the following:
             * - `'2.4GHz'` (Case-Insensitive), `2.4`, `2`
             * - `'5GHz'` (Case-Insensitive), `5.0`, `5`
             * 
             * @see {@link ProgramVariables.wdsBridgeFrequency}
             */
            WDS_BRIDGE_FREQUENCY: {
                name: 'WDS_BRIDGE_FREQUENCY',
                required: false,
                programVar: 'wdsBridgeFrequency',
                programVarConversionFn: ( envValue: string, envVar: EnvironmentVariable<'WDS_BRIDGE_FREQUENCY'> ) => WifiFrequency,
                programVarDefaultValue: WifiFrequency
            },
            /**
             * The amount of time to wait between calls to
             * {@link verifyBridgeStatus `verifyBridgeStatus()`} in *milliseconds*.
             * 
             * @see {@link ProgramVariables.verificationInterval}
             * @see {@link RuntimeVariables.currentVerificationInterval}
             */
            VERIFICATION_INTERVAL: {
                name: 'VERIFICATION_INTERVAL',
                required: false,
                programVar: 'verificationInterval',
                programVarConversionFn: ( envValue: string, envVar: EnvironmentVariable<'VERIFICATION_INTERVAL'> ) => number
            },
            
            /**
             * The minimum amount of time to wait before attempting to
             * re-established the WDS Bridge after the last failed attempt.
             * 
             * @see {@link ProgramVariables.retries `ProgramVariables.retries.minRetryTime`}
             * @see {@link MAX_RETRY_TIME}
             */
            MIN_RETRY_TIME: {
                name: 'MIN_RETRY_TIME',
                required: false,
                programVar: ['retries', 'minRetryTime'],
                programVarConversionFn: NumericVariableConversionFnType,
                programVarDefaultValue: 5000
            },
            /**
             * The maximum amount of time to wait before attempting to
             * re-established the WDS Bridge after the last failed attempt.
             * 
             * @see {@link ProgramVariables.retries `ProgramVariables.retries.maxRetryTime`}
             * @see {@link MIN_RETRY_TIME}
             */
            MAX_RETRY_TIME: {
                name: 'MAX_RETRY_TIME',
                required: false,
                programVar: ['retries', 'maxRetryTime'],
                programVarConversionFn: NumericVariableConversionFnType,
                programVarDefaultValue: 60000
            },
            /**
             * The maximum number of attempts to re-establish the WDS Bridge
             * before attempting to switch {@link OldConnectionMethod}s.
             * 
             * Only applicable when {@link method} is set to 'auto'.
             * 
             * @see {@link ProgramVariables.retries `ProgramVariables.retries.maxMethodRetries`}
             */
            MAX_METHOD_RETRIES: {
                name: 'MAX_METHOD_RETRIES',
                required: false,
                programVar: ['retries', 'maxMethodRetries'],
                programVarConversionFn: NumericVariableConversionFnType,
                programVarDefaultValue: 3
            },
            /**
             * The maximum number of attempts to re-establish the WDS Bridge
             * before giving up and throwing an {@link UnrecoverableError}.
             * 
             * @see {@link ProgramVariables.retries `ProgramVariables.retries.maxFailureRetries`}
             */
            MAX_FAILURE_RETRIES: {
                name: 'MAX_FAILURE_RETRIES',
                required: false,
                programVar: ['retries', 'maxFailureRetries'],
                programVarConversionFn: NumericVariableConversionFnType,
                programVarDefaultValue: 15
            },
        
            /**
             * The {@link ReconnectionMethod.name name} of the {@link ReconnectionMethod Reconnection Method}
             * to be used when re-establishing the WDS Bridge.
             * 
             * When set to `'auto'`, the Reconnection Method will be automatically
             * selected from the {@link reconnectionMethods Registered Reconnection Methods}
             * by the program and be permitted to switch between the available Reconnection Methods
             * once the designated {@link MAX_METHOD_RETRIES} has been reached.
             * 
             * @see {@link ProgramVariables.reconnectionMethods `ProgramVariables.reconnectionMethods.method`}
             */
            RECONNECTION_METHOD: {
                name: 'RECONNECTION_METHOD',
                required: false,
                programVar: ['reconnectionMethods', 'method'],
                programVarConversionFn: ( envValue: string ) => string,
                programVarDefaultValue: 'auto'
            },
            /**
             * Defers performing the {@link ReconnectionMethod.setup Setup Routine}
             * for each of the {@link reconnectionMethods Registered Reconnection Methods}
             * until the {@link ReconnectionMethod} is {@link ReconnectionMethod.run invoked}
             * to re-establish the WDS Bridge.
             * 
             * While this option will allow the program to startup faster, it may also
             * prevent setup errors from being raised, and even the possibility of the
             * program terminating, until an attempt is made to re-establish
             * the WDS Bridge using the {@link ReconnectionMethod}.
             * 
             * @see {@link ProgramVariables.reconnectionMethods `ProgramVariables.reconnectionMethods.deferSetup`}
             */
            DEFER_RECONNECTION_METHOD_SETUP: {
                name: 'DEFER_RECONNECTION_METHOD_SETUP',
                required: false,
                programVar: ['reconnectionMethods', 'deferSetup'],
                programVarConversionFn: VariableExistsConversionFnType,
                programVarDefaultValue: false
            },
        
            /**
             * Indicates whether additional, more verbose logging,
             * should be enabled by default or not.
             * 
             * The value of this Environment Variable is ignored, and
             * Verbose Logging will always be enabled by default when present.
             * 
             * Regardless of whether or not this Environment Variable
             * is set, Verbose Logging can still be toggled at runtime
             * via the Interactive Console.
             * 
             * @see {@link verboseLogging}
             * @see {@link ENABLE_VERBOSE_DATA_LOGGING}
             */
            ENABLE_VERBOSE_LOGGING: {
                name: 'ENABLE_VERBOSE_LOGGING',
                required: false,
                programVar: ['verboseLogging', 'enableGlobally'],
                programVarConversionFn: VariableExistsConversionFnType,
                programVarDefaultValue: false
            },
            /**
             * Indicates whether additional, more verbose logging
             * containing specific data, parameters, and return values
             * should be enabled by default or not.
             * 
             * The value of this Environment Variable is ignored, and
             * Verbose Data Logging will always be enabled by default when present.
             * 
             * Regardless of whether or not this Environment Variable
             * is set, Verbose Data Logging can still be toggled at runtime
             * via the Interactive Console.
             * 
             * @see {@link verboseDataLogging}
             * @see {@link ENABLE_VERBOSE_LOGGING}
             */
            ENABLE_VERBOSE_DATA_LOGGING: {
                name: 'ENABLE_VERBOSE_DATA_LOGGING',
                required: false,
                programVar: ['verboseLogging', 'enableDataLogging'],
                programVarConversionFn: VariableExistsConversionFnType,
                programVarDefaultValue: false
            },
        
            /**
             * The amount of time to [wait between Puppeteer Actions](https://pptr.dev/api/puppeteer.connectoptions#slowmo)
             * in *milliseconds*.
             * 
             * This cooldown only applies to {@link ReconnectionMethod Reconnection Methods}
             * whose {@link ReconnectionMethod.type `type`} is `Puppeteer`.
             * 
             * Because this affects *all* Puppeteer operations, values
             * above `~250ms` are **not** recommended.
             * 
             * @see {@link ProgramVariables.reconnectionMethods `ProgramVariables.reconnectionMethods.actionCooldown.puppeteer`}
             * @see {@link CGI_ACTION_COOLDOWN}
             * @see {@link OTHER_ACTION_COOLDOWN}
             */
            PUPPETEER_ACTION_COOLDOWN: {
                name: 'PUPPETEER_ACTION_COOLDOWN',
                required: false,
                programVar: ['reconnectionMethods', 'actionCooldown', 'puppeteer'],
                programVarConversionFn: NumericVariableConversionFnType,
                programVarDefaultValue: 100
            },
            /**
             * The amount of time to wait between requests made to
             * the Router Browser CGI in *milliseconds*.
             * 
             * This cooldown only applies to {@link ReconnectionMethod Reconnection Methods}
             * whose {@link ReconnectionMethod.type `type`} is `CGI`.
             * 
             * @see {@link ProgramVariables.reconnectionMethods `ProgramVariables.reconnectionMethods.actionCooldown.cgi`}
             * @see {@link PUPPETEER_ACTION_COOLDOWN}
             * @see {@link OTHER_ACTION_COOLDOWN}
             */
            CGI_ACTION_COOLDOWN: {
                name: 'CGI_ACTION_COOLDOWN',
                required: false,
                programVar: ['reconnectionMethods', 'actionCooldown', 'cgi'],
                programVarConversionFn: NumericVariableConversionFnType,
                programVarDefaultValue: 1250
            },
            /**
             * The amount of time to wait between actions
             * when using a {@link ReconnectionMethod Reconnection Method}
             * whose {@link ReconnectionMethod.type `type`} is `Other`.
             * 
             * @see {@link ProgramVariables.reconnectionMethods `ProgramVariables.reconnectionMethods.actionCooldown.other`}
             * @see {@link PUPPETEER_ACTION_COOLDOWN}
             * @see {@link CGI_ACTION_COOLDOWN}
             */
            OTHER_ACTION_COOLDOWN: {
                name: 'OTHER_ACTION_COOLDOWN',
                required: false,
                programVar: ['reconnectionMethods', 'actionCooldown', 'other'],
                programVarConversionFn: NumericVariableConversionFnType,
                programVarDefaultValue: 500
            }
        
        };
        complexProgramVars: [
            [ ['mainRouter', 'ip'], IpNumConversionFnType ],
            [ ['bridgeRouter', 'ip'], IpNumConversionFnType ]
        ];

    }
    /**
     * @deprecated  Migrate to {@link Config.BaseProgramConfiguration.BaseConfigurationDefinitions BaseProgramConfiguration.BaseConfigurationDefinitions}.
     * 
     * @apistatus   ⚠️ *Deprecated*
     * @since       `v1`
     */
    export const BASE_VARS = {

        variables: {

            /* Required Environment Variables */
    
            SUBNET_NUM: {
                name: 'SUBNET_NUM',
                required: true
            },
            MAIN_ROUTER_IP_NUM: {
                name: 'MAIN_ROUTER_IP_NUM',
                required: true
            },
            MAIN_ROUTER_NETWORK_NAME: {
                name: 'MAIN_ROUTER_NETWORK_NAME',
                required: true,
                programVar: ['mainRouter', 'ssid']
            },
        
            BRIDGE_ROUTER_IP_NUM: {
                name: 'BRIDGE_ROUTER_IP_NUM',
                required: true
            },
            BRIDGE_ROUTER_MANAGEMENT_PW: {
                name: 'BRIDGE_ROUTER_MANAGEMENT_PW',
                required: true,
                sensitive: true,
                programVar: ['bridgeRouter', 'managementPw']
            },
        
        
            /* Optional Environment Variables */
        
            MAIN_ROUTER_WIFI_PW: {
                name: 'MAIN_ROUTER_WIFI_PW',
                required: false,
                sensitive: true,
                programVar: ['mainRouter', 'wifiPw'],
                programVarDefaultValue: null
            },
            BRIDGE_ROUTER_MODEL: {
                name: 'BRIDGE_ROUTER_MODEL',
                required: false,
                programVar: ['bridgeRouter', 'model'],
                programVarConversionFn: (envValue) => envValue.toLowerCase(),
                programVarDefaultValue: 'auto'
            },
    
            WDS_BRIDGE_FREQUENCY: {
                name: 'WDS_BRIDGE_FREQUENCY',
                required: false,
                programVar: 'wdsBridgeFrequency',
                programVarConversionFn: (envValue, envVar) => {
    
                    switch (envValue.toLowerCase()) {

                        case '2.5ghz':
                        case '2ghz':
                        case '2.5':
                        case '2':
                            return '2.4GHz';
                            
                        case '5.0ghz':
                        case '5ghz':
                        case '5.0':
                        case '5':
                            return '5GHz';

                        default: 
                            throw new TypeError(
                                `'${envValue}' is not a valid Wi-Fi Frequency option `
                                    + `for the '${getEnvironmentVariableName(envVar.name)}' Environment Variable.`
                            );

                    }
            
                },
                programVarDefaultValue: '5GHz'
            },
            VERIFICATION_INTERVAL: {
                name: 'VERIFICATION_INTERVAL',
                required: false,
                programVar: 'verificationInterval',
                programVarConversionFn: (envValue, envVar) => {
    
                    let parsedInterval = parseNumericEnvVar(envVar.name, false, envValue, 15000);
            
                    if (parsedInterval < 1000)
                        throw new TypeError(`'${envValue}' is not a valid value for the '${getEnvironmentVariableName(envVar.name)}' Environment Variable.`)
            
                    return parsedInterval;
            
                }
            },
            
            MIN_RETRY_TIME: {
                name: 'MIN_RETRY_TIME',
                required: false,
                programVar: ['retries', 'minRetryTime'],
                programVarConversionFn: NumericVariableConversionFn,
                programVarDefaultValue: 5000
            },
            MAX_RETRY_TIME: {
                name: 'MAX_RETRY_TIME',
                required: false,
                programVar: ['retries', 'maxRetryTime'],
                programVarConversionFn: NumericVariableConversionFn,
                programVarDefaultValue: 60000
            },
            MAX_METHOD_RETRIES: {
                name: 'MAX_METHOD_RETRIES',
                required: false,
                programVar: ['retries', 'maxMethodRetries'],
                programVarConversionFn: NumericVariableConversionFn,
                programVarDefaultValue: 3
            },
            MAX_FAILURE_RETRIES: {
                name: 'MAX_FAILURE_RETRIES',
                required: false,
                programVar: ['retries', 'maxFailureRetries'],
                programVarConversionFn: NumericVariableConversionFn,
                programVarDefaultValue: 15
            },
        
            RECONNECTION_METHOD: {
                name: 'RECONNECTION_METHOD',
                required: false,
                programVar: ['reconnectionMethods', 'method'],
                programVarConversionFn: (envValue) => envValue.toLowerCase(),
                programVarDefaultValue: 'auto'
            },
            DEFER_RECONNECTION_METHOD_SETUP: {
                name: 'DEFER_RECONNECTION_METHOD_SETUP',
                required: false,
                programVar: ['reconnectionMethods', 'deferSetup'],
                programVarConversionFn: variableExistsConversionFn,
                programVarDefaultValue: false
            },
        
            ENABLE_VERBOSE_LOGGING: {
                name: 'ENABLE_VERBOSE_LOGGING',
                required: false,
                programVar: ['verboseLogging', 'enableGlobally'],
                programVarConversionFn: variableExistsConversionFn,
                programVarDefaultValue: false
            },
            ENABLE_VERBOSE_DATA_LOGGING: {
                name: 'ENABLE_VERBOSE_DATA_LOGGING',
                required: false,
                programVar: ['verboseLogging', 'enableDataLogging'],
                programVarConversionFn: variableExistsConversionFn,
                programVarDefaultValue: false
            },
        
            PUPPETEER_ACTION_COOLDOWN: {
                name: 'PUPPETEER_ACTION_COOLDOWN',
                required: false,
                programVar: ['reconnectionMethods', 'actionCooldown', 'puppeteer'],
                programVarConversionFn: NumericVariableConversionFn,
                programVarDefaultValue: 100
            },
            CGI_ACTION_COOLDOWN: {
                name: 'CGI_ACTION_COOLDOWN',
                required: false,
                programVar: ['reconnectionMethods', 'actionCooldown', 'cgi'],
                programVarConversionFn: NumericVariableConversionFn,
                programVarDefaultValue: 1250
            },
            OTHER_ACTION_COOLDOWN: {
                name: 'OTHER_ACTION_COOLDOWN',
                required: false,
                programVar: ['reconnectionMethods', 'actionCooldown', 'other'],
                programVarConversionFn: NumericVariableConversionFn,
                programVarDefaultValue: 500
            }
        
        },
        complexProgramVars: [
            [ ['mainRouter', 'ip'], ipNumConversionFn ],
            [ ['bridgeRouter', 'ip'], ipNumConversionFn ]
        ]

    } as const satisfies EnvironmentVariableDefinitions & BaseVarsType;

}

/**
 * An enumeration defining all of the valid Environment Variables
 * that are recognized by the program.
 */
// export enum EnvironmentVariable {

//     /* Required Environment Variables */

//     /**
//      * Defines the number of the Network Subnet Component in the IP Address.
//      * 
//      * E.g.,
//      * ```
//      * 192.168.0.1
//      *         ^
//      * ```
//      * 
//      * @see {@link ProgramVariables.mainRouter `ProgramVariables.mainRouter.ip`}
//      * @see {@link ProgramVariables.bridgeRouter `ProgramVariables.bridgeRouter.ip`}
//      * @see {@link MAIN_ROUTER_IP_NUM}
//      * @see {@link BRIDGE_ROUTER_IP_NUM}
//      */
//     SUBNET_NUM = 'subnetNum',
//     /**
//      * Defines the number of the Device-Specific Component of the Main Router's IP Address.
//      * 
//      * E.g.,
//      * ```
//      * 192.168.0.1
//      *           ^
//      * ```
//      * 
//      * @see {@link ProgramVariables.mainRouter `ProgramVariables.mainRouter.ip`}
//      * @see {@link SUBNET_NUM}
//      * @see {@link MAIN_ROUTER_NETWORK_NAME}
//      * @see {@link BRIDGE_ROUTER_IP_NUM}
//      * @see {@link MAIN_ROUTER_WIFI_PW}
//      */
//     MAIN_ROUTER_IP_NUM = 'mainRouterIpNum',
//     /**
//      * Defines the SSID of the Wi-Fi Network of the Main Router
//      * that the WDS Bridge is to be connected to.
//      * 
//      * @see {@link ProgramVariables.mainRouter `ProgramVariables.mainRouter.ssid`}
//      * @see {@link MAIN_ROUTER_IP_NUM}
//      * @see {@link MAIN_ROUTER_WIFI_PW}
//      */
//     MAIN_ROUTER_NETWORK_NAME = 'mainRouterSsid',

//     /**
//      * Defines the number of the Device-Specific Component of the Bridge Router's IP Address.
//      * 
//      * E.g.,
//      * ```
//      * 192.168.0.2
//      *           ^
//      * ```
//      * 
//      * @see {@link ProgramVariables.bridgeRouter `ProgramVariables.bridgeRouter.ip`}
//      * @see {@link SUBNET_NUM}
//      * @see {@link MAIN_ROUTER_IP_NUM}
//      * @see {@link BRIDGE_ROUTER_MANAGEMENT_PW}
//      */
//     BRIDGE_ROUTER_IP_NUM = 'bridgeRouterIpNum',
//     /**
//      * Defines the password used to login to the Management Interface of the Bridge Router.
//      * 
//      * @see {@link ProgramVariables.bridgeRouter `ProgramVariables.bridgeRouter.managementPw`}
//      * @see {@link BRIDGE_ROUTER_IP_NUM}
//      * @see {@link MAIN_ROUTER_WIFI_PW}
//      * @see {@link CGI_ENCRYPTED_LOGIN_USERNAME}
//      * @see {@link CGI_ENCRYPTED_LOGIN_PASSWORD}
//      */
//     BRIDGE_ROUTER_MANAGEMENT_PW = 'bridgeRouterManagementPw',


//     /* Optional Environment Variables */

//     /**
//      * The password of the {@link MAIN_ROUTER_NETWORK_NAME Main Router Wi-Fi Network}
//      * the WDS Bridge is to be established with.
//      * 
//      * Only has to be specified if the program has to or
//      * might have to create the WDS Bridge from scratch 
//      * (or otherwise has not been established beforehand).
//      * 
//      * If WDS Bridge has to be created from scratch and this
//      * environment variable is not specified, an {@link UnrecoverableError} will be thrown.
//      * 
//      * @see {@link ProgramVariables.mainRouter `ProgramVariables.mainRouter.wifiPw`}
//      * @see {@link MAIN_ROUTER_IP_NUM}
//      * @see {@link MAIN_ROUTER_NETWORK_NAME}
//      * @see {@link BRIDGE_ROUTER_MANAGEMENT_PW}
//      * @see {@link CGI_ENCRYPTED_LOGIN_USERNAME}
//      * @see {@link CGI_ENCRYPTED_LOGIN_PASSWORD}
//      */
//     MAIN_ROUTER_WIFI_PW = 'mainRouterWifiPw',
    
//     /**
//      * The Wi-Fi Frequency the WDS Bridge should be established on.
//      * 
//      * Accepted values include the following:
//      * - `'2.4GHz'` (Case-Insensitive), `2.4`, `2`
//      * - `'5GHz'` (Case-Insensitive), `5.0`, `5`
//      * 
//      * @see {@link ProgramVariables.wdsBridgeFrequency}
//      */
//     WDS_BRIDGE_FREQUENCY = 'wdsBridgeFrequency',
//     /**
//      * The amount of time to wait between calls to
//      * {@link verifyBridgeStatus `verifyBridgeStatus()`} in *milliseconds*.
//      * 
//      * @see {@link ProgramVariables.verificationInterval}
//      * @see {@link RuntimeVariables.currentVerificationInterval}
//      */
//     VERIFICATION_INTERVAL = 'verificationInterval',
    
//     /**
//      * The minimum amount of time to wait before attempting to
//      * re-established the WDS Bridge after the last failed attempt.
//      * 
//      * @see {@link ProgramVariables.retries `ProgramVariables.retries.minRetryTime`}
//      * @see {@link MAX_RETRY_TIME}
//      */
//     MIN_RETRY_TIME = 'minRetryTime',
//     /**
//      * The maximum amount of time to wait before attempting to
//      * re-established the WDS Bridge after the last failed attempt.
//      * 
//      * @see {@link ProgramVariables.retries `ProgramVariables.retries.maxRetryTime`}
//      * @see {@link MIN_RETRY_TIME}
//      */
//     MAX_RETRY_TIME = 'maxRetryTime',
//     /**
//      * The maximum number of attempts to re-establish the WDS Bridge
//      * before attempting to switch {@link OldConnectionMethod}s.
//      * 
//      * Only applicable when {@link method} is set to 'auto'.
//      * 
//      * @see {@link ProgramVariables.retries `ProgramVariables.retries.maxMethodRetries`}
//      */
//     MAX_METHOD_RETRIES = "maxMethodRetries",
//     /**
//      * The maximum number of attempts to re-establish the WDS Bridge
//      * before giving up and throwing an {@link UnrecoverableError}.
//      * 
//      * @see {@link ProgramVariables.retries `ProgramVariables.retries.maxFailureRetries`}
//      */
//     MAX_FAILURE_RETRIES = "maxFailureRetries",

//     /**
//      * The {@link ReconnectionMethod.name name} of the {@link ReconnectionMethod Reconnection Method}
//      * to be used when re-establishing the WDS Bridge.
//      * 
//      * When set to `'auto'`, the Reconnection Method will be automatically
//      * selected from the {@link reconnectionMethods Registered Reconnection Methods}
//      * by the program and be permitted to switch between the available Reconnection Methods
//      * once the designated {@link MAX_METHOD_RETRIES} has been reached.
//      * 
//      * @see {@link ProgramVariables.reconnectionMethods `ProgramVariables.reconnectionMethods.method`}
//      */
//     RECONNECTION_METHOD = 'reconnectionMethod',
//     /**
//      * Defers performing the {@link ReconnectionMethod.setup Setup Routine}
//      * for each of the {@link reconnectionMethods Registered Reconnection Methods}
//      * until the {@link ReconnectionMethod} is {@link ReconnectionMethod.run invoked}
//      * to re-establish the WDS Bridge.
//      * 
//      * While this option will allow the program to startup faster, it may also
//      * prevent setup errors from being raised, and even the possibility of the
//      * program terminating, until an attempt is made to re-establish
//      * the WDS Bridge using the {@link ReconnectionMethod}.
//      * 
//      * @see {@link ProgramVariables.reconnectionMethods `ProgramVariables.reconnectionMethods.deferSetup`}
//      */
//     DEFER_RECONNECTION_METHOD_SETUP = 'deferReconnectionMethodSetup',

//     /**
//      * Specifies the hardcoded Encrypted Login Username
//      * to use when logging in to the Bridge Router Management Interface
//      * using the Bridge Router CGI.
//      * 
//      * Must be specified along with the {@link CGI_ENCRYPTED_LOGIN_PASSWORD}
//      * in order for the credentials to be used.
//      * 
//      * @see {@link CGI_ENCRYPTED_LOGIN_PASSWORD}
//      * @see {@link ProgramVariables.reconnectionMethods `ProgramVariables.reconnectionMethods.encryptedCgiCredentials.username`} 
//      */
//     CGI_ENCRYPTED_LOGIN_USERNAME = 'cgiEncryptedLoginUsername',
//     /**
//      * Specifies the hardcoded Encrypted Login Password
//      * to use when logging in to the Bridge Router Management Interface
//      * using the Bridge Router CGI.
//      * 
//      * Must be specified along with the {@link CGI_ENCRYPTED_LOGIN_USERNAME}
//      * in order for the credentials to be used.
//      * 
//      * @see {@link CGI_ENCRYPTED_LOGIN_USERNAME}
//      * @see {@link ProgramVariables.reconnectionMethods `ProgramVariables.reconnectionMethods.encryptedCgiCredentials.password`} 
//      */
//     CGI_ENCRYPTED_LOGIN_PASSWORD = 'cgiEncryptedLoginPassword',

//     /**
//      * Indicates whether additional, more verbose logging,
//      * should be enabled by default or not.
//      * 
//      * The value of this Environment Variable is ignored, and
//      * Verbose Logging will always be enabled by default when present.
//      * 
//      * Regardless of whether or not this Environment Variable
//      * is set, Verbose Logging can still be toggled at runtime
//      * via the Interactive Console.
//      * 
//      * @see {@link verboseLogging}
//      * @see {@link ENABLE_VERBOSE_DATA_LOGGING}
//      */
//     ENABLE_VERBOSE_LOGGING = 'enableVerboseLogging',
//     /**
//      * Indicates whether additional, more verbose logging
//      * containing specific data, parameters, and return values
//      * should be enabled by default or not.
//      * 
//      * The value of this Environment Variable is ignored, and
//      * Verbose Data Logging will always be enabled by default when present.
//      * 
//      * Regardless of whether or not this Environment Variable
//      * is set, Verbose Data Logging can still be toggled at runtime
//      * via the Interactive Console.
//      * 
//      * @see {@link verboseDataLogging}
//      * @see {@link ENABLE_VERBOSE_LOGGING}
//      */
//     ENABLE_VERBOSE_DATA_LOGGING = 'enableVerboseDataLogging',

//     /**
//      * The amount of time to [wait between Puppeteer Actions](https://pptr.dev/api/puppeteer.connectoptions#slowmo)
//      * in *milliseconds*.
//      * 
//      * This cooldown only applies to {@link ReconnectionMethod Reconnection Methods}
//      * whose {@link ReconnectionMethod.type `type`} is `Puppeteer`.
//      * 
//      * Because this affects *all* Puppeteer operations, values
//      * above `~250ms` are **not** recommended.
//      * 
//      * @see {@link ProgramVariables.reconnectionMethods `ProgramVariables.reconnectionMethods.actionCooldown.puppeteer`}
//      * @see {@link CGI_ACTION_COOLDOWN}
//      * @see {@link OTHER_ACTION_COOLDOWN}
//      */
//     PUPPETEER_ACTION_COOLDOWN = 'puppeteerActionCooldown',
//     /**
//      * The amount of time to wait between requests made to
//      * the Router Browser CGI in *milliseconds*.
//      * 
//      * This cooldown only applies to {@link ReconnectionMethod Reconnection Methods}
//      * whose {@link ReconnectionMethod.type `type`} is `CGI`.
//      * 
//      * @see {@link ProgramVariables.reconnectionMethods `ProgramVariables.reconnectionMethods.actionCooldown.cgi`}
//      * @see {@link PUPPETEER_ACTION_COOLDOWN}
//      * @see {@link OTHER_ACTION_COOLDOWN}
//      */
//     CGI_ACTION_COOLDOWN = 'cgiActionCooldown',
//     /**
//      * The amount of time to wait between actions
//      * when using a {@link ReconnectionMethod Reconnection Method}
//      * whose {@link ReconnectionMethod.type `type`} is `Other`.
//      * 
//      * @see {@link ProgramVariables.reconnectionMethods `ProgramVariables.reconnectionMethods.actionCooldown.other`}
//      * @see {@link PUPPETEER_ACTION_COOLDOWN}
//      * @see {@link CGI_ACTION_COOLDOWN}
//      */
//     OTHER_ACTION_COOLDOWN = 'otherActionCooldown'

// };

/**
 * A union of {@link EnvironmentVariable Environment Variables} that are
 * *required* for the program to function correctly.
 * 
 * @see {@link OptionalEnvironmentVariable}
 * @see {@link REQUIRED_ENVIRONMENT_VARIABLES}
 */
// export type RequiredEnvironmentVariable = Pick<typeof EnvironmentVariable, (typeof REQUIRED_ENVIRONMENT_VARIABLES)[number]>;
/**
 * A union of {@link EnvironmentVariable Environment Variables} that are
 * *optional* and are **not required** for the program to function correctly.
 * 
 * @see {@link RequiredEnvironmentVariable}
 * @see {@link REQUIRED_ENVIRONMENT_VARIABLES}
 */
// export type OptionalEnvironmentVariable = Omit<typeof EnvironmentVariable, (typeof REQUIRED_ENVIRONMENT_VARIABLES)[number]>

/**
 * An interface containing the raw `string` values of the valid
 * {@link EnvironmentVariable Environment Variables} that are
 * recognized by the program.
 * 
 * All {@link REQUIRED_ENVIRONMENT_VARIABLES Required Environment Variables}
 * will **always** have a `string` value, while *Optional Environment Variables*
 * may be `null` if they have not been set in the environment.
 * 
 * @see {@link ProgramVariables}
 */
// export type RawEnvironmentVariables = {
//     [Var in EnvironmentVariable]: (
//         Var extends RequiredEnvironmentVariable[keyof RequiredEnvironmentVariable]
//             ? string
//             : string | null
//     )
// };

/**
 * An interface containing the Program Variables that are customized
 * using the various {@link EnvironmentVariable Environment Variables}
 * that are recognized by the program.
 * 
 * Note that while similar to the {@link RawEnvironmentVariables} interface,
 * this interface transforms and combines the {@link RawEnvironmentVariables Raw Values}
 * of multiple Environment Variables together.
 * 
 * @see {@link RawEnvironmentVariables}
 */
// export interface ProgramVariables {

//     /**
//      * The Wi-Fi Frequency the WDS Bridge should be established on.
//      * 
//      * @see {@link EnvironmentVariable.WDS_BRIDGE_FREQUENCY}
//      */
//     wdsBridgeFrequency: WifiFrequency;

//     /**
//      * The amount of time to wait between calls to
//      * {@link verifyBridgeStatus `verifyBridgeStatus()`} in *milliseconds*.
//      * 
//      * @see {@link EnvironmentVariable.VERIFICATION_INTERVAL}
//      */
//     verificationInterval: number;

//     /**
//      * Program Variables associated with the Main Router
//      * the WDS Bridge is being established with.
//      */
//     mainRouter: {
//         /**
//          * The Full IP Address of the *Main Router*.
//          * 
//          * @see {@link EnvironmentVariable.MAIN_ROUTER_IP_NUM}
//          * @see {@link bridgeRouter `bridgeRouter.ip`}
//          */
//         ip: IpAddress;
//         /**
//          * The SSID of the Wi-Fi Network of the Main Router that the
//          * WDS Bridge is to be connected to.
//          * 
//          * @see {@link EnvironmentVariable.MAIN_ROUTER_NETWORK_NAME}
//          */
//         ssid: string;
//         /**
//          * The plaintext password of the {@link mainRouter.ssid} Main Router Wi-Fi Network}
//          * the WDS Bridge is to be established with.
//          * 
//          * If no password for the Main Router Wi-Fi Network was specified,
//          * this variable will be `null`.
//          * 
//          * @see {@link EnvironmentVariable.MAIN_ROUTER_WIFI_PW}
//          * @see {@link bridgeRouter `bridgeRouter.managementPw`}
//          */
//         wifiPw: string | null;
//     };
    
//     /**
//      * Program Variables associated with the Bridge Router
//      * responsible for operating the WDS Bridge.
//      */
//     bridgeRouter: {
//         /**
//          * The Full IP Address of the Bridge Router.
//          * 
//          * @see {@link EnvironmentVariable.BRIDGE_ROUTER_IP_NUM}
//          * @see {@link mainRouter `mainRouter.ip`}
//          */
//         ip: IpAddress;
//         /**
//          * The plaintext password used to login to the
//          * Management Interface of the Bridge Router.
//          * 
//          * @see {@link EnvironmentVariable.BRIDGE_ROUTER_MANAGEMENT_PW}
//          * @see {@link mainRouter `mainRouter.wifiPw`}
//          */
//         managementPw: string;
//     };
    
//     /**
//      * Program Variables associated with making subsequent
//      * attempts to re-establish the WDS Bridge after a previously-failed attempt.
//      */
//     retries: {
//         /**
//          * The minimum amount of time to wait before attempting to
//          * re-established the WDS Bridge after the last failed attempt.
//          * 
//          * @see {@link EnvironmentVariable.MIN_RETRY_TIME}
//          * @see {@link retries `retries.maxRetryTime`}
//          */
//         minRetryTime: number;
//         /**
//          * The maximum amount of time to wait before attempting to
//          * re-established the WDS Bridge after the last failed attempt.
//          * 
//          * @see {@link EnvironmentVariable.MAX_RETRY_TIME}
//          * @see {@link retries `retries.minRetryTime`}
//          */
//         maxRetryTime: number;
//         /**
//          * The maximum number of attempts to re-establish the WDS Bridge
//          * before attempting to switch the {@link currentReconnectionMethod Current Reconnection Method}.
//          * 
//          * Only applicable when {@link reconnectionMethods `reconnectionMethods.method`}
//          * or {@link reconnectionMethodPreference} is set to `'auto'`.
//          * 
//          * @see {@link EnvironmentVariable.MAX_METHOD_RETRIES}
//          * @see {@link retries `retries.maxFailureRetries`}
//          */
//         maxMethodRetries: number;
//         /**
//          * The maximum number of consecutive failed attempts to re-establish the WDS Bridge
//          * before giving up and throwing an {@link UnrecoverableError}.
//          * 
//          * @see {@link EnvironmentVariable.MAX_FAILURE_RETRIES}
//          * @see {@link retries `retries.maxMethodRetries`}
//          */
//         maxFailureRetries: number;
//     };

//     /**
//      * Program Variables associated with the {@link ReconnectionMethod Reconnection Methods}
//      * responsible for re-establishing the WDS Bridge.
//      */
//     reconnectionMethods: {
//         /**
//          * The {@link ReconnectionMethod.name name} of the {@link ReconnectionMethod Reconnection Method}
//          * to be used when re-establishing the WDS Bridge.
//          * 
//          * When set to `'auto'`, the Reconnection Method will be automatically
//          * selected from the {@link reconnectionMethods Registered Reconnection Methods}
//          * by the program and be permitted to switch between the available Reconnection Methods
//          * once the designated {@link MAX_METHOD_RETRIES} has been reached.
//          * 
//          * @see {@link EnvironmentVariable.RECONNECTION_METHOD `RECONNECTION_METHOD`}
//          */
//         method: string | 'auto';
//         /**
//          * Indicates whether or not the {@link ReconnectionMethod.setup Setup Routine}
//          * for each of the {@link reconnectionMethods Registered Reconnection Methods}
//          * should be *deferred* until the {@link ReconnectionMethod} is
//          * {@link ReconnectionMethod.run invoked} to re-establish the WDS Bridge.
//          * 
//          * @see {@link EnvironmentVariable.DEFER_RECONNECTION_METHOD_SETUP `DEFER_RECONNECTION_METHOD_SETUP`}
//          */
//         deferSetup: boolean;
//         /**
//          * Contains the hardcoded Encrypted Login Credentials
//          * to use when logging in to the Bridge Router Management Interface
//          * using the Bridge Router CGI.
//          * 
//          * If no hardcoded Encrypted Login Credentials were specified,
//          * this variable will be `null`.
//          * 
//          * @see {@link EnvironmentVariable.CGI_ENCRYPTED_LOGIN_USERNAME `CGI_ENCRYPTED_LOGIN_USERNAME`}
//          * @see {@link EnvironmentVariable.CGI_ENCRYPTED_LOGIN_PASSWORD `CGI_ENCRYPTED_LOGIN_PASSWORD`}
//          */
//         encryptedCgiCredentials: {
//             /**
//              * The hardcoded Encrypted Login Username to use when
//              * logging in to the Bridge Router Management Interface
//              * using the Bridge Router CGI.
//              * 
//              * @see {@link EnvironmentVariable.CGI_ENCRYPTED_LOGIN_USERNAME `CGI_ENCRYPTED_LOGIN_USERNAME`}
//              */
//             username: string,
//             /**
//              * The hardcoded Encrypted Login Password to use when
//              * logging in to the Bridge Router Management Interface
//              * using the Bridge Router CGI.
//              * 
//              * @see {@link EnvironmentVariable.CGI_ENCRYPTED_LOGIN_PASSWORD `CGI_ENCRYPTED_LOGIN_PASSWORD`}
//              */
//             password: string
//         } | null;
//         /**
//          * Program Variables used to specify the amount of time
//          * to wait between actions or operations when utilizing
//          * various {@link ReconnectionMethod.type types} of {@link ReconnectionMethod Reconnection Methods}
//          * to re-establish the WDS Bridge.
//          */
//         actionCooldown: {
//             /**
//              * The amount of time to [wait between Puppeteer Actions](https://pptr.dev/api/puppeteer.connectoptions#slowmo)
//              * in *milliseconds*.
//              * 
//              * This cooldown only applies to {@link ReconnectionMethod Reconnection Methods}
//              * whose {@link ReconnectionMethod.type `type`} is `Puppeteer`.
//              * 
//              * @see {@link EnvironmentVariable.PUPPETEER_ACTION_COOLDOWN `PUPPETEER_ACTION_COOLDOWN`}
//              */
//             puppeteer: number;
//             /**
//              * The amount of time to wait between requests made to
//              * the Router Browser CGI in *milliseconds*.
//              * 
//              * This cooldown only applies to {@link ReconnectionMethod Reconnection Methods}
//              * whose {@link ReconnectionMethod.type `type`} is `CGI`.
//              * 
//              * @see {@link EnvironmentVariable.CGI_ACTION_COOLDOWN `CGI_ACTION_COOLDOWN`}
//              */
//             cgi: number;
//             /**
//              * The amount of time to wait between actions
//              * when using a {@link ReconnectionMethod Reconnection Method}
//              * whose {@link ReconnectionMethod.type `type`} is `Other`.
//              * 
//              * @see {@link EnvironmentVariable.OTHER_ACTION_COOLDOWN `OTHER_ACTION_COOLDOWN`}
//              */
//             other: number;
//         };
//     };

// };


/* Constants */

/**
 * The prefix of all Environment Variables recognized by the program.
 * 
 * @deprecated  This type currently has no counterpart in the `config` API.
 * 
 * @apistatus   ⚠️ *Deprecated*
 * @since       `v1`
 */
export const ENV_VAR_PREFIX = 'WDSBW';

/**
 * The {@link EnvironmentVariable Environment Variables} that are
 * *required* for the program to function correctly.
 * 
 * Any Environment Variables that are *not* found in this array
 * are considered to be *Optional* and may or may not be set
 * in the environment at runtime.
 * 
 * @see {@link RequiredEnvironmentVariable}
 * @see {@link OptionalEnvironmentVariable}
 */
// export const REQUIRED_ENVIRONMENT_VARIABLES = [
//     'SUBNET_NUM',
//     'MAIN_ROUTER_IP_NUM',
//     'MAIN_ROUTER_NETWORK_NAME',
//     'BRIDGE_ROUTER_IP_NUM',
//     'BRIDGE_ROUTER_MANAGEMENT_PW'
// ] as const satisfies (keyof typeof EnvironmentVariable)[];


/* Helper Functions */ 

/**
 * Get the full name of the given {@link EnvironmentVariable},
 * including the {@link ENV_VAR_PREFIX Environment Variable Prefix}.
 * 
 * @param envVar    The desired {@link EnvironmentVariable Environment Variable}.
 * 
 * @returns         The resulting string from concatenating the specified `envVar`
 *                  to the {@link ENV_VAR_PREFIX}.
 * 
 * @see {@link fetchEnvironmentVariable `fetchEnvironmentVariable()`}
 */
// export const getEnvironmentVariableName = ( envVar: keyof typeof EnvironmentVariable ) => (
//     `${ENV_VAR_PREFIX}_${envVar}`
// ) as const;
/**
 * Fetch the raw `string` value of the specified {@link EnvironmentVariable}
 * from {@link process.env}, automatically retrieving the {@link getEnvironmentVariableName full name}
 * of the specified `envVar`.
 * 
 * @param envVar    The desired {@link EnvironmentVariable Environment Variable}.
 * 
 * @returns         The value of the specified `envVar` in the {@link process.env} object,
 *                  which will either be a `string` if the specified {@link EnvironmentVariable Environment Variable}
 *                  exists, or `undefined` if it does not.
 * 
 * @see {@link getEnvironmentVariableName `getEnvironmentVariableName()`}
 */
// export const fetchEnvironmentVariable = ( envVar: keyof typeof EnvironmentVariable ) => process.env[getEnvironmentVariableName(envVar)];

const joinProgramVariables = ( programVars: ObjectUtils.DynamicObjectKeyType | ObjectUtils.DynamicObjectKeyType[] ): string => {

    const programVarsArray = ArrayUtils.arrayify(programVars);
    let joinedStr = "";

    
    for (let i = 0; i < programVarsArray.length; i++) {
        if (joinedStr.length > 0)
            joinedStr += ', ';

        joinedStr += `[${ArrayUtils.arrayify(programVars).join('][')}]`;
    }

    return joinedStr;

};


/* Module Side-Effects */

// (() => {

//     if (typeof fetchEnvironmentVariable('ENABLE_VERBOSE_LOGGING') != 'undefined')
//         setVerboseLogging(true);
    
//     if (typeof fetchEnvironmentVariable('ENABLE_VERBOSE_DATA_LOGGING') != 'undefined')
//         setVerboseDataLogging(true);

//     if (typeof fetchEnvironmentVariable('VERIFICATION_INTERVAL') != 'undefined')
//         RuntimeVariables.setDefaultVerificationInterval(
//             parseInt(fetchEnvironmentVariable('VERIFICATION_INTERVAL')!),
//             true
//         );
        
//     if (typeof fetchEnvironmentVariable('DEFER_RECONNECTION_METHOD_SETUP') != 'undefined')
//         verboseLog(ConsoleUtils.colorizeOutput(
//             "Deferring Reconnection Method Setup!",
//             ConsoleUtils.ForegroundColor.MAGENTA
//         ));

// })();


/* Global Variables */

var retrievedRegisteredVars: boolean = false;
var registeredEnvVars: Required<EnvironmentVariableDefinitions> = {
    variables: {},
    complexProgramVars: []
};
var registeredRawEnvVars: Readonly<RawEnvironmentVariables> | null = null;
var registeredProgramVars: Readonly<ProgramVariables> | null = null;
var sensitiveRegisteredEnvVars: string[] = [];
var sensitiveRegisteredProgramVars: ObjectUtils.DynamicObjectKeyType[] = [];

/**
 * @deprecated  Migrate to {@link Config.getProgramConfig `getProgramConfig()`}.
 * 
 * @apistatus   ⚠️ *Deprecated*
 * @since       `v1`
 */
export const programEnvVarManager = (() => {

    const EMPTY_BASE_VARS = { variables: {} } as const satisfies EnvironmentVariableDefinitions;

    return registerEnvironmentVariables(EnvironmentVariableManager.BASE_VARS, EMPTY_BASE_VARS);

})();


/* Functions */

/**
 * Get the full name of the given {@link EnvironmentVariable},
 * including the {@link ENV_VAR_PREFIX Environment Variable Prefix}.
 * 
 * @deprecated      This type has no counterpart in the `config` API.
 * 
 * @param envVar    The desired {@link EnvironmentVariable Environment Variable}.
 * 
 * @returns         The resulting string from concatenating the specified `envVar`
 *                  to the {@link ENV_VAR_PREFIX}.
 * 
 * @apistatus       ⚠️ *Deprecated*
 * @since           `v1`
 * 
 * @see {@link fetchEnvironmentVariable `fetchEnvironmentVariable()`}
 */
export const getEnvironmentVariableName = ( envVar: string ) => (`${ENV_VAR_PREFIX}_${envVar}`) as const;
/**
 * Fetch the raw `string` value of the specified {@link EnvironmentVariable}
 * from {@link process.env}, automatically retrieving the {@link getEnvironmentVariableName full name}
 * of the specified `envVar`.
 * 
 * @deprecated      This type has no counterpart in the `config` API.
 * 
 * @param envVar    The desired {@link EnvironmentVariable Environment Variable}.
 * 
 * @returns         The value of the specified `envVar` in the {@link process.env} object,
 *                  which will either be a `string` if the specified {@link EnvironmentVariable Environment Variable}
 *                  exists, or `undefined` if it does not.
 * 
 * @apistatus       ❌ **Private**
 * 
 * @see {@link getEnvironmentVariableName `getEnvironmentVariableName()`}
 */
export const fetchEnvironmentVariable = ( envVar: string ) => process.env[getEnvironmentVariableName(envVar)];

/**
 * @deprecated  This type currently has no counterpart in the `config` API.
 * 
 * @apistatus   ⚠️ *Deprecated*
 * @since       `v1`
 */
export function registerEnvironmentVariables <
    BaseVarsT extends EnvironmentVariableDefinitions = EnvironmentVariableManager.BaseVarsType,
    CustomVarsT extends OverridableEnvironmentVariableDefinitions<BaseVarsT> = { variables: {} },
    ReturnT extends EnvironmentVariableManager<BaseVarsT, CustomVarsT> = EnvironmentVariableManager<BaseVarsT, CustomVarsT>
> ( customDefinitions: CustomVarsT, baseDefinitions?: BaseVarsT ): ReturnT {

    if (retrievedRegisteredVars)
        throw new LogicError("New Environment Variables cannot be registered because the values of all Registered Environment Variables have already been retrieved!");

    for (const envVarName in customDefinitions.variables) {
        const envVar = customDefinitions.variables[envVarName];

        if (envVarName in registeredEnvVars.variables) {
            const existingEnvVar = registeredEnvVars.variables[envVarName];

            if (envVar.required && !existingEnvVar.required)
                throw new TypeError(`The Environment Variable '${envVarName}' cannot be made Optional because it has already been made Required.`);
            else if (envVar.programVar != existingEnvVar.programVar && existingEnvVar.programVar)
                throw new TypeError(`The Program Variable Assignment for the Environment Variable '${envVarName}' cannot be changed because it has already been set.`);
            else if (envVar.programVarConversionFn != existingEnvVar.programVarConversionFn && existingEnvVar.programVar)
                throw new TypeError(`The Program Variable Conversion Function for the Environment Variable '${envVarName}' cannot be changed because it has already been explicitly set (or omitted).`);
        
            registeredEnvVars.variables[envVarName] = Object.assign(registeredEnvVars.variables[envVarName], envVar);
        }
        else {
            registeredEnvVars.variables[envVarName] = envVar;
        }
    }

    if (customDefinitions.complexProgramVars) {
        customComplexProgramVarsLoop: for (const definition of customDefinitions.complexProgramVars) {
            const programVar = ArrayUtils.arrayify(definition[0]);
            
            for (let i = 0; i < registeredEnvVars.complexProgramVars.length; i++) {
                const searchDefinition = registeredEnvVars.complexProgramVars[i];
                const searchProgramVar = ArrayUtils.arrayify(searchDefinition[0]);

                if (ArrayUtils.deepEquals(programVar, searchProgramVar)) {
                    if (definition[1] != searchDefinition[1]) {
                        throw new TypeError(`The Complex Program Variable '${joinProgramVariables(programVar)}' cannot be changed because it has already been explicitly set (or omitted).`);
                    }

                    registeredEnvVars.complexProgramVars[i] = definition;
                    continue customComplexProgramVarsLoop;
                }
            }

            registeredEnvVars.complexProgramVars.push(definition);
        }
    }

    return new EnvironmentVariableManager(customDefinitions, baseDefinitions) as ReturnT;

}
/**
 * @deprecated  This type currently has no counterpart in the `config` API.
 * 
 * @apistatus   ❌ **Private**
 */
export function retrieveRegisteredVars (): void {

    if (retrievedRegisteredVars)
        throw new LogicError("The Registered Environment & Program Variables have already been retrieved!");

    let missingEnvVars: string[] = [];
    let rawEnvVars = {} as RawEnvironmentVariables;
    let programVars = {} as ProgramVariables;

    for (const envVarName in registeredEnvVars.variables) {
        const envVar = registeredEnvVars.variables[envVarName];
        const rawEnvVarValue = fetchEnvironmentVariable(envVarName) ?? null;

        rawEnvVars[envVarName] = rawEnvVarValue;

        if (rawEnvVarValue !== null) {
            if (envVar.programVar) {
                ObjectUtils.setNestedProperty(
                    programVars,
                    envVar.programVar as ObjectUtils.DynamicObjectKey<typeof programVars>,
                    (
                        envVar.programVarConversionFn
                            ? envVar.programVarConversionFn(rawEnvVarValue, envVar)
                            : rawEnvVarValue
                    )
                );
            }
        }
        else {
            if (envVar.required) {
                missingEnvVars.push(getEnvironmentVariableName(envVarName));
            }
            else {
                if (envVar.programVar) {
                    ObjectUtils.setNestedProperty(
                        programVars,
                        envVar.programVar as ObjectUtils.DynamicObjectKey<typeof programVars>,
                        envVar.programVarDefaultValue
                    );
                }
            }
        }
    }

    registeredRawEnvVars = Object.freeze(rawEnvVars);

    for (let i = 0; i < registeredEnvVars.complexProgramVars.length; i++) {
        let definition = registeredEnvVars.complexProgramVars[i];
        let programVarName = ArrayUtils.arrayify(definition[0]) as ObjectUtils.ComplexObjectKey<typeof programVars>;

        ObjectUtils.setNestedProperty(
            programVars,
            programVarName,
            definition[1](registeredRawEnvVars, programVarName)
        );
    }

    if (missingEnvVars.length > 0) {
        throw new RuntimeError(
            `The following Required Environment Variables were not found:\n\t'${missingEnvVars.join("'\n\t'")}'\n`
            + "Environment Variables can be defined using a '.env' file or by manually adding them to the environment."
        );
    }

    registeredProgramVars = Object.freeze(programVars);
    retrievedRegisteredVars = true;

}

/**
 * @deprecated  Migrate to {@link Config.getProgramConfig `getProgramConfig()`}.
 * 
 * @apistatus   ⚠️ *Deprecated*
 * @since       `v1`
 */
export const getRawEnvVars = ( redacted?: boolean ) => programEnvVarManager.getRawEnvVars(redacted);
/**
 * @deprecated  Migrate to {@link Config.getProgramVars `getProgramVars()`}.
 * 
 * @apistatus   ⚠️ *Deprecated*
 * @since       `v1`
 */
export const getProgramVars = ( redacted?: boolean ) => programEnvVarManager.getProgramVars(redacted);


/* Exported Members */

/**
 * A Readonly Object containing the {@link RawEnvironmentVariables Raw Values}
 * of the Environment Variables recognized by the program.
 * 
 * @see {@link getProgramVars `programVars`}
 */
// export var rawEnvVars: Readonly<RawEnvironmentVariables> = (() => {

//     let rawEnvVars = {} as RawEnvironmentVariables;
//     let missingRequiredEnvVars: (ReturnType<typeof getEnvironmentVariableName>)[] = [];

//     verboseDataLog();

//     for (const envVarName in EnvironmentVariable) {
//         const fullEnvVarName = getEnvironmentVariableName(envVarName as keyof typeof EnvironmentVariable);
//         const envVar: EnvironmentVariable = EnvironmentVariable[envVarName];
//         const envVarValue = process.env[fullEnvVarName];

//         if (typeof envVarValue == 'undefined') {
//             if (REQUIRED_ENVIRONMENT_VARIABLES.includes(envVarName as keyof RequiredEnvironmentVariable)) {
//                 missingRequiredEnvVars.push(fullEnvVarName);
//             }
//         }
//         else {
//             verboseDataLog(() => [
//                 "</>",
//                 REQUIRED_ENVIRONMENT_VARIABLES.includes(envVarName as keyof RequiredEnvironmentVariable)
//                     ? ConsoleUtils.colorizeOutput('Required', ConsoleUtils.ForegroundColor.YELLOW)
//                     : ConsoleUtils.colorizeOutput('Optional', ConsoleUtils.ForegroundColor.CYAN),
//                 "Environment Variable Found:",
//                 ConsoleUtils.colorizeOutput(fullEnvVarName)
//             ]);
//         }
        
//         rawEnvVars[envVar] = (envVarValue ?? null) as any;
//     }

//     if (missingRequiredEnvVars.length > 0) {
//         throw new Error(
//             `The following Required Environment Variables were not found:\n\t'${missingRequiredEnvVars.join("'\n\t'")}'\n`
//             + "Environment Variables can be defined using a '.env' file or by manually adding them to the environment."
//         );
//     }

//     verboseDataLog();
//     return Object.freeze(rawEnvVars);

// })();

/**
 * A Readonly Object containing the {@link ProgramVariables Program Variables}
 * based on the {@link EnvironmentVariable Environment Variables} that are
 * recognized by the program.
 * 
 * @see {@link rawEnvVars `rawEnvVars`}
 */
// export var programVars: Readonly<ProgramVariables> = (() => {

//     function parseNumericEnvVar ( envName: keyof RequiredEnvironmentVariable ): number;
//     function parseNumericEnvVar ( envName: keyof OptionalEnvironmentVariable, defaultValue: number ): number;
//     function parseNumericEnvVar <
//         T extends keyof typeof EnvironmentVariable,
//         U extends (T extends keyof OptionalEnvironmentVariable ? number : undefined)
//     > ( envName: T, defaultValue?: U ): number {

//         let rawValue = rawEnvVars[ EnvironmentVariable[envName] ];
//         let parsedValue = typeof rawValue == 'string'
//             ? parseInt(rawValue)
//             : NaN;

//         if (isNaN(parsedValue)) {
//             if (REQUIRED_ENVIRONMENT_VARIABLES.includes(envName as keyof RequiredEnvironmentVariable))
//                 throw new TypeError(`The specified value for the '${getEnvironmentVariableName(envName)}' Environment Variable is invalid!`);
//             else
//                 return defaultValue ?? 0;
//         }
//         else if (parsedValue <= 0)
//             throw new TypeError(`The value for the '${getEnvironmentVariableName(envName)}' Environment Variable must be a postive, nonzero number.`);

//         return parsedValue;

//     }

//     let subnetNum = parseNumericEnvVar('SUBNET_NUM');
//     let bridgeFrequency: WifiFrequency = (() => {

//         if (rawEnvVars.wdsBridgeFrequency != null) {
//             let lcValue = rawEnvVars.wdsBridgeFrequency.toLowerCase();

//             if (lcValue == '2.5ghz' || lcValue == '1')
//                 return '2.4GHz';
//             else if (lcValue == '5ghz' || lcValue == '2')
//                 return '5GHz';
//             else
//                 throw new TypeError(
//                     `'${rawEnvVars.wdsBridgeFrequency}' is not a valid Wi-Fi Frequency option `
//                         + `for the '${getEnvironmentVariableName('WDS_BRIDGE_FREQUENCY')}' Environment Variable.`
//                 );
//         }

//         return '5GHz';

//     })();
//     let verificationInterval = (() => {

//         let parsedInterval = parseNumericEnvVar('VERIFICATION_INTERVAL', 15000);

//         if (parsedInterval < 1000)
//             throw new TypeError(`'${rawEnvVars.verificationInterval}' is not a valid value for the '${getEnvironmentVariableName('VERIFICATION_INTERVAL')}' Environment Variable.`)

//         return parsedInterval;

//     })();

//     return Object.freeze({
//         wdsBridgeFrequency: bridgeFrequency,
//         verificationInterval: verificationInterval,
//         mainRouter: {
//             ip: `192.168.${subnetNum}.${parseNumericEnvVar('MAIN_ROUTER_IP_NUM')}` as const,
//             ssid: rawEnvVars.mainRouterSsid,
//             wifiPw: rawEnvVars.mainRouterWifiPw ?? null,
//         },
//         bridgeRouter: {
//             ip: `192.168.${subnetNum}.${parseNumericEnvVar('BRIDGE_ROUTER_IP_NUM')}` as const,
//             managementPw: rawEnvVars.bridgeRouterManagementPw,
//         },
//         retries: {
//             minRetryTime: parseNumericEnvVar('MIN_RETRY_TIME', 5000),
//             maxRetryTime: parseNumericEnvVar('MAX_RETRY_TIME', 60000),
//             maxMethodRetries: parseNumericEnvVar('MAX_METHOD_RETRIES', 3),
//             maxFailureRetries: parseNumericEnvVar('MAX_FAILURE_RETRIES', 15),
//         },
//         reconnectionMethods: {
//             method: rawEnvVars.reconnectionMethod?.toLowerCase() ?? 'auto',
//             deferSetup: rawEnvVars.deferReconnectionMethodSetup !== null,
//             encryptedCgiCredentials: (rawEnvVars.cgiEncryptedLoginUsername !== null && rawEnvVars.cgiEncryptedLoginPassword !== null)
//                 ? {
//                     username: rawEnvVars.cgiEncryptedLoginUsername,
//                     password: rawEnvVars.cgiEncryptedLoginPassword
//                 }
//                 : null,
//             actionCooldown: {
//                 puppeteer: parseNumericEnvVar('PUPPETEER_ACTION_COOLDOWN', 100),
//                 cgi: parseNumericEnvVar('CGI_ACTION_COOLDOWN', 1250),
//                 other: 0
//             }
//         },
//     });

// })();


/* Module Side-Effects */

// (() => {

//     if (typeof fetchEnvironmentVariable('ENABLE_VERBOSE_LOGGING') != 'undefined')
//         setVerboseLogging(true);
    
//     if (typeof fetchEnvironmentVariable('ENABLE_VERBOSE_DATA_LOGGING') != 'undefined')
//         setVerboseDataLogging(true);

//     if (typeof fetchEnvironmentVariable('VERIFICATION_INTERVAL') != 'undefined')
//         RuntimeVariables.setDefaultVerificationInterval(
//             parseInt(fetchEnvironmentVariable('VERIFICATION_INTERVAL')!),
//             true
//         );
        
//     if (typeof fetchEnvironmentVariable('DEFER_RECONNECTION_METHOD_SETUP') != 'undefined')
//         verboseLog(ConsoleUtils.colorizeOutput(
//             "Deferring Reconnection Method Setup!",
//             ConsoleUtils.ForegroundColor.MAGENTA
//         ));

// })();


/* Module Side-Effects */

// (() => {

//     if (typeof fetchEnvironmentVariable('ENABLE_VERBOSE_LOGGING') != 'undefined')
//         setVerboseLogging(true);
    
//     if (typeof fetchEnvironmentVariable('ENABLE_VERBOSE_DATA_LOGGING') != 'undefined')
//         setVerboseDataLogging(true);

//     if (typeof fetchEnvironmentVariable('VERIFICATION_INTERVAL') != 'undefined')
//         RuntimeVariables.setDefaultVerificationInterval(
//             parseInt(fetchEnvironmentVariable('VERIFICATION_INTERVAL')!),
//             true
//         );
        
//     if (typeof fetchEnvironmentVariable('DEFER_RECONNECTION_METHOD_SETUP') != 'undefined')
//         verboseLog(ConsoleUtils.colorizeOutput(
//             "Deferring Reconnection Method Setup!",
//             ConsoleUtils.ForegroundColor.MAGENTA
//         ));

// })();
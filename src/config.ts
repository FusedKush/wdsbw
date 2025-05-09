/**
 * The `config` Module provides a standardized API for defining
 * Program Configuration Options and mapping them to Program Variables
 * that can be easily retrieved and utilized by dependent code at runtime.
 * 
 * The Program Configuration API exposed by this module provides two types
 * of Configuration Objects: *Configuration Options*, which refer to the
 * raw {@link JSON.parse `JSON.parse()`-ed values} specified within the
 * asociated Configuration File, and *Program Variables*, which refer to
 * the processed and converted values of any type that are directly retrievable
 * by dependent code.
 * 
 * Consumers of the Program Configuration API primarily define
 * and utilize Configuration Options by extending the {@link ProgramConfiguration} class.
 * The defined Configuration Options and the associated Program Variables are specified
 * as *Type Parameters* to the base `ProgramConfiguration` class. A complete example
 * of a custom program configuration might look something like the following:
 * ```ts
 * namespace MyProgramConfiguration {
 *      export const MY_CONFIG_OPTIONS = {
 *          foo: {
 *              key: 'foo',
 *              name: 'My Foo',
 *              type: 'object',
 *              description: 'My Foo Object.',
 *              programVar: false,
 *              properties: {
 *                  bar: {
 *                      key: 'bar',
 *                      name: 'My Foobar',
 *                      type: 'number',
 *                      description: 'My Foobar Number',
 *                      programVar: ['components', 'foobar'],
 *                      validationFn: (value) => (value >= 0)
 *                  },
 *                  baz: {
 *                      key: 'baz',
 *                      name: 'My Foobaz',
 *                      type: 'string',
 *                      description: 'My Foobaz String',
 *                      programVar: ['components', 'foobaz'],
 *                      validationFn: (value) => (value.trim().length > 0)
 *                  }
 *              }
 *          }
 *      } as const satisfies ProgramConfiguration.ConfigurationOptionMapType;
 *      export type MyConfigurationOptions = (typeof MY_CONFIG_OPTIONS);
 * 
 *      export const MY_COMPLEX_PROGRAM_VARS = [
 *          {
 *              programVar: 'foobarbaz',
 *              conversionFn: (configOptions) => `${configOptions.foo.baz}: ${configOptions.foo.bar}` as const
 *          }
 *      ] as const satisfies ProgramConfiguration.ComplexProgramVariable<BaseConfigurationOptions>[];
 *      export type MyComplexProgramVariables = (typeof MY_COMPLEX_PROGRAM_VARS)[number];
 *      export type MyComplexProgramVariablesMap = ProgramConfiguration.ComplexProgramVariableMap<
 *          MyComplexProgramVariables['programVar'],
 *          MyConfigurationOptions,
 *          MyComplexProgramVariables
 *      >;
 *
 *      export const MY_CONFIG_DEFINITIONS = {
 *          configOptions: MY_CONFIG_OPTIONS,
 *          complexProgramVars: (() => {
 *              
 *              let configOptions: MyComplexProgramVariablesMap = new Map();
 *
 *              for (let i = 0; i < MY_COMPLEX_PROGRAM_VARS.length; i++) {
 *                  const complexProgramVar = MY_COMPLEX_PROGRAM_VARS[i];
 *
 *                  configOptions.set(complexProgramVar.programVar, complexProgramVar);
 *              }
 *
 *              return configOptions;
 *
 *          })()
 *      } as const satisfies ProgramConfiguration.ProgramConfigurationDefinitions<
 *          MyConfigurationOptions,
 *          MyComplexProgramVariablesMap
 *      >;
 *      export type MyConfigurationDefinitions = typeof MY_CONFIG_DEFINITIONS;
 * }
 * 
 * class MyProgramConfiguration <PrefetchedT extends boolean = false>
 *      extends ProgramConfiguration<PrefetchedT, [MyProgramConfiguration.MyConfigurationDefinitions]>
 * {
 * 
 *      constructor () {
 *      
 *          super(MyProgramConfiguration.MY_CONFIG_DEFINITIONS);
 * 
 *      }
 * 
 * }
 * 
 * console.log(myConfig.getConfigVars());
 * // {
 * //   foo: {
 * //       bar: 42,
 * //       baz: "The Answer"
 * //   }
 * // }
 * 
 * console.log(myConfig.getProgramVars());
 * // {
 * //   components: {
 * //       foobar: 42,
 * //       foobaz: "The Answer"
 * //   }.
 * //   foobarbaz: "The Answer: 42"
 * // }
 * ```
 * 
 * By default, this module provides a set of pre-defined Program Configuration Options
 * available via the {@link BaseProgramConfiguration} class and associated namespace.
 * Furthermore, the Program Configuration API makes it easy to build upon existing
 * configurations while adding new Configuration Options and Program Variables, as
 * well as making compatible changes to existing ones:
 * ```ts
 * // The following pattern extends the pre-defined `BaseProgramConfiguration`
 * // Configuration Options, allowing us to add our own Configuration Options
 * // and Program Variables, while also making it possible for our custom
 * // Configuration Options to themselves be extended as well. 
 * 
 * export class MyProgramConfiguration <
 *     PrefetchedT extends boolean = false,
 *     CustomDefsT extends ProgramConfiguration.ProgramConfigurationDefinitionsType[] = []
 * > extends BaseProgramConfiguration<PrefetchedT, [MyProgramConfiguration.MyConfigurationDefinitions, ...CustomDefsT]> {
 * 
 *     constructor ();
 *     constructor ( ...customDefinitions: CustomDefsT );
 *     constructor ( otherConfig?: BaseProgramConfiguration<boolean, CustomDefsT> );
 *     constructor ( ...customDefsOrOtherConfig: CustomDefsT | [BaseProgramConfiguration<boolean, CustomDefsT>] ) {
 * 
 *         if (customDefsOrOtherConfig instanceof MyProgramConfiguration)
 *             super(customDefsOrOtherConfig);
 *         else
 *             super(MyProgramConfiguration.MY_CONFIG_DEFINITIONS, ...customDefsOrOtherConfig as [...CustomDefsT]);
 * 
 *     }
 * 
 * }
 * ```
 * 
 * 
 * ## Constructing and Loading {@link ProgramConfiguration} Objects
 * During construction, {@link ProgramConfiguration} objects make no effort to initialize
 * the defined Configuration Options and Program Variables or retrieve them from
 * the Configuration File. In order to do so, the {@link ProgramConfiguration.prototype.load `load()`}
 * method has to be used to populate the object after construction.
 * ```ts
 * let myConfig = new MyProgramConfiguration();
 * myConfig.load();
 * ````
 * 
 * However, because the Configuration Options and Program Variables may not have been
 * populated after constructing a {@link ProgramConfiguration} object, the
 * {@link ProgramConfiguration.prototype.getConfigVars `getConfigVars()`} and
 * {@link ProgramConfiguration.prototype.getProgramVars `getProgramVars()`} methods
 * may return `null` until the {@link ProgramConfiguration.prototype.load `load()`}
 * method has been invoked. E.g.,
 * ```ts
 * const myConfig = new MyProgramConfiguration();
 * 
 * console.log(myConfig.getConfigVars());   // null
 * console.log(myConfig.getProgramVars());  // null
 * myConfig.load();
 * console.log(myConfig.getConfigVars());   // { ... }
 * console.log(myConfig.getProgramVars());  // { ... }
 * ````
 * 
 * This can make it annoying to use these methods, as the return type
 * always includes `null`. E.g.,
 * ```ts
 * const myConfig = new MyProgramConfiguration();
 * myConfig.load();
 * 
 * const myConfigVars = myConfig.getConfigVars();       // { ... } | null
 * const myProgramVars = myConfig.getProgramVars();     // { ... } | null
 * ```
 * 
 * This is where the {@link ProgramConfigurationFactory} comes in, which makes it possible
 * to programatically construct and {@link ProgramConfiguration.prototype.load `load()`},
 * {@link ProgramConfiguration} objects. `ProgramConfiguration` objects are then constructed
 * using the {@link ProgramConfigurationFactory.prototype.construct `construct()`} and
 * {@link ProgramConfigurationFactory.prototype.fetch `fetch()`} methods, the latter
 * of which allows for the `ProgramConfiguration` object to be `load()`-ed before
 * being returned to the caller.
 * 
 * ```ts
 * export class MyProgramConfigurationFactory <
 *     CustomDefsT extends ProgramConfiguration.ProgramConfigurationDefinitionsType[] = []
 * > extends ProgramConfigurationFactory<[MyProgramConfiguration.MyConfigurationDefinitions, ...CustomDefsT]> {
 * 
 *     construct = <PrefetchedT extends boolean = true> ( retrieveConfig?: PrefetchedT ): ProgramConfiguration<
 *         PrefetchedT,
 *         [MyProgramConfiguration.MyConfigurationDefinitions, ...CustomDefsT]
 *     > => new MyProgramConfiguration<PrefetchedT, CustomDefsT>();
 * 
 * }
 * 
 * const myConfigFactory = new MyProgramConfigurationFactory();
 * const myConfig = myConfigFactory.fetch();
 * 
 * console.log(myConfig.getConfigVars());   // { ... }
 * console.log(myConfig.getProgramVars());  // { ... }
 * ```
 * 
 * Crucially, by constructing `ProgramConfiguration` objects using a `ProgramConfigurationFactory`,
 * the {@link ProgramConfiguration.prototype.getConfigVars `getConfigVars()`}
 * and {@link ProgramConfiguration.prototype.getProgramVars `getProgramVars()`} methods
 * can be made to never return `null` and, as a result, will be typed as such:
 * ```ts
 * const myDirectConfig = new MyProgramConfiguration();
 * const myFactoryConfig = (new MyProgramConfigurationFactory()).fetch();
 * 
 * const myDirectConfigVars = myDirectConfig.getConfigVars();       // { ... } | null
 * const myDirectProgramVars = myDirectConfig.getProgramVars();     // { ... } | null
 * const myFactoryConfigVars = myFactoryConfig.getConfigVars();     // { ... }
 * const myFactoryProgramVars = myFactoryConfig.getProgramVars();   // { ... }
 * ```
 * 
 * It is important to note that `null` will only be removed from the return type of
 * the {@link ProgramConfiguration.prototype.getConfigVars `getConfigVars()`}
 * and {@link ProgramConfiguration.prototype.getProgramVars `getProgramVars()`} methods
 * when the {@link ProgramConfigurationFactory.prototype.fetch `fetch()`} method is used
 * to {@link ProgramConfiguration.prototype.load `load()`} the {@link ProgramConfiguration}
 * before being returned to the caller. If `false` is passed for the `retrieveConfig` argument
 * of the {@link ProgramConfigurationFactory.prototype.fetch `fetch()`} method, or if the
 * {@link ProgramConfigurationFactory.prototype.construct `construct()`} method is directly
 * invoked instead, the returned `ProgramConfiguration` will be typed the same way as if
 * it were constructed directly. E.g.,
 * ```ts
 * const myConfigFactory = new MyProgramConfigurationFactory();
 * 
 * myConfigFactory.fetch().getConfigVars();         // { ... }
 * myConfigFactory.fetch(true).getConfigVars();     // { ... }
 * myConfigFactory.fetch(false).getConfigVars();    // { ... } | null
 * myConfigFactory.construct().getConfigVars();     // { ... } | null
 * (new MyProgramConfiguration()).getConfigVars();  // { ... } | null
 * ```
 * 
 * Finally, the {@link ProgramConfigurationFactory} class provides helper methods
 * for constructing, {@link ProgramConfiguration.prototype.load `load()`-ing}, and
 * retrieving or modifying Configuration Options and Program Variables
 * using the {@link ProgramConfigurationFactory.prototype.getConfigVars `getConfigVars()`},
 * {@link ProgramConfigurationFactory.prototype.getProgramVars `getProgramVars()`},
 * and {@link ProgramConfigurationFactory.prototype.setConfigVars `setConfigVars()`}
 * methods. E.g.,
 * ```ts
 * const configVars = (new MyProgramConfigurationFactory()).getProgramVars();
 * 
 * // ...is equivalent to the following:
 * const myConfig = new MyProgramConfiguration();
 *       myConfig.load();
 * const configVars = myConfig.getProgramVars();
 * ```
 * 
 * 
 * ## Configuration Files
 * Regardless of the object or class used, the Configuration Options and Program Variables
 * will be stored in and retrieved from a single JSON Configuration File stored at the
 * location specified by the {@link ProgramConfiguration.CONFIG_FILE_PATH} constant.
 * 
 * To avoid causing side effects when loading the module, it is the responsibility of
 * the caller to ensure the Configuration File exists before attempting to 
 * {@link ProgramConfiguration.prototype.load `load()`} or
 * {@link ProgramConfiguration.prototype.save `save()`} any configuration data.
 * To do so, simply call the {@link ensureConfigFileExists `ensureConfigFileExists()`} function
 * prior to `load()`-ing or `save()`-ing any {@link ProgramConfiguration} objects. E.g.,
 * ```ts
 * const myConfig = new MyProgramConfiguration();
 * ensureConfigFileExists();
 * myConfig.load();
 * myConfig.save();
 * ```
 */
declare module "./config.js";


import { existsSync } from "node:fs";
import readline from "node:readline";

import {
    ArrayUtils,
    assertIsType,
    ConsoleUtils,
    deepClone,
    FileManager,
    FunctionUtils,
    UnionToIntersection,
    JSONFileManager,
    LogicError,
    ObjectUtils,
    RuntimeError,
    SensitiveProperties,
    IsAnyType
} from "./utils.js";
import {
    ObjectKey,
    IpAddress,
    setVerboseLogging,
    TypeofType,
    TypeofTypeString,
    useVerboseLogging,
    WIFI_FREQUENCY_LIST
} from "./common.js";
import { closeReadlineInterface, createReadlineInterface, KeypressHandlers } from "./runtime.js";

import colorizeOutput = ConsoleUtils.colorizeOutput;
import ForegroundColor = ConsoleUtils.ForegroundColor;
import BrightForegroundColor = ConsoleUtils.BrightForegroundColor;
import path from "node:path";


/* Main Program Configuration API */

/**
 * An object representing a *Program Configuration Specification*, which
 * contains all of the information needed to define, retrieve,
 * query, and manipulate both *Configuration Options* and *Program Variables*.
 * 
 * Consumers of the Program Configuration API primarily define
 * and utilize Configuration Options by extending this class.
 * The defined Configuration Options and the associated Program Variables
 * are specified as *Type Parameters*.
 * 
 * A complete example of a custom program configuration might
 * look something like the following:
 * ```ts
 * namespace MyProgramConfiguration {
 *      export const MY_CONFIG_OPTIONS = {
 *          foo: {
 *              key: 'foo',
 *              name: 'My Foo',
 *              type: 'object',
 *              description: 'My Foo Object.',
 *              programVar: false,
 *              properties: {
 *                  bar: {
 *                      key: 'bar',
 *                      name: 'My Foobar',
 *                      type: 'number',
 *                      description: 'My Foobar Number',
 *                      programVar: ['components', 'foobar'],
 *                      validationFn: (value) => (value >= 0)
 *                  },
 *                  baz: {
 *                      key: 'baz',
 *                      name: 'My Foobaz',
 *                      type: 'string',
 *                      description: 'My Foobaz String',
 *                      programVar: ['components', 'foobaz'],
 *                      validationFn: (value) => (value.trim().length > 0)
 *                  }
 *              }
 *          }
 *      } as const satisfies ProgramConfiguration.ConfigurationOptionMapType;
 *      export type MyConfigurationOptions = (typeof MY_CONFIG_OPTIONS);
 * 
 *      export const MY_COMPLEX_PROGRAM_VARS = [
 *          {
 *              programVar: 'foobarbaz',
 *              conversionFn: (configOptions) => `${configOptions.foo.baz}: ${configOptions.foo.bar}` as const
 *          }
 *      ] as const satisfies ProgramConfiguration.ComplexProgramVariable<BaseConfigurationOptions>[];
 *      export type MyComplexProgramVariables = (typeof MY_COMPLEX_PROGRAM_VARS)[number];
 *      export type MyComplexProgramVariablesMap = ProgramConfiguration.ComplexProgramVariableMap<
 *          MyComplexProgramVariables['programVar'],
 *          MyConfigurationOptions,
 *          MyComplexProgramVariables
 *      >;
 *
 *      export const MY_CONFIG_DEFINITIONS = {
 *          configOptions: MY_CONFIG_OPTIONS,
 *          complexProgramVars: (() => {
 *              
 *              let configOptions: MyComplexProgramVariablesMap = new Map();
 *
 *              for (let i = 0; i < MY_COMPLEX_PROGRAM_VARS.length; i++) {
 *                  const complexProgramVar = MY_COMPLEX_PROGRAM_VARS[i];
 *
 *                  configOptions.set(complexProgramVar.programVar, complexProgramVar);
 *              }
 *
 *              return configOptions;
 *
 *          })()
 *      } as const satisfies ProgramConfiguration.ProgramConfigurationDefinitions<
 *          MyConfigurationOptions,
 *          MyComplexProgramVariablesMap
 *      >;
 *      export type MyConfigurationDefinitions = typeof MY_CONFIG_DEFINITIONS;
 * }
 * 
 * class MyProgramConfiguration <PrefetchedT extends boolean = false>
 *      extends ProgramConfiguration<PrefetchedT, [MyProgramConfiguration.MyConfigurationDefinitions]>
 * {
 * 
 *      constructor () {
 *      
 *          super(MyProgramConfiguration.MY_CONFIG_DEFINITIONS);
 * 
 *      }
 * 
 * }
 * ```
 * 
 * This class makes it easy to build upon existing configurations while
 * adding new Configuration Options and Program Variables, as
 * well as making compatible changes to existing one. By formatting your
 * classes in the appropriate manner, you can make your custom
 * program configurations extendable as well:
 * ```ts
 * export class MyProgramConfiguration <
 *     PrefetchedT extends boolean = false,
 *     CustomDefsT extends ProgramConfiguration.ProgramConfigurationDefinitionsType[] = []
 * > extends BaseProgramConfiguration<PrefetchedT, [MyProgramConfiguration.MyConfigurationDefinitions, ...CustomDefsT]> {
 * 
 *     constructor ();
 *     constructor ( ...customDefinitions: CustomDefsT );
 *     constructor ( otherConfig?: BaseProgramConfiguration<boolean, CustomDefsT> );
 *     constructor ( ...customDefsOrOtherConfig: CustomDefsT | [BaseProgramConfiguration<boolean, CustomDefsT>] ) {
 * 
 *         if (customDefsOrOtherConfig instanceof MyProgramConfiguration)
 *             super(customDefsOrOtherConfig);
 *         else
 *             super(MyProgramConfiguration.MY_CONFIG_DEFINITIONS, ...customDefsOrOtherConfig as [...CustomDefsT]);
 * 
 *     }
 * 
 * }
 * ```
 * 
 * 
 * ## Constructing and Loading {@link ProgramConfiguration} Objects
 * During construction, this class makes no effort to initialize
 * the defined Configuration Options and Program Variables or retrieve them from
 * the Configuration File. In order to do so, the {@link load `load()`}
 * method has to be used to populate the object after construction.
 * ```ts
 * let myConfig = new MyProgramConfiguration();
 * myConfig.load();
 * ````
 * 
 * However, because the Configuration Options and Program Variables may not have been
 * populated after constructing a {@link ProgramConfiguration} object, the
 * {@link getConfigVars `getConfigVars()`} and {@link getProgramVars `getProgramVars()`} methods
 * may return `null` until the {@link load `load()`} method has been invoked. E.g.,
 * ```ts
 * const myConfig = new MyProgramConfiguration();
 * 
 * console.log(myConfig.getConfigVars());   // null
 * console.log(myConfig.getProgramVars());  // null
 * myConfig.load();
 * console.log(myConfig.getConfigVars());   // { ... }
 * console.log(myConfig.getProgramVars());  // { ... }
 * ````
 * 
 * This can make it annoying to use these methods, as the return type
 * always includes `null`. E.g.,
 * ```ts
 * const myConfig = new MyProgramConfiguration();
 * myConfig.load();
 * 
 * const myConfigVars = myConfig.getConfigVars();       // { ... } | null
 * const myProgramVars = myConfig.getProgramVars();     // { ... } | null
 * ```
 * 
 * This is where the {@link ProgramConfigurationFactory} comes in, which makes it possible
 * to programatically construct and {@link load `load()`} {@link ProgramConfiguration} objects.
 * For more information, refer to the `ProgramConfigurationFactory` class.
 * 
 * @template PrefetchedT    Indicates whether or not the Configuration Options and Program Variables
 *                          will be {@link load `load()`-ed} as soon as the object has been constructed.
 * 
 *                          Generally, this type parameter will always be `false` unless constructed using
 *                          the {@link ProgramConfigurationFactory.prototype.fetch `fetch()`} method
 *                          of a {@link ProgramConfigurationFactory}, in which case it will be `true` instead.
 * 
 * @template DefsT          A tuple containing the {@link ProgramConfiguration.ProgramConfigurationDefinitions Program Configuration Definitions}
 *                          defining the available Configuration Options and Program Variables.
 * 
 *                          Latter definitions in the tuple will take precedence over earlier definitions
 *                          where applicable.
 * 
 * @template MergedDefsT    The *Merged {@link ProgramConfiguration.ProgramConfigurationDefinitions Program Configuration Definitions}*.
 * 
 * @see {@link ProgramConfigurationFactory}
 */
export abstract class ProgramConfiguration <
    PrefetchedT extends boolean = false,
    DefsT extends ProgramConfiguration.MergableProgramConfigurationDefinitions = ProgramConfiguration.DefaultMergableProgramConfigurationDefinitions,
    MergedDefsT extends ProgramConfiguration.ProgramConfigurationDefinitions<
        ProgramConfiguration.ConfigurationOptionMapType
    > = ProgramConfiguration.MergedProgramConfigurationDefinitions<DefsT>
> {

    /* Class Constants */

    /**
     * The maximum permitted size of the
     * JSON Configuration File in *kilobytes*.
     */
    static readonly MAX_CONFIG_FILE_SIZE = 2048 as const satisfies number;
    /**
     * The name of the JSON Configuration File.
     * 
     * @see {@link CONFIG_FILE_PATH}
     * @see {@link CONFIG_FILE_PATHNAME}
     */
    static readonly CONFIG_FILE_NAME = 'config.json' as const satisfies string;
    /**
     * The path to the JSON Configuration File.
     * 
     * @see {@link CONFIG_FILE_NAME}
     * @see {@link CONFIG_FILE_PATHNAME}
     */
    static readonly CONFIG_FILE_PATH = './' as const satisfies string;
    /**
     * The full filepath to the JSON Configuration File.
     * 
     * @see {@link CONFIG_FILE_NAME}
     * @see {@link CONFIG_FILE_PATH}
     */
    static readonly CONFIG_FILE_PATHNAME = `${this.CONFIG_FILE_PATH}${this.CONFIG_FILE_NAME}` as const satisfies string;


    /* Instance Properties */

    /**
     * The {@link ProgramConfiguration.ProgramConfigurationDefinitions Program Configuration Definitions}
     * specifying the available Configuration Options and Program Variables.
     */
    readonly definitions: MergedDefsT;
    /**
     * An array containing the {@link ObjectUtils.ComplexObjectKey Complex Object Key}
     * corresponding to each of the *{@link SensitiveProperties Sensitive} Configuration Options*
     * that can be {@link SensitiveProperties.redact redacted} during {@link getConfigVars retrieval}.
     * 
     * @see {@link sensitiveProgramVars}
     * @see {@link getConfigVars `getConfigVars(true)`}
     */
    readonly sensitiveConfigVars: ObjectUtils.ComplexObjectKeyType[];
    /**
     * An array containing the {@link ObjectUtils.ComplexObjectKey Complex Object Key}
     * corresponding to each of the *{@link SensitiveProperties Sensitive} Program Variables*
     * that can be {@link SensitiveProperties.redact redacted} during {@link getProgramVars retrieval}.
     * 
     * @see {@link sensitiveConfigVars}
     * @see {@link getProgramVars `getProgramVars(true)`}
     */
    readonly sensitiveProgramVars: ObjectUtils.ComplexObjectKeyType[];

    /**
     * Contains the current Configuration Options associated with this object.
     * 
     * If no Configuration Options have been populated yet using
     * the {@link load `load()`} method, this field will be `null`.
     * 
     * This field can be modified using the {@link setConfigVars `setConfigVars()`} method
     * and the object stored within it (or a copy or variant of it)
     * can be retrieved using the {@link getConfigVars `getConfigVars()`} method.
     * 
     * Note that this field is *not* as strongly typed as the {@link getConfigVars `getConfigVars()`} method,
     * which is both beneficial to internal code by simplifying its usage, as well as being
     * a consequence of the TypeScript Server lagging and timing out when it is strongly typed.
     * 
     * @invariant   When this Program Configuration is {@link load `load()`-ed} immediately after construction
     *              and `PreloadedT` is `true`, generally when using the {@link ProgramConfigurationFactory.prototype.fetch `fetch()`}
     *              method of a {@link ProgramConfigurationFactory} to construct the object,
     *              this field should *never* contain a `null` value after the call to `load()`
     *              before being returned to the caller.
     * 
     * @invariant   When this field is to be populated by Program Configuration Options, they should
     *              *always* be stored as a {@link Object.freeze Frozen Object} that can be safely shared
     *              with external code without any concerns of data corruption or loss occurring.
     * 
     * @see `#programVars`
     */
    #configVars: Readonly<
        ProgramConfiguration.ConfigurationOptions<
            ProgramConfiguration.ConfigurationOptionMapType
        >
    > | null;
    /**
     * Contains the current Program Variables associated with this object.
     * 
     * If no Configuration Options have been populated yet using
     * the {@link load `load()`} method, this field will be `null`.
     * 
     * This field can be modified using the {@link setConfigVars `setConfigVars()`} method
     * and the object stored within it (or a copy or variant of it)
     * can be retrieved using the {@link getProgramVars `getProgramVars()`} method.
     * 
     * Note that this field is *not* as strongly typed as the {@link getProgramVars `getProgramVars()`} method,
     * which is both beneficial to internal code by simplifying its usage, as well as being
     * a consequence of the TypeScript Server lagging and timing out when it is strongly typed.
     * 
     * @invariant   When this Program Configuration is {@link load `load()`-ed} immediately after construction
     *              and `PreloadedT` is `true`, generally when using the {@link ProgramConfigurationFactory.prototype.fetch `fetch()`}
     *              method of a {@link ProgramConfigurationFactory} to construct the object,
     *              this field should *never* contain a `null` value after the call to `load()`
     *              before being returned to the caller.
     * 
     * @invariant   When this field is to be populated by Program Variables, they should
     *              *always* be stored as a {@link Object.freeze Frozen Object} that can be safely shared
     *              with external code without any concerns of data corruption or loss occurring.
     * 
     * @see `#configVars`
     */
    #programVars: Readonly<
        ProgramConfiguration.ProgramVariables<
            ProgramConfiguration.ConfigurationOptionMapType,
            never
        >
    > | null;

    /**
     * A {@link JSONFileManager} responsible for writing to and
     * reading from the JSON Configuration File used to store the
     * Program Configuration Options and Program Variables.
     * 
     * The `JSONFileManager` operates in *Asynchronous Mode*, requiring
     * a promise-based approach to performing read/write operations
     * on the JSON Configuration File.
     */
    #fileManager: JSONFileManager<
        ProgramConfiguration.ConfigurationOptions<MergedDefsT['configOptions']>,
        true
    >;


    /* Class Constructor */

    /**
     * Construct a new `ProgramConfiguration` instance
     * using the specified `definitions`.
     * 
     * @param definitions   The {@link ProgramConfiguration.ProgramConfigurationDefinitions Program Configuration Definitions}
     *                      specifying the available Configuration Options and Program Variables.
     * 
     *                      Latter definitions will take precedence over earlier definitions where applicable.
     */
    constructor ( ...definitions: DefsT );
    /**
     * Construct a copy of the designated `ProgramConfiguration` object.
     * 
     * @param otherConfig   The `ProgramConfiguration` object being copied.
     */
    constructor ( otherConfig: ProgramConfiguration<PrefetchedT, DefsT> );
    constructor ( ...defsOrOtherConfig: DefsT | [ProgramConfiguration<PrefetchedT, DefsT>] ) {

        this.#fileManager = new JSONFileManager(
            ProgramConfiguration.CONFIG_FILE_PATHNAME,
            true,
            './config-schema.jsonc',
            ProgramConfiguration.MAX_CONFIG_FILE_SIZE
        );

        if (defsOrOtherConfig[0] instanceof ProgramConfiguration) {
            const PROPERTIES = [
                'definitions',
                '#configVars',
                '#programVars',
                'sensitiveConfigVars',
                'sensitiveProgramVars'
            ] as const satisfies (keyof ProgramConfiguration<boolean, DefsT> | '#configVars' | '#programVars' | '#fileManager')[];
            const otherConfig = defsOrOtherConfig[0];

            for (let i = 0; i < PROPERTIES.length; i++) {
                const property = PROPERTIES[i];

                this[property] = otherConfig[property] as any;
            }
        }
        else {
            const definitions = defsOrOtherConfig as DefsT;
            const configOptions = (() => {

                let configOptions = {};

                for (let i = 0; i < definitions.length; i++) {
                    const definition = definitions[i];
    
                    if (definition.configOptions)
                        configOptions = Object.assign(configOptions, definition.configOptions);
                }

                return configOptions;

            })();
            const complexProgramVars = (() => {

                let complexProgramVars: Iterable<[ObjectUtils.DynamicObjectKeyType, ProgramConfiguration.ComplexProgramVariable]>[] = [];

                for (const key in definitions) {
                    const definition = definitions[key];

                    if (definition.complexProgramVars)
                        complexProgramVars.push(definition.complexProgramVars.entries());
                }

                return complexProgramVars;

            })();

            let sensitiveConfigVars: ObjectUtils.ComplexObjectKeyType[] = [];
            let sensitiveProgramVars: ObjectUtils.ComplexObjectKeyType[] = [];

            /**
             * Parse one level of Configuration Options,
             * adding each one to the appropriate Configuration Options
             * and Program Variables objects.
             * 
             * @param options   The {@link ProgramConfiguration.ConfigurationOptionMap Configuration Options}
             *                  being parsed.
             * 
             * @param baseKey   The base object key associated with the specified `options`.
             * 
             *                  In other words, the {@link ObjectUtils.ComplexObjectKey Complex Object Key}
             *                  referring to the specified `options` object within its parent object(s).
             */
            const parseConfigOptions = (
                options: ProgramConfiguration.ConfigurationOptionMapType,
                baseKey?: ObjectUtils.ComplexObjectKeyType
            ) => {

                if (!baseKey)
                    baseKey = [];

                for (const key in options) {
                    const fullKey = baseKey.concat(key);
                    const option = options[key];
    
                    if (option.sensitive) {
                        sensitiveConfigVars.push(fullKey);
    
                        if (option.programVar !== false) {
                            sensitiveProgramVars.push(
                                ProgramConfiguration.#getProgramVarFromConfigOption(option, baseKey)!
                            );
                        }
                    }
                    if (option.type == 'object' && option.properties) {
                        parseConfigOptions(option.properties, fullKey);
                    }
                }

            };

            this.definitions = {
                configOptions: configOptions,
                complexProgramVars: new Map(...complexProgramVars)
            } as MergedDefsT;
            
            parseConfigOptions(this.definitions.configOptions);
            this.sensitiveConfigVars = sensitiveConfigVars;
            this.sensitiveProgramVars = sensitiveProgramVars;
        }

    }


    /* Static Class Methods */

    /**
     * If applicable, get the {@link ObjectUtils.ComplexObjectKey Complex Object Key}
     * corresponding to the Program Variable defined by the
     * specified {@link ConfigurationOption Configuration Option}.
     * 
     * @template OptionT    The type of the `option` argument.
     * 
     * @param option        The {@link ConfigurationOption Configuration Option}
     *                      being evaluated.
     * 
     * @param baseKey       The Base {@link ObjectUtils.ComplexObjectKey Complex Object Key}
     *                      used to determine the full key when relative Program Variable
     *                      Keys are used.
     * 
     * @returns             A {@link ObjectUtils.ComplexObjectKey Complex Object Key}
     *                      corresponding to the Program Variable defined by the
     *                      specified `option` and `baseKey`.
     * 
     *                      If the specified `option` does not define a Program Variable
     *                      to be associated with the designated Configuration Option,
     *                      returns `null`.
     */
    static #getProgramVarFromConfigOption = <OptionT extends ProgramConfiguration.ConfigurationOptionType> (
        option: OptionT,
        baseKey?: ObjectUtils.ComplexObjectKeyType
    ): ObjectUtils.ComplexObjectKeyType | null => (
        option.programVar !== false
            ? (
                Array.isArray(option.programVar)
                    ? option.programVar
                    : (baseKey ?? []).concat(typeof option.programVar == 'string' ? option.programVar : option.key)
            )
            : null
    );


    /* Instance Methods */

    /**
     * Retrieve the Raw *Configuration Options* associated with this Program Configuration.
     * 
     * In contrast to {@link getProgramVars `getProgramVars()`}, the Configuration Options
     * returned by this method are *unprocessed* and are returned exactly as they were
     * specified (after being converted to and from JSON, that is).
     * 
     * By default, the Configuration Options `object` retrieved and {@link load `load()`-ed}
     * from the Configuration File or set using the {@link setConfigVars `setConfigVars()`} method
     * will be directly returned by this method. However, because the Configuration Options
     * are stored and returned as a {@link Object.freeze Frozen Object}, they cannot be modified.
     * In order to retrieve a mutable copy of the Program Configuration Options object,
     * pass `true` for the `clone` argument.
     * 
     * The returned Configuration Options are also not {@link SensitiveProperties.redact redacted}
     * by default, and any {@link sensitiveConfigVars Sensitive Configuration Options} will
     * be returned as-is. To redact any Sensitive Configuration Options in the returned object,
     * pass `true` for the `redacted` argument.
     * 
     * @template RedactedT          The type of the `redacted` argument.
     * @template CloneT             The type of the `clone` argument.
     * @template OptionsT           The inferred type of the returned Configuration Options Object.
     * @template ReturnedObjectT    The inferred type of the object returned by the method.
     * @template ReturnT            The inferred method return type.
     * 
     * @param redacted              Indicates if any {@link sensitiveConfigVars Sensitive Configuration Options}
     *                              should be {@link SensitiveProperties.redact redacted} in the returned object.
     *          
     *                              Defaults to `false`.
     * 
     * @param clone                 Indicates if a *Mutable Copy* of the Configuration Options `object`
     *                              should be returned (`true`), or an *Immutable Reference* to the
     *                              internal object should be returned instead (`false`).
     * 
     *                              Defaults to `false`.
     * 
     *                              When `redacted` is `true`, this argument is ignored
     *                              and treated as though it was set to `true`.
     * 
     * @returns                     An `object` containing the Raw *Configuration Options*
     *                              associated with this Program Configuration.
     * 
     *                              - If `redacted` and `clone` are both `false`, a 
     *                                {@link Object.freeze Frozen Object} containing the
     *                                Configuration Options will be returned.
     * 
     *                              - If `redacted` is `true`, a {@link SensitiveProperties.RedactedObject Redacted Object}
     *                                containing the Configuration Options will be returned.
     * 
     *                              - If `redacted` is `false` and `clone` is `true`,
     *                                a mutable copy of the Configuration Options `object` will be returned.
     * 
     *                              If the Program Configuration Options have not been populated
     *                              yet using the {@link load `load()`} or {@link setConfigVars `setConfigVars()`}
     *                              methods, returns `null`.
     * 
     * @see {@link getProgramVars `getProgramVars()`}
     * @see {@link setConfigVars `setConfigVars()`}
     */
    getConfigVars <
        RedactedT extends boolean = false,
        CloneT extends (RedactedT extends true ? true : boolean) = (RedactedT extends true ? true : false),
        OptionsT extends ProgramConfiguration.ConfigurationOptions<
            MergedDefsT['configOptions']
        > = ProgramConfiguration.ConfigurationOptions<MergedDefsT['configOptions']>,
        ReturnedObjectT extends (
              OptionsT
            | Readonly<OptionsT>
            | SensitiveProperties.RedactedObject<
                OptionsT,
                ProgramConfiguration.SensitiveConfigurationOptions<MergedDefsT['configOptions']>[]
            >
        ) = (
            RedactedT extends true
                ? SensitiveProperties.RedactedObject<
                    OptionsT,
                    ProgramConfiguration.SensitiveConfigurationOptions<MergedDefsT['configOptions']>[]
                >
                : (
                    CloneT extends true
                        ? OptionsT
                        : Readonly<OptionsT>
                )
        ),
        ReturnT extends ReturnedObjectT | null = (
            PrefetchedT extends true
                ? ReturnedObjectT
                : ReturnedObjectT | null
        )
    > ( redacted?: RedactedT, clone?: CloneT ): ReturnT {

        if (this.#configVars) {
            if (redacted)
                return SensitiveProperties.redact(this.#configVars, this.sensitiveConfigVars) as unknown as ReturnT;
            else if (clone)
                return deepClone(this.#configVars) as unknown as ReturnT;
        }

        return this.#configVars as ReturnT;

    }
    /**
     * Retrieve the *Program Variables* associated with this Program Configuration.
     * 
     * In contrast to {@link getConfigVars `getConfigVars()`}, the Configuration Options
     * returned by this method are *processed* and may take a different shape and contain
     * different variables and values than those specified by the user.
     * 
     * By default, the Program Variables `object` retrieved and {@link load `load()`-ed}
     * from the Configuration File or indirectly set using the {@link setConfigVars `setConfigVars()`} method
     * will be directly returned by this method. However, because the Program Variables
     * are stored and returned as a {@link Object.freeze Frozen Object}, they cannot be modified.
     * In order to retrieve a mutable copy of the Program Variables Options object,
     * pass `true` for the `clone` argument.
     * 
     * The returned Program Variables are also not {@link SensitiveProperties.redact redacted}
     * by default, and any {@link sensitiveProgramVars Sensitive Program Variables} will
     * be returned as-is. To redact any Sensitive Program Variables in the returned object,
     * pass `true` for the `redacted` argument.
     * 
     * @template RedactedT          The type of the `redacted` argument.
     * @template CloneT             The type of the `clone` argument.
     * @template OptionsT           The inferred type of the returned Program Variables Object.
     * @template ReturnedObjectT    The inferred type of the object returned by the method.
     * @template ReturnT            The inferred method return type.
     * 
     * @param redacted              Indicates if any {@link sensitiveProgramVars Sensitive Program Variables}
     *                              should be {@link SensitiveProperties.redact redacted} in the returned object.
     *          
     *                              Defaults to `false`.
     * 
     * @param clone                 Indicates if a *Mutable Copy* of the Program Variables `object`
     *                              should be returned (`true`), or an *Immutable Reference* to the
     *                              internal object should be returned instead (`false`).
     * 
     *                              Defaults to `false`.
     * 
     *                              When `redacted` is `true`, this argument is ignored
     *                              and treated as though it was set to `true`.
     * 
     * @returns                     An `object` containing the *Program Variables*
     *                              associated with this Program Configuration.
     * 
     *                              - If `redacted` and `clone` are both `false`, a 
     *                                {@link Object.freeze Frozen Object} containing the
     *                                Program Variables will be returned.
     * 
     *                              - If `redacted` is `true`, a {@link SensitiveProperties.RedactedObject Redacted Object}
     *                                containing the Program Variables will be returned.
     * 
     *                              - If `redacted` is `false` and `clone` is `true`,
     *                                a mutable copy of the Program Variables `object` will be returned.
     * 
     *                              If the Program Variables Options have not been populated
     *                              yet using the {@link load `load()`} or {@link setConfigVars `setConfigVars()`}
     *                              methods, returns `null`.
     * 
     * @see {@link getConfigVars `getConfigVars()`}
     * @see {@link setConfigVars `setConfigVars()`}
     */
    getProgramVars <
        RedactedT extends boolean = false,
        CloneT extends (RedactedT extends true ? true : boolean) = (RedactedT extends true ? true : false),
        ProgramVarsT extends ProgramConfiguration.ProgramVariables<
            MergedDefsT['configOptions'],
            ProgramConfiguration.ExtractComplexProgramVariablesFromDefinitions<MergedDefsT>
        > = ProgramConfiguration.ProgramVariables<
            MergedDefsT['configOptions'],
            ProgramConfiguration.ExtractComplexProgramVariablesFromDefinitions<MergedDefsT>
        >,
        ReturnedObjectT extends (
              ProgramVarsT
            | Readonly<ProgramVarsT>
            | SensitiveProperties.RedactedObject<
                (ProgramVarsT extends object ? ProgramVarsT : never),
                ProgramConfiguration.SensitiveProgramVariables<
                    MergedDefsT['configOptions'],
                    ProgramConfiguration.ExtractComplexProgramVariablesFromDefinitions<MergedDefsT>
                >[]
            >
        ) = (
            RedactedT extends true
                ? SensitiveProperties.RedactedObject<
                    (ProgramVarsT extends object ? ProgramVarsT : never),
                    ProgramConfiguration.SensitiveProgramVariables<
                        MergedDefsT['configOptions'],
                        ProgramConfiguration.ExtractComplexProgramVariablesFromDefinitions<MergedDefsT>
                    >[]
                >
                : (
                    CloneT extends true
                        ? ProgramVarsT
                        : Readonly<ProgramVarsT>
                )
        ),
        ReturnT extends ReturnedObjectT | null = (
            PrefetchedT extends true
                ? ReturnedObjectT
                : ReturnedObjectT | null
        )
    > ( redacted?: RedactedT, clone?: CloneT ): ReturnT {

        if (this.#programVars) {
            if (redacted)
                return SensitiveProperties.redact(this.#programVars, this.sensitiveProgramVars) as ReturnT;
            else if (clone)
                return deepClone(this.#configVars) as ReturnT;
        }

        return this.#programVars as ReturnT;

    }
    /**
     * Set the value of one or more *Configuration Options*
     * and their associated *Program Variables*.
     * 
     * @param configVars    An object containing the updated *Configuration Options*.
     * 
     *                      Only the Configuration Options being modified need to be specified,
     *                      and any omitted Configuration Options will be unmodified.
     *                      
     * @returns             This object.
     * 
     * @see {@link getConfigVars `getConfigVars()`}
     * @see {@link getProgramVars `getProgramVars()`}
     */
    setConfigVars (
        configVars: ObjectUtils.PartialRecursive<
            ProgramConfiguration.ConfigurationOptions<MergedDefsT['configOptions']>
        >
    ): this {

        let newConfigVars = (
            this.#configVars
                ? deepClone(this.#configVars)
                : {} as any
        );
        let newProgramVars = (
            this.#programVars
                ? deepClone(this.#programVars)
                : {} as any
        );

        const parseVars = (
            options: ProgramConfiguration.ConfigurationOptionMapType,
            configVars: object,
            newVars: object,
            baseKey: ObjectUtils.ComplexObjectKeyType = []
        ) => {

            for (const key in options) {
                const option = options[key];
                const fullKey = baseKey.concat(key);
                const programVar = ProgramConfiguration.#getProgramVarFromConfigOption(option, baseKey);

                if (key in newVars) {
                    const value = newVars[key];

                    try {
                        assertIsType(value, option.type);
        
                        if (option.validationFn)
                            if (option.validationFn(value, fullKey as any) === false)
                                throw new TypeError("The specified value Failed Validation.");
                    }
                    catch (error) {
                        throw new TypeError(
                            (error as TypeError).message.replace(
                                'The specified value',
                                `The ${option.name} Configuration Option (${ObjectUtils.stringifyDynamicObjectKeys(fullKey)})`
                            )
                        );
                    }
    
                    configVars[key] = value;
    
                    if (programVar) {
                        ObjectUtils.setNestedProperty(
                            newProgramVars,
                            programVar,
                            (
                                option.conversionFn
                                    ? option.conversionFn(value, fullKey as any)
                                    : value
                            ),
                            true,
                            true
                        );
                    }
                }

                if (option.properties) {
                    if ( !(key in configVars) )
                        configVars[key] = {};

                    parseVars(
                        option.properties,
                        configVars[key],
                        newVars[key] ?? {},
                        (option.programVar !== false ? fullKey : baseKey)
                    );
                }

                if ( !(key in newVars) ) {
                    if (programVar && !ObjectUtils.nestedPropertyExists(newProgramVars, programVar)) {
                        ObjectUtils.setNestedProperty(
                            newProgramVars,
                            programVar,
                            (
                                option.defaultProgramVarValue
                                    ? option.defaultProgramVarValue
                                    : null
                            ),
                            true,
                            true
                        );
                    }
                }
            }

        };

        parseVars(this.definitions.configOptions, newConfigVars, configVars!);

        // for (const optionName in this.definitions.configOptions) {
        //     const option = this.definitions.configOptions[optionName];
        //     const programVar = ProgramConfiguration.#getProgramVarFromConfigOption(option) as ObjectUtils.DynamicObjectKeyType | false;

        //     if ( ObjectUtils.nestedPropertyExists(configVars as object, optionName) ) {
        //         const configValue = ObjectUtils.getNestedProperty(configVars as object, optionName);

        //         try {
        //             assertIsType(configValue, option.type);
    
        //             if (option.validationFn)
        //                 if (option.validationFn(configValue, optionName) === false)
        //                     throw new TypeError("The specified value Failed Validation.");
        //         }
        //         catch (error) {
        //             throw new TypeError(
        //                 error?.message?.replace(
        //                     'The specified value',
        //                     `The Configuration Option ${ObjectUtils.stringifyDynamicObjectKeys(optionName)}`
        //                 )
        //             );
        //         }

        //         ObjectUtils.setNestedProperty(
        //             this.#configVars as object,
        //             optionName,
        //             configValue,
        //             true,
        //             true
        //         );

        //         if (programVar) {
        //             ObjectUtils.setNestedProperty(
        //                 this.#programVars as object,
        //                 programVar,
        //                 (
        //                     option.conversionFn
        //                         ? option.conversionFn(configValue, optionName)
        //                         : configValue
        //                 ),
        //                 true,
        //                 true
        //             );
        //         }
        //     }
        //     else {
        //         if (programVar) {
        //             ObjectUtils.setNestedProperty(
        //                 this.#programVars as object,
        //                 programVar,
        //                 ('defaultValue' in option ? option.defaultValue : null),
        //                 true,
        //                 true
        //             );
        //         }
        //     }
        // }
        if (this.definitions.complexProgramVars) {
            for (const [programVarName, programVar] of this.definitions.complexProgramVars) {
                ObjectUtils.setNestedProperty(
                    newProgramVars,
                    programVarName,
                    programVar.conversionFn(newConfigVars),
                    true,
                    true
                );
            }
        }

        this.#configVars = ObjectUtils.freezeRecursive(newConfigVars!);
        this.#programVars = ObjectUtils.freezeRecursive(newProgramVars!);

        return this;

    }

    /**
     * Run the Interactive Setup Procedure for
     * this Program Configuration.
     * 
     * The program will be temporarily suspended and
     * the user will be prompted to setup and configure
     * this Program Configuration according to the specified arguments.
     * Once the user finishes configuring the Program Configuration,
     * the program will be resumed.
     * 
     * @param signal        An {@link AbortSignal} used to abort the setup process
     *                      and exit the Interactive Setup early.
     * 
     * @param firstTime     Indicates if a *First-Time Setup* is being performed,
     *                      in which case the user will first be prompted to provide
     *                      a valid value for each of the
     *                      {@link ProgramConfiguration.ConfigurationOption.required Required Configuration Options}
     *                      defined for this Program Configuration before proceeding with
     *                      the normal setup procedure.
     * 
     * @returns             A promise that is fullfilled once the Interactive Setup Procedure
     *                      has been completed and the user has successfully saved their changes,
     *                      or once the specified `signal` has been used to {@link AbortController.prototype.abort `abort()`}
     *                      the setup process early.
     * 
     * @see {@link load `load()`}
     */
    async setup ( signal?: AbortSignal, firstTime: boolean = false ): Promise<void> {

        const SETUP_MENU_KEYPRESS_HANDLER_NAME = 'program-config-setup-menu';

        console.log();
        console.log(colorizeOutput(
            'Program Configuration Options',
            ForegroundColor.MAGENTA
        ));
        console.log();

        const originallyEmittingKeypressEvents = KeypressHandlers.emittingKeypressEvents;
        const originalCursorPos = (() => {

            const rl = createReadlineInterface();
            const cursorPos = rl.getCursorPos();
            
            closeReadlineInterface(rl);
            return cursorPos;

        })();
        const verboseLogging = useVerboseLogging();

        let modifiedConfig: object = this.getConfigVars(false, true) ?? {};
        let configHasBeenModified: boolean = false;
        /**
         * Dummy interval necessary for keeping the Node Event Loop alive
         * during the initial setup process when the Main Verification Interval
         * has not yet been started.
         */
        let keepaliveInterval: NodeJS.Timeout | null = null;

        if (verboseLogging)
            setVerboseLogging(false);

        return new Promise<void>(async (resolve, reject) => {

            const MAX_OPTIONS_PER_PAGE = 8;

            interface ConfigurationOptionLevelRenderingProperties {

                readonly keys: ObjectUtils.SimpleObjectKeyType[];
                readonly optionCount: number;

                readonly baseKey: ObjectUtils.ComplexObjectKeyType;
                readonly baseName: string[];

                readonly pageCount: number;
                page: number;
                currentPageOptionCount: number;

                selection: ObjectUtils.DynamicObjectKeyType | null;

            };

            let levelRenderingPropertiesStack: ConfigurationOptionLevelRenderingProperties[] = [];
    
            const printMenuPage = () => {
    
                const { keys, page, pageCount, currentPageOptionCount } = ArrayUtils.lastElement(levelRenderingPropertiesStack);

                let selectionNum = 1;

                for ( let i = ((page - 1) * MAX_OPTIONS_PER_PAGE); i < (((page - 1) * MAX_OPTIONS_PER_PAGE) + currentPageOptionCount); i++ ) {
                    const currentOption = this.definitions.configOptions[keys[i]];

                    console.log(
                        colorizeOutput(
                            `[${selectionNum++}]`,
                            ForegroundColor.YELLOW
                        ) + ':',
                        colorizeOutput(
                            currentOption.required ? '*' : ' ',
                            ForegroundColor.CYAN
                        ) + currentOption.name /* ObjectUtils.stringifyDynamicObjectKeys(currentOption.name) */,
                        colorizeOutput(
                            `(${String(currentOption.key)})`,
                            BrightForegroundColor.BLACK
                        )
                    );
                }
    
                console.log();

                if (pageCount > 1) {
                    console.log(`Page ${page}/${pageCount}`);
                    console.log("[<--]: Previous Page\t[ESC]: Save Changes\t[-->]: Next Page");
                }
                else {
                    console.log("[ESC]: Save Changes");
                }
                
    
            };
            const changeConfigOption = async ( option: ProgramConfiguration.ConfigurationOptionType, cancelable: boolean ) => new Promise<void>(
                (innerResolve, innerReject) => {

                    const { baseKey, baseName } = ArrayUtils.lastElement(levelRenderingPropertiesStack);

                    // const currentOption = this.definitions.configOptions.get(selection)!;
                    // const currentOptionValue = ObjectUtils.getNestedProperty(modifiedConfig as any, currentOption.name as any);
                    const currentOptionValue = ObjectUtils.getNestedProperty(modifiedConfig as any, option.name as any);
                    const rl = createReadlineInterface(Object.assign(
                        { prompt: 'New Value: ' },
                        (
                            currentOptionValue !== undefined
                                ? {
                                    completer: ( line: string ) => [
                                        (line.length > 0 ? [] : [currentOptionValue]),
                                        line
                                    ],
                                    history: [currentOptionValue]
                                }
                                : {}
                        )
                    ));
                    const fullKey = baseKey.concat(option.key);
                    const fullName = baseName.concat(option.name);

                    const cleanup = () => {

                        if (cancelable)
                            rl.off('SIGINT', cleanup);
                        
                        closeReadlineInterface(rl);
                        innerResolve();

                    };
                    const promptForInput = () => {

                        rl.question(
                            rl.getPrompt(),
                            { signal: signal },
                            (answer) => {

                                const parseAnswer = ( jsonStr: string, recursive: boolean = false ): void => {

                                    try {
                                        if ( !answer || answer.trim().length == 0 )
                                            return (cancelable ? cleanup() : promptForInput());
                
                                        const parsedValue = JSON.parse(jsonStr);
                
                                        assertIsType(parsedValue, option.type);
                
                                        if ( option.validationFn && option.validationFn(parsedValue, fullKey as any) === false )
                                            throw null;
                
                                        configHasBeenModified = (
                                            ObjectUtils.setNestedProperty(
                                                modifiedConfig,
                                                fullKey,
                                                parsedValue,
                                                true
                                            ) !== null
                                        ) || configHasBeenModified;
                                        cleanup();
                                    }
                                    catch (error) {
                                        if (!recursive) {
                                            parseAnswer(`"${jsonStr}"`, true);
                                        }
                                        else {
                                            console.log(
                                                ( !(error instanceof Error) || (error instanceof SyntaxError) )
                                                    ? "The specified value is invalid. Please try again."
                                                    : error.message
                                            );
                                            console.log();
                                            promptForInput();
                                        }
                                    }

                                };

                                parseAnswer(answer);

                            }
                        );

                    };
                    
                    rl.on('SIGINT', (cancelable ? cleanup : resolve));

                    console.log(colorizeOutput(
                        fullName.join(' / '),
                        ForegroundColor[option.required ? 'YELLOW' : 'CYAN']
                    ));
                    console.log(colorizeOutput(
                        ObjectUtils.stringifyDynamicObjectKeys(fullKey),
                        BrightForegroundColor.BLACK
                    ));
                    // console.log(ConsoleUtils.colorizeOutput(
                    //     ObjectUtils.stringifyDynamicObjectKeys(option.name),
                    //     ConsoleUtils.ForegroundColor[option.required ? 'YELLOW' : 'CYAN']
                    // ));
                    console.log();
                    console.log(colorizeOutput(option.description, ForegroundColor.GREEN));
                    console.log();
                    console.log(`Type: ${ArrayUtils.toListStr(ArrayUtils.arrayify(option.type), 'or')}`);
                    
                    console.log();
                    console.log(`Enter a new value for the selected Configuration Property${cancelable ? ' or leave blank to cancel' : ''}.`);
                    
                    promptForInput();

                }
            ).then(
                async () => {

                    await clearScreen();
                    printMenuPage();
                    ArrayUtils.lastElement(levelRenderingPropertiesStack)!.selection = null;

                    if (verboseLogging)
                        setVerboseLogging(true);

                }
            );
            const clearScreen = ( moveCursor: boolean = true ) => new Promise<void>(
                (innerResolve, innerReject) => {

                    const clear = () => {
    
                        if (moveCursor) {
                            return readline.cursorTo(
                                process.stdout,
                                0,
                                originalCursorPos.rows,
                                () => readline.clearScreenDown(process.stdout, innerResolve)
                            );
                        }
                        else {
                            return readline.clearScreenDown(process.stdout, innerResolve);
                        }
    
                    };
    
                    if ( !clear() )
                        process.stdout.once('drain', clear);
    
                }
            );
            const getCurrentPageOptionCount = ( page: number, optionCount: number ) => (
                (page * MAX_OPTIONS_PER_PAGE) <= optionCount
                    ? MAX_OPTIONS_PER_PAGE
                    : (optionCount - ((page - 1) * MAX_OPTIONS_PER_PAGE))
            );
            const editOptionLevel = async (
                options: ProgramConfiguration.ConfigurationOptionMapType,
                baseKey: ObjectUtils.ComplexObjectKeyType = [],
                baseName: string[] = []
            ) => {

                const keys = Object.keys(options)

                levelRenderingPropertiesStack.push({
                    page: 1,
                    keys: keys,
                    optionCount: keys.length,
                    pageCount: Math.ceil(keys.length / MAX_OPTIONS_PER_PAGE),
                    currentPageOptionCount: getCurrentPageOptionCount(1, keys.length),
                    selection: null,
                    baseKey: baseKey,
                    baseName: baseName
                });

                await clearScreen(false);
                printMenuPage();

                return levelRenderingPropertiesStack.pop();

            };

            if (signal)
                signal.addEventListener('abort', () => resolve());

            if (firstTime) {
                const setupRequiredOptions = async (
                    options: ProgramConfiguration.ConfigurationOptionMapType,
                    baseKey: ObjectUtils.ComplexObjectKeyType = []
                ) => {

                    for (const key in options) {
                        const option = options[key];
                        const fullKey = baseKey.concat(key);
    
                        if (option.required) {
                            if (option.type != 'object') {
                                if ( !ObjectUtils.nestedPropertyExists(modifiedConfig, fullKey) ) {
                                    await changeConfigOption(option, false);
                                    await clearScreen();
                                }
                            }
                            else {
                                if (option.properties) {
                                    await setupRequiredOptions(option.properties, fullKey);
                                }
                            }
                        }
                    }

                };
                
                keepaliveInterval = setInterval(() => undefined, 60000);
                await setupRequiredOptions(this.definitions.configOptions);

                console.log(ConsoleUtils.colorizeOutput(
                    "Required Program Configuration Setup Completed!",
                    ConsoleUtils.ForegroundColor.GREEN
                ));
            }

            editOptionLevel(this.definitions.configOptions);
            KeypressHandlers.registerKeypressHandler(SETUP_MENU_KEYPRESS_HANDLER_NAME, async (str, key) => {
    
                const levelRenderingProperties = ArrayUtils.lastElement(levelRenderingPropertiesStack);
                const { keys, optionCount, page, pageCount, currentPageOptionCount, selection } = levelRenderingProperties;

                if (!selection) {
                    switch (key.name) {
        
                        case '1':
                        case '2':
                        case '3':
                        case '4':
                        case '5':
                        case '6':
                        case '7':
                        case '8':
                        case '9': {
                            let num = parseInt(key.name);
        
                            if (num <= currentPageOptionCount) {
                                levelRenderingProperties.selection = keys[((page - 1) * MAX_OPTIONS_PER_PAGE) + (num - 1)];
                                levelRenderingProperties.page = 1;
                                levelRenderingProperties.currentPageOptionCount = getCurrentPageOptionCount(page, optionCount);
                                // KeypressHandlers.emitKeypressEvents(false);
                                await clearScreen();
                                changeConfigOption(this.definitions.configOptions[levelRenderingProperties.selection!], true);

                                return false;
                            }
                        }
    
                        case 'left':
                        case 'right': {
                            if (key.name == 'left') {
                                levelRenderingProperties.page = (
                                    page > 1
                                        ? page - 1
                                        : pageCount
                                );
                            }
                            else {
                                levelRenderingProperties.page = (
                                    page < pageCount
                                        ? page + 1
                                        : 1
                                );
                            }

                            levelRenderingProperties.currentPageOptionCount = getCurrentPageOptionCount(page, optionCount);
                            await clearScreen();
                            printMenuPage();
                            return false;
                        }

                        case 'escape': {
                            resolve();
                            return false;
                        }
        
                    }
                }
    
            });

            // if (process.stdin.isPaused())
            //     process.stdin.resume();
    
        }).finally(async () => {

            const cleanup = () => {

                KeypressHandlers.removeKeypressHandler(SETUP_MENU_KEYPRESS_HANDLER_NAME);

                // if (originallyEmittingKeypressEvents != KeypressHandlers.emittingKeypressEvents)
                //     KeypressHandlers.emitKeypressEvents(originallyEmittingKeypressEvents);

                if (keepaliveInterval) {
                    clearInterval(keepaliveInterval);
                    keepaliveInterval = null;
                }
                if (verboseLogging)
                    setVerboseLogging(true);

            };

            if (configHasBeenModified) {
                this.setConfigVars(modifiedConfig as any);
                this.save();
            }

            if (originalCursorPos) {
                readline.cursorTo(
                    process.stdout,
                    0,
                    (originalCursorPos.rows - 2),
                    () => readline.clearScreenDown(process.stdout, cleanup)
                );
            }
            else {
                cleanup();
            }
        
        });

    }

    /**
     * Attempt to load this Program Configuration from the
     * JSON Configuration File.
     * 
     * Regardless of the object or class used, the Configuration Options and Program Variables
     * will be stored in and retrieved from the same JSON Configuration File stored at the
     * location specified by the {@link ProgramConfiguration.CONFIG_FILE_PATH} constant.
     * 
     * To avoid causing side effects when loading the module, it is the responsibility of
     * the caller to ensure the Configuration File exists before attempting to 
     * `load()` any configuration data from it. To do so, simply call the
     * {@link ensureConfigFileExists `ensureConfigFileExists()`} function
     * prior to `load()`-ing the Program Configuration.
     * ```ts
     * const myConfig = new MyProgramConfiguration();
     * ensureConfigFileExists();
     * myConfig.load();
     * ```
     * Failing to do so will result in a {@link RuntimeError} being thrown.
     * 
     * @returns     A promise that resolves to a reference of the loaded
     *              *Configuration Options* `object` stored internally on success.
     *              The returned object is identical to that returned by
     *              calling {@link getConfigVars `getConfigVars()`} with no arguments.
     * 
     *              If the Program Configuration could not be loaded from the
     *              JSON Configuration File, returns `null`.
     * 
     * @throws      Rejects with a {@link RuntimeError} if the JSON Configuration File
     *              could not be found or opened for reading.
     * 
     * @see {@link ensureConfigFileExists `ensureConfigFileExists()`}
     * @see {@link setup `setup()`}
     * @see {@link save `save()`}
     */
    load = (): Promise<
        ObjectUtils.ReadonlyRecursive<
            ProgramConfiguration.ConfigurationOptions<MergedDefsT['configOptions']>
        > | null
    > => this.#fileManager.load(true, 'throw').then(
        (configVars) => {

            if (!configVars)
                return null;

            return this.setConfigVars(configVars).#configVars as ObjectUtils.ReadonlyRecursive<
                ProgramConfiguration.ConfigurationOptions<MergedDefsT['configOptions']>
            >;

        },
        (error) => {

            if (error instanceof FileManager.FileManagerError) {
                throw new RuntimeError(
                    error.message.replace(
                        /[tT]he [sS]pecified [mM]essage/,
                        `The Program Configuration File (${this.#fileManager.file})`
                    ),
                    { cause: error }
                );
            }

            throw error;

        }
    );

    /**
     * Attempt to save this Program Configuration to the
     * JSON Configuration File.
     * 
     * Regardless of the object or class used, the Configuration Options and Program Variables
     * will be stored in and retrieved from the same JSON Configuration File stored at the
     * location specified by the {@link ProgramConfiguration.CONFIG_FILE_PATH} constant.
     * 
     * To avoid causing side effects when loading the module, it is the responsibility of
     * the caller to ensure the Configuration File exists before attempting to 
     * `save()` any configuration data to it. To do so, simply call the
     * {@link ensureConfigFileExists `ensureConfigFileExists()`} function
     * prior to `save()`-ing the Program Configuration.
     * ```ts
     * const myConfig = new MyProgramConfiguration();
     * ensureConfigFileExists();
     * myConfig.save();
     * ```
     * Failing to do so will result in a {@link RuntimeError} being thrown.
     * 
     * @returns     A promise that resolves to `true` on success or `false` on failure.
     * 
     * @throws      Rejects with a {@link RuntimeError} if the JSON Configuration File
     *              could not be found or opened for writing.
     * 
     * @see {@link ensureConfigFileExists `ensureConfigFileExists()`}
     * @see {@link load `load()`}
     */
    save (): Promise<boolean> {

        if (!this.#configVars)
            return Promise.resolve(false);

        this.#fileManager.fileData = this.#configVars as any;
        return this.#fileManager.save();

    }

}
export namespace ProgramConfiguration {

    /* General Types */

    /**
     * A union type containing all of the valid
     * {@link TypeofType types} that a Raw *Configuration Value*
     * can hold.
     * 
     * The `string` variant of this type is {@link RawConfigurationOptionValueString}.
     * 
     * @see {@link RawConfigurationOptionValueString}
     */
    export type RawConfigurationOptionValue = Exclude<
        TypeofType,
        FunctionUtils.FunctionType | undefined | Symbol
    >;
    /**
     * A union type containing all of the valid
     * {@link TypeofTypeString type strings} corresponding
     * to the {@link RawConfigurationOptionValue types} that
     * a Raw *Configuration Value* can hold.
     * 
     * This is the `string` variant of the {@link RawConfigurationOptionValue} type.
     * 
     * @see {@link RawConfigurationOptionValue}
     */
    export type RawConfigurationOptionValueString = TypeofTypeString<RawConfigurationOptionValue>;
    

    /* Configuration Option Specifications */
    // Callback Function Types

    /**
     * A *Configuration Option Validation Function* used to validate
     * the value of one or more *Configuration Options* specified by the user.
     * 
     * Configuration Option Validation Functions are most commonly found
     * attached to the {@link ConfigurationOption.validationFn validationFn}
     * property of a {@link ConfigurationOption} object.
     * 
     * @template ValueT     The type of the `value` argument.
     * @template KeyT       The type of the `key` argument.
     * 
     * @param value         The user-specified value of the
     *                      Configuration Option being validated.
     * 
     * @param key           The {@link ConfigurationOption.key key} of
     *                      the Configuration Option being validated.
     * 
     * @returns             If the specified `value` is considered to be *valid*,
     *                      the validation function can either return `true`,
     *                      `undefined`, or nothing at all.
     * 
     *                      If the specified `value` is considered to be *invalid*,
     *                      the validation function can return `false` to indicate
     *                      that the specified `value` failed validation.
     * 
     * @throws              The validation function may also throw any type of value
     *                      in order to indicate that specified `value` failed validation.
     * 
     *                      If an {@link Error} is thrown, it will be displayed to
     *                      the user as part of the failed validation error message.
     * 
     * @see {@link ProgramVariableConversionFunction}
     * @see {@link ComplexProgramVariableConversionFunction}
     */
    export type ConfigurationOptionValidationFunction <
        ValueT extends RawConfigurationOptionValue = RawConfigurationOptionValue,
        KeyT extends ObjectUtils.ComplexObjectKeyType = ObjectUtils.ComplexObjectKeyType
    > = ( value: ValueT, key: KeyT ) => boolean | void;
    /**
     * A *Program Variable Conversion Function* used to convert a
     * Raw *Configuration Option* into a corresponding *Program Variable*.
     * 
     * Program Variable Conversion Functions are most commonly found
     * attached to the {@link ConfigurationOption.conversionFn conversionFn}
     * property of a {@link ConfigurationOption} object.
     * 
     * @template ReturnT    The return type of the function.
     * @template ValueT     The type of the `value` argument.
     * @template KeyT       The type of the `key` argument.
     * 
     * @param value         The user-specified value of the
     *                      Configuration Option being converted.
     * 
     * @param key           The {@link ConfigurationOption.key key} of
     *                      the Configuration Option being converted.
     * 
     * @returns             The converted value to use for the Program Variable.
     * 
     *                      The return type of this function determines the type
     *                      of the associated Program Variable, along with the
     *                      {@link ConfigurationOption.defaultProgramVarValue defaultProgramVarValue}
     *                      property of the relevant {@link ConfigurationOption} object.
     * 
     * @see {@link ConfigurationOptionValidationFunction}
     * @see {@link ComplexProgramVariableConversionFunction}
     */
    export type ProgramVariableConversionFunction <
        ReturnT = any,
        ValueT extends RawConfigurationOptionValue = RawConfigurationOptionValue,
        NameT extends ObjectUtils.ComplexObjectKeyType = ObjectUtils.ComplexObjectKeyType
    > = ( value: ValueT, name: NameT ) => ReturnT;


    // Primary Interfaces

    /**
     * An interface representing a *Configuration Option Specification*
     * containing all of the information needed to work
     * with a Raw *Configuration Option* and its associated
     * *Program Variable*, if applicable.
     * 
     * Not to be confused with {@link ConfigurationOptions}, which
     * contains the *values* of the defined Configuration Options
     * as specified by the user.
     * 
     * The non-templated variant of this type is {@link ConfigurationOptionType}.
     * 
     * @template KeyT               The type of the {@link key} property.
     * 
     * @template BaseKeyT           The Base {@link ObjectUtils.ComplexObjectKey Complex Object Key}
     *                              to use when building the full key, if applicable.
     * 
     * @template TypeStringT        The type of the {@link type} property.
     * 
     * @template TypeT              The type of the *Configuration Option* and, potentially,
     *                              the associated *Program Variable* as well, both of which
     *                              are inferred from the `TypeStringT` type parameter.
     * 
     * @template RequiredT          The type of the {@link required} property.
     * 
     * @template ProgramVarT        The type of the {@link programVar} property.
     * 
     * @template PropertyNamesT     The {@link key keys} of any {@link properties Nested Configuration Options}.
     * 
     * @template FullKeyT           The Full {@link ObjectUtils.ComplexObjectKey Complex Object Key}
     *                              inferred from the `KeyT` and `BaseKeyT`.
     * 
     * @see {@link ConfigurationOptionType}
     * @see {@link ConfigurationOptionMap}
     * @see {@link ConfigurationOptions}
     */
    export interface ConfigurationOption <
        KeyT extends ObjectUtils.SimpleObjectKeyType,
        BaseKeyT extends ObjectUtils.ComplexObjectKeyType,
        TypeStringT extends RawConfigurationOptionValueString | RawConfigurationOptionValueString[],
        TypeT extends RawConfigurationOptionValue = TypeofType<
            TypeStringT extends RawConfigurationOptionValueString[]
                ? TypeStringT[number]
                : TypeStringT
        >,
        RequiredT extends boolean = false,
        ProgramVarT extends boolean | ObjectUtils.SimpleObjectKeyType | ObjectUtils.ComplexObjectKeyType = true,
        PropertyNamesT extends ObjectUtils.SimpleObjectKeyType = (
            TypeT extends object
                ? ObjectUtils.SimpleObjectKeyType
                : never
        ),
        FullKeyT extends ObjectUtils.ComplexObjectKeyType = ArrayUtils.TupleFromTypes<BaseKeyT, KeyT>,
    > {

        /**
         * The Unique {@link ObjectUtils.SimpleObjectKey Simple Object Key}
         * used to identify this Configuration Option.
         * 
         * In contrast to the {@link ConfigurationOption.name name}, the
         * `key` is used to specify the value of the Configuration Option
         * in the JSON Configuration File and {@link ConfigurationOptions} `object`.
         * 
         * If the Configuration Option is a *Nested Configuration Option*,
         * the specified `key` will be relative to the Parent Configuration Option
         * (and any Parent Configuration Options that it may itself have).
         * 
         * @see {@link ConfigurationOption.name name}
         */
        key: KeyT;
        /**
         * The human-readable name of this Configuration Option.
         * 
         * In contrast to the {@link key}, the `name` is used to specify
         * the human-readable name of the Configuration Option
         * displayed to users during the {@link ProgramConfiguration.prototype.setup Interactive Setup}.
         * 
         * @see {@link key}
         * @see {@link description}
         */
        name: string;
        /**
         * A human-readable description of the purpose, intent,
         * and/or usage of the Configuration Option.
         * 
         * This description is generally only used when it is displayed
         * to users during the {@link ProgramConfiguration.prototype.setup Interactive Setup}.
         * 
         * @see {@link ConfigurationOption.name name}
         */
        description?: string;

        /**
         * A `string` or an array of `string`s containing
         * the {@link RawConfigurationOptionValueString allowed type(s)}
         * of the Configuration Option.
         * 
         * This field determines the type(s) of the Configuration Option,
         * as well as the type of the associated {@link programVar *Simple Program Variable*}
         * when no {@link conversionFn Program Variable Conversion Function} is specified.
         * 
         * For example, `string` indicates that the Configuration Option
         * must be specified as a `string`, while `[string, number]` indicates
         * that the Configuration Option may be a `string` or a `number`.
         */
        type: TypeStringT;
        /**
         * Indicates whether the Configuration Option is
         * *Required* (`true`) or *Optional* (`false`).
         * 
         * *Required Configuration Options* must be specified
         * by the user in order for the program to function properly
         * and both the Configuration Option and any dependent *Simple Program Variables*
         * will always be guaranteed to be available at runtime.
         * In contrast, *Optional Configuration Options* do not have to be
         * specified by the user and the Configuration Option and any
         * dependent *Simple Program Variables* may or may not be available at runtime.
         * 
         * @see {@link sensitive}
         */
        required?: RequiredT;
        /**
         * Indicates whether the Configuration Option is
         * considered to be *Sensitive* or not.
         * 
         * *Sensitive Configuration Options* and any dependent *Simple Program Variables*
         * can be {@link SensitiveProperties.redact redacted} at runtime when being
         * retrieved using the {@link ProgramConfiguration.prototype.getConfigVars `getConfigVars()`} 
         * and {@link ProgramConfiguration.prototype.getConfigVars `getConfigVars()`} methods,
         * obfuscating their values before returning them.
         * 
         * @see {@link required}
         */
        sensitive?: boolean;
        /**
         * A {@link ConfigurationOptionValidationFunction Validation Function}
         * used to validate the value of the Configuration Option specified by the user.
         * 
         * The Configuration Option will always first be checked against
         * its {@link type} and {@link required} properties, regardless
         * of whether or not a Validation Function is provided.
         * 
         * @see {@link conversionFn}
         */
        validationFn?: ConfigurationOptionValidationFunction<TypeT, FullKeyT>;

        /**
         * Indicates whether the Configuration Option has a
         * *Simple Program Variable* associated with it and, if it does,
         * the *key* used for it.
         * 
         * - If `false`, the Configuration Option has no *Simple Program Variable*
         *   associated with it.
         * 
         * - If `true`, the Configuration Option will have a *Simple Program Variable*
         *   with the same {@link key} as the Configuration Option itself.
         * 
         * - If a {@link ObjectUtils.SimpleObjectKey Simple Object Key} is specified,
         *   the Configuration Option will have a *Simple Program Variable*
         *   with the specified key, relative to any *Parent Object Keys*.
         * 
         * - If a {@link ObjectUtils.ComplexObjectKey Complex Object Key} is specified,
         *   the Configuration Option will have a *Simple Program Variable*
         *   with the specified key.
         * 
         * E.g.,
         * | `programVar`     | Configuration Option   | Program Variable       |
         * | ---------------- | ---------------------- | ---------------------- |
         * | `false`          | `{ foo: { bar: 42 } }` | `{}`                   |     
         * | `true`           | `{ foo: { bar: 42 } }` | `{ foo: { bar: 42 } }` |     
         * | `'baz'`          | `{ foo: { bar: 42 } }` | `{ foo: { baz: 42 } }` |     
         * | `['bar', 'baz']` | `{ foo: { bar: 42 } }` | `{ bar: { baz: 42 } }` |     
         */
        programVar?: ProgramVarT;
        /**
         * Specifies the default value to be used for the
         * {@link programVar Simple Progarm Variable} associated
         * with this Configuration Option if the Configuration Option
         * is not specified by the user.
         * 
         * This field helps determine the type of the *Program Variable*,
         * but it has no effect on the *Configuration Option* itself.
         * - If specified, its type will be added to the inferred type
         *   of the Program Variable.
         * - If omitted, `null` will be added to the inferred type of
         *   the Program Variable instead.
         * 
         * This property has no effect when {@link required} is `true`,
         * as the Configuration Option and associated Program Variable
         * will always be specified by the user.
         */
        defaultProgramVarValue?: (
            RequiredT extends true
                ? undefined
                : any
        );
        /**
         * A {@link ProgramVariableConversionFunction Simple Program Variable Conversion Function}
         * used to convert the Raw Configuration Option Value to the
         * associated Program Variable Value.
         * 
         * The return type of this function determines the type
         * of the associated Program Variable, along with the
         * {@link ConfigurationOption.defaultProgramVarValue defaultProgramVarValue}
         * property of the relevant {@link ConfigurationOption} object.
         * 
         * If no conversion function is provided, the Raw Configuration Option
         * Value will be used for the value of the Program Variable.
         * 
         * @see {@link validationFn}
         */
        conversionFn?: ProgramVariableConversionFunction<any, TypeT, FullKeyT>;

        /**
         * A {@link ConfigurationOptionMap} containing one or more
         * *Nested Configuration Options*.
         * 
         * This field is only used when {@link type} is equal to or
         * contains `'object'`.
         * 
         * @see {@link type}
         */
        properties?: (
            object extends TypeT
                ? ConfigurationOptionMap<
                    PropertyNamesT,
                    FullKeyT,
                    RawConfigurationOptionValueString | RawConfigurationOptionValueString[],
                    RawConfigurationOptionValue,
                    boolean,
                    boolean | ObjectUtils.SimpleObjectKeyType | ObjectUtils.ComplexObjectKeyType
                >
                : undefined
        );

    };
    /**
     * An interface representing a *Configuration Option Specification*
     * containing all of the information needed to work
     * with a Raw *Configuration Option* and its associated
     * *Program Variable*, if applicable.
     * 
     * This is the non-templated variant of {@link ConfigurationOption}.
     * 
     * @see {@link ConfigurationOption}
     * @see {@link ConfigurationOptionMapType}
     * @see {@link ConfigurationOptions}
     */
    export type ConfigurationOptionType = ConfigurationOption<
        ObjectUtils.SimpleObjectKeyType,
        ObjectUtils.ComplexObjectKeyType,
        RawConfigurationOptionValueString | RawConfigurationOptionValueString[],
        RawConfigurationOptionValue,
        boolean,
        boolean | ObjectUtils.SimpleObjectKeyType | ObjectUtils.ComplexObjectKeyType
    >;

    /**
     * An object type containing a mapping of {@link ConfigurationOption.key Configuration Option Keys}
     * to the respective {@link ConfigurationOption} objects.
     * 
     * Not to be confused with {@link ConfigurationOptions}, which
     * contains the *values* of the defined Configuration Options
     * as specified by the user.
     * 
     * The non-templated variant of this type is {@link ConfigurationOptionMapType}.
     * 
     * @template KeysT              The type of the {@link key key} property of the {@link ConfigurationOption} objects.
     * 
     * @template BaseKeyT           The Base {@link ObjectUtils.ComplexObjectKey Complex Object Key}
     *                              to use when building the full key, if applicable.
     * 
     * @template TypeStringT        The type of the {@link type type} property of the {@link ConfigurationOption} objects.
     * 
     * @template TypeT              The type of the *Configuration Option* and, potentially,
     *                              the associated *Program Variable* as well, both of which
     *                              are inferred from the `TypeStringT` type parameter.
     * 
     * @template RequiredT          The type of the {@link required} property of the {@link ConfigurationOption} objects.
     * 
     * @template ProgramVarT        The type of the {@link programVar} property of the {@link ConfigurationOption} objects.
     * 
     * @see {@link ConfigurationOptionMapType}
     * @see {@link ConfigurationOption}
     * @see {@link ConfigurationOptions}
     */
    export type ConfigurationOptionMap <
        KeysT extends ObjectUtils.SimpleObjectKeyType,
        BaseKeyT extends ObjectUtils.ComplexObjectKeyType,
        TypeStringT extends RawConfigurationOptionValueString | RawConfigurationOptionValueString[],
        TypeT extends RawConfigurationOptionValue = TypeofType<
            TypeStringT extends RawConfigurationOptionValueString[]
                ? TypeStringT[number]
                : TypeStringT
        >,
        RequiredT extends boolean = false,
        ProgramVarT extends boolean | ObjectUtils.SimpleObjectKeyType | ObjectUtils.ComplexObjectKeyType = true
    > = {
        [K in KeysT]: ConfigurationOption<K, BaseKeyT, TypeStringT, TypeT, RequiredT, ProgramVarT>;
    };
    /**
     * An object type containing a mapping of {@link ConfigurationOption.key Configuration Option Keys}
     * to the respective {@link ConfigurationOption} objects.
     * 
     * This is the non-templated variant of {@link ConfigurationOptionMap}.
     * 
     * @see {@link ConfigurationOptionMap}
     * @see {@link ConfigurationOptionType}
     * @see {@link ConfigurationOptions}
     */
    export type ConfigurationOptionMapType = {
        [K: ObjectKey]: ConfigurationOptionType;
    };


    // Helper Types

    /**
     * A helper type to infer the type of a {@link ConfigurationOption} object.
     * 
     * In other words, this type effectively extracts the value of the 
     * `TypeT` Template Parameter from `T`.
     * 
     * @template T  The {@link ConfigurationOption} object whose
     *              type is being inferred.
     */
    export type ExtractConfigurationOptionType <T extends ConfigurationOptionType> = (
        T extends { type: infer S }
            ? TypeofType<S>
            : never
    );

    /**
     * A helper type used to extract the type of a
     * *Simple Program Variable* derived from a
     * single {@link ConfigurationOption Configuration Option}.
     * 
     * - If `OptionT` contains a {@link ProgramVariableConversionFunction},
     *   its {@link ReturnType return type} will be used to infer the
     *   type of the Program Variable. Otherwise, the type specified
     *   in the {@link ConfigurationOption.type type} field will be used.
     * 
     * - Furthermore, if `OptionT` specifies a {@link ConfigurationOption.defaultProgramVarValue default value}
     *   for the Program Variable, its type will be added to the inferred type.
     * 
     * @template OptionT    The {@link ConfigurationOption Configuration Option} whose
     *                      associated Program Variable is being evaluated.
     * 
     * @see {@link ConfigurationOption}
     * @see {@link ExtractProgramVariableKey}
     */
    export type ExtractSimpleProgramVariableType <OptionT extends ConfigurationOptionType> = (
        (
            OptionT['conversionFn'] extends ProgramVariableConversionFunction
                    ? ReturnType<OptionT['conversionFn']>
                    : TypeofType<OptionT['type']>
        ) | (
            'defaultProgramVarValue' extends keyof OptionT
                ? OptionT['defaultProgramVarValue']
                : never
        )
    );
    /**
     * A helper type used to extract the {@link ObjectUtils.ComplexObjectKey *Complex* Object Key}
     * for a *Simple Program Variable* derived from a
     * single {@link ConfigurationOption Configuration Option}.
     * 
     * The {@link ObjectUtils.DynamicObjectKey *Dynamic* Object Key} variant
     * of this type is {@link ExtractDynamicSimpleProgramVariableKey}.
     * 
     * - If `OptionT` specifies a {@link ObjectUtils.SimpleObjectKey *Simple* Object Key},
     *   the specified key will be concatenated with the `BaseKeyT`, if applicable, and returned.
     * 
     * - If `OptionT` specifies `true` or omits the {@link ConfigurationOption.programVar programVar}
     *   property, the {@link ConfigurationOption.key Configuration Option Key} will be
     *   concatenated with the `BaseKeyT`, if applicable, and returned.
     * 
     * - If `OptionT` specifies a {@link ObjectUtils.ComplexObjectKey *Complex* Object Key},
     *   it will be returned as-is.
     * 
     * - If `OptionT` specifies `false` for the {@link ConfigurationOption.programVar programVar}
     *   property, `never` will be returned.
     * 
     * @template OptionT    The {@link ConfigurationOption Configuration Option} whose
     *                      associated Program Variable is being evaluated.
     * 
     * @template BaseKeyT   The Base {@link ObjectUtils.ComplexObjectKey Complex Object Key}
     *                      to use when building the full key, if applicable.
     * 
     * @see {@link ExtractDynamicSimpleProgramVariableKey}
     * @see {@link ConfigurationOption}
     * @see {@link ExtractSimpleProgramVariableType}
     */
    export type ExtractProgramVariableKey <
        OptionT extends ConfigurationOptionType,
        BaseKeyT extends ObjectUtils.ComplexObjectKeyType = never
    > = (
        'programVar' extends keyof OptionT
            ? (
                OptionT['programVar'] extends true
                    ? ArrayUtils.TupleFromTypes<BaseKeyT, OptionT['key']>
                    : (
                        OptionT['programVar'] extends ObjectUtils.SimpleObjectKeyType
                            ? ArrayUtils.TupleFromTypes<BaseKeyT, OptionT['programVar']>
                            : (
                                OptionT['programVar'] extends ObjectUtils.ComplexObjectKeyType
                                    ? OptionT['programVar']
                                    : never
                            )
                    )
            )
            : ArrayUtils.TupleFromTypes<BaseKeyT, OptionT['key']>
    );
    /**
     * A helper type used to extract the {@link ObjectUtils.DynamicObjectKey *Dynamic* Object Key}
     * for a *Simple Program Variable* derived from a
     * single {@link ConfigurationOption Configuration Option}.
     * 
     * The {@link ObjectUtils.ComplexObjectKey *Complex* Object Key} variant
     * of this type is {@link ExtractProgramVariableKey}.
     * 
     * - If `OptionT` specifies a {@link ObjectUtils.SimpleObjectKey *Simple* Object Key},
     *   the specified key will be concatenated with the `BaseKeyT`, if applicable, and returned.
     *   If `BaseKeyT` is omitted or `never`, the specified key will be returned as a
     *   Simple Object Key.
     * 
     * - If `OptionT` specifies `true` or omits the {@link ConfigurationOption.programVar programVar}
     *   property, the {@link ConfigurationOption.key Configuration Option Key} will be
     *   concatenated with the `BaseKeyT`, if applicable, and returned.
     *   If `BaseKeyT` is omitted or `never`, the key will be returned as a
     *   {@link ObjectUtils.SimpleObjectKey Simple Object Key}.
     * 
     * - If `OptionT` specifies a {@link ObjectUtils.ComplexObjectKey *Complex* Object Key},
     *   it will be returned as-is.
     * 
     * - If `OptionT` specifies `false` for the {@link ConfigurationOption.programVar programVar}
     *   property, `never` will be returned.
     * 
     * @template OptionT    The {@link ConfigurationOption Configuration Option} whose
     *                      associated Program Variable is being evaluated.
     * 
     * @template BaseKeyT   The Base {@link ObjectUtils.ComplexObjectKey Complex Object Key}
     *                      to use when building the full key, if applicable.
     * 
     * @see {@link ExtractProgramVariableKey}
     * @see {@link ConfigurationOption}
     * @see {@link ExtractSimpleProgramVariableType}
     */
    export type ExtractDynamicSimpleProgramVariableKey <
        OptionT extends ConfigurationOptionType,
        BaseKeyT extends ObjectUtils.ComplexObjectKeyType = never
    > = (
        ExtractProgramVariableKey<OptionT, BaseKeyT> extends [infer K]
            ? K
            : ExtractProgramVariableKey<OptionT, BaseKeyT>
    );


    /* Complex Program Variables */
    // Callback Function Types

    /**
     * A *Complex Program Variable Conversion Function* used to
     * convert one or more Raw *Configuration Options* into
     * a single *Program Variable*.
     * 
     * Complex Program Variable Conversion Functions are most commonly found
     * attached to the {@link ComplexProgramVariable.conversionFn conversionFn}
     * property of a {@link ComplexProgramVariable} object.
     * 
     * @template OptionT        The {@link ConfigurationOptionMap} type used to
     *                          determine the values passed to the `configOptions` argument.
     * 
     * @template ReturnT        The return type of the function.
     * 
     * @param configOptions     The {@link ConfigurationOptions Raw Configuration Options}
     *                          available to derive the Program Variable from.
     * 
     * @returns                 The converted value to use for the Program Variable.
     * 
     *                          The return type of this function solely determines the type
     *                          of the associated Complex Program Variable.
     * 
     * @see {@link ConfigurationOptionValidationFunction}
     * @see {@link ProgramVariableConversionFunction}
     */
    export type ComplexProgramVariableConversionFunction <
        OptionsT extends ConfigurationOptionMapType = ConfigurationOptionMapType,
        ReturnT = any
    > = ( configOptions: ConfigurationOptions<OptionsT> ) => ReturnT;


    // Primary Interfaces

    /**
     * An interface representing a *Complex Program Variable Specification*
     * containing all of the information needed to transform one or more
     * {@link ConfigurationOption Configuration Options} into a single
     * *Program Variable*.
     * 
     * The non-templated variant of this type is {@link ComplexProgramVariableType}.
     * 
     * @template OptionsT   A {@link ConfigurationOptionMap} containing the available
     *                      {@link ConfigurationOption Configuration Options}.
     * 
     * @see {@link ComplexProgramVariableType}
     * @see {@link ComplexProgramVariableMap}
     * @see {@link ConfigurationOption}
     */
    export interface ComplexProgramVariable <
        OptionsT extends ConfigurationOptionMapType = ConfigurationOptionMapType
    > {

        /**
         * The {@link ObjectUtils.DynamicObjectKeyType *Key*}
         * for the Complex Program Variable.
         */
        programVar: ObjectUtils.DynamicObjectKeyType;

        /**
         * The {@link ComplexProgramVariableConversionFunction Complex Program Variable Conversion Function}
         * responsible for converting one or more Raw Configuration Option Values to the
         * associated Complex Program Variable Value.
         * 
         * The return type of this function determines the type
         * of the Complex Program Variable.
         */
        conversionFn: ComplexProgramVariableConversionFunction<OptionsT>;

        /**
         * Indicates whether the Complex Program Variable is
         * considered to be *Sensitive* or not.
         * 
         * *Sensitive Program Variables* can be {@link SensitiveProperties.redact redacted} at runtime when being
         * retrieved using the {@link ProgramConfiguration.prototype.getConfigVars `getConfigVars()`} method,
         * obfuscating their values before returning them.
         */
        sensitive?: boolean;

    }
    /**
     * An interface representing a *Complex Program Variable Specification*
     * containing all of the information needed to transform one or more
     * {@link ConfigurationOption Configuration Options} into a single
     * *Program Variable*.
     * 
     * This is the non-templated variant of {@link ComplexProgramVariable}.
     * 
     * @see {@link ComplexProgramVariable}
     * @see {@link ComplexProgramVariableMapType}
     * @see {@link ConfigurationOptionType}
     */
    export type ComplexProgramVariableType = ComplexProgramVariable<ConfigurationOptionMapType>; 

    /**
     * An object type containing a mapping of {@link ComplexProgramVariable.programVar Complex Program Variable Keys}
     * to the respective {@link ComplexProgramVariable} objects.
     * 
     * Not to be confused with {@link ProgramVariables}, which
     * contains the *values* of the defined Program Variables.
     * 
     * The non-templated variant of this type is {@link ComplexProgramVariableMapType}.
     * 
     * @template KeysT                  The type of the {@link ComplexProgramVariable.programVar programVar}
     *                                  property of the {@link ComplexProgramVariable} objects.
     * 
     * @template OptionsT               The type of the {@link ConfigurationOptionMap Configuration Option Map}
     *                                  available to the {@link ComplexProgramVariable} objects.
     * 
     * @template ComplexProgramVarsT    The inferred type of the {@link ComplexProgramVariable} objects.
     * 
     * @see {@link ComplexProgramVariableMapType}
     * @see {@link ConfigurationOption}
     * @see {@link ProgramVariables}
     */
    export type ComplexProgramVariableMap <
        KeysT extends ObjectUtils.DynamicObjectKeyType,
        OptionsT extends ConfigurationOptionMapType,
        ComplexProgramVarsT extends ComplexProgramVariable<OptionsT> = ComplexProgramVariable<OptionsT>
    > = Map<KeysT, ComplexProgramVarsT>;
    /**
     * An object type containing a mapping of {@link ComplexProgramVariable.programVar Complex Program Variable Keys}
     * to the respective {@link ComplexProgramVariable} objects.
     * 
     * This is the non-templated variant of {@link ComplexProgramVariableMap}.
     * 
     * @see {@link ComplexProgramVariableMap}
     * @see {@link ConfigurationOptionType}
     * @see {@link ProgramVariables}
     */
    export type ComplexProgramVariableMapType = ComplexProgramVariableMap<
        ObjectUtils.DynamicObjectKeyType,
        ConfigurationOptionMapType
    >;


    // Helper Types

    /**
     * A helper type used to extract the
     * {@link ComplexProgramVariable.programVar Complex Program Variable Keys}
     * from a {@link ComplexProgramVariableMap}.
     * 
     * The variant of this type that extracts the {@link ComplexProgramVariable} objects
     * themselves rather than just the {@link ComplexProgramVariable.programVar keys}
     * is {@link ExtractComplexProgramVariablesFromMap}.
     * 
     * @template T  The {@link ComplexProgramVariableMap} whose 
     *              {@link ComplexProgramVariable.programVar Complex Program Variable Keys}
     *              are being extracted.
     * 
     * @see {@link ExtractComplexProgramVariablesFromMap}
     */
    export type ExtractComplexProgramVariableKeysFromMap <T extends ComplexProgramVariableMapType> = (
        T extends ComplexProgramVariableMap<infer K, any, any>
            ? K
            : never
    );
    /**
     * A helper type used to extract the
     * {@link ComplexProgramVariable Complex Program Variables}
     * from a {@link ComplexProgramVariableMap}.
     * 
     * The variant of this type that extracts the
     * {@link ComplexProgramVariable.programVar Complex Program Variable Keys}
     * rather than the {@link ComplexProgramVariable} objects themselves
     * is {@link ExtractComplexProgramVariableKeysFromMap}.
     * 
     * The variant of this type that extracts the {@link ComplexProgramVariable Complex Program Variables}
     * from the {@link ComplexProgramVariableMap} contained within a
     * {@link ProgramConfigurationDefinitions Program Configuration Definition} is
     * {@link ExtractComplexProgramVariablesFromDefinitions}.
     * 
     * @template T  The {@link ComplexProgramVariableMap} whose 
     *              {@link ComplexProgramVariable.programVar Complex Program Variable Keys}
     *              are being extracted.
     * 
     * @see {@link ExtractComplexProgramVariableKeysFromMap}
     * @see {@link ExtractComplexProgramVariablesFromDefinitions}
     */
    export type ExtractComplexProgramVariablesFromMap <T extends ComplexProgramVariableMapType> = (
        T extends ComplexProgramVariableMap<any, infer O, infer V>
            ? V
            : never
    );
    /**
     * A helper type used to extract the
     * {@link ComplexProgramVariable Complex Program Variables}
     * from the {@link ComplexProgramVariableMap} contained within
     * a {@link ProgramConfigurationDefinitions Program Configuration Definition}.
     * 
     * The variant of this type that extracts the {@link ComplexProgramVariable Complex Program Variables}
     * directly from a {@link ComplexProgramVariableMap} is {@link ExtractComplexProgramVariablesFromMap}.
     * 
     * @template T  The {@link ProgramConfigurationDefinitions} object containing
     *              the {@link ComplexProgramVariableMap} whose {@link ComplexProgramVariable.programVar Complex Program Variable Keys}
     *              are being extracted.
     * 
     * @see {@link ExtractComplexProgramVariablesFromMap}
     */
    export type ExtractComplexProgramVariablesFromDefinitions <DefsT extends ProgramConfigurationDefinitionsType> = (
        DefsT['complexProgramVars'] extends ProgramConfiguration.ComplexProgramVariableMapType
            ? ProgramConfiguration.ExtractComplexProgramVariablesFromMap<DefsT['complexProgramVars']>
            : never
    );


    /* Program Configuration Definitions */

    export type ProgramConfigurationDefinitions <
        OptionsT extends ConfigurationOptionMapType | undefined,
        ComplexProgramVarsT extends ComplexProgramVariableMapType | undefined = ComplexProgramVariableMap<
            ObjectUtils.DynamicObjectKeyType,
            (
                OptionsT extends ConfigurationOptionMapType
                    ? OptionsT
                    : ConfigurationOptionMapType
            )
        > | undefined
    > = (
    // > = ExpandObjectTypeRecursively<(
    //     undefined extends OptionsT
    //         ? {
    //             configOptions?: OptionsT;
    //             complexProgramVars?: ComplexProgramVarsT;
    //         }
    //         : {
    //             configOptions: OptionsT;
    //             complexProgramVars?: ComplexProgramVarsT;
    //         }
    // )>
        (
            undefined extends OptionsT
                ? { configOptions?: OptionsT; }
                : { configOptions: OptionsT; }
        )
        // // ObjectUtils.MakeUndefinedPropertiesOptional<{
            
        // //     configOptions: OptionsT;
            
        // // }> & {
        & {

            complexProgramVars?: ComplexProgramVarsT;

        }
    );
    export type ProgramConfigurationDefinitionsType = ProgramConfigurationDefinitions<
        ConfigurationOptionMapType | undefined,
        ComplexProgramVariableMapType | undefined
    >;

    type MergedProgramConfigurationDefinitionsMergeHelper <
        BaseConfigT extends ProgramConfigurationDefinitionsType,
        CustomConfigT extends ProgramConfigurationDefinitionsType
    > = {
        configOptions: (
            (
                BaseConfigT['configOptions'] extends ConfigurationOptionMapType
                    ? BaseConfigT['configOptions']
                    : {}
            ) & (
                CustomConfigT['configOptions'] extends ConfigurationOptionMapType
                    ? CustomConfigT['configOptions']
                    : {}
            )
        ),
        // configOptions: ([O] extends [never] ? undefined : ConfigurationOptionMap<N, O>),
        complexProgramVars: (
            BaseConfigT['complexProgramVars'] extends ComplexProgramVariableMap<
                infer BaseK,
                infer BaseO,
                infer BaseV
            >
                ? (
                    CustomConfigT['complexProgramVars'] extends ComplexProgramVariableMap<
                        infer CustomK,
                        infer CustomO,
                        infer CustomV
                    >
                        ? ProgramConfiguration.ComplexProgramVariableMap<
                            BaseK | CustomK,
                            BaseO | CustomO,
                            BaseV | CustomV
                        >
                        : ProgramConfiguration.ComplexProgramVariableMap<
                            BaseK,
                            BaseO,
                            BaseV
                        >
                )
                : (
                    CustomConfigT['complexProgramVars'] extends ComplexProgramVariableMap<
                        infer CustomK,
                        infer CustomO,
                        infer CustomV
                    >
                        ? ProgramConfiguration.ComplexProgramVariableMap<
                            CustomK,
                            CustomO,
                            CustomV
                        >
                        : undefined
                )
        )
    };
    type MergedProgramConfigurationDefinitionsRecursionHelper <ConfigsT extends unknown[]> = (
        ConfigsT extends ProgramConfigurationDefinitionsType[]
            ? (
                ConfigsT['length'] extends 0
                    ? { configOptions: {} }
                    : (
                        ConfigsT['length'] extends 1
                            ? (
                                ConfigsT[0] extends ProgramConfigurationDefinitions<ConfigurationOptionMapType>
                                    ? ConfigsT[0]
                                    : never
                            )
                            : (
                                MergedProgramConfigurationDefinitionsMergeHelper<ConfigsT[0], ConfigsT[1]>
                                & MergedProgramConfigurationDefinitionsRecursionHelper<
                                    ArrayUtils.FollowingElements<
                                        ArrayUtils.FollowingElements<
                                            ConfigsT
                                        >
                                    >
                                >
                            )
                    )
            )
            : {}
    );
    export type MergableProgramConfigurationDefinitions = [
        ProgramConfiguration.ProgramConfigurationDefinitions<ProgramConfiguration.ConfigurationOptionMapType>,
        ...ProgramConfiguration.ProgramConfigurationDefinitionsType[]
    ];
    export type DefaultMergableProgramConfigurationDefinitions = [{ configOptions: {} }];
    export type MergedProgramConfigurationDefinitions <
        ConfigsT extends [ProgramConfigurationDefinitions<ConfigurationOptionMapType>, ...ProgramConfigurationDefinitionsType[]]
    > = MergedProgramConfigurationDefinitionsRecursionHelper<ConfigsT>;

    type SensitiveConfigurationOptionsHelper <
        T extends ConfigurationOptionType,
        BaseKeyT extends ObjectUtils.ComplexObjectKeyType = never
    > = (
        object extends ExtractConfigurationOptionType<T>
            ? (
                T['properties'] extends ConfigurationOptionMapType
                    ? {
                        [K in keyof T['properties']]: SensitiveConfigurationOptionsHelper<
                            T['properties'][K],
                            ArrayUtils.TupleFromTypes<BaseKeyT, K>
                        >
                    } extends infer O ? O[keyof O] : never
                    : never
            )
            : (
                T['sensitive'] extends true
                    ? BaseKeyT
                    : never
            )
    );
    export type SensitiveConfigurationOptions <T extends ConfigurationOptionMapType> = (
        {
            [K in keyof T]: SensitiveConfigurationOptionsHelper<T[K], [K]>;
        } extends infer O
            ? O[keyof O]
            : never
    );
    // export type SensitiveConfigurationOptions <
    //     OptionsT extends NewConfigurationOptionMapType,
    //     BaseKeyT extends ObjectUtils.ComplexObjectKeyType = never
    // > = (
    //     {
    //         [
    //             K in keyof OptionsT as OptionsT[K]['sensitive'] extends true
    //                 ? K
    //                 : (
    //                     OptionsT[K] extends NewConfigurationOption<K, BaseKeyT, infer T, infer U>
    //                         ? (
    //                             object extends U
    //                                 ? K
    //                                 : never
    //                         )
    //                         : never
    //                 )
    //         ]: (
    //             OptionsT[K] extends NewConfigurationOption<K, BaseKeyT, infer T, infer U>
    //                 ? (
    //                     object extends U
    //                         ? (
    //                             [NonNullable<OptionsT[K]['properties']>] extends [never]
    //                                 ? ArrayUtils.TupleFromTypes<BaseKeyT, K>
    //                                 : SensitiveConfigurationOptions<
    //                                     NonNullable<OptionsT[K]['properties']>,
    //                                     ArrayUtils.TupleFromTypes<BaseKeyT, K>
    //                                 >
    //                         )
    //                         : ArrayUtils.TupleFromTypes<BaseKeyT, K>
    //                 )
    //                 : never
    //         )
    //     } extends infer O ? O[keyof O] : never
    //     // {
    //     //     [O in OptionsT as O['sensitive'] extends true ? number : never]: O['name'];
    //     // } extends infer O
    //     //     ? O[keyof O]
    //     //     : never
    // );
    // type Test = SensitiveProperties.RedactedObject<
    //     ProgramConfiguration.ConfigurationOptions<BaseProgramConfiguration.NewBaseConfigurationOptions>,
    //     ProgramConfiguration.SensitiveConfigurationOptions<
    //         BaseProgramConfiguration.NewBaseConfigurationOptions
    //     >[]
    // >;
    type SimpleSensitiveProgramVariablesHelper <
        T extends ConfigurationOptionType,
        BaseKeyT extends unknown[] = never
    > = (
        object extends ExtractConfigurationOptionType<T>
            ? (
                T['properties'] extends ConfigurationOptionMapType
                    ? {
                        [K in keyof T['properties']]: SimpleSensitiveProgramVariablesHelper<
                            T['properties'][K],
                            (
                                T['properties'][K]['programVar'] extends ObjectUtils.ComplexObjectKeyType
                                    ? ExtractProgramVariableKey< T['properties'][K] >
                                    : ArrayUtils.TupleFromTypes< BaseKeyT, ExtractProgramVariableKey<T['properties'][K]> >
                            )
                        >;
                    } extends infer O
                        ? O[keyof O]
                        : never
                    : never
            )
            : (
                T['sensitive'] extends true
                    ? BaseKeyT
                    : never
            )
    );
    export type SensitiveProgramVariables <
        OptionsT extends ConfigurationOptionMapType,
        ComplexVarsT extends ComplexProgramVariableType = never
    > = (
        (
            {
                [K in keyof OptionsT]: SimpleSensitiveProgramVariablesHelper<OptionsT[K], [K]>;
            } extends infer O
                ? O[keyof O]
                : never
        ) | (
            {
                [
                    V in ComplexVarsT as V['sensitive'] extends true
                        ? number
                        : never
                ]: V['programVar']
            } extends infer O
                ? O[keyof O]
                : never
        )
    );

    // > = (
    //     // (
    //     //     {
    //     //         [ 
    //     //             O in OptionsT as O['sensitive'] extends true
    //     //                 ? (
    //     //                     O['programVar'] extends false
    //     //                         ? never
    //     //                         : number
    //     //                 )
    //     //                 : never 
    //     //         ]: (
    //     //             O['programVar'] extends ObjectUtils.DynamicObjectKeyType
    //     //                 ? O['programVar']
    //     //                 : O['name']
    //     //         );
    //     //     } extends infer O
    //     //         ? O[keyof O]
    //     //         : never
    //     // ) | (
    //     (
    //         {
    //             [
    //                 K in keyof OptionsT as (
    //                     OptionsT[K] extends NewConfigurationOption<K, BaseKeyT, infer T, infer U>
    //                         ? (
    //                             object extends U
    //                                 ? K
    //                                 : (
    //                                     OptionsT[K]['sensitive'] extends true
    //                                         ? (
    //                                             OptionsT[K]['programVar'] extends false
    //                                                 ? never
    //                                                 : K
    //                                         )
    //                                         : never
    //                                 )
    //                         )
    //                         : never
    //                 )
    //             ]: (
    //                 OptionsT[K] extends NewConfigurationOption<K, BaseKeyT, infer T, infer U>
    //                     ? (
    //                         ArrayUtils.TupleFromTypes<BaseKeyT, ProgramVariableKey<OptionsT[K]>> extends infer FullKeyT
    //                             ? (
    //                                 object extends U
    //                                     ? (
    //                                         [NonNullable<OptionsT[K]['properties']>] extends [never]
    //                                             ? FullKeyT
    //                                             : SensitiveProgramVariables<
    //                                                 NonNullable<OptionsT[K]['properties']>,
    //                                                 never,
    //                                                 (FullKeyT extends ObjectUtils.ComplexObjectKeyType ? FullKeyT : never)
    //                                             >
    //                                     )
    //                                     : FullKeyT
    //                             )
    //                             : never
    //                     )
    //                     : never
    //             )
    //         } extends infer O
    //             ? O[keyof O]
    //             : never
    //     ) | (
    //         {
    //             [
    //                 V in ComplexVarsT as V['sensitive'] extends true
    //                     ? number
    //                     : never
    //             ]: V['programVar']
    //         } extends infer O
    //             ? O[keyof O]
    //             : never
    //     )
    // );

    type ConfigurationOptionsHelper <
        T extends ConfigurationOptionType,
        BaseKeyT extends ObjectUtils.ComplexObjectKeyType = never
    > = (
        T['properties'] extends ConfigurationOptionMapType
            ? {
                -readonly [K in keyof T['properties']]: ConfigurationOptionsHelper<
                    T['properties'][K],
                    ArrayUtils.TupleFromTypes<BaseKeyT, K>
                >;
            }
            : (
                ExtractConfigurationOptionType<T>
                | (
                    T['required'] extends true
                        ? never
                        : undefined
                )
            )
    );
    export type ConfigurationOptions <OptionsT extends ConfigurationOptionMapType> = (
        IsAnyType<OptionsT> extends false
            ? (
                [OptionsT] extends [never]
                    ? never
                    : (
                        {
                            -readonly [K in keyof OptionsT]: ConfigurationOptionsHelper<OptionsT[K], [K]>;
                        } extends infer O
                            ? (
                                O extends Record<ObjectKey, RawConfigurationOptionValue | undefined>
                                    ? O
                                    : ObjectUtils.MakeOptionalPropertiesOptional<O extends object ? O : never>
                            )
                            : never
                    )
            )
            : any
    );
    type CO = ConfigurationOptions<BaseProgramConfiguration.BaseConfigurationOptions>;
    // > = (
    //     {
    //         [K in keyof OptionsT]: (
    //             OptionsT[K] extends NewConfigurationOption<K, infer B, infer S, infer T>
    //                 ? (
    //                     object extends T
    //                         ? (
    //                             [NonNullable<OptionsT[K]['properties']>] extends [never]
    //                                 ? T
    //                                 : ConfigurationOptions< NonNullable<OptionsT[K]['properties']> >
    //                         )
    //                         : T
    //                 )
    //                 : never
    //         ) | (
    //             OptionsT[K]['required'] extends true
    //                 ? never
    //                 : undefined
    //         )
    //     } extends infer O
    //         ? (
    //             RecursiveT extends true
    //                 ? O
    //                 : ExpandObjectTypeRecursively<ObjectUtils.MakeUndefinedPropertiesOptional<
    //                     O extends object ? O : never
    //                 >>
    //         )
    //         : never
    // )
            // UnionToIntersection<ArrayUtils.ArrayifyType<OptionsT> extends infer T
            //     ? {
            //         [K in T as number]: K extends [ConfigurationOption]
            //             ? ObjectUtils.RecordNestedObject<
            //                 K[0]['name'],
            //                 (
            //                     TypeofType<K[0]['type']>
            //                     | (
            //                         K[0]['required'] extends true
            //                             ? never
            //                             : undefined
            //                     )
            //                 )
            //             >
            //             : never
            //     }[number]
            //     : never>
    
    // type SimpleKeyProgramVariablesHelper <T extends ConfigurationOptionType> = (
    //     object extends ExtractConfigurationOptionType<T>
    //         ? (
    //             T['properties'] extends ConfigurationOptionMapType
    //                 ? {
    //                     [
    //                         K in keyof T['properties'] as DynamicProgramVariableKey<T['properties'][K]> extends ObjectUtils.SimpleObjectKeyType
    //                             ? DynamicProgramVariableKey<T['properties'][K]>
    //                             : never
    //                     ]: SimpleKeyProgramVariablesHelper<T['properties'][K]>;
    //                 }
    //                 : never
    //         )
    //         : (
    //             (
    //                 'conversionFn' extends keyof T
    //                     ? ReturnType<
    //                         T['conversionFn'] extends ProgramVariableConversionFunction
    //                             ? T['conversionFn']
    //                             : never
    //                     >
    //                     : ExtractConfigurationOptionType<T>
    //             ) | (
    //                 T['required'] extends true
    //                     ? never
    //                     : (
    //                         'defaultProgramVarValue' extends keyof T
    //                             ? T['defaultProgramVarValue']
    //                             : null
    //                     )
    //             )
    //         )
    // );
    // type ComplexKeyProgramVariablesHelper <T extends ConfigurationOptionType> = (
    //     T['properties'] extends ConfigurationOptionMapType
    //         ? {
    //             -readonly [K in keyof T['properties']]: ComplexKeyProgramVariablesHelper<T['properties'][K]>;
    //         }[keyof T['properties']]
    //         : {}
    // ) & (
    //     T['programVar'] extends ObjectUtils.ComplexObjectKeyType
    //         ? ObjectUtils.RecordNestedObject<
    //             T['programVar'],
    //             SimpleProgramVariableType<T>
    //         >
    //         : {}
    // );
    type SimpleProgramVariablesHelper <
        T extends ConfigurationOptionMapType, 
        BaseKeyT extends ObjectUtils.ComplexObjectKeyType = never
    > = UnionToIntersection<{
        [K in keyof T]: (
            T[K]['programVar'] extends false
                ? {}
                : ObjectUtils.RecordNestedObject<
                    (
                        T[K]['programVar'] extends ObjectUtils.ComplexObjectKeyType
                            ? T[K]['programVar']
                            : ArrayUtils.TupleFromTypes<
                                BaseKeyT,
                                (
                                    T[K]['programVar'] extends ObjectUtils.SimpleObjectKeyType
                                        ? T[K]['programVar']
                                        : T[K]['key']
                                )
                            >
                    ),
                    ExtractSimpleProgramVariableType<T[K]>
                >
        ) & (
            T[K]['properties'] extends ConfigurationOptionMapType
                ? SimpleProgramVariablesHelper<
                    T[K]['properties'],
                    (
                        T[K]['programVar'] extends false
                            ? BaseKeyT
                            : ArrayUtils.TupleFromTypes<BaseKeyT, K>
                    )
                >
                : {}
        );
    }[keyof T]>;
    // type ComplexKeyProgramVariablesHelper <OptionsT extends NewConfigurationOptionMapType> = (
    //     {
    //         [K in keyof OptionsT as OptionsT[K]['programVar'] extends ObjectUtils.ComplexObjectKeyType ? number : never]: ObjectUtils.RecordNestedObject<
    //             OptionsT[K]['programVar'] extends ObjectUtils.ComplexObjectKeyType
    //                 ? OptionsT[K]['programVar']
    //                 : never,
    //             ProgramVariableType<OptionsT[K]>
    //         > | (
    //             OptionsT[K] extends NewConfigurationOption<K, infer B, infer S, infer T>
    //                 ? (
    //                     object extends T
    //                         ? (
    //                             [NonNullable<OptionsT[K]['properties']>] extends [null]
    //                                 ? {}
    //                                 : ComplexKeyProgramVariablesHelper<NonNullable<OptionsT[K]['properties']>>
    //                         )
    //                         : {}
    //                 )
    //                 : {}
    //         )
    //     } extends infer O ? O[keyof O] : never
    // );
    export type ProgramVariables <
        OptionsT extends ConfigurationOptionMapType,
        ComplexProgramVarsT extends ComplexProgramVariable<OptionsT> = never
    > = (
        (
            (
                IsAnyType<OptionsT> extends false
                    ? (
                        [OptionsT] extends [never]
                            ? {}
                            : SimpleProgramVariablesHelper<OptionsT>
                            // : (
                            //     /* {
                            //         -readonly [
                            //             K in keyof OptionsT as DynamicProgramVariableKey<OptionsT[K]> extends ObjectUtils.SimpleObjectKeyType
                            //                 ? DynamicProgramVariableKey<OptionsT[K]>
                            //                 : never
                            //         ]: SimpleKeyProgramVariablesHelper<OptionsT[K]>;
                            //     } & */ (
                            //         {
                            //             -readonly [
                            //                 K in keyof OptionsT as OptionsT[K]['programVar'] extends ObjectUtils.ComplexObjectKeyType
                            //                     ? number
                            //                     : never
                            //             ]: ComplexKeyProgramVariablesHelper<OptionsT[K]>;
                            //         }
                            //     )
                            // )
                    )
                    : any
            ) extends infer O
                ? (
                    O extends Record<ObjectKey, never>
                        ? Record<ObjectKey, any>
                        : ObjectUtils.MakeOptionalPropertiesOptional<O extends object ? O : never>
                )
                : {}
        ) &
        (
            IsAnyType<ComplexProgramVarsT> extends false
                ? (
                    [ComplexProgramVarsT] extends [never]
                        ? {}
                        : UnionToIntersection<{
                            [K in ComplexProgramVarsT as number]: ObjectUtils.RecordNestedObject<
                                K['programVar'],
                                ReturnType<K['conversionFn']>
                            >
                        }[number]>
                )
                : any
        )
    );
    type PV = ProgramVariables<
        BaseProgramConfiguration.BaseConfigurationOptions,
        never
    >;
    // > = (
    //     (
    //         {
    //             -readonly [
    //                 K in keyof OptionsT as (
    //                     ArrayUtils.SoleElement<ProgramVariableKey<OptionsT[K]>> extends ObjectUtils.SimpleObjectKeyType
    //                         ? ArrayUtils.SoleElement<ProgramVariableKey<OptionsT[K]>>
    //                         : never
    //                 )]: (
    //                     OptionsT[K] extends NewConfigurationOption<K, infer B, infer S, infer T>
    //                         ? (
    //                             T extends object
    //                                 ? (
    //                                     [NonNullable<OptionsT[K]['properties']>] extends [never]
    //                                         ? (
    //                                             OptionsT[K]['conversionFn'] extends ProgramVariableConversionFunction
    //                                                 ? ReturnType<OptionsT[K]['conversionFn']>
    //                                                 : T
    //                                         )  
    //                                         : (
    //                                             NonNullable<OptionsT[K]['properties']> extends NewConfigurationOptionMapType
    //                                                 ? ProgramVariables<NonNullable<OptionsT[K]['properties']>, never, true>
    //                                                 : never
    //                                         )
    //                                 )
    //                                 : (
    //                                     OptionsT[K]['conversionFn'] extends ProgramVariableConversionFunction
    //                                         ? ReturnType<OptionsT[K]['conversionFn']>
    //                                         : T
    //                                 )
    //                         ) | (
    //                             OptionsT[K]['required'] extends true
    //                                 ? never
    //                                 : (
    //                                     object extends T
    //                                         ? never
    //                                         : (
    //                                             undefined extends OptionsT[K]['defaultProgramVarValue']
    //                                                 ? null
    //                                                 : OptionsT[K]['defaultProgramVarValue']
    //                                         )
    //                                 )
    //                         )
    //                         : never
    //             )
    //         //     // [ K in OptionsT as K['programVar'] extends false ? never : number ]: ObjectUtils.RecordNestedObject<
    //         //     //     (
    //         //     //         K['programVar'] extends ObjectUtils.DynamicObjectKeyType
    //         //     //             ? K['programVar']
    //         //     //             : K['name']
    //         //     //     ),
    //         //     //     (
    //         //     //         (
    //         //     //             K['conversionFn'] extends OptionConversionFunction
    //         //     //                 ? ReturnType<K['conversionFn']>
    //         //     //                 : TypeofType<K['type']>
    //         //     //         ) | (
    //         //     //             K['required'] extends true
    //         //     //                 ? never
    //         //     //                 : (
    //         //     //                     undefined extends K['defaultValue']
    //         //     //                         ? null
    //         //     //                         : K['defaultValue']
    //         //     //                 )
    //         //     //         )
    //         //     //     )
    //         //     // >
    //         }
    //         & UnionToIntersection<
    //             ComplexKeyProgramVariablesHelper<OptionsT> |
    //             (
    //                 {
    //                     [K in ComplexProgramVarsT as number]: ObjectUtils.RecordNestedObject<
    //                         K['programVar'],
    //                         ReturnType<K['conversionFn']>
    //                     >
    //                 } extends infer O ? O[keyof O] : never
    //             )
    //         >
    //     ) extends infer T
    //         ? (
    //             RecursiveT extends false
    //                 ? ExpandObjectTypeRecursively<T>
    //                 : T
    //         )
    //         : never
    // );

}

/**
 * An *Object Factory* capable of constructing
 * {@link ProgramConfiguration} objects, as well
 * as automatically {@link ProgramConfiguration.prototype.load loading}
 * or {@link ProgramConfiguration.prototype.setup setting them up}
 * immediately after construction.
 * 
 * @example
 * export class MyProgramConfigurationFactory <
 *     CustomDefsT extends ProgramConfiguration.ProgramConfigurationDefinitionsType[] = [],
 *     SuppressErrorsT extends boolean = true
 * > extends ProgramConfigurationFactory<[MyProgramConfiguration.MyConfigurationDefinitions, ...CustomDefsT], SuppressErrorsT>
 * {
 * 
 *      constructor ( suppressErrors?: SuppressErrorsT ) {
 * 
 *          super((suppressErrors ?? true) as SuppressErrorsT);
 * 
 *      }
 * 
 * 
 *      construct <PrefetchedT extends boolean = true> ( retrieveConfig?: PrefetchedT ): ProgramConfiguration<
 *          PrefetchedT,
 *          [MyProgramConfiguration.MyConfigurationDefinitions, ...CustomDefsT]
 *      > {
 *  
 *          return new MyProgramConfiguration<PrefetchedT, CustomDefsT>();
 *  
 *      }
 * 
 * }
 * 
 * const myConfigFactory = new MyProgramConfigurationFactory();
 * const myConfig = myConfigFactory.fetch();
 * 
 * console.log(myConfig.getConfigVars());
 */
export abstract class ProgramConfigurationFactory <
    DefsT extends ProgramConfiguration.MergableProgramConfigurationDefinitions,
    SuppressErrorsT extends boolean
> {

    /* Instance Properties */

    /**
     * Indicates whether or not any errors raised during the process
     * of {@link construct constructing}, {@link fetch fetching},
     * {@link generate generating}, or {@link prepare preparing}
     * a {@link ProgramConfiguration} object should be *suppressed*.
     * 
     * This value directly affects the behavior and return type
     * of the {@link fetch `fetch()`},  {@link generate `generate()},
     * and {@link prepare `prepare()`} methods.
     */
    readonly suppressErrors: SuppressErrorsT;


    /* Class Constructor */

    /**
     * Construct a new `ProgramConfigurationFactory`.
     * 
     * @param suppressErrors    Indicates whether or not any errors raised during the process
     *                          of {@link construct constructing}, {@link fetch fetching},
     *                          {@link generate generating}, or {@link prepare preparing}
     *                          a {@link ProgramConfiguration} object should be *suppressed*.
     * 
     *                          This option directly affects the behavior and return type
     *                          of the {@link fetch `fetch()`},  {@link generate `generate()},
     *                          and {@link prepare `prepare()`} methods.
     */
    constructor ( suppressErrors: SuppressErrorsT ) {

        this.suppressErrors = suppressErrors;

    }


    /* Abstract Methods */

    /**
     * Construct a new instance of the designated
     * {@link ProgramConfiguration} object.
     * 
     * @template PrepopulatedT      The type of the `prepopulated` argument.
     * 
     * @param prepopulated          Indicates whether or not the returned {@link ProgramConfiguration}
     *                              object is going to be immediately {@link ProgramConfiguration.prototype.setup setup}
     *                              or {@link ProgramConfiguration.prototype.load loaded} after construction.
     * 
     * @returns                     The newly constructed {@link ProgramConfiguration} object.
     * 
     * @see {@link fetch `fetch()`}
     * @see {@link generate `generate()`}
     * @see {@link prepare `prepare()`}
     */
    abstract construct <PrepopulatedT extends boolean = true> ( prepopulated?: PrepopulatedT ): ProgramConfiguration<PrepopulatedT, DefsT>;
    
    
    /* Instance Methods */

    /**
     * *Fetch* an instance of the designated {@link ProgramConfiguration}
     * object by {@link construct constructing} a new one and then
     * {@link ProgramConfiguration.prototype.load loading} it
     * from the JSON Configuration File.
     * 
     * In contrast to {@link generate `generate()`}, this method attempts to
     * {@link ProgramConfiguration.prototype.load load} the existing {@link ProgramConfiguration}
     * from the JSON Configuration File rather than attempting to {@link ProgramConfiguration.prototype.setup set one up}.
     * 
     * In contrast to {@link prepare `prepare()`}, this method will *always*
     * attempt to {@link ProgramConfiguration.prototype.load load} the existing
     * {@link ProgramConfiguration} from the JSON Configuration File, even if the
     * configuration file {@link configFileExists does not exist}.
     * 
     * @template ReturnT    The inferred type of the value contained in the returned promise.
     * 
     * @returns             A promise that resolves to the retrieved {@link ProgramConfiguration} object.
     * 
     * @throws              Rejects if the designated {@link ProgramConfiguration} object could not be successfully
     *                      {@link construct constructed} or {@link ProgramConfiguration.prototype.load loaded}.
     * 
     * @see {@link construct `construct()`}
     * @see {@link generate `generate()`}
     * @see {@link prepare `prepare()`}
     */
    fetch = <
        ReturnT extends ProgramConfiguration<true, DefsT> | (SuppressErrorsT extends true ? null : never)
    > (): Promise<ReturnT> => ((config) => config.load().then(
        (configVars) => {

            if (!configVars) {
                if (this.suppressErrors)
                    return null as ReturnT;
                else
                    throw new RuntimeError("Failed to fetch the Program Configuration from the JSON Configuration File.");
            }

            return config as ReturnT;

        },
        (error) => {

            if (this.suppressErrors)
                return null as ReturnT;
            else
                throw error;

        }
    ))(this.construct(true));
    /**
     * *Generate* an instance of the designated {@link ProgramConfiguration}
     * object by {@link construct constructing} a new one and then
     * {@link ProgramConfiguration.prototype.setup setting it up}.
     * 
     * In contrast to {@link generate `generate()`}, this method attempts to
     * {@link ProgramConfiguration.prototype.setup setup} a new {@link ProgramConfiguration}
     * rather than attempting to {@link ProgramConfiguration.prototype.load load one}
     * from an existing JSON Configuration File.
     * 
     * In contrast to {@link prepare `prepare()`}, this method will *always*
     * attempt to {@link ProgramConfiguration.prototype.setup setup} a new
     * {@link ProgramConfiguration}, even if the configuration file
     * {@link configFileExists already exists}.
     * 
     * @template ReturnT    The inferred type of the value contained in the returned promise.
     * 
     * @param signal        An {@link AbortSignal} that can be used to abort and terminate
     *                      the Interactive Setup Procedure early.
     * 
     * @returns             A promise that resolves to the generated {@link ProgramConfiguration} object.
     * 
     * @throws              Rejects if the designated {@link ProgramConfiguration} object could not be successfully
     *                      {@link construct constructed} or {@link ProgramConfiguration.prototype.setup setup}.
     * 
     * @see {@link construct `construct()`}
     * @see {@link load `load()`}
     * @see {@link prepare `prepare()`}
     */
    generate = <
        ReturnT extends ProgramConfiguration<true, DefsT> | (SuppressErrorsT extends true ? null : never)
    > ( signal?: AbortSignal ): Promise<ReturnT> => ((config) => config.setup(signal, true).then(
        () => config as ReturnT,
        (error) => {

            if (this.suppressErrors)
                return null as ReturnT;
            else
                throw error;

        }
    ))(this.construct(true));
    /**
     * *Prepare* an instance of the designated {@link ProgramConfiguration}
     * object by {@link construct constructing} a new one and then
     * either {@link ProgramConfiguration.prototype.setup setting it up}
     * or {@link ProgramConfiguration.prototype.load loading} it
     * from an existing JSON Configuration File.
     * 
     * In contrast to {@link generate `generate()`} or {@link generate `generate()`},
     * this method will automatically determine whether the {@link ProgramConfiguration.prototype.setup `setup()`}
     * or {@link ProgramConfiguration.prototype.load `load()`} method should be called on
     * the designated {@link ProgramConfiguration} object, rather than always performing
     * one of the two operations.
     * 
     * @template ReturnT    The inferred type of the value contained in the returned promise.
     * 
     * @param signal        An {@link AbortSignal} that can be used to abort and terminate
     *                      the Interactive Setup Procedure early.
     * 
     *                      The `signal` is only used when {@link ProgramConfiguration.prototype.setup setting up}
     *                      a {@link ProgramConfiguration} and cannot be used to terminate the
     *                      {@link ProgramConfiguration.prototype.load `load()`} operation early.
     * 
     * @returns             A promise that resolves to the generated or retrieved {@link ProgramConfiguration} object.
     * 
     * @throws              Rejects if the designated {@link ProgramConfiguration} object could not be successfully
     *                      {@link construct constructed}, {@link ProgramConfiguration.prototype.setup setup}
     *                      or {@link ProgramConfiguration.prototype.load loaded}.
     * 
     * @see {@link construct `construct()`}
     * @see {@link load `load()`}
     * @see {@link generate `generate()`}
     */
    prepare = <
        ReturnT extends ProgramConfiguration<true, DefsT> | (SuppressErrorsT extends true ? null : never)
    > ( signal?: AbortSignal ): Promise<ReturnT> => (
        configFileExists()
            ? this.fetch()
            : (
                console.log("Program Configuration Options Not Found! Beginning First-Time Setup..."),
                this.generate(signal)
            )
    );

}

export class BaseProgramConfiguration <
    PrefetchedT extends boolean = false,
    CustomDefsT extends ProgramConfiguration.ProgramConfigurationDefinitionsType[] = []
> extends ProgramConfiguration<PrefetchedT, [BaseProgramConfiguration.BaseConfigurationDefinitions, ...CustomDefsT]> {

    // constructor ( retrieveConfig?: boolean );
    constructor ();
    constructor ( ...customDefinitions: CustomDefsT );
    constructor ( otherConfig?: BaseProgramConfiguration<boolean, CustomDefsT> );
    constructor ( ...customDefsOrOtherConfig: CustomDefsT | [BaseProgramConfiguration<boolean, CustomDefsT>] ) {

        if (customDefsOrOtherConfig instanceof ProgramConfiguration)
            super(customDefsOrOtherConfig);
        else
            super(BaseProgramConfiguration.CONFIG_DEFINITIONS, ...customDefsOrOtherConfig as [...CustomDefsT]);

    }

}
export namespace BaseProgramConfiguration {

    const subnetNumValidationFn: ProgramConfiguration.ConfigurationOptionValidationFunction = (
        value: number,
        name: ['subnetNum'] | ['mainRouter', 'ipNum'] | ['bridgeRouter', 'ipNum']
    ): void => {

        const MIN_SUBNET_NUM = 0;
        const MAX_SUBNET_NUM = 255;

        const remainder = (value - Math.floor(value));

        if (remainder > 0 || value < MIN_SUBNET_NUM || MAX_SUBNET_NUM < value) {
            throw new TypeError(
                `${ObjectUtils.stringifyDynamicObjectKeys(name)} must be specified as a Non-Negative Integer`
                    + ` less than or equal to ${MAX_SUBNET_NUM}.`
                    + ` (${value} was provided.)`
            );
        }

    };

    // export const CONFIG_OPTIONS = [
    //     {
    //         name: ['subnetNum'],
    //         type: 'number',
    //         description: "The number of the Network Subnet Component in the IP Address.\n\nE.g.,\n192.168.0.1\n        ^",
    //         required: true,
    //         validationFn: subnetNumValidationFn,
    //         programVar: false
    //     },
    //     {
    //         name: ['verificationInterval'],
    //         type: 'number',
    //         description: "The amount of time to wait between attempts to verify the status of the WDS Bridge in milliseconds.\n\nCan be changed at runtime using Keyboard Shortcuts.",
    //         defaultValue: 30000,
    //         // validationFn: (value) => {

    //         //     const minInterval = 0;
    //         //     const maxInterval = 255;

    //         //     const remainder = (value - Math.floor(value));

    //         //     if (remainder > 0 || value < minInterval || maxInterval < value) {
    //         //         throw new TypeError(
    //         //             `${ObjectUtils.stringifyDynamicObjectKeys(name)} must be specified as a Non-Negative Integer`
    //         //                 + ` less than or equal to 255.`
    //         //                 + ` (${value} was provided.)`
    //         //         );
    //         //     }

    //         // } 
    //     },
    //     {
    //         name: ['bridgeFrequency'],
    //         type: 'string',
    //         description: "The Wi-Fi Frequency the WDS Bridge should be established on. Must be '2.4GHz' or '5GHz'.",
    //         defaultValue: '5GHz',
    //         validationFn: (value) => WIFI_FREQUENCY_LIST.includes(value as any)
    //     },

    //     {
    //         name: ['mainRouter', 'ipNum'],
    //         type: 'number',
    //         description: "The number of the Device-Specific Component of the Main Router's IP Address.\n\nE.g.,\n192.168.0.1\n          ^",
    //         required: true,
    //         validationFn: subnetNumValidationFn,
    //         programVar: false
    //     },
    //     {
    //         name: ['mainRouter', 'networkName'],
    //         type: 'string',
    //         description: "The SSID or Name of the Wi-Fi Network of the Main Router that the WDS Bridge is to be connected to.",
    //         required: true,
    //         validationFn: ( value: string, name: ['mainRouter', 'networkName'] ) => {

    //             if (value.trim().length == 0) {
    //                 throw new TypeError(
    //                     "A non-empty Network Name (SSID) must be specified for the "
    //                         + ObjectUtils.stringifyDynamicObjectKeys(name)
    //                         + " Configuration Property."
    //                 );
    //             }

    //         }
    //     },
    //     {
    //         name: ['mainRouter', 'networkPw'],
    //         type: 'string',
    //         description: "The Plaintext Password of the Wi-Fi Network of the Main Router that the WDS Bridge is to be connected to.",
    //         sensitive: true
    //     },

    //     {
    //         name: ['bridgeRouter', 'ipNum'],
    //         type: 'number',
    //         description: "The number of the Device-Specific Component of the Bridge Router's IP Address.\n\nE.g.,\n192.168.0.2\n          ^",
    //         defaultValue: 2,
    //         required: true,
    //         validationFn: subnetNumValidationFn,
    //         programVar: false
    //     },
    //     {
    //         name: ['bridgeRouter', 'managementPw'],
    //         type: 'string',
    //         description: "The plaintext password used to login to the Management Interface of the Bridge Router.",
    //         required: true,
    //         sensitive: true
    //     },
    //     {
    //         name: ['bridgeRouter', 'model'],
    //         type: 'string',
    //         description: "The Model of the Bridge Router responsible for operating the WDS Bridge.\n\nThis value is used to determine which Reconnection Method(s) to use when establishing and/or re-establishing the WDS Bridge.",
    //         defaultValue: 'auto'
    //     },

    //     {
    //         name: ['retries', 'minRetryTime'],
    //         type: 'number',
    //         description: "The minimum amount of time to wait in milliseconds before attempting to re-establish the WDS Bridge after the last failed attempt.",
    //         defaultValue: 5000
    //     },
    //     {
    //         name: ['retries', 'maxRetryTime'],
    //         type: 'number',
    //         description: "The maximum amount of time to wait in milliseconds before attempting to re-establish the WDS Bridge after the last failed attempt.",
    //         defaultValue: 60000
    //     },
    //     {
    //         name: ['retries', 'maxMethodRetries'],
    //         type: 'number',
    //         description: "The maximum number of attempts to re-restablish the WDS Bridge before attempting to switch Reconnection Methods.\n\nOnly applicable when `reconnectionMethod.method` is set to 'auto'.",
    //         defaultValue: 3,
    //         validationFn: ( value: number, name: ['retries', 'maxMethodRetries'] ) => {

    //             const MIN_RETRIES = 1;
    //             const MAX_RETRIES = 100;

    //             const remainder = (value - Math.floor(value));

    //             if (remainder > 0 || value < MIN_RETRIES || MAX_RETRIES < value) {
    //                 throw new TypeError(
    //                     `The ${ObjectUtils.stringifyDynamicObjectKeys(name)} Configuration Property`
    //                         + " must be specified as a Non-Negative Integer"
    //                         + ` greater than or equal to ${MIN_RETRIES} and less than or equal to ${MAX_RETRIES}.`
    //                         + ` (${value} was provided.)`
    //                 );
    //             }

    //         }
    //     },
    //     {
    //         name: ['retries', 'maxFailureRetries'],
    //         type: 'number',
    //         description: "The maximum number of attempts to re-restablish the WDS Bridge before giving up and terminating the program.",
    //         defaultValue: 15,
    //         validationFn: ( value: number, name: ['retries', 'maxFailureRetries'] ) => {

    //             const MIN_RETRIES = 1;
    //             const MAX_RETRIES = 100;

    //             const remainder = (value - Math.floor(value));

    //             if (remainder > 0 || value < MIN_RETRIES || MAX_RETRIES < value) {
    //                 throw new TypeError(
    //                     `The ${ObjectUtils.stringifyDynamicObjectKeys(name)} Configuration Property`
    //                         + " must be specified as a Non-Negative Integer"
    //                         + ` greater than or equal to ${MIN_RETRIES} and less than or equal to ${MAX_RETRIES}.`
    //                         + ` (${value} was provided.)`
    //                 );
    //             }

    //         }
    //     },

    //     {
    //         name: ['reconnectionMethods', 'method'],
    //         type: 'string',
    //         description: "The name of the Reconnection Method to be used when re-establishing the WDS Bridge.\n\nThe available options are based on the specified Bridge Router Model.\n\nWhen set to 'auto', the Reconnection Method will be automatically selected from the Registered Reconnection Methods by the program and be permitted to switch between the available Reconnection Methods once the designated maximum number of retries has been reached.",
    //         defaultValue: 'auto'
    //     },
    //     {
    //         name: ['reconnectionMethods', 'deferSetup'],
    //         type: 'boolean',
    //         description: "Defers performing the Setup Routine for each of the Registered Reconnection Methods until the Reconnection Method is invoked to re-establish the WDS Bridge.\n\nWhile this option will allow the program to startup faster, it may also prevent setup errors from being raised, and even the possibility of the program terminating, until an attempt is made to re-establish the WDS bridge using the Reconnection Method.",
    //         defaultValue: false
    //     },
    //     {
    //         name: ['reconnectionMethods', 'actionCooldown', 'cgi'],
    //         type: 'number',
    //         description: "The amount of time to wait between HTTP Requests made to the Router Browser CGI in milliseconds.",
    //         defaultValue: 1250,
    //         validationFn: ( value: number, name: ['reconnectionMethods', 'actionCooldown', 'cgi'] ) => {

    //             const MIN_COOLDOWN = 1;
    //             const MAX_COOLDOWN = 5000;

    //             const remainder = (value - Math.floor(value));

    //             if (remainder > 0 || value < MIN_COOLDOWN || MAX_COOLDOWN < value) {
    //                 throw new TypeError(
    //                     `The ${ObjectUtils.stringifyDynamicObjectKeys(name)} Configuration Property`
    //                         + " must be specified as a Non-Negative Integer"
    //                         + ` less than or equal to ${MAX_COOLDOWN}.`
    //                         + ` (${value} was provided.)`
    //                 );
    //             }

    //         }
    //     },
    //     {
    //         name: ['reconnectionMethods', 'actionCooldown', 'puppeteer'],
    //         type: 'number',
    //         description: "The amount of time to wait between Puppeteer Actions in milliseconds.\n\nBecause this cooldown affects all Puppeteer operations, values above ~250ms are not recommended.",
    //         defaultValue: 100,
    //         validationFn: ( value: number, name: ['reconnectionMethods', 'actionCooldown', 'puppeteer'] ) => {

    //             const MIN_COOLDOWN = 1;
    //             const MAX_COOLDOWN = 5000;

    //             const remainder = (value - Math.floor(value));

    //             if (remainder > 0 || value < MIN_COOLDOWN || MAX_COOLDOWN < value) {
    //                 throw new TypeError(
    //                     `The ${ObjectUtils.stringifyDynamicObjectKeys(name)} Configuration Property`
    //                         + " must be specified as a Non-Negative Integer"
    //                         + ` less than or equal to ${MAX_COOLDOWN}.`
    //                         + ` (${value} was provided.)`
    //                 );
    //             }

    //         }
    //     },
    //     {
    //         name: ['reconnectionMethods', 'actionCooldown', 'other'],
    //         type: 'number',
    //         description: "The amount of time to wait between actions when using a Reconnection Method whose type is 'other' in milliseconds.\n\nBecause of the wide range of actions this cooldown may apply to and the potential consequences of long cooldowns for some Reconnection Methods, shorter values less than ~500ms are recommended.",
    //         defaultValue: 500,
    //         validationFn: ( value: number, name: ['reconnectionMethods', 'actionCooldown', 'other'] ) => {

    //             const MIN_COOLDOWN = 1;
    //             const MAX_COOLDOWN = 5000;

    //             const remainder = (value - Math.floor(value));

    //             if (remainder > 0 || value < MIN_COOLDOWN || MAX_COOLDOWN < value) {
    //                 throw new TypeError(
    //                     `The ${ObjectUtils.stringifyDynamicObjectKeys(name)} Configuration Property`
    //                         + " must be specified as a Non-Negative Integer"
    //                         + ` less than or equal to ${MAX_COOLDOWN}.`
    //                         + ` (${value} was provided.)`
    //                 );
    //             }

    //         }
    //     },

    //     {
    //         name: ['verboseLogging', 'enabled'],
    //         type: 'boolean',
    //         description: "Indicates whether additional, more verbose logging should be enabled by default or not.\n\nVerbose Logging can still be enabled and disabled at runtime using the 'v' Key.",
    //         defaultValue: false
    //     },
    //     {
    //         name: ['verboseLogging', 'dataLoggingEnabled'],
    //         type: 'boolean',
    //         description: "Indicates whether additional, more verbose logging containing specific data, parameters, and return values should be enabled by default or not.\n\nVerbose Data Logging can still be enabled and disabled at runtime using the 'Shift + V' Key.",
    //         defaultValue: false
    //     }

    // ] as const satisfies ProgramConfiguration.ConfigurationOption[];
    // export type BaseConfigurationOptions = (typeof CONFIG_OPTIONS)[number];

    export const CONFIG_OPTIONS = {
        subnetNum: {
            key: 'subnetNum',
            name: 'Subnet Number',
            type: 'number',
            description: "The number of the Network Subnet Component in the IP Address.\n\nE.g.,\n192.168.0.1\n        ^",
            required: true,
            validationFn: subnetNumValidationFn,
            programVar: false
        },
        verificationInterval: {
            key: 'verificationInterval',
            name: 'Verification Interval',
            type: 'number',
            description: "The amount of time to wait between attempts to verify the status of the WDS Bridge in milliseconds.\n\nCan be changed at runtime using Keyboard Shortcuts.",
            defaultProgramVarValue: 30000,
            // validationFn: (value) => {

            //     const minInterval = 0;
            //     const maxInterval = 255;

            //     const remainder = (value - Math.floor(value));

            //     if (remainder > 0 || value < minInterval || maxInterval < value) {
            //         throw new TypeError(
            //             `${ObjectUtils.stringifyDynamicObjectKeys(name)} must be specified as a Non-Negative Integer`
            //                 + ` less than or equal to 255.`
            //                 + ` (${value} was provided.)`
            //         );
            //     }

            // } 
        },
        bridgeFrequency: {
            key: 'bridgeFrequency',
            name: 'WDS Bridge Frequency',
            type: 'string',
            description: "The Wi-Fi Frequency the WDS Bridge should be established on. Must be '2.4GHz' or '5GHz'.",
            defaultProgramVarValue: '5GHz',
            validationFn: (value) => WIFI_FREQUENCY_LIST.includes(value as any)
        },
        mainRouter: {
            key: 'mainRouter',
            name: 'Main Router',
            description: "Configuration Options associated with the Main Router the WDS Bridge is being established with.",
            type: 'object',
            required: true,
            properties: {
                ipNum: {
                    key: 'ipNum',
                    name: 'IP Address Number',
                    description: "The number of the Device-Specific Component of the Main Router's IP Address.\n\nE.g.,\n192.168.0.1\n          ^",
                    type: 'number',
                    required: true,
                    validationFn: subnetNumValidationFn,
                    programVar: false
                },
                networkName: {
                    key: 'networkName',
                    name: 'Network Name/SSID',
                    description: "The SSID or Name of the Wi-Fi Network of the Main Router that the WDS Bridge is to be connected to.",
                    type: 'string',
                    required: true,
                    validationFn: ( value: string, name: ['mainRouter', 'networkName'] ) => {
        
                        if (value.trim().length == 0) {
                            throw new TypeError(
                                "A non-empty Network Name (SSID) must be specified for the "
                                    + ObjectUtils.stringifyDynamicObjectKeys(name)
                                    + " Configuration Property."
                            );
                        }
        
                    }
                },
                networkPw: {
                    key: 'networkPw',
                    name: 'Wi-Fi Network Password',
                    description: "The Plaintext Password of the Wi-Fi Network of the Main Router that the WDS Bridge is to be connected to.",
                    type: 'string',
                    sensitive: true
                }
            }
        },
        bridgeRouter: {
            key: 'bridgeRouter',
            name: 'Bridge Router',
            description: "Configuration Options associated with the Bridge Router responsible for operating the WDS Bridge.",
            type: 'object',
            required: true,
            properties: {
                ipNum: {
                    key: 'ipNum',
                    name: 'IP Address Number',
                    description: "The number of the Device-Specific Component of the Bridge Router's IP Address.\n\nE.g.,\n192.168.0.2\n          ^",
                    type: 'number',
                    defaultProgramVarValue: 2,
                    required: true,
                    validationFn: subnetNumValidationFn,
                    programVar: false
                },
                managementPw: {
                    key: 'managementPw',
                    name: 'Management Interface Password',
                    description: "The plaintext password used to login to the Management Interface of the Bridge Router.",
                    type: 'string',
                    required: true,
                    sensitive: true
                },
                model: {
                    key: 'model',
                    name: 'Router Model',
                    description: "The Model of the Bridge Router responsible for operating the WDS Bridge.\n\nThis value is used to determine which Reconnection Method(s) to use when establishing and/or re-establishing the WDS Bridge.",
                    type: 'string',
                    defaultProgramVarValue: 'auto'
                }
            }
        },
        retries: {
            key: 'retries',
            name: 'Failure Retries',
            description: "Configuration Properties associated with retrying attempts to re-establish the WDS Bridge after a failed attempt.",
            type: 'object',
            properties: {
                minRetryTime: {
                    key: 'minRetryTime',
                    name: 'Minimum Retry Time',
                    description: "The minimum amount of time to wait in milliseconds before attempting to re-establish the WDS Bridge after the last failed attempt.",
                    type: 'number',
                    defaultProgramVarValue: 5000
                },
                maxRetryTime: {
                    key: 'maxRetryTime',
                    name: 'Maximum Retry Time',
                    description: "The maximum amount of time to wait in milliseconds before attempting to re-establish the WDS Bridge after the last failed attempt.",
                    type: 'number',
                    defaultProgramVarValue: 60000
                },
                maxMethodRetries: {
                    key: 'maxMethodRetries',
                    name: 'Maximum Method Retry Attempts',
                    description: "The maximum number of attempts to re-restablish the WDS Bridge before attempting to switch Reconnection Methods.\n\nOnly applicable when `reconnectionMethod.method` is set to 'auto'.",
                    type: 'number',
                    defaultProgramVarValue: 3,
                    validationFn: ( value: number, name: ['retries', 'maxMethodRetries'] ) => {
        
                        const MIN_RETRIES = 1;
                        const MAX_RETRIES = 100;
        
                        const remainder = (value - Math.floor(value));
        
                        if (remainder > 0 || value < MIN_RETRIES || MAX_RETRIES < value) {
                            throw new TypeError(
                                `The ${ObjectUtils.stringifyDynamicObjectKeys(name)} Configuration Property`
                                    + " must be specified as a Non-Negative Integer"
                                    + ` greater than or equal to ${MIN_RETRIES} and less than or equal to ${MAX_RETRIES}.`
                                    + ` (${value} was provided.)`
                            );
                        }
        
                    }
                },
                maxFailureRetries: {
                    key: 'maxFailureRetries',
                    name: 'Maximum Retry Attempts',
                    description: "The maximum number of attempts to re-restablish the WDS Bridge before giving up and terminating the program.",
                    type: 'number',
                    defaultProgramVarValue: 15,
                    validationFn: ( value: number, name: ['retries', 'maxFailureRetries'] ) => {
        
                        const MIN_RETRIES = 1;
                        const MAX_RETRIES = 100;
        
                        const remainder = (value - Math.floor(value));
        
                        if (remainder > 0 || value < MIN_RETRIES || MAX_RETRIES < value) {
                            throw new TypeError(
                                `The ${ObjectUtils.stringifyDynamicObjectKeys(name)} Configuration Property`
                                    + " must be specified as a Non-Negative Integer"
                                    + ` greater than or equal to ${MIN_RETRIES} and less than or equal to ${MAX_RETRIES}.`
                                    + ` (${value} was provided.)`
                            );
                        }
        
                    }
                }
            }
        },
        reconnectionMethods: {
            key: 'reconnectionMethods',
            name: 'WDS Bridge Reconnection Methods',
            description: "Configuration Properties associated with the Reconnection Methods used to establish and/or re-establish the WDS Bridge.",
            type: 'object',
            properties: {
                method: {
                    key: 'method',
                    name: 'Preferred Reconnection Method',
                    description: "The name of the Reconnection Method to be used when re-establishing the WDS Bridge.\n\nThe available options are based on the specified Bridge Router Model.\n\nWhen set to 'auto', the Reconnection Method will be automatically selected from the Registered Reconnection Methods by the program and be permitted to switch between the available Reconnection Methods once the designated maximum number of retries has been reached.",
                    type: 'string',
                    defaultProgramVarValue: 'auto'
                },
                deferSetup: {
                    key: 'deferSetup',
                    name: 'Defer Setup Routines',
                    description: "Defers performing the Setup Routine for each of the Registered Reconnection Methods until the Reconnection Method is invoked to re-establish the WDS Bridge.\n\nWhile this option will allow the program to startup faster, it may also prevent setup errors from being raised, and even the possibility of the program terminating, until an attempt is made to re-establish the WDS bridge using the Reconnection Method.",
                    type: 'boolean',
                    defaultProgramVarValue: false
                },
                actionCooldown: {
                    key: 'actionCooldown',
                    name: 'Action Cooldowns',
                    description: "Configuration Properties associated with the cooldown periods between individual actions taken by Reconnection Methods when re-establishing the WDS Bridge.\n\nEach property corresponds to a different type of Reconnection Method and is specified in milliseconds as a non-negative integer that is less than 10000.",
                    type: 'object',
                    properties: {
                        cgi: {
                            key: 'cgi',
                            name: 'CGI Action Cooldown',
                            description: "The amount of time to wait between HTTP Requests made to the Router Browser CGI in milliseconds.",
                            type: 'number',
                            defaultProgramVarValue: 1250,
                            validationFn: ( value: number, name: ['reconnectionMethods', 'actionCooldown', 'cgi'] ) => {
                
                                const MIN_COOLDOWN = 1;
                                const MAX_COOLDOWN = 5000;
                
                                const remainder = (value - Math.floor(value));
                
                                if (remainder > 0 || value < MIN_COOLDOWN || MAX_COOLDOWN < value) {
                                    throw new TypeError(
                                        `The ${ObjectUtils.stringifyDynamicObjectKeys(name)} Configuration Property`
                                            + " must be specified as a Non-Negative Integer"
                                            + ` less than or equal to ${MAX_COOLDOWN}.`
                                            + ` (${value} was provided.)`
                                    );
                                }
                
                            }
                        },
                        puppeteer: {
                            key: 'puppeteer',
                            name: 'Puppeteer Action Cooldown',
                            description: "The amount of time to wait between Puppeteer Actions in milliseconds.\n\nBecause this cooldown affects all Puppeteer operations, values above ~250ms are not recommended.",
                            type: 'number',
                            defaultProgramVarValue: 100,
                            validationFn: ( value: number, name: ['reconnectionMethods', 'actionCooldown', 'puppeteer'] ) => {
                
                                const MIN_COOLDOWN = 1;
                                const MAX_COOLDOWN = 5000;
                
                                const remainder = (value - Math.floor(value));
                
                                if (remainder > 0 || value < MIN_COOLDOWN || MAX_COOLDOWN < value) {
                                    throw new TypeError(
                                        `The ${ObjectUtils.stringifyDynamicObjectKeys(name)} Configuration Property`
                                            + " must be specified as a Non-Negative Integer"
                                            + ` less than or equal to ${MAX_COOLDOWN}.`
                                            + ` (${value} was provided.)`
                                    );
                                }
                
                            }
                        },
                        other: {
                            key: 'other',
                            name: 'Other Action Cooldown',
                            description: "The amount of time to wait between actions when using a Reconnection Method whose type is 'other' in milliseconds.\n\nBecause of the wide range of actions this cooldown may apply to and the potential consequences of long cooldowns for some Reconnection Methods, shorter values less than ~500ms are recommended.",
                            type: 'number',
                            defaultProgramVarValue: 500,
                            validationFn: ( value: number, name: ['reconnectionMethods', 'actionCooldown', 'other'] ) => {
                
                                const MIN_COOLDOWN = 1;
                                const MAX_COOLDOWN = 5000;
                
                                const remainder = (value - Math.floor(value));
                
                                if (remainder > 0 || value < MIN_COOLDOWN || MAX_COOLDOWN < value) {
                                    throw new TypeError(
                                        `The ${ObjectUtils.stringifyDynamicObjectKeys(name)} Configuration Property`
                                            + " must be specified as a Non-Negative Integer"
                                            + ` less than or equal to ${MAX_COOLDOWN}.`
                                            + ` (${value} was provided.)`
                                    );
                                }
                
                            }
                        }
                    }
                }
            }
        },
        verboseLogging: {
            key: 'verboseLogging',
            name: 'Verbose Output Logging',
            description: "Configuration Properties associated with logging methods reserved for verbose logs.",
            type: 'object',
            properties: {
                enabled: {
                    key: 'enabled',
                    name: 'Enable Globally',
                    description: "Indicates whether additional, more verbose logging should be enabled by default or not.\n\nVerbose Logging can still be enabled and disabled at runtime using the 'v' Key.",
                    type: 'boolean',
                    defaultProgramVarValue: false
                },
                dataLoggingEnabled: {
                    key: 'dataLoggingEnabled',
                    name: 'Enable Data Logging',
                    description: "Indicates whether additional, more verbose logging containing specific data, parameters, and return values should be enabled by default or not.\n\nVerbose Data Logging can still be enabled and disabled at runtime using the 'Shift + V' Key.",
                    type: 'boolean',
                    defaultProgramVarValue: false
                }
            }
        }
    } as const satisfies ProgramConfiguration.ConfigurationOptionMapType;
    export type BaseConfigurationOptions = (typeof CONFIG_OPTIONS);

    export const COMPLEX_PROGRAM_VARS = [
        {
            programVar: ['mainRouter', 'ipAddress'],
            conversionFn: (configOptions) => `192.168.${configOptions.subnetNum}.${configOptions.mainRouter.ipNum}` as const satisfies IpAddress
        },
        {
            programVar: ['bridgeRouter', 'ipAddress'],
            conversionFn: (configOptions) => `192.168.${configOptions.subnetNum}.${configOptions.bridgeRouter.ipNum}` as const satisfies IpAddress
        }
    ] as const satisfies ProgramConfiguration.ComplexProgramVariable<BaseConfigurationOptions>[];
    export type BaseComplexProgramVariables = (typeof COMPLEX_PROGRAM_VARS)[number];
    export type BaseComplexProgramVariablesMap = ProgramConfiguration.ComplexProgramVariableMap<
        BaseComplexProgramVariables['programVar'],
        BaseConfigurationOptions,
        BaseComplexProgramVariables
    >;

    export const CONFIG_DEFINITIONS = {
        configOptions: CONFIG_OPTIONS,
        // configOptions: (() => {

        //     let configOptions: ProgramConfiguration.ConfigurationOptionMap<BaseConfigurationOptions['name'], BaseConfigurationOptions> = new Map();

        //     for (let i = 0; i < CONFIG_OPTIONS.length; i++) {
        //         const configOption = CONFIG_OPTIONS[i];

        //         configOptions.set(configOption.name, configOption);
        //     }

        //     return configOptions;

        // })(),
        complexProgramVars: (() => {
            
            let configOptions: BaseComplexProgramVariablesMap = new Map();

            for (let i = 0; i < COMPLEX_PROGRAM_VARS.length; i++) {
                const complexProgramVar = COMPLEX_PROGRAM_VARS[i];

                configOptions.set(complexProgramVar.programVar, complexProgramVar);
            }

            return configOptions;

        })()
    } as const satisfies ProgramConfiguration.ProgramConfigurationDefinitions<
        BaseConfigurationOptions,
        BaseComplexProgramVariablesMap
    >;
    export type BaseConfigurationDefinitions = typeof CONFIG_DEFINITIONS;

    
}
export class BaseProgramConfigurationFactory <
    CustomDefsT extends ProgramConfiguration.ProgramConfigurationDefinitionsType[] = [],
    SuppressErrorsT extends boolean = true
> extends ProgramConfigurationFactory<[BaseProgramConfiguration.BaseConfigurationDefinitions, ...CustomDefsT], SuppressErrorsT>
{

    constructor ( suppressErrors?: SuppressErrorsT ) {

        super((suppressErrors ?? true) as SuppressErrorsT);

    }


    /**
     * @override
     */
    construct = <PrefetchedT extends boolean = true> ( retrieveConfig?: PrefetchedT ): ProgramConfiguration<
        PrefetchedT,
        [BaseProgramConfiguration.BaseConfigurationDefinitions, ...CustomDefsT]
    > => new BaseProgramConfiguration<PrefetchedT, CustomDefsT>();

}
// type Test = ProgramConfiguration.MergedProgramConfigurationDefinitions<
//     { configOptions: ProgramConfiguration.ConfigurationOptionMap<'foo'> },
//     { configOptions: ProgramConfiguration.ConfigurationOptionMap<'bar'> }
// >;
// var foo = new BaseProgramConfiguration();
// var bar = foo.getProgramVars(true);

// var bar = {
//     name: ['test'],
//     type: 'string',
//     // defaultValue: 42
// } as const satisfies ProgramConfiguration.ConfigurationOption;
// type Test2 = ProgramConfiguration.ProgramVariables<typeof bar>;

var programConfig: BaseProgramConfiguration<true> | null = null;

export const getProgramConfig = (): Promise<BaseProgramConfiguration<true>> => (
    programConfig
        ? Promise.resolve(programConfig)
        : (new BaseProgramConfigurationFactory(false)).prepare().catch((error) => {

            const BASE_ERROR_MESSAGE = "Failed to retrieve the Base Program Configuration Options";

            if (error instanceof Error)
                throw new RuntimeError(`${BASE_ERROR_MESSAGE}: ${error.message}`, { cause: error });
            else
                throw new RuntimeError(`${BASE_ERROR_MESSAGE}.`);

        })
);
export const configFileExists = (): boolean => existsSync(ProgramConfiguration.CONFIG_FILE_PATHNAME);
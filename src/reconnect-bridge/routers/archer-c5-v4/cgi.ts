/**
 * The `archer-c5-v4/cgi` Reconnection Method, which utilizes
 * the [Bridge Router CGI](../../bridge-router-cgi-reference.md)
 * and re-establishes the WDS Bridge by sending `POST` Requests
 * to the appropriate CGI Endpoints.
 * 
 * @see {@link RECONNECTION_METHOD}
 */
declare module "./cgi.js";

import BRIDGE_ROUTER from "./router.js";

import {
    AbortError,
    LogicError,
    UnrecoverableError,
    ConsoleUtils,
    ObjectUtils,
    NumberUtils,
    ConfirmationPrompt,
    AbortableAsyncOperation,
    DateType,
    WIFI_FREQUENCY_LIST,
    WifiFrequency,
    dayjs,
    verboseLog,
    verboseDataLog,
    useVerboseDataLogging,
    useVerboseLogging,
    Promisable,
    AbortableOperation,
    ROUTER_IN_USE_ERROR_MESSAGE,
    WDS_BRIDGE_NOT_SETUP_ERROR_MESSAGE,
    EnvironmentVariableDefinitions,
    EnvironmentVariableManager,
    ReconnectionMethod,
    registerEnvironmentVariables,
    getEnvironmentVariableName,
    getProgramVars,
    RuntimeError
} from "../../api/v1/index.js";
import ForegroundColor = ConsoleUtils.ForegroundColor;
import colorizeOutput = ConsoleUtils.colorizeOutput;
// import {
//     AbortError,
//     LogicError,
//     UnrecoverableError,
//     ConsoleUtils,
//     ObjectUtils,
//     NumberUtils,
//     ConfirmationPrompt
// } from "../../api/v1/utils.js";
// import {
//     AbortableAsyncOperation,
//     DateType,
//     WIFI_FREQUENCY_LIST,
//     WifiFrequency,
//     dayjs,
//     verboseLog,
//     verboseDataLog,
//     useVerboseDataLogging,
//     useVerboseLogging,
//     Promisable,
//     AbortableOperation,
//     ROUTER_IN_USE_ERROR_MESSAGE,
//     WDS_BRIDGE_NOT_SETUP_ERROR_MESSAGE
// } from "../../api/v1/common.js";
// import {
//     EnvironmentVariableDefinitions,
//     EnvironmentVariableManager,
//     ReconnectionMethod,
//     registerEnvironmentVariables
// } from "../../api/v1/index.js";
// import { getEnvironmentVariableName, getProgramVars } from "../../api/v1/env.js";

import * as http from "node:http";
import { inspect } from "node:util";
import { constants, createPublicKey, publicEncrypt } from "node:crypto";
import { readFileSync } from "node:fs";

import NodeRSA from "node-rsa";
import puppeteer from "puppeteer";
import { RawEnvironmentVariables } from "../../../env.js";
import { BaseProgramConfiguration, ProgramConfiguration } from "../../../config.js";
import { scanForWifiNetwork } from "./common.js";


/* General Types */

export type CustomEnvVarsType = {
    variables: {
        // BRIDGE_ROUTER_MANAGEMENT_PW: {
        //     name: 'BRIDGE_ROUTER_MANAGEMENT_PW',
        //     required: true,
        //     sensitive: true,
        //     programVar: ['bridgeRouter', 'managementPw'],
        //     programVarConversionFn: (envValue) => string,
        //     programVarDefaultValue: 42
        // },
        CGI_ENCRYPTED_LOGIN_USERNAME: {
            name: 'CGI_ENCRYPTED_LOGIN_USERNAME',
            required: false,
            sensitive: true
        },
        CGI_ENCRYPTED_LOGIN_PASSWORD: {
            name: 'CGI_ENCRYPTED_LOGIN_PASSWORD',
            required: false,
            sensitive: true
        }
    },
    complexProgramVars: [
        [
            ['reconnectionMethods', 'encryptedCgiCredentials'],
            ( rawEnvVars: RawEnvironmentVariables<CustomEnvVarsType> ) => { username: string, password: string } | null,
            true
        ]
    ]
};


// HTTP Parameters & Data

/**
 * An object type containing parameters to be passed with HTTP Requests
 * as Query Parameters or part of the Request Body
 * when using the {@link makeRequest `makeRequest()`} function.
 * 
 * @template ValueT     The type of the parameter *values*.
 * 
 * @see {@link makeRequest `makeRequest()`}
 * @see {@link HttpSubdata}
 * @see {@link ExtendedHttpData}
 */
type HttpData <ValueT extends string | string[] = string | string[]> = Record<string, ValueT>
/**
 * An object type containing parameters returned with HTTP Responses
 * when using the {@link makeRequest `makeRequest()`} function.
 * 
 * This type is generally only used by {@link ExtendedHttpData}.
 * 
 * @template ValueT     The type of the parameter *values*.
 * 
 * @see {@link makeRequest `makeRequest()`}
 * @see {@link HttpData}
 * @see {@link ExtendedHttpData}
 */
type HttpSubdata <ValueT extends HttpData[string] = HttpData[string]> = ValueT | HttpData<ValueT> & Record<`error${number}`, {}>;
/**
 * An object type containing parameters returned with HTTP Responses
 * when using the {@link makeRequest `makeRequest()`} function.
 * 
 * @template ValueT     The type of the *base* parameter values.
 * @template SubdataT   The type of the *main* parameter values.
 * 
 * @see {@link makeRequest `makeRequest()`}
 * @see {@link HttpData}
 * @see {@link HttpSubdata}
 */
type ExtendedHttpData <
    ValueT extends HttpData[string] = HttpData[string],
    SubdataT extends HttpSubdata<ValueT> = HttpSubdata<ValueT>
> = Record<string, SubdataT>;

/**
 * An object type used to represent HTTP Response and Request Headers.
 * 
 * Each Request or Response Header is denoted by a `string` or array of `string`s
 * representing the Header Value(s). Specifying `undefined` for a header will
 * cause the header to be sent with no value.
 */
type HttpHeaders = Record<string, string | string[] | undefined>;

/**
 * An interface containing the request parameters
 * used to authenticate requests to the CGI.
 * 
 * Not to be confused with {@link LoginCredentials}, which instead
 * contains the credentials used to login to the
 * Bridge Router Management Interface.
 * 
 * @link [*Authentication*](./cgi-reference.md)
 */
interface CgiCredentials {

    /**
     * The value of the {@link SESSION_COOKIE_NAME `JSESSIONID` Cookie},
     * which is sent in the response from the `/cgi/login` CGI Endpoint.
     */
    jsessionId?: string;
    /**
     * The value of the {@link SESSION_COOKIE_NAME `TokenID` Request Header},
     * which is injected as a JavaScript variable into the page HTML during
     * the page reload that takes place during the login flow.
     */
    tokenId?: string;

}


// HTTP Requests & Responses

/**
 * An interface containing the options that can be passed
 * when making an HTTP Request using the {@link makeRequest `makeRequest()`} function.
 */
interface HttpRequestOptions {

    /**
     * The [HTTP Request Method](https://developer.mozilla.org/docs/Web/HTTP/Methods) to use.
     * 
     * The following options are available:
     * - `GET`:     Perform a `GET` Request, which enables the use of {@link queryParams Query Parameters}
     *              but *disallows* the use of a {@link body Request Body}.
     * 
     * - `POST`:    Perform a `POST` Request, which enables the use of a {@link body Request Body}
     *              but *disallows* the use of {@link queryParams Query Parameters}.
     * 
     *              This is the default option.
     */
    method?: 'GET' | 'POST';
    /**
     * Additional [HTTP Request Headers](https://developer.mozilla.org/docs/Web/HTTP/Headers)
     * to add to the request.
     */
    headers?: HttpHeaders;
    /**
     * The relative path to the desired CGI Endpoint.
     * 
     * Defaults to `/` if omitted or null.
     */
    path?: string | null;
    /**
     * The Query Parameters to add to the request.
     * 
     * Only valid when {@link method} is `GET`.
     */
    queryParams?: HttpData;
    /**
     * The body of the request containing any necessary request parameters.
     * 
     * Only valid when {@link method} is `POST`.
     */
    body?: string | HttpData;
    /**
     * Indicates whether or not the request should
     * include {@link CgiCredentials CGI Authentication Credentials}.
     * 
     * Can only be used when {@link loginToRouter Logged In to the Router Management Interface}.
     * 
     * Defaults to `false`.
     */
    withCredentials?: boolean;
    /**
     * An {@link AbortSignal} used to terminate the request early.
     */
    signal?: AbortSignal;

}
/**
 * An interface containing the processed HTTP Response that
 * is returned by the {@link makeRequest `makeRequest()`} function.
 */
interface HttpResponse {

    /**
     * The [HTTP Response Status Code](https://developer.mozilla.org/docs/Web/HTTP/Status).
     * 
     * @see {@link statusText} for the associated Response Status Text.
     */
    statusCode: number;
    /**
     * The [HTTP Response Status Message](https://developer.mozilla.org/docs/Web/HTTP/Status)
     * associated with the {@link statusCode Response Status Code}.
     * 
     * @see {@link statusCode}
     */
    statusText: string;

    /**
     * The [HTTP Response Headers](https://developer.mozilla.org/docs/Web/HTTP/Headers).
     */
    headers: HttpHeaders;

    /**
     * The full contents of the Response Body as a `string`.
     * 
     * @see {@link bodyData} for a parsed object structure based
     *      on the contents of the response body.
     */
    body: string;
    /**
     * The parsed contents of the {@link body Response Body} as an object.
     * 
     * Any valid *Response Parameters* in the Response Body
     * will be added to the `bodyData`. Response Parameters that occur multiple
     * times in the Response Body will be added as an array of `string`s.
     * 
     * Response Parameters that follow lines of the format `[${IDENTIFIER}]`
     * where `${IDENTIFIER}` is the name of a *group identifier* will
     * be grouped in the `bodyData` based on the `${IDENTIFIER}`.
     * 
     * @example
     * {
     *    statusCode: 200,
     *    statusText: 'OK',
     *    headers: {
     *       // ...
     *    },
     *    body: '[xyz]\nfoo=bar\nfoobar=1\nfoobar=2\nfoobar=3\nvar answer = 42;\n',
     *    bodyData: {
     *       'xyz': {
     *          'foo': 'bar',
     *          'foobar': ['1', '2', '3'],
     *          'answer': '42'
     *       }
     *    }
     * }
     * 
     * @see {@link body} for the full contents of the Response Body as a `string`.
     */
    bodyData: ExtendedHttpData<string>;

}


// Login Credentials

/**
 * An interface containing credentials used to login
 * to the Bridge Router Management Interface.
 * 
 * Not to be confused with {@link CgiCredentials}, which instead
 * contains the credentials used to authenticate CGI Requests.
 * 
 * This interface is a superset of the
 * {@link PlaintextLoginCredentials} and {@link EncryptedLoginCredentials} interfaces
 * that can store plaintext or encrypted login credentials.
 * 
 * @see {@link PlaintextLoginCredentials} for an interface containing only
 *      *plaintext* login credentials.
 * 
 * @see {@link EncryptedLoginCredentials} for an interface containing only
 *      *encrypted* login credentials.
 */
interface LoginCredentials {
    username: string;
    password: string;
}
namespace LoginCredentials {
    
    /**
     * An interface containing *plaintext* credentials used
     * to login to the Bridge Router Management Interface.
     * 
     * @see {@link LoginCredentials} for the superset of this interface that can
     *      contain plaintext or encrypted login credentials.
     * 
     * @see {@link EncryptedLoginCredentials} for an interface containing *encrypted*
     *      login credentials used to login to the Bridge Router Management Interface.
     */
    export interface PlaintextCredentials extends LoginCredentials {}
    /**
     * An interface containing *encrypted* credentials used
     * to login to the Bridge Router Management Interface.
     * 
     * @see {@link LoginCredentials} for the superset of this interface that can
     *      contain plaintext or encrypted login credentials.
     * 
     * @see {@link PlaintextLoginCredentials} for an interface containing *plaintext*
     *      login credentials used to login to the Bridge Router Management Interface.
     */
    export interface EncryptedCredentials extends LoginCredentials {}

}

/**
 * An interface representing a *Login Credential Provider* responsible for
 * attempting to generate or retrieve a set of Encrypted Login Credentials
 * given the plaintext credentials.
 * 
 * @template NameT  The type of the {@link LoginCredentialProvider.name name} property.
 */
interface LoginCredentialProvider <NameT extends LoginCredentialProvider.ProviderName = LoginCredentialProvider.ProviderName> {

    /**
     * The {@link LoginCredentialProviderName Unique Name}
     * of the Login Credential Provider.
     * 
     * @see {@link LoginCredentialProviderName}
     * @see {@link method}
     */
    readonly name: NameT;
    /**
     * The Human-Readable Name of or method used by
     * the Login Credential Provider.
     * 
     * @see {@link LoginCredentialProvider.name name}
     */
    readonly method: string;
    /**
     * The {@link LoginCredentialProviderFunction Login Credential Provider Function}
     * containing the logic of the Login Credential Provider.
     * 
     * @see {@link LoginCredentialProviderFunction}
     */
    readonly supplier: LoginCredentialProvider.ProviderFunction;

}
namespace LoginCredentialProvider {
    
    /**
     * An enumeration defining the available {@link LoginCredentialProvider.name names}
     * for a {@link LoginCredentialProvider Login Credential Provider}.
     */
    export enum ProviderName {
        
        /**
         * Returns the hardcoded encrypted credentials specified
         * by the {@link EnvironmentVariable.CGI_ENCRYPTED_LOGIN_USERNAME `CGI_ENCRYPTED_LOGIN_USERNAME`}
         * and {@link EnvironmentVariable.CGI_ENCRYPTED_LOGIN_PASSWORD `CGI_ENCRYPTED_LOGIN_PASSWORD`}
         * Environment Variables, if available.
         */
        ENV_VARS = 'envVars',
        /**
         * Encrypts the plaintext credentials by using the 
         * encryption mechanisms exposed by the Browser-Based
         * Bridge Router Management Interface.
         */
        BROWSER_ENCRYPTION = 'browserEncryption',
        /**
         * Attempts to manually encrypt the plaintext credentials
         * using the Public Key Exponent and Modulus returned by the CGI.
         * 
         * ## Warning
         * This method is currently *incomplete* and will always
         * fail to generate valid encrypted credentials and
         * return `null` when invoked.
         */
        MANUAL_ENCRYPTION = 'manualEncyption',
        /**
         * Returns the {@link encryptedLoginCredentials Cached Login Credentials}, if available.
         * 
         * Invoking this method before valid login credentials have been generated
         * or retrieved by another Login Credential Provider will result in
         * an error being thrown.
         */
        CACHED_CREDENTIALS = 'cachedCredentials'

    };
    /**
     * A function type denoting a *Login Credential Provider Function* that,
     * given a `plaintextUsername` and `plaintextPassword`, attempt to generate
     * or retrieve and return a set of valid {@link LoginCredentials}.
     * 
     * @param plaintextUsername The plaintext username used to login to the Bridge Router
     *                          Management Interface.
     * 
     * @param plaintextPassword The plaintext password used to login to the Bridge Router
     *                          Management Interface.
     * 
     * @returns                 On success, the Login Credential Provider Function should
     *                          return a valid {@link LoginCredentials} object containing
     *                          the Encrypted Login Credentials.
     * 
     *                          On failure, the Login Credential Provider Function should
     *                          return `null`.
     * 
     *                          The Login Credential Provider Function can also return a
     *                          promise that resolves to either a {@link LoginCredentials} object
     *                          or `null`.
     * 
     * @throws                  On failure, the Login Credential Provider Function may
     *                          throw any type of error or other value.
     */
    export type ProviderFunction = ( plaintextUsername: string, plaintextPassword: string ) => Promisable<LoginCredentials | null>;
    /**
     * An object type representing a mapping of
     * {@link ProviderName Login Credential Provider Names}
     * to the respective {@link LoginCredentialProvider Login Credential Provider}.
     */
    export type ProviderMap = {
        [Name in ProviderName]: LoginCredentialProvider<Name>;
    };

}


// CGI Response Results

/**
 * An interface containing the result of querying the
 * `busy` State from the Bridge Router CGI.
 * 
 * @link [*Querying the `busy` State*](./cgi-reference.md)
 */
interface BusyStateResult {

    /**
     * Indicates whether or not a user is currently
     * logged in to the Bridge Router Management Interface.
     */
    isLogined: boolean;
    /**
     * Indicates whether or not the Bridge Router is currently `busy`
     * and actively processing a request.
     */
    isBusy: boolean;

}
/**
 * An interface containing the result of querying the
 * *Login Credential Encryption Public Key Components*
 * from the Bridge Router CGI.
 * 
 * @link [*Using the `/cgi/getParm` Endpoint*](./cgi-reference.md)
 * @see {@link getPublicKey `getPublicKey()`}
 */
interface PublicKeyResult {

    /**
     * The *Exponent* used to construct the Public Key,
     * which is returned as the `ee` variable from the CGI.
     */
    exponent: string;
    /**
     * The *Modulus* used to construct the Public Key,
     * which is returned as the `nn` variable from the CGI.
     */
    modulus: string;

}

/**
 * An interface containing a single result from using the Bridge Router CGI
 * to scan for available Wi-Fi Networks.
 * 
 * @template SsidT  The type of the {@link WifiNetworkScanResult.ssid ssid} property.
 * 
 * @link [*Retrieving the Wi-Fi Network Scan Results*](./cgi-reference.md)
 * @see {@link WifiNetworkScanResultSet}
 */
interface WifiNetworkScanResult <SsidT extends string = string> {

    /**
     * The unique SSID or human-readable name of the Wi-Fi Network.
     * 
     * @see {@link mac}
     */
    ssid: SsidT;
    /**
     * The unique MAC Address associated with the Wi-Fi Network.
     * 
     * @see {@link ssid}
     */
    mac: string;
    /**
     * Indicates whether or not the Wi-Fi Network
     * requires a password to connect to it.
     */
    passwordProtected: boolean;
    /**
     * The Channel the Wi-Fi Network is currently on.
     */
    channel: number;
    /**
     * The RSSI or strength of the Wi-Fi Network
     * signal received during the scan.
     */
    rssi: number;

}
/**
 * An object type containing the results from using the Bridge Router CGI
 * to scan for available Wi-Fi Networks.
 * 
 * Each property in the object corresponds to the {@link WifiNetworkScanResult.ssid `ssid`}
 * of the corresponding {@link WifiNetworkScanResult}.
 * 
 * @template SsidT  The type of the {@link WifiNetworkScanResult.ssid `ssid`} properties.
 * 
 * @link [*Retrieving the Wi-Fi Network Scan Results*](./cgi-reference.md)
 * @see {@link WifiNetworkScanResult}
 */
type WifiNetworkScanResultSet <SsidT extends string = string> = {
    [SSID in SsidT]: WifiNetworkScanResult<SSID>
};

/**
 * An interface containing the Bridge Router Wi-Fi Network Settings
 * for a specific {@link WifiFrequency Wi-Fi Frequency} retrieved
 * from the Bridge Router CGI.
 * 
 * @template FrequencyT  The type of the {@link BridgeRouterWifiNetworkSettings.frequency frequency} property.
 * 
 * @link [*Retrieving the Bridge Router Wi-Fi Network Properties*](./cgi-reference.md)
 * @see {@link BridgeRouterWifiNetworkSettingsSet}
 */
interface BridgeRouterWifiNetworkSettings <FrequencyT extends WifiFrequency = WifiFrequency> {

    /**
     * The {@link WifiFrequency Wi-Fi Frequency} of the Wi-Fi Network.
     */
    frequency: FrequencyT,
    /**
     * The unique SSID or human-readable name of the Wi-Fi Network.
     */
    ssid: string;
    /**
     * The Channel the Wi-Fi Network is currently on.
     * 
     * @see {@link autoChannel}
     */
    channel: number;
    /**
     * Indicates whether or not the Bridge Router should
     * automatically determine and set the {@link channel}.
     * 
     * @see {@link channel}
     */
    autoChannel: boolean;
    /**
     * Indicates whether or not the Wi-Fi Network is currently
     * active and available to use for the WDS Bridge.
     */
    enabled: boolean;

}
/**
 * An object type containing the complete Bridge Router Wi-Fi Network Settings
 * retrieved from the Bridge Router CGI.
 * 
 * @link [*Retrieving the Bridge Router Wi-Fi Network Properties*](./cgi-reference.md)
 * @see {@link BridgeRouterWifiNetworkSettings}
 */
type BridgeRouterWifiNetworkSettingsSet = {
    [Frequency in WifiFrequency]: BridgeRouterWifiNetworkSettings<Frequency>;
};

/**
 * An interface containing the WDS Bridge Configuration Settings
 * for a specific {@link WifiFrequency Wi-Fi Frequency} retrieved
 * from the Bridge Router CGI.
 * 
 * @template FrequencyT  The type of the {@link WDSBridgeConfiguration.frequency frequency} property.
 * 
 * @link [*Retrieving the Current WDS Bridge Settings*](./cgi-reference.md)
 * @see {@link WDSBridgeConfigurationSet}
 */
interface WDSBridgeConfiguration <FrequencyT extends WifiFrequency = WifiFrequency> {

    /**
     * The {@link WifiFrequency Wi-Fi Frequency} of the WDS Bridge.
     */
    frequency: FrequencyT;
    /**
     * Indicates whether or not the WDS Bridge is
     * active and available for use.
     */
    enabled: boolean;
    /**
     * The unique MAC Address associated with the
     * Main Router Wi-Fi Network being bridged to.
     * 
     * @see {@link ssid}
     */
    mac: string;
    /**
     * The unique SSID or human-readable name of the
     * Main Router Wi-Fi Network being bridged to.
     * 
     * @see {@link mac}
     */
    ssid: string;
    /**
     * The *Authentication Mode* of the Main Router
     * Wi-Fi Network being bridged to.
     * 
     * For example, `PSK2Authentication`.
     * 
     * @see {@link encryptionMode}
     */
    authMode: string;
    /**
     * The *Encryption Mode* of the Main Router
     * Wi-Fi Network being bridged to.
     * 
     * For example, `AESEncryption`.
     * 
     * @see {@link authMode}
     */
    encryptionMode: string;
    /**
     * The *Plaintext Password* of the Main Router
     * Wi-Fi Network being bridged to.
     */
    password: string;
    
}
/**
 * An object type containing the complete WDS Bridge Configuration Settings
 * retrieved from the Bridge Router CGI.
 * 
 * @link [*Retrieving the Current WDS Bridge Settings*](./cgi-reference.md)
 * @see {@link WDSBridgeConfiguration}
 */
type WDSBridgeConfigurationSet = {
    [Channel in WifiFrequency]: WDSBridgeConfiguration<Channel>
};

/**
 * A helper type that {@link Omit omits} the `frequency` property
 * from the specified object type.
 * 
 * This type is most commonly used with the {@link BridgeRouterWifiNetworkSettings}
 * and {@link WDSBridgeConfiguration} interfaces.
 */
type OmitFrequency <T extends { frequency: WifiFrequency }> = Omit<T, 'frequency'>;


/* Constants */

export const CUSTOM_ENV_VARS = {
    variables: {
        // BRIDGE_ROUTER_MANAGEMENT_PW: {
        //     name: 'BRIDGE_ROUTER_MANAGEMENT_PW',
        //     required: true,
        //     sensitive: true,
        //     programVar: ['bridgeRouter', 'managementPw'],
        //     programVarConversionFn: (envValue) => 'hello',
        //     programVarDefaultValue: 42
        // },
        CGI_ENCRYPTED_LOGIN_USERNAME: {
            name: 'CGI_ENCRYPTED_LOGIN_USERNAME',
            required: false,
            sensitive: true,
        },
        CGI_ENCRYPTED_LOGIN_PASSWORD: {
            name: 'CGI_ENCRYPTED_LOGIN_PASSWORD',
            required: false,
            sensitive: true,
        }
    },
    complexProgramVars: [
        [
            ['reconnectionMethods', 'encryptedCgiCredentials'],
            (rawEnvVars) => {

                if (rawEnvVars.CGI_ENCRYPTED_LOGIN_USERNAME !== null && rawEnvVars.CGI_ENCRYPTED_LOGIN_PASSWORD !== null) {
                    return {
                        username: rawEnvVars.CGI_ENCRYPTED_LOGIN_USERNAME,
                        password: rawEnvVars.CGI_ENCRYPTED_LOGIN_PASSWORD
                    };
                }

                return null;

            },
            true
        ]
    ]
} as const satisfies EnvironmentVariableDefinitions & CustomEnvVarsType;

/**
 * The Relative URL of the CGI Interface for the Bridge Router.
 * 
 * @link [Getting Started](./cgi-reference.md)
 */
const CGI_PATH = `/cgi`;
/**
 * The name of the *Session Cookie* used to
 * authenticate requests to the Bridge Router CGI.
 * 
 * @link [Using the `/cgi/login` Endpoint](./cgi-reference.md)
 */
const SESSION_COOKIE_NAME = 'JSESSIONID';


// Request Bodies

/**
 * The Main Request Body sent when
 * {@link getBridgeConfigurationSettings Retrieving the WDS Bridge Configuration Settings}.
 * 
 * @link [*Retrieving the Current WDS Bridge Settings*](./cgi-reference.md)
 * @see {@link getBridgeConfigurationSettings `getBridgeConfigurationSettings()`}
 */
const WDS_BRIDGE_CONFIG_REQUEST_BODY = (
`[LAN_WLAN_WDSBRIDGE#1,1,0,0,0,0#0,0,0,0,0,0]0,8
BridgeEnable
BridgeAddrMode
BridgeBSSID
BridgeSSID
BridgeAuthMode
BridgeEncryptMode
BridgeKey
BridgeWepKeyIndex
[LAN_WLAN_WDSBRIDGE#1,2,0,0,0,0#0,0,0,0,0,0]1,8
BridgeEnable
BridgeAddrMode
BridgeBSSID
BridgeSSID
BridgeAuthMode
BridgeEncryptMode
BridgeKey
BridgeWepKeyIndex`
);
/**
 * Get the Main Request Body sent when
 * {@link scanWifiNetworks Scanning for Nearby Wi-Fi Networks},
 * particularly when requesting the scan results.
 * 
 * @param frequency The {@link WifiFrequency Wi-Fi Frequency} that was scanned.
 * 
 * @link [*Retrieving the Wi-Fi Network Scan Results*](./cgi-reference.md)
 * @see {@link scanWifiNetworks `scanWifiNetworks()`}
 */
const GET_WIFI_NETWORK_SCAN_RESULTS_REQUEST_BODY = ( frequency: WifiFrequency ) => (
`[LAN_WLAN_BSSDESC_ENTRY#0,0,0,0,0,0#1,${frequency == '2.4GHz' ? 1 : 2},0,0,0,0]0,5
SSID
BSSID
SecurityEnable
Channel
RSSI`
);
/**
 * The Main Request Body sent when
 * {@link getBridgeRouterWifiNetworkProperties Retrieving the Bridge Router Wi-Fi Network Properties}.
 * 
 * @link [*Retrieving the Bridge Router Wi-Fi Network Properties*](./cgi-reference.md)
 * @see {@link scanWifiNetworks `scanWifiNetworks()`}
 */
const GET_BRIDGE_WIFI_NETWORK_PROPERTIES_REQUEST_BODY = (
`[LAN_WLAN#0,0,0,0,0,0#0,0,0,0,0,0]0,4
SSID
Channel
AutoChannelEnable
Enable`
);


// Definition Objects

/**
 * Defines the available {@link LoginCredentialProvider Login Credential Providers}
 * responsible for attempting to generate or retrieve a set of Encrypted Login Credentials
 * given the plaintext credentials.
 * 
 * @see {@link LoginCredentialProvider}
 */
const LOGIN_CREDENTIAL_PROVIDERS = {

    [LoginCredentialProvider.ProviderName.ENV_VARS]: {
        name: LoginCredentialProvider.ProviderName.ENV_VARS,
        method: "Environment Variables",
        supplier: () => {

            const envCredentials = customEnvVarManager.getProgramVars().reconnectionMethods.encryptedCgiCredentials;

            if (envCredentials) {
                return envCredentials
            }
            else {
                if (useVerboseLogging()) {
                    const rawEnvVars = customEnvVarManager.getRawEnvVars();

                    if (rawEnvVars.CGI_ENCRYPTED_LOGIN_USERNAME !== null)
                        console.log(`The '${getEnvironmentVariableName('CGI_ENCRYPTED_LOGIN_USERNAME')}' Environment Variable was not found.`);
                    else if (rawEnvVars.CGI_ENCRYPTED_LOGIN_PASSWORD !== null)
                        console.log(`The '${getEnvironmentVariableName('CGI_ENCRYPTED_LOGIN_PASSWORD')}' Environment Variable was not found.`);
                    else
                        console.log(`The '${getEnvironmentVariableName('CGI_ENCRYPTED_LOGIN_USERNAME')}' and '${getEnvironmentVariableName('CGI_ENCRYPTED_LOGIN_PASSWORD')}' Environment Variables were not found.`);
                }

                return null;
            }

        }
    },

    [LoginCredentialProvider.ProviderName.MANUAL_ENCRYPTION]: {
        name: LoginCredentialProvider.ProviderName.MANUAL_ENCRYPTION,
        method: "Manual Encryption",
        supplier: async (plaintextUsername, plaintextPassword) => {

            let publicKey = await getPublicKey();
    
            if (!publicKey)
                throw new Error("Failed to Retrieve the RSA Public Key!");
    
            // const key = new NodeRSA();
            // key.importKey({
            //     e: parseInt(publicKey.exponent, 16),
            //     n: Buffer.from(publicKey.modulus, 'hex')
            // }, 'components-public');
            const key = createPublicKey({
                format: 'jwk',
                key: {
                    kty: 'RSA',
                    e: Buffer.from(publicKey.exponent, 'hex').toString('base64'),
                    n: Buffer.from(publicKey.modulus, 'hex').toString('base64')
                }
            });

            return {
                username: publicEncrypt( key, Buffer.from(plaintextUsername) ).toString('hex'),
                password: publicEncrypt( key, Buffer.from(plaintextPassword).toString('base64') ).toString('hex')
                // username: key.encrypt( plaintextUsername, 'base64' ),
                // password: key.encrypt( Buffer.from(plaintextPassword).toString('base64'), 'base64')
            };
                
        }
    },

    [LoginCredentialProvider.ProviderName.BROWSER_ENCRYPTION]: {
        name: LoginCredentialProvider.ProviderName.BROWSER_ENCRYPTION,
        method: "Browser Encryption",
        supplier: async (plaintextUsername, plaintextPassword) => {

            const browserManagementUrl = `http://${getProgramVars().bridgeRouter.ip}/`;
            const publicKey = await getPublicKey();
    
            if (!publicKey)
                throw new Error("Failed to Retrieve the RSA Public Key!");

            const browser = await puppeteer.launch();
            const page = await browser.newPage();

            try {
                await page.goto(browserManagementUrl);
                return await page.evaluate(( publicKey, username, password ) => {

                    // @ts-expect-error
                    const encrypt: ( data: string, exponent: string, modulus: string ) => string = $.rsa.encrypt;
                    // @ts-expect-error
                    const base64Encode: ( data: string ) => string = $.Base64Encoding;

                    return {
                        username: encrypt( username, publicKey.modulus, publicKey.exponent ),
                        password: encrypt( base64Encode(password), publicKey.modulus, publicKey.exponent ),
                    } as LoginCredentials;

                }, publicKey, plaintextUsername, plaintextPassword);
            }
            catch (error) {
                throw error;
            }
            finally {
                await browser.close();
            }

        }
    },

    [LoginCredentialProvider.ProviderName.CACHED_CREDENTIALS]: {
        name: LoginCredentialProvider.ProviderName.CACHED_CREDENTIALS,
        method: "Cached Login Credentials",
        supplier: () => {

            if (!encryptedLoginCredentials)
                throw new Error("No Valid Encrypted Login Credentials have been cached yet!");

            return encryptedLoginCredentials;

        }
    }

} as const satisfies LoginCredentialProvider.ProviderMap;

/**
 * A mapping of the primary {@link BridgeRouterWifiNetworkSettings}
 * to their respective parameter names returned from the Bridge Router CGI.
 * 
 * A value of `null` indicates that the name of the property in
 * the {@link BridgeRouterWifiNetworkSettings} interface is the same as
 * the respective parameter name returned from the Bridge Router CGI.
 */
const BRIDGE_ROUTER_WIFI_NETWORK_SETTINGS_PROPERTY_MAP = {
    enabled: 'enable',
    ssid: 'SSID',
    autoChannel: 'autoChannelEnable',
    channel: null
} as const satisfies Record<keyof OmitFrequency<BridgeRouterWifiNetworkSettings>, string | null>;


/* Global Variables */

var customEnvVarManager = registerEnvironmentVariables(CUSTOM_ENV_VARS);


// Login & CGI Authentication Credentials

/**
 * Indicates whether or not we are currently logged in
 * to the Bridge Router Management Interface.
 * 
 * The value of this variable is generally only modified
 * by calling the {@link loginToRouter `loginToRouter()`}
 * and {@link logoutFromRouter `logoutFromRouter()`} functions.
 * 
 * @see {@link loginToRouter `loginToRouter()`}
 * @see {@link logoutFromRouter `logoutFromRouter()`}
 */
var loggedIn: boolean = false;
/**
 * Contains the {@link PublicKeyResult Public Key Components}
 * used for Encrypting Login Credentials that were
 * retrieved from the Bridge Router CGI.
 * 
 * If the Public Key Components have not yet been retrieved
 * from the Bridge Router CGI, this variable will be `null`.
 */
var publicEncryptionKey: PublicKeyResult | null = null;
/**
 * Contains the {@link LoginCredentials.EncryptedCredentials Encrypted Login Credentials}
 * used to login to the Bridge Router Management Interface.
 * 
 * This variable is populated during the {@link setup Setup Process}
 * and will be `null` until the setup has been successfully completed.
 */
var encryptedLoginCredentials: LoginCredentials.EncryptedCredentials | null = null;
/**
 * When {@link loggedIn Logged In to the Bridge Router Management Interface},
 * this variable is used to store the {@link CgiCredentials CGI Credentials}
 * used to authenticate requests to the CGI.
 * 
 * When not logged in to the Bridge Router Management Interface,
 * this variable will be set to `null`.
 * 
 * @see {@link loggedIn}
 */
var cgiCredentials: CgiCredentials | null = null;


// HTTP Request Throttling & Queuing

/**
 * Contains a {@link DateType timestamp} of the last time
 * an HTTP Request was sent to the Bridge Router.
 * 
 * If no HTTP Requests have been sent to the Bridge Router
 * yet, this variable will be `null`.
 */
var lastRequestTime: DateType | null = null;
/**
 * An array of callback functions representing the
 * *HTTP Request Queue*.
 * 
 * @see {@link makeRequest `makeRequest()`}
 */
var requestQueue: (( ...args: any[] ) => any)[] = [];
/**
 * Contains the {@link NodeJS.Timeout Timeout ID}
 * of the {@link setTimeout timeout} used to process
 * the next request in the {@link requestQueue HTTP Request Queue}.
 * 
 * If the {@link requestQueue HTTP Request Queue} is currently empty
 * or there is otherwise no active {@link setTimeout timeout},
 * this variable will be set to `null`.
 */
var requestQueueProcessingTimeout: NodeJS.Timeout | null = null;
/**
 * The number of HTTP Requests that are currently
 * being processed or are {@link requestQueue enqueued}
 * for future processing.
 */
var requestProcessingCount: number = 0;


/**
 * Make an HTTP Request to the Bridge Router Management Interface.
 * 
 * @param options   The {@link HttpRequestOptions request options} to use.
 * 
 * @returns         A promise that resolves to an {@link HttpResponse} object
 *                  representing the HTTP Response.
*/
const makeRequest = ( options: HttpRequestOptions = {} ): Promise<HttpResponse> => {

    type RequestTimestamps = {
        [Name in 'requestInit' | `${'request' | 'response'}${'Start' | 'Complete'}`]: Name extends 'requestInit'
            ? DateType
            : DateType | null;
    };

    const MAX_INTERNAL_SERVER_ERROR_RETRIES = 3;

    let timestamps: RequestTimestamps = {
        requestInit: dayjs(),
        requestStart: null,
        requestComplete: null,
        responseStart: null,
        responseComplete: null
    };

    return new Promise((resolve, reject) => {
        
        const programVars = customEnvVarManager.getProgramVars();
        let requestAttempts = 0;

        try {
            // Normalize path
            if (options.path && !options.path.startsWith('/'))
                options.path = `/${options.path}`;

            const checkForAbort = () => {

                if (options.signal && options.signal.aborted)
                    throw new AbortError(options.signal);

            };

            const requestBody: string = (() => {

                let requestBody = "";

                if (typeof options.body == 'string') {
                    requestBody = options.body.trim();
                }
                else if (typeof options.body == 'object' && typeof options.body != null) {
                    for (let name in options.body) {
                        let value = options.body[name];
        
                        requestBody += `${name}\n`;
        
                        if (value.length > 0)
                            requestBody += `=${value}\n`;
                    }
                }
        
                /**
                 * Request bodies require all newlines to be preceeded by a Carriage Return and
                 * a terminating CRLF at the very end to be parsed properly.
                 * Otherwise, requests will receive a response with "[error]71111".
                 * 
                 * See https://forum.kitz.co.uk/index.php/topic,14377.msg339087.html?PHPSESSID=79e54dfe34d7afb63e3d316ac7850000#msg339087
                 */
                (() => {
                    
                    requestBody = requestBody.replaceAll(/(?<!\r)\n/g, '\r\n');

                    if (requestBody.length > 0 && !requestBody.endsWith('\r\n'))
                        requestBody += '\r\n';

                })();


                return requestBody;
        
            })();
            const encodedParams: string = (() => {
        
                const pathHasQueryParams: boolean = options.path?.includes('?') ?? false;
                let encodedParams: string = "";
        
                if (options.queryParams) {
                    for (let name in options.queryParams) {
                        let value = options.queryParams[name];
            
                        if (!Array.isArray(value))
                            value = [value];
                        // else
                        //     name += '[]';
                         
                        for (const subvalue of value) {
                            encodedParams += (pathHasQueryParams || encodedParams.length > 0)
                                ? '&'
                                : '?';
                            encodedParams += name;
    
                            if (subvalue.length > 0) {
                                encodedParams += `=${subvalue}`;
                            }
                        }
                    }
                }
        
                return encodedParams;
        
            })();
            const requestOptions: http.RequestOptions = (() => {
    
                let requestOptions: http.RequestOptions = {
                    headers: {
                        "Accept": "*/*",
                        "Content-Type": "text/plain",
                        "Content-Length": Buffer.byteLength(requestBody, 'utf-8'),
                        "Host": programVars.bridgeRouter.ip,
                        "Origin": `http://${programVars.bridgeRouter.ip}`,
                        "Referer": `http://${programVars.bridgeRouter.ip}/`,
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0"
                    },
                    hostname: programVars.bridgeRouter.ip.toString(),
                    path: `${options.path ?? '/'}${encodedParams}`,
                    method: options.method ?? 'POST'
                };
    
                if (options.withCredentials !== false) {
                    if (cgiCredentials === null)
                        throw new Error("The CGI Authentication Credentials have not been retrieved yet!");

                    if (cgiCredentials.jsessionId)
                        requestOptions.headers!['Cookie'] = `${SESSION_COOKIE_NAME}=${cgiCredentials.jsessionId}`;
                    if (cgiCredentials.tokenId)
                        requestOptions.headers!['TokenID'] = cgiCredentials.tokenId;
                }
    
                return requestOptions;
    
            })();

            const registerTimeoutHandler = ( duration: number ) => {

                const abortHandler = () => {

                    if (requestQueueProcessingTimeout !== null) {
                        clearTimeout(requestQueueProcessingTimeout);
                        requestQueueProcessingTimeout = null;
                    }
    
                };
                const timeoutHandler = () => {
                            
                    requestQueueProcessingTimeout = null;
                    requestQueue.shift()!();
    
                    if (options.signal)
                        options.signal.removeEventListener('abort', abortHandler);
    
                };

                if (requestQueueProcessingTimeout !== null)
                    throw new LogicError("An HTTP Request Queue Processing Timeout is already in-use!");

                if (options.signal)
                    options.signal.addEventListener('abort', abortHandler);

                verboseDataLog(`Next Enqueued Request in ${duration}ms.`);
                requestQueueProcessingTimeout = setTimeout(timeoutHandler, duration);

            };
            const requestComplete = () => {

                lastRequestTime = dayjs();

                if (requestQueue.length > 0 || requestProcessingCount > 0)
                    registerTimeoutHandler(programVars.reconnectionMethods.actionCooldown.cgi);

            };
            const makeRequest = () => {

                timestamps.requestStart = dayjs();
                checkForAbort();

                requestAttempts++;

                const request = http.request(requestOptions, (response) => {
        
                    let responseBody: string = "";
                    let bodyData: ExtendedHttpData<string> = {};

                    timestamps.responseStart = dayjs();
                
                    response.on('data', (chunk: string) => (responseBody += chunk) );
                    response.on('end', () => {
        
                        let currentBodyData = bodyData;

                        timestamps.responseComplete = dayjs();

                        if ( response.headers["content-type"]?.startsWith('text/plain') || response.headers["content-type"]?.startsWith('application/javascript') ) {
                            for (let line of responseBody.split('\n')) {
                                if (line.startsWith('[')) {
                                    bodyData[line] = {};
                                    currentBodyData = bodyData[line];
                                }
                                else {
                                    let splitLine = line.split('=');
            
                                    if (splitLine[0].startsWith('var ')) {
                                        splitLine[0] = splitLine[0].slice(4);
                                    }
                                    
                                    if (typeof splitLine[1] == 'string') {
                                        if (splitLine[1].endsWith(';'))
                                            splitLine[1] = splitLine[1].slice(0, -1);
                                        if (/^[\'\"].+[\'\"]$/.test(splitLine[1]))
                                            splitLine[1] = splitLine[1].slice(1, -1);
                                    }
        
                                    if (splitLine.length == 2)
                                        currentBodyData[splitLine[0]] = splitLine[1];
                                }
                            }
                        }
        
                        const responseData: HttpResponse = {
                            statusCode: response.statusCode ?? 500,
                            statusText: response.statusMessage ?? '',
                            headers: response.headers,
                            body: responseBody,
                            bodyData: bodyData
                        };
        
                        if (useVerboseDataLogging()) {
                            console.log();
                            console.log(`${requestOptions.method} Request to '${requestOptions.path}' Received Response:`);
                            console.log(colorizeOutput(
                                `${response.statusCode} ${response.statusMessage}`,
                                new ConsoleUtils.ColorMatchMap([
                                    [/^2.+$/g, ForegroundColor.GREEN], 
                                    [/^(?:1|3).+$/g, ForegroundColor.CYAN], 
                                    [/^4.+$/g, ForegroundColor.YELLOW], 
                                    [/^5.+$/g, ForegroundColor.RED]
                                ])
                            ));
                            console.log(
                                'Response Time:',
                                colorizeOutput(`${NumberUtils.format(timestamps.responseComplete!.diff(timestamps.requestComplete, 'milliseconds'))}ms`)
                            );
                            console.log(
                                'Response Duration:',
                                colorizeOutput(`${NumberUtils.format(timestamps.responseComplete!.diff(timestamps.responseStart, 'milliseconds'))}ms`)
                            );
                            console.log(
                                'Total Request Duration:',
                                colorizeOutput(`${NumberUtils.format(timestamps.responseComplete!.diff(timestamps.requestStart, 'milliseconds'))}ms`)
                            );
                            console.log('Headers:', response.headers);
                            console.log('Body Data:', bodyData);
    
                            // Print the Response Body.
                            (() => {
    
                                const MAX_HTML_BODY_LENGTH = 2048;
    
                                let isHtml: boolean = false;
                                let body = responseBody;
    
                                if (responseData.headers['content-type']) {
                                    let headers = responseData.headers['content-type'];
        
                                    if (typeof headers == 'string')
                                        headers = [headers];
        
                                    for (let header of headers) {
                                        if (header.startsWith('text/html')) {
                                            isHtml = true;
                                            break;
                                        }
                                    }
                                }
    
                                if (isHtml && body.length > MAX_HTML_BODY_LENGTH)
                                    body = `${body.slice(0, MAX_HTML_BODY_LENGTH - 3)}......`;
    
                                console.log('Body:');
                                console.log( inspect(body, { colors: true }) );
    
                            })();
                        }

                        requestComplete();
        
                        if ( response.statusCode?.toString().startsWith('2') ) {
                            resolve(responseData);
                        }
                        else {
                            if (response.statusCode == 500 && requestAttempts <= MAX_INTERNAL_SERVER_ERROR_RETRIES) {
                                verboseDataLog(`${response.statusMessage} Occurred! Retrying...`);
                                enqueueRequest();
                            }
                            else {
                                reject(responseData);
                            }
                        }
            
                    });
            
                }).on('error', (error) => {
            
                    verboseDataLog('HTTP Request Error:', error);
                    requestComplete();
                    reject(error);
            
                });
        
                if (requestBody.length > 0)
                    request.write(requestBody);
        
                request.end();
                timestamps.requestComplete = dayjs();
                
                if (useVerboseDataLogging()) {
                    console.log();
                    console.log(`Making ${requestOptions.method} Request to '${requestOptions.path}':`);
                    console.log(
                        'Request Time:',
                        colorizeOutput(
                            `${NumberUtils.format(timestamps.requestComplete!.diff(timestamps.requestStart, 'milliseconds'))}ms`
                        ),
                    );
                    console.log('Headers:', requestOptions.headers);
                    console.log('Body:');
                    console.log( inspect(requestBody, { colors: true }) );
                }
                
                return request;

            };
            const enqueueRequest = () => {

                verboseDataLog();
                verboseDataLog(`Enqueueing ${requestOptions.method} Request to '${requestOptions.path}'.`);

                requestQueue.push(makeRequest);

                if (requestQueueProcessingTimeout === null) {
                    const timeRemaining = (
                        (
                            (lastRequestTime !== null ? lastRequestTime.valueOf() : timestamps.requestInit.valueOf())
                            + programVars.reconnectionMethods.actionCooldown.cgi
                        )
                        - timestamps.requestInit.valueOf()
                    );

                    registerTimeoutHandler(timeRemaining);
                }

            };

            requestProcessingCount++;

            if ( lastRequestTime === null || (timestamps.requestInit.valueOf() ?? 0) >= (lastRequestTime.valueOf() + programVars.reconnectionMethods.actionCooldown.cgi) ) {
                makeRequest();
            }
            else {
                checkForAbort();
                enqueueRequest();
            }

            requestProcessingCount--;
        }
        catch (error) {
            // Only catches errors thrown *outside* of the Promises.
            console.error('HTTP Request Error:', error);
            reject(error);
        }

    });

};

/**
 * Check if the specified `response` is considered
 * to be a *Successful Response* or not.
 * 
 * @param response  The {@link HttpResponse HTTP Response} being checked.
 * 
 * @param type      The type of successful response to check for.
 * 
 *                  If specified, only the specified type of successful
 *                  response will be considered to be a *Successful Response*.
 * 
 *                  If omitted or `undefined`, *any* type of successful
 *                  response will be considered to be a *Successful Response*.
 * 
 * @returns         `true` if the specified `response` is considered to be
 *                  a *Successful Response*, according to the designated `type`.
 * 
 *                  Otherwise, returns `false`.
 * 
 * @link [*Successful and Failed Requests*](./cgi-reference.md)
 */
const hasSuccessfulResponse = ( response: HttpResponse, type?: 'standard' | 'cgi' | 'javascript' ): boolean => (
    response.statusCode == 200
    && (
        (
            (!type || type == 'standard')
            && '[error]0' in response.bodyData
        )
        || (
            (!type || type == 'cgi')
            && ('[cgi]0' in response.bodyData && '[error]0' in response.bodyData)
        )
        || (
            (!type || type == 'javascript')
            && response.bodyData['$.ret'] === '0'
        )
    )
);

/**
 * Attempt to clear the `busy` State of the
 * Bridge Router Management Interface.
 * 
 * The `busy` State can only be cleared while
 * {@link loggedIn Logged In to the Router Management Interface}.
 * 
 * @returns     A promise that resolves to `true` on success
 *              or `false` on failure.
 * 
 * @link [*Clearing the `busy` State*](./cgi-reference.md)
 * @see {@link getBusyState `getBusyState()`}
 */
const clearBusyState = async (): Promise<boolean> => {

    try {
        const response = await makeRequest({
            path: `${CGI_PATH}?8`,
            body: `[${CGI_PATH}/clearBusy#0,0,0,0,0,0#0,0,0,0,0,0]0,0\n\r`
        });

        return hasSuccessfulResponse(response, 'cgi');
    }
    catch (error) {
        console.error("Failed to Clear the CGI Busy State!");
        return false;
    }

};
/**
 * Retrieve the current `busy` State of the
 * Bridge Router Management Interface.
 * 
 * The `busy` State also contains information regarding
 * whether or not the Router Management Interface
 * is currently in-use or not.
 * 
 * @returns     A promise that resolves to a {@link BusyStateResult} object
 *              on success or `null` on failure.
 * 
 * @link [*Querying the `busy` State*](./cgi-reference.md)
 * @see {@link clearBusyState `clearBusyState()`}
 */
async function getBusyState (): Promise<BusyStateResult | null> {

    let result: BusyStateResult | null = null;

    try {
        verboseLog("[+] Retrieving the Current Bridge Router Busy State...");

        const response = await makeRequest({
            path: `${CGI_PATH}/getBusy`,
            withCredentials: false
        });
        let bodyData = response.bodyData as ExtendedHttpData<string, string>;

        if ('isLogined' in bodyData && 'isBusy' in bodyData) {
            result = {
                isLogined: bodyData['isLogined'] === '1',
                isBusy: bodyData['isBusy'] === '1'
            };
            
            verboseLog("[*] Successfully Retrieved the Current Bridge Router Busy State!");
            verboseDataLog(result);
        }
    }
    catch (error) {
        console.error("Failed to retrieve the Current Busy State:", error);
    }

    return result;

}

/**
 * Retrieve the *Login Credential Encryption Public Key Components*
 * from the Bridge Router CGI.
 * 
 * If the Public Key Components have already been retrieved
 * from the Bridge Router CGI via a previous call to `getPublicKey()`,
 * the {@link publicEncryptionKey cached components} will be immediately returned.
 * 
 * @returns     A promise that resolves to a {@link PublicKeyResult} object
 *              on success or `null` on failure.
 * 
 * @link [*Using the `/cgi/getParm` Endpoint*](./cgi-reference.md)
 */
async function getPublicKey (): Promise<PublicKeyResult | null> {

    if (!publicEncryptionKey) {
        try {
            const response = await makeRequest({
                'path': '/cgi/getParm',
                withCredentials: false
            });
            let bodyData = response.bodyData as ExtendedHttpData<string, string>;
    
            if ('ee' in bodyData && 'nn' in bodyData) {
                publicEncryptionKey = {
                    exponent: bodyData['ee'],
                    modulus: bodyData['nn']
                };
            }
            if (publicEncryptionKey)
                verboseDataLog('Retrieved RSA Public Key:', publicEncryptionKey);
        }
        catch (error) {
            console.error("Failed to retrieve the RSA Public Key.");
        }
    }
    else {
        verboseDataLog("Using existing RSA Public Key:", publicEncryptionKey);
    }

    return publicEncryptionKey;

}
/**
 * Attempt to login to the Bridge Router Management Interface
 * using the Encrypted Login Credentials returned by
 * the designated `credentialSupplier`.
 * 
 * Calling this function while {@link loggedIn already logged in}
 * will have no effect.
 * 
 * @param credentialSupplier    The {@link LoginCredentialProvider} responsible for returning the
 *                              Encrypted Login Credentials used to login to the Router Management Interface.
 * 
 * @returns                     A promise that resolves to `true` on success and `false` on failure.
 * 
 *                              If {@link loggedIn} is `true`, immediately resolves to `true`.
 * 
 * @link [*Logging In to the Router Management Interface*](./cgi-reference.md)
 */
async function loginToRouter ( credentialSupplier?: LoginCredentialProvider ): Promise<boolean> {

    const login = async ( credentials: LoginCredentials ) => {

        let response = await makeRequest({
            path: '/cgi/login',
            queryParams: {
                UserName: credentials.username,
                Passwd: credentials.password,
                Action: '1',
                LoginStatus: '0'
            },
            withCredentials: false
        });

        if ( hasSuccessfulResponse(response, 'javascript') && typeof response.headers['set-cookie'] != 'undefined' ) {
            for (let cookie of response.headers['set-cookie']) {
                if (cookie.startsWith(SESSION_COOKIE_NAME)) {
                    const matchResults = cookie.match(new RegExp(`${SESSION_COOKIE_NAME}=(\\w+);`));

                    if ( matchResults && !matchResults[1].includes('deleted') )
                        cgiCredentials = {
                            jsessionId: matchResults[1]
                        };

                    break;
                }
            }

            if (cgiCredentials !== null) {
                let landingPageResponse = await makeRequest({ method: 'GET', path: '/' });
                let matchResults = landingPageResponse.body.match(
                    new RegExp(`<script type="text/javascript">var token="(\\w+)";</script>`)
                );

                if (matchResults)
                    cgiCredentials.tokenId = matchResults[1];
            }

            verboseDataLog("Retrieved Session Credentials:", cgiCredentials);

            if ( cgiCredentials && 'jsessionId' in cgiCredentials && 'tokenId' in cgiCredentials ) {
                if (!encryptedLoginCredentials)
                    encryptedLoginCredentials = credentials;
                
                loggedIn = true;
                verboseLog(`[*] Successfully logged in to the Router Management Interface!`);
                return true;
            }
        }

        return false

    };

    if (loggedIn)
        return true;

    verboseLog(`[+] Attempting to login to the Router Management Interface...`);

    if (credentialSupplier) {
        try {
            let encryptedCredentials = await credentialSupplier.supplier('admin', customEnvVarManager.getProgramVars().bridgeRouter.managementPw);
            verboseDataLog(`Received the following Login Credentials from the '${credentialSupplier.method}' Credential Supplier:`, encryptedCredentials);
    
            // Attempt to login to the Router Management Interface
            if (encryptedCredentials !== null)
                return await login(encryptedCredentials);
    
            verboseLog(`The '${credentialSupplier.method}' Credential Supplier returned ${colorizeOutput(null)}.`);
        }
        catch (error) {
            console.error(`Failed to Login to the Router Management Interface using the '${credentialSupplier.method}' method:`, error);
        }
    }
    else {
        let encryptedCredentials = await getLoginCredentials(false, false);

        if (encryptedCredentials) {
            if (!loggedIn)
                return login(encryptedCredentials);

            return true;
        }
    }

    verboseLog(`[-] Failed to login to the Router Management Interface!`);
    return false;
        
}
/**
 * Attempt to logout of the Bridge Router Management Interface.
 * 
 * Calling this function while {@link loggedIn already logged out}
 * will have no effect.
 * 
 * @returns     A promise that resolves to `true` on success and `false` on failure.
 * 
 *              If {@link loggedIn} is `false`, immediately resolves to `true`.
 * 
 * @link [*Logging Out of the Router Management Interface*](./cgi-reference.md)
 */
async function logoutFromRouter (): Promise<boolean> {

    try {
        if (!loggedIn)
            return true;

        verboseLog(`[+] Attempting to logout from the Router Management Interface...`);
        
        await clearBusyState();
        const response = await makeRequest({
            path: `${CGI_PATH}?8`,
            body: '[/cgi/logout#0,0,0,0,0,0#0,0,0,0,0,0]0,0\n\r'
        });

        const result = hasSuccessfulResponse(response, 'cgi');

        if (result) {
            loggedIn = false;
            verboseLog(`[*] Successfully logged out of the Router Management Interface!`);
        }
        else {
            verboseLog(`[-] Failed to log out of the Router Management Interface!`);
        }

        return result;
    }
    catch (error) {
        console.error("Failed to Logout from the Router Management Interface:", error);
        return false;
    }

}
/**
 * Attempt to retrieve valid Encrypted Login Credentials
 * from one of the {@link LOGIN_CREDENTIAL_PROVIDERS available Login Credential Providers}.
 * 
 * @template SignalT    The type of the `signal` argument.
 * @template ReturnT    The computed type of the value contained in the returned promise.
 * 
 * @param force         Indicates whether or not to force a new set of credentials
 *                      to be retrieved even if {@link encryptedLoginCredentials cached credentials already exist}.
 * 
 * @param logout        Indicates whether or not to automatically {@link logoutFromRouter logout}
 *                      from the Router Management Interface after successfully logging in to
 *                      it with the recently-retrieved credentials.
 * 
 * @param signal        An optional {@link AbortSignal} that can be used to terminate
 *                      the operation early.
 * 
 * @returns             A promise that resolves to a {@link LoginCredentials} object
 *                      on success or `null` on failure.
 * 
 *                      If a `signal` is provided and is used to terminate the operation
 *                      early, the promise will resolve to the value `'aborted'`.
 */
async function getLoginCredentials <
    SignalT extends AbortSignal | undefined = undefined,
    ReturnT extends AbortableOperation<LoginCredentials | null> = (
        SignalT extends AbortSignal
            ? AbortableOperation<LoginCredentials | null>
            : LoginCredentials | null
    )
> (
    force: boolean = false,
    logout: boolean = true,
    signal?: SignalT
): Promise<ReturnT> {

    const existingCredentials = encryptedLoginCredentials;

    if (existingCredentials) {
        if (!force)
            return existingCredentials as ReturnT;
        else
            encryptedLoginCredentials = null;
    }

    const loginProviderNames = Object.keys(LOGIN_CREDENTIAL_PROVIDERS);

    let loginAttempts: number = 0;
    let currentCredentialSupplier: LoginCredentialProvider.ProviderName = encryptedLoginCredentials
                ? LoginCredentialProvider.ProviderName.CACHED_CREDENTIALS
                : LoginCredentialProvider.ProviderName.ENV_VARS;
    let loginCredentials: LoginCredentials | null = null;

    verboseLog("[+] Attempting to Retrieve Valid Login Credentials from an available Login Credential Provider...");

    while ( !loggedIn && (currentCredentialSupplier != 'cachedCredentials' || loginAttempts == 0) ) {
        if (signal?.aborted)
            return 'aborted' as ReturnT;

        loggedIn = await loginToRouter(LOGIN_CREDENTIAL_PROVIDERS[currentCredentialSupplier]);

        if (!loggedIn) {
            if (currentCredentialSupplier == 'cachedCredentials' && encryptedLoginCredentials) {
                encryptedLoginCredentials = null;
                verboseLog("Cached CGI Login Credentials are Stale! Attempting to generate new credentials...");
            }

            loginAttempts++;
            currentCredentialSupplier = ObjectUtils.nextKey(LOGIN_CREDENTIAL_PROVIDERS, currentCredentialSupplier)!;
        }
        else {
            loginCredentials = encryptedLoginCredentials;
        }
    }

    if (loggedIn) {
        if (logout)
            await logoutFromRouter();

        verboseLog(`[+] Successfully Retrieved Valid Login Credentials from the '${currentCredentialSupplier}' (${LOGIN_CREDENTIAL_PROVIDERS[currentCredentialSupplier].method}) Login Credential Provider!`);
        verboseDataLog(loginCredentials);
    }
    else if (existingCredentials) {
        encryptedLoginCredentials = existingCredentials;
    }

    return loginCredentials as ReturnT;

};

/**
 * Scan for available Wi-Fi Networks that the WDS Bridge can be established with.
 * 
 * A Wi-Fi Network Scan can only be performed while
 * {@link loggedIn Logged In to the Router Management Interface}.
 * 
 * @returns     A promise that resolves to a {@link WifiNetworkScanResultSet}
 *              on success or `null` on failure.
 * 
 * @link [*Initiating the Wi-Fi Network Scan*](./cgi-reference.md)
 * @see {@link getMainRouterWifiNetworkProperties `getMainRouterWifiNetworkProperties()`}
 */
async function scanWifiNetworks (): Promise<WifiNetworkScanResultSet | null> {

    verboseLog("[+] Attempting to Scan for Available Wi-Fi Networks...");

    return makeRequest({
        path: `${CGI_PATH}?7`,
        body: "[ACT_WLAN_SCAN#1,2,0,0,0,0#0,0,0,0,0,0]0,0\r\n"
    }).then(
        (response) => {

            if (!hasSuccessfulResponse(response, 'standard'))
                throw response;

            return makeRequest({
                path: `${CGI_PATH}?6`,
                body: GET_WIFI_NETWORK_SCAN_RESULTS_REQUEST_BODY('5GHz')
            });

        }
    ).then(
        async (response) => {

            if (response.statusCode != 200)
                throw response;

            let scanResults = {} as WifiNetworkScanResultSet;

            for (let resultName in response.bodyData) {
                let result = response.bodyData[resultName];

                if (resultName.startsWith('[error]'))
                    continue;

                scanResults[result['SSID']] = {
                    ssid: result['SSID'],
                    mac: result['BSSID'],
                    passwordProtected: result['securityEnable'] == '1',
                    channel: parseInt(result['channel']),
                    rssi: parseInt(result['RSSI'])
                };
            }

            await clearBusyState();
            verboseLog("[*] Successfully Scanned for Available Wi-Fi Networks!");
            verboseDataLog(scanResults);
            return scanResults;

        }
    ).catch(
        (errorOrResponse) => {

            console.error("Failed to Scan Available Wi-Fi Networks:", errorOrResponse);
            return null;

        }
    );

}
/**
 * Retrieve the Main Router Wi-Fi Network Properties
 * by performing a {@link scanWifiNetworks Wi-Fi Network Scan}
 * via the Bridge Router CGI.
 * 
 * @returns     A promise that resolves to a {@link WifiNetworkScanResult} object
 *              on success or `null` on failure.
 * 
 * @link [*Retrieving the Main Router Wi-Fi Network Properties*](./cgi-reference.md)
 * @see {@link scanWifiNetworks `scanWifiNetworks()`}
 */
const getMainRouterWifiNetworkProperties = async (): Promise<WifiNetworkScanResult | null> => {

    const programVars = customEnvVarManager.getProgramVars();

    verboseLog("[+] Attempting to Retrieve the Main Router Wi-Fi Network Properties...");
    return scanForWifiNetwork(
        async () => {

            const networks = await scanWifiNetworks();

            if (networks && programVars.mainRouter.ssid in networks) {
                verboseDataLog(networks[programVars.mainRouter.ssid]);
                return networks[programVars.mainRouter.ssid];
            }

        },
        RECONNECTION_METHOD
    ).catch((error) => { throw error });

} /* new Promise(
    async (resolve, reject) => {

        const MAX_RETRIES = 2;
        const RETRY_COOLDOWN = 2500;

        const programVars = customEnvVarManager.getProgramVars();
        let attempts = 0;

        const scan = async () => {

            let networks = await scanWifiNetworks();
            attempts++;

            if (networks && programVars.mainRouter.ssid in networks) {
                verboseLog("[*] Successfully Retrieved the Current Main Router Wi-Fi Network Properties!");
                verboseDataLog(networks[programVars.mainRouter.ssid]);
                resolve(networks[programVars.mainRouter.ssid]);
            }
            else if (attempts <= MAX_RETRIES) {
                verboseLog(`[/] Failed to locate the Main Router Wi-Fi Network! Retrying in ${RETRY_COOLDOWN}ms...`);
                setTimeout(scan, RETRY_COOLDOWN);
            }
            else {
                throw new ReconnectionMethod.MainRouterError(
                    "Failed to locate the Main Router Wi-Fi Network! The Main Router may or may not be down.",
                    RECONNECTION_METHOD
                );
                // console.error(`Failed to locate the Main Router Wi-Fi Network! The Main Router may or may not be down.`);
                // resolve(null);
            }

        };

        verboseLog("[+] Attempting to Retrieve the Main Router Wi-Fi Network Properties...");
        scan();

    }
); */

/**
 * Retrieve the Bridge Router Wi-Fi Network Properties from the Bridge Router CGI.
 * 
 * @returns     A promise that resolves to a {@link BridgeRouterWifiNetworkSettingsSet}
 *              on success or `null` on failure.
 * 
 * @link [*Retrieving the Bridge Router Wi-Fi Network Properties*](./cgi-reference.md)
 * @see {@link setBridgeRouterWifiNetworkProperties `setBridgeRouterWifiNetworkProperties()`}
 */
async function getBridgeRouterWifiNetworkProperties (): Promise<BridgeRouterWifiNetworkSettingsSet | null> {

    const FREQUENCY_RESPONSE_GROUPS: Record<WifiFrequency, string> = {
        "2.4GHz": '[1,1,0,0,0,0]0',
        "5GHz": '[1,2,0,0,0,0]0'
    };

    try {
        verboseLog("[+] Attempting to retrieve the Current Bridge Router Wi-Fi Network Properties...");

        const response = await makeRequest({
            path: `${CGI_PATH}?5`,
            body: GET_BRIDGE_WIFI_NETWORK_PROPERTIES_REQUEST_BODY
        });
    
        if (response.statusCode == 200 && FREQUENCY_RESPONSE_GROUPS['2.4GHz'] in response.bodyData && FREQUENCY_RESPONSE_GROUPS['5GHz'] in response.bodyData) {
            let wifiSettings = {} as BridgeRouterWifiNetworkSettingsSet;
    
            for (let frequency in FREQUENCY_RESPONSE_GROUPS) {
                wifiSettings[frequency] = {
                    frequency: frequency
                } as BridgeRouterWifiNetworkSettings;

                for (let property in BRIDGE_ROUTER_WIFI_NETWORK_SETTINGS_PROPERTY_MAP) {
                    let responseData = response.bodyData
                        [FREQUENCY_RESPONSE_GROUPS[frequency]]
                        [BRIDGE_ROUTER_WIFI_NETWORK_SETTINGS_PROPERTY_MAP[property] ?? property];

                    if (['autoChannel', 'enabled'].includes(property))
                        wifiSettings[frequency][property] = (responseData == '1');
                    else if (property == 'channel')
                        wifiSettings[frequency][property] = parseInt(responseData);    
                    else
                        wifiSettings[frequency][property] = responseData;
                }
            }
    
            await clearBusyState();
            verboseLog("[*] Successfully retrieved the Current Bridge Router Wi-Fi Network Properties!");
            verboseDataLog(wifiSettings);
            return wifiSettings;
        }
    }
    catch (error) {
        console.error("Failed to Retrieve the Current Bridge Router Wi-Fi Network Properties:", error);
    }

    return null;

}
/**
 * Update the Bridge Router Wi-Fi Network Properties using the Bridge Router CGI.
 * 
 * @template FrequencyT     The type of the `frequency` argument.
 * 
 * @param frequency         The {@link WifiFrequency Wi-Fi Frequency} whose Wi-Fi Network
 *                          Properties are being modified.
 * 
 * @param properties        The {@link BridgeRouterWifiNetworkSettings} to modify.
 * 
 *                          Only the properties being changed have to be specified.
 * 
 * @returns                 A promise that resolves to `true` on success or `false` on failure.
 * 
 * @link [*Changing the Bridge Router Wi-Fi Network Settings*](./cgi-reference.md)
 * @see {@link getBridgeRouterWifiNetworkProperties `getBridgeRouterWifiNetworkProperties()`}
 */
async function setBridgeRouterWifiNetworkProperties <FrequencyT extends WifiFrequency = WifiFrequency> (
    frequency: FrequencyT,
    properties: Partial<BridgeRouterWifiNetworkSettings<FrequencyT>>
): Promise<boolean> {

    let requestBody = "";
    let propertyCount = 0;
    
    verboseLog(`[+] Attempting to modify the${useVerboseDataLogging() ? ' following' : ''} Bridge Router ${frequency} Wi-Fi Network Properties...`);
    verboseDataLog(properties);

    for (let property in BRIDGE_ROUTER_WIFI_NETWORK_SETTINGS_PROPERTY_MAP) {
        if (property in properties) {
            requestBody += `${BRIDGE_ROUTER_WIFI_NETWORK_SETTINGS_PROPERTY_MAP[property] ?? property}=`;
            requestBody += !['autoChannel', 'enabled'].includes(property)
                ? properties[property]
                : properties[property] ? '1' : '0';
            requestBody += '\r\n';

            propertyCount++;
        }
    }

    if (propertyCount > 0) {
        const response = await makeRequest({
            path: `${CGI_PATH}?2`,
            body: `[LAN_WLAN#1,${frequency == '2.4GHz' ? 1 : 2},0,0,0,0#0,0,0,0,0,0]0,${propertyCount}\r\n${requestBody}`
        });
    
        if (hasSuccessfulResponse(response, 'standard')) {
            await clearBusyState();
            verboseLog(`[*] Successfully updated the Bridge Router ${frequency} Wi-Fi Network Properties!`);
            return true;
        }
    }
    
    verboseLog(`[-] Failed to update the Bridge Router ${frequency} Wi-Fi Network Properties!`);
    return false;
}

/**
 * Retrieve the WDS Bridge Configuration Settings from the Bridge Router CGI.
 * 
 * @returns     A promise that resolves to a {@link WDSBridgeConfigurationSet}
 *              on success or `null` on failure.
 * 
 * @link [*Retrieving the Current WDS Bridge Settings*](./cgi-reference.md)
 * @see {@link setBridgeConfigurationSettings `setBridgeConfigurationSettings()`}
 */
async function getBridgeConfigurationSettings (): Promise<WDSBridgeConfigurationSet | null> {

    const WDS_BRIDGE_CONFIGURATION_SETTINGS_PROPERTY_MAP: Record<keyof OmitFrequency<WDSBridgeConfiguration>, string> = {
        enabled: 'bridgeEnable',
        mac: 'bridgeBSSID',
        ssid: 'bridgeSSID',
        authMode: 'bridgeAuthMode',
        encryptionMode: 'bridgeEncryptMode',
        password: 'bridgeKey'
    };
    const CHANNEL_RESPONSE_GROUPS: Record<WifiFrequency, string> = {
        "2.4GHz": '[1,1,0,0,0,0]0',
        "5GHz": '[1,2,0,0,0,0]1'
    };

    verboseLog("[+] Attempting to retrieve the Current WDS Bridge Configuration Settings...");

    const response = await makeRequest({
        path: `${CGI_PATH}?1&1`,
        body: WDS_BRIDGE_CONFIG_REQUEST_BODY
    });

    if (CHANNEL_RESPONSE_GROUPS['2.4GHz'] in response.bodyData && CHANNEL_RESPONSE_GROUPS['5GHz'] in response.bodyData) {
        let configurations = {} as WDSBridgeConfigurationSet;

        for (let frequency of WIFI_FREQUENCY_LIST) {
            configurations[frequency] = {
                frequency: frequency
            } as WDSBridgeConfiguration as any;

            for (let property in WDS_BRIDGE_CONFIGURATION_SETTINGS_PROPERTY_MAP) {
                let responseData = response.bodyData
                    [CHANNEL_RESPONSE_GROUPS[frequency]]
                    [WDS_BRIDGE_CONFIGURATION_SETTINGS_PROPERTY_MAP[property]];
                
                configurations[frequency][property] = (property != 'enabled' ? responseData : (responseData == '1'));
            }
        }

        await clearBusyState();
        verboseLog("[*] Successfully retrieved the Current WDS Bridge Configuration Settings!");
        verboseDataLog(configurations);
        return configurations;
    }

    verboseLog("[-] Failed to retrieve the Current WDS Bridge Configuration Settings!");
    return null;

}
/**
 * Update the WDS Bridge Configuration Settings using the Bridge Router CGI.
 * 
 * @template FrequencyT     The type of the `frequency` argument.
 * 
 * @param frequency         The {@link WifiFrequency Wi-Fi Frequency} of the
 *                          WDS Bridge being modified.
 * 
 * @param properties        The {@link WDSBridgeConfiguration} to use.
 * 
 * @returns                 A promise that resolves to `true` on success or `false` on failure.
 * 
 * @link [*Changing the WDS Bridge Configuration Settings*](./cgi-reference.md)
 * @see {@link getBridgeConfigurationSettings `getBridgeConfigurationSettings()`}
 */
async function setBridgeConfigurationSettings <FrequencyT extends WifiFrequency = WifiFrequency> (
    frequency: FrequencyT,
    properties: WDSBridgeConfiguration
): Promise<boolean> {

    const WDS_BRIDGE_CONFIGURATION_SETTINGS_PROPERTY_MAP: Record<keyof OmitFrequency<WDSBridgeConfiguration>, string> = {
        enabled: 'BridgeEnable',
        mac: 'BridgeBSSID',
        ssid: 'BridgeSSID',
        authMode: 'BridgeAuthMode',
        password: 'BridgeEncryptKey',
        encryptionMode: 'BridgeEncryptMode',
    };

    verboseLog(`[+] Attempting to modify the${useVerboseDataLogging() ? ' following' : ''} ${frequency} WDS Bridge Configuration Settings...`);
    verboseDataLog(properties);

    let responseBody = "";

    for (let property in WDS_BRIDGE_CONFIGURATION_SETTINGS_PROPERTY_MAP) {
        responseBody += `${WDS_BRIDGE_CONFIGURATION_SETTINGS_PROPERTY_MAP[property]}=`;
        responseBody += property != 'enabled'
            ? properties[property]
            : properties[property] ? '1' : '0';
        responseBody += '\r\n';
    }

    const response = await makeRequest({
        path: `${CGI_PATH}?2`,
        body: `[LAN_WLAN_WDSBRIDGE#1,${frequency == '2.4GHz' ? 1 : 2},0,0,0,0#0,0,0,0,0,0]0,7\r\n${responseBody}`
    });

    if ( hasSuccessfulResponse(response, 'standard') ) {
        await clearBusyState();
        verboseLog(`[*] Successfully updated the ${frequency} WDS Bridge Configuration Settings!`);
        return true;
    }

    verboseLog(`[-] Failed to update the ${frequency} WDS Bridge Configuration Settings!`);
    return false;

}

/**
 * The {@link ReconnectionMethodFunction Reconnection Method Function}
 * for the `archer-c5-v4/cgi` Reconnection Method responsible for
 * re-establishing the WDS Bridge using the Bridge Router CGI.
 */
const reconnect: ReconnectionMethod.ReconnectionFunction = (signal): ReconnectionMethod.ReconnectionOperationResult => new Promise(
    async (resolve, reject) => {
        
        const programVars = customEnvVarManager.getProgramVars();
        
        function checkForAbort <ArgsT extends any[], ReturnT extends any> (
            fn: ( ...args: ArgsT ) => ReturnT,
            ...args: ArgsT
        ): ReturnT {

            if (signal.aborted)
                throw new AbortError(signal);

            return fn(...args);

        }
        
        async function settlePromise ( result: ReconnectionMethod.ReconnectionResult | Error ): Promise<void> {

            if (loggedIn)
                await logoutFromRouter();

            if (typeof result == 'boolean' || result == 'aborted')
                resolve(result);
            else
                reject(result);

        }

        try {
            let bridgeConfig: WDSBridgeConfigurationSet | null = null;
            let mainRouterWifiNetwork: WifiNetworkScanResult | null = null;
            let bridgeRouterWifiNetwork: BridgeRouterWifiNetworkSettings | null = null;
            let bridgeFrequency = programVars.wdsBridgeFrequency;
            let otherBridgeFrequency = bridgeFrequency == '5GHz'
                ? '2.4GHz' as const
                : '5GHz' as const;
            let currentCredentialSupplier: LoginCredentialProvider.ProviderName = encryptedLoginCredentials
                ? LoginCredentialProvider.ProviderName.CACHED_CREDENTIALS
                : LoginCredentialProvider.ProviderName.ENV_VARS;
            let loginAttempts = 0;

            function isValidBridgeConfig (): boolean {

                verboseLog("[+] Verifying Current WDS Bridge Configuration...");

                for (let frequency in bridgeConfig) {
                    let config = bridgeConfig[frequency];
                    let isValidConfig = (
                        config.enabled
                        && config.mac.length > 0
                        && config.ssid.length > 0
                        && config.password.length > 0
                    );
        
                    if (isValidConfig) {
                        verboseLog("[*] Successfully Verified the Current WDS Bridge Configuration!");
                        return true;
                    }
                }
                
                verboseLog("[/] WDS Bridge Configuration Verification Failed! (No Valid WDS Bridge Configuration Found)");
                return false;
        
            }
            function hasValidBridgeRouterWifiNetworkSettings (): boolean {

                let failureReason: string | null = null;

                verboseLog("[+] Verifying Bridge Router Wi-Fi Network Settings...");

                if (!bridgeRouterWifiNetwork)
                    failureReason = "Failed to Retrieve the Bridge Router Wi-Fi Network Settings";
                else if (!bridgeRouterWifiNetwork.enabled)
                    failureReason = "Bridge Router Wi-Fi Network not enabled";
                else if (bridgeRouterWifiNetwork.channel !== mainRouterWifiNetwork?.channel)
                    failureReason = "Incorrect Bridge Router Wi-Fi Channel";
                else if (bridgeRouterWifiNetwork.autoChannel)
                    failureReason = "Bridge Router Wi-Fi Channel Auto-Configuration is enabled";

                if (!failureReason) {
                    verboseLog("[*] Successfully Verified the Bridge Router Wi-Fi Network Settings!");
                    return true;
                }
                
                verboseLog(() => (
                    "[/] Bridge Router Wi-Fi Network Setting Verification Failed! ("
                        + colorizeOutput(failureReason, ForegroundColor.YELLOW)
                        + ")"
                ));
                return false;
        
            }
            

            // Login to the Router Management Interface.
            if (!loggedIn) {
                if ( (await getBusyState())?.isLogined === true ) {
                    console.error(ROUTER_IN_USE_ERROR_MESSAGE);

                    if ( !(await ConfirmationPrompt.prompt()) )
                        return settlePromise(false);
                }

                await loginToRouter();

                if (!loggedIn)
                    return settlePromise(false);
            }


            // Retrieve the Main Router Wi-Fi Network Properties.
            mainRouterWifiNetwork = await checkForAbort(getMainRouterWifiNetworkProperties);

            if (!mainRouterWifiNetwork)
                return settlePromise(null);


            // Retrieve & Verify the Current Bridge Router Wi-Fi Network Properties.
            bridgeRouterWifiNetwork = ((await checkForAbort(getBridgeRouterWifiNetworkProperties))?.[bridgeFrequency]) ?? null;

            if (!bridgeRouterWifiNetwork)
                return settlePromise(false);

            if ( !hasValidBridgeRouterWifiNetworkSettings() ) {
                let modifiedProperties: Partial<BridgeRouterWifiNetworkSettings> = {
                    enabled: true,
                    autoChannel: false,
                    channel: mainRouterWifiNetwork.channel
                };

                if ( !(await checkForAbort(setBridgeRouterWifiNetworkProperties, bridgeFrequency, modifiedProperties)) )
                    return settlePromise(false);
            }


            // Retrieve & Verify the Current WDS Bridge Configuration.
            bridgeConfig = await checkForAbort(getBridgeConfigurationSettings);

            if (!bridgeConfig)
                return settlePromise(false);
            
            if (!isValidBridgeConfig()) {
                if (programVars.mainRouter.wifiPw === null)
                    throw new UnrecoverableError(WDS_BRIDGE_NOT_SETUP_ERROR_MESSAGE);

                // Disable the other WDS Bridge if necessary.
                if (bridgeConfig[otherBridgeFrequency].enabled) {
                    verboseLog(`[+] Disabling the ${otherBridgeFrequency} WDS Bridge...`);
                    bridgeConfig[otherBridgeFrequency].enabled = false;
                    bridgeConfig[otherBridgeFrequency].mac = '';
                    bridgeConfig[otherBridgeFrequency].ssid = '';
                    bridgeConfig[otherBridgeFrequency].password = '';

                    if ( !(await checkForAbort(setBridgeConfigurationSettings, otherBridgeFrequency, bridgeConfig[otherBridgeFrequency])) ) {
                        verboseLog(`[-] Failed to Disable the ${otherBridgeFrequency} WDS Bridge!`);
                        return settlePromise(false);
                    }

                    verboseLog(`[*] Successfully Disabled the ${otherBridgeFrequency} WDS Bridge!`);
                }

                // Configure the desired WDS Bridge
                verboseLog(`[+] Configuring the ${bridgeFrequency} WDS Bridge...`);
                bridgeConfig[bridgeFrequency].enabled = true;
                bridgeConfig[bridgeFrequency].mac = mainRouterWifiNetwork.mac;
                bridgeConfig[bridgeFrequency].ssid = mainRouterWifiNetwork.ssid;
                bridgeConfig[bridgeFrequency].authMode = 'PSK2Authentication';
                bridgeConfig[bridgeFrequency].encryptionMode = 'AESEncryption';
                bridgeConfig[bridgeFrequency].password = programVars.mainRouter.wifiPw;

                if ( !(await checkForAbort(setBridgeConfigurationSettings, bridgeFrequency, bridgeConfig[bridgeFrequency])) ) {
                    verboseLog(`[-] Failed to Configure the ${bridgeFrequency} WDS Bridge!`);
                    return settlePromise(false);
                }
                
                verboseLog(`[*] Successfully Configured the ${otherBridgeFrequency} WDS Bridge!`);
            }


            // Cleanup and logout of the Router Management Interface.
            verboseLog("[*] WDS Bridge Established!");
            return settlePromise(true);
        }
        catch (error) {
            if (error instanceof UnrecoverableError || error instanceof ReconnectionMethod.MainRouterError) {
                return settlePromise(error);
            }
            else if (AbortError.isAbortError(error)) {
                return settlePromise('aborted');
            }
            else {
                console.error("Failed to Re-Establish the WDS Bridge:", error);
            }
        }

        settlePromise(false);

    }
);
/**
 * The {@link ReconnectionMethodSetupFunction Reconnection Method Setup Function}
 * for the `archer-c5-v4/cgi` Reconnection Method responsible for preparing to
 * re-establish the WDS Bridge using the Bridge Router CGI.
 */
const setup: ReconnectionMethod.SetupFunction = (wasDeferred, signal): AbortableAsyncOperation<boolean> => new Promise(
    async (resolve, reject) => {

        if ((await getBusyState())?.isLogined === true) {
            console.error(ROUTER_IN_USE_ERROR_MESSAGE);

            if ( !(await ConfirmationPrompt.prompt()) )
                return reject(new Error(ROUTER_IN_USE_ERROR_MESSAGE));
        }

        const loginCredentials = await getLoginCredentials(true, !wasDeferred, signal);

        if (loginCredentials === null)
            return reject(new RuntimeError("Failed to find a Valid Login Credential Provider or the Specified Login Credentials are invalid."));
        else if (loginCredentials == 'aborted')
            return resolve('aborted');

        return resolve(true);

    }
);

/**
 * The {@link ReconnectionMethod} definition for the
 * `archer-c5-v4/cgi` Reconnection Method.
 */
export const RECONNECTION_METHOD = new ReconnectionMethod(
    'cgi',
    'CGI',
    ReconnectionMethod.MethodType.CGI,
    BRIDGE_ROUTER,
    reconnect,
    setup
);
export default RECONNECTION_METHOD;

// /**
//  * The {@link ReconnectionMethod} definition for the
//  * `archer-c5-v4/cgi` Reconnection Method.
//  */
// export const RECONNECTION_METHOD = new ReconnectionMethod(
//     'cgi',
//     'CGI',
//     ReconnectionMethod.MethodType.CGI,
//     BRIDGE_ROUTER,
//     reconnect,
//     setup
// );
// ReconnectionMethod.registerMethod(RECONNECTION_METHOD);
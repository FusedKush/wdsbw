/**
 * The `archer-c5-v4/puppeteer` Reconnection Method, which utilizes
 * [Puppeteer](https://pptr.dev/) and programatically navigates
 * through the Browser-Based Bridge Router Management Interface
 * to re-establish the WDS Bridge.
 * 
 * @see {@link RECONNECTION_METHOD}
 */
declare module "./puppeteer.js";

import BRIDGE_ROUTER from "./router.js";
import {
    AbortableAsyncOperation,
    AbortableOperation,
    verboseLog,
    ROUTER_IN_USE_ERROR_MESSAGE,
    WDS_BRIDGE_NOT_SETUP_ERROR_MESSAGE,
    UnrecoverableError,
    LogicError,
    AbortError,
    ConfirmationPrompt,
    bindCheckForAbort,
    checkSignalForAbort,
    getProgramVars,
    BASE_PUPPETEER_SCREENSHOTS_PATH,
    ReconnectionMethod
} from "../../api/v1/index.js";
// import {
//     AbortableAsyncOperation,
//     AbortableOperation,
//     verboseLog,
//     ROUTER_IN_USE_ERROR_MESSAGE,
//     WDS_BRIDGE_NOT_SETUP_ERROR_MESSAGE
// } from "../../api/v1/common.js";
// import {
//     UnrecoverableError,
//     LogicError,
//     AbortError,
//     ConfirmationPrompt,
//     bindCheckForAbort,
//     checkSignalForAbort
// } from "../../api/v1/utils.js";
// import { getProgramVars } from "../../api/v1/env.js";
// import { BASE_PUPPETEER_SCREENSHOTS_PATH, ReconnectionMethod } from "../../api/index.js";
import puppeteer, { BoxModel, Browser, Page } from "puppeteer";
import { existsSync, mkdirSync } from "fs";
import { scanForWifiNetwork } from "./common.js";


type PuppeteerInstanceTuple = [Browser, Page];


/**
 * The CSS Selectors used to match one or more elements
 * used to programatically navigate through and interact with
 * the Browser-Based Bridge Router Management Interface.
 */
const ELEMENT_SELECTORS = {
    passwordField: '#pc-login-password',
    passwordButton: '#pc-login-btn',
    topAdvancedTab: '#advanced',
    logoutButton: '#topLogout',
    sideWirelessSettings: 'a.click.more[url="wirelessSettings.htm"]',
    sideAdvancedWirelessSettings: 'a.click[url="wirelessAdv.htm"]',
    wds5gTab: '#wds_mode span.T_modeghz5.second-mode',
    wdsEnableBridgeControlCheckbox: 'label[for="wds_5g"] .icon',
    wdsScanButton: '#survey_5g',
    wdsScanResultsTable: '#tableWlStat',
    wdsScanResultTableRows: '#tableWlStat tr:not(.head)',
    wdsScanResultBackButton: '#back',
    wdsSaveSettingsButton: '#wdsSave_5g',
    loadingContainer: '#g-loading-container',
    loadingMask: '#mask',
    alertContainer: '#alert-container',
    alertConfirmationButton: '#alert-container button.btn-msg-ok'
} as const;

const RECONNECTION_METHOD_NAME = 'puppeteer' as const;
const ROUTER_SCREENSHOT_PATH = `${BASE_PUPPETEER_SCREENSHOTS_PATH}/${BRIDGE_ROUTER.name}/${RECONNECTION_METHOD_NAME}` as const;

/**
 * The Absolute URL used to access the
 * Browser-Based Bridge Router Management Interface.
 */
const getRouterManagementUrl = () => `http://${getProgramVars().bridgeRouter.ip}` as const;


var currentInstance: PuppeteerInstanceTuple | null = null;
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
 * {@link Page.prototype.waitForSelector Wait} for a *Clickable Element* matching the specified `selector`
 * to appear in the designated `page` and then {@link Page.prototype.click click} it.
 * 
 * @param page      The {@link Page} being queried or manipulated.
 * 
 * @param selector  The {@link https://pptr.dev/guides/page-interactions#selectors selector}
 *                  used to match the desired element on the designated `page`
 *                  to be clicked.
 * 
 * @returns         A promise that resolves after the specified element
 *                  has both {@link Page.prototype.waitForSelector appeared on the page}
 *                  and been successfully {@link Page.prototype.click clicked}.
 * 
 * @throws          Rejects if either {@link Page.prototype.waitForSelector `waitForSelector()`}
 *                  or {@link Page.prototype.click `click()`} throw.
 */
const waitAndClick = ( page: Page, selector: string ): Promise<void> => (
    page.waitForSelector(selector, { visible: true, timeout: 10000 })
        .then((selector) => {

            if (!selector)
                throw new Error(`Failed to locate an element on the page matching the selector '${selector}'.`);

            return selector.click();

        })

);
/**
 * {@link Page.prototype.waitForSelector Wait} for a *Clickable Element* matching the specified `selector`
 * to appear in the designated `page`, {@link Page.prototype.click click} it, and
 * {@link Page.prototype.waitForNavigation wait for the page to reload}.
 * 
 * @param page      The {@link Page} being queried or manipulated.
 * 
 * @param selector  The {@link https://pptr.dev/guides/page-interactions#selectors selector}
 *                  used to match the desired element on the designated `page`
 *                  to be clicked.
 * 
 * @returns         A promise that resolves to `true` if the specified element
 *                  has {@link Page.prototype.waitForSelector appeared on the page},
 *                  the element was successfully {@link Page.prototype.click clicked},
 *                  and a {@link Page.prototype.waitForNavigation page reload} has occurred.
 * 
 *                  Resolves to `false` if the specified element could not be clicked
 *                  and/or a page reload did not occur before the timeout period expired.
 * 
 * @throws          Rejects if {@link Page.prototype.waitForSelector `waitForSelector()`},
 *                  {@link Page.prototype.click `click()`}, or
 *                  {@link Page.prototype.waitForNavigation `waitForNavigation()`} throw.
 */
async function clickAndWait ( page: Page, selector: string ): Promise<boolean> {

    let abortController = new AbortController();

    await page.waitForSelector(selector);
    return await Promise.all([
        page.waitForNavigation({ timeout: 5000 }),
        // page.waitForNavigation({ signal: abortController.signal }),
        page.click(selector)
        // page.click(selector).then(async () => {

        //     if ( (await checkForAlerts(page)) === true )
        //         abortController.abort();

        // })
    ]).then( 
        (result) => {

            return (result[0] !== null);

        },
        (reason) => {

            // console.error(reason);
            return false;

        }
    );

}

/**
 * Check if the {@link ELEMENT_SELECTORS.alertContainer Alert Container Element}
 * is currently visible on the designated `page`.
 * 
 * @param page      The {@link Page} being checked.
 * 
 * @returns         A promise that resolves to `true` if the
 *                  {@link ELEMENT_SELECTORS.alertContainer Alert Container Element}
 *                  is currently visible on the designated `page` or `false` if it is not.
 */
async function checkForAlerts ( page: Page ): Promise<boolean> {

    let alertContainer = await page.$(ELEMENT_SELECTORS.alertContainer);

    return ( await (alertContainer?.isVisible()) ) ?? false;

}
/**
 * Take a screenshot of the designated `page` with
 * the specified `name`.
 * 
 * @param page  The {@link Page} being captured.
 * 
 * @param name  The name of the saved screenshot.
 * 
 *              Existing screenshots of the same name will be overwritten.
 * 
 * @returns     A promise that resolves to `true` on success
 *              or `false` on failure.
 */
async function screenshot ( page: Page, name: string ): Promise<boolean> {

    try {
        if ( !name.match(/\.\w+$/) )
            name += '.png';
        if ( !existsSync(ROUTER_SCREENSHOT_PATH) )
            mkdirSync(ROUTER_SCREENSHOT_PATH, { recursive: true });

        await page.screenshot({ path: `${ROUTER_SCREENSHOT_PATH}/${name}` });
        return true;
    }
    catch (error) {
        console.error("Failed to take a Puppeteer Screenshot:", error);
        return false;
    }

}

/**
 * Create a new {@link Browser} instance and
 * associated {@link Page} to query and manipulate.
 * 
 * @example
 * let browser: Browser;
 * let page: Page;
 * 
 * [browser, page] = await createInstance();
 * 
 * @returns     A promise that resolves to a tuple containing a
 *              {@link Browser} instance followed by an associated
 *              {@link Page} handle.
 */
async function createInstance (): Promise<PuppeteerInstanceTuple> {

    if (currentInstance)
        return currentInstance;

    try {
        let browser = await puppeteer.launch({
            slowMo: getProgramVars().reconnectionMethods.actionCooldown.puppeteer
        }).catch((error) => { throw error });
        let page = await browser.newPage();

        currentInstance = [browser, page];
        return currentInstance;
    }
    catch (error) {
        if (currentInstance)
            await closeInstance();

        if (!AbortError.isAbortError(error))
            throw new Error("Failed to create a new Puppeteer Browser Instance!", { cause: error });
        else
            throw error;
    }

}
async function closeInstance (): Promise<void> {

    if (currentInstance) {
        await currentInstance[0].close();
        currentInstance = null;
    }

}

/**
 * Attempt to Login to the Bridge Router Management Interface.
 * 
 * @template SignalT    The type of the `signal` argument.
 * @template ReturnT    The inferred type of the value of the returned promise.
 * 
 * @param page          The {@link Page} being used.
 * @param signal        An optional {@link AbortSignal} used to terminate the operation early.
 * 
 * @returns             A promise that resolves to `true` if we have successfully logged in
 *                      to the Bridge Router Management Interface or `false` if we did not.
 * 
 *                      If we are already {@link loggedIn logged in} to the Router Management Interface,
 *                      the returned promise will immediately resolve to `true`.
 * 
 *                      If the `signal` is specified and is used to {@link AbortController.prototype.abort abort}
 *                      the operation early, the promise will resolve to the value `'aborted'`.
 * 
 * @throws              Rejects with an {@link Error} if the Bridge Router Management Interface
 *                      is already in use and the {@link ConfirmationPrompt Confirmation Prompt}
 *                      to continue anyway was *Rejected*.
 * 
 * @throws              May reject with an error thrown by a *Puppeteer {@link Page} Method*.
 * 
 * @see {@link logoutFromRouter `logoutFromRouter()`}
 * @see {@link testLogin `testLogin()`}
 */
async function loginToRouter <
    SignalT extends AbortSignal | undefined = undefined,
    ReturnT extends AbortableOperation<boolean> = (SignalT extends AbortSignal ? AbortableOperation<boolean> : boolean)
> ( page: Page, signal?: SignalT ): Promise<ReturnT> {

    const processAction = bindCheckForAbort(signal);

    if (loggedIn)
        return true as ReturnT;

    try {
        verboseLog("[+] Logging in to the Management Interface for the Bridge Router...");
        await processAction(page, 'goto', getRouterManagementUrl());
        await processAction(page, 'type', ELEMENT_SELECTORS.passwordField, getProgramVars().bridgeRouter.managementPw);
        
        if ( !(await processAction(clickAndWait, page, ELEMENT_SELECTORS.passwordButton)) ) {
            console.error(ROUTER_IN_USE_ERROR_MESSAGE);
            screenshot(page, 'router-in-use');
            
            if ( (await ConfirmationPrompt.prompt('Continue anyway?')) === true )
                await processAction(clickAndWait, page, ELEMENT_SELECTORS.alertConfirmationButton);
            else
                throw new Error(ROUTER_IN_USE_ERROR_MESSAGE);
        }
    
        loggedIn = true;
        verboseLog("[*] Successfully Logged In to the Management Interface!");
        return true as ReturnT;
    }
    catch (error) {
        if ( !AbortError.isAbortError(error) ) {
            verboseLog("[-] Failed to Log In to the Management Interface!");

            if (typeof page! != 'undefined')
                await screenshot(page, 'login-error');

            throw error;
        }
        else {
            return 'aborted' as ReturnT;
        }
    }

}
/**
 * Attempt to Log Out from the Bridge Router Management Interface.
 * 
 * @template SignalT    The type of the `signal` argument.
 * @template ReturnT    The inferred type of the value of the returned promise.
 * 
 * @param page          The {@link Page} being used.
 * @param signal        An optional {@link AbortSignal} used to terminate the operation early.
 * 
 * @returns             A promise that resolves to `true` if we have successfully logged out
 *                      of the Bridge Router Management Interface or `false` if we did not.
 * 
 *                      If we are not currently {@link loggedIn logged in} to the Router Management Interface,
 *                      the returned promise will immediately resolve to `true`.
 * 
 *                      If the `signal` is specified and is used to {@link AbortController.prototype.abort abort}
 *                      the operation early, the promise will resolve to the value `'aborted'`.
 * 
 * @throws              May reject with an error thrown by a *Puppeteer {@link Page} Method*.
 * 
 * @see {@link loginToRouter `loginToRouter()`}
 */
async function logoutFromRouter <
    SignalT extends AbortSignal | undefined = undefined,
    ReturnT extends AbortableOperation<boolean> = (SignalT extends AbortSignal ? AbortableOperation<boolean> : boolean)
> ( page: Page, signal?: SignalT ): Promise<ReturnT> {

    if (!loggedIn)
        return true as ReturnT;

    try {
        verboseLog("[+] Logging out of the Management Interface for the Bridge Router...");
                
        // For some reason, `page.click()` does not work correctly for the logout button.
        await checkSignalForAbort(
            signal,
            async () => {

                await page.$eval(
                    `a${ELEMENT_SELECTORS.logoutButton}`,
                    (button) => button.click()
                );
                await clickAndWait(page, ELEMENT_SELECTORS.alertConfirmationButton);

            }
        );

        loggedIn = false;
        verboseLog("[*] Successfully Logged Out of the Management Interface!");
        return true as ReturnT;
    }
    catch (error) {
        if (error instanceof UnrecoverableError) {
            throw error;
        }
        else if ( !AbortError.isAbortError(error) ) {
            verboseLog("[-] Failed to Log Out of the Management Interface!");

            if (typeof page! != 'undefined')
                await screenshot(page, 'logout-error');

            throw error;
        }
        else {
            return 'aborted' as ReturnT;
        }
    }

}

/**
 * Test the Validity of the available Bridge Router Management Interface
 * Login Credentials and attempt to login to the Router Management Interface
 * using them.
 * 
 * A new {@link Browser} Instance and {@link Page} will be {@link createInstance created}
 * and used to test the login credentials.
 * 
 * @template SignalT    The type of the `signal` argument.
 * @template ReturnT    The inferred type of the value of the returned promise.
 * 
 * @param logout        Indicates whether or not to automatically {@link logoutFromRouter logout}
 *                      of the Bridge Router Management Interface after successfully testing
 *                      the validity of the login credentials.
 * 
 * @param signal        An optional {@link AbortSignal} used to terminate the operation early.
 * 
 * @returns             A promise that resolves to `true` if the available Bridge Router Management Interface
 *                      Login Credentials are considered to be *Valid*.
 * 
 *                      If the available login credentials are considered to be *Invalid*
 *                      or we were otherwise unable to login to the Bridge Router Management Interface
 *                      using them, the returned promise will resolve to `false`.
 * 
 *                      If the `signal` is specified and is used to {@link AbortController.prototype.abort abort}
 *                      the operation early, the promise will resolve to the value `'aborted'`.
 * 
 * @throws              Rejects with a {@link LogicError} if we are {@link loggedIn already logged in}
 *                      to the Bridge Router Management Interface.
 * 
 * @throws              Rejects with an {@link Error} if the Bridge Router Management Interface
 *                      is already in use and the {@link ConfirmationPrompt Confirmation Prompt}
 *                      to continue anyway was *Rejected*.
 * 
 * @throws              May reject with an error thrown by a *Puppeteer {@link Page} Method*.
 * 
 * @see {@link logoutFromRouter `logoutFromRouter()`}
 * @see {@link testLogin `testLogin()`}
 */
async function testLogin <
    SignalT extends AbortSignal | undefined = undefined,
    ReturnT extends AbortableOperation<boolean> = (SignalT extends AbortSignal ? AbortableOperation<boolean> : boolean)
> ( logout: boolean = true, signal?: SignalT ): Promise<ReturnT> {

    let browser: Browser;
    let page: Page;

    if (loggedIn)
        throw new LogicError("testLogin() cannot be invoked when already logged in to the Router Management Interface.");

    try {
        verboseLog("[+] Verifying Browser Management Interface Login Credentials...");

        return await checkSignalForAbort(
            signal,
            async () => {

                [browser, page] = await createInstance().catch((error) => { throw error });
                const result = await loginToRouter(page, signal);
            
                if (logout)
                    await logoutFromRouter(page);

                if (result === true)
                    verboseLog("[*] Successfully Verified Browser Management Interface Login Credentials!");
                else
                    verboseLog("[-] Failed to Verify Browser Management Interface Login Credentials!");
    
                return result as ReturnT;

            }
        );
    }
    catch (error) {
        if (error instanceof UnrecoverableError) {
            throw error;
        }
        else if ( !AbortError.isAbortError(error) ) {
            verboseLog("[-] Browser Management Interface Login Credential Verification Failed!");

            if (typeof page! != 'undefined')
                await screenshot(page, 'test-login-error');

            throw error;
        }
        else {
            return 'aborted' as ReturnT;
        }
    }
    finally {
        if (logout)
            await closeInstance();
    }

}

/**
 * The {@link ReconnectionMethod.ReconnectionFunction Reconnection Method Function}
 * for the `archer-c5-v4/puppeteer` Reconnection Method responsible for
 * re-establishing the WDS Bridge by programatically navigating through
 * the Browser-Based Bridge Router Management Interface.
 */
const reconnect: ReconnectionMethod.ReconnectionFunction = (signal, actionCooldown): AbortableAsyncOperation<boolean> => {

    let browser: Browser;
    let page: Page;
    let loggedIn: boolean = false;
    let success: boolean = false;

    const processAction = bindCheckForAbort(signal);

    async function cleanup (): Promise<void> {

        try {
            if (typeof browser != 'undefined') {
                if (typeof page != 'undefined') {
                    if (loggedIn) {
                        await logoutFromRouter(page);
                    }
                }
            }
        }
        catch (error) {
            verboseLog("[-] Failed to Log Out of the Management Interface:", error);
        }
        finally {
            await closeInstance();
        }

    }

    return new Promise(async (resolve, reject) => {

        try {
            const programVars = getProgramVars();
            [browser, page] = await createInstance().catch((error) => { throw error; });

            if (!loggedIn) {
                loggedIn = ((await loginToRouter(page, signal)) === true);
        
                if (!loggedIn)
                    throw new Error("Failed to Login to the Router Management Interface!");
            }

            verboseLog("[+] Navigating to the WDS Settings Page...");

            await processAction(
                () => waitAndClick(page, ELEMENT_SELECTORS.topAdvancedTab)
                    .then(() => waitAndClick(page, ELEMENT_SELECTORS.sideWirelessSettings))
                    .then(() => waitAndClick(page, ELEMENT_SELECTORS.sideAdvancedWirelessSettings))
                    .then(() => waitAndClick(page, ELEMENT_SELECTORS.wds5gTab))
                    .catch((error) => {

                        throw error;

                    })
            );

            await processAction(
                page, '$eval',
                ELEMENT_SELECTORS.wdsEnableBridgeControlCheckbox,
                ( element: HTMLElement ) => {

                    if ( !element.classList.contains('checkbox-click') ) {
                        if (!programVars.mainRouter.wifiPw)
                            throw new UnrecoverableError(WDS_BRIDGE_NOT_SETUP_ERROR_MESSAGE);
                    }

                }
            );
    
            verboseLog("[+] Scanning for Available Wi-Fi Networks...");
            // await processAction(waitAndClick, page, ELEMENT_SELECTORS.wdsScanButton);
            // await processAction(page, 'waitForSelector', ELEMENT_SELECTORS.wdsScanResultsTable);
            // let scanResults = await processAction(page, '$$', ELEMENT_SELECTORS.wdsScanResultTableRows);
            // let mainRouterResultIndex: number = -1;
    
            // verboseLog("[+] Evaluating WDS Scan Results...");
    
            // for (let i = 0; i < scanResults.length; i++) {
            //     mainRouterResultIndex = await processAction(
            //         scanResults[i], '$eval',
            //         'td:nth-child(3)',
            //         async ( element: HTMLTableCellElement, index: number, mainRouterSsid: string ) => (
            //             (element.innerText == mainRouterSsid)
            //                 ? index
            //                 : -1
            //         ),
            //         i, programVars.mainRouter.ssid
            //     ) as number;
    
            //     if (mainRouterResultIndex > -1)
            //         break;
            // }
    
            // if (mainRouterResultIndex < 0)
            //     throw new Error("The Main Router was not found in the WDS Scan Results!");
    
            const scanResultElement = await scanForWifiNetwork(
                async () => {

                    let result: puppeteer.ElementHandle<Element> | null = null;

                    await waitAndClick(page, ELEMENT_SELECTORS.wdsScanButton)
                        .then(() => page.waitForSelector(ELEMENT_SELECTORS.wdsScanResultsTable))
                        .catch((error) => { throw error; });
                    // await processAction(
                    //     () => waitAndClick(page, ELEMENT_SELECTORS.wdsScanButton)
                    //         .then(() => page.waitForSelector(ELEMENT_SELECTORS.wdsScanResultsTable))
                    //         // .catch((error) => { throw error; })
                    // ).catch((error) => { throw error; });
                    // await processAction(waitAndClick, page, ELEMENT_SELECTORS.wdsScanButton)
                    //     .catch((error) => { throw error; });
                    // await processAction(page, 'waitForSelector', ELEMENT_SELECTORS.wdsScanResultsTable);
                    let scanResults = await processAction(page, '$$', ELEMENT_SELECTORS.wdsScanResultTableRows);
            
                    // verboseLog("[+] Evaluating WDS Scan Results...");
            
                    for (let i = 0; i < scanResults.length; i++) {
                        result = await processAction(
                            scanResults[i], '$eval',
                            'td:nth-child(3)',
                            async ( element: HTMLTableCellElement, mainRouterSsid: string ) => (
                                (element.innerText == mainRouterSsid)
                                    ? element
                                    : null
                            ),
                            scanResults[i], programVars.mainRouter.ssid
                        ) as puppeteer.ElementHandle<Element> | null;
            
                        if (result)
                            return result;
                    }
                    
                    if (!result)
                        waitAndClick(page, ELEMENT_SELECTORS.wdsScanResultBackButton);

                },
                RECONNECTION_METHOD
            ).catch((error) => { throw error });

            // verboseLog("[*] Main Router Found!");
            await processAction(scanResultElement, '$', 'td:last-child span').then(
                (element) => element!.click()
            );
    
            verboseLog("[+] Re-Establishing the WDS Bridge...");
            await waitAndClick(page, ELEMENT_SELECTORS.wdsSaveSettingsButton).catch(
                (error) => { throw error; }
            );
    
            if (await checkForAlerts(page))
                await page.click(ELEMENT_SELECTORS.alertConfirmationButton);
    
            await page.waitForResponse(`${getRouterManagementUrl()}/cgi?2`);
            success = true;
            verboseLog("[*] WDS Bridge Established!");
            await screenshot(page, 'success');
        }
        catch (error) {
            if (typeof page != 'undefined')
                await screenshot(page, 'reconnect-error');

            await cleanup();

            if (error instanceof UnrecoverableError || error instanceof ReconnectionMethod.MainRouterError) {
                return reject(error);
            }
            else if (AbortError.isAbortError(error)) {
                return resolve('aborted');
            }
            else {
                console.error("Failed to Reconnect the WDS Bridge:", error);
                return resolve(success);
            }
        }

    });


}
/**
 * The {@link ReconnectionMethod.SetupFunction Reconnection Method Setup Function}
 * for the `archer-c5-v4/puppeteer` Reconnection Method responsible for preparing to
 * re-establish the WDS Bridge by programatically navigating through
 * the Browser-Based Bridge Router Management Interface.
 */
const setup: ReconnectionMethod.SetupFunction = (wasDeferred, signal): AbortableAsyncOperation<boolean> => new Promise(
    async (resolve, reject) => {

        const loginResult = await testLogin(!wasDeferred, signal).catch((error) => reject(new Error(
            `The Specified Login Credentials are invalid: ${(error as Error).message}`,
            { cause: error }
        )));

        if (typeof loginResult == 'boolean') {
            if (loginResult === false)
                return reject(new Error("The Specified Login Credentials are invalid."));
    
            return resolve(loginResult);
        }

    }
);

/**
 * The {@link ReconnectionMethod} definition for the
 * `archer-c5-v4/puppeteer` Reconnection Method responsible for
 * re-establishing the WDS Bridge by programatically navigating through
 * the Browser-Based Router Management Interface.
 */
export const RECONNECTION_METHOD = new ReconnectionMethod(
    RECONNECTION_METHOD_NAME,
    'Puppeteer',
    ReconnectionMethod.MethodType.PUPPETEER,
    BRIDGE_ROUTER,
    reconnect,
    setup
);
export default RECONNECTION_METHOD;

// /**
//  * The {@link ReconnectionMethod} definition for the
//  * `archer-c5-v4/puppeteer` Reconnection Method responsible for
//  * re-establishing the WDS Bridge by programatically navigating through
//  * the Browser-Based Router Management Interface.
//  */
// export const RECONNECTION_METHOD = new ReconnectionMethod(
//     RECONNECTION_METHOD_NAME,
//     'Puppeteer',
//     ReconnectionMethod.MethodType.PUPPETEER,
//     BRIDGE_ROUTER,
//     reconnect,
//     setup
// );
// ReconnectionMethod.registerMethod(RECONNECTION_METHOD);
# `Archer C5 v4` CGI Reference
```http
POST /cgi?1 HTTP/1.1
Host: 192.168.0.2
Content-Type: text/plain
Content-Length: 77
Origin: http://192.168.0.2
Referer: http://192.168.0.2/
Cookie: JSESSIONID=f4acvdea1f5b319d143132eceoda68
TokenID: 26e1csdf030b0e7b5c8ab63e23f9f9

[IGD_DEV_INFO#0,0,0,0,0,0#0,0,0,0,0,0]0,2
hardwareVersion
softwareVersion

```
```http
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8

[0,0,0,0,0,0]0
hardwareVersion=Archer C5 v4 00000004
softwareVersion=3.16.0 0.9.1 v6013.0 Build 180118 Rel.28184n
[error]0
```

This document serves as a reference of the CGI Endpoints used by the Bridge Router (Archer C5 AC1200) that are relevant to the WDS Bridge Watchdog Service. Specifically, the watchdog service is dependent on the following functionality:
- [Logging In to the Management Interface](#logging-in-to-the-router-management-interface)
- [Retrieving the Current Bridge Router Wi-Fi Network Settings](#retrieving-the-current-wds-bridge-settings) and [WDS Bridge Configuration Settings](#retrieving-the-current-wds-bridge-settings).
- [Retrieving the Main Router Wi-Fi Network Properties](#retrieving-the-main-router-wi-fi-network-properties)
- [Changing the Bridge Router Wi-Fi Network Settings](#changing-the-bridge-router-wi-fi-network-settings) and [WDS Bridge Configuration Settings](#changing-the-wds-bridge-configuration-settings)
- [Logging Out of the Management Interface](#logging-out-of-the-router-management-interface)

As there is no official documentation regarding these endpoints, this reference was compiled by reverse-engineering how the Browser-Based Router Management Interface interacts with the CGI.


### Table of Contents
1. [Bridge Router CGI Reference](#bridge-router-cgi-reference)
   1. [Table of Contents](#table-of-contents)
   2. [Conventions](#conventions)
2. [Getting Started](#getting-started)
   1. [Requests to the CGI](#requests-to-the-cgi)
      1. [Authentication](#authentication)
   2. [Responses from the CGI](#responses-from-the-cgi)
   3. [Successful and Failed Requests](#successful-and-failed-requests)
      1. [Known Error Codes](#known-error-codes)
   4. [`busy` State](#busy-state)
      1. [Querying the `busy` State](#querying-the-busy-state)
      2. [Clearing the `busy` State](#clearing-the-busy-state)
3. [Logging In to the Router Management Interface](#logging-in-to-the-router-management-interface)
   1. [Using the `/cgi/getBusy` Endpoint](#using-the-cgigetbusy-endpoint)
   2. [Using the `/cgi/login` Endpoint](#using-the-cgilogin-endpoint)
      1. [Using the `/cgi/getParm` Endpoint](#using-the-cgigetparm-endpoint)
   3. [Submitting a Request to `/`](#submitting-a-request-to-)
5. [Retrieving the Current WDS Bridge Settings](#retrieving-the-current-wds-bridge-settings)
   1. [Minimum Request](#minimum-request)
6. [Retrieving the Main Router Wi-Fi Network Properties](#retrieving-the-main-router-wi-fi-network-properties)
   1. [Initiating the Wi-Fi Network Scan](#initiating-the-wi-fi-network-scan)
   2. [Retrieving the Wi-Fi Network Scan Results](#retrieving-the-wi-fi-network-scan-results)
7. [Retrieving the Bridge Router Wi-Fi Network Properties](#retrieving-the-bridge-router-wi-fi-network-properties)
8. [Changing the Bridge Router Wi-Fi Network Settings](#changing-the-bridge-router-wi-fi-network-settings)
9. [Changing the WDS Bridge Configuration Settings](#changing-the-wds-bridge-configuration-settings)
10. [Logging Out of the Router Management Interface](#logging-out-of-the-router-management-interface)


### Conventions
This document makes use of the following conventions:

- ```
  ${VARIABLE}
  ```
  When embedded within a larger string of characters, `${VARIABLE}` represents a *variable value* that is to be replaced with the corresponding value.
  
  For example, in the string `'http://${BRIDGE_ROUTER_IP_ADDRESS}'`, `${BRIDGE_ROUTER_IP_ADDRESS}` would be replaced with the IP Address of the Bridging Router, such as `192.168.0.2`, producing the string `'http://192.168.0.2'`;
    
- ```
  <CRLF>
  ```
  Denotes a *Carriage Return* (`\r`) Character immediately followed by a *Line Feed* or *Newline* (`\n`) Character.
  
  CRLF Sequences are primarily used to designate the end of the [body attached to a request](#requests-to-the-cgi). 
  

## Getting Started
The CGI for the Bridge Router is exposed at the following URL:
```http
http://${BRIDGE_ROUTER_IP_ADDRESS}/cgi
```


### Requests to the CGI
Requests to the CGI are made using standard HTTP `POST` requests.

> [!IMPORTANT]
> Requests to the CGI should, at a minimum, always contain the following headers:
> - `Content-Type`: `text/plain`
> - `Content-Length`
> - `Host`: `${ROUTER_IP_ADDRESS}`
> - `Origin`: `http://${ROUTER_IP_ADDRESS}`
> - `Referer`: `http://${ROUTER_IP_ADDRESS}/`

There are two types of requests that are made to the CGI:
1. Requests to distinct endpoints (such as `/cgi/login`).
   - For these requests, any request parameters are submitted as part of the *Query String*.
   - These requests do *not* seem to require [authentication](#authentication).
2. Requests to the CGI itself with one or more numbers added to the Query String (e.g., `/cgi?1` or `/cgi?1&5&5&5&5&5&5`).
   - For these requests, any request parameters are submitted as part of the *Request Body*.
   - These requests require [authentication](#authentication).

> [!IMPORTANT]
> When making requests to the CGI itself, note that the *order* of the Query String Parameters **is** important. E.g., `/cgi?1&6` is **not** necessarily the same as `/cgi?6&1`.

> [!IMPORTANT]
> When making requests to the CGI with a *Request Body*, the body **must** be terminated by a CRLF (`\r\n`) Sequence
> to be properly processed by the router.
> 
> If you fail to do so, the router will return a response with a response body containing the following:
> ```http
> [error]71111
> ```


#### Authentication
Most requests to the CGI require *authentication*, which comes in two forms, both of which are provided after successfully [logging in to the Router Management Interface](#logging-in-to-the-router-management-interface):
- A `JSESSIONID` cookie, which is sent in the response from the `/cgi/login` endpoint.
- A `TokenID` request header, which is injected as a JavaScript variable into the page HTML during the page reload that takes place during the login flow.


### Responses from the CGI
Responses from the CGI Interface always have a `Content-Type` that *starts with* `text/plain` or `application/javascript`.

Any response data is provided directly in the body of the response.
- Key-Value Pairs are returned in the format `key=value`. When the `Content-Type` is `application/javascript`, the Key-Value Pairs will be returned using JavaScript Variable Assignment Syntax (`var key=value;`).
- All Key-Value Pairs and other distinct data returned in the response is separated by newlines.
- Some CGI Endpoints return Key-Value Pairs that are logically grouped together. Such groups are denoted by lines of the format `[${IDENTIFIER}]0` and closed by either the next group identifier or the line `[error]0`, which designates the end of the response body.

> [!IMPORTANT]
> Many requests to the CGI will return a `200 OK` HTTP Status even when the request fails.
>
> However, because it is still possible to encounter `400 Bad Request` or `500 Internal Server Error` responses, it is important to check *both* the response body and the HTTP Status for errors, rather than exclusively relying on one or the other.


### Successful and Failed Requests
When a request was successful, *most* responses from the CGI will have a `200 OK` HTTP Status and contain a request body ending with or exclusively containing one of the following:
- `Content-Type: text/plain`:
  ```
  [error]0
  ```
- `Content-Type: text/plain`:
  ```
  [cgi]0
  [error]0
  ```
- `Content-Type: application/javascript`:
  ```
  $.ret=0;
  ```
  
However, when a request *fails*, one or both of the following things may happen:
1. The endpoint returns a `500 Internal Server Error` HTTP Status.
2. The response body either ends with or exclusively contains an *Error Code* of the following format:
   ```
   [cgi]${CGI_ERROR_CODE}
   [error]${ERROR_CODE}
   ```
   where `${CGI_ERROR_CODE}` and `${ERROR_CODE}` are both integer error codes.

   A collection of known error codes is [detailed below](#known-error-codes).

In addition, many requests to the 


#### Known Error Codes
The following error codes have been observed to be returned as *General Error Codes* of the format `[error]${ERROR_CODE}`. They may or may not *also* apply to *CGI-Specific Error Codes* of the format `[cgi]${CGI_ERROR_CODE}`.

- `0`: **Success / No Error**
- `9003`: Invalid query parameters and/or request body.
- `71111`: One of the following:
  - The `Content-Length` is incorrect.
  - One or more *Line-Feed* or *Newline* (`\n`) Characters were used in the request body without being preceeded by a *Carriage-Return* (`\r`) Character.
  - A non-empty request body was not [terminated by a `<CRLF>` Sequence](#requests-to-the-cgi).
- `71014`: The query parameters do not match the request body. For example, making a request to `cgi?2&2&2` with less or more than 3 sections of parameters in the request body.


### `busy` State
Internally, the router maintains a `busy` state, which is most likely used to group together related requests to the CGI and ensure that the router does not attempt to process additional commands and requests until the `busy` state has been explicitly cleared.

The `busy` state appears to be set automatically when sending requests to most CGI Endpoints, after which it must be cleared using a [separate request to the CGI](#clearing-the-busy-state).


#### Querying the `busy` State
The `busy` state can be queried by sending a request to the `/cgi/getBusy` endpoint, which returns a response similar to the following:
```http
var isLogined=0;
var isBusy=0;
$.ret=0;
```
where `isBusy` indicates the current `busy` state of the router.
- `0` indicates that the router is not currently `busy` and is available to process requests.
- `1` indicates that the router is currently `busy` and is unavailable to process requests.


#### Clearing the `busy` State
Once all of the relevant requests have been sent to the CGI or prior to starting a new request, the `busy` state is cleared by sending a request to the `/cgi?8` endpoint with the following request body:
```http
[/cgi/clearBusy#0,0,0,0,0,0#0,0,0,0,0,0]0,0<CRLF>
```

If the `busy` state was successfully cleared, a [Generic Successful CGI Response Body](#successful-and-failed-requests) will be returned:
```http
[cgi]0
[error]0
```


## Logging In to the Router Management Interface
Before any useful requests can be made to the CGI Interface, we must first login to the Router Management Interface. This is a four-step process:
1. [Retrieve the components of the RSA Public Key](#using-the-cgigetparm-endpoint) using the `/cgi/getParam` endpoint.
2. [Ensure no user is currently logged in to the Router Management Interface](#using-the-cgigetbusy-endpoint) using the `/cgi/getBusy` endpoint.
3. [Submit a request to the `/cgi/login` endpoint with the appropriate credentials](#using-the-cgilogin-endpoint) to get the necessary `JSESSION` cookie from the router.
4. [Submit a request to the Router Management Interface Page (`/`)](#submitting-a-request-to-) to retrieve the value of the `TokenID` header that must be appended to requests to the CGI.

> [!IMPORTANT]
> If another user is already logged in the Router Management Interface, sending a valid request to the `/cgi/login` endpoint will automatically sign out the other user.
>
> As a result, it is *strongly recommended* to first [use the `/cgi/getBusy` endpoint](#using-the-cgigetbusy-endpoint) to check if another user is already logged into the Router Management Interface and either prompt for confirmation before [proceeding with the login](#using-the-cgilogin-endpoint) or abandoning the login attempt altogether.


### Using the `/cgi/getBusy` Endpoint
Submit a request to the `/cgi/getBusy` endpoint with no additional Request Headers or Parameters. The endpoint will return a response similar to the following:
```http
var isLogined=0;
var isBusy=0;
$.ret=0;
```

Check the value of `isLogined`:
- If the value of `isLogined` is `0`, we can continue with the login process.
- If the value of `isLogined` is `1`, we should prompt for confirmation before proceeding or abandon the login process until the value changes to `0`.


### Using the `/cgi/login` Endpoint
We can then proceed with attempting to login to the Router Management Interface. To do so, submit a request to the `/cgi/login` endpoint with the following *Query Parameters*:
- `UserName`: The [Encrypted](#encrypting-the-login-credentials) Login Username.
- `Passwd`: The Base64-Encoded & [Encrypted](#encrypting-the-login-credentials) Login Password.
- `Action`: Set to `1`.
- `LoginStatus`: Set to `0`.

If the login request was *successful*, the response will contain a `Set-Cookie: JSESSIONID=...` header and a [Generic Successful JavaScript Response Body](#successful-and-failed-requests) will be returned:
```http
$.ret=0;
```


#### Encrypting the Login Credentials
Depending on the value of the `INCLUDE_SSL` constant, which is defined in the `/js/oid-str.js` script, the Login Username and Password may or may not need to be encrypted using RSA Public Key Encryption before they are sent to the CGI.

During the login process, encryption is handled by the router using the `/js/encrypt.js` script, which exposes several functions utilizing the [jsbn Library](http://www-cs-students.stanford.edu/~tjw/jsbn/). Once the *modulus* and *exponent* making up the Public Key are retrieved from the CGI [using the `/cgi/getParm` endpoint](#using-the-cgigetparm-endpoint), they are passed along with the `UserName` and `Passwd` to the exposed `$.rsa.encrypt()` function to be encrypted.

As a result, there are three ways to handle the encryption of login credentials:
1. Retrieve the components of the Public Key [using the `/cgi/getParm` endpoint](#using-the-cgigetparm-endpoint) and manually encrypting the credentials.
2. Using [Puppeteer](https://pptr.dev/) and encrypting the credentials using the `$.rsa.encrypt()` function exposed on the Router Management Interface Page (`/`).
3. Using hard-coded encrypted credentials set via Environment Variables.


##### Using the `/cgi/getParm` Endpoint
The `/cgi/getParm` Endpoint can be used to retrieve the components of the Public Key if you wish to manually encrypt the login credentials. The endpoint will return a response containing the following contents:
```
var userSetting=1;
var ee="${EXPONENT}";
var nn="${MODULUS}";
$.ret=0;
```
Most importantly, `${EXPONENT}` and `${MODULUS}` contain their respective components of the RSA Public Key used for encryption.


### Submitting a Request to `/`
Once you have logged in to the Router Management Interface, submit a request to `/`. The following line will be injected into the response HTML:
```html
<script type="text/javascript">var token="${TOKEN}";</script>
```
Extract the `${TOKEN}`, which will have to be appended to all authenticated requests via the `TokenID` header.


## Retrieving the Current WDS Bridge Settings
Before attempting to re-establish the WDS Bridge, we need to check if the WDS Bridge has already been setup. To do so, we need to retrieve the Current WDS Bridge Configuration from the proper CGI Endpoint.

The full request is made to the following CGI Endpoint:
```
/cgi?1&1&6&1&1&1&6&1
```

...with the following request body:
```http
[LAN_WLAN_WDSBRIDGE#1,1,0,0,0,0#0,0,0,0,0,0]0,8
BridgeEnable
BridgeAddrMode
BridgeBSSID
BridgeSSID
BridgeAuthMode
BridgeEncryptMode
BridgeKey
BridgeWepKeyIndex
[LAN_WLAN_WPS#1,1,0,0,0,0#0,0,0,0,0,0]1,1
Enable
[LAN_WLAN_MSSIDENTRY#0,0,0,0,0,0#1,1,0,0,0,0]2,18
Name
Enable
SSID
SSIDAdvertisementEnable
isolateClients
BeaconType
BasicAuthenticationMode
WEPKeyIndex
BasicEncryptionModes
WPAEncryptionModes
WPAAuthenticationMode
IEEE11iEncryptionModes
IEEE11iAuthenticationMode
PreSharedKey
GroupKeyUpdateInterval
RadiusServerIP
RadiusServerPort
RadiusServerPassword
[LAN_WLAN_GUESTNET#1,1,0,0,0,0#0,0,0,0,0,0]3,2
Enable
Name
[LAN_WLAN_WDSBRIDGE#1,2,0,0,0,0#0,0,0,0,0,0]4,8
BridgeEnable
BridgeAddrMode
BridgeBSSID
BridgeSSID
BridgeAuthMode
BridgeEncryptMode
BridgeKey
BridgeWepKeyIndex
[LAN_WLAN_WPS#1,2,0,0,0,0#0,0,0,0,0,0]5,1
Enable
[LAN_WLAN_MSSIDENTRY#0,0,0,0,0,0#1,2,0,0,0,0]6,18
Name
Enable
SSID
SSIDAdvertisementEnable
isolateClients
BeaconType
BasicAuthenticationMode
WEPKeyIndex
BasicEncryptionModes
WPAEncryptionModes
WPAAuthenticationMode
IEEE11iEncryptionModes
IEEE11iAuthenticationMode
PreSharedKey
GroupKeyUpdateInterval
RadiusServerIP
RadiusServerPort
RadiusServerPassword
[LAN_WLAN_GUESTNET#1,2,0,0,0,0#0,0,0,0,0,0]7,2
Enable
Name<CRLF>
```

On success, the CGI Endpoint will return a response similar to the following:
```http
[1,1,0,0,0,0]0
bridgeEnable=0
bridgeAddrMode=
bridgeBSSID=${MAIN_ROUTER_2.4GHZ_WIFI_MAC_ADDRESS}
bridgeSSID=${MAIN_ROUTER_2.4GHZ_WIFI_NAME}
bridgeAuthMode=PSK2Authentication
bridgeEncryptMode=AESEncryption
bridgeKey=${MAIN_ROUTER_2.4GHZ_WIFI_PASSWORD}
bridgeWepKeyIndex=1
[1,1,0,0,0,0]1
enable=0
[1,1,1,0,0,0]2
name=wlan1
enable=0
SSID=${BRIDGE_ROUTER_2.4GHZ_GUEST_WIFI_NAME}
SSIDAdvertisementEnable=1
isolateClients=0
beaconType=Basic
basicAuthenticationMode=None
WEPKeyIndex=1
basicEncryptionModes=None
WPAEncryptionModes=TKIPandAESEncryption
WPAAuthenticationMode=PSKAuthentication
IEEE11iEncryptionModes=TKIPandAESEncryption
IEEE11iAuthenticationMode=PSKAuthentication
preSharedKey=
groupKeyUpdateInterval=0
radiusServerIP=
radiusServerPort=1812
radiusServerPassword=
[1,1,2,0,0,0]2
name=wlan2
enable=0
SSID=${BRIDGE_ROUTER_2.4GHZ_SSID1_WIFI_NAME}
SSIDAdvertisementEnable=0
isolateClients=0
beaconType=11i
basicAuthenticationMode=None
WEPKeyIndex=1
basicEncryptionModes=None
WPAEncryptionModes=TKIPandAESEncryption
WPAAuthenticationMode=PSKAuthentication
IEEE11iEncryptionModes=AESEncryption
IEEE11iAuthenticationMode=PSKAuthentication
preSharedKey=${BRIDGE_ROUTER_2.4GHZ_SSID1_WIFI_PASSWORD}
groupKeyUpdateInterval=0
radiusServerIP=
radiusServerPort=1812
radiusServerPassword=
[1,1,3,0,0,0]2
name=wlan3
enable=0
SSID=${BRIDGE_ROUTER_2.4GHZ_SSID2_WIFI_NAME}
SSIDAdvertisementEnable=0
isolateClients=0
beaconType=11i
basicAuthenticationMode=None
WEPKeyIndex=1
basicEncryptionModes=None
WPAEncryptionModes=TKIPandAESEncryption
WPAAuthenticationMode=PSKAuthentication
IEEE11iEncryptionModes=AESEncryption
IEEE11iAuthenticationMode=PSKAuthentication
preSharedKey=${BRIDGE_ROUTER_2.4GHZ_SSID2_WIFI_PASSWORD}
groupKeyUpdateInterval=0
radiusServerIP=
radiusServerPort=1812
radiusServerPassword=
[1,1,4,0,0,0]2
name=wlan4
enable=0
SSID=${BRIDGE_ROUTER_2.4GHZ_SSID3_WIFI_NAME}
SSIDAdvertisementEnable=0
isolateClients=0
beaconType=11i
basicAuthenticationMode=None
WEPKeyIndex=1
basicEncryptionModes=None
WPAEncryptionModes=TKIPandAESEncryption
WPAAuthenticationMode=PSKAuthentication
IEEE11iEncryptionModes=AESEncryption
IEEE11iAuthenticationMode=PSKAuthentication
preSharedKey=${BRIDGE_ROUTER_2.4GHZ_SSID3_WIFI_PASSWORD}
groupKeyUpdateInterval=0
radiusServerIP=
radiusServerPort=1812
radiusServerPassword=
[1,1,0,0,0,0]3
enable=0
name=wlan1
[1,2,0,0,0,0]4
bridgeEnable=1
bridgeAddrMode=
bridgeBSSID=${MAIN_ROUTER_5GHZ_WIFI_MAC_ADDRESS}
bridgeSSID=${MAIN_ROUTER_5GHZ_WIFI_NAME}
bridgeAuthMode=PSK2Authentication
bridgeEncryptMode=AESEncryption
bridgeKey=${MAIN_ROUTER_5GHZ_WIFI_PASSWORD}
bridgeWepKeyIndex=1
[1,2,0,0,0,0]5
enable=0
[1,2,1,0,0,0]6
name=wlan6
enable=0
SSID=${BRIDGE_ROUTER_5GHZ_GUEST_WIFI_NAME}
SSIDAdvertisementEnable=1
isolateClients=0
beaconType=Basic
basicAuthenticationMode=None
WEPKeyIndex=1
basicEncryptionModes=None
WPAEncryptionModes=TKIPandAESEncryption
WPAAuthenticationMode=PSKAuthentication
IEEE11iEncryptionModes=TKIPandAESEncryption
IEEE11iAuthenticationMode=PSKAuthentication
preSharedKey=
groupKeyUpdateInterval=0
radiusServerIP=
radiusServerPort=0
radiusServerPassword=
[1,2,2,0,0,0]6
name=wlan7
enable=0
SSID=${BRIDGE_ROUTER_5GHZ_SSID1_WIFI_NAME}
SSIDAdvertisementEnable=0
isolateClients=0
beaconType=11i
basicAuthenticationMode=None
WEPKeyIndex=1
basicEncryptionModes=None
WPAEncryptionModes=TKIPandAESEncryption
WPAAuthenticationMode=PSKAuthentication
IEEE11iEncryptionModes=AESEncryption
IEEE11iAuthenticationMode=PSKAuthentication
preSharedKey=${BRIDGE_ROUTER_5GHZ_SSID1_WIFI_PASSWORD}
groupKeyUpdateInterval=0
radiusServerIP=
radiusServerPort=0
radiusServerPassword=
[1,2,3,0,0,0]6
name=wlan8
enable=0
SSID=${BRIDGE_ROUTER_5GHZ_SSID2_WIFI_NAME}
SSIDAdvertisementEnable=0
isolateClients=0
beaconType=11i
basicAuthenticationMode=None
WEPKeyIndex=1
basicEncryptionModes=None
WPAEncryptionModes=TKIPandAESEncryption
WPAAuthenticationMode=PSKAuthentication
IEEE11iEncryptionModes=AESEncryption
IEEE11iAuthenticationMode=PSKAuthentication
preSharedKey=${BRIDGE_ROUTER_5GHZ_SSID2_WIFI_PASSWORD}
groupKeyUpdateInterval=0
radiusServerIP=
radiusServerPort=0
radiusServerPassword=
[1,2,4,0,0,0]6
name=wlan9
enable=0
SSID=${BRIDGE_ROUTER_5GHZ_SSID3_WIFI_NAME}
SSIDAdvertisementEnable=0
isolateClients=0
beaconType=11i
basicAuthenticationMode=None
WEPKeyIndex=1
basicEncryptionModes=None
WPAEncryptionModes=TKIPandAESEncryption
WPAAuthenticationMode=PSKAuthentication
IEEE11iEncryptionModes=AESEncryption
IEEE11iAuthenticationMode=PSKAuthentication
preSharedKey=${BRIDGE_ROUTER_5GHZ_SSID3_WIFI_NAME}
groupKeyUpdateInterval=0
radiusServerIP=
radiusServerPort=0
radiusServerPassword=
[1,2,0,0,0,0]7
enable=0
name=wlan6
[error]0
```

However, we only really care about the following lines of the response:
```http
[1,1,0,0,0,0]0
bridgeEnable=0
bridgeAddrMode=
bridgeBSSID=${MAIN_ROUTER_2.4GHZ_WIFI_MAC_ADDRESS}
bridgeSSID=${MAIN_ROUTER_2.4GHZ_WIFI_NAME}
bridgeAuthMode=PSK2Authentication
bridgeEncryptMode=AESEncryption
bridgeKey=${MAIN_ROUTER_2.4GHZ_WIFI_PASSWORD}
bridgeWepKeyIndex=1
[1,2,0,0,0,0]4
bridgeEnable=1
bridgeAddrMode=
bridgeBSSID=${MAIN_ROUTER_5GHZ_WIFI_MAC_ADDRESS}
bridgeSSID=${MAIN_ROUTER_5GHZ_WIFI_NAME}
bridgeAuthMode=PSK2Authentication
bridgeEncryptMode=AESEncryption
bridgeKey=${MAIN_ROUTER_5GHZ_WIFI_PASSWORD}
bridgeWepKeyIndex=1
```
where `[1,1,0,0,0,0]0` denotes the `2.4GHz` WDS Bridge Configuration and `[1,2,0,0,0,0]4` denotes the `5GHz` Bridge Configuration. All of the returned Key-Value Pairs should be stored for use later when [updating the WDS Bridge Configuration](#changing-the-wds-bridge-settings).

> [!WARNING]
> Only rely on there being valid configuration settings for the Wi-Fi Channel that is currently being used for the WDS Bridge and **always** assume that the other channel has incorrect or out-of-date configuration settings.


### Minimum Request
It is possible to reduce the full request described above to one made instead to the following CGI Endpoint:
```
/cgi?1&1`
```

...with the following truncated request body:
```http
[LAN_WLAN_WDSBRIDGE#1,1,0,0,0,0#0,0,0,0,0,0]0,8
BridgeEnable
BridgeAddrMode
BridgeBSSID
BridgeSSID
BridgeAuthMode
BridgeEncryptMode
BridgeKey
BridgeWepKeyIndex
[LAN_WLAN_WDSBRIDGE#1,2,0,0,0,0#0,0,0,0,0,0]2,8
BridgeEnable
BridgeAddrMode
BridgeBSSID
BridgeSSID
BridgeAuthMode
BridgeEncryptMode
BridgeKey
BridgeWepKeyIndex<CRLF>
```

> [!TIP]
> Note that while the 5GHz WDS Bridge is denoted by `[LAN_WLAN_WDSBRIDGE#1,2,0,0,0,0#0,0,0,0,0,0]4,8` in the *Full Request*, it is instead denoted by `[LAN_WLAN_WDSBRIDGE#1,2,0,0,0,0#0,0,0,0,0,0]2,8` in the *Minimum Request*.

On success, the router will return a response similar to the following:
```http
[1,1,0,0,0,0]0
bridgeEnable=0
bridgeAddrMode=
bridgeBSSID=${MAIN_ROUTER_2.4GHZ_WIFI_MAC_ADDRESS}
bridgeSSID=${MAIN_ROUTER_2.4GHZ_WIFI_NAME}
bridgeAuthMode=PSK2Authentication
bridgeEncryptMode=AESEncryption
bridgeKey=${MAIN_ROUTER_2.4GHZ_WIFI_PASSWORD}
bridgeWepKeyIndex=1
[1,2,0,0,0,0]1
bridgeEnable=1
bridgeAddrMode=
bridgeBSSID=${MAIN_ROUTER_5GHZ_WIFI_MAC_ADDRESS}
bridgeSSID=${MAIN_ROUTER_5GHZ_WIFI_NAME}
bridgeAuthMode=PSK2Authentication
bridgeEncryptMode=AESEncryption
bridgeKey=${MAIN_ROUTER_5GHZ_WIFI_PASSWORD}
bridgeWepKeyIndex=1
[error]0
```
where `[1,1,0,0,0,0]0` denotes the `2.4GHz` WDS Bridge Configuration and `[1,2,0,0,0,0]1` denotes the `5GHz` Bridge Configuration. All of the returned Key-Value Pairs should be stored for use later when [updating the WDS Bridge Configuration](#changing-the-wds-bridge-settings).

> [!TIP]
> Note that while the 5GHz WDS Bridge is denoted by `[1,2,0,0,0,0]4` in the *Full Response*, it is instead denoted by `[1,2,0,0,0,0]1` in the *Minimum Response*.


## Retrieving the Main Router Wi-Fi Network Properties
In order to retrieve the Current Main Router Wi-Fi Network Properties, we have to perform a three-step process:
1. [Perform a Wi-Fi Network Scan](#initiating-the-wi-fi-network-scan) using the `/cgi?7` Endpoint.
2. [Clear the `busy` State](#clearing-the-busy-state).
3. [Locate the Desired Wi-Fi Network in the Scan Results](#retrieving-the-wi-fi-network-scan-results) returned from the `/cgi?6` Endpoint.


### Initiating the Wi-Fi Network Scan
To start, make a request to the `/cgi?7` Endpoint with the following request body:
```http
[ACT_WLAN_SCAN#1,${WIFI_CHANNEL_INDEX},0,0,0,0#0,0,0,0,0,0]0,0<CRLF>
```
where `${WIFI_CHANNEL_INDEX}` is `1` to search the `2.4GHz` Frequency and `2` to search the `5GHz` Frequency.

If the request was successful, a [Generic Successful Response Body](#successful-and-failed-requests) will be returned:
```http
[error]0
```


### Retrieving the Wi-Fi Network Scan Results
Once the [Wi-Fi Scan has been initiated](#initiating-the-wi-fi-network-scan) and the [`busy` State has been cleared](#clearing-the-busy-state), make a request to the `/cgi?6` Endpoint with the following request body:
```http
[LAN_WLAN_BSSDESC_ENTRY#0,0,0,0,0,0#1,${WIFI_CHANNEL_INDEX},0,0,0,0]0,5
SSID
BSSID
SecurityEnable
Channel
RSSI<CRLF>
```
where `${WIFI_CHANNEL_INDEX}` is `1` to retrieve the results from searching the `2.4GHz` Frequency and `2` to retrieve the results from searching the `5GHz` Frequency.


On success, the router will return a response similar to the following:
```http
[1,${WIFI_CHANNEL_INDEX},${RESULT_INDEX},0,0,0]0
SSID=${1ST_WIFI_NETWORK_NAME}
BSSID=${1ST_WIFI_NETWORK_MAC_ADDRESS}
securityEnable=1
channel=${1ST_WIFI_NETWORK_CHANNEL}
RSSI=${1ST_WIFI_NETWORK_SIGNAL_STRENGTH}
[1,${WIFI_CHANNEL_INDEX},${RESULT_INDEX},0,0,0]0
SSID=${2ND_WIFI_NETWORK_NAME}
BSSID=${2ND_WIFI_NETWORK_MAC_ADDRESS}
securityEnable=1
channel=${2ND_WIFI_NETWORK_CHANNEL}
RSSI=${2ND_WIFI_NETWORK_SIGNAL_STRENGTH}
[1,${WIFI_CHANNEL_INDEX},${RESULT_INDEX},0,0,0]0
SSID=${3RD_WIFI_NETWORK_NAME}
BSSID=${3RD_WIFI_NETWORK_MAC_ADDRESS}
securityEnable=1
channel=${3RD_WIFI_NETWORK_CHANNEL}
RSSI=${3RD_WIFI_NETWORK_SIGNAL_STRENGTH}
[error]0
```

Each result from the Wi-Fi Scan begins with a line of the format `[1,${WIFI_CHANNEL_INDEX},${RESULT_INDEX},0,0,0]0` where `${RESULT_INDEX}` is the 1-based index of the search result and `${WIFI_CHANNEL_INDEX}` is either `1` for the `2.4GHz` Wi-Fi Channel Search Results or `2` for the `5GHz` Wi-Fi Channel Search Results.

Each search result contains several important Key-Value Pairs, including:
- `SSID`: The SSID (name) of the Wi-Fi Network.
- `BSSID`: The Unique Mac Address of the Wi-Fi Network.
- `securityEnable`: Indicates whether or not the Wi-Fi Network is Password-Protected.
- `channel`: The Channel the Wi-Fi Network is currently using.
- `RSSI`: The signal strength of the Wi-Fi Network. The search results are ordered in *descending order* based on the `RSSI`.

For our purposes, we only care about the search result with the same `SSID` as the Main Router the WDS Bridge is being established with, taking note of the associated `BSSID`, and `channel`.


## Retrieving the Bridge Router Wi-Fi Network Properties
To retrieve the Current Bridge Router Wi-Fi Network Properties, make a request to the `/cgi?5` Endpoint with the following request body:
```http
[LAN_WLAN#0,0,0,0,0,0#0,0,0,0,0,0]0,27
name
X_TP_Band
X_TP_Configuration_Modified
TransmitPowerSupported
TransmitPower
Standard
X_TP_BeaconInterval
X_TP_RTSThreshold
X_TP_FragmentThreshold
X_TP_DTIMFrequency
X_TP_ShortGIEnable
X_TP_IsolateClients
X_TP_AntiInterference
WMMEnable
X_TP_GroupKeyUpdateInterval
SSID
Channel
AutoChannelEnable
SSIDAdvertisementEnabled
Enable
X_TP_Bandwidth
BeaconType
WPAAuthenticationMode
WPAEncryptionModes
IEEE11iEncryptionModes
IEEE11iAuthenticationMode
BasicEncryptionModes<CRLF>
```

On success, the endpoint will return a response that looks like the following:
```http
[1,1,0,0,0,0]0
name=wlan0
X_TP_Band=2.4GHz
X_TP_Configuration_Modified=0
transmitPowerSupported=100,50,20
transmitPower=100
standard=n
X_TP_BeaconInterval=100
X_TP_RTSThreshold=2347
X_TP_FragmentThreshold=2346
X_TP_DTIMFrequency=1
X_TP_ShortGIEnable=1
X_TP_IsolateClients=0
X_TP_AntiInterference=1
WMMEnable=1
X_TP_GroupKeyUpdateInterval=0
SSID=${2.4GHz_WIFI_NETWORK_NAME}
channel=${2.4GHz_WIFI_CHANNEL}
autoChannelEnable=1
SSIDAdvertisementEnabled=1
enable=1
X_TP_Bandwidth=Auto
beaconType=11i
WPAAuthenticationMode=PSKAuthentication
WPAEncryptionModes=AESEncryption
IEEE11iEncryptionModes=AESEncryption
IEEE11iAuthenticationMode=PSKAuthentication
basicEncryptionModes=None
[1,2,0,0,0,0]0
name=wlan5
X_TP_Band=5GHz
X_TP_Configuration_Modified=1
transmitPowerSupported=100,50,20
transmitPower=100
standard=ac
X_TP_BeaconInterval=100
X_TP_RTSThreshold=2347
X_TP_FragmentThreshold=2346
X_TP_DTIMFrequency=1
X_TP_ShortGIEnable=1
X_TP_IsolateClients=0
X_TP_AntiInterference=0
WMMEnable=1
X_TP_GroupKeyUpdateInterval=0
SSID=${5GHz_WIFI_NETWORK_NAME}
channel=${5GHz_WIFI_CHANNEL}
autoChannelEnable=0
SSIDAdvertisementEnabled=1
enable=1
X_TP_Bandwidth=Auto
beaconType=11i
WPAAuthenticationMode=PSKAuthentication
WPAEncryptionModes=AESEncryption
IEEE11iEncryptionModes=AESEncryption
IEEE11iAuthenticationMode=PSKAuthentication
basicEncryptionModes=None
[error]0
```

> [!TIP]
> 
> At a minimum, the request body can be the following:
> ```http
> [LAN_WLAN#0,0,0,0,0,0#0,0,0,0,0,0]0,4
> SSID
> Channel
> AutoChannelEnable
> Enable<CRLF>
> ```
>
> Which will return a truncated response similar to the following:
> ```http
> [1,1,0,0,0,0]0
> SSID=${2.4GHz_WIFI_NETWORK_NAME}
> channel=${2.4GHz_WIFI_CHANNEL}
> autoChannelEnable=1
> enable=1
> [1,2,0,0,0,0]0
> SSID=${5GHz_WIFI_NETWORK_NAME}
> channel=${5GHz_WIFI_CHANNEL}
> autoChannelEnable=0
> enable=1
> [error]0
> ```

Each returned Wi-Fi Frequency will contain several important Key-Value Pairs, including:
- `SSID`: The SSID (name) of the Wi-Fi Network.
- `channel`: The Channel the Wi-Fi Network is currently using.
- `autoChannelEnabled`: Whether the `channel` is set automatically by the router.
- `enable`: Whether the Wi-FI Network is currently enabled or not.


## Changing the Bridge Router Wi-Fi Network Settings
If the Bridge Router Wi-Fi Network Settings need to be modified to re-establish the WDS Bridge, make a request to the `/cgi?2` Endpoint with the following request body:
```http
[LAN_WLAN#1,${WIFI_FREQUENCY},0,0,0,0#0,0,0,0,0,0]0,3
enable=1
channel=${WIFI_CHANNEL}
autoChannelEnable=0
```
where `${WIFI_FREQUENCY}` is `1` when modifying the `2.4GHz` Frequency or `2` when modifying the `5GHz` Frequency
and `${WIFI_CHANNEL}` is the Wi-Fi Channel of the [Main Router Wi-Fi Network the WDS Bridge is being established with](#retrieving-the-main-router-wi-fi-network-properties).

If the Bridge Router Wi-Fi Network Settings were successfully updated, a [Generic Successful Response Body](#successful-and-failed-requests) will be returned:
```http
[error]0
```


## Changing the WDS Bridge Configuration Settings
If the [WDS Bridge has already been successfully configured](#retrieving-the-current-wds-bridge-settings), then [setting the proper `channel` for the Bridge Router Wi-Fi Network](#updating-the-bridge-router-wi-fi-network-settings) is all that is needed to successfully re-establish the WDS Bridge.

However, if the WDS Bridge was *not* previously established or was reset for some reason, the WDS Bridge Configuration Settings will have to be updated. To do so, make a request to the `/cgi?2` Endpoint with the following request body:
```http
[LAN_WLAN_WDSBRIDGE#1,${WIFI_FREQUENCY},0,0,0,0#0,0,0,0,0,0]0,7
BridgeEnable=1
BridgeBSSID=${MAIN_ROUTER_WIFI_NETWORK_MAC_ADDRESS}
BridgeSSID=${MAIN_ROUTER_WIFI_NETWORK_NAME}
BridgeAuthMode=PSK2Authentication
BridgeEncryptMode=AESEncryption
BridgeKey=${MAIN_ROUTER_WIFI_NETWORK_PASSWORD}
BridgeWepKeyIndex=1<CRLF>
```
where `${WIFI_FREQUENCY}` is `1` when modifying the `2.4GHz` WDS Bridge Configuration Settings or `2` when modifying the `5GHz` WDS Bridge Configuration Settings. The `${MAIN_ROUTER_WIFI_NETWORK_MAC_ADDRESS}` and `${MAIN_ROUTER_WIFI_NETWORK_NAME}` can be retrieved by [Retrieving the Main Router Wi-Fi Network Properties](#retrieving-the-main-router-wi-fi-network-properties), while the `${MAIN_ROUTER_WIFI_NETWORK_PASSWORD}` should be specified via some sort of Environment Variable.

If the WDS Bridge Configuration Settings were successfully updated, a [Generic Successful Response Body](#successful-and-failed-requests) will be returned:
```http
[error]0
```


## Logging Out of the Router Management Interface
Once we are done using the CGI, it is *strongly recommended* to log out of the Router Management Interface by simply sending a request to the `/cgi?8` endpoint with the following request body:
```http
[/cgi/logout#0,0,0,0,0,0#0,0,0,0,0,0]0,0<CRLF>
```

On success, a [Generic Successful CGI Response Body](#successful-and-failed-requests) will be returned:
```http
[cgi]0
[error]0
```
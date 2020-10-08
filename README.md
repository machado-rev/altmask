[![Build Status](https://travis-ci.org/machado-rev/altmask.svg?branch=master)](https://travis-ci.org/machado-rev/altmask)

## Get Altmask
Soon at Chrome Web Store

## Web Dapp Usage

Your dapp can use Altmask to get information about a user's account status (whether they are logged into Altmask, their account address, and balance). Altmask also enables your dapp to listen to a window event for any changes to the user's account status.
Your dapp can also use altmask to make callcontract and sendtocontract calls to the blockchain. 

### Connecting Altmask
To use any of the above functionality, your dapp will first need to initiate a long-lived connection between Altmask's content script and background script.
The code to do this is already in Altmask, your dapp just needs to trigger the function by posting a window message.
`window.postMessage({ message: { type: 'CONNECT_ALTMASK' }}, '*')`

This will populate the `window.altmask` object in your webpage. The `window.altmask.account` values are automatically updated when a user logs in/out or the account balance changes.

```
// window.altmask
{
  rpcProvider: AltmaskRPCProvider,
  account: {
    loggedIn: true, 
    name: "2", 
    network: "TestNet", 
    address: "qJHp6dUSmDShpEEMmwxqHPo7sFSdydSkPM", 
    balance: 49.10998413 
  }
}
```

### Refreshing your page when Altmask is installed or updated
You will probably want to refresh your dapp webpage when Altmask is installed or updated. This allows your dapp to rerun
`window.postMessage({ message: { type: 'CONNECT_ALTMASK' }}, '*')`
which would have previously failed to do anything while Altmask was not yet installed. 
When Altmask is installed or updated it will send all existing tabs an event message. To have that event message refresh your dapp, add the following event listener.

```
function handleAltmaskInstalledOrUpdated(event) {
  if (event.data.message && event.data.message.type === 'ALTMASK_INSTALLED_OR_UPDATED') {
      // Refresh the page
      window.location.reload()
  }
}  
window.addEventListener('message', handleAltmaskInstalledOrUpdated, false);
```

### Altmask User Account Status - Login/Logout
After connecting Altmask to your dapp, you can use an event listener to get notified of any changes to the user's account status(logging in/out, change in account balance).

```
function handleAltmaskAcctChanged(event) {
  if (event.data.message && event.data.message.type === "ALTMASK_ACCOUNT_CHANGED") {
  	if (event.data.message.payload.error){
  		// handle error
  	}
    console.log("account:", event.data.message.payload.account)
  }
}
window.addEventListener('message', handleAltmaskAcctChanged, false);
```

Note that `window.altmask.account` will still get updated even if you don't set up this event listener; your Dapp just won't be notified of the changes.

### Using AltmaskProvider

RPC calls can be directly made via `AltmaskProvider` which is available to any webpage that connects to Altmask.

**Make sure that `window.altmask.rpcProvider` is defined before using it.**

```
// callcontract
const contractAddress = 'a6dd0b0399dc6162cedde85ed50c6fa4a0dd44f1';
const data = '06fdde03';
window.altmask.rpcProvider.rawCall(
  'callcontract',
  [contractAddress, data]
).then((res) => console.log(res));

// sendtocontract
const contractAddress = '49a941c5259e4e6ef9ac4a2a6716c1717ce0ffb6';
const data = 'd0821b0e0000000000000000000000000000000000000000000000000000000000000001';
const qtumAmt = 1; // optional. defaults to 0.
const gasLimit = 200000; // optional. defaults to 200000.
const gasPrice = 40; // optional. defaults to 40 (satoshi).
window.altmaskProvider.rawCall(
  'sendtocontract',
  [contractAddress, data, qtumAmt, gasLimit, gasPrice],
);

// Handle incoming messages
function handleMessage(message) {
  if (message.data.target == 'altmask-inpage') {
    // result: object
    // error: string
    const { result, error } = message.data.message.payload;
    
    if (error) {
      if (error === 'Not logged in. Please log in to Altmask first.') {
        // Show an alert dialog that the user needs to login first
        alert(error);
      } else {
        // Handle different error than not logged in...
      }
      return;
    }

    // Do something with the message result...
  }
}
window.addEventListener('message', handleMessage, false);
```

### Using Qweb3
You may also use our Qweb3 convenience library to make `sendtocontract` or `callcontract` calls. See the instructions in the Github repo here: https://github.com/machado-rev/altweb3

### Using RegTest
You can connect Altmask to regtest. You will need to set the following in your qtumcore-node.json

```
"qtum-explorer": {
  "apiPrefix": "api",
  "routePrefix": "explorer",
  ...
 },
"qtum-insight-api": {
  "routePrefix": "api",
  ...
}  
```

## Running Dev Version
### Chrome
1. `yarn start` in the project folder to build the dev version and wait for it to be built
2. Open Chrome and load URL: `chrome://extensions`
3. Turn `Developer mode` on in the top right
4. At the top, click `Load Unpacked Extension`
5. Navigate to your `altmask/dist` folder
6. Click `Select`. The extension should now be loaded
7. Click on the Altmask logo in your Chrome extensions bar to open

## Security Flow
**First Time Flow**
1. `appSalt` is generated on a per-install basis
2. User enters `password` in Login page
3. `password` + `appSalt` runs through `scrpyt` encryption for ~3 seconds to generate `passwordHash`
4. User creates or imports wallet
5. `passwordHash` + wallet's `privateKey` runs through `scrypt` encryption for ~1 second to generate `encryptedPrivateKey`
6. Account is saved in storage with `encryptedPrivateKey`

**Return User Flow**
1. User enters password in Login page
2. `password` + `appSalt` runs through `scrpyt` encryption for ~3 seconds to generate `passwordHash`
3. Existing account is fetched from storage
4. `passwordHash` is used to decrypted the `encryptedPrivateKey`. On successful decryption of the wallet, the password is validated.

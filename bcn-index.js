import {
  createWalletClient,
  custom,
  createPublicClient,
  http,
  parseEther,
} from "https://esm.sh/viem";
import { mainnet } from "https://esm.sh/viem/chains";
import { contractAddress, abi } from "./bcn-constants.js";

// grab website elements
const greetingSpan = document.getElementById("greetingSpan");
const connectButton = document.getElementById("connectButton");
const colorInput = document.getElementById("roInput");
const namedButton = document.getElementById("namedButton");
const currentNameSpan = document.getElementById("currentNameSpan");
const currentOwnerSpan = document.getElementById("currentOwnerSpan");
const renameInput = document.getElementById("renameInput");
const renameItButton = document.getElementById("renameItButton");
const nameInput = document.getElementById("nameInput");
const nameItButton = document.getElementById("nameItButton");
const ownerIsNobodyDiv = document.getElementById("ownerIsNobodyDiv");
const poorDiv = document.getElementById("poorDiv");
const ownerIsSomebodyDiv = document.getElementById("ownerIsSomebodyDiv");
const ownerIsNotMeDiv = document.getElementById("ownerIsNotMeDiv");
const ownerIsMeDiv = document.getElementById("ownerIsMeDiv");

// initialize viem pieces
let walletClient;
let publicClient;

let colorhex;
let tokenId;
let tokenName;
let tokenOwner;
let connectedAccount;
let price;

async function connect() {
  if (typeof window.ethereum !== "undefined") {
    walletClient = createWalletClient({
      chain: mainnet,
      transport: custom(window.ethereum),
    });
    console.log("wallet client created from connect() in bcn-index.js");
    [connectedAccount] = await walletClient.requestAddresses();
    greetingSpan.innerHTML = `Hello, ${connectedAccount}!`;
    connectButton.innerHTML = "(connected)";
  } else {
    connectButton.innerHTML = "(please install Metamask)";
  }
}

async function named() {
  // let's start with a clean UI slate
  renameInput.value = "";
  nameInput.value = "";
  ownerIsNobodyDiv.hidden = true;
  poorDiv.hidden = true;
  ownerIsSomebodyDiv.hidden = true;
  ownerIsNotMeDiv.hidden = true;
  ownerIsMeDiv.hidden = true;
  // ...is Metamask installed...
  if (typeof window.ethereum !== "undefined") {
    // ...Metamask is installed...
    publicClient = createPublicClient({
      chain: mainnet,
      transport: http(), // this line works, not the below
      // transport: custom(window.ethereum),
    });
    console.log("public client created from named() in bcn-index.js");
    colorhex = colorInput.value.substring(1);
    console.log(colorhex);
    // let's try to get the token's name & owner
    try {
      tokenName = await publicClient.readContract({
        address: contractAddress,
        abi: abi,
        functionName: "getName",
        args: [colorhex],
      });
      tokenOwner = await publicClient.readContract({
        address: contractAddress,
        abi: abi,
        functionName: "getOwner",
        args: [colorhex],
      });
      // ...if we made it this far, inputs were valid, and token exists...
      // let's show the token's name & owner
      currentNameSpan.innerHTML = tokenName;
      currentOwnerSpan.innerHTML = tokenOwner;
      // ...did the user connect...
      if (typeof connectedAccount !== "undefined") {
        // ...user connected... (but could've changed account since)
        // let's get the current connected account
        [connectedAccount] = await walletClient.requestAddresses();
        // ...is the user the owner...
        if (connectedAccount == tokenOwner) {
          // ...user is the owner...
          ownerIsMeDiv.hidden = false; // ...owner exists, and is user
        } else {
          // ...user is not the owner...
          ownerIsNotMeDiv.hidden = false; // ...owner exists, and is not user
        }
      } else {
        // ...user did not connect...
        ownerIsSomebodyDiv.hidden = false; // ...retry, pal
      }
    } catch (error) {
      // ...some kind of error happened from trying to get the token's name & owner...
      console.log(error.message);
      // ...is the error about the token not existing...
      if (error.message.includes("InvalidTokenId")) {
        // ...ah, right, token doesn't exist...
        currentNameSpan.innerHTML = "Up for grabs!";
        currentOwnerSpan.innerHTML = "Could be you!";
        // ...did the user connect...
        if (typeof connectedAccount !== "undefined") {
          // ...user did connect...
          ownerIsNobodyDiv.hidden = false; // ...owner does not exist
        } else {
          // ...user did not connect...
          ownerIsSomebodyDiv.hidden = false; // ...retry, pal
        }
      } else {
        // ...uh, well, it's some other error...
        currentNameSpan.innerHTML = "please try...";
        currentOwnerSpan.innerHTML = "...that again";
      }
    }
  } else {
    // ...Metamask is not installed...
    ownerIsSomebodyDiv.hidden = false; // ...retry, pal
  }
}

async function renameIt() {
  // first: connect! (gets the current connected account)
  connect();
  // now:
  try {
    publicClient = createPublicClient({
      chain: mainnet, // adding this here instead of in simulateContract()
      // transport: custom(window.ethereum), // ContractFunctionExecutionError:
      // ...The contract function "modName" reverted.
      transport: http(), // try'g this i/o the one above
    });
    console.log("public client created from renameIt()");
    const { request } = await publicClient.simulateContract({
      account: connectedAccount,
      address: contractAddress,
      abi: abi,
      functionName: "modName",
      args: [colorInput.value.substring(1), renameInput.value],
      chain: mainnet,
    });
    console.log("simulated contract from renameIt()");
    await walletClient.switchChain({ id: 1 });
    const hash = await walletClient.writeContract(request); // until above line, ContractFunctionExecutionError:
    // ...The current chain of the wallet (id: 11155111) does not match...
    // ...the target chain for the transaction (id: 1 – Ethereum).
    console.log(hash);
  } catch (error) {
    console.log(error);
  }
}

async function nameIt() {
  // first: connect! (gets the current connected account)
  connect();
  // now:
  try {
    publicClient = createPublicClient({
      // transport: custom(window.ethereum), // copying renameIt()'s
      chain: mainnet,
      transport: http(),
    });
    console.log("public client created from nameIt()");

    // color in hexadecimal form:
    colorhex = colorInput.value.substring(1);
    console.log(colorhex);

    // hexadecimal form could have lower case or upper case numerals (F / f),
    // which increases the number of checks to set pricing,
    // i.e., if not careful, could get white, as "FFFfff", for cheap...
    // color in decimal form:
    tokenId = await publicClient.readContract({
      address: contractAddress,
      abi: abi,
      functionName: "aGetId",
      args: [colorhex],
    });
    console.log("did aGetId()");
    console.log(tokenId);

    // set price:
    price = parseEther("0.001");
    console.log("Price set to 0.001 ETH.");
    if (
      tokenId == 255 ||
      tokenId == 65280 ||
      tokenId == 16711680 ||
      tokenId == 65535 ||
      tokenId == 16711935 ||
      tokenId == 16776960
    ) {
      price = parseEther("1");
      console.log("Price set to 1 ETH!");
    }
    if (tokenId == 0 || tokenId == 16777215) {
      price = parseEther("10");
      console.log("Price set to 10 ETH!!");
    }
    console.log(price);

    // test run a minting:
    const { request } = await publicClient.simulateContract({
      account: connectedAccount,
      address: contractAddress,
      abi: abi,
      functionName: "setToken",
      args: [colorhex, nameInput.value],
      value: price,
      chain: mainnet,
    });
    console.log("simulated contract from nameIt()");

    // if that test run works, do the actual mint:
    await walletClient.switchChain({ id: 1 }); // ensure we're on ETH mainnet
    const hash = await walletClient.writeContract(request);
    console.log(hash);
  } catch (error) {
    console.log("Looks like we gots ourselves an error!");
    console.log(error.message);
    currentNameSpan.innerHTML = "please try...";
    currentOwnerSpan.innerHTML = "...that again";

    // ...is the error about insufficient funds...
    if (
      error.message.includes("insufficient") ||
      error.message.includes("NeedMoreFundsForThisColor")
    ) {
      // ...ah, right, not enough funds...
      poorDiv.hidden = false; // ...get richer, then retry
    }
  }
}

connectButton.onclick = connect;
namedButton.onclick = named;
renameItButton.onclick = renameIt;
nameItButton.onclick = nameIt;

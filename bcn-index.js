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
const tokenCodeInput = document.getElementById("tokenCodeInput");
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

const s00 = document.getElementById("square00");
const s01 = document.getElementById("square01");
const s02 = document.getElementById("square02");
const s03 = document.getElementById("square03");
const s04 = document.getElementById("square04");
const s05 = document.getElementById("square05");
const s06 = document.getElementById("square06");
const s07 = document.getElementById("square07");
const s08 = document.getElementById("square08");
const s09 = document.getElementById("square09");
const s10 = document.getElementById("square10");
const s11 = document.getElementById("square11");
const s12 = document.getElementById("square12");
const s13 = document.getElementById("square13");
const s14 = document.getElementById("square14");
const s15 = document.getElementById("square15");

// initialize viem pieces
let walletClient;
let publicClient;

let tokenCode;
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
      transport: http(),
    });
    console.log("public client created from named() in bcn-index.js");
    // tokenCode = tokenCodeInput.value;

    // let's create that tokenCode from all the checkboxes
    tokenCode = s00.checked ? "x" : "o";
    tokenCode += s01.checked ? "x" : "o";
    tokenCode += s02.checked ? "x" : "o";
    tokenCode += s03.checked ? "x" : "o";
    tokenCode += s04.checked ? "x" : "o";
    tokenCode += s05.checked ? "x" : "o";
    tokenCode += s06.checked ? "x" : "o";
    tokenCode += s07.checked ? "x" : "o";
    tokenCode += s08.checked ? "x" : "o";
    tokenCode += s09.checked ? "x" : "o";
    tokenCode += s10.checked ? "x" : "o";
    tokenCode += s11.checked ? "x" : "o";
    tokenCode += s12.checked ? "x" : "o";
    tokenCode += s13.checked ? "x" : "o";
    tokenCode += s14.checked ? "x" : "o";
    tokenCode += s15.checked ? "x" : "o";

    console.log(tokenCode);
    // let's try to get the token's name & owner
    try {
      tokenName = await publicClient.readContract({
        address: contractAddress,
        abi: abi,
        functionName: "getTokenName",
        args: [tokenCode],
      });
      tokenOwner = await publicClient.readContract({
        address: contractAddress,
        abi: abi,
        functionName: "getTokenOwner",
        args: [tokenCode],
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
      chain: mainnet,
      transport: http(),
    });
    console.log("public client created from renameIt()");
    const { request } = await publicClient.simulateContract({
      account: connectedAccount,
      address: contractAddress,
      abi: abi,
      functionName: "modTokenName",
      args: [tokenCode, renameInput.value],
      chain: mainnet,
    });
    console.log("simulated contract from renameIt()");
    await walletClient.switchChain({ id: 1 });
    const hash = await walletClient.writeContract(request);
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
      chain: mainnet,
      transport: http(),
    });
    console.log("public client created from nameIt()");

    // art tech in a codified form:
    // tokenCode = tokenCodeInput.value;
    console.log(tokenCode);

    // art tech in decimal form:
    tokenId = await publicClient.readContract({
      address: contractAddress,
      abi: abi,
      functionName: "aGetId",
      args: [tokenCode],
    });
    console.log("did aGetId()");
    console.log(tokenId);

    // set price:
    price = parseEther("0.001");
    console.log("Price set to 0.001 ETH.");
    if (tokenId == 0 || tokenId == 65535) {
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
      args: [tokenCode, nameInput.value],
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
      error.message.includes("NeedMoreFundsForThis")
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

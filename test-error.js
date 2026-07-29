const err = new Error("The server cannot or will not process the request due to something that is perceived to be a client error eg malformed request syntax invalid request message framing or deceptive request routing");
console.error("error 0:", JSON.stringify({message: err.message}));

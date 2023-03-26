const statusMessages = {
  429: "Hit a rate limit.",
  529: "Twitter service is unavailable at the moment.",
};

exports.logError = (error) => {
  if (error.data && error.data.title) {
    console.log("Twitter error");
    console.log("-".repeat(10));
    if (error.code && statusMessages[error.code]) {
      console.log(`(!) ${statusMessages[error.code]}`);
    }
    console.log(error.data);
    console.log("=".repeat(10));
  } else {
    console.log(error);
  }
};

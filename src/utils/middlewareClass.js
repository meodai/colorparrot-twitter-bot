class Middleware {
  constructor(T, tweet) {
    this.T = T;
    this.tweet = tweet;
    this.listOfMiddlewares = [];
  }
  use(f) {
    this.listOfMiddlewares.push(f);
  }
  run() {
    for (let i = 0; i < this.listOfMiddlewares.length; i++) {
      const f = this.listOfMiddlewares[i];
      this.listOfMiddlewares[i] = async () => {
        await f(this.T, this.tweet, this.listOfMiddlewares[i + 1])
            .catch((e) => console.log(e));
      };
    }
    this.listOfMiddlewares[0]();
  }
}


module.exports = Middleware;

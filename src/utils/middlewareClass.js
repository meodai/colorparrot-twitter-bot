class Middleware {
  constructor(T, tweet, db) {
    this.T = T;
    this.tweet = tweet;
    this.db = db;
    this.listOfMiddlewares = [];
  }
  use(f) {
    this.listOfMiddlewares.push(f);
  }
  run() {
    for (let i = 0; i < this.listOfMiddlewares.length; i++) {
      const f = this.listOfMiddlewares[i];
      if (f.constructor.name === 'Function') {
        this.listOfMiddlewares[i] = () => {
          try {
            f(this.T, this.tweet, this.listOfMiddlewares[i + 1], this.db);
          } catch (e) {
            console.log(e);
          }
        };
      } else if (f.constructor.name === 'AsyncFunction') {
        this.listOfMiddlewares[i] = async () => {
          await f(this.T, this.tweet, this.listOfMiddlewares[i + 1], this.db)
              .catch((e) => console.log(e));
        };
      }
    }
    this.listOfMiddlewares[0]();
  }
}


module.exports = Middleware;

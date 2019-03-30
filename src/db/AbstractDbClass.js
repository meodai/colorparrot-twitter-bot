//* eslint-disable */

class AbstractDbClass {
  async addColorNameInPostedTweets() {
    throw 'addColorNameInPostedTweets is not implemented';
  }

  async addUserMessageToFloodList() {
    throw 'not implemented';
  }

  async addUserMessageToProposalsList() {
    throw 'addUserMessageToFloodList is not implemented';
  }

  async checkIfColorExistsInTweets() {
    throw 'checkIfColorExistsInTwitts not implemented';
  }
}


module.exports = AbstractDbClass;

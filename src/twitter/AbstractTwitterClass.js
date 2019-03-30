//* eslint-disable */

class AbstractTwitterClass {
  statusesUpdate() {
    throw 'statusesUpdate is not implemented';
  }
  mediaUpload() {
    throw 'mediaUpload is not implemented';
  }
  statusesFilterStream() {
    throw 'statusesFilter is not implemented';
  }
}


module.exports = AbstractTwitterClass;

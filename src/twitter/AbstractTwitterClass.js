/* eslint-disable */

class AbstractTwitterClass {
  // https://developer.twitter.com/en/docs/tweets/post-and-engage/api-reference/post-statuses-update.html
  statusesUpdate() {
    throw 'statusesUpdate is not implemented';
  }
  // https://developer.twitter.com/en/docs/media/upload-media/api-reference/post-media-upload.html
  mediaUpload() {
    throw 'mediaUpload is not implemented';
  }
  // https://developer.twitter.com/en/docs/tweets/filter-realtime/api-reference/post-statuses-filter.html
  statusesFilterStream() {
    throw 'statusesFilter is not implemented';
  }
}


module.exports = AbstractTwitterClass;

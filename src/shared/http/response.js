const API_VERSION = '2.0.0';

function ok(data, version = API_VERSION) {
  return {
    version,
    data
  };
}

function fail(error, details = null, version = API_VERSION) {
  return {
    version,
    data: {
      success: false,
      error,
      details
    }
  };
}

module.exports = {
  ok,
  fail,
  API_VERSION
};

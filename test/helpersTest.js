const { assert } = require('chai');

const { getIdFromEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getIdFromEmail', function() {
  it('should return a user with valid email', function() {
    const user = getIdFromEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    // Write your assert statement here
    assert.deepEqual(user, expectedUserID);
  });

  it('should return undefined if user email is not found in database', function() {
    const user = getIdFromEmail("noemail@example.com", testUsers);
    const expectedUserID = "userRandomID";
    // Write your assert statement here
    assert.notDeepEqual(expectedUserID, user);
  });
});
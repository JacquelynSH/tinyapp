
const getIdFromEmail = function(email, users) {
  for (let user in users) {
    let userEmail = users[user].email;
    if (userEmail === email) {
      return users[user].id;
    }
  }
  return false;
};

module.exports = { getIdFromEmail };
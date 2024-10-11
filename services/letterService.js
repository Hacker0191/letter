const crypto = require('crypto');
const { database } = require('../firebaseConfig');
const { ref, set, get, push } = require("firebase/database");

function generateUniqueCode() {
  return crypto.randomBytes(3).toString('hex');
}

async function saveLetter(letter, isDraft = false) {
  const code = generateUniqueCode();
  const letterRef = ref(database, 'letters/' + code);
  
  await set(letterRef, {
    userLetter: letter,
    userDate: new Date().toISOString(),
    adminReply: null,
    adminDate: null,
    replied: false,
    isDraft: isDraft
  });

  return code;
}

async function getLetter(code) {
  const letterRef = ref(database, 'letters/' + code);
  const snapshot = await get(letterRef);
  return snapshot.val();
}

async function getAllLetters() {
  const lettersRef = ref(database, 'letters');
  const snapshot = await get(lettersRef);
  const letters = snapshot.val();
  return letters ? Object.entries(letters).map(([code, letter]) => ({ code, ...letter })) : [];
}

async function replyToLetter(code, reply) {
  const letterRef = ref(database, 'letters/' + code);
  const snapshot = await get(letterRef);
  const letter = snapshot.val();

  if (letter) {
    letter.adminReply = reply;
    letter.adminDate = new Date().toISOString();
    letter.replied = true;
    await set(letterRef, letter);
    return true;
  }
  return false;
}

async function updateDraft(code, letter) {
  const letterRef = ref(database, 'letters/' + code);
  const snapshot = await get(letterRef);
  const existingLetter = snapshot.val();

  if (existingLetter) {
    existingLetter.userLetter = letter;
    await set(letterRef, existingLetter);
    return true;
  }
  return false;
}

module.exports = {
  saveLetter,
  getLetter,
  getAllLetters,
  replyToLetter,
  updateDraft
};
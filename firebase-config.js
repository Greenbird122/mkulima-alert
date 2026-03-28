const firebaseConfig = {
  apiKey: "AIzaSyB0rM7TK0RX9DLM-bgGilbXydNLHBAZsw0",
  authDomain: "mkulima-alert.firebaseapp.com",
  projectId: "mkulima-alert",
  storageBucket: "mkulima-alert.firebasestorage.app",
  messagingSenderId: "964417212821",
  appId: "1:964417212821:web:913c6ee8355128d087a69c",
  measurementId: "G-K6T9DM0PB2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
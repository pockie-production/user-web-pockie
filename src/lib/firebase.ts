import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyASNEVI9UAKBUhwl9z0IEf954425XWB0Jg",
  authDomain: "pockie-web.firebaseapp.com",
  projectId: "pockie-web",
  storageBucket: "pockie-web.firebasestorage.app",
  messagingSenderId: "970488008165",
  appId: "1:970488008165:web:e751a0d680f9e122c2730c",
  measurementId: "G-J38JKPKWL1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

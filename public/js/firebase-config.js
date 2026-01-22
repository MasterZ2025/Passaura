// Importamos las funciones necesarias del SDK de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries


const firebaseConfig = {
  apiKey: "AIzaSyDM0kFEjeHWaisrZxe07Exn4endiJWLZj0",
  authDomain: "passaura-evo.firebaseapp.com",
  projectId: "passaura-evo",
  storageBucket: "passaura-evo.firebasestorage.app",
  messagingSenderId: "545646409012",
  appId: "1:545646409012:web:ac9954fc91e23de069a161",
  measurementId: "G-5SX0F7T18B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exportamos las variables para usarlas en otros archivos
export { auth, db };
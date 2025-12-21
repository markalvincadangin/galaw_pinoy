import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDVFnRDg-E6i1HgANg0lHXed4IZeCIO2qE",
  authDomain: "galaw-pinoy-website.firebaseapp.com",
  projectId: "galaw-pinoy-website",
  storageBucket: "galaw-pinoy-website.appspot.com",
  messagingSenderId: "178277061408",
  appId: "1:178277061408:web:81720bc2ecc90d7f6b3d45"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
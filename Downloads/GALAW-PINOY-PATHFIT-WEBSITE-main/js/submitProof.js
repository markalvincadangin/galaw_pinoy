import { db } from "./firebase.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const form = document.querySelector("form");
const textarea = document.querySelector("textarea");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (textarea.value.trim() === "") {
    alert("Please write a reflection.");
    return;
  }

  try {
    await addDoc(collection(db, "reflections"), {
      text: textarea.value,
      timestamp: new Date()
    });
    textarea.value = "";
    alert("Reflection submitted successfully!");
  } catch (error) {
    console.error("Error writing to Firestore:", error);
    alert("Failed to submit. Check console for details.");
  }
}); 
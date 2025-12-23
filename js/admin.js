import { db } from "../js/firebase.js";
import { getDocs, collection } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const list = document.getElementById("reflectionList");

async function loadReflections() {
  const snapshot = await getDocs(collection(db, "reflections"));
  snapshot.forEach(doc => {
    const li = document.createElement("li");
    li.textContent = doc.data().text;
    list.appendChild(li);
  });
}

loadReflections();

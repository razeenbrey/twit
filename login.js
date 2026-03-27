import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCKafm0rLyi4pByNDjgZv0khLALFx0qQlM",
    authDomain: "xclone-razeen.firebaseapp.com",
    projectId: "xclone-razeen",
    storageBucket: "xclone-razeen.firebasestorage.app",
    messagingSenderId: "656681832912",
    appId: "1:656681832912:web:50d2d1373d4b2c5c4469d5",
    measurementId: "G-1X6PZ0WXXE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const button = document.getElementById("google-login");

if (button) {
    button.addEventListener("click", async () => {
        try {
            await signInWithPopup(auth, provider);
            window.location.href = "index.html";
        } catch (err) {
            console.error("Login failed", err);
            alert("Login failed. Check console for details.");
        }
    });
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = "index.html";
    }
});


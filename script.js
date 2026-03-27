import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

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
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app, `gs://${firebaseConfig.projectId}.appspot.com`);

// dark mode
const toggle = document.getElementById("theme-toggle");
if (toggle) {
    toggle.addEventListener("click", () => {
        document.body.classList.toggle("light");
    });
}

// auth guard & user display
const usernameSpan = document.getElementById("username");
const useridSpan = document.getElementById("userid");

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const displayName = user.displayName || "User";
    const handle = user.email ? user.email.split("@")[0] : user.uid.slice(0, 8);

    if (usernameSpan) usernameSpan.textContent = displayName;
    if (useridSpan) useridSpan.textContent = `@${handle}`;
});

// firebase code stuff
const imageInput = document.getElementById("image-input");
const imageIcon = document.getElementById("image-icon");

if (imageIcon && imageInput) {
    imageIcon.addEventListener("click", () => imageInput.click());
}

async function addTweet() {
    const textEl = document.getElementById("text");
    const textInput = textEl.value;

    const user = auth.currentUser;
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const name = usernameSpan ? usernameSpan.textContent : (user.displayName || "User");
    const username = useridSpan ? useridSpan.textContent.replace("@", "") : (user.email ? user.email.split("@")[0] : user.uid.slice(0, 8));

    const hasImage = Boolean(imageInput && imageInput.files && imageInput.files[0]);
    if (!textInput.trim() && !hasImage) return;

    let imageUrl = null;
    if (hasImage) {
        const file = imageInput.files[0];
        const safeName = file.name.replace(/\s+/g, "-");

        try {
            const storageRef = ref(storage, `images/${user.uid}-${Date.now()}-${safeName}`);
            await uploadBytes(storageRef, file);
            imageUrl = await getDownloadURL(storageRef);
        } catch (error) {
            console.error("Image upload failed", error);
            alert("Image upload failed. Check Firebase Storage rules and try again.");
            return;
        }
    }

    await addDoc(collection(db, "tweets"), {
        name: name,
        username: username,
        text: textInput,
        time: Date.now(),
        imageUrl: imageUrl,
        likeCount: 0
    });

    textEl.value = "";
    if (imageInput) {
        imageInput.value = "";
    }
    await loadTweets();
}

const feed = document.getElementById("feed");

async function loadTweets() {
    feed.innerHTML = "";

    const tweetsQuery = query(collection(db, "tweets"), orderBy("time", "desc"));
    const querySnapshot = await getDocs(tweetsQuery);

    querySnapshot.forEach((doc) => {
        const data = doc.data();

        const tweet = createTweet(doc.id, data.name, data.username, data.text, data.imageUrl, data.likeCount ?? 0, data.time);
        feed.append(tweet);
    });
}

loadTweets();

function formatRelativeTime(timestamp) {
    const now = Date.now();
    const diffMs = Math.max(0, now - (timestamp || now));
    const sec = Math.floor(diffMs / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);

    if (sec < 60) return `${sec}s`;
    if (min < 60) return `${min}m`;
    if (hr < 24) return `${hr}h`;
    if (day < 7) return `${day}d`;

    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function createTweet(id, name, username, text, imageUrl, likeCount, timestamp) {
    const tweet = document.createElement("div");
    tweet.classList.add("tweet");

    tweet.innerHTML = `
        <i class="tweet-avatar fa-solid fa-circle-user"></i>
        <div class="tweet-content">
            <div class="tweet-header">
                <span class="tweet-name">${name}</span>
                <span class="tweet-username">@${username}</span>
                <span class="tweet-time">· ${formatRelativeTime(timestamp)}</span>
            </div>
            <div class="tweet-text">${text}</div>
            ${imageUrl ? `<img class="tweet-image" src="${imageUrl}" alt="Tweet image" />` : ""}
            <div class="tweet-actions">
                <i class="fa-regular fa-comment"></i>
                <span class="tweet-like" data-id="${id}">
                    <i class="fa-regular fa-heart"></i>
                    <span class="like-count">${likeCount}</span>
                </span>
                <i class="fa-solid fa-retweet"></i>
                <i class="fa-regular fa-chart-bar"></i>
            </div>
        </div>
    `;

    const likeWrapper = tweet.querySelector(".tweet-like");
    if (likeWrapper) {
        if ((likeCount ?? 0) > 0) {
            likeWrapper.classList.add("liked");
        }

        likeWrapper.addEventListener("click", async () => {
            const likeSpan = likeWrapper.querySelector(".like-count");
            const current = parseInt(likeSpan.textContent || "0", 10);
            const newCount = current + 1;
            likeSpan.textContent = newCount;
            likeWrapper.classList.add("liked");

            const tweetRef = doc(db, "tweets", id);
            await updateDoc(tweetRef, { likeCount: newCount });
        });
    }

    return tweet;
}

const postButton = document.getElementById("post");

postButton.addEventListener("click", addTweet);


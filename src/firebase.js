import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, addDoc, getDocs,
  query, orderBy, serverTimestamp, deleteDoc, doc, where
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Only initialize if we have the config
const isConfigured = !!firebaseConfig.apiKey;

let app, db, auth;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (e) {
    console.error("Firebase initialization error:", e);
  }
}

export { db, auth, isConfigured };

export async function saveResultToFirebase(resultData) {
  if (!isConfigured || !db) {
    console.warn("Firebase is not configured. Saving result locally to localStorage.");
    return saveLocally(resultData);
  }
  try {
    const docRef = await addDoc(collection(db, "interview_results"), {
      ...resultData,
      timestamp: serverTimestamp()
    });
    console.log("Document written with ID: ", docRef.id);
    return true;
  } catch (e) {
    console.error("Error adding document: ", e);
    console.warn("Falling back to localStorage due to Firestore write error.");
    return saveLocally(resultData);
  }
}

function saveLocally(resultData) {
  try {
    const localResults = JSON.parse(localStorage.getItem("offline_results") || "[]");
    const newRecord = {
      id: "offline-" + Date.now(),
      ...resultData,
      timestamp: { seconds: Math.floor(Date.now() / 1000) }
    };
    localResults.unshift(newRecord);
    localStorage.setItem("offline_results", JSON.stringify(localResults));
    return true;
  } catch (err) {
    console.error("Local save failed:", err);
    return false;
  }
}

export async function fetchAllResults() {
  if (!isConfigured || !db) {
    return fetchLocally();
  }
  try {
    const q = query(collection(db, "interview_results"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error fetching results: ", e);
    console.warn("Falling back to localStorage due to Firestore fetch error.");
    return fetchLocally();
  }
}

function fetchLocally() {
  try {
    return JSON.parse(localStorage.getItem("offline_results") || "[]");
  } catch (err) {
    return [];
  }
}

export async function deleteResult(id) {
  if (!isConfigured || !db) {
    return deleteLocally(id);
  }
  try {
    await deleteDoc(doc(db, "interview_results", id));
    return true;
  } catch (e) {
    console.error("Error deleting document: ", e);
    console.warn("Falling back to localStorage delete.");
    return deleteLocally(id);
  }
}

function deleteLocally(id) {
  try {
    const localResults = JSON.parse(localStorage.getItem("offline_results") || "[]");
    const filtered = localResults.filter(r => r.id !== id);
    localStorage.setItem("offline_results", JSON.stringify(filtered));
    return true;
  } catch (err) {
    return false;
  }
}

export async function deleteAllResults() {
  if (!isConfigured || !db) {
    return deleteAllLocally();
  }
  try {
    const snapshot = await getDocs(collection(db, "interview_results"));
    await Promise.all(snapshot.docs.map(d => deleteDoc(doc(db, "interview_results", d.id))));
    return true;
  } catch (e) {
    console.error("Error deleting all documents: ", e);
    console.warn("Falling back to localStorage delete all.");
    return deleteAllLocally();
  }
}

function deleteAllLocally() {
  try {
    localStorage.setItem("offline_results", "[]");
    return true;
  } catch (err) {
    return false;
  }
}

export async function fetchResultsByEmail(email) {
  if (!isConfigured || !db) {
    return fetchLocallyByEmail(email);
  }
  try {
    const q = query(
      collection(db, "interview_results"),
      where("email", "==", email),
      orderBy("timestamp", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.warn("Index query failed, falling back to in-memory filter:", e);
    try {
      const allQ = query(collection(db, "interview_results"), orderBy("timestamp", "desc"));
      const snapshot = await getDocs(allQ);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(r => r.email === email);
    } catch (err2) {
      console.error("Secondary fetch fallback failed: ", err2);
      return fetchLocallyByEmail(email);
    }
  }
}

function fetchLocallyByEmail(email) {
  try {
    const localResults = JSON.parse(localStorage.getItem("offline_results") || "[]");
    return localResults.filter(r => r.email === email);
  } catch (err) {
    return [];
  }
}

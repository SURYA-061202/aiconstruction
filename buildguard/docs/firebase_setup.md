# Firebase Setup: Preserving Chat Sessions & Responses

To create a ChatGPT-style persistent history, you can integrate Google Firebase with Firestore Database. Below is the proposed data schema and configuration details.

---

## 1. Firebase Firestore Data Model

### Structure Overview

Create a parent collection named `sessions` to hold separate historical conversation contexts. Each session document can contain metadata and an inner collection for individual messages.

```text
/sessions/ (Collection)
  └─ [sessionId] (Document)
       ├─ title: "New York City 5-Story Schedule..." (String)
       ├─ primaryFile: "plan.pdf" (String or URL)
       ├─ createdAt: September 19, 2026 (Timestamp)
       └─ messages/ (Sub-collection)
            └─ [messageId] (Document)
                 ├─ role: "user" | "agent" | "system" (String)
                 ├─ content: "Create a 12-month schedule..." (String)
                 └─ timestamp: September 19, 2026 (Timestamp)
```

---

## 2. Technical Code Setup

### A. Initialization
Ensure you have the Firebase SDK installed:
```bash
npm install firebase
```

Initialize Firebase in a separate config (e.g., `src/firebase.js`):
```javascript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

---

## 3. Integrating with Dashboard hooks

### A. Load Sessions on Mount
Use a `useEffect` to fetch sessions in chronological order:
```javascript
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

useEffect(() => {
    const q = query(collection(db, "sessions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSessions(loaded);
    });
    return () => unsubscribe();
}, []);
```

### B. Append New Message (Save data)
Inside your `handleRunAnalysis` execution callback:
```javascript
import { addDoc, collection, serverTimestamp, doc, updateDoc } from "firebase/firestore";

// IF NEW SESSION, CREATE CONTAINER
if (!activeSessionId) {
    const sessionRef = await addDoc(collection(db, "sessions"), {
        title: label.slice(0, 35),
        createdAt: serverTimestamp()
    });
    setActiveSessionId(sessionRef.id);
}

// APPEND MESSAGE TO SUBCOLLECTION
await addDoc(collection(db, "sessions", activeSessionId, "messages"), {
    role: "user",
    content: label,
    timestamp: serverTimestamp()
});
```

---

*Note: For File uploads, it is recommended to store uploaded Files in **Firebase Storage** and append the obtained Download URL within the prompt response hooks.*

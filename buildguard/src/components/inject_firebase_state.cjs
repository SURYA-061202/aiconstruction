const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Dashboard.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Inject Firestore Imports
const importTarget = `import ReactMarkdown from 'react-markdown';`;
const importReplacement = `import ReactMarkdown from 'react-markdown';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';`;

if (content.includes(importTarget)) {
    content = content.replace(importTarget, importReplacement);
}

// 2. Replace the local sync useEffect
const effectPattern = /useEffect\(\(\) => \{\s*if\s*\(activeSessionId\)\s*\{\s*setSessions\([\s\S]*?\}\s*\},\s*\[chatHistory,\s*activeSessionId\]\);/i;

const effectReplacement = `// Load Session List from Firebase
    useEffect(() => {
        const q = query(collection(db, "sessions"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSessions(loaded);
        });
        return () => unsubscribe();
    }, []);

    // Load Messages for Active Session
    useEffect(() => {
        if (!activeSessionId) { setChatHistory([]); return; }
        const q = query(collection(db, "sessions", activeSessionId, "messages"), orderBy("timestamp", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setChatHistory(snapshot.docs.map(d => {
                const data = d.data();
                return { id: d.id, ...data, timestamp: data.timestamp?.toDate() || new Date() };
            }));
        });
        return () => unsubscribe();
    }, [activeSessionId]);`;

if (effectPattern.test(content)) {
    content = content.replace(effectPattern, effectReplacement);
    console.log('Injected messages snapshot effect');
}

// 3. Update handleRunAnalysis
const handlePattern = /let currentId = activeSessionId;[\s\S]*?setChatHistory\(p => \[\.\.\.p, \{ role: 'agent', content: res\.chat_response, timestamp: new Date\(\) \} \]\);[\s\S]*?\} catch \(e\)/;

// Since handlePattern might break on variable spacing, we can just replace specifically inside handleRunAnalysis
const runAnalysisPattern = /const handleRunAnalysis = async \([\s\S]*?setPromptText\(''\);[\s\S]*?try \{[\s\S]*?if \(res\?\.chat_response\)[\s\S]*?setChatHistory\(p => \[\.\.\.p, \{ role: 'agent'[\s\S]*?timestamp: new Date\(\) \}\]\);[\s\S]*?\} catch \(e\)[\s\S]*?\}/;

// Better yet, just find the precise local state creation:
const localStateCreation = `let currentId = activeSessionId;
        if (!currentId) {
            currentId = Date.now().toString();
            setActiveSessionId(currentId);
            setSessions(p => [{ id: currentId, title: label.slice(0, 35) + (label.length > 35 ? '...' : ''), messages: [] }, ...p]);
        }`;

const firebaseStateCreation = `let currentId = activeSessionId;
        try {
            if (!currentId) {
                const docRef = await addDoc(collection(db, "sessions"), {
                    title: label.slice(0, 35) + (label.length > 35 ? '...' : ''),
                    createdAt: serverTimestamp()
                });
                currentId = docRef.id;
                setActiveSessionId(currentId);
            }`;

if (content.includes(localStateCreation)) {
    content = content.replace(localStateCreation, firebaseStateCreation);
    
    // Also remove local setChatHistory push right after it
    const localPush = `setChatHistory(p => [...p, { role: 'user', content: label, file: primaryFile?.name, timestamp: new Date() }]);`;
    const firebasePush = `await addDoc(collection(db, "sessions", currentId, "messages"), {
                role: 'user',
                content: label,
                file: primaryFile?.name || '',
                timestamp: serverTimestamp()
            });`;
    
    content = content.replace(localPush, firebasePush);
    
    // Replace agent append
    const localAgent = `if (res?.chat_response)
                setChatHistory(p => [...p, { role: 'agent', content: res.chat_response, timestamp: new Date() }]);`;
    const firebaseAgent = `if (res?.chat_response) {
                await addDoc(collection(db, "sessions", currentId, "messages"), {
                    role: 'agent',
                    content: res.chat_response,
                    timestamp: serverTimestamp()
                });
            }`;
    content = content.replace(localAgent, firebaseAgent);
    console.log('Injected handleRunAnalysis sync writes');
}

// 4. Update sidebar "New Chat" button to remove setChatHistory([])
const sidebarButton = `onClick={() => { setActiveSessionId(null); setChatHistory([]); }}`;
const sidebarButtonNew = `onClick={() => setActiveSessionId(null)}`;

if (content.includes(sidebarButton)) {
    content = content.replace(sidebarButton, sidebarButtonNew);
}

// Update sidebar map iteration loads
const sidebarMap = `onClick={() => { setActiveSessionId(s.id); setChatHistory(s.messages); }}`;
const sidebarMapNew = `onClick={() => setActiveSessionId(s.id)}`;

if (content.includes(sidebarMap)) {
    content = content.replace(sidebarMap, sidebarMapNew);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Executed all firebase injections');

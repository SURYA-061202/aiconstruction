const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Dashboard.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Imports
const importTarget = `import ReactMarkdown from 'react-markdown';`;
const importReplacement = `import ReactMarkdown from 'react-markdown';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';`;

if (content.includes(importTarget)) {
    content = content.replace(importTarget, importReplacement);
}

// 2. Line split approach for UseEffects and handleRunAnalysis
let lines = content.split('\n');

// Find the local useEffect from previous steps (Lines 153-157)
let uEffectStart = -1, uEffectEnd = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('if (activeSessionId)') && lines[i].includes('setSessions')) {
        // found inside useEffect
        uEffectStart = i - 1; // useEffect start
        uEffectEnd = i + 2;   // useEffect end
        break;
    }
}

if (uEffectStart !== -1) {
    const replacement = `    // Load Session List from Firebase
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
    
    // replace lines[uEffectStart] to lines[uEffectEnd]
    lines.splice(uEffectStart, uEffectEnd - uEffectStart + 1, replacement);
    console.log('Replaced local useEffect');
}

// 3. handleRunAnalysis Line Replace
content = lines.join('\n'); // Rejoin to perform regex on handleRunAnalysis

const handlePattern = /const handleRunAnalysis = async \([\s\S]*?const prompt[\s\S]*?return;[\s\S]*?const label[\s\S]*?const res = await performValidation[\s\S]*?setChatHistory[\s\S]*?\} catch \(e\)[\s\S]*?\};/;

const handleReplacement = `const handleRunAnalysis = async (override) => {
        const prompt = typeof override === 'string' ? override : promptText;
        if (!primaryFile && !prompt && !selectedSkill) return;
        
        const label = prompt || (selectedSkill
            ? \`Executing Skill: \${skills.flatMap(c => c.skills).find(s => s.id === selectedSkill)?.name || selectedSkill}\`
            : 'Run Analysis');

        setPromptText('');
        let currentId = activeSessionId;
        
        try {
            if (!currentId) {
                const docRef = await addDoc(collection(db, "sessions"), {
                    title: label.slice(0, 35) + (label.length > 35 ? '...' : ''),
                    createdAt: serverTimestamp()
                });
                currentId = docRef.id;
                setActiveSessionId(currentId);
            }

            await addDoc(collection(db, "sessions", currentId, "messages"), {
                role: 'user',
                content: label,
                file: primaryFile?.name || '',
                timestamp: serverTimestamp()
            });

            const res = await performValidation({ primaryFile, skillId: selectedSkill, prompt, checklistFile });
            if (res?.chat_response) {
                await addDoc(collection(db, "sessions", currentId, "messages"), {
                    role: 'agent',
                    content: res.chat_response,
                    timestamp: serverTimestamp()
                });
            }
        } catch (e) {
            if (e.message !== 'Analysis stopped by user.' && currentId) {
                await addDoc(collection(db, "sessions", currentId, "messages"), {
                    role: 'system',
                    content: \`Error: \${e.message}\`,
                    isError: true,
                    timestamp: serverTimestamp()
                });
            }
        }
    };`;

if (handlePattern.test(content)) {
    content = content.replace(handlePattern, handleReplacement);
    console.log('Updated handleRunAnalysis inline');
}

// 4. Sidebar update
content = content.replace('onClick={() => { setActiveSessionId(null); setChatHistory([]); }}', 'onClick={() => setActiveSessionId(null)}');
content = content.replace('onClick={() => { setActiveSessionId(s.id); setChatHistory(s.messages); }}', 'onClick={() => setActiveSessionId(s.id)}');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Script injection complete');

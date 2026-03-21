const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Dashboard.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Update Style Tag
const styleTarget = `.exec-btn:hover{background:#1534a0;transform:translateY(-1px);box-shadow:0 4px 14px \${C.accentBlue}40}`;

const styleReplacement = `.exec-btn:hover{background:#111827;transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.12)}
                .exec-btn:disabled{background:#E5E7EB;color:#9CA3AF;cursor:not-allowed;transform:none;box-shadow:none;border:1px solid #D1D5DB}`;

if (content.includes(styleTarget)) {
    content = content.replace(styleTarget, styleReplacement);
    console.log('1. Updated .exec-btn style triggers');
} else {
    // If spaces differ, use simple replace
    content = content.replace(/\.exec-btn:hover\{[^}]*\}/, `.exec-btn:hover{background:#111827;transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.12)}
                .exec-btn:disabled{background:#E5E7EB;color:#9CA3AF;cursor:not-allowed;transform:none;box-shadow:none}`);
}

// 2. Add Disabled state on executing button element
let lines = content.split('\n');
let count = 0;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('className="exec-btn"') && lines[i].includes('onClick=')) {
        lines[i] = lines[i].replace('className="exec-btn"', 'className="exec-btn" disabled={!primaryFile && !promptText && !selectedSkill}');
        count++;
    }
}

if (count > 0) {
    content = lines.join('\n');
    console.log(`2. Added disabled prop on ${count} Execute buttons`);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Button configurations applied');

const fs = require('fs');
const path = require('path');

const file = 'c:\\Users\\surya\\OneDrive\\Desktop\\Construction\\buildguard\\src\\components\\Dashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// Find the motion.aside style section and append display: 'flex'
const target = `boxShadow: '2px 0 16px rgba(28,35,64,0.06)'`;
const replacement = `boxShadow: '2px 0 16px rgba(28,35,64,0.06)',\n                                display: 'flex', flexDirection: 'column'`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    // Also add flexShrink: 0 to the bottom panel to be safe
    const bottomPanel = `padding: '16px', borderTop: ` + '`1px solid ${C.inkFaint}`' + `, display: 'flex', flexDirection: 'column', gap: 12, background: C.surface, position: 'relative', zIndex: 110`;
    const bottomPanelRepl = bottomPanel + `, flexShrink: 0`;
    if (content.includes(bottomPanel)) {
        content = content.replace(bottomPanel, bottomPanelRepl);
    }
    fs.writeFileSync(file, content, 'utf8');
    console.log('Sidebar height fixed successfully!');
} else {
    console.log('Target styling not found!');
}

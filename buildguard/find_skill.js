const fs = require('fs');
const lines = fs.readFileSync('src/components/Dashboard.jsx', 'utf8').split('\n');
lines.forEach((l, i) => {
    if(l.includes('setSelectedSkill')) {
        console.log((i+1) + ': ' + l.trim());
    }
});

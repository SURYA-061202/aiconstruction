import sys

path = r"c:\Users\surya\OneDrive\Desktop\Construction\buildguard\src\components\Dashboard.jsx"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Exact substitutions for target lines
content = content.replace("background: 'rgba(0,0,0,0.2)'", "background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'")
content = content.replace("background: 'rgba(255,255,255,0.02)'", "background: 'rgba(0,0,0,0.01)'")
content = content.replace("background: 'rgba(255,255,255,0.03)'", "background: 'rgba(0,0,0,0.02)'")
content = content.replace('borderBottom: rIdx < data.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none"', 'borderBottom: rIdx < data.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none"')
content = content.replace('border: 1px solid rgba(255,255,255,0.05)', 'border: 1px solid rgba(0,0,0,0.05)')
content = content.replace('background: rgba(56, 189, 248, 0.02)', 'background: rgba(56, 189, 248, 0.05)')
content = content.replace('background: rgba(0,0,0,0.2)', 'background: #F8FAFC')
content = content.replace('color: "rgba(255,255,255,0.2)"', 'color: "rgba(0,0,0,0.2)"')
content = content.replace('background: "rgba(255,255,255,0.03)"', 'background: "rgba(0,0,0,0.02)"')
content = content.replace('color: "rgba(255,255,255,0.4)"', 'color: "rgba(15,23,42,0.6)"')

# Also ComplianceCard.jsx
path_card = r"c:\Users\surya\OneDrive\Desktop\Construction\buildguard\src\components\ComplianceCard.jsx"
with open(path_card, 'r', encoding='utf-8') as f:
    content_card = f.read()

content_card = content_card.replace("background: 'rgba(0,0,0,0.2)'", "background: 'rgba(15,23,42,0.04)'")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

with open(path_card, 'w', encoding='utf-8') as f:
    f.write(content_card)

print("Done")

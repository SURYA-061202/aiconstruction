import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, FileUp, Zap, FileIcon, FileText,
    MessageSquare, ClipboardCheck, ChevronDown,
    AlertCircle, Bot, User, Download, Image as ImageIcon,
    Check, Loader, Circle, Edit3, Sparkles, X, Plus,
    PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
    Maximize2, Minimize2, MoreVertical, Trash2, Edit2
} from 'lucide-react';
import { useRckEngine } from '../hooks/useRckEngine';
import ComplianceCard from './ComplianceCard';
import ReactMarkdown from 'react-markdown';
import { db, auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';

/* ═══════════════════════════════════════════
   DESIGN TOKENS — Warm Ivory / Ink-Blue
═══════════════════════════════════════════ */
const C = {
    canvas: '#F9FAFB',
    surface: '#FFFFFF',
    surfaceAlt: '#F3F4F6',
    ink: '#111827',
    inkLight: '#374151',
    inkMuted: '#6B7280',
    inkFaint: '#E5E7EB',
    accentBlue: '#111827',
    accentTeal: '#4B5563', 
    accentRed: '#111827',  
    accentAmber: '#6B7280', 
    accentGreen: '#111827', 
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
    shadowMd: '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
    shadowLg: '0 12px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.04)',
    fontDisplay: '"Inter", "SF Pro Display", system-ui, sans-serif',
    fontBody: '"Inter", "SF Pro Text", system-ui, sans-serif',
    fontMono: "'JetBrains Mono', 'Fira Code', monospace",
};

/* ═══════════════════════════════════════════
   PRIMITIVES
═══════════════════════════════════════════ */
const Label = ({ children, style }) => (
    <p style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
        color: C.inkMuted, fontFamily: C.fontMono, marginBottom: 8, ...style
    }}>
        {children}
    </p>
);

const Chip = ({ children, color = C.accentBlue }) => (
    <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px',
        fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        fontFamily: C.fontMono, background: `${color}12`, color, borderRadius: 3,
        border: `1px solid ${color}25`
    }}>
        {children}
    </span>
);

const StatusDot = ({ live }) => (
    <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
        {live && <span style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: C.accentAmber, animation: 'rck-ping 1.4s ease-in-out infinite'
        }} />}
        <span style={{
            width: 8, height: 8, borderRadius: '50%', display: 'block',
            background: live ? C.accentAmber : C.accentGreen
        }} />
    </span>
);

const UploadZone = ({ file, onFile, id, label, Icon, color }) => (
    <div>
        <Label>{label}</Label>
        <div onClick={() => document.getElementById(id).click()}
            style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                borderRadius: 8, cursor: 'pointer', border: `1.5px dashed ${file ? color : C.inkFaint}`,
                background: file ? `${color}07` : C.surfaceAlt, transition: 'all 0.18s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `${color}10`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = file ? color : C.inkFaint; e.currentTarget.style.background = file ? `${color}07` : C.surfaceAlt; }}>
            <input type="file" id={id} style={{ display: 'none' }} onChange={e => onFile(e.target.files[0])} />
            <Icon size={14} color={file ? color : C.inkMuted} />
            <span style={{
                flex: 1, fontSize: 11, fontWeight: 500, color: file ? C.ink : C.inkMuted,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
                {file ? file.name : 'Choose file…'}
            </span>
            {file && (
                <button onClick={e => { e.stopPropagation(); onFile(null); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkMuted, padding: 0 }}>
                    <X size={11} />
                </button>
            )}
        </div>
    </div>
);

const SmallBtn = ({ children, onClick }) => (
    <button onClick={onClick}
        style={{
            padding: '4px 12px', background: C.accentBlue, color: '#fff', border: 'none',
            borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: C.fontBody
        }}>
        {children}
    </button>
);

/* ═══════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════ */
const Dashboard = () => {
    const [primaryFile, setPrimaryFile] = useState(null);
    const [checklistFile, setChecklistFile] = useState(null);
    const [selectedSkill, setSelectedSkill] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [promptText, setPromptText] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [ledgerOpen, setLedgerOpen] = useState(true);
    const [chatHistory, setChatHistory] = useState([]);
    const [isParamModalOpen, setIsParamModalOpen] = useState(false);
    const [pendingSugText, setPendingSugText] = useState('');
    const [requiredFields, setRequiredFields] = useState([]);
    const [paramsData, setParamsData] = useState({});
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [loadStep, setLoadStep] = useState(0);
    const [lastAutoOpenedId, setLastAutoOpenedId] = useState(null);
    const [justGenerated, setJustGenerated] = useState(false);
    
    // Session Sidebar Context Handlers
    const [hoveredSessionId, setHoveredSessionId] = useState(null);
    const [openSessionMenuId, setOpenSessionMenuId] = useState(null);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [sessionToRename, setSessionToRename] = useState(null);
    const [newSessionName, setNewSessionName] = useState('');
    const [ledgerExpanded, setLedgerExpanded] = useState(false);

    const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const loadingSteps = [
        'Initializing RCK Intelligence framework…',
        'Analyzing uploaded documents & plan layouts…',
        'Executing assigned Personas & Agents Axis…',
        'Processing compliance validation benchmarks…',
        'Synthesizing final response summary…',
    ];

    const { performValidation, stopValidation, loading, data, setData, error, skills } = useRckEngine();

    useEffect(() => {
        let t;
        if (loading) {
            setLoadStep(0);
            t = setInterval(() => setLoadStep(p => p < loadingSteps.length - 1 ? p + 1 : p), 6000);
        }
        return () => clearInterval(t);
    }, [loading]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, loading]);
        // Reset session-specific state buffers on session switch
    useEffect(() => {
        setPromptText('');
        setParamsData({});
        setJustGenerated(false);
    }, [activeSessionId]);

    // Load Session List from Firebase
    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, "users", auth.currentUser.uid, "sessions"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSessions(loaded);
        }, (err) => console.error("Session errors:", err));
        return () => unsubscribe();
    }, []);

    // Load Messages for Active Session
    useEffect(() => {
        if (!activeSessionId || !db) { setChatHistory([]); return; }
        const q = query(collection(db, "users", auth.currentUser.uid, "sessions", activeSessionId, "messages"), orderBy("timestamp", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(d => {
                const data = d.data();
                return { id: d.id, ...data, timestamp: data.timestamp?.toDate() || new Date() };
            });
            setChatHistory(msgs);
        }, (err) => console.error("Message errors:", err));
        return () => unsubscribe();
    }, [activeSessionId]);

    // Auto-open REFINE_FORM modal when agent sends it
    useEffect(() => {
        if (chatHistory.length === 0) return;
        const lastMsg = chatHistory[chatHistory.length - 1];
        if (justGenerated && lastMsg.role === 'agent' && lastMsg.content.includes('[REFINE_FORM:')) {
            const m = lastMsg.content.match(/\[REFINE_FORM:\s*([\s\S]*?)\]\s*\]/i);
            const body = m?.[1]?.trim();
            if (body) {
                let fields = [];
                try { fields = JSON.parse(body.replace(/[\u201C\u201D\u2018\u2019]/g, '"')); }
                catch { fields = body.replace(/[\[\]]/g, '').split(',').map(f => f.trim().replace(/^["']|["']$/g, '')).filter(Boolean); }
                
                setJustGenerated(false);
                setPendingSugText('Refine request with parameters:');
                setRequiredFields(fields);
                setParamsData({});
                setIsParamModalOpen(true);
                setLastAutoOpenedId(lastMsg.id); // mark as auto-opened
            }
        }
    }, [chatHistory, lastAutoOpenedId, justGenerated]);

    const handleRunAnalysis = async (override) => {
        const prompt = typeof override === 'string' ? override : promptText;
        if (!primaryFile && !prompt && !selectedSkill) return;
        
        const label = prompt || (selectedSkill
            ? `Executing Skill: ${skills.flatMap(c => c.skills).find(s => s.id === selectedSkill)?.name || selectedSkill}`
            : 'Run Analysis');

        setPromptText('');
        let currentId = activeSessionId;
        
        try {
            if (!currentId) {
                const docRef = await addDoc(collection(db, "users", auth.currentUser.uid, "sessions"), {
                    title: label.slice(0, 35) + (label.length > 35 ? '...' : ''),
                    createdAt: serverTimestamp()
                });
                currentId = docRef.id;
                setActiveSessionId(currentId);
            }

            await addDoc(collection(db, "users", auth.currentUser.uid, "sessions", currentId, "messages"), {
                role: 'user',
                content: label,
                file: primaryFile?.name || '',
                timestamp: serverTimestamp()
            });

            const res = await performValidation({ primaryFile, skillId: selectedSkill, prompt, checklistFile });
            if (res) {
                await updateDoc(doc(db, "users", auth.currentUser.uid, "sessions", currentId), {
                    ledgerData: JSON.stringify(res),
                    skillId: selectedSkill || ''
                });
            }
            if (res?.chat_response) {
                await addDoc(collection(db, "users", auth.currentUser.uid, "sessions", currentId, "messages"), {
                    role: 'agent',
                    content: res.chat_response,
                    timestamp: serverTimestamp()
                });
                setJustGenerated(true);
            }
        } catch (e) {
            if (e.message !== 'Analysis stopped by user.' && currentId) {
                await addDoc(collection(db, "users", auth.currentUser.uid, "sessions", currentId, "messages"), {
                    role: 'system',
                    content: `Error: ${e.message}`,
                    isError: true,
                    timestamp: serverTimestamp()
                });
            }
        } finally {
            setPrimaryFile(null);
            setChecklistFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteSession = async (id) => {
        try {
            await deleteDoc(doc(db, "users", auth.currentUser.uid, "sessions", id));
            if (activeSessionId === id) {
                setActiveSessionId(null);
                setSelectedSkill('');
                setSelectedCategory(null);
                setPrimaryFile(null);
                if (typeof setData === 'function') setData(null);
            }
        } catch (error) {
            console.error("Error deleting session:", error);
        }
        setOpenSessionMenuId(null);
    };

    const handleUpdateSessionName = async (e) => {
        e.preventDefault();
        if (!sessionToRename || !newSessionName.trim()) return;
        try {
            await updateDoc(doc(db, "users", auth.currentUser.uid, "sessions", sessionToRename.id), {
                title: newSessionName.trim()
            });
            setIsRenameModalOpen(false);
            setSessionToRename(null);
            setNewSessionName('');
        } catch (error) {
            console.error("Error updating session name:", error);
        }
        setOpenSessionMenuId(null);
    };

    const axis2 = data?.axis_detail?.axis2_output?.compliance || data?.axis2_output?.compliance || data?.checklist_results || [];
    const axis3 = data?.axis_detail?.axis3_output || data?.axis3_output || [];
    const results = [...axis2, ...axis3];
    const violations = results.filter(i => i.status === 'FAIL').length;
    const esreRaw = data?.verdict?.confidence_score || data?.esre_score;
    const esreScore = esreRaw ? Math.round(esreRaw * 100) : null;
    const hasLedger = results.length > 0 || (loading && primaryFile) || (!data && primaryFile);

    const dlImage = async (src, alt) => {
        try {
            const r = await fetch(src); if (!r.ok) throw new Error();
            const ct = r.headers.get('content-type') || '';
            const ext = ct.includes('webp') ? 'webp' : ct.includes('png') ? 'png' : 'jpg';
            const blob = await r.blob();
            const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${(alt || 'img').replace(/\W/g, '_')}.${ext}` });
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
        } catch { alert('Download failed.'); }
    };

    const exportExcel = (rows, headers) => {
        let h = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet1</x:Name></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>";
        h += '<tr>' + headers.map(k => `<th>${k.replace(/_/g, ' ')}</th>`).join('') + '</tr>';
        rows.forEach(r => { h += '<tr>' + headers.map(k => `<td>${(r[k] || '').toString()}</td>`).join('') + '</tr>'; });
        h += '</table></body></html>';
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([h], { type: 'application/vnd.ms-excel' })), download: 'RCK_Export.xls' });
        a.click();
    };

    const dlPDF = (msg, name) => {
        try {
            if (window.jspdf?.jsPDF) {
                const d = new window.jspdf.jsPDF();
                d.setFontSize(14); d.setFont('helvetica', 'bold'); d.text(name, 15, 20);
                d.setFontSize(10); d.setFont('helvetica', 'normal');
                const lines = d.splitTextToSize(msg.content.replace(/[*#`_~>\[\]]/g, '').trim(), 180);
                let y = 32; lines.forEach(l => { if (y > 280) { d.addPage(); y = 20; } d.text(l, 15, y); y += 6; });
                d.save(`${name.replace(/\s+/g, '_')}.pdf`);
            } else throw new Error();
        } catch { const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([msg.content], { type: 'text/plain' })), download: 'RCK_Document.txt' }); a.click(); }
    };

    const renderAgent = (msg) => {
        const frags = msg.content.split(/(\[IMAGE:\s*[\s\S]*?\]|\[TABLE:\s*[\s\S]*?\]\s*\]|\[SUGGESTION:\s*[\s\S]*?\]|\[REFINE_FORM:[\s\S]*?\]\s*\]|!\[.*?\]\(.*?\))/g);
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {frags.map((f, i) => {
                    if (!f) return null;

                    if (f.startsWith('[IMAGE:')) {
                        const m = f.match(/\[IMAGE:\s*([\s\S]*?)\]/i);
                        const desc = m?.[1]?.trim() || 'Image';
                        const short = desc.length > 50 ? desc.slice(0, 50) : desc;
                        let seed = 0; for (let ch of desc) seed = ch.charCodeAt(0) + ((seed << 5) - seed);
                        const url = `http://localhost:8000/v1/proxy-image?url=${encodeURIComponent(`https://image.pollinations.ai/prompt/${encodeURIComponent(short + ', construction')}?width=800&height=400&nologo=true&seed=${Math.abs(seed)}`)}&msgIdx=${i}`;
                        return (
                            <div key={i} style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.inkFaint}`, boxShadow: C.shadow }}>
                                <img src={url} alt={short} style={{ width: '100%', display: 'block', maxHeight: 360, objectFit: 'cover' }} />
                                <div style={{ padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.surfaceAlt }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.inkMuted }}><ImageIcon size={12} /> {short}</div>
                                    <SmallBtn onClick={() => dlImage(url, short)}>Download</SmallBtn>
                                </div>
                            </div>
                        );
                    }

                    if (f.startsWith('![')) {
                        const m = f.match(/!\[(.*?)\]\((.*?)\)/s);
                        const alt = m?.[1] || 'Image', src0 = m?.[2] || '';
                        const src = src0 && !src0.startsWith('http') ? `http://localhost:8000/v1/proxy-image?url=${encodeURIComponent(src0)}` : src0;
                        return (
                            <div key={i} style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.inkFaint}`, boxShadow: C.shadow }}>
                                <img src={src} alt={alt} style={{ width: '100%', display: 'block', maxHeight: 360, objectFit: 'cover' }} />
                                <div style={{ padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.surfaceAlt }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.inkMuted }}><ImageIcon size={12} />{alt}</div>
                                    <SmallBtn onClick={() => dlImage(src, alt)}>Download</SmallBtn>
                                </div>
                            </div>
                        );
                    }

                    if (f.startsWith('[TABLE:')) {
                        const m = f.match(/\[TABLE:\s*([\s\S]*?)\]/i);
                        if (m) try {
                            let raw = m[1].trim().replace(/\r?\n/g, ' ').replace(/(\{|,)\s*'([^']+)'\s*:/g, '$1"$2":').replace(/:\s*'([^']+)'/g, ':"$1"');
                            if (!raw.endsWith(']')) raw += raw.endsWith('}') ? ']' : '}]';
                            const rows = JSON.parse(raw);
                            if (Array.isArray(rows) && rows.length) {
                                const hdrs = Object.keys(rows[0]);
                                return (
                                    <div key={i} style={{ border: `1px solid ${C.inkFaint}`, borderRadius: 10, overflow: 'hidden', boxShadow: C.shadow }}>
                                        <div style={{ padding: '8px 14px', background: C.surfaceAlt, borderBottom: `1px solid ${C.inkFaint}`, display: 'flex', justifyContent: 'flex-end' }}>
                                            <button onClick={() => exportExcel(rows, hdrs)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px',
                                                    background: `${C.accentBlue}10`, color: C.accentBlue,
                                                    border: `1px solid ${C.accentBlue}30`, borderRadius: 5,
                                                    fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: C.fontBody
                                                }}>
                                                <Download size={10} /> Export Excel
                                            </button>
                                        </div>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                                <thead>
                                                    <tr style={{ background: `${C.accentBlue}06` }}>
                                                        {hdrs.map(h => (
                                                            <th key={h} style={{
                                                                padding: '10px 14px', textAlign: 'left', fontSize: 9, fontWeight: 700,
                                                                fontFamily: C.fontMono, letterSpacing: '0.1em', textTransform: 'uppercase',
                                                                color: C.accentBlue, borderBottom: `1px solid ${C.inkFaint}`
                                                            }}>
                                                                {h.replace(/_/g, ' ')}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {rows.map((row, ri) => (
                                                        <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : C.surfaceAlt, borderBottom: ri < rows.length - 1 ? `1px solid ${C.inkFaint}` : 'none' }}>
                                                            {hdrs.map(h => <td key={h} style={{ padding: '9px 14px', color: C.inkLight, fontSize: 12 }}>{row[h]}</td>)}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            }
                        } catch (e) { return <div key={i} style={{ color: C.accentRed, fontSize: 11 }}>[Table Error: {e.message}]</div>; }
                    }

                    if (f.startsWith('[SUGGESTION:')) {
                        const m = f.match(/\[SUGGESTION:\s*([\s\S]*?)\]/i);
                        const sug = m?.[1]?.trim(); if (!sug) return null;
                        return (
                            <button key={i} onClick={() => handleRunAnalysis(sug)}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 7,
                                    padding: '7px 16px', background: `${C.accentBlue}08`,
                                    color: C.accentBlue, border: `1px solid ${C.accentBlue}25`,
                                    borderRadius: 10, alignSelf: 'flex-start', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                    transition: 'all 0.15s', margin: '2px 6px 2px 0', fontFamily: C.fontBody
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = `${C.accentBlue}15`; e.currentTarget.style.borderColor = `${C.accentBlue}50`; }}
                                onMouseLeave={e => { e.currentTarget.style.background = `${C.accentBlue}08`; e.currentTarget.style.borderColor = `${C.accentBlue}25`; }}>
                                <Sparkles size={11} />{sug}
                            </button>
                        );
                    }

                    if (f.startsWith('[REFINE_FORM:')) {
                        const m = f.match(/\[REFINE_FORM:\s*([\s\S]*?)\]\s*\]/i);
                        const content = m?.[1]?.trim(); if (!content) return null;
                        try {
                            let fields = [];
                            try { fields = JSON.parse(content.replace(/[\u201C\u201D\u2018\u2019]/g, '"')); }
                            catch { fields = content.replace(/[\[\]]/g, '').split(',').map(f2 => f2.trim().replace(/^["']|["']$/g, '')).filter(Boolean); }
                            return (
                                <div key={i} style={{ alignSelf: 'flex-start' }}>
                                    <button onClick={() => { setPendingSugText('Refine request with parameters:'); setRequiredFields(fields); setParamsData({}); setIsParamModalOpen(true); }}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 8,
                                            padding: '8px 18px', background: `${C.accentTeal}10`,
                                            color: C.accentTeal, border: `1px solid ${C.accentTeal}35`,
                                            borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                            transition: 'background 0.15s', fontFamily: C.fontBody
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = `${C.accentTeal}20`}
                                        onMouseLeave={e => e.currentTarget.style.background = `${C.accentTeal}10`}>
                                        <Edit3 size={12} /> Fill Details Form
                                    </button>
                                </div>
                            );
                        } catch (e) { return <div key={i} style={{ color: C.accentRed, fontSize: 11 }}>[Form Error: {e.message}]</div>; }
                    }

                    return (
                        <ReactMarkdown key={i}
                            components={{
                                a: ({ node, ...props }) => {
                                    const isDoc = String(props.children).toLowerCase().includes('download') || props.href?.includes('.pdf') || props.href === '#';
                                    if (isDoc) return (
                                        <div style={{
                                            margin: '8px 0', padding: '12px 16px', border: `1px solid ${C.inkFaint}`,
                                            borderRadius: 10, background: C.surface, display: 'flex',
                                            justifyContent: 'space-between', alignItems: 'center', boxShadow: C.shadow
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ padding: 10, background: `${C.accentBlue}10`, borderRadius: 8, color: C.accentBlue }}><FileText size={16} /></div>
                                                <div>
                                                    <p style={{ fontSize: 12, fontWeight: 700, color: C.ink, margin: 0 }}>{props.children}</p>
                                                    <p style={{ fontSize: 10, color: C.inkMuted, margin: '2px 0 0' }}>Generated Document · PDF</p>
                                                </div>
                                            </div>
                                            <button onClick={e => { e.preventDefault(); dlPDF(msg, String(props.children)); }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px',
                                                    background: C.accentBlue, color: '#fff', border: 'none', borderRadius: 7,
                                                    fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: C.fontBody
                                                }}>
                                                <Download size={12} /> PDF
                                            </button>
                                        </div>
                                    );
                                    return <a {...props} style={{ color: C.accentBlue, textDecoration: 'underline' }} />;
                                }
                            }}>
                            {f}
                        </ReactMarkdown>
                    );
                })}
            </div>
        );
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;600;700&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                @keyframes rck-ping { 0%{transform:scale(1);opacity:0.6} 70%{transform:scale(2.2);opacity:0} 100%{opacity:0} }
                @keyframes rck-spin { to{transform:rotate(360deg)} }
                .rck-scroll::-webkit-scrollbar{width:4px}
                .rck-scroll::-webkit-scrollbar-track{background:transparent}
                .rck-scroll::-webkit-scrollbar-thumb{background:${C.inkFaint};border-radius:2px}
                .rck-scroll::-webkit-scrollbar-thumb:hover{background:${C.inkMuted}}
                .rck-prose{font-family:${C.fontBody};color:${C.inkLight};line-height:1.75;font-size:13.5px}
                .rck-prose p{margin:0 0 10px;color:${C.inkLight}}
                .rck-prose p:last-child{margin-bottom:0}
                .rck-prose h1,.rck-prose h2,.rck-prose h3{font-family:${C.fontDisplay};color:${C.ink};margin:20px 0 8px;font-weight:700;line-height:1.3}
                .rck-prose h1{font-size:20px}.rck-prose h2{font-size:17px}.rck-prose h3{font-size:14px}
                .rck-prose ul,.rck-prose ol{padding-left:22px;margin:8px 0 12px;color:${C.inkLight};font-size:13px;line-height:1.7}
                .rck-prose li{margin-bottom:5px}
                .rck-prose strong{color:${C.ink};font-weight:700}
                .rck-prose em{color:${C.inkLight};font-style:italic}
                .rck-prose code{background:${C.surfaceAlt};color:${C.accentBlue};padding:2px 6px;border-radius:4px;font-size:11.5px;font-family:${C.fontMono};border:1px solid ${C.inkFaint}}
                .rck-prose pre{background:${C.surfaceAlt};border:1px solid ${C.inkFaint};border-radius:8px;padding:14px 16px;overflow-x:auto;margin:12px 0}
                .rck-prose pre code{background:none;padding:0;border:none;font-size:12px;color:${C.inkLight}}
                .rck-prose blockquote{border-left:3px solid ${C.accentBlue};padding:8px 16px;margin:10px 0;background:${C.surfaceAlt};border-radius:0 6px 6px 0;color:${C.inkLight}}
                .rck-prose a{color:${C.accentBlue};text-decoration:underline}
                .rck-prose hr{border:none;border-top:1px solid ${C.inkFaint};margin:16px 0}
                .prompt-box{width:100%;min-height:60px;padding:14px 136px 14px 16px;background:${C.surface};border:1.5px solid ${C.inkFaint};border-radius:12px;color:${C.ink};font-size:13.5px;font-family:${C.fontBody};line-height:1.6;resize:none;outline:none;transition:border-color .2s,box-shadow .2s;box-shadow:0 1px 4px rgba(28,35,64,0.04)}
                .prompt-box:focus{border-color:${C.accentBlue};box-shadow:0 0 0 3px ${C.accentBlue}14,0 1px 4px rgba(28,35,64,0.06)}
                .prompt-box::placeholder{color:${C.inkMuted}}
                .exec-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 20px;background:${C.accentBlue};color:#fff;border:none;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;font-family:${C.fontBody};letter-spacing:.03em;transition:all .15s;white-space:nowrap}
                .exec-btn:hover{background:#000000;transform:translateY(-1px);box-shadow:0 4px 14px ${C.accentBlue}40}
                .stop-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;background:#fff;color:${C.accentRed};border:1.5px solid ${C.accentRed}40;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;font-family:${C.fontBody};transition:all .15s}
                .stop-btn:hover{background:${C.accentRed}08}
                .skill-select{width:100%;padding:9px 32px 9px 12px;background:${C.surface};border:1.5px solid ${C.inkFaint};border-radius:8px;color:${C.ink};font-size:12px;font-family:${C.fontBody};cursor:pointer;outline:none;appearance:none;-webkit-appearance:none;transition:border-color .2s;box-shadow:0 1px 3px rgba(28,35,64,0.04)}
                .skill-select:focus{border-color:${C.accentBlue}}
                .skill-select option,.skill-select optgroup{background:${C.surface};color:${C.ink}}
                .modal-input{width:100%;padding:10px 13px;background:${C.surface};border:1.5px solid ${C.inkFaint};border-radius:8px;color:${C.ink};font-size:12px;font-family:${C.fontBody};outline:none;transition:border-color .2s,box-shadow .2s}
                .modal-input:focus{border-color:${C.accentBlue};box-shadow:0 0 0 3px ${C.accentBlue}12}
                .modal-input::placeholder{color:${C.inkMuted}}
                .sidebar-nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;cursor:pointer;transition:background .15s;border:none;background:transparent;width:100%;text-align:left;font-family:${C.fontBody}}
                .sidebar-nav-item:hover{background:${C.surfaceAlt}}
            `}</style>

            <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.canvas, fontFamily: C.fontBody, color: C.ink }}>

                {/* ══════════ SIDEBAR ══════════ */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 284, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            style={{
                                height: '100%', background: C.surface,
                                borderRight: `1px solid ${C.inkFaint}`, flexShrink: 0, overflow: 'hidden',
                                boxShadow: '2px 0 16px rgba(28,35,64,0.06)',
                                display: 'flex', flexDirection: 'column'
                            }}>
                            <div style={{ width: 284, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                                {/* Logo / Wordmark */}
                                <div style={{
                                    height: 64, padding: '0 20px', display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between', borderBottom: `1px solid ${C.inkFaint}`, flexShrink: 0
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                                        <img src="/images/indianinfra.png" alt="Logo" style={{ width: 34, height: 34, borderRadius: 9, objectFit: 'cover' }} />



                                        <div>
                                            <p style={{
                                                fontSize: 14, fontWeight: 700, fontFamily: C.fontDisplay,
                                                color: C.ink, lineHeight: 1.1, letterSpacing: '-0.01em'
                                            }}>RCK Portal</p>
                                            <p style={{
                                                fontSize: 8, fontFamily: C.fontMono, color: C.inkMuted,
                                                letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 1
                                            }}>
                                                Intelligence Engine
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSidebarOpen(false)}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: C.inkMuted, display: 'flex', padding: 5, borderRadius: 6,
                                            transition: 'color .15s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.color = C.ink}
                                        onMouseLeave={e => e.currentTarget.style.color = C.inkMuted}>
                                        <PanelLeftClose size={15} />
                                    </button>
                                </div>

                                {/* Content */}
                                <div style={{ padding: '24px 18px', display: 'flex', flexDirection: 'column', gap: 26, flex: 1, minHeight: 0 }}>

                                    {/* Skillset */}
                                    <div>
                                        <Label>Agent Skillset</Label>
                                        {skills.length > 0 && (
                                            <div style={{ position: 'relative' }}>
                                                {/* Overlay transparent layer to close on Click Outside */}
                                                {skillDropdownOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setSkillDropdownOpen(false)} />}
                                                
                                                <div onClick={() => setSkillDropdownOpen(!skillDropdownOpen)} style={{
                                                    width: '100%', padding: '10px 12px', background: C.surface,
                                                    border: `1px solid ${C.inkFaint}`, borderRadius: 8, textAlign: 'left',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    cursor: 'pointer', fontFamily: C.fontBody, fontSize: 13, color: C.ink,
                                                    position: 'relative', zIndex: 95
                                                }}>
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {selectedSkill 
                                                            ? skills.flatMap(c => c.skills).find(s => s.id === selectedSkill)?.name || 'Select Skill'
                                                            : 'Select a Planning Agent Skill…'}
                                                    </span>
                                                    <ChevronDown size={13} color={C.inkMuted} style={{ transform: skillDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.15s' }} />
                                                </div>

                                                <AnimatePresence>
                                                    {skillDropdownOpen && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: 4 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: 4 }}
                                                            transition={{ duration: 0.15 }}
                                                            style={{
                                                                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                                                                background: C.surface, border: `1px solid ${C.inkFaint}`,
                                                                borderRadius: 8, boxShadow: C.shadowMd, zIndex: 100,
                                                                maxHeight: 240, overflowY: 'auto', padding: 4
                                                            }} className="rck-scroll">
                                                            
                                                            <div onClick={() => { setSelectedSkill(''); setSelectedCategory(null); setSkillDropdownOpen(false); }} style={{
                                                                padding: '8px 12px', fontSize: 12, cursor: 'pointer', borderRadius: 6,
                                                                color: C.inkMuted, transition: 'all 0.12s'
                                                            }} onMouseEnter={e => { e.currentTarget.style.background = '#111827'; e.currentTarget.style.color = '#FFFFFF'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.inkMuted; }}>
                                                                Select a Planning Agent Skill…
                                                            </div>

                                                            {!selectedCategory ? (
                                                                skills.map(cat => (
                                                                    <div key={cat.id} onClick={(e) => { e.stopPropagation(); setSelectedCategory(cat.id); }} style={{
                                                                        padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderRadius: 6,
                                                                        color: C.ink, transition: 'all 0.12s', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                                                    }} onMouseEnter={e => { e.currentTarget.style.background = '#111827'; e.currentTarget.style.color = '#FFFFFF'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.ink; }}>
                                                                        {cat.name}
                                                                        <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <>
                                                                    <div onClick={(e) => { e.stopPropagation(); setSelectedCategory(null); }} style={{
                                                                        padding: '8px 12px', fontSize: 11, cursor: 'pointer', borderRadius: 6,
                                                                        color: C.inkMuted, transition: 'all 0.12s', display: 'flex', alignItems: 'center', gap: 6,
                                                                        marginBottom: 4, background: C.surfaceAlt, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase'
                                                                    }} onMouseEnter={e => { e.currentTarget.style.background = C.inkFaint; }} onMouseLeave={e => { e.currentTarget.style.background = C.surfaceAlt; }}>
                                                                        <ChevronDown size={13} style={{ transform: 'rotate(90deg)' }} /> {skills.find(c => c.id === selectedCategory)?.name || 'Back'}
                                                                    </div>
                                                                    {skills.find(c => c.id === selectedCategory)?.skills.map(s => (
                                                                        <div key={s.id} onClick={(e) => { e.stopPropagation(); setSelectedSkill(s.id); setSkillDropdownOpen(false); setSelectedCategory(null); }} style={{
                                                                            padding: '7px 12px', fontSize: 13, cursor: 'pointer', borderRadius: 6,
                                                                            color: selectedSkill === s.id ? '#FFFFFF' : C.ink,
                                                                            background: selectedSkill === s.id ? '#111827' : 'transparent',
                                                                            transition: 'all 0.12s', display: 'flex', alignItems: 'center', gap: 6
                                                                        }} onMouseEnter={e => { if (selectedSkill !== s.id) { e.currentTarget.style.background = '#111827'; e.currentTarget.style.color = '#FFFFFF'; } }} onMouseLeave={e => { if (selectedSkill !== s.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.ink; } }}>
                                                                            {s.name}
                                                                        </div>
                                                                    ))}
                                                                </>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                    </div>

                                    {/* Divider */}
                                    <div style={{ height: 1, background: C.inkFaint }} />

                                    {/* Uploads */}
{/* Sessions History */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <Label style={{ marginBottom: 0 }}>Recent Sessions</Label>
                                            <button onClick={() => { setActiveSessionId(null); setSelectedSkill(''); setSelectedCategory(null); setPrimaryFile(null); if (typeof setData === 'function') setData(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 5, padding: '5px 9px',
                                                    background: `${C.accentBlue}10`, color: C.accentBlue, border: `1px solid ${C.accentBlue}25`,
                                                    borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: C.fontBody,
                                                    transition: 'all 0.15s'
                                                }}>
                                                <Plus size={11} /> New
                                            </button>
                                        </div>
                                        {openSessionMenuId && <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setOpenSessionMenuId(null)} />}
                                        <div className="rck-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 4 }}>
                                            {sessions.length === 0 ? (
                                                <p style={{ fontSize: 11, color: C.inkMuted, fontStyle: 'italic', textAlign: 'center', marginTop: 10 }}>No recent sessions</p>
                                            ) : (
                                                sessions.map(s => (
                                                    <div key={s.id} style={{ position: 'relative' }} 
                                                        onMouseEnter={() => setHoveredSessionId(s.id)}
                                                        onMouseLeave={() => setHoveredSessionId(null)}>
                                                        
                                                        <button onClick={() => { setActiveSessionId(s.id); setSelectedSkill(s.skillId || ''); setSelectedCategory(null); setPrimaryFile(null); if (typeof setData === 'function') { try { setData(typeof s.ledgerData === 'string' ? JSON.parse(s.ledgerData) : (s.ledgerData || null)); } catch(e) { setData(s.ledgerData || null); } } if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                                                                background: s.id === activeSessionId ? `${C.accentBlue}08` : C.surfaceAlt,
                                                                border: s.id === activeSessionId ? `1px solid ${C.accentBlue}15` : `1px solid ${C.inkFaint}30`,
                                                                borderRadius: 8, cursor: 'pointer', textAlign: 'left', width: '100%',
                                                                transition: 'all 0.15s'
                                                            }}
                                                            onMouseEnter={e => { if (s.id !== activeSessionId) e.currentTarget.style.background = `${C.accentBlue}04`; }}
                                                            onMouseLeave={e => { if (s.id !== activeSessionId) e.currentTarget.style.background = C.surfaceAlt; }}>
                                                            <MessageSquare size={14} color={C.inkLight} />
                                                            <span style={{ fontSize: 12, fontWeight: s.id === activeSessionId ? 600 : 500, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {s.title}
                                                            </span>
                                                        </button>

                                                        {/* 3-dots Context Menu Trigger */}
                                                        {(hoveredSessionId === s.id || openSessionMenuId === s.id) && (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setOpenSessionMenuId(openSessionMenuId === s.id ? null : s.id); }}
                                                                style={{
                                                                    position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                                                                    background: openSessionMenuId === s.id ? C.surfaceAlt : 'transparent',
                                                                    border: 'none', borderRadius: 4, padding: 4, cursor: 'pointer',
                                                                    color: C.inkMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                                                                    transition: 'all .15s'
                                                                }}
                                                                onMouseEnter={e => e.currentTarget.style.background = C.surfaceAlt}
                                                                onMouseLeave={e => { if (openSessionMenuId !== s.id) e.currentTarget.style.background = 'transparent'; }}>
                                                                <MoreVertical size={14} />
                                                            </button>
                                                        )}

                                                        {/* Context Menu Dropdown */}
                                                        <AnimatePresence>
                                                            {openSessionMenuId === s.id && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                                                    transition={{ duration: 0.1 }}
                                                                    style={{
                                                                        position: 'absolute', right: 8, top: 'calc(50% + 14px)',
                                                                        background: C.surface, border: `1px solid ${C.inkFaint}`,
                                                                        borderRadius: 8, boxShadow: C.shadowLg, zIndex: 100,
                                                                        padding: 4, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 120
                                                                    }}>
                                                                    <button onClick={(e) => { e.stopPropagation(); setSessionToRename(s); setNewSessionName(s.title); setIsRenameModalOpen(true); setOpenSessionMenuId(null); }}
                                                                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'transparent', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 600, color: C.inkLight, cursor: 'pointer', transition: 'all .1s' }}
                                                                        onMouseEnter={e => { e.currentTarget.style.background = C.surfaceAlt; e.currentTarget.style.color = C.ink; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.inkLight; }}>
                                                                        <Edit2 size={12} /> Rename
                                                                    </button>
                                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
                                                                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'transparent', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 600, color: C.accentRed, cursor: 'pointer', transition: 'all .1s' }}
                                                                        onMouseEnter={e => { e.currentTarget.style.background = `${C.accentRed}12`; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                                                                        <Trash2 size={12} /> Delete
                                                                    </button>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* fluid spacer removed for expansion */}

                                    
                                </div>
                            </div>

                            <div style={{ padding: '16px', borderTop: 'none', display: 'flex', flexDirection: 'column', gap: 12, background: C.surface, flexShrink: 0, zIndex: 110 }}>
                                {/* Engine status */}
                                <div style={{
                                    padding: '13px 15px', background: loading ? `${C.accentAmber}08` : `${C.accentGreen}08`,
                                    borderRadius: 10, border: `1px solid ${loading ? C.accentAmber : C.accentGreen}25`
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <StatusDot live={loading} />
                                        <span style={{
                                            fontSize: 9, fontWeight: 700, fontFamily: C.fontMono, letterSpacing: '0.12em',
                                            color: loading ? C.accentAmber : C.accentGreen
                                        }}>
                                            {loading ? 'STREAMING_SESSION' : 'RCK_READY'}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: 9, color: C.inkMuted, fontFamily: C.fontMono, letterSpacing: '0.06em' }}>
                                        PLUGIN: ALL-DOC-DRAWINGS-V1
                                    </p>
                                </div>

                                {/* User Profile & Logout */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: `1px solid ${C.inkFaint}` }}>
                                    <div>
                                        <p style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{auth.currentUser?.email?.split('@')[0] || 'User'}</p>
                                        <p style={{ fontSize: 9, color: '#6B7280' }}>{auth.currentUser?.email}</p>
                                    </div>
                                    <button onClick={() => { signOut(auth); }} style={{ background: 'transparent', border: '1px solid #EF444430', cursor: 'pointer', color: '#EF4444', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 6 }}>Logout</button>
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* ══════════ WORKSPACE ══════════ */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

                    {/* Top bar */}
                    <div style={{
                        height: 64, padding: '0 28px', display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', background: C.surface,
                        borderBottom: `1px solid ${C.inkFaint}`, flexShrink: 0
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            {!sidebarOpen && (
                                <button onClick={() => setSidebarOpen(true)}
                                    style={{
                                        background: C.surfaceAlt, border: `1px solid ${C.inkFaint}`,
                                        borderRadius: 7, padding: '6px 8px', cursor: 'pointer',
                                        color: C.inkMuted, display: 'flex', transition: 'all .15s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = C.inkMuted}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = C.inkFaint}>
                                    <PanelLeftOpen size={14} />
                                </button>
                            )}
                            <h2 style={{
                                fontFamily: C.fontDisplay, fontSize: 17, fontWeight: 700,
                                color: C.ink, letterSpacing: '-0.02em'
                            }}>
                                Workspace
                            </h2>
                        </div>
                        {hasLedger && !ledgerOpen && (
                            <button onClick={() => setLedgerOpen(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6, background: C.surfaceAlt,
                                    border: `1px solid ${C.inkFaint}`, borderRadius: 7, padding: '6px 14px',
                                    cursor: 'pointer', color: C.inkLight, fontSize: 11, fontWeight: 600, fontFamily: C.fontBody,
                                    transition: 'all .15s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = C.inkMuted}
                                onMouseLeave={e => e.currentTarget.style.borderColor = C.inkFaint}>
                                <PanelRightOpen size={13} /> Ledger
                            </button>
                        )}
                    </div>

                    {/* Chat messages */}
                    <div className="rck-scroll" style={{ flex: 1, overflowY: 'auto', padding: '36px 64px' }}>
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 30 }}>

                            {chatHistory.length === 0 && !loading && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                    style={{ textAlign: 'center', marginTop: 90 }}>
                                    <div style={{
                                        width: 72, height: 72, borderRadius: '50%', margin: '0 auto 18px',
                                        background: `linear-gradient(135deg, ${C.accentBlue}10 0%, ${C.accentTeal}10 100%)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: `1.5px solid ${C.inkFaint}`, boxShadow: C.shadow
                                    }}>
                                        <Bot size={28} color={C.inkMuted} strokeWidth={1.5} />
                                    </div>
                                    <p style={{ fontFamily: C.fontDisplay, fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
                                        How can I assist today?
                                    </p>
                                    <p style={{ fontSize: 13, color: C.inkMuted, lineHeight: 1.6 }}>
                                        Upload a construction plan or select a skill to begin your analysis.
                                    </p>
                                </motion.div>
                            )}

                            {chatHistory.map((msg, i) => (
                                <motion.div key={i}
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
                                    style={{
                                        display: 'flex', flexDirection: 'column', gap: 6,
                                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                        alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                        maxWidth: msg.role === 'user' ? '65%' : '100%',
                                        width: msg.role === 'user' ? undefined : '100%'
                                    }}>

                                    {/* Role label */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {msg.role === 'user' ? (
                                            <>
                                                <span style={{ fontSize: 9, color: C.inkMuted, fontFamily: C.fontMono, fontWeight: 700, letterSpacing: '0.1em' }}>YOU</span>
                                                <User size={11} color={C.inkMuted} />
                                            </>
                                        ) : msg.role === 'agent' ? (
                                            <>
                                                <Bot size={13} color={C.accentBlue} />
                                                <span style={{ fontSize: 9, color: C.accentBlue, fontFamily: C.fontMono, fontWeight: 700, letterSpacing: '0.1em' }}>AGENT</span>
                                            </>
                                        ) : (
                                            <span style={{ fontSize: 9, color: C.accentRed, fontFamily: C.fontMono, fontWeight: 700 }}>SYSTEM</span>
                                        )}
                                    </div>

                                    {/* Message bubble */}
                                    <div style={{
                                        padding: msg.role === 'agent' ? '0' : '12px 16px',
                                        borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : 0,
                                        background: msg.role === 'user' ? C.accentBlue : msg.isError ? `${C.accentRed}06` : 'transparent',
                                        border: msg.role === 'user' ? 'none' : msg.isError ? `1px solid ${C.accentRed}20` : 'none',
                                        color: msg.role === 'user' ? '#fff' : msg.isError ? C.accentRed : C.ink,
                                        boxShadow: msg.role === 'user' ? `0 2px 10px ${C.accentBlue}30` : 'none',
                                    }}>
                                        {msg.role === 'agent'
                                            ? <div className="rck-prose">{renderAgent(msg)}</div>
                                            : <div>
                                                {msg.file && (
                                                    <div style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                                        fontSize: 9, background: 'rgba(255,255,255,0.2)',
                                                        padding: '2px 8px', borderRadius: 3, marginBottom: 6
                                                    }}>
                                                        <FileIcon size={9} />{msg.file}
                                                    </div>
                                                )}
                                                <p style={{ fontSize: 13, lineHeight: 1.65 }}>{msg.content}</p>
                                            </div>
                                        }
                                    </div>

                                    <span style={{ fontSize: 9, color: C.inkMuted, fontFamily: C.fontMono }}>
                                        {msg.timestamp?.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </motion.div>
                            ))}

                            {/* Loading stepper */}
                            <AnimatePresence>
                                {loading && (
                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        style={{ alignSelf: 'flex-start' }}>
                                        <div style={{
                                            padding: '16px 20px', border: `1px solid ${C.inkFaint}`, borderRadius: 12,
                                            background: C.surface, width: 'fit-content', minWidth: 320, boxShadow: C.shadow
                                        }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                                                paddingBottom: 10, borderBottom: `1px solid ${C.inkFaint}`
                                            }}>
                                                <Bot size={13} color={C.accentBlue} />
                                                <span style={{ fontSize: 9, color: C.accentBlue, fontWeight: 700, fontFamily: C.fontMono, letterSpacing: '0.1em' }}>
                                                    AGENT ANALYZING…
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                                                {loadingSteps.map((step, idx) => {
                                                    const done = idx < loadStep, cur = idx === loadStep;
                                                    return (
                                                        <div key={idx} style={{
                                                            display: 'flex', alignItems: 'center', gap: 10,
                                                            fontSize: 11, color: done ? C.inkMuted : cur ? C.ink : C.inkFaint,
                                                            opacity: done || cur ? 1 : 0.4
                                                        }}>
                                                            {done
                                                                ? <Check size={11} color={C.accentGreen} />
                                                                : cur
                                                                    ? <Loader size={11} color={C.accentBlue} style={{ animation: 'rck-spin 1s linear infinite' }} />
                                                                    : <Circle size={11} color={C.inkFaint} />}
                                                            {step}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div ref={chatEndRef} />
                        </div>
                    </div>

                    {/* Input bar */}
                    <div style={{
                        padding: '16px 64px 20px', background: C.surface,
                        borderTop: `1px solid ${C.inkFaint}`, flexShrink: 0
                    }}>
                        <div style={{ maxWidth: 740, margin: '0 auto' }}>
                            <Label>Agent Instructions</Label>
                            {primaryFile && (
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                                    background: `${C.accentBlue}10`, border: `1px solid ${C.accentBlue}25`,
                                    borderRadius: 5, marginBottom: 10
                                }}>
                                    <FileIcon size={10} color={C.accentBlue} />
                                    <span style={{
                                        fontSize: 10, fontWeight: 600, color: C.accentBlue,
                                        maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                    }}>
                                        {primaryFile.name}
                                    </span>
                                    <button onClick={() => setPrimaryFile(null)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkMuted, padding: 0 }}>
                                        <X size={10} />
                                    </button>
                                </div>
                            )}
                            <div style={{ position: 'relative' }}>
                                <textarea className="prompt-box"
                                    placeholder="Instruct the agent… e.g. 'Identify critical path risks.'"
                                    value={promptText}
                                    onChange={e => setPromptText(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (!primaryFile && !promptText && !selectedSkill) { alert('Please upload a plan, enter a prompt, or select a skill.'); return; }
                                            if (primaryFile && typeof primaryFile.size === 'undefined') { alert('Please re-upload the file to execute analysis.'); return; }
                                            handleRunAnalysis();
                                        }
                                    }}
                                />
                                <div style={{ position: 'absolute', right: 12, bottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input type="file" id="prompt-file" ref={fileInputRef} style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setPrimaryFile(e.target.files[0]); }} />
                                    <label htmlFor="prompt-file" style={{
                                        width: 32, height: 32, background: C.surfaceAlt, border: `1px solid ${C.inkFaint}`,
                                        borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', color: C.inkLight, transition: 'all 0.15s'
                                    }} onMouseEnter={e => e.currentTarget.style.background = `${C.inkFaint}50`} onMouseLeave={e => e.currentTarget.style.background = C.surfaceAlt}>
                                        <FileUp size={14} />
                                    </label>
                                    {loading
                                        ? <button className="stop-btn" onClick={stopValidation}>Stop <Zap size={11} /></button>
                                        : <button className="exec-btn" onClick={() => {
                                            if (!primaryFile && !promptText && !selectedSkill) { alert('Please upload a plan, enter a prompt, or select a skill.'); return; }
                                            if (primaryFile && typeof primaryFile.size === 'undefined') { alert('Please re-upload the file to execute analysis.'); return; }
                                            handleRunAnalysis();
                                        }}>Execute <Zap size={11} /></button>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{
                        height: 38, background: C.surface, borderTop: `1px solid ${C.inkFaint}`,
                        display: 'flex', alignItems: 'center', padding: '0 32px', gap: 10, flexShrink: 0
                    }}>
                        <StatusDot live={loading} />
                        <span style={{ fontSize: 9, color: C.inkMuted, fontFamily: C.fontMono, letterSpacing: '0.08em' }}>
                            SESSION_ACTIVE // {new Date().toLocaleTimeString()}
                        </span>
                    </div>
                </div>

                {/* ══════════ LEDGER ══════════ */}
                <AnimatePresence>
                    {hasLedger && ledgerOpen && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: ledgerExpanded ? (sidebarOpen ? 'calc(50vw - 140px)' : '60vw') : (sidebarOpen ? 370 : 460), opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            style={{
                                height: '100%', background: C.surface,
                                borderLeft: `1px solid ${C.inkFaint}`, flexShrink: 0, overflow: 'hidden',
                                boxShadow: '-2px 0 16px rgba(28,35,64,0.06)'
                            }}>
                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>

                                {/* Ledger header */}
                                <div style={{
                                    height: 64, padding: '0 20px', display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between', borderBottom: `1px solid ${C.inkFaint}`
                                }}>
                                    <div>
                                        <p style={{ fontFamily: C.fontDisplay, fontSize: 15, fontWeight: 700, color: C.ink, lineHeight: 1 }}>
                                            Analysis Ledger
                                        </p>
                                        <p style={{
                                            fontSize: 9, fontFamily: C.fontMono, color: C.inkMuted,
                                            letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3
                                        }}>
                                            Compliance Results
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        {esreScore !== null && <Chip color={C.accentBlue}>{esreScore}% reliable</Chip>}
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button onClick={() => setLedgerExpanded(!ledgerExpanded)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkMuted, display: 'flex', padding: 4 }}
                                                title={ledgerExpanded ? "Minimize Ledger" : "Maximize Ledger"}>
                                                {ledgerExpanded ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
                                            </button>
                                            <button onClick={() => { setLedgerOpen(false); setLedgerExpanded(false); }}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkMuted, display: 'flex', padding: 4 }}
                                                title="Close Ledger">
                                                <PanelRightClose size={15} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="rck-scroll" style={{ padding: 20, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

                                    {error && (
                                        <div style={{
                                            padding: '12px 14px', background: `${C.accentRed}08`,
                                            border: `1px solid ${C.accentRed}25`, borderRadius: 10,
                                            color: C.accentRed, fontSize: 12, display: 'flex', gap: 8, alignItems: 'flex-start'
                                        }}>
                                            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                                            <span><strong>Error:</strong> {error}</span>
                                        </div>
                                    )}

                                    {!data && !loading ? (
                                        <div style={{ textAlign: 'center', marginTop: 80 }}>
                                            <FileText size={40} strokeWidth={1} color={C.inkFaint} style={{ margin: '0 auto 14px', display: 'block' }} />
                                            <p style={{ fontFamily: C.fontDisplay, fontSize: 14, fontWeight: 600, color: C.inkMuted }}>
                                                Awaiting Stream
                                            </p>
                                            <p style={{ fontSize: 11, color: C.inkMuted, marginTop: 5 }}>
                                                Upload a construction plan to begin.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Score card */}
                                            <div style={{
                                                padding: '20px 22px', borderRadius: 12,
                                                background: `linear-gradient(135deg, ${C.accentBlue}07 0%, ${C.accentTeal}05 100%)`,
                                                border: `1px solid ${C.accentBlue}15`, boxShadow: C.shadow
                                            }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                                    <div>
                                                        <p style={{
                                                            fontSize: 9, fontWeight: 700, fontFamily: C.fontMono,
                                                            textTransform: 'uppercase', letterSpacing: '0.12em',
                                                            color: C.inkMuted, marginBottom: 6
                                                        }}>Violations</p>
                                                        <p style={{
                                                            fontFamily: C.fontDisplay, fontSize: 32, fontWeight: 800, lineHeight: 1,
                                                            color: violations > 0 ? C.accentRed : C.accentGreen
                                                        }}>
                                                            {violations.toString().padStart(2, '0')}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p style={{
                                                            fontSize: 9, fontWeight: 700, fontFamily: C.fontMono,
                                                            textTransform: 'uppercase', letterSpacing: '0.12em',
                                                            color: C.inkMuted, marginBottom: 6
                                                        }}>Intelligence Score</p>
                                                        <p style={{
                                                            fontFamily: C.fontDisplay, fontSize: 32, fontWeight: 800, lineHeight: 1,
                                                            color: C.accentBlue
                                                        }}>
                                                            {esreScore ? `${esreScore}%` : '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Compliance items */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {results.map((item, i) => <ComplianceCard key={item.id || i} item={item} index={i} />)}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* ══════════ RENAME MODAL ══════════ */}
                <AnimatePresence>
                    {isRenameModalOpen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{
                                position: 'fixed', inset: 0, background: 'rgba(28,35,64,0.30)',
                                backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', zIndex: 1000
                            }}>
                            <motion.div initial={{ scale: 0.95, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
                                style={{
                                    width: 360, background: C.surface, borderRadius: 16, padding: 24,
                                    boxShadow: C.shadowLg, border: `1px solid ${C.inkFaint}`,
                                    display: 'flex', flexDirection: 'column', gap: 20
                                }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 12, borderBottom: `1px solid ${C.inkFaint}` }}>
                                    <div>
                                        <p style={{ fontFamily: C.fontDisplay, fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 2 }}>Rename Session</p>
                                    </div>
                                    <button onClick={() => { setIsRenameModalOpen(false); setSessionToRename(null); }}
                                        style={{ background: C.surfaceAlt, border: `1px solid ${C.inkFaint}`, borderRadius: 7, padding: '4px', cursor: 'pointer', color: C.inkMuted, display: 'flex', transition: 'all .15s' }}>
                                        <X size={13} />
                                    </button>
                                </div>
                                <form onSubmit={handleUpdateSessionName} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <input type="text" className="prompt-box" style={{ minHeight: 'auto', padding: '10px 14px', fontSize: 13 }}
                                        value={newSessionName} onChange={e => setNewSessionName(e.target.value)} autoFocus placeholder="Session name..." />
                                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                        <button type="button" className="stop-btn" style={{ padding: '8px 16px', fontSize: 11 }} onClick={() => { setIsRenameModalOpen(false); setSessionToRename(null); }}>Cancel</button>
                                        <button type="submit" className="exec-btn" style={{ padding: '8px 16px', fontSize: 11 }} disabled={!newSessionName.trim()}>Save</button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ══════════ PARAM MODAL ══════════ */}
                <AnimatePresence>
                    {isParamModalOpen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{
                                position: 'fixed', inset: 0, background: 'rgba(28,35,64,0.30)',
                                backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', zIndex: 1000
                            }}>
                            <motion.div initial={{ scale: 0.95, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
                                style={{
                                    width: 420, background: C.surface, borderRadius: 16, padding: 28,
                                    boxShadow: C.shadowLg, border: `1px solid ${C.inkFaint}`,
                                    display: 'flex', flexDirection: 'column', gap: 20,
                                    maxHeight: '90vh', overflow: 'hidden'
                                }}>

                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                    paddingBottom: 16, borderBottom: `1px solid ${C.inkFaint}`
                                }}>
                                    <div>
                                        <p style={{ fontFamily: C.fontDisplay, fontSize: 17, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
                                            Refine Prompt
                                        </p>
                                        <p style={{ fontSize: 12, color: C.inkMuted, lineHeight: 1.5 }}>
                                            Fill in parameters to enrich your request.
                                        </p>
                                    </div>
                                    <button onClick={() => setIsParamModalOpen(false)}
                                        style={{
                                            background: C.surfaceAlt, border: `1px solid ${C.inkFaint}`,
                                            borderRadius: 7, padding: '6px 7px', cursor: 'pointer', color: C.inkMuted, display: 'flex',
                                            transition: 'all .15s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = C.inkMuted}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = C.inkFaint}>
                                        <X size={13} />
                                    </button>
                                </div>

                                <div className="rck-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', paddingRight: 4 }}>
                                    {requiredFields.map((field, idx) => (
                                        <div key={idx}>
                                            <label style={{
                                                fontSize: 10, fontWeight: 700, color: C.inkLight,
                                                display: 'block', marginBottom: 6, letterSpacing: '0.02em'
                                            }}>
                                                {field}
                                            </label>
                                            <input type="text" className="modal-input"
                                                value={paramsData[field] || ''}
                                                onChange={e => setParamsData({ ...paramsData, [field]: e.target.value })}
                                                placeholder={`Provide ${field}…`} />
                                        </div>
                                    ))}
                                </div>

                                <button className="exec-btn"
                                    style={{ justifyContent: 'center', padding: '12px 0', width: '100%', borderRadius: 10, fontSize: 13 }}
                                    onClick={() => {
                                        const extras = Object.entries(paramsData).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join(', ');
                                        handleRunAnalysis(extras ? `${pendingSugText} [Details: ${extras}]` : pendingSugText);
                                        setIsParamModalOpen(false); setParamsData({});
                                    }}>
                                    Submit Request
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </>
    );
};

export default Dashboard;
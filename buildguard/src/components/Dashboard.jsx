import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    FileUp,
    Zap,
    Layout,
    FileIcon,
    ShieldAlert,
    FileText,
    MessageSquare,
    Settings,
    ClipboardCheck,
    Cpu,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    Bot,
    User,
    Download,
    Image as ImageIcon
} from 'lucide-react';
import { useRckEngine } from '../hooks/useRckEngine';
import ComplianceCard from './ComplianceCard';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const Dashboard = () => {
    const [primaryFile, setPrimaryFile] = useState(null);
    const [checklistFile, setChecklistFile] = useState(null);
    const [selectedSkill, setSelectedSkill] = useState('');
    const [promptText, setPromptText] = useState('');
    const [expandedCategories, setExpandedCategories] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [ledgerOpen, setLedgerOpen] = useState(true);
    const [chatHistory, setChatHistory] = useState([]);
    const chatEndRef = useRef(null);

    const [loadStep, setLoadStep] = useState(0);
    const loadingSteps = [
        "Initializing RCK Intelligence framework...",
        "Analyzing uploaded documents & plan layouts...",
        "Executing assigned Personas & Agents Axis triggers...",
        "Processing compliance validation benchmarks...",
        "Synthesizing final response summary..."
    ];

    const { performValidation, stopValidation, loading, data, error, skills } = useRckEngine();

    useEffect(() => {
        let interval;
        if (loading) {
            setLoadStep(0);
            interval = setInterval(() => {
                setLoadStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
            }, 6000); 
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [loading]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory, loading]);

    const handleRunAnalysis = async (overridePrompt) => {
        const activePrompt = typeof overridePrompt === 'string' ? overridePrompt : promptText;
        if (!primaryFile && !activePrompt && !selectedSkill) return;

        const sentMsg = activePrompt || (selectedSkill ? `Executing Skill: ${skills.flatMap(c => c.skills).find(s => s.id === selectedSkill)?.name || selectedSkill}` : "Run Analysis");
        const userEntry = { role: 'user', content: sentMsg, file: primaryFile?.name, timestamp: new Date() };

        setChatHistory(prev => [...prev, userEntry]);
        const currentPrompt = activePrompt;
        setPromptText('');

        try {
            const resultData = await performValidation({
                primaryFile,
                skillId: selectedSkill,
                prompt: currentPrompt,
                checklistFile
            });

            if (resultData?.chat_response) {
                setChatHistory(prev => [...prev, { role: 'agent', content: resultData.chat_response, timestamp: new Date() }]);
            }
        } catch (err) {
            if (err.message !== 'Analysis stopped by user.') {
                setChatHistory(prev => [...prev, { role: 'system', content: `Error: ${err.message}`, isError: true, timestamp: new Date() }]);
            }
        }
    };

    const toggleCategory = (catId) => {
        setExpandedCategories(prev =>
            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
        );
    };

    // Data Extraction and Organization
    const axis2Results = data?.axis_detail?.axis2_output?.compliance || data?.axis2_output?.compliance || data?.checklist_results || [];
    const axis3Results = data?.axis_detail?.axis3_output || data?.axis3_output || [];
    const finalResults = [...axis2Results, ...axis3Results];

    const violationsCount = finalResults.filter(item => item.status === 'FAIL').length;
    const esreScore = data?.verdict?.confidence_score || data?.esre_score;
    const esreScoreValue = esreScore ? Math.round(esreScore * 100) : (data?.verdict?.confidence_score ? Math.round(data.verdict.confidence_score * 100) : null);

    // Determine if the ledger should be visible
    const hasLedgerResults = finalResults.length > 0 || (loading && primaryFile) || (!data && primaryFile);

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-deep)', color: 'white' }}>

            {/* Panel A: Configuration (Left) - Glassmorphism UI */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 320, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="glass-panel"
                        style={{ height: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ padding: '8px', background: 'var(--accent-primary)', borderRadius: '10px', color: '#0B0E14' }}>
                                    <Cpu size={24} />
                                </div>
                                <div>
                                    <h1 style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '0.05em' }}>RCK_PORTAL</h1>
                                    <p style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: '700' }}>DOM_ALL_DOC_SCHEDULER</p>
                                </div>
                            </div>
                            <button onClick={() => setSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <PanelLeftClose size={18} />
                            </button>
                        </div>

                        {/* Categorized Skills */}
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
                                <Settings size={10} /> Agent Skillset
                            </label>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {skills.length > 0 ? (
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            value={selectedSkill}
                                            onChange={(e) => setSelectedSkill(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px 32px 8px 12px', /* adjusted padding for height and arrow space */
                                                borderRadius: '6px',
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-glass)',
                                                outline: 'none',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '11px',
                                                cursor: 'pointer',
                                                appearance: 'none', /* hide default arrow */
                                                WebkitAppearance: 'none'
                                            }}
                                        >
                                            <option value="" style={{ background: '#0B0E14', color: 'var(--text-muted)' }}>Select a Planning Agent Skill...</option>
                                            {skills.map(category => (
                                                <optgroup key={category.id} label={category.name.toUpperCase()} style={{ background: '#0B0E14', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                                                    {category.skills.map(skill => (
                                                        <option key={skill.id} value={skill.id} style={{ background: '#0B0E14', color: 'var(--text-secondary)' }}>
                                                            {skill.name}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} color="var(--text-muted)" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {/* Upload Section */}
                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '9px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    Target Plan (PFD/DOCX)
                                </label>
                                <div
                                    className="glass-card"
                                    style={{ padding: '12px', textAlign: 'center', cursor: 'pointer', borderRadius: '10px' }}
                                    onClick={() => document.getElementById('primary-upload').click()}
                                >
                                    <input type="file" id="primary-upload" style={{ display: 'none' }} onChange={(e) => setPrimaryFile(e.target.files[0])} />
                                    <FileUp size={16} color={primaryFile ? 'var(--accent-primary)' : 'var(--text-muted)'} style={{ marginBottom: '4px' }} />
                                    <p style={{ fontSize: '10px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {primaryFile ? primaryFile.name : 'Target Plan'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '9px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    Optional Checklist
                                </label>
                                <div
                                    className="glass-card"
                                    style={{ padding: '12px', textAlign: 'center', cursor: 'pointer', borderRadius: '10px' }}
                                    onClick={() => document.getElementById('checklist-upload').click()}
                                >
                                    <input type="file" id="checklist-upload" style={{ display: 'none' }} onChange={(e) => setChecklistFile(e.target.files[0])} />
                                    <ClipboardCheck size={16} color={checklistFile ? 'var(--accent-teal)' : 'var(--text-muted)'} style={{ marginBottom: '4px' }} />
                                    <p style={{ fontSize: '10px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {checklistFile ? checklistFile.name : 'Checklist File'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Engine Info */}
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: loading ? 'var(--accent-orange)' : 'var(--accent-green)' }} />
                                <span style={{ fontSize: '9px', fontWeight: '800', color: loading ? 'var(--accent-orange)' : 'var(--accent-green)' }}>{loading ? 'STREAMING_SESSION' : 'RCK_READY'}</span>
                            </div>
                            <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                PLUGIN: ALL-DOC-DRAWINGS-V1
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Panel B: Command Center (Middle) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', borderLeft: '1px solid var(--border-glass)', borderRight: '1px solid var(--border-glass)' }}>
                <div style={{ height: '64px', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {!sidebarOpen && (
                            <button onClick={() => setSidebarOpen(true)} style={{ background: 'transparent', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <PanelLeftOpen size={14} />
                            </button>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <MessageSquare size={16} color="var(--accent-primary)" />
                            <h2 style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                                Command Center
                            </h2>
                        </div>
                    </div>
                    {hasLedgerResults && !ledgerOpen && (
                        <button onClick={() => setLedgerOpen(true)} style={{ background: 'transparent', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <PanelRightOpen size={14} />
                            <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>Ledger</span>
                        </button>
                    )}
                </div>

                <div className="chat-container" style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
                    <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* Chat History */}
                        {chatHistory.length === 0 && !loading && (
                            <div style={{ textAlign: 'center', marginTop: '100px', opacity: 0.3 }}>
                                <MessageSquare size={40} style={{ margin: '0 auto 16px' }} />
                                <h3>How can I help you today?</h3>
                            </div>
                        )}

                        {chatHistory.map((msg, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    gap: '8px',
                                    width: '100%'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {msg.role === 'user' ? (
                                        <>
                                            <h4 style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>You</h4>
                                            <User size={14} color="var(--text-muted)" />
                                        </>
                                    ) : msg.role === 'agent' ? (
                                        <>
                                            <Bot size={14} color="var(--accent-primary)" />
                                            <h4 style={{ fontSize: '10px', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agent</h4>
                                        </>
                                    ) : (
                                        <h4 style={{ fontSize: '10px', color: 'var(--accent-red)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>System</h4>
                                    )}
                                </div>

                                <div
                                    className={msg.role === 'agent' ? "agent-chat-reply markdown-body" : ""}
                                    style={{
                                        maxWidth: '100%',
                                        background: msg.role === 'user' ? 'rgba(255,255,255,0.05)' : msg.isError ? 'rgba(251, 113, 133, 0.1)' : 'transparent',
                                        padding: msg.role === 'user' ? '12px 16px' : msg.role === 'agent' ? '0' : '12px 16px',
                                        borderRadius: msg.role === 'user' ? '16px 16px 0 16px' : '8px',
                                        color: msg.isError ? 'var(--accent-red)' : 'var(--text-primary)',
                                        fontSize: '13px',
                                        lineHeight: '1.6',
                                        border: msg.role === 'user' ? '1px solid rgba(255,255,255,0.05)' : 'none'
                                    }}
                                >
                                    {msg.role === 'agent' ? (() => {
                                        if (!msg.content) return null;

                                        // Split by tags: [IMAGE: ...], [TABLE: ...], [SUGGESTION: ...] OR ![alt](url)
                                        const fragments = msg.content.split(/(\[IMAGE:\s*[\s\S]*?\]|\[TABLE:\s*[\s\S]*?\]|\[SUGGESTION:\s*[\s\S]*?\]|!\[.*?\]\(.*?\))/g);

                                        const handleDownload = async (src, alt) => {
                                            try {
                                                const response = await fetch(src);
                                                if (!response.ok) throw new Error("Fetch failed: " + response.status);
                                                const contentType = response.headers.get("content-type");
                                                if (contentType && contentType.includes("text/html")) throw new Error("Received HTML error");

                                                let ext = 'jpg';
                                                if (contentType) {
                                                    if (contentType.includes("webp")) ext = 'webp';
                                                    else if (contentType.includes("png")) ext = 'png';
                                                    else if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = 'jpg';
                                                }

                                                const blob = await response.blob();
                                                const url = window.URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = (alt || 'image').replace(/[^a-zA-Z0-9]/g, '_') + '.' + ext;
                                                document.body.appendChild(a);
                                                a.click();
                                                document.body.removeChild(a);
                                                window.URL.revokeObjectURL(url);
                                            } catch (err) {
                                                console.error('Download failed:', err);
                                                alert("Download failed. Generator server issue.");
                                            }
                                        };

                                        return (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {fragments.map((frag, idx) => {
                                                    if (!frag) return null;

                                                    // Case 1: [IMAGE: description]
                                                    if (frag.startsWith('[IMAGE:')) {
                                                        const match = frag.match(/\[IMAGE:\s*([\s\S]*?)\]/i);
                                                        const cleanDesc = match ? match[1].trim() : "Image";
                                                        // Substring to 50 chars FIRST
                                                        const shortDesc = cleanDesc.length > 50 ? cleanDesc.substring(0, 50) : cleanDesc;
                                                        // Append weight SECOND so it NEVER gets cut off!
                                                        const weightedDesc = shortDesc + ", construction";
                                                        const encoded = encodeURIComponent(weightedDesc);

                                                        let seed = 0;
                                                        for (let i = 0; i < cleanDesc.length; i++) seed = cleanDesc.charCodeAt(i) + ((seed << 5) - seed);

                                                        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encoded}?width=800&height=400&nologo=true&seed=${Math.abs(seed)}`;
                                                        const proxyUrl = `http://localhost:8000/v1/proxy-image?url=${encodeURIComponent(pollinationsUrl)}&msgIdx=${idx}`;

                                                        return (
                                                            <div key={idx} style={{ margin: '12px 0', border: '1px solid var(--border-glass)', borderRadius: '8px', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
                                                                <img src={proxyUrl} alt={shortDesc} style={{ width: '100%', display: 'block', maxHeight: '400px', objectFit: 'cover' }} />
                                                                <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                                        <ImageIcon size={14} /> <span>{shortDesc}</span>
                                                                    </div>
                                                                    <button onClick={() => handleDownload(proxyUrl, shortDesc)} style={{ padding: '4px 12px', background: 'var(--accent-primary)', color: '#000', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Download</button>
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    // Case 2: ![alt](url)
                                                    if (frag.startsWith('![')) {
                                                        const match = frag.match(/!\[(.*?)\]\((.*?)\)/s);
                                                        const alt = match ? match[1] : "Image";
                                                        let src = match ? match[2] : "";
                                                        if (src && !src.startsWith('http')) src = `http://localhost:8000/v1/proxy-image?url=${encodeURIComponent(src)}`;

                                                        return (
                                                            <div key={idx} style={{ margin: '12px 0', border: '1px solid var(--border-glass)', borderRadius: '8px', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
                                                                <img src={src} alt={alt} style={{ width: '100%', display: 'block', maxHeight: '400px', objectFit: 'cover' }} />
                                                                <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                                        <ImageIcon size={14} /> <span>{alt}</span>
                                                                    </div>
                                                                    <button onClick={() => handleDownload(src, alt)} style={{ padding: '4px 12px', background: 'var(--accent-primary)', color: '#000', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Download</button>
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    // Case 4: [TABLE: ...]
                                                    if (frag.startsWith('[TABLE:')) {
                                                        const match = frag.match(/\[TABLE:\s*([\s\S]*?)\]/i);
                                                        if (match) {
                                                            try {
                                                                let cleanedJson = match[1].trim();
                                                                // Strip unescaped line breaks that break JSON.parse
                                                                cleanedJson = cleanedJson.replace(/\r?\n/g, ' ');
                                                                 cleanedJson = cleanedJson.replace(/(\{|\,)\s*'([^']+)'\s*:/g, '$1"$2":');
                                                                 cleanedJson = cleanedJson.replace(/:\s*'([^']+)'/g, ':"$1"');
                                                                if (!cleanedJson.endsWith(']')) {
                                                                    if (cleanedJson.endsWith('}')) cleanedJson += ']';
                                                                    else cleanedJson += '}]';
                                                                }
                                                                const data = JSON.parse(cleanedJson);
                                                                if (Array.isArray(data) && data.length > 0) {
                                                                    const headers = Object.keys(data[0]);
                                                                    return (
                                                                        <div key={idx} style={{ margin: '16px 0', overflowX: 'auto', border: '1px solid var(--border-glass)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
                                                                            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                                                                                <button 
                                                                                    onClick={() => {
                                                                                        const csvString = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n" + data.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(",")).join("\n");
                                                                                        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                                                                                        const url = URL.createObjectURL(blob);
                                                                                        const link = document.createElement("a");
                                                                                        link.href = url;
                                                                                        link.setAttribute("download", "RCK_Table_Export.csv");
                                                                                        link.click();
                                                                                    }}
                                                                                    style={{ padding: '4px 10px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                                                >
                                                                                    <Download size={11} /> Export CSV
                                                                                </button>
                                                                            </div>
                                                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                                                                <thead>
                                                                                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-glass)' }}>
                                                                                        {headers.map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 'bold', color: 'var(--accent-primary)', textTransform: 'capitalize' }}>{h.replace(/_/g, ' ')}</th>)}
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {data.map((row, rIdx) => (
                                                                                        <tr key={rIdx} style={{ borderBottom: rIdx < data.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                                                                                            {headers.map(h => <td key={h} style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{row[h]}</td>)}
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    );
                                                                }
                                                            } catch (err) {
                                                                return <div key={idx} style={{ color: 'var(--accent-red)', fontSize: '11px', margin: '8px 0' }}>[Table Render Error: {err.message}]</div>;
                                                            }
                                                        }
                                                    }

                                                    // Case 5: [SUGGESTION: ...]
                                                    if (frag.startsWith('[SUGGESTION:')) {
                                                        const match = frag.match(/\[SUGGESTION:\s*([\s\S]*?)\]/i);
                                                        const sugText = match ? match[1].trim() : "";
                                                        if (sugText) {
                                                            return (
                                                                <button 
                                                                    key={idx}
                                                                    onClick={() => handleRunAnalysis(sugText)}
                                                                    style={{
                                                                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                                                                        padding: '8px 16px', background: 'rgba(56, 189, 248, 0.08)',
                                                                        color: 'var(--accent-primary)', border: '1px solid rgba(56, 189, 248, 0.2)',
                                                                        borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                                                                        cursor: 'pointer', transition: 'all 0.2s', margin: '4px 8px 4px 0'
                                                                    }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)'; e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.2)'; }}
                                                                >
                                                                    <MessageSquare size={13} />
                                                                    {sugText}
                                                                </button>
                                                            );
                                                        }
                                                    }

                                                    // Case 3: Standard Text
                                                    return (
                                                        <ReactMarkdown
                                                            key={idx}
                                                            components={{
                                                                a: ({ node, ...props }) => {
                                                                    const isDoc = (typeof props.children === 'string' && props.children.toLowerCase().includes('download')) || (props.children?.[0]?.toLowerCase?.()?.includes?.('download')) || props.href?.includes('.txt') || props.href?.includes('.pdf') || props.href === '#';
                                                                    if (isDoc) {
                                                                        return (
                                                                            <div style={{ margin: '12px 0', padding: '12px', border: '1px solid var(--border-glass)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                                    <div style={{ padding: '8px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '8px', color: 'var(--accent-primary)' }}><FileText size={18} /></div>
                                                                                    <div>
                                                                                        <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{props.children}</h4>
                                                                                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>Generated Document • PDF</p>
                                                                                    </div>
                                                                                </div>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.preventDefault();
                                                                                        try {
                                                                                            if (window.jspdf && window.jspdf.jsPDF) {
                                                                                                const doc = new window.jspdf.jsPDF();
                                                                                                doc.setFontSize(14); doc.setFont("helvetica", "bold");
                                                                                                doc.text(String(props.children[0] || props.children || 'Generated Document'), 15, 20);
                                                                                                doc.setFontSize(10); doc.setFont("helvetica", "normal");
                                                                                                const cleanText = msg.content.replace(/[*#`_~>\[\]]/g, '').trim();
                                                                                                const lines = doc.splitTextToSize(cleanText, 180);
                                                                                                let cursorY = 32;
                                                                                                lines.forEach(line => { if (cursorY > 280) { doc.addPage(); cursorY = 20; } doc.text(line, 15, cursorY); cursorY += 6; });
                                                                                                let filename = String(props.children[0] || props.children || 'RCK_Analysis').replace(/\s+/g, '_');
                                                                                                if (!filename.toLowerCase().endsWith('.pdf')) filename += '.pdf';
                                                                                                doc.save(filename);
                                                                                            } else throw new Error("jsPDF not loaded");
                                                                                        } catch (err) {
                                                                                            const blob = new Blob([msg.content], { type: 'text/plain' });
                                                                                            const url = URL.createObjectURL(blob);
                                                                                            const a = document.createElement('a'); a.href = url; a.download = 'RCK_Fallback_Document.txt'; a.click(); URL.revokeObjectURL(url);
                                                                                        }
                                                                                    }}
                                                                                    style={{ padding: '6px 16px', background: 'var(--accent-primary)', color: '#000', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                                                >
                                                                                    <Download size={14} /> Download PDF
                                                                                </button>
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return <a {...props} style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }} />;
                                                                }
                                                            }}
                                                        >
                                                            {frag}
                                                        </ReactMarkdown>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })() : (
                                        <div>
                                            {msg.file && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: 'var(--accent-primary)', marginBottom: '4px', background: 'rgba(56, 189, 248, 0.1)', padding: '4px 8px', borderRadius: '4px', width: 'fit-content' }}>
                                                    <FileIcon size={10} /> {msg.file}
                                                </div>
                                            )}
                                            {msg.content}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}

                        {/* Loading State */}
                        <AnimatePresence>
                            {loading && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="agent-chat-reply loading-pulse" style={{ alignSelf: 'flex-start', width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <Bot size={14} color="var(--accent-primary)" />
                                        <h4 style={{ fontSize: '10px', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{loadingSteps[loadStep]}</h4>
                                    </div>
                                    <div style={{ height: '40px', maxWidth: '200px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div ref={chatEndRef} />
                    </div>
                </div>

                {/* Fixed Input Area */}
                <div style={{ padding: '0 32px 24px 32px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: '100%', maxWidth: '640px' }}>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: '600' }}>AGENT_INSTRUCTIONS</p>
                        <div style={{ position: 'relative' }}>
                            {primaryFile && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '6px', width: 'fit-content', marginBottom: '12px' }}>
                                    <FileIcon size={12} color="var(--accent-primary)" />
                                    <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {primaryFile.name}
                                    </span>
                                    <button onClick={() => setPrimaryFile(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, marginLeft: '4px' }}>✕</button>
                                </div>
                            )}
                            <div style={{ position: 'relative' }}>
                                <textarea
                                    className="prompt-box"
                                    placeholder="Instruct the agent... e.g. 'Identify critical path risks.'"
                                    value={promptText}
                                    onChange={(e) => setPromptText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (!primaryFile && !promptText && !selectedSkill) {
                                                alert("Please upload a Target Plan, enter a Prompt, or select a Skill to execute.");
                                                return;
                                            }
                                            handleRunAnalysis();
                                        }
                                    }}
                                    style={{ minHeight: '90px', paddingRight: loading ? '200px' : '110px' }}
                                />
                                <div style={{ position: 'absolute', right: '12px', bottom: '12px', display: 'flex', gap: '8px' }}>
                                    {loading ? (
                                        <button
                                            className="portal-btn-tiny"
                                            onClick={stopValidation}
                                            style={{ background: 'rgba(251, 113, 133, 0.1)', color: 'var(--accent-red)', border: '1px solid var(--accent-red)' }}
                                        >
                                            Stop <Zap size={12} style={{ marginLeft: '4px' }} />
                                        </button>
                                    ) : (
                                        <button
                                            className="portal-btn-tiny"
                                            onClick={() => {
                                                if (!primaryFile && !promptText && !selectedSkill) {
                                                    alert("Please upload a Target Plan, enter a Prompt, or select a Skill to execute.");
                                                    return;
                                                }
                                                handleRunAnalysis();
                                            }}
                                        >
                                            Execute <Zap size={12} style={{ marginLeft: '4px' }} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ height: '56px', borderTop: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', padding: '0 32px', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    SESSION_ACTIVE // {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Panel C: Results & Validation (Right) */}
            <AnimatePresence>
                {hasLedgerResults && ledgerOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 450, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="glass-panel"
                        style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                    >
                        <div style={{ width: '450px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ height: '64px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between' }}>
                                <h3 style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Analysis_Ledger</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {esreScoreValue !== null && (
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-primary)', fontWeight: '700' }}>
                                            RELIABILITY: {esreScoreValue}%
                                        </div>
                                    )}
                                    <button onClick={() => setLedgerOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                        <PanelRightClose size={18} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                                <AnimatePresence mode="popLayout" initial={false}>
                                    {error && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '16px', background: 'rgba(251, 113, 133, 0.1)', border: '1px solid var(--accent-red)', borderRadius: '12px', color: 'var(--accent-red)', fontSize: '12px', marginBottom: '24px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <AlertCircle size={16} />
                                            <div><strong>Error:</strong> {error}</div>
                                        </motion.div>
                                    )}

                                    {!data && !loading ? (
                                        <div style={{ textAlign: 'center', marginTop: '100px', opacity: 0.2 }}>
                                            <FileText size={48} strokeWidth={1} style={{ marginBottom: '16px' }} />
                                            <h4 style={{ fontSize: '12px', fontWeight: '700' }}>AWAITING_STREAM</h4>
                                            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>Upload a construction plan to begin.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                                            <div className="esre-card" style={{ padding: '20px', borderRadius: '16px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                    <div>
                                                        <div style={{ fontSize: '9px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '4px' }}>Violations</div>
                                                        <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>
                                                            {violationsCount.toString().padStart(2, '0')}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '9px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '4px' }}>Intelligence Score</div>
                                                        <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                                                            {esreScoreValue ? `${esreScoreValue}%` : '--'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {finalResults.map((item, i) => (
                                                    <ComplianceCard key={item.id || i} item={item} index={i} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;

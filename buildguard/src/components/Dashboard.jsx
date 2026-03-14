import React, { useState } from 'react';
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
    Bot
} from 'lucide-react';
import { useRckEngine } from '../hooks/useRckEngine';
import ComplianceCard from './ComplianceCard';

const Dashboard = () => {
    const [primaryFile, setPrimaryFile] = useState(null);
    const [checklistFile, setChecklistFile] = useState(null);
    const [selectedSkill, setSelectedSkill] = useState('');
    const [promptText, setPromptText] = useState('');
    const [expandedCategories, setExpandedCategories] = useState([]);

    const { performValidation, loading, data, error, skills } = useRckEngine();

    const handleRunAnalysis = () => {
        if (!primaryFile) return;
        performValidation({
            primaryFile,
            skillId: selectedSkill,
            prompt: promptText,
            checklistFile
        });
    };

    const toggleCategory = (catId) => {
        setExpandedCategories(prev =>
            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
        );
    };

    // Data Extraction and Organization
    const axis2Results = data?.axis2_output?.compliance || data?.checklist_results || [];
    const axis3Results = data?.axis3_output || [];
    const finalResults = [...axis2Results, ...axis3Results];

    const violationsCount = finalResults.filter(item => item.status === 'FAIL').length;
    const esreScore = data?.verdict?.confidence_score || data?.esre_score;
    const esreScoreValue = esreScore ? Math.round(esreScore * 100) : (data?.verdict?.confidence_score ? Math.round(data.verdict.confidence_score * 100) : null);

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-deep)', color: 'white' }}>

            {/* Panel A: Configuration (Left) - Glassmorphism UI */}
            <div className="glass-panel" style={{ width: '320px', height: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ padding: '8px', background: 'var(--accent-primary)', borderRadius: '10px', color: '#0B0E14' }}>
                        <Cpu size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '0.05em' }}>RCK_PORTAL</h1>
                        <p style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: '700' }}>DOM_AEC_SCHEDULER</p>
                    </div>
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
                        PLUGIN: AEC-DRAWINGS-V1
                    </div>
                </div>
            </div>

            {/* Panel B: Command Center (Middle) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', borderLeft: '1px solid var(--border-glass)', borderRight: '1px solid var(--border-glass)' }}>
                <div style={{ height: '64px', padding: '0 32px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MessageSquare size={16} color="var(--accent-primary)" />
                        <h2 style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                            Command Center
                        </h2>
                    </div>
                </div>

                <div className="chat-container" style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', overflowY: 'auto' }}>
                    <div style={{ width: '100%', maxWidth: '640px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* Agent Chat Response */}
                        <AnimatePresence>
                            {loading ? (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="agent-chat-reply loading-pulse">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <Bot size={14} color="var(--accent-primary)" />
                                        <h4 style={{ fontSize: '10px', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agent Analyzing...</h4>
                                    </div>
                                    <div style={{ height: '40px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }} />
                                </motion.div>
                            ) : data?.chat_response ? (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="agent-chat-reply">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                        <Bot size={14} color="var(--accent-primary)" />
                                        <h4 style={{ fontSize: '10px', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agent Response</h4>
                                    </div>
                                    <div className="markdown-body" style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                                        {data.chat_response}
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                        <div>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: '600' }}>AGENT_INSTRUCTIONS</p>
                            <div style={{ position: 'relative' }}>
                                <textarea
                                    className="prompt-box"
                                    placeholder="Instruct the agent... e.g. 'Identify critical path risks.'"
                                    value={promptText}
                                    onChange={(e) => setPromptText(e.target.value)}
                                    style={{ minHeight: '90px', paddingRight: '110px' }}
                                />
                                <button
                                    className={`portal-btn-tiny ${loading ? 'btn-processing' : ''}`}
                                    onClick={() => {
                                        if (!primaryFile) {
                                            alert("Please upload a Target Plan (PDF/DOCX) on the left panel before executing.");
                                            return;
                                        }
                                        handleRunAnalysis();
                                    }}
                                    disabled={loading}
                                >
                                    {loading ? 'Running...' : 'Execute'}
                                    {!loading && <Zap size={12} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ height: '56px', borderTop: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', padding: '0 32px', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    SESSION_ACTIVE // {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Panel C: Results & Validation (Right) */}
            <div className="glass-panel" style={{ width: '450px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '64px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Analysis_Ledger</h3>
                    {esreScoreValue !== null && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-primary)', fontWeight: '700' }}>
                            RELIABILITY: {esreScoreValue}%
                        </div>
                    )}
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
        </div>
    );
};

export default Dashboard;

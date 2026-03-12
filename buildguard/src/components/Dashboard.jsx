import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    FileUp,
    Zap,
    Layout,
    FileIcon,
    CheckCircle2,
    ShieldAlert,
    FileText
} from 'lucide-react';
import { useRckEngine } from '../hooks/useRckEngine';
import ComplianceCard from './ComplianceCard';

const Dashboard = () => {
    const [file, setFile] = useState(null);
    const { performValidation, loading, data, error } = useRckEngine();

    const handleStartValidation = () => {
        if (file) performValidation(file);
    };

    const results = data?.checklist_results || data?.nsvg || [];

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-primary)' }}>
            {/* Column 1: Workspace & Tools */}
            <div className="white-panel" style={{ width: '300px', height: '100%', borderRadius: '0', borderLeft: 'none', borderTop: 'none', borderBottom: 'none', padding: '32px', zIndex: 10, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
                    <div style={{ padding: '8px', background: 'var(--accent-primary)', borderRadius: '8px', color: 'white' }}>
                        <Activity size={24} />
                    </div>
                    <h1 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>BUILDGUARD</h1>
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
                        Project Workspace
                    </label>
                    <div
                        className="white-panel"
                        style={{ padding: '24px', textAlign: 'center', borderStyle: 'dashed', cursor: 'pointer', backgroundColor: 'var(--bg-primary)' }}
                        onClick={() => document.getElementById('file-upload').click()}
                    >
                        <input
                            type="file"
                            id="file-upload"
                            accept=".pdf"
                            style={{ display: 'none' }}
                            onChange={(e) => setFile(e.target.files[0])}
                        />
                        <FileUp size={28} color="var(--accent-primary)" style={{ marginBottom: '12px' }} />
                        <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file ? file.name : 'Upload Blueprint'}
                        </p>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PDF Drawings only</span>
                    </div>
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
                        Engine Status
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: data ? 'var(--accent-green)' : (loading ? 'var(--accent-orange)' : 'var(--border-color)') }}></div>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>RCK v1.0.0: {data ? 'Online' : (loading ? 'Analysing' : 'Ready')}</span>
                        </div>
                    </div>
                </div>

                <button
                    className="premium-btn"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={handleStartValidation}
                    disabled={!file || loading}
                >
                    {loading ? 'Processing...' : 'Run Analysis'}
                    {!loading && <Zap size={16} />}
                </button>

                {error && (
                    <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.05)', borderRadius: '8px', border: '1px solid rgba(220, 38, 38, 0.1)' }}>
                        <div style={{ display: 'flex', gap: '8px', color: 'var(--accent-red)' }}>
                            <ShieldAlert size={14} />
                            <span style={{ fontSize: '12px', fontWeight: '600' }}>Engine Error</span>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{error}</p>
                    </div>
                )}

                <div style={{ marginTop: 'auto', paddingTop: '32px' }}>
                    <div style={{ padding: '16px', backgroundColor: 'var(--accent-blue-soft)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <FileIcon size={14} color="var(--accent-primary)" />
                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)' }}>ACTIVE PLUGIN</span>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>AEC Drawing Checker</p>
                    </div>
                </div>
            </div>

            {/* Column 2: Document Preview Area (The Light Table) */}
            <div className="drafting-viewport" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ height: '64px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 32px', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileText size={16} color="var(--accent-primary)" />
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>
                            {file ? `PRV_${file.name.toUpperCase().replace(/\s+/g, '_')}` : 'VIEWPORT_NULL'}
                        </span>
                    </div>
                </div>

                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {/* technical HUDs */}
                    <div style={{ position: 'absolute', top: '24px', left: '24px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 5 }}>
                        <div className="hud-overlay">
                            <Activity size={12} /> <strong>STATUS:</strong> {loading ? 'SYNTHESIZING' : (data ? 'VERIFIED' : 'IDLE')}
                        </div>
                        <div className="hud-overlay">
                            <strong>RESOLUTION:</strong> 300 DPI
                        </div>
                    </div>

                    <div style={{ position: 'absolute', bottom: '24px', left: '24px', zIndex: 5 }}>
                        <div className="hud-overlay">
                            <strong>COORD:</strong> {loading ? 'SCANNING...' : 'X:104.2 Y:88.5'}
                        </div>
                    </div>

                    {!file && (
                        <div style={{ textAlign: 'center', zIndex: 1, opacity: 0.4 }}>
                            <Layout size={64} strokeWidth={1} color="var(--text-muted)" style={{ marginBottom: '24px' }} />
                            <h2 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>WAITING_FOR_INPUT</h2>
                        </div>
                    )}

                    {file && !data && !loading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ textAlign: 'center', zIndex: 1 }}
                        >
                            <div style={{ width: '240px', height: '320px', backgroundColor: 'white', border: '1px solid var(--border-color)', margin: '0 auto 32px auto', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
                                <FileIcon size={48} color="var(--accent-primary)" strokeWidth={1} />
                                <div style={{ position: 'absolute', inset: '10px', border: '1px solid var(--border-light)' }} />
                            </div>
                            <h2 style={{ color: 'var(--text-primary)', fontWeight: '800', fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Document Staged</h2>
                        </motion.div>
                    )}

                    {loading && (
                        <div style={{ position: 'relative', width: '240px', height: '320px', backgroundColor: 'white', border: '1px solid var(--border-color)', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            <motion.div
                                animate={{ y: [0, 320, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: 'var(--accent-primary)', zIndex: 2, boxShadow: '0 0 15px var(--accent-primary)' }}
                            />
                            <Activity size={48} color="var(--accent-primary)" strokeWidth={1} className="animate-pulse-soft" />
                            <div style={{ position: 'absolute', inset: '10px', border: '1px solid var(--border-light)' }} />
                        </div>
                    )}

                    {data && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ width: '85%', height: '85%', background: 'white', border: '1px solid var(--border-color)', position: 'relative', boxShadow: '0 30px 60px rgba(0,0,0,0.08)', padding: '40px' }}
                        >
                            <div style={{ position: 'absolute', inset: '15px', border: '1px solid var(--border-light)', pointerEvents: 'none' }} />
                            <div style={{ height: '100%', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                <CheckCircle2 size={64} weight="thin" color="var(--accent-primary)" style={{ marginBottom: '24px', opacity: 0.8 }} />
                                <h3 style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>Integrity_Check_Complete</h3>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>Verdicts synchronized with RCK_CORE_V1</p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Column 3: Compliance Ledger */}
            <div className="ledger-container" style={{ width: '450px', height: '100%', display: 'flex', flexDirection: 'column', background: 'white' }}>
                <div style={{ height: '64px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
                    <h3 style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>Compliance_Ledger</h3>
                    {data?.verdict && (
                        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--accent-primary)' }}>
                            SCORE: {Math.round(data.verdict.confidence_score * 100)}/100
                        </span>
                    )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <AnimatePresence mode="popLayout">
                        {!data && !loading ? (
                            <div style={{ textAlign: 'center', marginTop: '100px', opacity: 0.3 }}>
                                <Zap size={32} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
                                <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Awaiting_Data_Stream</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {data && (
                                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                                        <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>Session_Metrics</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border-color)', border: '1px solid var(--border-color)' }}>
                                            <div style={{ background: 'white', padding: '16px' }}>
                                                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{results.length.toString().padStart(2, '0')}</div>
                                                <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Scans_Performed</div>
                                            </div>
                                            <div style={{ background: 'white', padding: '16px' }}>
                                                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>00</div>
                                                <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Violations_Found</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {results.map((item, i) => (
                                    <ComplianceCard key={item.check_id || item.id || i} item={item} index={i} />
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Global CSS for spin animation */}
            <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .animate-spin { animation: spin 0.8s linear infinite; }
      `}</style>
        </div>
    );
};

export default Dashboard;

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, ChevronRight, HelpCircle, AlertTriangle } from 'lucide-react';

const ComplianceCard = ({ item, index }) => {
    // Determine raw status flexibly
    const rawStatus = String(item.status || (item.isSafe ? 'PASS' : 'FAIL')).toUpperCase().trim();

    // Categorize status for color and icon
    const isPass = ['PASS', 'PASSED', 'TRUE', 'SAFE', 'OK', 'COMPLIANT'].includes(rawStatus) || item.isSafe === true;
    const isNeutral = ['NOT APPLICABLE', 'N/A', 'NOT POSSIBLE', 'UNKNOWN', 'CANNOT_DETERMINE', 'CANNOT DETERMINE'].includes(rawStatus);
    const isError = ['ERROR', 'WITH ERROR', 'FAILED_TO_PARSE'].includes(rawStatus);
    const isFail = !isPass && !isNeutral && !isError;

    const label = item.description || item.clause_reference || item.name || item.label || (item.element_id ? `Compliance: ${item.element_id}` : 'Unknown Check');
    const rationale = (item.rationale && item.rationale.trim()) ||
        (item.evidence && item.evidence.trim()) ||
        (item.justification && item.justification.trim()) ||
        (item.comments && item.comments.trim()) ||
        'No rationale provided by engine.';

    // Safely parse confidence to a decimal 0-1
    const getConfidence = () => {
        let val = item.confidence_score !== undefined ? item.confidence_score : item.confidence;
        if (val === undefined || val === null || val === '') return null;
        let numVal = typeof val === 'string' ? parseFloat(val.replace('%', '')) : parseFloat(val);
        
        if (isNaN(numVal)) return null;
        if (numVal > 1 && numVal <= 10) return numVal / 10;
        if (numVal > 10) return numVal / 100;
        return numVal;
    };
    const confidenceVal = getConfidence();

    // Configure Status Display
    const getStatusConfig = () => {
        if (isPass) return { color: 'var(--accent-green)', badgeClass: 'badge-pass', Icon: ShieldCheck, text: rawStatus };
        if (isNeutral) return { color: 'var(--text-muted)', badgeClass: 'badge-neutral', Icon: HelpCircle, text: rawStatus };
        if (isError) return { color: 'var(--accent-orange)', badgeClass: 'badge-warning', Icon: AlertTriangle, text: rawStatus };
        return { color: 'var(--accent-red)', badgeClass: 'badge-fail', Icon: ShieldAlert, text: rawStatus };
    };

    const { color, badgeClass, Icon, text } = getStatusConfig();

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-card"
            style={{ padding: '20px', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}
        >
            {/* Status Indicating Bar */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: color }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ color: color, marginTop: '2px' }}>
                        <Icon size={18} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '10px',
                                fontWeight: '700',
                                color: 'var(--text-muted)'
                            }}>
                                {item.check_id || `ID_${index.toString().padStart(3, '0')}`}
                            </span>
                            <span className={`portal-badge ${badgeClass}`}>
                                {text}
                            </span>
                        </div>
                        <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', lineHeight: '1.4' }}>{label}</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            {rationale}
                        </p>
                    </div>
                </div>

                {confidenceVal !== null && !isNeutral && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '14px',
                            fontWeight: '800',
                            color: color
                        }}>
                            {isPass 
                                ? `${Math.round(confidenceVal * 100)}%`
                                : '0%'}
                        </div>
                        <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>MATCH</div>
                    </div>
                )}
            </div>

            {item.reason && (
                <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-glass)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <ChevronRight size={12} color="var(--accent-primary)" />
                    <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>SOURCE:</span> {item.reason}
                </div>
            )}
        </motion.div>
    );
};

export default ComplianceCard;

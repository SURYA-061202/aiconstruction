import React from 'react';
import { motion } from 'framer-motion';
import { mapNodeToUI } from '../utils/nsvgMapper';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

const ComplianceCard = ({ item, index }) => {
    const isSafe = item.status === 'PASS' || item.isSafe;
    const label = item.description || item.label;
    const rationale = item.evidence || item.rationale;
    const type_raw = item.check_id ? 'verification' : (item.type || 'general');

    const { icon: NodeIcon, color, label: typeLabel } = mapNodeToUI(type_raw);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="ledger-item"
            style={{ padding: '16px 24px' }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{
                        color: color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: '2px'
                    }}>
                        <NodeIcon size={16} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <span style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '9px',
                                fontWeight: '700',
                                color: 'var(--text-muted)',
                                letterSpacing: '0.05em'
                            }}>
                                {item.check_id || `ID_${index.toString().padStart(3, '0')}`}
                            </span>
                            <span className="status-badge" style={{
                                backgroundColor: isSafe ? 'rgba(5, 150, 105, 0.1)' : 'rgba(225, 29, 72, 0.1)',
                                color: isSafe ? 'var(--accent-green)' : 'var(--accent-red)',
                            }}>
                                {item.status || (isSafe ? 'PASS' : 'FAIL')}
                            </span>
                        </div>
                        <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{label}</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', maxWidth: '320px' }}>
                            {rationale}
                        </p>
                    </div>
                </div>

                {item.confidence && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '12px',
                            fontWeight: '700',
                            color: 'var(--text-primary)'
                        }}>
                            {Math.round(item.confidence * 100)}%
                        </div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>MATCH</div>
                    </div>
                )}
            </div>

            {item.reason && (
                <div style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    background: 'var(--bg-primary)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic',
                    borderLeft: `2px solid ${color}40`
                }}>
                    Source Ref: {item.reason}
                </div>
            )}
        </motion.div>
    );
};


export default ComplianceCard;

import { Layout, Shield, Flame, Box, AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * mapNodeToUI
 * Maps RCK Engine NSVG node types to UI icons and colors.
 */
export const mapNodeToUI = (type) => {
    const mapping = {
        structural: {
            icon: Layout,
            color: '#2563EB', // Blue
            label: 'Structural'
        },
        fire_safety: {
            icon: Flame,
            color: '#DC2626', // Red
            label: 'Fire Safety'
        },
        material: {
            icon: Box,
            color: '#D97706', // Orange
            label: 'Material'
        },
        safety: {
            icon: Shield,
            color: '#059669', // Green
            label: 'On-site Safety'
        },
        verification: {
            icon: CheckCircle2,
            color: '#6366F1', // Indigo
            label: 'Checklist Verification'
        },
        general: {
            icon: AlertTriangle,
            color: '#64748B', // Muted Slate
            label: 'General'
        }
    };

    const typeKey = (type || 'general').toLowerCase();
    return mapping[typeKey] || mapping.general;
};

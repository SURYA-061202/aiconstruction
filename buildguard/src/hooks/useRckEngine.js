import { useState, useCallback, useEffect } from 'react';

/**
 * useRckEngine
 * Construction Pro - High Focus AI Integration Hook
 */
const FALLBACK_SKILLS = [
  {
    id: 'construction',
    name: 'Construction Scheduler',
    skills: [
      { id: 'schedule_analysis', name: 'Schedule Analysis' },
      { id: 'resource_optimization', name: 'Resource Optimization' },
      { id: 'safety_compliance', name: 'Safety Compliance' },
      { id: 'risk_mitigation', name: 'Risk Mitigation' },
      { id: 'progress_tracking', name: 'Progress Tracking' },
      { id: 'cost_control', name: 'Cost Control' }
    ]
  },
  {
    id: 'general',
    name: 'General',
    skills: [
      { id: 'document_analysis', name: 'Document Analysis' },
      { id: 'data_extraction', name: 'Data Extraction' },
      { id: 'data_comparison', name: 'Data Comparison' },
      { id: 'summarization', name: 'Summarization' }
    ]
  }
];

export const useRckEngine = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [skills, setSkills] = useState([]);

  const fetchSkills = useCallback(async () => {
    try {
      const response = await fetch('http://187.127.129.173:8080/v1/health', {
        method: 'GET',
        headers: { 'x-api-key': 'rck_live_51e4987fe5d62c5d966a5692d09ef4e1' }
      });
      if (response.ok) {
        const result = await response.json();
        // If the result is an array with items, use it. Otherwise, use fallback.
        setSkills(Array.isArray(result) && result.length > 0 ? result : FALLBACK_SKILLS);
      } else {
        setSkills(FALLBACK_SKILLS);
      }
    } catch (err) {
      console.error('Skill Sync Failed:', err);
      setSkills(FALLBACK_SKILLS);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const performValidation = useCallback(async ({
    primaryFile,
    skillId,
    prompt = '',
    checklistFile = null
  }) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', primaryFile);
      if (checklistFile) formData.append('checklist', checklistFile);
      if (skillId) formData.append('skill', skillId);
      if (prompt) formData.append('prompt', prompt);

      // Explicit construction domain options
      formData.append('options', JSON.stringify({
        domain: "construction",
        mock_mode: true
      }));

      const response = await fetch(`http://localhost:8000/v1/analyse/aec-drawings-v1`, {
        method: 'POST',
        headers: {
          'x-api-key': 'rck_live_51e4987fe5d62c5d966a5692d09ef4e1'
          // No Content-Type header - Browser auto-sets multipart/form-data boundary
        },
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail?.message || `API Error: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('RCK Connection Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { performValidation, loading, data, error, skills };
};

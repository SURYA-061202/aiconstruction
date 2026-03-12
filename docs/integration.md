# Integration Details: RCK Engine & AEC Plugins

Integrating the RCK Engine into BuildGuard requires a combination of robust API calls and smart state management via React Hooks.

## `aec-drawings-v1` Plugin
The AEC (Architecture, Engineering, and Construction) plugin is the specialized intelligence module used by RCK. It contains the logic for:
- Drawing OCR and Metadata Extraction.
- Geometric Consistency Checks.
- Regulatory Cross-Referencing (e.g., BS 9991 Standard).

## Implementation: `useRckEngine`

The `useRckEngine` hook handles the lifecycle of an AI validation session.

```javascript
import { useState, useCallback } from 'react';
import axios from 'axios';

/**
 * useRckEngine
 * Standard hook for triggering construction-specific AI validation.
 */
export const useRckEngine = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const performValidation = useCallback(async (fileData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/rck/aec-validation', {
        drawing: fileData,
        plugin: 'aec-drawings-v1',
        options: { deep_scan: true }
      });
      
      setData(response.data);
    } catch (err) {
      setError('Validation Service Unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  return { performValidation, loading, data, error };
};
```

## Mapping RCK NSVG to UI Components

BuildGuard translates RCK's internal graph into a premium visual dashboard.

### Icon Mapping (Lucide)
- **High Risk**: `<TriangleAlert color="#ff4d4d" />` (Mapped from `risk_score > 0.8`)
- **Compliant**: `<ShieldCheck color="#00e676" />` (Mapped from `comp_status: true`)
- **Pending Review**: `<ClipboardCheck color="#ffab00" />` (Manual verification nodes)

### Validation Graph Logic
The NSVG output provides a set of validated nodes. BuildGuard iterates through these to render the **Compliance Feed**:

```javascript
// Example Dashboard Feed Mapping
{nsvgNodes.map((node) => (
  <ComplianceCard 
    key={node.id}
    type={node.type} // 'fire_safety', 'structural', etc.
    status={node.isValidated ? 'pass' : 'fail'}
    details={node.rationale} // Zero-hallucination evidence
  />
))}
```

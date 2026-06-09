'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Clipboard, 
  Trash2, 
  Plus, 
  Save, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Info,
  Loader
} from 'lucide-react';

interface AlertItem {
  id: string;
  keyword: string;
  keyword_group: string;
  property: string;
  alert_type: string;
}

interface RowData {
  id: string;
  entryDate: string;
  property: string;
  course: string;
  location: string;
  keywordTargeted: string;
  linkType: string;
  url: string;
  da: string;
  spamScore: string;
  status: string;
  notes: string;
  errors: { [key: string]: string };
}

const LINK_TYPES = [
  'Guest Post', 'Forum Post', 'Web 2.0', 'Directory', 'Social Share', 
  'Quora/Reddit', 'Bookmarks', 'Press Release', 'Profile Link', 
  'Image Share', 'PDF Share', 'Video Share', 'Infographic', 'Classifieds'
];

const STATUS_OPTIONS = ['Pending', 'Live', 'Rejected', 'No-Follow', 'Do-Follow'];

export default function LogBacklinksPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [websites, setWebsites] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [rows, setRows] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(true);

  // Saving states
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveTotal, setSaveTotal] = useState(0);
  const [saveStatus, setSaveStatus] = useState<{ saved: number; domains: number } | null>(null);

  // Fetch lookups
  useEffect(() => {
    async function fetchLookups() {
      try {
        const [cRes, wRes, aRes] = await Promise.all([
          fetch('/api/courses').then(r => r.json()),
          fetch('/api/websites').then(r => r.json()),
          // Fetch alerts (simulate empty/active for workspace)
          fetch('/api/alerts').then(r => r.json()).catch(() => ({ alerts: [] }))
        ]);

        if (cRes.success) setCourses(cRes.courses);
        if (wRes.success) setWebsites(wRes.websites);
        if (aRes && aRes.success) setAlerts(aRes.alerts.slice(0, 3)); // display top 3 alerts
      } catch (err) {
        console.error('Failed to load lookups:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLookups();
    initializeEmptyRows(20);
  }, []);

  const initializeEmptyRows = (count: number) => {
    const today = new Date().toISOString().split('T')[0];
    const newRows: RowData[] = Array.from({ length: count }).map((_, i) => ({
      id: `row-${Date.now()}-${i}`,
      entryDate: today,
      property: 'TLI',
      course: '',
      location: '',
      keywordTargeted: '',
      linkType: 'Guest Post',
      url: '',
      da: '',
      spamScore: '',
      status: 'Pending',
      notes: '',
      errors: {}
    }));
    setRows(newRows);
  };

  // Cell validation
  const validateCell = (field: keyof RowData, value: string, currentErrors: { [key: string]: string }) => {
    const errors = { ...currentErrors };
    delete errors[field]; // reset error for this cell

    if (field === 'url') {
      if (!value) {
        errors.url = 'URL is required';
      } else if (!value.startsWith('http://') && !value.startsWith('https://') && !value.includes('.')) {
        errors.url = 'Invalid URL format';
      }
    } else if (field === 'da') {
      const num = parseInt(value);
      if (value && (isNaN(num) || num < 0 || num > 100)) {
        errors.da = 'DA must be 0-100';
      }
    } else if (field === 'spamScore') {
      const num = parseInt(value);
      if (value && (isNaN(num) || num < 0 || num > 100)) {
        errors.spamScore = 'Spam Score must be 0-100';
      }
    } else if (field === 'course') {
      if (!value) {
        errors.course = 'Course is required';
      }
    } else if (field === 'entryDate') {
      if (!value || isNaN(Date.parse(value))) {
        errors.entryDate = 'Invalid Date';
      }
    }

    return errors;
  };

  const handleCellChange = (rowId: string, field: keyof RowData, value: any) => {
    setRows(prev => prev.map(row => {
      if (row.id === rowId) {
        const errors = validateCell(field, value, row.errors);
        return { ...row, [field]: value, errors };
      }
      return row;
    }));
  };

  const addRow = () => {
    const today = new Date().toISOString().split('T')[0];
    const newRow: RowData = {
      id: `row-${Date.now()}`,
      entryDate: today,
      property: websites[0]?.code || 'TLI',
      course: courses[0]?.course_name || '',
      location: '',
      keywordTargeted: '',
      linkType: 'Guest Post',
      url: '',
      da: '',
      spamScore: '',
      status: 'Pending',
      notes: '',
      errors: {}
    };
    setRows(prev => [...prev, newRow]);
  };

  const deleteRow = (rowId: string) => {
    setRows(prev => {
      const filtered = prev.filter(r => r.id !== rowId);
      return filtered.length === 0 ? initializeRowsList() : filtered;
    });
  };

  const initializeRowsList = () => {
    const today = new Date().toISOString().split('T')[0];
    return [{
      id: `row-${Date.now()}`,
      entryDate: today,
      property: 'TLI',
      course: '',
      location: '',
      keywordTargeted: '',
      linkType: 'Guest Post',
      url: '',
      da: '',
      spamScore: '',
      status: 'Pending',
      notes: '',
      errors: {}
    }];
  };

  // Paste Grid Handler (Ctrl + V)
  const handlePaste = (e: React.ClipboardEvent, startRowIndex: number, startColIndex: number) => {
    e.preventDefault();
    const clipboardData = e.clipboardData.getData('Text');
    const pastedRows = clipboardData.split(/\r?\n/).filter(line => line.trim() !== '');

    const newRows = [...rows];
    
    // Columns Mapping in Grid
    const colFields: (keyof RowData)[] = [
      'entryDate', 'property', 'course', 'location', 
      'keywordTargeted', 'linkType', 'url', 'da', 
      'spamScore', 'status', 'notes'
    ];

    pastedRows.forEach((pastedRow, rIdx) => {
      const targetRowIdx = startRowIndex + rIdx;
      
      // Expand grid rows dynamically if paste exceeds grid height
      if (targetRowIdx >= newRows.length) {
        const today = new Date().toISOString().split('T')[0];
        newRows.push({
          id: `row-paste-${Date.now()}-${rIdx}`,
          entryDate: today,
          property: 'TLI',
          course: '',
          location: '',
          keywordTargeted: '',
          linkType: 'Guest Post',
          url: '',
          da: '',
          spamScore: '',
          status: 'Pending',
          notes: '',
          errors: {}
        });
      }

      const cells = pastedRow.split('\t');
      cells.forEach((cellValue, cIdx) => {
        const targetColIdx = startColIndex + cIdx;
        if (targetColIdx < colFields.length) {
          const field = colFields[targetColIdx];
          const val = cellValue.trim();
          newRows[targetRowIdx] = {
            ...newRows[targetRowIdx],
            [field]: val
          };

          // Perform validations
          newRows[targetRowIdx].errors = validateCell(
            field, 
            val, 
            newRows[targetRowIdx].errors
          );
        }
      });
    });

    setRows(newRows);
  };

  // Excel template downloader
  const downloadTemplate = () => {
    const headers = [
      'Date (YYYY-MM-DD)', 
      'Property (TLI or SOT)', 
      'Course', 
      'Location / Website Name', 
      'Keyword Targeted', 
      'Link Type', 
      'URL', 
      'Domain Authority (DA)', 
      'Spam Score', 
      'Status', 
      'Notes'
    ];
    const sampleRow = [
      new Date().toISOString().split('T')[0],
      'TLI',
      courses[0]?.course_name || 'Oracle Fusion Technical Training',
      'Tech Blog',
      'Oracle Fusion Technical Training',
      'Guest Post',
      'https://example.com/blog-post',
      '45',
      '1',
      'Live',
      'Sample backlink note'
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), sampleRow.join(',')].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "seo_backlinks_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit and Save Handler
  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    setSaveProgress(0);

    // 1. Identify valid and invalid rows
    // (Only validate non-empty rows, skip completely blank ones)
    const activeRows = rows.filter(r => r.url || r.course || r.location);
    
    if (activeRows.length === 0) {
      alert('Please fill out at least one row with a URL and Course before saving.');
      setSaving(false);
      return;
    }

    const validRows: RowData[] = [];
    const invalidRows: RowData[] = [];

    activeRows.forEach(row => {
      // Validate all fields again
      let errors: { [key: string]: string } = {};
      errors = validateCell('entryDate', row.entryDate, errors);
      errors = validateCell('course', row.course, errors);
      errors = validateCell('url', row.url, errors);
      errors = validateCell('da', row.da, errors);
      errors = validateCell('spamScore', row.spamScore, errors);

      if (Object.keys(errors).length > 0) {
        invalidRows.push({ ...row, errors });
      } else {
        validRows.push(row);
      }
    });

    if (validRows.length === 0) {
      // Refresh error markers on the screen
      setRows(prev => prev.map(r => {
        const found = invalidRows.find(ir => ir.id === r.id);
        return found ? found : r;
      }));
      alert('All entered rows have validation errors. Please fix them highlighted in red.');
      setSaving(false);
      return;
    }

    setSaveTotal(validRows.length);

    // 2. Chunks of 100 saving
    const chunkSize = 100;
    let totalSaved = 0;
    let totalDomainsUpdated = 0;

    for (let i = 0; i < validRows.length; i += chunkSize) {
      const chunk = validRows.slice(i, i + chunkSize);
      
      try {
        const res = await fetch('/api/backlinks/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backlinks: chunk }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save chunk');

        totalSaved += data.count;
        totalDomainsUpdated += data.domainsUpdated;
        setSaveProgress(Math.min(100, Math.round(((i + chunk.length) / validRows.length) * 100)));
      } catch (err: any) {
        alert(`Error saving chunk: ${err.message}. Saving paused.`);
        break;
      }
    }

    // 3. Clear saved rows and keep invalid rows (Partial-save behavior)
    // Add 20 empty rows if grid ends up empty
    const remainingRows = rows.filter(r => {
      const isSaved = validRows.some(vr => vr.id === r.id);
      return !isSaved;
    });

    if (remainingRows.length === 0) {
      initializeEmptyRows(20);
    } else {
      // Update rows with invalid rows (carrying their errors)
      setRows(rows.map(r => {
        const isSaved = validRows.some(vr => vr.id === r.id);
        if (isSaved) return null; // remove
        const invalidFound = invalidRows.find(ir => ir.id === r.id);
        return invalidFound ? invalidFound : r;
      }).filter(Boolean) as RowData[]);
    }

    setSaveStatus({ saved: totalSaved, domains: totalDomainsUpdated });
    setSaving(false);
  };

  const totalErrors = rows.reduce((acc, row) => acc + Object.keys(row.errors).length, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <Loader className="animate-spin text-brand-primary" size={32} />
        <p className="text-brand-muted text-sm font-mono">Loading form utilities...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Log Backlinks Workspace</h2>
          <p className="text-sm text-brand-muted mt-1">Copy-paste lists directly from spreadsheets or enter them manually.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 border border-brand-border hover:bg-brand-card text-brand-text rounded-xl text-xs font-semibold transition-colors"
          >
            <Download size={14} />
            <span>Template</span>
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg shadow-brand-primary/25 disabled:opacity-50"
          >
            {saving ? <Loader className="animate-spin" size={14} /> : <Save size={14} />}
            <span>Save Workspace</span>
          </button>
        </div>
      </div>

      {/* Progress Bar when saving */}
      {saving && (
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-brand-muted">Saving links chunk-by-chunk...</span>
            <span className="text-white font-mono">{saveProgress}%</span>
          </div>
          <div className="w-full bg-brand-bg h-2 rounded-full overflow-hidden">
            <div 
              className="bg-brand-primary h-full transition-all duration-300"
              style={{ width: `${saveProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Success banner */}
      {saveStatus && (
        <div className="bg-brand-success/10 border border-brand-success/20 text-brand-success rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} />
            <span className="text-sm font-medium">
              Saved {saveStatus.saved} backlinks successfully! Updated {saveStatus.domains} domains in the Shared Library.
            </span>
          </div>
          <Link 
            href="/domain-library"
            className="text-xs font-semibold underline hover:text-white"
          >
            View Shared Library
          </Link>
        </div>
      )}

      {/* Active Alerts Box */}
      {alerts.length > 0 && (
        <div className="bg-brand-purple/10 border border-brand-purple/20 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-brand-purple font-semibold text-xs uppercase tracking-wider">
            <Info size={14} />
            <span>Priority Target Alerts Today</span>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {alerts.map(a => (
              <li key={a.id} className="bg-brand-bg/50 border border-brand-border rounded-lg p-2.5 font-mono text-brand-text">
                <span className="text-brand-purple block text-[9px] font-bold uppercase">{a.property} | {a.alert_type}</span>
                <span className="text-white font-semibold truncate block mt-0.5">{a.keyword}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Table Paste Grid */}
      <div className="bg-brand-surface border border-brand-border rounded-xl shadow-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-brand-border bg-brand-bg/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clipboard size={16} className="text-brand-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">Backlink Pasteur Grid</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={addRow}
              className="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
            >
              <Plus size={14} />
              <span>Add Row</span>
            </button>
            <span className="text-[10px] text-brand-muted font-mono bg-brand-bg border border-brand-border px-2 py-0.5 rounded">
              Pasted grid cells: tab-separated | rows: newline-separated
            </span>
          </div>
        </div>

        {/* Scrollable table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[1400px]">
            <thead>
              <tr className="bg-brand-bg/50 border-b border-brand-border text-brand-muted text-[10px] uppercase font-bold tracking-wider font-mono">
                <th className="w-10 px-4 py-3 text-center">#</th>
                <th className="w-28 px-3 py-3">Date</th>
                <th className="w-24 px-3 py-3">Property</th>
                <th className="w-56 px-3 py-3">Course</th>
                <th className="w-36 px-3 py-3">Location</th>
                <th className="w-48 px-3 py-3">Keyword</th>
                <th className="w-36 px-3 py-3">Link Type</th>
                <th className="w-64 px-3 py-3">URL</th>
                <th className="w-16 px-3 py-3 text-center">DA</th>
                <th className="w-16 px-3 py-3 text-center">Spam</th>
                <th className="w-28 px-3 py-3">Status</th>
                <th className="w-40 px-3 py-3">Notes</th>
                <th className="w-12 px-4 py-3 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr 
                  key={row.id} 
                  className="border-b border-brand-border/40 hover:bg-brand-card/20 transition-colors"
                >
                  {/* Row Index */}
                  <td className="px-4 py-2.5 text-center text-xs text-brand-muted font-mono">{rIdx + 1}</td>

                  {/* Entry Date */}
                  <td className="px-2 py-2.5">
                    <input
                      type="date"
                      value={row.entryDate}
                      onChange={(e) => handleCellChange(row.id, 'entryDate', e.target.value)}
                      onPaste={(e) => handlePaste(e, rIdx, 0)}
                      className={`w-full bg-brand-bg/50 border ${row.errors.entryDate ? 'border-brand-danger' : 'border-brand-border'} focus:border-brand-primary rounded-lg px-2 py-1 text-xs outline-none text-white`}
                    />
                  </td>

                  {/* Property */}
                  <td className="px-2 py-2.5">
                    <select
                      value={row.property}
                      onChange={(e) => handleCellChange(row.id, 'property', e.target.value)}
                      onPaste={(e) => handlePaste(e, rIdx, 1)}
                      className="w-full bg-brand-bg/50 border border-brand-border focus:border-brand-primary rounded-lg px-2 py-1 text-xs outline-none text-white font-mono"
                    >
                      {websites.map(w => (
                        <option key={w.id} value={w.code}>{w.code}</option>
                      ))}
                      {websites.length === 0 && <option value="TLI">TLI</option>}
                      {websites.length === 0 && <option value="SOT">SOT</option>}
                    </select>
                  </td>

                  {/* Course dropdown */}
                  <td className="px-2 py-2.5">
                    <select
                      value={row.course}
                      onChange={(e) => handleCellChange(row.id, 'course', e.target.value)}
                      onPaste={(e) => handlePaste(e, rIdx, 2)}
                      className={`w-full bg-brand-bg/50 border ${row.errors.course ? 'border-brand-danger' : 'border-brand-border'} focus:border-brand-primary rounded-lg px-2 py-1 text-xs outline-none text-white`}
                    >
                      <option value="">-- Select Course --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.course_name}>{c.course_name}</option>
                      ))}
                    </select>
                  </td>

                  {/* Location */}
                  <td className="px-2 py-2.5">
                    <input
                      type="text"
                      value={row.location}
                      onChange={(e) => handleCellChange(row.id, 'location', e.target.value)}
                      onPaste={(e) => handlePaste(e, rIdx, 3)}
                      placeholder="e.g. Medium.com"
                      className="w-full bg-brand-bg/50 border border-brand-border focus:border-brand-primary rounded-lg px-2 py-1 text-xs outline-none text-white"
                    />
                  </td>

                  {/* Keyword Targeted */}
                  <td className="px-2 py-2.5">
                    <input
                      type="text"
                      value={row.keywordTargeted}
                      onChange={(e) => handleCellChange(row.id, 'keywordTargeted', e.target.value)}
                      onPaste={(e) => handlePaste(e, rIdx, 4)}
                      placeholder="e.g. SCM Course"
                      className="w-full bg-brand-bg/50 border border-brand-border focus:border-brand-primary rounded-lg px-2 py-1 text-xs outline-none text-white font-mono"
                    />
                  </td>

                  {/* Link Type */}
                  <td className="px-2 py-2.5">
                    <select
                      value={row.linkType}
                      onChange={(e) => handleCellChange(row.id, 'linkType', e.target.value)}
                      onPaste={(e) => handlePaste(e, rIdx, 5)}
                      className="w-full bg-brand-bg/50 border border-brand-border focus:border-brand-primary rounded-lg px-2 py-1 text-xs outline-none text-white"
                    >
                      {LINK_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </td>

                  {/* URL */}
                  <td className="px-2 py-2.5">
                    <input
                      type="text"
                      value={row.url}
                      onChange={(e) => handleCellChange(row.id, 'url', e.target.value)}
                      onPaste={(e) => handlePaste(e, rIdx, 6)}
                      placeholder="https://example.com/site"
                      className={`w-full bg-brand-bg/50 border ${row.errors.url ? 'border-brand-danger' : 'border-brand-border'} focus:border-brand-primary rounded-lg px-2 py-1 text-xs outline-none text-white font-mono`}
                    />
                  </td>

                  {/* DA */}
                  <td className="px-2 py-2.5">
                    <input
                      type="text"
                      value={row.da}
                      onChange={(e) => handleCellChange(row.id, 'da', e.target.value)}
                      onPaste={(e) => handlePaste(e, rIdx, 7)}
                      placeholder="35"
                      className={`w-full bg-brand-bg/50 border ${row.errors.da ? 'border-brand-danger' : 'border-brand-border'} focus:border-brand-primary rounded-lg px-1 py-1 text-center text-xs outline-none text-white font-mono`}
                    />
                  </td>

                  {/* Spam Score */}
                  <td className="px-2 py-2.5">
                    <input
                      type="text"
                      value={row.spamScore}
                      onChange={(e) => handleCellChange(row.id, 'spamScore', e.target.value)}
                      onPaste={(e) => handlePaste(e, rIdx, 8)}
                      placeholder="2"
                      className={`w-full bg-brand-bg/50 border ${row.errors.spamScore ? 'border-brand-danger' : 'border-brand-border'} focus:border-brand-primary rounded-lg px-1 py-1 text-center text-xs outline-none text-white font-mono`}
                    />
                  </td>

                  {/* Status */}
                  <td className="px-2 py-2.5">
                    <select
                      value={row.status}
                      onChange={(e) => handleCellChange(row.id, 'status', e.target.value)}
                      onPaste={(e) => handlePaste(e, rIdx, 9)}
                      className="w-full bg-brand-bg/50 border border-brand-border focus:border-brand-primary rounded-lg px-2 py-1 text-xs outline-none text-white"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>

                  {/* Notes */}
                  <td className="px-2 py-2.5">
                    <input
                      type="text"
                      value={row.notes}
                      onChange={(e) => handleCellChange(row.id, 'notes', e.target.value)}
                      onPaste={(e) => handlePaste(e, rIdx, 10)}
                      placeholder="optional..."
                      className="w-full bg-brand-bg/50 border border-brand-border focus:border-brand-primary rounded-lg px-2 py-1 text-xs outline-none text-white"
                    />
                  </td>

                  {/* Trash row */}
                  <td className="px-4 py-2.5 text-center">
                    <button 
                      onClick={() => deleteRow(row.id)}
                      className="text-brand-muted hover:text-brand-danger p-1 rounded transition-colors"
                      title="Delete Row"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sidebar Error Warnings Panel */}
        {totalErrors > 0 && (
          <div className="bg-brand-danger/5 border-t border-brand-border p-4 flex items-center gap-3 text-xs text-brand-danger">
            <AlertTriangle size={16} />
            <span>
              <strong>Validation warnings:</strong> {totalErrors} issues detected in the grid. Invalid cells are highlighted in red.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

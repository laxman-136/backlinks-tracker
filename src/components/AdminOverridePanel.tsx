'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Save, Loader } from 'lucide-react';

interface AdminOverridePanelProps {
  domain: string;
  initialOverride: string | null;
  initialNote: string;
}

export default function AdminOverridePanel({ domain, initialOverride, initialNote }: AdminOverridePanelProps) {
  const router = useRouter();
  const [override, setOverride] = useState(initialOverride || 'None');
  const [note, setNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/admin/domain-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          adminOverride: override,
          adminNote: note
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update overrides');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating overrides');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-brand-surface border border-brand-purple/20 rounded-xl p-6 shadow-xl relative overflow-hidden space-y-4">
      <div className="absolute top-0 left-0 right-0 h-1 bg-brand-purple"></div>
      <div className="flex items-center gap-2 text-brand-purple">
        <ShieldCheck size={18} />
        <h3 className="text-sm font-bold uppercase tracking-wider">⚙️ Administrator Controls</h3>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {success && (
          <div className="bg-brand-success/10 border border-brand-success/20 text-brand-success rounded-xl p-3 text-xs">
            Overrides saved successfully!
          </div>
        )}

        {/* Dropdown status */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-brand-muted uppercase">Manual Status Override</label>
          <select
            value={override}
            onChange={(e) => setOverride(e.target.value)}
            className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-xs text-white outline-none"
          >
            <option value="None">None (System Auto-Calculate)</option>
            <option value="Great">Great</option>
            <option value="Good">Good</option>
            <option value="Ok">Ok</option>
            <option value="Avoid">Avoid (Flagged Domain)</option>
          </select>
        </div>

        {/* Notes textarea */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-brand-muted uppercase">Admin Advisory Notes</label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Provide instructions or flags for the SEO team regarding this domain..."
            className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl p-3 text-xs text-white outline-none font-mono focus:ring-1 focus:ring-brand-primary"
          ></textarea>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full py-2 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? <Loader className="animate-spin" size={14} /> : <Save size={14} />}
          <span>Save Changes</span>
        </button>
      </form>
    </div>
  );
}

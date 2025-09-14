import React, { useEffect, useState } from 'react';
import { getReport } from '../services/api';
import { Button } from './ui/button.jsx';
import { Card, CardHeader, CardContent } from './ui/card.jsx';

export default function Report({ candidateId, onBack }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchReport = async () => {
      try {
        setLoading(true);
        const data = await getReport(candidateId);
        if (!active) return;
        setReport(data);
      } catch (e) {
        if (!active) return;
        setError(e?.message || 'Failed to load report');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchReport();
    return () => { active = false; };
  }, [candidateId]);

  const formatDuration = (ms) => {
    if (!ms || ms < 0) return 'N/A';
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const parts = [];
    if (h) parts.push(`${h}h`);
    if (m || h) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  };

  if (loading) return <div style={{ padding: 16 }}>Loading report...</div>;
  if (error) return <div style={{ padding: 16, color: '#b00020' }}>Error: {error}</div>;
  if (!report) return <div style={{ padding: 16 }}>No report available.</div>;

  const suspiciousCount = (report?.multipleFacesCount || 0) + (report?.noFaceCount || 0) + (report?.suspiciousEvents?.length || 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="px-4 py-6 flex justify-center">
      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          video { display: none !important; }
          button, .no-print { display: none !important; }
          .card { page-break-inside: avoid; }
          .table tr { page-break-inside: avoid; page-break-after: auto; }
        }
      `}</style>
      <div className="w-full max-w-5xl">
        <div className="no-print mb-4 flex items-center justify-between gap-2">
          <h2 className="m-0 text-2xl font-semibold">Proctoring Report</h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onBack}>Back</Button>
            <Button onClick={handlePrint}>Download PDF</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <strong>Summary</strong>
          </CardHeader>
          <CardContent>
            <div className="grid" style={{ gridTemplateColumns: '280px 1fr', rowGap: 10, columnGap: 16 }}>
              <div style={{ color: '#6b7280' }}>Candidate Name</div>
              <div style={{ fontWeight: 500 }}>{report.candidateName}</div>
              <div style={{ color: '#6b7280' }}>Status</div>
              <div style={{ fontWeight: 600 }}>{report.endTime ? `Completed at ${new Date(report.endTime).toLocaleString()}` : 'In Progress'}</div>
              <div style={{ color: '#6b7280' }}>Interview Duration</div>
              <div style={{ fontWeight: 500 }}>{formatDuration(report.interviewDurationMs)}</div>
              <div style={{ color: '#6b7280' }}>Number of times focus lost</div>
              <div style={{ fontWeight: 500 }}>{report.focusLostCount ?? 0}</div>
              <div style={{ color: '#6b7280' }}>Suspicious events</div>
              <div className="grid grid-cols-3">
                <div><strong>{report.multipleFacesCount ?? 0}</strong> multiple faces</div>
                <div><strong>{report.noFaceCount ?? 0}</strong> absence</div>
                <div><strong>{report.suspiciousEvents?.length ?? 0}</strong> phone/notes</div>
              </div>
              <div style={{ color: '#6b7280' }}>Final Integrity Score</div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{report.integrityScore}</div>
            </div>
          </CardContent>
        </Card>

        {Array.isArray(report.suspiciousEvents) && report.suspiciousEvents.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <strong>Suspicious Items Detected</strong>
            </CardHeader>
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-3 py-2 border-b border-slate-200 w-56">Time</th>
                    <th className="text-left px-3 py-2 border-b border-slate-200 w-48">Label</th>
                    <th className="text-left px-3 py-2 border-b border-slate-200">BBox</th>
                  </tr>
                </thead>
                <tbody>
                  {report.suspiciousEvents.map((e, idx) => (
                    <tr key={idx} className="odd:bg-white even:bg-slate-50/50">
                      <td className="px-3 py-2 border-b border-slate-100">{new Date(e.timestamp).toLocaleString()}</td>
                      <td className="px-3 py-2 border-b border-slate-100">{e.label || 'item'}</td>
                      <td className="px-3 py-2 border-b border-slate-100">{Array.isArray(e.bbox) && e.bbox.length === 4 ? e.bbox.join(', ') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {report.videoFileUrl && (
          <Card className="mt-4">
            <CardHeader>
              <strong>Recorded Interview</strong>
            </CardHeader>
            <CardContent>
              {(() => {
                const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
                const videoUrl = report.videoFileUrl.startsWith('/api') ? `${apiBase}${report.videoFileUrl}` : report.videoFileUrl;
                return <video controls src={videoUrl} width={560} />;
              })()}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}



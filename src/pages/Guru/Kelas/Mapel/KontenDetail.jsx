import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GuruLayout from '../../../../layouts/GuruLayout';
import { useTheme } from '../../../../context/ThemeContext';
import { db } from '../../../../api/firebase';
import { ref, onValue } from 'firebase/database';
import { ChevronLeft, FileText, ClipboardList, Paperclip, CheckCircle2 } from 'lucide-react';

const KontenDetail = () => {
  const { kontenId } = useParams();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [data, setData] = useState(null);

  useEffect(() => {
    onValue(ref(db, `Konten/${kontenId}`), (snap) => {
      if (snap.exists()) setData(snap.val());
    });
  }, [kontenId]);

  if (!data) return <div style={{ textAlign: 'center', padding: '100px' }}>Memuat...</div>;

  return (
    <GuruLayout title="Detail Konten">
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontWeight: '700', fontSize: '13px', marginBottom: '20px' }}>
        <ChevronLeft size={18} /> Kembali
      </button>

      <div style={{ backgroundColor: colors.cardBg, borderRadius: '20px', border: `1px solid ${colors.border}`, padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ padding: '15px', borderRadius: '15px', backgroundColor: data.tipeKonten === 'Tugas' ? '#6366f115' : '#10b98115', color: data.tipeKonten === 'Tugas' ? '#6366f1' : '#10b981' }}>
              {data.tipeKonten === 'Tugas' ? <ClipboardList size={30} /> : <FileText size={30} />}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900' }}>{data.judul}</h1>
              <p style={{ margin: '5px 0 0 0', color: colors.textMuted, fontSize: '14px' }}>
                {data.tipeTugas || 'Materi'} • {data.tenggat ? `Tenggat: ${data.tenggat.replace('T', ' ')}` : 'Tanpa Tenggat'}
              </p>
            </div>
          </div>
          {data.fileUrl && (
            <a href={data.fileUrl} target="_blank" rel="noreferrer">
              <button style={{ backgroundColor: colors.primary, color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Paperclip size={18} /> Lihat Lampiran
              </button>
            </a>
          )}
        </div>

        <div style={{ height: '1px', backgroundColor: colors.border, marginBottom: '30px' }} />
        <h3 style={{ fontSize: '12px', fontWeight: '900', color: colors.textMuted, letterSpacing: '1px', marginBottom: '15px' }}>INSTRUKSI / ISI MATERI</h3>
        <p style={{ fontSize: '16px', lineHeight: '1.8', whiteSpace: 'pre-wrap', color: colors.textPrimary }}>{data.deskripsi || 'Tidak ada deskripsi.'}</p>

        {data.pertanyaan && (
          <div style={{ marginTop: '50px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '900', color: colors.textMuted, marginBottom: '25px' }}>DAFTAR SOAL & KUNCI JAWABAN</h3>
            {data.pertanyaan.map((q, i) => (
              <div key={i} style={{ padding: '20px', border: `1px solid ${colors.border}`, borderRadius: '16px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: '900', color: colors.primary }}>Soal {i+1}</span>
                  <span style={{ fontSize: '12px', fontWeight: '800', opacity: 0.6 }}>{q.poin} Poin</span>
                </div>
                <p style={{ fontSize: '15px', fontWeight: '600' }}>{q.soal}</p>
                {data.tipeTugas === 'Pilgan' && q.opsi && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
                    {q.opsi.map((o, idx) => (
                      <div key={idx} style={{ padding: '10px', borderRadius: '10px', border: `1px solid ${q.kunci === idx ? '#10b981' : colors.border}`, background: q.kunci === idx ? '#10b98110' : 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: q.kunci === idx ? '#10b981' : colors.textPrimary }}>{String.fromCharCode(65+idx)}. {o}</span>
                        {q.kunci === idx && <CheckCircle2 size={14} color="#10b981" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </GuruLayout>
  );
};

export default KontenDetail;
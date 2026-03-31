import React, { useState, useEffect, useRef } from 'react';
import { Plus, Upload, List, CheckCircle, Trash2, Download, FileText, Users } from 'lucide-react';
import { format } from 'date-fns';

type Tab = 'list' | 'submit' | 'status' | 'teachers';

interface Teacher {
  id: number;
  name: string;
}

interface Training {
  id: number;
  title: string;
  requester: string;
  deadline: string;
  description: string;
  created_at: string;
}

interface Submission {
  id: number;
  training_id: number;
  training_title: string;
  teacher_name: string;
  file_name: string;
  original_name: string;
  submitted_at: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  
  // Form states
  const [newTraining, setNewTraining] = useState({ title: '', requester: '', deadline: '', description: '' });
  const [submitForm, setSubmitForm] = useState({ training_id: '', teacher_name: '', password: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newTeacherName, setNewTeacherName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTrainings();
    fetchSubmissions();
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/teachers');
      if (res.ok) setTeachers(await res.json());
    } catch (err) {
      console.error('Failed to fetch teachers', err);
    }
  };

  const fetchTrainings = async () => {
    try {
      const res = await fetch('/api/trainings');
      if (res.ok) setTrainings(await res.json());
    } catch (err) {
      console.error('Failed to fetch trainings', err);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const res = await fetch('/api/submissions');
      if (res.ok) setSubmissions(await res.json());
    } catch (err) {
      console.error('Failed to fetch submissions', err);
    }
  };

  const handleCreateTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTraining),
      });
      if (res.ok) {
        setNewTraining({ title: '', requester: '', deadline: '', description: '' });
        fetchTrainings();
        alert('연수가 등록되었습니다.');
      }
    } catch (err) {
      alert('등록 실패');
    }
  };

  const handleDeleteTraining = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까? 관련된 제출 내역도 모두 삭제됩니다.')) return;
    try {
      const res = await fetch(`/api/trainings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTrainings();
        fetchSubmissions();
      }
    } catch (err) {
      alert('삭제 실패');
    }
  };

  const handleSubmitCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !submitForm.training_id || !submitForm.teacher_name || !submitForm.password) {
      alert('모든 항목을 입력하고 파일을 선택해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('training_id', submitForm.training_id);
    formData.append('teacher_name', submitForm.teacher_name);
    formData.append('password', submitForm.password);
    formData.append('certificate', selectedFile);

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setSubmitForm({ training_id: '', teacher_name: '', password: '' });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchSubmissions();
        alert('이수증이 제출되었습니다.');
        setActiveTab('status');
      }
    } catch (err) {
      alert('제출 실패');
    }
  };

  const handleDeleteSubmission = async (id: number) => {
    const password = prompt('삭제 비밀번호를 입력하세요:');
    if (password === null) return;

    try {
      const res = await fetch(`/api/submissions/${id}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        fetchSubmissions();
        alert('삭제되었습니다.');
      } else {
        const data = await res.json();
        alert(data.error || '삭제 실패');
      }
    } catch (err) {
      alert('삭제 실패');
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim()) return;
    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeacherName.trim() }),
      });
      if (res.ok) {
        setNewTeacherName('');
        fetchTeachers();
      } else {
        alert('등록 실패 (이미 등록된 이름일 수 있습니다)');
      }
    } catch (err) {
      alert('등록 실패');
    }
  };

  const handleDeleteTeacher = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/teachers/${id}`, { method: 'DELETE' });
      if (res.ok) fetchTeachers();
    } catch (err) {
      alert('삭제 실패');
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <header className="mb-12 text-center">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-4" style={{ textShadow: '4px 4px 0px #000' }}>
          <span className="text-white">Edu</span><span className="text-yellow-400">Track</span>
        </h1>
        <p className="text-xl font-bold bg-black text-white inline-block px-4 py-2 brutal-border transform -rotate-2">
          학교 연수 및 이수증 관리 시스템
        </p>
      </header>

      <nav className="flex flex-wrap gap-4 justify-center mb-12">
        <button 
          onClick={() => setActiveTab('list')}
          className={`brutal-btn brutal-shadow flex items-center gap-2 text-lg ${activeTab === 'list' ? 'bg-cyan-400 translate-x-[-2px] translate-y-[-2px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]' : 'bg-white'}`}
        >
          <List size={24} /> 연수 목록
        </button>
        <button 
          onClick={() => setActiveTab('submit')}
          className={`brutal-btn brutal-shadow flex items-center gap-2 text-lg ${activeTab === 'submit' ? 'bg-pink-400 translate-x-[-2px] translate-y-[-2px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]' : 'bg-white'}`}
        >
          <Upload size={24} /> 이수증 제출
        </button>
        <button 
          onClick={() => setActiveTab('status')}
          className={`brutal-btn brutal-shadow flex items-center gap-2 text-lg ${activeTab === 'status' ? 'bg-yellow-400 translate-x-[-2px] translate-y-[-2px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]' : 'bg-white'}`}
        >
          <CheckCircle size={24} /> 제출 현황
        </button>
        <button 
          onClick={() => setActiveTab('teachers')}
          className={`brutal-btn brutal-shadow flex items-center gap-2 text-lg ${activeTab === 'teachers' ? 'bg-green-400 translate-x-[-2px] translate-y-[-2px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]' : 'bg-white'}`}
        >
          <Users size={24} /> 선생님 명단
        </button>
      </nav>

      <main>
        {activeTab === 'list' && (
          <div className="space-y-12">
            <section className="bg-white p-6 md:p-8 brutal-border brutal-shadow">
              <h2 className="text-3xl font-black mb-6 flex items-center gap-3">
                <Plus className="bg-black text-white rounded-full p-1" size={32} />
                새 연수 등록
              </h2>
              <form onSubmit={handleCreateTraining} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-lg">연수명</label>
                  <input required value={newTraining.title} onChange={e => setNewTraining({...newTraining, title: e.target.value})} className="brutal-input bg-yellow-50" placeholder="예: 2026 법정의무 인성교육" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-lg">요청 부서</label>
                  <input required value={newTraining.requester} onChange={e => setNewTraining({...newTraining, requester: e.target.value})} className="brutal-input bg-cyan-50" placeholder="예: 창의인성부" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-lg">제출 기한</label>
                  <input required type="date" value={newTraining.deadline} onChange={e => setNewTraining({...newTraining, deadline: e.target.value})} className="brutal-input bg-pink-50" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-lg">상세 설명 (선택)</label>
                  <input value={newTraining.description} onChange={e => setNewTraining({...newTraining, description: e.target.value})} className="brutal-input bg-gray-50" placeholder="예: 대구광역시교육연수원 사이트 이용" />
                </div>
                <div className="md:col-span-2 flex justify-end mt-4">
                  <button type="submit" className="brutal-btn brutal-shadow bg-black text-white hover:bg-gray-800 text-xl">
                    등록하기
                  </button>
                </div>
              </form>
            </section>

            <section>
              <h2 className="text-3xl font-black mb-6 bg-yellow-400 inline-block px-4 py-2 brutal-border transform -rotate-1">진행 중인 연수</h2>
              {trainings.length === 0 ? (
                <div className="bg-white p-8 brutal-border text-center font-bold text-xl text-gray-500">
                  등록된 연수가 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trainings.map(t => (
                    <div key={t.id} className="bg-white brutal-border brutal-shadow p-6 flex flex-col relative overflow-hidden group">
                      <div className="absolute top-0 right-0 bg-black text-white font-bold px-3 py-1 brutal-border border-t-0 border-r-0">
                        {t.requester}
                      </div>
                      <h3 className="text-2xl font-black mt-4 mb-2 leading-tight">{t.title}</h3>
                      <p className="text-gray-600 font-medium mb-4 flex-grow">{t.description}</p>
                      <div className="mt-auto pt-4 border-t-3 border-black flex justify-between items-center">
                        <span className="font-bold bg-pink-200 px-2 py-1 brutal-border text-sm">
                          기한: {t.deadline}
                        </span>
                        <button onClick={() => handleDeleteTraining(t.id)} className="text-red-500 hover:text-red-700 transition-colors" title="삭제">
                          <Trash2 size={24} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'submit' && (
          <div className="max-w-2xl mx-auto">
            <section className="bg-cyan-400 p-6 md:p-8 brutal-border brutal-shadow">
              <h2 className="text-3xl font-black mb-6 flex items-center gap-3 bg-white inline-flex px-4 py-2 brutal-border transform rotate-1">
                <FileText size={32} />
                이수증 제출하기
              </h2>
              <form onSubmit={handleSubmitCertificate} className="bg-white p-6 brutal-border flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-xl">대상 연수 선택</label>
                  <select 
                    required 
                    value={submitForm.training_id} 
                    onChange={e => setSubmitForm({...submitForm, training_id: e.target.value})}
                    className="brutal-input bg-gray-50 text-lg"
                  >
                    <option value="">-- 연수를 선택하세요 --</option>
                    {trainings.map(t => (
                      <option key={t.id} value={t.id}>{t.title} (기한: {t.deadline})</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-xl">제출자 성명</label>
                  <select 
                    required 
                    value={submitForm.teacher_name} 
                    onChange={e => setSubmitForm({...submitForm, teacher_name: e.target.value})}
                    className="brutal-input bg-gray-50 text-lg" 
                  >
                    <option value="">-- 제출자 선택 --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                  {teachers.length === 0 && <p className="text-red-500 font-bold">선생님 명단을 먼저 등록해주세요.</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-xl">삭제 비밀번호</label>
                  <input 
                    required 
                    type="password"
                    value={submitForm.password} 
                    onChange={e => setSubmitForm({...submitForm, password: e.target.value})}
                    className="brutal-input bg-gray-50 text-lg" 
                    placeholder="삭제 시 사용할 비밀번호를 입력하세요" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-xl">이수증 파일 첨부 (PDF, 이미지 등)</label>
                  <input 
                    required 
                    type="file" 
                    ref={fileInputRef}
                    onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                    className="brutal-input bg-yellow-50 file:mr-4 file:py-2 file:px-4 file:brutal-btn file:bg-black file:text-white file:text-sm file:border-0 hover:file:bg-gray-800" 
                  />
                </div>
                <button type="submit" className="brutal-btn brutal-shadow bg-pink-400 text-black text-2xl mt-4 py-4 hover:bg-pink-500">
                  제출 완료하기
                </button>
              </form>
            </section>
          </div>
        )}

        {activeTab === 'status' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-black mb-6 bg-pink-400 inline-block px-4 py-2 brutal-border transform rotate-1">제출 현황 목록</h2>
            
            {trainings.length === 0 ? (
              <div className="bg-white p-8 brutal-border text-center font-bold text-xl text-gray-500">
                등록된 연수가 없습니다.
              </div>
            ) : (
              <div className="space-y-8">
                {trainings.map(training => {
                  const trainingSubmissions = submissions.filter(s => s.training_id === training.id);
                  return (
                    <div key={training.id} className="bg-white brutal-border brutal-shadow p-6">
                      <h3 className="text-2xl font-black mb-4 flex items-center gap-2 flex-wrap">
                        <span className="bg-yellow-400 px-2 py-1 brutal-border text-lg">{training.requester}</span>
                        {training.title}
                        <span className="text-sm font-normal text-gray-500 ml-auto bg-gray-100 px-2 py-1 brutal-border">제출 마감: {training.deadline}</span>
                      </h3>
                      
                      {trainingSubmissions.length === 0 ? (
                        <p className="text-gray-500 font-bold py-6 text-center bg-gray-50 brutal-border">아직 제출된 이수증이 없습니다.</p>
                      ) : (
                        <div className="overflow-x-auto brutal-border">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-black text-white text-lg">
                                <th className="p-3 border-b-3 border-black">선생님</th>
                                <th className="p-3 border-b-3 border-black text-center">제출 여부</th>
                                <th className="p-3 border-b-3 border-black">제출일시</th>
                                <th className="p-3 border-b-3 border-black">첨부파일</th>
                                <th className="p-3 border-b-3 border-black text-center">관리</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.from(new Set([...teachers.map(t => t.name), ...trainingSubmissions.map(s => s.teacher_name)])).sort().map((teacherName, idx) => {
                                const sub = trainingSubmissions.find(s => s.teacher_name === teacherName);
                                return (
                                  <tr key={teacherName} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-yellow-100 transition-colors`}>
                                    <td className="p-3 border-b-3 border-black font-bold text-lg">{teacherName}</td>
                                    <td className="p-3 border-b-3 border-black text-center">
                                      {sub ? <span className="text-green-600 font-black text-2xl">O</span> : <span className="text-red-500 font-black text-2xl">X</span>}
                                    </td>
                                    <td className="p-3 border-b-3 border-black font-mono text-sm">
                                      {sub ? format(new Date(sub.submitted_at), 'yyyy-MM-dd HH:mm') : '-'}
                                    </td>
                                    <td className="p-3 border-b-3 border-black">
                                      {sub ? (
                                        <a 
                                          href={`/api/download/${sub.file_name}`} 
                                          className="inline-flex items-center gap-2 bg-cyan-200 px-3 py-1 brutal-border font-bold hover:bg-cyan-300 transition-colors"
                                          download={sub.original_name}
                                        >
                                          <Download size={16} /> {sub.original_name}
                                        </a>
                                      ) : '-'}
                                    </td>
                                    <td className="p-3 border-b-3 border-black text-center">
                                      {sub && (
                                        <button 
                                          onClick={() => handleDeleteSubmission(sub.id)}
                                          className="bg-red-400 text-white p-2 brutal-border hover:bg-red-500 transition-colors"
                                          title="삭제"
                                        >
                                          <Trash2 size={20} />
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'teachers' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <section className="bg-green-400 p-6 md:p-8 brutal-border brutal-shadow">
              <h2 className="text-3xl font-black mb-6 flex items-center gap-3 bg-white inline-flex px-4 py-2 brutal-border transform -rotate-1">
                <Users size={32} />
                선생님 명단 관리
              </h2>
              <form onSubmit={handleCreateTeacher} className="bg-white p-6 brutal-border flex flex-col md:flex-row gap-4 items-end">
                <div className="flex flex-col gap-2 flex-grow">
                  <label className="font-bold text-xl">새 선생님 이름</label>
                  <input 
                    required 
                    value={newTeacherName} 
                    onChange={e => setNewTeacherName(e.target.value)}
                    className="brutal-input bg-gray-50 text-lg" 
                    placeholder="예: 홍길동" 
                  />
                </div>
                <button type="submit" className="brutal-btn brutal-shadow bg-black text-white text-xl py-3 px-6 hover:bg-gray-800 h-[58px]">
                  추가하기
                </button>
              </form>
            </section>

            <section className="bg-white brutal-border brutal-shadow p-6">
              <h3 className="text-2xl font-black mb-6">등록된 선생님 ({teachers.length}명)</h3>
              {teachers.length === 0 ? (
                <p className="text-gray-500 font-bold text-center py-8">등록된 선생님이 없습니다.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {teachers.map(teacher => (
                    <div key={teacher.id} className="bg-gray-50 brutal-border p-3 flex justify-between items-center group hover:bg-yellow-100 transition-colors">
                      <span className="font-bold text-lg">{teacher.name}</span>
                      <button 
                        onClick={() => handleDeleteTeacher(teacher.id)}
                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="삭제"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

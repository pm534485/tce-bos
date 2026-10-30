import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ShieldCheck,
  BookOpen,
  Sliders,
  Users,
  Download,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  Layers,
  Sparkles,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bundler' | 'readiness' | 'master' | 'settings' | 'users'>('readiness');

  // Programme state
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [selectedProgCode, setSelectedProgCode] = useState<string>('CA');

  // Readiness report state
  const [readinessData, setReadinessData] = useState<any>(null);
  const [loadingReadiness, setLoadingReadiness] = useState<boolean>(false);

  // Bundler form state
  const [annexureNo, setAnnexureNo] = useState<string>('01');
  const [regulationYear, setRegulationYear] = useState<number>(2026);
  const [minSem, setMinSem] = useState<number>(1);
  const [maxSem, setMaxSem] = useState<number>(8);
  const [isBundling, setIsBundling] = useState<boolean>(false);

  // Master data state
  const [activeCollection, setActiveCollection] = useState<string>('programmes');
  const [masterItems, setMasterItems] = useState<any[]>([]);
  const [loadingMaster, setLoadingMaster] = useState<boolean>(false);

  // Users state
  const [usersList, setUsersList] = useState<any[]>([]);

  // Active Regulation State
  const [adminRegYear, setAdminRegYear] = useState<number>(2026);
  const [adminRegCode, setAdminRegCode] = useState<string>('26');
  const [savingReg, setSavingReg] = useState<boolean>(false);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadProgrammes();
    loadRegulation();
  }, []);

  async function loadRegulation() {
    try {
      const reg = await api.getActiveRegulation();
      if (reg) {
        setAdminRegYear(reg.regulationYear || 2026);
        setAdminRegCode(reg.regulationCode || '26');
      }
    } catch (e) {
      console.error('Failed to load active regulation:', e);
    }
  }

  const handleSaveRegulation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingReg(true);
      setRegSuccess(null);
      const res = await api.updateActiveRegulation({
        regulationYear: Number(adminRegYear),
        regulationCode: String(adminRegCode).trim(),
      });
      setRegSuccess(`Active regulation updated to Regulation ${res.regulationYear} (Code: ${res.regulationCode}). All syllabus pages will now automatically use this regulation.`);
    } catch (err: any) {
      alert(`Failed to update regulation: ${err.message}`);
    } finally {
      setSavingReg(false);
    }
  };

  useEffect(() => {
    if (selectedProgCode) {
      loadReadiness(selectedProgCode);
    }
  }, [selectedProgCode]);

  useEffect(() => {
    if (activeTab === 'master') {
      loadMaster(activeCollection);
    } else if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, activeCollection]);

  async function loadProgrammes() {
    try {
      const data = await api.getProgrammes();
      setProgrammes(data);
      if (data.length > 0 && !selectedProgCode) {
        setSelectedProgCode(data[0].code);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadReadiness(code: string) {
    try {
      setLoadingReadiness(true);
      const report = await api.getReadinessReport(code);
      setReadinessData(report);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReadiness(false);
    }
  }

  async function loadMaster(col: string) {
    try {
      setLoadingMaster(true);
      const items = await api.getMaster(col);
      setMasterItems(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMaster(false);
    }
  }

  async function loadUsers() {
    try {
      const u = await api.getUsers();
      setUsersList(u);
    } catch (err) {
      console.error(err);
    }
  }

  const handleDownloadBundle = () => {
    const url = api.bundleProgrammeUrl(selectedProgCode);
    // Post to trigger download
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('syllabusforge_token')}`,
      },
      body: JSON.stringify({
        regulationYear,
        minSemester: minSem,
        maxSemester: maxSem,
        annexureNo,
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Bundle download failed');
        return res.blob();
      })
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `Annexure ${annexureNo} - ${selectedProgCode}.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(err => alert(err.message));
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#7B1113] tracking-tight flex items-center space-x-2 font-tce">
          <ShieldCheck className="w-6 h-6 text-[#C59B27]" />
          <span>Academic Council (ACM) & System Administration</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Perform institutional readiness audits for Thiagarajar College of Engineering, compile multi-semester curriculum bundles, and configure master data collections.
        </p>
      </div>

      {/* Admin Tabs */}
      <div className="flex space-x-1 bg-white border border-slate-200 border-t-4 border-t-[#7B1113] p-1.5 rounded-2xl shadow-xs text-xs font-semibold text-slate-600">
        <button
          onClick={() => setActiveTab('readiness')}
          className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all ${
            activeTab === 'readiness' ? 'bg-[#7B1113] text-white shadow-sm font-bold' : 'hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4 text-[#E2BF53]" />
          <span>ACM Readiness Report</span>
        </button>
        <button
          onClick={() => setActiveTab('bundler')}
          className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all ${
            activeTab === 'bundler' ? 'bg-[#7B1113] text-white shadow-sm font-bold' : 'hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Download className="w-4 h-4 text-[#E2BF53]" />
          <span>Programme Bundler (.docx)</span>
        </button>
        <button
          onClick={() => setActiveTab('master')}
          className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all ${
            activeTab === 'master' ? 'bg-[#7B1113] text-white shadow-sm font-bold' : 'hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4 text-[#E2BF53]" />
          <span>Master Data Collections</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all ${
            activeTab === 'users' ? 'bg-[#7B1113] text-white shadow-sm font-bold' : 'hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-[#E2BF53]" />
          <span>User Management</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all ${
            activeTab === 'settings' ? 'bg-[#7B1113] text-white shadow-sm font-bold' : 'hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#E2BF53]" />
          <span>Regulation Settings</span>
        </button>
      </div>

      {/* TAB 1: ACM Readiness Report */}
      {activeTab === 'readiness' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Academic Council Meeting Readiness Audit</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluates every course in the selected programme against 100% institutional compliance rules and consistency checks.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <label className="text-xs font-bold text-slate-700">Select Programme:</label>
              <select
                value={selectedProgCode}
                onChange={e => setSelectedProgCode(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white font-semibold text-slate-800"
              >
                {programmes.map(p => (
                  <option key={p.code} value={p.code}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingReadiness ? (
            <div className="p-12 text-center text-xs text-slate-400">Auditing programme courses...</div>
          ) : readinessData ? (
            <div className="space-y-6">
              {/* Readiness Banner */}
              <div
                className={`p-5 rounded-2xl border flex items-center justify-between ${
                  readinessData.isProgrammeReady
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {readinessData.isProgrammeReady ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-amber-600 flex-shrink-0" />
                  )}
                  <div>
                    <h3 className="font-bold text-sm">
                      {readinessData.isProgrammeReady
                        ? `Programme ${readinessData.programmeCode} is 100% ACM Compliant!`
                        : `Programme ${readinessData.programmeCode} has Pending Action Items`}
                    </h3>
                    <p className="text-xs mt-0.5 opacity-90">
                      {readinessData.isProgrammeReady
                        ? 'All course codes, titles, and syllabus components pass institutional guidelines and are ready for official compilation.'
                        : 'Some courses contain compliance errors or have not completed formal HoD approval.'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold">{readinessData.totalCourses}</div>
                  <div className="text-[10px] uppercase tracking-wider font-bold opacity-75">Total Courses</div>
                </div>
              </div>

              {/* Course-by-course audit table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-3 border-b">Code</th>
                      <th className="p-3 border-b">Course Title</th>
                      <th className="p-3 border-b text-center">Sem</th>
                      <th className="p-3 border-b text-center">Type</th>
                      <th className="p-3 border-b text-center">Status</th>
                      <th className="p-3 border-b text-center">Errors</th>
                      <th className="p-3 border-b text-center">Warnings</th>
                      <th className="p-3 border-b text-center">Compliance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(readinessData.courseAudits || []).map((ca: any) => (
                      <tr key={ca.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-bold text-slate-800">{ca.courseCode}</td>
                        <td className="p-3 font-semibold text-slate-900">{ca.courseName}</td>
                        <td className="p-3 text-center">{ca.semester}</td>
                        <td className="p-3 text-center">{ca.courseType}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                              ca.status === 'APPROVED' || ca.status === 'FINALIZED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ca.status === 'SUBMITTED'
                                ? 'bg-amber-100 text-amber-800'
                                : ca.status === 'RETURNED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {ca.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold ${
                              ca.errorCount > 0 ? 'bg-rose-100 text-red-800' : 'text-slate-400'
                            }`}
                          >
                            {ca.errorCount}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold ${
                              ca.warningCount > 0 ? 'bg-amber-100 text-amber-800' : 'text-slate-400'
                            }`}
                          >
                            {ca.warningCount}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {ca.isValid ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-500 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 2: Programme Bundler */}
      {activeTab === 'bundler' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Programme Compilation Bundler</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Compiles approved syllabi for a programme into a single official Word (.docx) document formatted with standard front page and running footers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Programme</label>
              <select
                value={selectedProgCode}
                onChange={e => setSelectedProgCode(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                {programmes.map(p => (
                  <option key={p.code} value={p.code}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Annexure No.</label>
              <input
                type="text"
                value={annexureNo}
                onChange={e => setAnnexureNo(e.target.value)}
                placeholder="Annexure no."
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-center"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">File: Annexure {annexureNo} - &lt;Prog&gt;.docx</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Regulation Year</label>
              <input
                type="number"
                value={regulationYear}
                onChange={e => setRegulationYear(parseInt(e.target.value) || 2026)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Semester Range</label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={minSem}
                  onChange={e => setMinSem(parseInt(e.target.value) || 1)}
                  className="w-1/2 p-2 border border-slate-300 rounded-lg text-xs text-center"
                />
                <span className="text-slate-400 text-xs">to</span>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={maxSem}
                  onChange={e => setMaxSem(parseInt(e.target.value) || 8)}
                  className="w-1/2 p-2 border border-slate-300 rounded-lg text-xs text-center"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2 text-xs text-purple-900">
            <span className="font-bold block">ACM Front Page Specification:</span>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
              <li>Header: "FOR {selectedProgCode} PROGRAMME"</li>
              <li>Year Directive: "FOR THE STUDENTS ADMITTED FROM THE ACADEMIC YEAR {regulationYear}–{(regulationYear + 1).toString().slice(-2)} ONWARDS"</li>
              <li>Footers: "Passed in BoS Meeting | Approved in 71st Academic Council Meeting 27.06.2026" (Arial 9)</li>
            </ul>
          </div>

          <button
            onClick={handleDownloadBundle}
            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center space-x-2 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download Compiled Programme Bundle (.docx)</span>
          </button>
        </div>
      )}

      {/* TAB 3: Master Data Collections */}
      {activeTab === 'master' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Institutional Master Data</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Editable collection tables seeded from university curriculum guidelines.
              </p>
            </div>

            <select
              value={activeCollection}
              onChange={e => setActiveCollection(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white font-semibold text-slate-800"
            >
              <option value="programmes">Programme Codes</option>
              <option value="categories">Category Codes</option>
              <option value="verbs">TPS Verbs Dictionary</option>
              <option value="objectives">13 Lab Objectives</option>
              <option value="generalCos">General CO Pool</option>
              <option value="pis">Performance Indicators</option>
              <option value="sdgs">17 UN SDGs</option>
              <option value="domainSdgMap">Course Domain to SDG Map</option>
              <option value="tcpWeightage">TCP Continuous/ESE Weightage Table</option>
              <option value="config">System Config Settings</option>
            </select>
          </div>

          {loadingMaster ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading master items...</div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                  <tr>
                    <th className="p-3 border-b">#</th>
                    <th className="p-3 border-b">Identifier / Code</th>
                    <th className="p-3 border-b">Details / Description</th>
                  </tr>
                </thead>
                <tbody>
                  {masterItems.map((item, idx) => (
                    <tr key={item._id || idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-3 text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-slate-800">
                        {item.code || item.no || item.piNumber || item.tpsLevel || item.domain || item.key || item.ltp}
                      </td>
                      <td className="p-3 text-slate-700">
                        {item.name ||
                          item.statement ||
                          item.descriptor ||
                          item.description ||
                          (item.verbs ? item.verbs.join(', ') : '') ||
                          JSON.stringify(item.value || item)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: User Management */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-slate-900">User Management</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="p-3 border-b">Name</th>
                  <th className="p-3 border-b">Email</th>
                  <th className="p-3 border-b">Role</th>
                  <th className="p-3 border-b">Department</th>
                  <th className="p-3 border-b">Designation</th>
                  <th className="p-3 border-b">Programme Access</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-900">{u.name}</td>
                    <td className="p-3 font-mono text-slate-600">{u.email}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-slate-100 text-slate-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">{u.department}</td>
                    <td className="p-3 text-slate-700">{u.designation}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {(u.programmeAccess || []).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Regulation Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-lg font-bold text-slate-900">Institutional Regulation Settings</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure the active regulation year and regulation code. When updated here, the value is saved in MongoDB and automatically reflected across the Subject Code / Regulation creation workflow without requiring hardcoded values.
            </p>
          </div>

          {regSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{regSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveRegulation} className="space-y-6 max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Regulation Year <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={2000}
                  max={2100}
                  value={adminRegYear}
                  onChange={e => setAdminRegYear(parseInt(e.target.value) || 2026)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#7B1113]"
                  placeholder="e.g. 2026"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Full academic regulation year (e.g. 2026)</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Regulation Code (RR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={adminRegCode}
                  onChange={e => setAdminRegCode(e.target.value.trim())}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 text-center font-mono focus:ring-2 focus:ring-[#7B1113]"
                  placeholder="e.g. 26"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">2-digit course code prefix (e.g. 26)</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs text-slate-700">
              <span className="font-bold block text-slate-900">Live Course Code Pattern Preview:</span>
              <p className="font-mono text-sm font-bold text-[#7B1113]">
                {adminRegCode || '26'}_____ &nbsp;
                <span className="text-xs font-normal text-slate-500 font-sans">
                  (Regulation: {adminRegCode || '26'}, Programme: __, Category: _, Letter: _, Version: _)
                </span>
              </p>
            </div>

            <button
              type="submit"
              disabled={savingReg || !adminRegYear || !adminRegCode}
              className="px-6 py-2.5 rounded-xl bg-[#7B1113] hover:bg-[#600D0F] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md shadow-[#7B1113]/20 flex items-center space-x-2 transition-all active:scale-95"
            >
              {savingReg ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving to MongoDB...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save & Publish Regulation</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

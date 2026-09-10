"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/Layout";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { Plus, X, Search, QrCode, Upload, AlertCircle, Trash2 } from "lucide-react";
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function FaultsPage() {
  const { user } = useAuth();
  const [faults, setFaults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isScannerOpen, setScannerOpen] = useState(false);
  
  // New Report State
  const [equipments, setEquipments] = useState<any[]>([]);
  const [newReport, setNewReport] = useState({ eq_id: "", description: "", priority: "normal" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [reporting, setReporting] = useState(false);

  // Manage Fault State
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isManageModalOpen, setManageModalOpen] = useState(false);
  const [selectedFault, setSelectedFault] = useState<any>(null);
  const [updateData, setUpdateData] = useState({ status: '', technician_id: '', remarks: '' });
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [clusterInsights, setClusterInsights] = useState<string[]>([]);

  useEffect(() => {
    fetchFaults();
    if (user?.role === 'user' || user?.role === 'admin') {
      fetchEquipment();
    }
    if (user?.role === 'admin') {
      fetchTechnicians();
    }
  }, [user]);

  const fetchTechnicians = async () => {
    try {
      const res = await api.get('/auth/technicians');
      setTechnicians(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isScannerOpen) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
      scanner.render((text) => {
        scanner.clear();
        setScannerOpen(false);
        const eq = equipments.find(e => e.qr_code === text);
        if (eq) {
          setNewReport(prev => ({ ...prev, eq_id: eq.id.toString() }));
          toast.success("Equipment found!");
        } else {
          toast.error("Equipment not found in system.");
        }
      }, () => {});
      return () => { scanner.clear().catch(()=>{}) };
    }
  }, [isScannerOpen, equipments]);

  const fetchFaults = async () => {
    try {
      const res = await api.get('/faults');
      setFaults(res.data);
      
      // Notify Technician of assigned pending faults
      if (user?.role === 'technician') {
        const assignedPending = res.data.filter((f: any) => f.status === 'pending');
        if (assignedPending.length > 0) {
          toast(`You have ${assignedPending.length} assigned pending fault(s)!`, {
            icon: '🔧',
            duration: 6000
          });
        }
      }
    } catch (error) {
      toast.error("Failed to load faults");
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async () => {
    try {
      const res = await api.get('/equipment');
      setEquipments(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDescriptionChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNewReport({ ...newReport, description: text });
    
    if (text.length > 5) {
      try {
        const res = await api.post('/ai/suggest', { description: text, eq_id: newReport.eq_id });
        setSuggestions(res.data.suggestions);
      } catch (error) {
        // ignore errors for suggestions
      }
    } else {
      setSuggestions([]);
    }
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setReporting(true);
    try {
      const formData = new FormData();
      formData.append('eq_id', newReport.eq_id);
      formData.append('description', newReport.description);
      formData.append('priority', newReport.priority);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      await api.post('/faults', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Fault reported successfully!");
      setModalOpen(false);
      setNewReport({ eq_id: "", description: "", priority: "normal" });
      setImageFile(null);
      fetchFaults();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error reporting fault");
    } finally {
      setReporting(false);
    }
  };

  const handleManageClick = (fault: any) => {
    setSelectedFault(fault);
    setUpdateData({
      status: fault.status,
      technician_id: fault.technician_id ? fault.technician_id.toString() : '',
      remarks: fault.remarks || ''
    });

    // Calculate cluster insights
    const insights: string[] = [];
    
    // Cluster reporting: > 3 systems reporting network issue
    const networkIssues = faults.filter(f => 
      f.description.toLowerCase().includes('network') || 
      f.description.toLowerCase().includes('internet')
    );
    if (networkIssues.length >= 3) {
      insights.push("Cluster Reporting: Multiple systems (>3) are reporting network issues. This may indicate a switch or router issue in the lab.");
    }

    // Repeated problem detection: > 2 times same system reported OS crash
    const sameSystemCrashes = faults.filter(f => 
      f.equipment_id === fault.equipment_id && 
      (f.description.toLowerCase().includes('os crash') || f.description.toLowerCase().includes('crash'))
    );
    if (sameSystemCrashes.length >= 2) {
      insights.push("Repeated Problem Detection: This system has reported OS crashes multiple times. This could indicate SSD failure or failing RAM.");
    }

    setClusterInsights(insights);
    setManageModalOpen(true);
  };

  const handleUpdateFault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFault) return;
    
    setUpdating(true);
    try {
      const payload: any = { status: updateData.status, remarks: updateData.remarks };
      if (user?.role === 'admin') {
        payload.technician_id = updateData.technician_id || null;
      }
      
      await api.put(`/faults/${selectedFault.id}`, payload);
      toast.success("Fault updated successfully!");
      setManageModalOpen(false);
      fetchFaults();
    } catch (error) {
      toast.error("Error updating fault");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteFault = async (fault: any) => {
    if (!window.confirm(`Delete fault report #${fault.id}? This cannot be undone.`)) return;

    setDeletingId(fault.id);
    try {
      await api.delete(`/faults/${fault.id}`);
      setFaults((current) => current.filter((item) => item.id !== fault.id));
      toast.success('Fault report deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete fault report');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fault Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage and track laboratory equipment issues.</p>
        </div>
        {(user?.role === 'user' || user?.role === 'admin') && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Report Fault
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium">ID</th>
                <th className="px-6 py-4 font-medium">Equipment</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Image</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Priority</th>
                <th className="px-6 py-4 font-medium">Technician</th>
                <th className="px-6 py-4 font-medium">Date</th>
                {(user?.role === 'admin' || user?.role === 'technician') && (
                  <th className="px-6 py-4 font-medium">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-4 text-center">Loading...</td></tr>
              ) : faults.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-4 text-center text-gray-500">No fault reports found.</td></tr>
              ) : (
                faults.map((fault) => (
                  <tr key={fault.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">#{fault.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {fault.equipment_name}
                      <span className="block text-xs text-gray-500">{fault.lab_name}</span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" title={fault.description}>
                      {fault.description}
                    </td>
                    <td className="px-6 py-4">
                      {fault.image_url ? (
                        <a href={`http://localhost:3001${fault.image_url}`} target="_blank" className="text-primary hover:underline">View</a>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        fault.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500' :
                        fault.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500' :
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'
                      }`}>
                        {fault.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 capitalize">
                      <span className={`${fault.priority === 'critical' ? 'text-red-500 font-bold' : ''}`}>
                        {fault.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {fault.technician_name || <span className="text-gray-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(fault.created_at).toLocaleString()}
                    </td>
                        {(user?.role === 'admin' || user?.role === 'technician') && (
                      <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleManageClick(fault)}
                                className="text-sm bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-md transition"
                              >
                                Manage
                              </button>
                              {user?.role === 'admin' && (
                                <button
                                  onClick={() => handleDeleteFault(fault)}
                                  disabled={deletingId === fault.id}
                                  className="p-1.5 text-error hover:text-red-800 disabled:opacity-50"
                                  title="Delete fault report"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Report Equipment Fault</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={submitReport} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Equipment</label>
                <div className="flex gap-2">
                  <select 
                    required
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                    value={newReport.eq_id}
                    onChange={(e) => setNewReport({...newReport, eq_id: e.target.value})}
                  >
                    <option value="">Select Equipment</option>
                    {equipments.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.name} ({eq.lab_name})</option>
                    ))}
                  </select>
                  <button 
                    type="button"
                    onClick={() => setScannerOpen(true)}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <QrCode className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                  value={newReport.priority}
                  onChange={(e) => setNewReport({...newReport, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                  placeholder="Describe the issue in detail..."
                  value={newReport.description}
                  onChange={handleDescriptionChange}
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Attach Image (Optional)</label>
                <div className="flex items-center">
                  <label className="flex items-center justify-center px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <Upload className="w-5 h-5 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{imageFile ? imageFile.name : 'Choose File'}</span>
                    <input 
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files && setImageFile(e.target.files[0])}
                    />
                  </label>
                  {imageFile && (
                    <button type="button" onClick={() => setImageFile(null)} className="ml-2 text-red-500 text-sm">Remove</button>
                  )}
                </div>
              </div>

              {/* AI Suggestions Box */}
              {suggestions.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-blue-800 dark:text-blue-400 mb-2 flex items-center">
                    <Search className="w-4 h-4 mr-2" />
                    AI-Lite Suggestion
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                    {suggestions.map((sug, i) => (
                      <li key={i}>{sug}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-500 mt-2 italic">Try these common fixes before submitting the report if possible.</p>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg mr-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reporting}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {reporting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Scan QR Code</h2>
              <button onClick={() => setScannerOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <div id="reader" className="w-full"></div>
            </div>
          </div>
        </div>
      )}
      {/* Manage Fault Modal */}
      {isManageModalOpen && selectedFault && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manage Fault #{selectedFault.id}</h2>
              <button onClick={() => setManageModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateFault} className="p-6 space-y-4">
              <div className="mb-4 text-sm">
                <p><strong>Equipment:</strong> {selectedFault.equipment_name}</p>
                <p><strong>Description:</strong> {selectedFault.description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select 
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                  value={updateData.status}
                  onChange={(e) => setUpdateData({...updateData, status: e.target.value})}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="solved">Solved</option>
                </select>
              </div>

              {user?.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign Technician</label>
                  <select 
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                    value={updateData.technician_id}
                    onChange={(e) => setUpdateData({...updateData, technician_id: e.target.value})}
                  >
                    <option value="">-- Unassigned --</option>
                    {technicians.map(tech => (
                      <option key={tech.id} value={tech.id}>{tech.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Remarks</label>
                <textarea 
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                  placeholder="Add notes about the repair..."
                  value={updateData.remarks}
                  onChange={(e) => setUpdateData({...updateData, remarks: e.target.value})}
                ></textarea>
              </div>

              {clusterInsights.length > 0 && user?.role === 'admin' && (
                <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <h4 className="text-sm font-bold text-orange-800 dark:text-orange-400 mb-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    AI Insights & Cluster Reporting
                  </h4>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-2">
                    {clusterInsights.map((insight, idx) => (
                      <li key={idx}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setManageModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg mr-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/Layout";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { QRCodeCanvas } from 'qrcode.react';
import { Plus, X, Download, Trash2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EquipmentPage() {
  const { user } = useAuth();
  const [equipments, setEquipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newEq, setNewEq] = useState({ name: '', lab_id: '', qr_code: '', priority: 'normal' });
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [labs, setLabs] = useState<any[]>([]);

  useEffect(() => {
    fetchEquipment();
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const res = await api.get('/equipment/labs');
      setLabs(res.data);
      if (res.data.length > 0) {
        setNewEq(prev => ({ ...prev, lab_id: res.data[0].id.toString() }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchEquipment = async () => {
    try {
      const res = await api.get('/equipment');
      setEquipments(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      if (editingId) {
        await api.put(`/equipment/${editingId}`, newEq);
        toast.success("Equipment updated successfully!");
      } else {
        await api.post('/equipment', newEq);
        toast.success("Equipment added successfully!");
      }
      setModalOpen(false);
      setEditingId(null);
      setNewEq({ name: '', lab_id: '', qr_code: '', priority: 'normal' });
      fetchEquipment();
    } catch (error: any) {
      toast.error(error.response?.data?.message || (editingId ? "Failed to update equipment" : "Failed to add equipment"));
    } finally {
      setAdding(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setNewEq({ name: '', lab_id: labs[0]?.id?.toString() || '', qr_code: '', priority: 'normal' });
    setModalOpen(true);
  };

  const openEditModal = (equipment: any) => {
    setEditingId(equipment.id);
    setNewEq({
      name: equipment.name,
      lab_id: equipment.lab_id?.toString() || '',
      qr_code: equipment.qr_code,
      priority: equipment.priority || 'normal'
    });
    setModalOpen(true);
  };

  const downloadQR = (id: number, name: string) => {
    const canvas = document.getElementById(`qr-${id}`) as HTMLCanvasElement;
    if (canvas) {
      const padding = 24;
      const qrSize = 240;
      const labelHeight = 52;
      const downloadCanvas = document.createElement('canvas');
      downloadCanvas.width = qrSize + padding * 2;
      downloadCanvas.height = qrSize + labelHeight + padding * 2;
      const context = downloadCanvas.getContext('2d');
      if (!context) return;

      context.fillStyle = '#FDFBF9';
      context.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);
      context.imageSmoothingEnabled = false;
      context.drawImage(canvas, padding, padding, qrSize, qrSize);
      context.fillStyle = '#1F1F1F';
      context.font = 'bold 20px Arial';
      context.textAlign = 'center';
      context.fillText(`System No: ${name}`, downloadCanvas.width / 2, qrSize + padding + 36);

      const pngUrl = downloadCanvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `${name.replace(/\s+/g, '_')}_QR.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const handleRemoveEquipment = async (id: number, name: string) => {
    if (!window.confirm(`Remove ${name}? This cannot be undone.`)) return;

    setDeletingId(id);
    try {
      await api.delete(`/equipment/${id}`);
      setEquipments((current) => current.filter((equipment) => equipment.id !== id));
      toast.success('Equipment removed successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove equipment');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Equipment Directory</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">View and manage laboratory equipment and QR Codes.</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={openAddModal}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Equipment
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center p-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {equipments.map((eq) => (
            <div key={eq.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex items-start">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{eq.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{eq.lab_name}</p>
                
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                  eq.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500' :
                  eq.status === 'faulty' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
                }`}>
                  {eq.status}
                </span>

                <div className="mt-4 text-xs text-gray-400 font-mono">
                  ID: {eq.qr_code}
                </div>
              </div>
              
              <div className="ml-4 bg-white p-2 rounded-lg border border-gray-200 flex flex-col items-center">
                <QRCodeCanvas id={`qr-${eq.id}`} value={`http://192.168.1.100:3000/report?qr=${eq.qr_code}`} size={80} />
                <button 
                  onClick={() => downloadQR(eq.id, eq.name)}
                  className="mt-2 text-xs flex items-center text-primary hover:text-primary-dark"
                  title="Download QR Code"
                >
                  <Download className="w-3 h-3 mr-1" /> Download
                </button>
                {user?.role === 'admin' && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(eq)}
                      className="text-xs flex items-center text-primary hover:text-primary-dark"
                      title="Edit equipment"
                    >
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => handleRemoveEquipment(eq.id, eq.name)}
                      disabled={deletingId === eq.id}
                      className="text-xs flex items-center text-error hover:text-red-800 disabled:opacity-50"
                      title="Remove equipment"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      {deletingId === eq.id ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Edit Equipment' : 'Add New Equipment'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddEquipment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Equipment Name</label>
                <input 
                  type="text"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                  value={newEq.name}
                  onChange={(e) => setNewEq({...newEq, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Laboratory</label>
                <select 
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                  value={newEq.lab_id}
                  onChange={(e) => setNewEq({...newEq, lab_id: e.target.value})}
                >
                  <option value="" disabled>Select Lab</option>
                  {labs.map(lab => (
                    <option key={lab.id} value={lab.id}>{lab.name} ({lab.location})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Priority</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                  value={newEq.priority}
                  onChange={(e) => setNewEq({...newEq, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">QR Code String</label>
                <input 
                  type="text"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                  value={newEq.qr_code}
                  onChange={(e) => setNewEq({...newEq, qr_code: e.target.value})}
                  placeholder="e.g. EQ-LAB2-04"
                />
              </div>

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
                  disabled={adding}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {adding ? (editingId ? "Saving..." : "Adding...") : (editingId ? "Save Changes" : "Add Equipment")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/Layout";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { Users, Plus, Trash2, Pencil, X } from "lucide-react";

export default function TechniciansPage() {
  const { user } = useAuth();
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/technicians');
      setTechnicians(res.data);
    } catch (error) {
      toast.error("Failed to load technicians");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || (!editingId && !password)) {
      return toast.error(editingId ? "Please provide name and email" : "Please fill all fields");
    }

    try {
      setIsSubmitting(true);
      if (editingId) {
        await api.put(`/auth/technicians/${editingId}`, { name, email, password });
        toast.success("Technician updated successfully");
      } else {
        await api.post('/auth/technicians', { name, email, password });
        toast.success("Technician created successfully");
      }
      setEditingId(null);
      setName("");
      setEmail("");
      setPassword("");
      fetchTechnicians();
    } catch (error: any) {
      toast.error(error.response?.data?.message || (editingId ? "Failed to update technician" : "Failed to create technician"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (technician: any) => {
    setEditingId(technician.id);
    setName(technician.name);
    setEmail(technician.email);
    setPassword("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setEmail("");
    setPassword("");
  };

  const handleRemoveTechnician = async (id: number, technicianName: string) => {
    if (!window.confirm(`Remove ${technicianName}? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/auth/technicians/${id}`);
      setTechnicians((current) => current.filter((technician) => technician.id !== id));
      if (editingId === id) cancelEdit();
      toast.success("Technician removed successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to remove technician");
    } finally {
      setDeletingId(null);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div>Access Denied</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Technicians</h1>
        <p className="text-gray-500 dark:text-gray-400">Add and view system technicians.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Plus className="w-5 h-5 mr-2 text-primary" />
            {editingId ? "Edit Technician" : "Add New Technician"}
          </h2>
          <form onSubmit={handleSaveTechnician} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Name</label>
              <input
                type="text"
                required
                className="w-full rounded-md bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-primary focus:ring-primary"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email</label>
              <input
                type="email"
                required
                className="w-full rounded-md bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-primary focus:ring-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Password</label>
              <input
                type="password"
                required={!editingId}
                minLength={6}
                className="w-full rounded-md bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-primary focus:ring-primary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 rounded-md text-white font-medium bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition"
            >
              {isSubmitting ? (editingId ? "Saving..." : "Creating...") : (editingId ? "Save Changes" : "Create Technician")}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="w-full py-2 px-4 rounded-md text-gray-600 hover:bg-gray-100 transition">
                <X className="w-4 h-4 inline mr-2" /> Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* Technicians List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary" />
                Technician Directory
              </h2>
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : technicians.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No technicians found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-700 dark:text-gray-300">
                    <tr>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {technicians.map((tech) => (
                      <tr key={tech.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          {tech.name}
                        </td>
                        <td className="px-6 py-4">
                          {tech.email}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3">
                            <button onClick={() => startEdit(tech)} className="text-primary hover:text-primary-dark" title="Edit technician">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveTechnician(tech.id, tech.name)}
                              disabled={deletingId === tech.id}
                              className="text-error hover:text-red-700 disabled:opacity-50"
                              title="Remove technician"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

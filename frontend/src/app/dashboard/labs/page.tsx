"use client";

import { FormEvent, useEffect, useState } from "react";
import { Building2, MapPin, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/Layout";
import api from "@/lib/api";

interface Laboratory {
  id: number;
  name: string;
  location: string | null;
}

export default function LabsPage() {
  const [labs, setLabs] = useState<Laboratory[]>([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchLabs = async () => {
    try {
      const response = await api.get("/equipment/labs");
      setLabs(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load laboratories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  const handleAddLab = async (event: FormEvent) => {
    event.preventDefault();
    setAdding(true);

    try {
      await api.post("/equipment/labs", { name, location });
      toast.success("Laboratory added successfully");
      setName("");
      setLocation("");
      await fetchLabs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add laboratory");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteLab = async (lab: Laboratory) => {
    if (!window.confirm(`Delete ${lab.name}?`)) return;

    setDeletingId(lab.id);
    try {
      await api.delete(`/equipment/labs/${lab.id}`);
      toast.success("Laboratory deleted successfully");
      setLabs((currentLabs) => currentLabs.filter((currentLab) => currentLab.id !== lab.id));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete laboratory");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Labs</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Add and remove laboratories used by your equipment directory.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        <section className="h-fit rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 flex items-center text-lg font-bold text-gray-900 dark:text-white">
            <Plus className="mr-2 h-5 w-5 text-primary" />
            Add Laboratory
          </h2>
          <form onSubmit={handleAddLab} className="space-y-4">
            <div>
              <label htmlFor="lab-name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input
                id="lab-name"
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Computer Lab 2"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="lab-location" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
              <input
                id="lab-location"
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="e.g. Building A, Room 102"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-white transition hover:bg-primary-dark disabled:opacity-50"
            >
              <Plus className="mr-2 h-4 w-4" />
              {adding ? "Adding..." : "Add Laboratory"}
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 flex items-center text-lg font-bold text-gray-900 dark:text-white">
            <Building2 className="mr-2 h-5 w-5 text-primary" />
            Laboratories
          </h2>
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading laboratories...</div>
          ) : labs.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No laboratories found.</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {labs.map((lab) => (
                <div key={lab.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{lab.name}</h3>
                    {lab.location && (
                      <p className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <MapPin className="mr-1 h-4 w-4" />
                        {lab.location}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteLab(lab)}
                    disabled={deletingId === lab.id}
                    className="flex shrink-0 items-center rounded-md px-3 py-2 text-sm text-error transition hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
                    title={`Delete ${lab.name}`}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    {deletingId === lab.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

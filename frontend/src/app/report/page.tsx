"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { AlertCircle, Camera } from "lucide-react";
import Link from "next/link";

function ReportFormContent() {
  const searchParams = useSearchParams();
  const qrParam = searchParams.get("qr");

  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [selectedEqId, setSelectedEqId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingEq, setFetchingEq] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    api.get('/equipment')
      .then(res => {
        setEquipmentList(res.data);
        if (qrParam) {
          const eq = res.data.find((e: any) => e.qr_code === qrParam);
          if (eq) {
            setSelectedEqId(eq.id.toString());
            toast.success("Equipment found!");
          } else {
            toast.error("Equipment not found from QR");
          }
        }
      })
      .catch(err => {
        console.error(err);
        toast.error("Failed to fetch equipment list");
      })
      .finally(() => setFetchingEq(false));
  }, [qrParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEqId) {
      toast.error("Please select an equipment");
      return;
    }
    
    setLoading(true);
    const formData = new FormData();
    formData.append("eq_id", selectedEqId);
    formData.append("description", description);
    if (image) {
      formData.append("image", image);
    }

    try {
      await api.post("/faults", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        }
      });
      toast.success("Fault reported successfully!");
      setDescription("");
      setImage(null);
      setSuggestions([]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to report fault");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingEq) return <div className="min-h-screen flex items-center justify-center">Loading equipment data...</div>;

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col items-center pt-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-2xl font-bold">Report Equipment Fault</h2>
        </div>

        <div className="bg-card p-6 rounded-xl border border-gray-200 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Select Equipment</label>
              <select
                required
                className="w-full rounded-md bg-white border-gray-300 focus:border-primary focus:ring-primary py-2 px-3 text-foreground"
                value={selectedEqId}
                onChange={(e) => setSelectedEqId(e.target.value)}
              >
                <option value="">-- Choose Equipment --</option>
                {equipmentList.map((eq: any) => (
                  <option key={eq.id} value={eq.id.toString()}>
                    {eq.name} ({eq.lab_name})
                  </option>
                ))}
              </select>
            </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Issue Description</label>
                <textarea
                  required
                  rows={4}
                  className="w-full rounded-md bg-white border-gray-300 focus:border-primary focus:ring-primary text-foreground"
                  placeholder="Describe the problem in detail..."
                  value={description}
                  onChange={async (e) => {
                    const text = e.target.value;
                    setDescription(text);
                    if (text.length > 5) {
                      try {
                        const res = await api.post('/ai/suggest', { description: text, eq_id: selectedEqId });
                        setSuggestions(res.data.suggestions);
                      } catch (error) {
                      }
                    } else {
                      setSuggestions([]);
                    }
                  }}
                />
              </div>

              {suggestions.length > 0 && (
                <div className="bg-card border border-[#e8d9d2] border-l-4 border-l-secondary rounded-lg p-4 shadow-sm">
                  <h4 className="text-sm font-bold text-black mb-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 text-secondary" />
                    AI-Lite Suggestion
                  </h4>
                  <ul className="text-sm text-[#332a27] space-y-1 list-disc list-inside">
                    {suggestions.map((sug, i) => (
                      <li key={i}>{sug}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-[#6b5f59] mt-2 italic">Try these common fixes before submitting the report if possible.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Photo (Optional)</label>
                <div className="flex items-center space-x-2">
                  <label className="flex-1 cursor-pointer flex items-center justify-center px-4 py-2 border border-gray-300 border-dashed rounded-md hover:bg-gray-100 transition">
                    <Camera className="w-5 h-5 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {image ? image.name : "Upload Image"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => setImage(e.target.files?.[0] || null)}
                    />
                  </label>
                  {image && (
                    <button type="button" onClick={() => setImage(null)} className="text-red-500 text-sm p-2 hover:bg-gray-700 rounded-md">
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-md text-white font-medium bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition mb-4"
              >
                {loading ? "Submitting..." : "Submit Fault Report"}
              </button>

              <Link
                href="/map"
                target="_blank"
                className="block text-center w-full py-3 px-4 rounded-md text-white font-medium bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
              >
                See Equipment Map
              </Link>
            </form>
          </div>
        </div>
    </div>
  );
}

export default function PublicReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-white">Loading report form...</div>}>
      <ReportFormContent />
    </Suspense>
  );
}

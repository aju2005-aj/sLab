"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Monitor, ArrowLeft } from "lucide-react";
import { getSocket } from "@/lib/socket";
import { useRouter } from "next/navigation";

export default function PublicEquipmentMapPage() {
  const router = useRouter();
  const [equipments, setEquipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchEquipment();
    
    const socket = getSocket();
    socket?.on('equipment_update', () => {
      fetchEquipment();
    });

    return () => {
      socket?.off('equipment_update');
    };
  }, []);

  // Group by lab
  const labs = equipments.reduce((acc, eq) => {
    const labName = eq.lab_name || "Unknown Lab";
    if (!acc[labName]) acc[labName] = [];
    acc[labName].push(eq);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={() => router.back()} 
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Public Equipment Map</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Visual layout of active and non-active systems across all laboratories.</p>
        </div>

        {loading ? (
          <div className="text-center p-12 text-gray-500 text-lg">Loading map...</div>
        ) : Object.keys(labs).length === 0 ? (
          <div className="text-center p-12 text-gray-500 text-lg">No equipment found.</div>
        ) : (
          <div className="space-y-8">
            {Object.entries(labs).map(([labName, items]) => (
              <div key={labName} className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">{labName}</h2>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6 justify-items-center">
                  {(items as any[]).map(eq => (
                    <div 
                      key={eq.id} 
                      className="flex flex-col items-center group relative cursor-pointer"
                      title={`${eq.name} (${eq.qr_code})`}
                    >
                      <div className={`p-4 rounded-xl transition-all duration-200 transform group-hover:scale-110 shadow-sm ${
                        eq.status === 'active' 
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800' 
                          : eq.status === 'faulty'
                          ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                          : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
                      }`}>
                        <Monitor className="w-8 h-8 md:w-10 md:h-10" />
                      </div>
                      <span className="mt-3 text-xs font-semibold text-gray-600 dark:text-gray-300 text-center truncate w-full max-w-[80px]">
                        {eq.name.split(' ')[0]}
                      </span>
                      
                      {/* Tooltip */}
                      <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bottom-full mb-3 bg-gray-900 text-white text-xs rounded-md py-2 px-3 pointer-events-none whitespace-nowrap z-10 shadow-xl border border-gray-700">
                        <div className="font-bold">{eq.name}</div>
                        <div className="text-gray-400 mt-1">{eq.qr_code}</div>
                        <div className={`uppercase font-bold mt-1 ${eq.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>{eq.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="flex justify-center flex-wrap gap-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300"><div className="w-4 h-4 rounded bg-green-100 border border-green-300 mr-2 shadow-sm"></div> Active</div>
              <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300"><div className="w-4 h-4 rounded bg-red-100 border border-red-300 mr-2 shadow-sm"></div> Faulty / Non-active</div>
              <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300"><div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300 mr-2 shadow-sm"></div> Maintenance</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

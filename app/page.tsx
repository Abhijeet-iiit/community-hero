'use client';

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../lib/supabaseClient';
import { Shield, AlertTriangle, MapPin, Upload, Sparkles } from 'lucide-react';

// Define a strict type structure for our community issues
interface Issue {
  id: string;
  category: string;
  severity: string;
  summary: string;
  recommended_action: string;
  latitude: number;
  longitude: number;
  status: string;
  created_at: string;
}

// Dynamically import map with SSR disabled to prevent window execution errors
const MapComponent = dynamic(() => import('../components/map'), { ssr: false });

export default function Home() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');

  const fetchIssues = async () => {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database fetch warning:', error.message);
      return;
    }

    if (data) {
      setIssues(data as Issue[]);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchIssues);
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation([lat, lng]);
  };

  // 2. Convert raw user image file into a Base64 string payload
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // 3. Form submission workflow handler
  const handleSubmitReport = async (e: FormEvent) => {
    e.preventDefault();
    if (!imageFile || !selectedLocation) {
      alert('Please choose a location on the map and upload an incident photo.');
      return;
    }

    setLoading(true);
    setUploadStatus('AI Agent is analyzing the image payload...');

    try {
      const base64Image = await convertToBase64(imageFile);
      
      // Dispatch payload to our Gemini API gateway route
      const res = await fetch('/api/analyze-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          mimeType: imageFile.type,
          latitude: selectedLocation[0],
          longitude: selectedLocation[1],
        }),
      });

      const result = await res.json();
      
      if (result.success) {
        setUploadStatus('Report authorized and saved successfully!');
        setImageFile(null);
        setSelectedLocation(null);
        //   New Fixed Line:
       await fetchIssues(); // Refresh live dashboard feed entries
      } else {
        throw new Error(result.error || 'Failed AI evaluation pipeline.');
      }
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      alert('Pipeline failure: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* LEFT COLUMN: Map interface workspace */}
      <div className="w-7/12 h-full relative border-r border-slate-800 bg-slate-900">
        <MapComponent 
          issues={issues} 
          onMapClick={handleMapClick} 
          selectedLocation={selectedLocation} 
        />
        <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded-lg shadow-2xl max-w-sm">
          <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
            <MapPin className="text-cyan-400 w-4 h-4" /> 
            Click anywhere on the map grid canvas above to automatically capture geographical incident markers.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Control center UI forms and real-time activity metrics panel */}
      <div className="w-5/12 h-full flex flex-col bg-slate-900">
        {/* Header Block banner */}
        <header className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-400 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Community Hero
            </h1>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Vibe2Ship Pro
          </span>
        </header>

        {/* Dynamic Activity Feed and Input workspace layout scrolling */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Live AI Impact Analytics Bar */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-md">
            <div className="text-center p-2 bg-slate-900/50 rounded-lg border border-slate-800/60">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Hazards</p>
              <p className="text-xl font-bold text-cyan-400 mt-1">{issues.length}</p>
            </div>
            <div className="text-center p-2 bg-slate-900/50 rounded-lg border border-slate-800/60">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Critical Risks</p>
              <p className="text-xl font-bold text-red-400 mt-1">
                {issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length}
              </p>
            </div>
            <div className="text-center p-2 bg-slate-900/50 rounded-lg border border-slate-800/60">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Resolved Cases</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">
                {issues.filter(i => i.status === 'Resolved').length}
              </p>
            </div>
          </div>
          {/* Submission reporting interface block card */}
          <form onSubmit={handleSubmitReport} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Dispatch New Report
            </h2>
            
            <div className="space-y-3">
              <label className="block text-xs text-slate-400">1. Coordinates Selection</label>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-sm font-mono text-slate-300 flex items-center justify-between">
                <span>Lat: {selectedLocation ? selectedLocation[0].toFixed(5) : '??'}</span>
                <span>Lng: {selectedLocation ? selectedLocation[1].toFixed(5) : '??'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="issue-image" className="block text-xs text-slate-400">2. Incident Visual Attachment</label>
              <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 transition rounded-lg p-4 flex flex-col items-center justify-center bg-slate-900/50 cursor-pointer relative">
                <input 
                  id="issue-image"
                  type="file" 
                  accept="image/*" 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setImageFile(e.target.files?.[0] || null)}
                  title="Select an image to attach to the incident report"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-slate-500 mb-2" />
                <p className="text-xs font-medium text-slate-300 text-center">
                  {imageFile ? imageFile.name : 'Click or Drag picture files here'}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 font-semibold text-sm transition shadow-lg disabled:opacity-50 text-slate-950 flex items-center justify-center gap-2"
            >
              {loading ? uploadStatus : 'Analyze & Deploy via Gemini'}
            </button>
          </form>

          {/* Incident stream layout listings */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Live Incident Registry</h3>
            {issues.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No community reports logged in this area yet.</p>
            ) : (
              issues.map((issue) => (
                <div key={issue.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 hover:border-slate-700 transition shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
                      {issue.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      issue.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      issue.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                      'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {issue.severity}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">{issue.summary}</p>
                  <div className="pt-2 border-t border-slate-900 text-xs text-slate-400">
                    <span className="font-semibold text-emerald-400">Recommended Action:</span> {issue.recommended_action}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
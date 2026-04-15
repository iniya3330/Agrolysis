import { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Map, 
  BarChart3, 
  Zap, 
  BrainCircuit, 
  Filter,
  TrendingUp,
  Droplets,
  Sprout,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, ScatterChart, Scatter, ZAxis, Legend
} from 'recharts';
import { cn } from './lib/utils';
import type { AgriRecord } from './data/mockAgriData';

import { GoogleGenAI } from "@google/genai";

import Markdown from 'react-markdown';

// --- Components ---

const StatCard = ({ title, value, unit, icon: Icon, trend, color }: any) => (
  <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
    <div className="flex justify-between items-start">
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <div className={cn("text-xs font-medium px-2 py-1 rounded-full", trend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
    <div>
      <p className="text-zinc-500 text-sm font-medium">{title}</p>
      <div className="flex items-baseline gap-1">
        <h3 className="text-2xl font-bold font-display">{value}</h3>
        <span className="text-zinc-400 text-sm font-normal">{unit}</span>
      </div>
    </div>
  </div>
);

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 font-medium text-sm whitespace-nowrap",
      active 
        ? "bg-agri-green text-white shadow-lg shadow-agri-green/20" 
        : "text-zinc-500 hover:bg-zinc-100"
    )}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

// --- Main App ---

export default function App() {
  const [data, setData] = useState<AgriRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetch('/api/agri-data')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(r => 
      (selectedState === 'All' || r.state === selectedState) &&
      (selectedCrop === 'All' || r.crop === selectedCrop)
    );
  }, [data, selectedState, selectedCrop]);

  const stats = useMemo(() => {
    if (filteredData.length === 0) return null;
    const avgYield = filteredData.reduce((acc, curr) => acc + curr.yield, 0) / filteredData.length;
    const totalProduction = filteredData.reduce((acc, curr) => acc + curr.production, 0);
    const avgIrrigation = filteredData.reduce((acc, curr) => acc + curr.irrigation, 0) / filteredData.length;
    const avgFertilizer = filteredData.reduce((acc, curr) => acc + curr.fertilizer, 0) / filteredData.length;
    
    return {
      yield: Math.round(avgYield),
      production: Math.round(totalProduction),
      irrigation: Math.round(avgIrrigation),
      fertilizer: Math.round(avgFertilizer)
    };
  }, [filteredData]);

  const yieldTrendData = useMemo(() => {
    const years = Array.from(new Set(filteredData.map(d => d.year))).sort();
    return years.map(year => {
      const yearData = filteredData.filter(d => d.year === year);
      const avg = yearData.reduce((acc, curr) => acc + curr.yield, 0) / yearData.length;
      const prod = yearData.reduce((acc, curr) => acc + curr.production, 0);
      return { year, yield: Math.round(avg), production: prod };
    });
  }, [filteredData]);

  const stateComparisonData = useMemo(() => {
    const states = Array.from(new Set(data.map(d => d.state)));
    return states.map(state => {
      const stateData = data.filter(d => d.state === state);
      const avg = stateData.reduce((acc, curr) => acc + curr.yield, 0) / stateData.length;
      return { state, yield: Math.round(avg) };
    }).sort((a, b) => b.yield - a.yield);
  }, [data]);

  const runAnalysis = async () => {
    if (!process.env.GEMINI_API_KEY) {
      alert("Gemini API key is not configured. Please add it to your secrets.");
      return;
    }

    setAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
        You are an expert agricultural analyst. Analyze the following crop yield, production, and resource data for Indian agriculture (inspired by Kaggle datasets):
        ${JSON.stringify(filteredData.slice(0, 50))}
        
        User Context: Analyzing ${selectedCrop} in ${selectedState}.
        
        Provide actionable insights for farmers and policymakers. Focus on:
        1. Yield and Production trends (Efficiency vs Volume).
        2. Regional disparities across all 36 States/UTs.
        3. Correlation between irrigation, fertilizer, and productivity levels.
        4. Specific recommendations for improving resource utilization efficiency.
        
        Format your response in Markdown with clear headings and bullet points.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      setAnalysis(response.text || "No analysis generated.");
    } catch (err) {
      console.error("Gemini Error:", err);
      setAnalysis("Failed to generate AI insights. Please check your API key and connection.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-agri-green border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 font-medium animate-pulse">Harvesting Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-12">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-agri-green rounded-lg flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold font-display tracking-tight text-agri-green">AgRolysis</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl">
              <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={LayoutDashboard} label="Overview" />
              <TabButton active={activeTab === 'regional'} onClick={() => setActiveTab('regional')} icon={Map} label="Regional" />
              <TabButton active={activeTab === 'correlation'} onClick={() => setActiveTab('correlation')} icon={BarChart3} label="Correlation" />
              <TabButton active={activeTab === 'efficiency'} onClick={() => setActiveTab('efficiency')} icon={Zap} label="Efficiency" />
            </div>
            <button 
              onClick={runAnalysis}
              disabled={analyzing}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              <BrainCircuit className={cn("w-4 h-4", analyzing && "animate-pulse")} />
              <span className="text-sm font-medium">{analyzing ? 'Analyzing...' : 'AI Insights'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-zinc-200 shadow-sm">
            <Filter className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-500">Filters:</span>
            <select 
              value={selectedState} 
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">All States</option>
              {Array.from(new Set(data.map(d => d.state))).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="w-px h-4 bg-zinc-200 mx-2" />
            <select 
              value={selectedCrop} 
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">All Crops</option>
              {Array.from(new Set(data.map(d => d.crop))).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Avg. Crop Yield" value={stats?.yield} unit="kg/ha" icon={TrendingUp} trend={4.2} color="bg-agri-green" />
          <StatCard title="Total Production" value={stats?.production?.toLocaleString()} unit="tonnes" icon={BarChart3} trend={5.8} color="bg-blue-500" />
          <StatCard title="Irrigation Coverage" value={stats?.irrigation} unit="%" icon={Zap} trend={1.5} color="bg-amber-500" />
          <StatCard title="Fertilizer Usage" value={stats?.fertilizer} unit="kg/ha" icon={Filter} trend={0.8} color="bg-purple-500" />
        </div>

        {/* Dynamic Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-panel p-8 rounded-3xl">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-xl font-bold font-display">Yield Trends</h2>
                      <p className="text-zinc-500 text-sm">Historical performance over the last 5 years</p>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={yieldTrendData}>
                        <defs>
                          <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2D5A27" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#2D5A27" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ color: '#2D5A27', fontWeight: 600 }}
                        />
                        <Area type="monotone" dataKey="yield" stroke="#2D5A27" strokeWidth={3} fillOpacity={1} fill="url(#colorYield)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-panel p-8 rounded-3xl">
                  <h2 className="text-xl font-bold font-display mb-6">Top Performing States</h2>
                  <div className="space-y-6">
                    {stateComparisonData.slice(0, 8).map((item, idx) => (
                      <div key={item.state} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-500">
                          {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-semibold">{item.state}</span>
                            <span className="text-sm font-medium text-zinc-400">{item.yield} kg/ha</span>
                          </div>
                          <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.yield / stateComparisonData[0].yield) * 100}%` }}
                              className="h-full bg-agri-green"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'regional' && (
              <div className="space-y-8">
                <div className="glass-panel p-8 rounded-3xl">
                  <h2 className="text-xl font-bold font-display mb-8">State-wise Yield Distribution</h2>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stateComparisonData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="state" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} width={150} />
                        <Tooltip 
                          cursor={{fill: 'transparent'}}
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="yield" radius={[0, 4, 4, 0]} barSize={16}>
                          {stateComparisonData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index < 5 ? '#2D5A27' : '#94a3b8'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-panel rounded-3xl overflow-hidden">
                  <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold font-display">Regional Performance Data</h2>
                    <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{filteredData.length} Records Found</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-100">
                          <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">State</th>
                          <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Crop</th>
                          <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Year</th>
                          <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Production (t)</th>
                          <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Yield (kg/ha)</th>
                          <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Productivity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {filteredData.slice(0, 15).map((row) => (
                          <tr key={row.id} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-semibold text-zinc-700">{row.state}</td>
                            <td className="px-6 py-4 text-sm text-zinc-600">{row.crop}</td>
                            <td className="px-6 py-4 text-sm text-zinc-500 font-mono">{row.year}</td>
                            <td className="px-6 py-4 text-sm font-medium text-zinc-600">{row.production.toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm font-bold text-agri-green">{row.yield}</td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                row.productivity === 'High' ? "bg-green-100 text-green-700" :
                                row.productivity === 'Medium' ? "bg-amber-100 text-amber-700" :
                                "bg-red-100 text-red-700"
                              )}>
                                {row.productivity}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredData.length > 10 && (
                    <div className="p-4 bg-zinc-50 text-center border-t border-zinc-100">
                      <p className="text-xs text-zinc-400">Showing first 10 records. Use filters to narrow down results.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'correlation' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="glass-panel p-8 rounded-3xl">
                    <h2 className="text-xl font-bold font-display mb-6">Yield vs Rainfall</h2>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis type="number" dataKey="rainfall" name="Rainfall" unit="mm" axisLine={false} tickLine={false} />
                          <YAxis type="number" dataKey="yield" name="Yield" unit="kg" axisLine={false} tickLine={false} />
                          <ZAxis type="number" range={[60, 400]} />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                          <Scatter name="Crops" data={filteredData.slice(0, 100)} fill="#2D5A27" fillOpacity={0.6} />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="glass-panel p-8 rounded-3xl">
                    <h2 className="text-xl font-bold font-display mb-6">Yield vs Fertilizer</h2>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis type="number" dataKey="fertilizer" name="Fertilizer" unit="kg" axisLine={false} tickLine={false} />
                          <YAxis type="number" dataKey="yield" name="Yield" unit="kg" axisLine={false} tickLine={false} />
                          <ZAxis type="number" range={[60, 400]} />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                          <Scatter name="Crops" data={filteredData.slice(0, 100)} fill="#8B4513" fillOpacity={0.6} />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                <div className="glass-panel p-8 rounded-3xl bg-amber-50/50 border-amber-100">
                  <h3 className="text-lg font-bold font-display text-amber-900 mb-4">Correlation Insights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-white rounded-2xl border border-amber-100 shadow-sm">
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Rainfall Impact</p>
                      <p className="text-sm text-zinc-600 leading-relaxed">Moderate positive correlation observed. Yield increases with rainfall up to 1200mm, after which diminishing returns or waterlogging issues may occur.</p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-amber-100 shadow-sm">
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Fertilizer Efficiency</p>
                      <p className="text-sm text-zinc-600 leading-relaxed">Strong positive correlation in high-yield states like Punjab. However, some regions show plateauing yield despite high fertilizer usage, indicating soil saturation.</p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-amber-100 shadow-sm">
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Irrigation Synergy</p>
                      <p className="text-sm text-zinc-600 leading-relaxed">Regions with &gt;80% irrigation coverage show 40% higher resilience to rainfall fluctuations compared to rain-fed regions.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'efficiency' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 glass-panel p-8 rounded-3xl">
                  <h2 className="text-xl font-bold font-display mb-6">Productivity Mix</h2>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'High', value: filteredData.filter(d => d.productivity === 'High').length },
                            { name: 'Medium', value: filteredData.filter(d => d.productivity === 'Medium').length },
                            { name: 'Low', value: filteredData.filter(d => d.productivity === 'Low').length },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#2D5A27" />
                          <Cell fill="#FFD700" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="lg:col-span-2 glass-panel p-8 rounded-3xl">
                  <h2 className="text-xl font-bold font-display mb-6">Resource Utilization Efficiency</h2>
                  <p className="text-zinc-500 text-sm mb-8">Comparison of irrigation coverage vs yield across selected parameters</p>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={yieldTrendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="year" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="yield" fill="#2D5A27" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* AI Analysis Modal/Section */}
        {analysis && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-12 glass-panel p-8 rounded-3xl border-agri-green/20 bg-agri-green/5"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-agri-green rounded-lg">
                <BrainCircuit className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold font-display text-agri-green">Agronomist AI Analysis</h2>
              <button 
                onClick={() => setAnalysis(null)}
                className="ml-auto text-zinc-400 hover:text-zinc-600"
              >
                Dismiss
              </button>
            </div>
            <div className="prose prose-zinc max-w-none prose-headings:font-display prose-headings:text-agri-green prose-p:text-zinc-700 prose-p:leading-relaxed">
              <Markdown>{analysis}</Markdown>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 mt-24 pt-8 border-t border-zinc-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-zinc-400 text-sm">© 2024 AgRolysis. Data-driven farming for a sustainable future.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-zinc-400 hover:text-agri-green text-sm font-medium transition-colors">Documentation</a>
            <a href="#" className="text-zinc-400 hover:text-agri-green text-sm font-medium transition-colors">API Reference</a>
            <a href="#" className="text-zinc-400 hover:text-agri-green text-sm font-medium transition-colors">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

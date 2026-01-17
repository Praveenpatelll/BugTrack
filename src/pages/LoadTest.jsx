import React, { useState } from 'react';
import { Play, Zap, Activity, Server } from 'lucide-react';
import axios from 'axios';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

export default function LoadTest() {
    const [url, setUrl] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [status, setStatus] = useState('');
    const [reports, setReports] = useState([]);
    const [chartData, setChartData] = useState([]);

    // Pro features
    const [useProMode, setUseProMode] = useState(false);
    const [threads, setThreads] = useState(5);
    const [duration, setDuration] = useState(10);

    const startTest = async () => {
        if (!url) return;
        setIsRunning(true);
        setStatus('Initializing test...');
        setReports([]);
        setChartData([]);

        // Open SSE connection to the Inventory System Backend
        // NOTE: This assumes the backend is running on port 3000
        const eventSource = new EventSource(`http://localhost:3000/loadtest/events`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'status') {
                setStatus(data.message);
            } else if (data.type === 'report') {
                setReports(data.data);
                // Append to chart data for "Main Page" or aggregate
                const mainStat = data.data.find((r) => r.label === 'Main Page');
                if (mainStat) {
                    setChartData(prev => [...prev, {
                        time: new Date().toLocaleTimeString(),
                        latency: mainStat.average,
                        throughput: mainStat.throughput
                    }].slice(-20)); // Keep last 20 points
                }
            } else if (data.type === 'error') {
                setStatus(`Error: ${data.message}`);
                setIsRunning(false);
                eventSource.close();
            }
        };

        // Trigger start
        try {
            await axios.post('http://localhost:3000/loadtest/start', {
                url,
                threads: useProMode ? threads : 5,
                duration: useProMode ? duration : 10
            });
        } catch (e) {
            console.error(e);
            setStatus('Failed to start test. Ensure the backend servce is running on port 3000.');
            setIsRunning(false);
            eventSource.close();
        }

        // Auto-close SSE when test should be theoretically done 
        // (handled by backend 'Test Completed' event implicitly or manual stop)
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100" style={{
                background: 'var(--card-bg, #1e293b)',
                color: 'var(--text-primary, white)',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--border-color, #334155)'
            }}>
                <div className="flex items-center space-x-3 mb-6" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
                    <Zap className="h-8 w-8 text-yellow-500" size={32} color="#f59e0b" />
                    <h1 className="text-2xl font-bold" style={{ fontSize: '24px', fontWeight: 'bold' }}>Smart Load Tester</h1>
                </div>

                <div className="flex flex-col md:flex-row gap-4" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Paste Target URL (e.g., https://example.com)"
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            fontSize: '16px',
                            borderRadius: '8px',
                            border: '1px solid #475569',
                            background: '#0f172a',
                            color: 'white',
                            outline: 'none'
                        }}
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={isRunning}
                    />
                    <button
                        onClick={startTest}
                        disabled={!url || isRunning}
                        style={{
                            padding: '12px 32px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: 'none',
                            cursor: (!url || isRunning) ? 'not-allowed' : 'pointer',
                            background: isRunning ? '#94a3b8' : 'linear-gradient(to right, #2563eb, #4f46e5)',
                            transition: 'transform 0.2s',
                            opacity: (!url || isRunning) ? 0.7 : 1
                        }}
                    >
                        {isRunning ? <Activity className="animate-spin" /> : <Play />}
                        {isRunning ? 'Testing...' : 'Start Test'}
                    </button>
                </div>

                {/* Pro Mode Toggle */}
                <div style={{ marginTop: '16px' }}>
                    <button
                        onClick={() => setUseProMode(!useProMode)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}
                    >
                        {useProMode ? 'Switch to Simple Mode' : 'Show Advanced Settings'}
                    </button>

                    {useProMode && (
                        <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px' }}>Virtual Users (Threads)</label>
                                <input
                                    type="number"
                                    value={threads}
                                    onChange={e => setThreads(Number(e.target.value))}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #475569', background: '#0f172a', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px' }}>Duration (Seconds)</label>
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={e => setDuration(Number(e.target.value))}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #475569', background: '#0f172a', color: 'white' }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {status && (
                    <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Server size={20} />
                        {status}
                    </div>
                )}
            </div>

            {/* Results Section */}
            {reports.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '24px' }}>
                    {/* Chart */}
                    <div style={{
                        gridColumn: '1 / -1',
                        background: 'var(--card-bg, #1e293b)',
                        padding: '24px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color, #334155)',
                        minHeight: '400px'
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-secondary, #94a3b8)' }}>Response Time Over Time (ms)</h3>
                        <div style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="time" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: 'white' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="latency" stroke="#8884d8" strokeWidth={2} dot={false} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {reports.map((report) => (
                        <div key={report.label} style={{
                            background: 'var(--card-bg, #1e293b)',
                            padding: '24px',
                            borderRadius: '12px',
                            borderLeft: '4px solid #6366f1',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>{report.label}</h3>
                                <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    backgroundColor: report.errorRate > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                                    color: report.errorRate > 0 ? '#fca5a5' : '#86efac'
                                }}>
                                    {report.errorRate.toFixed(1)}% Error
                                </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px', color: '#cbd5e1' }}>
                                <div>
                                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>Samples</p>
                                    <p style={{ fontFamily: 'monospace', fontSize: '18px' }}>{report.samples}</p>
                                </div>
                                <div>
                                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>Average</p>
                                    <p style={{ fontFamily: 'monospace', fontSize: '18px' }}>{report.average} ms</p>
                                </div>
                                <div>
                                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>Min / Max</p>
                                    <p style={{ fontFamily: 'monospace' }}>{report.min} / {report.max} ms</p>
                                </div>
                                <div>
                                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>Throughput</p>
                                    <p style={{ fontFamily: 'monospace', fontSize: '18px' }}>{report.throughput.toFixed(1)} /sec</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

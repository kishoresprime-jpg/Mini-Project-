import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import {
  Database,
  Table,
  Code,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Server,
  Layers,
} from 'lucide-react';

export const DatabaseViewer = () => {
  const [overview, setOverview] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState('users');
  const [collectionData, setCollectionData] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [viewMode, setViewMode] = useState('json'); // 'json' or 'table'
  const [copied, setCopied] = useState(false);

  const fetchOverview = async () => {
    try {
      setLoadingOverview(true);
      const res = await api.get('/database/overview');
      setOverview(res.data);
      if (res.data.collections?.length > 0 && !selectedCollection) {
        setSelectedCollection(res.data.collections[0].name);
      }
    } catch (err) {
      console.error('Failed to load database overview:', err);
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchCollectionData = async (colName) => {
    try {
      setLoadingData(true);
      const res = await api.get(`/database/collections/${colName}?limit=100`);
      setCollectionData(res.data.data || []);
    } catch (err) {
      console.error(`Failed to load collection ${colName}:`, err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (selectedCollection) {
      fetchCollectionData(selectedCollection);
    }
  }, [selectedCollection]);

  const handleCopyUri = () => {
    const uri = overview?.connectionString || 'mongodb://127.0.0.1:27017/college_workflow';
    navigator.clipboard.writeText(uri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loadingOverview) {
    return <Loader message="Connecting to MongoDB instance..." />;
  }

  const connectionUri = overview?.connectionString || 'mongodb://127.0.0.1:27017/college_workflow';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <Database className="w-5 h-5 mr-2 text-primary-600" />
            Live MongoDB Database Explorer
          </h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
            Real-time inspection of documents, schema collections, and persistent database storage
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              fetchOverview();
              fetchCollectionData(selectedCollection);
            }}
            icon={RefreshCw}
          >
            Refresh Data
          </Button>
          <a
            href={`/api/database/collections/${selectedCollection}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-primary-700 transition"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            Open Raw JSON API
          </a>
        </div>
      </div>

      {/* Database Connection Banner */}
      <div className="rounded-xl border border-primary-200 bg-primary-50/60 p-4 dark:border-primary-900/60 dark:bg-primary-950/40">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white shrink-0 shadow">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Database: <code className="text-primary-600 font-mono">{overview?.databaseName || 'college_workflow'}</code>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                  CONNECTED
                </span>
              </div>
              <div className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-0.5">
                {connectionUri}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleCopyUri} icon={copied ? Check : Copy}>
              {copied ? 'Copied URI' : 'Copy MongoDB URI'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid: Collections Sidebar on Left, Data on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Collections list */}
        <Card className="lg:col-span-1 !p-3">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center">
              <Layers className="w-3.5 h-3.5 mr-1.5" />
              Collections ({overview?.collections?.length || 0})
            </span>
          </div>

          <div className="space-y-1">
            {overview?.collections?.map((col) => {
              const isSelected = selectedCollection === col.name;
              return (
                <button
                  key={col.name}
                  onClick={() => setSelectedCollection(col.name)}
                  className={`flex w-full items-center justify-between p-2.5 rounded-lg text-xs transition ${
                    isSelected
                      ? 'bg-primary-600 text-white font-bold shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="font-mono">{col.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      isSelected
                        ? 'bg-primary-700 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {col.count} docs
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Collection Document Viewer on Right */}
        <div className="lg:col-span-3 space-y-4">
          <Card
            title={`Collection: ${selectedCollection}`}
            subtitle={`${collectionData.length} records retrieved from MongoDB`}
            action={
              <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-lg dark:bg-slate-800">
                <button
                  onClick={() => setViewMode('json')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center ${
                    viewMode === 'json'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-navy-900 dark:text-white'
                      : 'text-slate-500'
                  }`}
                >
                  <Code className="w-3.5 h-3.5 mr-1" />
                  JSON View
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center ${
                    viewMode === 'table'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-navy-900 dark:text-white'
                      : 'text-slate-500'
                  }`}
                >
                  <Table className="w-3.5 h-3.5 mr-1" />
                  Table View
                </button>
              </div>
            }
          >
            {loadingData ? (
              <Loader message={`Querying ${selectedCollection} collection...`} />
            ) : collectionData.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">This collection contains 0 documents.</p>
            ) : viewMode === 'json' ? (
              /* Raw JSON View */
              <div className="max-h-[600px] overflow-y-auto rounded-lg bg-slate-950 p-4 font-mono text-xs text-emerald-400 border border-slate-800 shadow-inner">
                <pre className="whitespace-pre-wrap break-all leading-relaxed">
                  {JSON.stringify(collectionData, null, 2)}
                </pre>
              </div>
            ) : (
              /* Tabular View */
              <div className="max-h-[600px] overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider dark:bg-slate-800 dark:border-slate-800 dark:text-slate-400 sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5">_id</th>
                      {Object.keys(collectionData[0] || {})
                        .filter((k) => k !== '_id' && k !== '__v')
                        .slice(0, 5)
                        .map((k) => (
                          <th key={k} className="px-4 py-2.5">
                            {k}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {collectionData.map((doc, idx) => (
                      <tr key={doc._id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-2 font-mono text-[11px] text-primary-600 font-medium">
                          {doc._id}
                        </td>
                        {Object.keys(collectionData[0] || {})
                          .filter((k) => k !== '_id' && k !== '__v')
                          .slice(0, 5)
                          .map((k) => {
                            const val = doc[k];
                            const displayVal =
                              typeof val === 'object'
                                ? JSON.stringify(val)
                                : String(val ?? '');
                            return (
                              <td
                                key={k}
                                className="px-4 py-2 text-slate-700 dark:text-slate-300 max-w-xs truncate"
                                title={displayVal}
                              >
                                {displayVal}
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};


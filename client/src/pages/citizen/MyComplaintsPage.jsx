import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { complaintApi } from '../../api/complaintApi';
import PriorityBadge from '../../components/complaint/PriorityBadge';
import StatusBadge from '../../components/complaint/StatusBadge';
import { FileText, PlusCircle, Search, Filter, Loader2, ArrowRight } from 'lucide-react';

const MyComplaintsPage = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = { citizen: user?.id };
      if (activeFilter !== 'ALL') {
        params.status = activeFilter;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      const res = await complaintApi.getComplaints(params);
      if (res.success) {
        setComplaints(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchComplaints();
    }
  }, [user, activeFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchComplaints();
  };

  const filterTabs = [
    { key: 'ALL', label: 'All Issues' },
    { key: 'SUBMITTED', label: 'Submitted' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'RESOLVED', label: 'Resolved' },
    { key: 'REJECTED', label: 'Rejected' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Reported Issues
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track real-time departmental progress, resolution evidence, and earned civic points.
          </p>
        </div>

        <Link
          to="/report"
          className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Report Another Issue
        </Link>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeFilter === tab.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <form onSubmit={handleSearch} className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search ID, landmark, defect..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </form>
      </div>

      {/* Complaints List / Table */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No complaints found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You don't have any reported complaints under this filter category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {complaints.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Photo Header */}
                <div className="aspect-video w-full bg-slate-950 relative overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.categoryName}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <PriorityBadge priority={item.priority} size="xs" />
                  </div>
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={item.status} size="xs" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                    <span>{item.complaintId}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 line-clamp-1">
                      {item.categoryName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 flex items-center gap-1.5 pt-1">
                    <span className="text-emerald-600 font-bold">📍</span>
                    <span className="line-clamp-1">{item.address}</span>
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-600">
                  +{item.pointsAwarded || 20} pts earned
                </span>
                <Link
                  to={`/complaints/${item.complaintId || item._id}`}
                  className="font-bold text-slate-800 hover:text-emerald-600 flex items-center gap-1"
                >
                  View Details <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyComplaintsPage;

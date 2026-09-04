import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ArrowLeft, Search, MapPin, Building2, Flame, Loader2, X } from 'lucide-react';
import { geographyApi } from '../../api/geographyApi';

const GeographyBreadcrumb = ({
  lineage = [],
  currentRegion = null,
  onSelectRegion,
  onNavigateBack,
  isLoading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleSearch = async () => {
      if (!searchQuery.trim() || searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const res = await geographyApi.searchRegions(searchQuery);
        if (res.success) {
          setSearchResults(res.data || []);
        }
      } catch (err) {
        console.error('Error searching regions:', err);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(handleSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Click outside listener for search popup
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSearchResult = (region) => {
    onSelectRegion(region._id);
    setSearchQuery('');
    setSearchOpen(false);
  };

  const hasParent = lineage.length > 1;

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      {/* Breadcrumb Trail */}
      <div className="flex items-center flex-wrap gap-1.5 text-xs sm:text-sm">
        {hasParent && (
          <button
            onClick={onNavigateBack}
            disabled={isLoading}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition mr-2 border border-slate-200 text-xs shadow-xs"
            title="Go to parent level"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        )}

        {lineage.map((item, idx) => {
          const isLast = idx === lineage.length - 1;

          return (
            <React.Fragment key={item._id || idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}

              {isLast ? (
                <span className="font-bold text-slate-900 bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  {item.displayName || item.name}
                </span>
              ) : (
                <button
                  onClick={() => onSelectRegion(item._id)}
                  disabled={isLoading}
                  className="text-slate-600 hover:text-emerald-600 font-medium transition hover:underline"
                >
                  {item.name}
                </button>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Quick Search */}
      <div className="relative w-full sm:w-72" ref={searchRef}>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search constituency, mandal..."
            className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Results */}
        {searchOpen && searchQuery.trim().length >= 2 && (
          <div className="absolute right-0 top-full mt-1.5 w-full sm:w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
            {searching ? (
              <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Searching regions...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map((r) => (
                  <button
                    key={r._id}
                    onClick={() => handleSelectSearchResult(r)}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 transition flex items-start gap-2.5 group"
                  >
                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-xs text-slate-900 line-clamp-1">{r.name}</h5>
                      <p className="text-[10px] text-slate-500 line-clamp-1">
                        {r.type?.replace('_', ' ')} • {r.parliament || r.district || r.state}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching geographic areas found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GeographyBreadcrumb;

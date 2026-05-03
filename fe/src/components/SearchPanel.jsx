import React, { useState, useCallback, useEffect } from 'react';
import { Search, X, Filter, ChevronDown } from 'lucide-react';
import { PROGRAMS } from '../utils/constants';

export default function SearchPanel({
  onSearch,
  searchTerm,
  setSearchTerm,
  program,
  setProgram,
  isDisabled,
  availablePrograms,
}) {
  const [showPrograms, setShowPrograms] = useState(false);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSearch(searchTerm, program);
  }, [onSearch, searchTerm, program]);

  const handleClear = useCallback(() => {
    setSearchTerm('');
    onSearch('', program);
  }, [setSearchTerm, onSearch, program]);

  const handleProgramSelect = useCallback((p) => {
    setProgram(p);
    setShowPrograms(false);
    onSearch(searchTerm, p);
  }, [setProgram, onSearch, searchTerm]);

  // Keyboard shortcut: Enter triggers search
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      onSearch(searchTerm, program);
    }
  }, [onSearch, searchTerm, program]);

  const programs = availablePrograms?.length
    ? ['Tất cả', ...availablePrograms]
    : PROGRAMS;

  return (
    <div className="search-panel">
      <div className="section-label">
        <Search size={18} />
        <span>Tên hoặc Mã HP muốn đăng ký</span>
      </div>

      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            id="search-input"
            type="text"
            className="search-input"
            placeholder="Nhập tên hoặc mã học phần..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
          />
          {searchTerm && (
            <button type="button" className="clear-btn" onClick={handleClear}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className="program-select-wrapper">
          <div className="section-label">
            <Filter size={16} />
            <span>Chương trình học</span>
          </div>
          <div className="custom-select" id="program-select">
            <button
              type="button"
              className="select-trigger"
              onClick={() => setShowPrograms(!showPrograms)}
              disabled={isDisabled}
            >
              <span>{program || 'Tất cả'}</span>
              <ChevronDown
                size={16}
                style={{ transform: showPrograms ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              />
            </button>
            {showPrograms && (
              <div className="select-dropdown">
                {programs.map((p) => (
                  <button
                    key={p}
                    id={`program-option-${p.replace(/\s+/g, '-')}`}
                    type="button"
                    className={`select-option ${program === p ? 'selected' : ''}`}
                    onClick={() => handleProgramSelect(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          id="btn-search"
          type="submit"
          className="btn-search"
          disabled={isDisabled}
        >
          <Search size={18} />
          Tìm lớp
        </button>
      </form>
    </div>
  );
}

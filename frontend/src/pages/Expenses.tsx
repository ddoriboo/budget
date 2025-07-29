import { useState, useEffect } from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  BookmarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { expenseStore, ExpenseItem } from '@/store/expenseStore';
import toast from 'react-hot-toast';

interface SearchFilters {
  keyword: string;
  category: string;
  subcategory: string;
  type: 'all' | 'expense' | 'income';
  dateFrom: string;
  dateTo: string;
  amountFrom: string;
  amountTo: string;
  place: string;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: Date;
}

export const Expenses = () => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  
  // 고급 검색 상태
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    keyword: '',
    category: '',
    subcategory: '',
    type: 'all',
    dateFrom: '',
    dateTo: '',
    amountFrom: '',
    amountTo: '',
    place: ''
  });
  
  // 검색 기록 및 즐겨찾기
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightTerm, setHighlightTerm] = useState('');

  // 데이터 로드
  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = () => {
    const data = expenseStore.getExpenses();
    setExpenses(data);
    setFilteredExpenses(data);
  };

  // 검색 기록 로드
  useEffect(() => {
    const savedHistory = localStorage.getItem('expenseSearchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
    
    const savedSearchesData = localStorage.getItem('expenseSavedSearches');
    if (savedSearchesData) {
      setSavedSearches(JSON.parse(savedSearchesData));
    }
  }, []);

  // 검색 및 필터링 (고급 검색 포함)
  useEffect(() => {
    let filtered = expenses;
    
    // 고급 검색이 활성화된 경우
    if (showAdvancedSearch) {
      // 키워드 검색
      if (searchFilters.keyword) {
        const keyword = searchFilters.keyword.toLowerCase();
        filtered = filtered.filter(expense => 
          expense.place.toLowerCase().includes(keyword) ||
          expense.memo?.toLowerCase().includes(keyword) ||
          expense.category.toLowerCase().includes(keyword) ||
          expense.subcategory.toLowerCase().includes(keyword)
        );
      }
      
      // 카테고리 필터
      if (searchFilters.category) {
        filtered = filtered.filter(expense => expense.category === searchFilters.category);
      }
      
      // 서브카테고리 필터
      if (searchFilters.subcategory) {
        filtered = filtered.filter(expense => expense.subcategory === searchFilters.subcategory);
      }
      
      // 거래 유형 필터
      if (searchFilters.type !== 'all') {
        filtered = filtered.filter(expense => expense.type === searchFilters.type);
      }
      
      // 날짜 범위 필터
      if (searchFilters.dateFrom) {
        filtered = filtered.filter(expense => expense.date >= searchFilters.dateFrom);
      }
      if (searchFilters.dateTo) {
        filtered = filtered.filter(expense => expense.date <= searchFilters.dateTo);
      }
      
      // 금액 범위 필터
      if (searchFilters.amountFrom) {
        const minAmount = parseInt(searchFilters.amountFrom);
        filtered = filtered.filter(expense => expense.amount >= minAmount);
      }
      if (searchFilters.amountTo) {
        const maxAmount = parseInt(searchFilters.amountTo);
        filtered = filtered.filter(expense => expense.amount <= maxAmount);
      }
      
      // 장소 필터
      if (searchFilters.place) {
        const place = searchFilters.place.toLowerCase();
        filtered = filtered.filter(expense => expense.place.toLowerCase().includes(place));
      }
      
      // 하이라이트 용어 설정
      setHighlightTerm(searchFilters.keyword);
    } else {
      // 기본 검색
      if (searchTerm) {
        filtered = filtered.filter(expense => 
          expense.place.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.memo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.subcategory.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setHighlightTerm(searchTerm);
      } else {
        setHighlightTerm('');
      }
      
      // 카테고리 필터링
      if (selectedCategory) {
        filtered = filtered.filter(expense => expense.category === selectedCategory);
      }
    }

    // 정렬
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        default:
          aValue = new Date(a.date);
          bValue = new Date(b.date);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredExpenses(filtered);
  }, [expenses, searchTerm, selectedCategory, sortBy, sortOrder, searchFilters, showAdvancedSearch]);

  // 고유 카테고리 및 서브카테고리 목록
  const categories = Array.from(new Set(expenses.map(e => e.category)));
  const subcategories = Array.from(new Set(
    expenses
      .filter(e => !searchFilters.category || e.category === searchFilters.category)
      .map(e => e.subcategory)
  ));
  
  // 자동완성을 위한 제안 목록
  const suggestions = Array.from(new Set([
    ...expenses.map(e => e.place),
    ...expenses.map(e => e.category),
    ...expenses.map(e => e.subcategory),
    ...expenses.filter(e => e.memo).map(e => e.memo!),
    ...searchHistory
  ])).filter(item => 
    item && item.toLowerCase().includes((searchTerm || searchFilters.keyword).toLowerCase())
  ).slice(0, 10);

  // 지출 삭제
  const handleDelete = (id: string) => {
    if (window.confirm('정말로 이 지출 내역을 삭제하시겠습니까?')) {
      const success = expenseStore.deleteExpense(id);
      if (success) {
        loadExpenses();
        toast.success('지출 내역이 삭제되었습니다.');
      } else {
        toast.error('삭제에 실패했습니다.');
      }
    }
  };

  // 지출 수정 저장
  const handleEditSave = (expense: ExpenseItem) => {
    const updated = expenseStore.updateExpense(expense.id, expense);
    if (updated) {
      loadExpenses();
      setEditingExpense(null);
      toast.success('지출 내역이 수정되었습니다.');
    } else {
      toast.error('수정에 실패했습니다.');
    }
  };
  
  // 검색 기능 관련 핸들러
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setShowSuggestions(false);
    
    if (term && !searchHistory.includes(term)) {
      const newHistory = [term, ...searchHistory.slice(0, 9)];
      setSearchHistory(newHistory);
      localStorage.setItem('expenseSearchHistory', JSON.stringify(newHistory));
    }
  };
  
  const handleAdvancedSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
  };
  
  const clearFilters = () => {
    setSearchFilters({
      keyword: '',
      category: '',
      subcategory: '',
      type: 'all',
      dateFrom: '',
      dateTo: '',
      amountFrom: '',
      amountTo: '',
      place: ''
    });
    setSearchTerm('');
    setSelectedCategory('');
    setHighlightTerm('');
  };
  
  const saveSearch = (name: string) => {
    const newSavedSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      filters: { ...searchFilters },
      createdAt: new Date()
    };
    
    const newSavedSearches = [newSavedSearch, ...savedSearches.slice(0, 9)];
    setSavedSearches(newSavedSearches);
    localStorage.setItem('expenseSavedSearches', JSON.stringify(newSavedSearches));
    toast.success(`검색 조건이 "${name}"으로 저장되었습니다.`);
  };
  
  const loadSavedSearch = (savedSearch: SavedSearch) => {
    setSearchFilters(savedSearch.filters);
    setShowAdvancedSearch(true);
    toast.success(`"${savedSearch.name}" 검색 조건을 불러왔습니다.`);
  };
  
  // 텍스트 하이라이팅 함수
  const highlightText = (text: string, highlight: string) => {
    if (!highlight || !text) return text;
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === highlight.toLowerCase() ? 
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark> : part
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalAmount = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  return (
    <div className="mobile-container mobile-spacing">
      {/* 페이지 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">지출 내역</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            총 {filteredExpenses.length}건의 지출 • ₩{getTotalAmount().toLocaleString()}
          </p>
        </div>
      </div>

      {/* 검색 및 필터 영역 */}
      <div className="card p-4 sm:p-6">
        {!showAdvancedSearch ? (
          // 기본 검색
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* 검색 */}
              <div className="relative sm:col-span-2 lg:col-span-1">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="장소, 메모, 카테고리 검색..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(e.target.value.length > 0);
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="touch-input w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                
                {/* 자동완성 제안 */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(suggestion)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        {highlightText(suggestion, searchTerm)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 카테고리 필터 */}
              <div className="relative">
                <FunnelIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="touch-input w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                >
                  <option value="">모든 카테고리</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* 정렬 기준 */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'category')}
                className="touch-input px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="date">날짜순</option>
                <option value="amount">금액순</option>
                <option value="category">카테고리순</option>
              </select>

              {/* 정렬 방향 */}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="touch-input px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="desc">내림차순</option>
                <option value="asc">오름차순</option>
              </select>
            </div>
            
            {/* 고급 검색 토글 및 저장된 검색 */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => setShowAdvancedSearch(true)}
                className="text-sm text-primary hover:text-primary-600 underline"
              >
                고급 검색
              </button>
              
              {savedSearches.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-500">저장된 검색:</span>
                  {savedSearches.slice(0, 3).map(savedSearch => (
                    <button
                      key={savedSearch.id}
                      onClick={() => loadSavedSearch(savedSearch)}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full"
                    >
                      {savedSearch.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // 고급 검색
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">고급 검색</h3>
              <button
                onClick={() => setShowAdvancedSearch(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                기본 검색으로 돌아가기
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 키워드 검색 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">키워드</label>
                <input
                  type="text"
                  placeholder="검색어 입력..."
                  value={searchFilters.keyword}
                  onChange={(e) => setSearchFilters({...searchFilters, keyword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              {/* 거래 유형 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">거래 유형</label>
                <select
                  value={searchFilters.type}
                  onChange={(e) => setSearchFilters({...searchFilters, type: e.target.value as 'all' | 'expense' | 'income'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">전체</option>
                  <option value="expense">지출</option>
                  <option value="income">수입</option>
                </select>
              </div>
              
              {/* 카테고리 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <select
                  value={searchFilters.category}
                  onChange={(e) => setSearchFilters({...searchFilters, category: e.target.value, subcategory: ''})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">전체</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              {/* 서브카테고리 */}
              {searchFilters.category && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">세부 카테고리</label>
                  <select
                    value={searchFilters.subcategory}
                    onChange={(e) => setSearchFilters({...searchFilters, subcategory: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">전체</option>
                    {subcategories.map(subcategory => (
                      <option key={subcategory} value={subcategory}>{subcategory}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* 날짜 범위 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시작 날짜</label>
                <input
                  type="date"
                  value={searchFilters.dateFrom}
                  onChange={(e) => setSearchFilters({...searchFilters, dateFrom: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">종료 날짜</label>
                <input
                  type="date"
                  value={searchFilters.dateTo}
                  onChange={(e) => setSearchFilters({...searchFilters, dateTo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              {/* 금액 범위 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">최소 금액</label>
                <input
                  type="number"
                  placeholder="0"
                  value={searchFilters.amountFrom}
                  onChange={(e) => setSearchFilters({...searchFilters, amountFrom: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">최대 금액</label>
                <input
                  type="number"
                  placeholder="무제한"
                  value={searchFilters.amountTo}
                  onChange={(e) => setSearchFilters({...searchFilters, amountTo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              {/* 장소 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">장소</label>
                <input
                  type="text"
                  placeholder="장소명 입력..."
                  value={searchFilters.place}
                  onChange={(e) => setSearchFilters({...searchFilters, place: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            
            {/* 고급 검색 컨트롤 */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-gray-200">
              <div className="flex gap-2">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  초기화
                </button>
                <button
                  onClick={() => {
                    const name = prompt('검색 조건의 이름을 입력하세요:');
                    if (name) saveSearch(name);
                  }}
                  className="px-4 py-2 text-sm text-primary border border-primary rounded-lg hover:bg-primary-50"
                >
                  검색 저장
                </button>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'category')}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="date">날짜순</option>
                  <option value="amount">금액순</option>
                  <option value="category">카테고리순</option>
                </select>
                
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="desc">내림차순</option>
                  <option value="asc">오름차순</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 지출 목록 */}
      <div className="card overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">조건에 맞는 지출 내역이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-1">채팅으로 새로운 지출을 입력해보세요!</p>
          </div>
        ) : (
          <>
            {/* 데스크톱 테이블 */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">장소</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">금액</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">메모</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">신뢰도</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {highlightTerm ? highlightText(expense.place, highlightTerm) : expense.place}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {expense.category}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">{expense.subcategory}</div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${expense.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {expense.type === 'income' ? '+' : '-'}₩{expense.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {expense.memo ? (highlightTerm ? highlightText(expense.memo, highlightTerm) : expense.memo) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${expense.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs">{(expense.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingExpense(expense)}
                            className="text-primary hover:text-primary-600 transition-colors"
                            title="수정"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                            title="삭제"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 모바일 카드 레이아웃 */}
            <div className="lg:hidden space-y-3">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">{formatDate(expense.date)}</span>
                        <span className={`text-lg font-semibold ${expense.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {expense.type === 'income' ? '+' : '-'}₩{expense.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="font-medium text-gray-900 mb-1">
                        {highlightTerm ? highlightText(expense.place, highlightTerm) : expense.place}
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {expense.category}
                        </span>
                        <span className="text-xs text-gray-500">{expense.subcategory}</span>
                      </div>
                      {expense.memo && (
                        <div className="text-sm text-gray-600 mb-2">
                          {highlightTerm ? highlightText(expense.memo, highlightTerm) : expense.memo}
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${expense.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">신뢰도 {(expense.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => setEditingExpense(expense)}
                      className="touch-button flex items-center px-3 py-2 text-sm text-primary hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <PencilIcon className="w-4 h-4 mr-1" />
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="touch-button flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-4 h-4 mr-1" />
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 수정 모달 (간단 구현) */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">지출 내역 수정</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">장소</label>
                <input
                  type="text"
                  value={editingExpense.place}
                  onChange={(e) => setEditingExpense({...editingExpense, place: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">금액</label>
                <input
                  type="number"
                  value={editingExpense.amount}
                  onChange={(e) => setEditingExpense({...editingExpense, amount: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
                <textarea
                  value={editingExpense.memo || ''}
                  onChange={(e) => setEditingExpense({...editingExpense, memo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingExpense(null)}
                className="touch-button px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={() => handleEditSave(editingExpense)}
                className="btn-primary touch-button"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
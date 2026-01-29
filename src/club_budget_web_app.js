import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Users, DollarSign, TrendingUp, TrendingDown, Calendar, Receipt, Home, Lock, X, Edit, LogIn, CalendarDays, Shield, UserCheck, UserX } from 'lucide-react';

const MONTHLY_FEE = 5000;

const storage = {
  get: (key) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }
};

export default function ClubBudgetManager() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pwd, setPwd] = useState('');
  const [page, setPage] = useState('home');
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [payments, setPayments] = useState({});
  const [newName, setNewName] = useState('');
  const [newTx, setNewTx] = useState({ type: 'expense', amount: '', category: '', description: '', date: (() => {
    const now = new Date();
    // 日本時間の年月日を取得
    const jstYear = now.getFullYear();
    const jstMonth = String(now.getMonth() + 1).padStart(2, '0');
    const jstDay = String(now.getDate()).padStart(2, '0');
    return `${jstYear}-${jstMonth}-${jstDay}`;
  })() });
  const [year, setYear] = useState(new Date().getFullYear());
  const [homeYear, setHomeYear] = useState(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    // 4月-12月は当年、1月-3月は前年を年度として返す
    return month >= 4 ? now.getFullYear() : now.getFullYear() - 1;
  });
  const [showPay, setShowPay] = useState(false);
  const [selPay, setSelPay] = useState(null);
  const [payDate, setPayDate] = useState(() => {
    const now = new Date();
    // 日本時間の年月日を取得
    const jstYear = now.getFullYear();
    const jstMonth = String(now.getMonth() + 1).padStart(2, '0');
    const jstDay = String(now.getDate()).padStart(2, '0');
    return `${jstYear}-${jstMonth}-${jstDay}`;
  });
  const [editing, setEditing] = useState(false);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCalendarDetail, setShowCalendarDetail] = useState(false);
  const [showAdminManagement, setShowAdminManagement] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

  useEffect(() => {
    const m = storage.get('members');
    const t = storage.get('transactions');
    const p = storage.get('payments');
    if (m) setMembers(m);
    if (t) setTransactions(t);
    if (p) setPayments(p);
  }, []);

  const login = () => {
    if (pwd === (storage.get('pwd') || 'club2025')) {
      const member = members.find(m => m.isAdmin);
      setCurrentUser(member || { id: 'admin', name: '管理者', isAdmin: true });
      setIsAdmin(true);
      setShowLogin(false);
      setPwd('');
      
      // 初回ログイン判定（初期パスワードの場合）
      const currentPwd = storage.get('pwd');
      if (!currentPwd || pwd === 'club2025') {
        setIsFirstLogin(true);
        setShowPasswordChange(true);
      }
    } else {
      alert('パスワードが違います');
    }
  };

  const addMember = () => {
    if (!isAdmin) return;
    if (!newName.trim()) return;
    const updated = [...members, { id: Date.now(), name: newName, isAdmin: false }];
    setMembers(updated);
    storage.set('members', updated);
    setNewName('');
  };

  const delMember = (id) => {
    if (!isAdmin) return;
    const updated = members.filter(m => m.id !== id);
    setMembers(updated);
    storage.set('members', updated);
  };

  const toggleAdminRights = (memberId) => {
    if (!isAdmin || !currentUser) return;
    
    // 自分自身の権限は剥奪できない
    if (memberId === currentUser.id) {
      alert('自分自身の管理者権限は剥奪できません');
      return;
    }
    
    const updated = members.map(m => {
      if (m.id === memberId) {
        return { ...m, isAdmin: !m.isAdmin };
      }
      return m;
    });
    
    setMembers(updated);
    storage.set('members', updated);
    
    const targetMember = updated.find(m => m.id === memberId);
    alert(`${targetMember.name}の管理者権限を${targetMember.isAdmin ? '付与' : '剥奪'}しました`);
  };

  const logout = () => {
    setIsAdmin(false);
    setCurrentUser(null);
    setShowAdminManagement(false);
    setShowPasswordChange(false);
  };

  const changePassword = () => {
    if (!newPassword.trim()) {
      alert('新しいパスワードを入力してください');
      return;
    }
    
    if (newPassword.length < 4) {
      alert('パスワードは4文字以上で入力してください');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      alert('確認用パスワードが一致しません');
      return;
    }
    
    // パスワードを保存
    storage.set('pwd', newPassword);
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordChange(false);
    setIsFirstLogin(false);
    
    alert('パスワードを変更しました');
  };

  const cancelPasswordChange = () => {
    if (isFirstLogin) {
      // 初回ログインの場合はログアウト
      logout();
    } else {
      // それ以外の場合はキャンセル
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
    }
  };

  const handlePayClick = (mid, y, m) => {
    if (!isAdmin) return;
    const key = `${mid}-${y}-${m}`;
    const pay = payments[key];
    const mem = members.find(m => m.id === mid);
    setSelPay({ mid, y, m, key, name: mem?.name, existing: pay });
    // 新規支払いの場合は常に日本時間の当日、既存支払いの場合は保存された日付
    if (pay) {
      setPayDate(pay.date.split('T')[0]);
    } else {
      const now = new Date();
      // 日本時間の年月日を取得
      const jstYear = now.getFullYear();
      const jstMonth = String(now.getMonth() + 1).padStart(2, '0');
      const jstDay = String(now.getDate()).padStart(2, '0');
      setPayDate(`${jstYear}-${jstMonth}-${jstDay}`);
    }
    setEditing(!pay);
    setShowPay(true);
  };

  const savePay = () => {
    if (!isAdmin || !selPay) return;
    const { mid, y, m, key, name } = selPay;
    const newPay = { ...payments, [key]: { mid, y, m, date: new Date(payDate).toISOString(), by: '管理者', at: new Date().toISOString() } };
    setPayments(newPay);
    storage.set('payments', newPay);

    const exists = transactions.find(t => t.mid === mid && t.y === y && t.m === m && t.cat === '部費');
    if (!exists) {
      const newTxs = [{ id: Date.now(), type: 'income', amount: MONTHLY_FEE, cat: '部費', desc: `${name} - ${y}年度${months[m-1]}分`, date: payDate, mid, y, m }, ...transactions];
      setTransactions(newTxs);
      storage.set('transactions', newTxs);
    }
    setShowPay(false);
    setSelPay(null);
  };

  const delPay = () => {
    if (!isAdmin || !selPay || !window.confirm('削除しますか？')) return;
    const { mid, y, m, key } = selPay;
    const newPay = {...payments};
    delete newPay[key];
    setPayments(newPay);
    storage.set('payments', newPay);

    const newTxs = transactions.filter(t => !(t.mid === mid && t.y === y && t.m === m && t.cat === '部費'));
    setTransactions(newTxs);
    storage.set('transactions', newTxs);
    setShowPay(false);
    setSelPay(null);
  };

  const addTx = () => {
    if (!isAdmin) return;
    if (!newTx.amount || !newTx.category) {
      alert('金額とカテゴリを入力してください');
      return;
    }
    const tx = { id: Date.now(), type: newTx.type, amount: parseFloat(newTx.amount), cat: newTx.category, desc: newTx.description, date: newTx.date };
    const updated = [tx, ...transactions];
    setTransactions(updated);
    storage.set('transactions', updated);
    setNewTx({ type: 'expense', amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0] });
  };

  const delTx = (id) => {
    if (!isAdmin) return;
    const tx = transactions.find(t => t.id === id);
    if (tx && tx.cat === '部費') {
      alert('部費は支払い管理画面から削除してください');
      return;
    }
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    storage.set('transactions', updated);
  };

  const balance = transactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // 年度ごとの収支計算
  const getYearlyBalance = (targetYear) => {
    const yearlyTransactions = transactions.filter(t => {
      const txDate = new Date(t.date);
      const txYear = txDate.getFullYear();
      const txMonth = txDate.getMonth() + 1;
      
      // 年度計算：4月-12月はtargetYear、1月-3月はtargetYear+1
      // 2026年度 = 2026年4月-2026年12月 + 2027年1月-2027年3月
      if (txMonth >= 4) {
        return txYear === targetYear;
      } else {
        return txYear === targetYear + 1;
      }
    });
    
    const yearlyIncome = yearlyTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const yearlyExpense = yearlyTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const yearlyBalance = yearlyIncome - yearlyExpense;
    
    return {
      income: yearlyIncome,
      expense: yearlyExpense,
      balance: yearlyBalance,
      count: yearlyTransactions.length
    };
  };
  
  const currentYearlyData = getYearlyBalance(homeYear);

  // カレンダー関連のヘルパー関数（標準カレンダー）
  const getDaysInMonth = (year, month) => {
    // 標準的な月の日数計算（1月=1, 2月=2, ..., 12月=12）
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    // その月の1日の曜日を取得（0=日曜日, 1=月曜日...）
    return new Date(year, month - 1, 1).getDay();
  };

  const getTransactionsForDate = (date) => {
    return transactions.filter(t => t.date === date && t.cat !== '部費');
  };

  const handleDateClick = (date) => {
    const dayTransactions = getTransactionsForDate(date);
    if (dayTransactions.length > 0) {
      setSelectedDate({ date, transactions: dayTransactions });
      setShowCalendarDetail(true);
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);
    const days = [];

    // 空白セルを追加
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="border border-gray-200 p-2 min-h-[80px] bg-gray-50"></div>);
    }

    // 日付セルを追加
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayTransactions = getTransactionsForDate(date);
      const hasTransactions = dayTransactions.length > 0;

      // 今日の日付判定
      const today = new Date();
      const isToday = day === today.getDate() && 
                     calendarMonth === today.getMonth() + 1 && 
                     calendarYear === today.getFullYear();

      days.push(
        <div 
          key={day} 
          className={`border border-gray-200 p-2 min-h-[80px] ${hasTransactions ? 'cursor-pointer hover:bg-cyan-50' : 'bg-white'} ${isToday ? 'bg-cyan-100' : ''}`}
          onClick={() => hasTransactions && handleDateClick(date)}
        >
          <div className="font-medium text-sm mb-1">{day}</div>
          {hasTransactions && (
            <div className="space-y-1">
              {dayTransactions.slice(0, 2).map((tx, idx) => (
                <div key={idx} className={`text-xs p-1 rounded ${tx.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {tx.cat}
                </div>
              ))}
              {dayTransactions.length > 2 && (
                <div className="text-xs text-gray-500">+{dayTransactions.length - 2}</div>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-100 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-4xl font-bold text-cyan-900">部費管理システム</h1>
          {!isAdmin ? (
            <button onClick={() => setShowLogin(true)} className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 font-medium">
              <LogIn size={20}/>
              <span className="hidden sm:inline">管理者ログイン</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{currentUser?.name}</span>
              <button onClick={() => setShowAdminManagement(true)} className="flex items-center gap-1 bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 text-sm">
                <Shield size={16}/>
                <span className="hidden sm:inline">権限管理</span>
              </button>
              <button onClick={() => setShowPasswordChange(true)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm">
                <Lock size={16}/>
                <span className="hidden sm:inline">パスワード変更</span>
              </button>
              <button onClick={logout} className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 hover:bg-white/50 rounded">ログアウト</button>
            </div>
          )}
        </div>
        
        <div className="bg-white shadow-md mb-6 rounded-lg">
          <div className="flex flex-wrap">
            {[{n:'home',i:<Home size={20}/>,l:'ホーム'},{n:'calendar',i:<CalendarDays size={20}/>,l:'カレンダー'},{n:'payments',i:<Calendar size={20}/>,l:'支払い管理'},{n:'members',i:<Users size={20}/>,l:'メンバー'},{n:'transactions',i:<Receipt size={20}/>,l:'収支'}].map(p => (
              <button key={p.n} onClick={() => setPage(p.n)} className={`flex-1 py-4 px-4 font-medium flex items-center justify-center gap-2 ${page === p.n ? 'bg-cyan-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{p.i}<span className="hidden sm:inline">{p.l}</span></button>
            ))}
          </div>
        </div>
        
        {page === 'home' && (
          <div>
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">年度別収支状況</h2>
                <select value={homeYear} onChange={(e) => setHomeYear(parseInt(e.target.value))} className="px-4 py-2 border border-gray-300 rounded-lg">
                  {[2024,2025,2026,2027,2028,2029,2030].map(y => <option key={y} value={y}>{y}年度</option>)}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">{homeYear}年度 総収支</p>
                    <p className={`text-3xl font-bold ${currentYearlyData.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>¥{currentYearlyData.balance.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{currentYearlyData.count}件の取引</p>
                  </div>
                  <DollarSign className="text-cyan-400" size={40}/>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">{homeYear}年度 総収入</p>
                    <p className="text-3xl font-bold text-teal-600">¥{currentYearlyData.income.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="text-teal-400" size={40}/>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">{homeYear}年度 総支出</p>
                    <p className="text-3xl font-bold text-red-600">¥{currentYearlyData.expense.toLocaleString()}</p>
                  </div>
                  <TrendingDown className="text-red-400" size={40}/>
                </div>
              </div>
            </div>
          </div>
        )}

        {page === 'calendar' && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">収支カレンダー</h2>
              <div className="flex gap-2">
                <select value={calendarYear} onChange={(e) => setCalendarYear(parseInt(e.target.value))} className="px-4 py-2 border border-gray-300 rounded-lg">
                  {[2024,2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}年</option>)}
                </select>
                <select value={calendarMonth} onChange={(e) => setCalendarMonth(parseInt(e.target.value))} className="px-4 py-2 border border-gray-300 rounded-lg">
                  {months.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
              </div>
            </div>
            {!isAdmin && <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">閲覧モード：編集するには管理者ログインが必要です</div>}
            
            <div className="mb-4">
              <div className="grid grid-cols-7 gap-0 border border-gray-300">
                {['日','月','火','水','木','金','土'].map(day => (
                  <div key={day} className="border-r border-gray-300 last:border-r-0 p-2 bg-gray-100 text-center font-bold text-sm">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0 border border-t-0 border-gray-300">
                {renderCalendar()}
              </div>
            </div>

            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                <span>収入</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                <span>支出</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-cyan-100 border border-cyan-300 rounded"></div>
                <span>今日</span>
              </div>
            </div>
          </div>
        )}

        {page === 'payments' && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">月別支払い状況（月額¥{MONTHLY_FEE.toLocaleString()}）</h2>
              <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="px-4 py-2 border border-gray-300 rounded-lg">
                {[2024,2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}年度</option>)}
              </select>
            </div>
            {!isAdmin && <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">閲覧モード：編集するには管理者ログインが必要です</div>}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-max">
                <thead><tr className="bg-cyan-100"><th className="border border-gray-300 px-2 sm:px-4 py-3 text-left font-bold text-gray-800 sticky left-0 bg-cyan-100 z-10">メンバー</th>{months.map((m,i) => <th key={i} className="border border-gray-300 px-2 sm:px-3 py-3 text-center font-bold text-gray-800 min-w-[50px] sm:min-w-[60px]">{m}</th>)}</tr></thead>
                <tbody>{members.map(mem => <tr key={mem.id} className="hover:bg-gray-50"><td className="border border-gray-300 px-2 sm:px-4 py-3 font-medium text-gray-800 sticky left-0 bg-white z-10">{mem.name}</td>{months.map((_,i) => {const isPaid = !!payments[`${mem.id}-${year}-${i+1}`]; return <td key={i} className={`border border-gray-300 px-2 sm:px-3 py-3 text-center ${isAdmin ? 'cursor-pointer hover:bg-cyan-50' : ''}`} onClick={() => handlePayClick(mem.id,year,i+1)}><span className={`text-xl sm:text-2xl font-bold ${isPaid ? 'text-teal-600' : 'text-red-500'}`}>{isPaid ? '◯' : '✕'}</span></td>})}</tr>)}</tbody>
              </table>
            </div>
          </div>
        )}

        {page === 'members' && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex items-center mb-6"><Users className="text-cyan-600 mr-2" size={24}/><h2 className="text-xl sm:text-2xl font-bold text-gray-800">メンバー管理</h2></div>
            {!isAdmin && <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">閲覧モード：編集するには管理者ログインが必要です</div>}
            {isAdmin && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex gap-2">
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addMember()} placeholder="メンバー名" className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                  <button onClick={addMember} className="bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700 flex items-center gap-2 font-medium"><Plus size={20}/><span className="hidden sm:inline">追加</span></button>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-base sm:text-lg font-medium text-gray-800">{m.name}</span>
                    {m.isAdmin && (
                      <span className="flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                        <Shield size={12}/>
                        管理者
                      </span>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleAdminRights(m.id)} 
                        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium ${
                          m.isAdmin 
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                        disabled={m.id === currentUser?.id}
                        title={m.id === currentUser?.id ? '自分自身の権限は変更できません' : ''}
                      >
                        {m.isAdmin ? <UserX size={16}/> : <UserCheck size={16}/>}
                        {m.isAdmin ? '剥奪' : '付与'}
                      </button>
                      <button onClick={() => delMember(m.id)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded">
                        <Trash2 size={20}/>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {page === 'transactions' && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">収支管理</h2>
            {!isAdmin && <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">閲覧モード：編集するには管理者ログインが必要です</div>}
            {isAdmin && (
              <div className="mb-6 p-4 sm:p-6 bg-gray-50 rounded-lg">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button onClick={() => setNewTx({...newTx,type:'income'})} className={`flex-1 py-3 rounded-lg font-medium ${newTx.type === 'income' ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-700'}`}>収入</button>
                    <button onClick={() => setNewTx({...newTx,type:'expense'})} className={`flex-1 py-3 rounded-lg font-medium ${newTx.type === 'expense' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}>支出</button>
                  </div>
                  <input type="number" value={newTx.amount} onChange={(e) => setNewTx({...newTx,amount:e.target.value})} placeholder="金額" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                  <input type="text" value={newTx.category} onChange={(e) => setNewTx({...newTx,category:e.target.value})} placeholder="カテゴリ" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                  <input type="text" value={newTx.description} onChange={(e) => setNewTx({...newTx,description:e.target.value})} placeholder="説明" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                  <input type="date" value={newTx.date} onChange={(e) => setNewTx({...newTx,date:e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                  <button onClick={addTx} className="w-full bg-cyan-600 text-white py-3 rounded-lg hover:bg-cyan-700 font-medium">記録を追加</button>
                </div>
              </div>
            )}
            <div className="space-y-3 max-h-96 overflow-y-auto">{transactions.filter(t => t.cat !== '部費').map(t => <div key={t.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg"><div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className={`text-lg font-bold ${t.type === 'income' ? 'text-teal-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'}¥{t.amount.toLocaleString()}</span><span className="text-xs bg-cyan-100 text-cyan-800 px-2 py-1 rounded">{t.cat}</span></div>{t.desc && <p className="text-xs text-gray-600 mb-1">{t.desc}</p>}<p className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString('ja-JP')}</p></div>{isAdmin && <button onClick={() => delTx(t.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18}/></button>}</div>)}</div>
          </div>
        )}

        {showCalendarDetail && selectedDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {new Date(selectedDate.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}の取引
                </h2>
                <button onClick={() => {setShowCalendarDetail(false); setSelectedDate(null);}} className="text-gray-500">
                  <X size={24}/>
                </button>
              </div>
              <div className="space-y-3">
                {selectedDate.transactions.map(tx => (
                  <div key={tx.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-lg font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}¥{tx.amount.toLocaleString()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${tx.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {tx.type === 'income' ? '収入' : '支出'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><span className="font-medium">カテゴリ:</span> {tx.cat}</div>
                      {tx.desc && <div><span className="font-medium">説明:</span> {tx.desc}</div>}
                    </div>
                  </div>
                ))}
                {selectedDate.transactions.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    この日の取引はありません
                  </div>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">合計:</span>
                  <span className={`text-xl font-bold ${selectedDate.transactions.reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedDate.transactions.reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0) >= 0 ? '+' : ''}¥{selectedDate.transactions.reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {showLogin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Lock className="text-cyan-600 mr-2" size={32} />
                  <h2 className="text-2xl font-bold text-cyan-900">管理者ログイン</h2>
                </div>
                <button onClick={() => {setShowLogin(false); setPwd('');}} className="text-gray-500"><X size={24}/></button>
              </div>
              <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && login()} placeholder="パスワード" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-4" />
              <button onClick={login} className="w-full bg-cyan-600 text-white py-3 rounded-lg hover:bg-cyan-700 font-medium">ログイン</button>
              <p className="text-xs text-gray-500 mt-4 text-center">初期パスワード: club2025</p>
            </div>
          </div>
        )}

        {showPay && selPay && isAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">{selPay.name} - {selPay.y}年度{months[selPay.m-1]}</h2>
                <button onClick={() => {setShowPay(false);setSelPay(null);}} className="text-gray-500"><X size={24}/></button>
              </div>
              {selPay.existing && !editing ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between"><span className="text-gray-600">支払日:</span><span className="font-medium">{new Date(selPay.existing.date).toLocaleDateString('ja-JP')}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">記録者:</span><span className="font-medium">{selPay.existing.by}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">金額:</span><span className="font-medium text-teal-600">¥{MONTHLY_FEE.toLocaleString()}</span></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(true)} className="flex-1 bg-cyan-600 text-white py-3 rounded-lg hover:bg-cyan-700 font-medium flex items-center justify-center gap-2"><Edit size={18}/>編集</button>
                    <button onClick={delPay} className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-2"><Trash2 size={18}/>削除</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">支払日</label><input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"/></div>
                  <div className="flex gap-2">
                    <button onClick={() => {if(selPay.existing){setEditing(false);}else{setShowPay(false);setSelPay(null);}}} className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 font-medium">キャンセル</button>
                    <button onClick={savePay} className="flex-1 bg-cyan-600 text-white py-3 rounded-lg hover:bg-cyan-700 font-medium">保存</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showAdminManagement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Shield className="text-purple-600 mr-2" size={28} />
                  <h2 className="text-2xl font-bold text-gray-800">管理者権限管理</h2>
                </div>
                <button onClick={() => setShowAdminManagement(false)} className="text-gray-500">
                  <X size={24}/>
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">現在の管理者:</span> {currentUser?.name}
                </p>
                <p className="text-xs text-blue-600 mt-1">自分自身の管理者権限は剥奪できません</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">メンバー一覧</h3>
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-medium text-gray-800">{m.name}</span>
                      {m.isAdmin && (
                        <span className="flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                          <Shield size={12}/>
                          管理者
                        </span>
                      )}
                      {m.id === currentUser?.id && (
                        <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                          あなた
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => toggleAdminRights(m.id)} 
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                        m.isAdmin 
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                      disabled={m.id === currentUser?.id}
                    >
                      {m.isAdmin ? <UserX size={16}/> : <UserCheck size={16}/>}
                      {m.isAdmin ? '管理者権限を剥奪' : '管理者権限を付与'}
                    </button>
                  </div>
                ))}
                {members.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    メンバーが登録されていません
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    管理者数: {members.filter(m => m.isAdmin).length} / {members.length}人
                  </div>
                  <button 
                    onClick={() => setShowAdminManagement(false)} 
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 font-medium"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPasswordChange && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Lock className="text-blue-600 mr-2" size={28} />
                  <h2 className="text-2xl font-bold text-gray-800">
                    {isFirstLogin ? '初期パスワード変更' : 'パスワード変更'}
                  </h2>
                </div>
                <button onClick={cancelPasswordChange} className="text-gray-500">
                  <X size={24}/>
                </button>
              </div>
              
              {isFirstLogin && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <span className="font-medium">セキュリティのため、初期パスワードの変更が必要です。</span>
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">変更しない場合はログアウトします。</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード</label>
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="4文字以上で入力" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    minLength={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">確認用パスワード</label>
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="再度入力" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <button 
                  onClick={changePassword} 
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                  パスワードを変更
                </button>
                <button 
                  onClick={cancelPasswordChange} 
                  className={`w-full py-3 rounded-lg font-medium ${
                    isFirstLogin 
                      ? 'bg-gray-300 text-gray-700 hover:bg-gray-400' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {isFirstLogin ? 'ログアウト' : 'キャンセル'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

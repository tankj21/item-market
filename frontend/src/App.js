// src/App.js (一部修正・追加)

import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import MarketPage from './pages/MarketPage';
import AddItemPage from './pages/AddItemPage';
import ItemDetailPage from './pages/ItemDetailPage'; // <-- インポートを追加
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          {/* ...ヘッダー部分は変更なし... */}
        </header>
        
        <Routes>
          <Route path="/" element={<MarketPage />} />
          <Route path="/add-item" element={<AddItemPage />} />
          <Route path="/items/:id" element={<ItemDetailPage />} /> {/* <-- 新しいルートを追加 */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
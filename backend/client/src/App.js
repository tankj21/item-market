import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import MarketPage from './pages/MarketPage';
import AddItemPage from './pages/AddItemPage';
import ItemDetailPage from './pages/ItemDetailPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>ゲームアイテム相場サイト</h1>
          <nav>
            <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              相場を見る
            </NavLink>
            <NavLink to="/add-item" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              アイテムを追加
            </NavLink>
          </nav>
        </header>
        
        <Routes>
          <Route path="/" element={<MarketPage />} />
          <Route path="/add-item" element={<AddItemPage />} />
          <Route path="/items/:id" element={<ItemDetailPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

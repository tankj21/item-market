import React from 'react';
// react-router-domから必要なコンポーネントをインポートします
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import MarketPage from './pages/MarketPage';
import AddItemPage from './pages/AddItemPage';
import ItemDetailPage from './pages/ItemDetailPage';
import './App.css';

function App() {
  return (
    // <Router>でアプリ全体を囲み、ルーティングを有効にします
    <Router>
      <div className="App">
        {/* 全ページ共通のヘッダー */}
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
        
        {/* URLに応じて表示するコンポーネントを切り替える設定 */}
        <Routes>
          {/* URLが'/'の時はMarketPageを表示 */}
          <Route path="/" element={<MarketPage />} />
          
          {/* URLが'/add-item'の時はAddItemPageを表示 */}
          <Route path="/add-item" element={<AddItemPage />} />
          
          {/* URLが'/items/:id'の時はItemDetailPageを表示 */}
          <Route path="/items/:id" element={<ItemDetailPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

// src/pages/AddItemPage.js (新規作成)

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:3001/api';

function AddItemPage() {
  const [itemName, setItemName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); // ページ遷移用のフック

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setError('アイテム名を入力してください。');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/items`, { name: itemName });

      const newItemId = response.data.id;

      setMessage(`「${itemName}」を正常に登録しました。`);
      setError('');
      setItemName(''); // 入力欄をクリア

      // 2秒後に相場ページへ自動でリダイレクト
      setTimeout(() => {
        navigate(`/items/${newItemId}`);
      }, 2000);

    } catch (err) {
      console.error("Error adding item:", err.response);
      if (err.response && err.response.status === 409) {
        setError('このアイテムは既に存在します。');
      } else {
        setError('アイテムの登録に失敗しました。');
      }
      setMessage('');
    }
  };

  return (
    <main>
      <section className="form-section">
        <h2>新しいアイテムを追加</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="item-name-input">アイテム名:</label>
            <input
              id="item-name-input"
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="例: フェニックスの尾"
            />
          </div>
          <button type="submit">データベースに追加</button>
        </form>
        {message && <p className="message success">{message}</p>}
        {error && <p className="message error">{error}</p>}
      </section>
    </main>
  );
}

export default AddItemPage;
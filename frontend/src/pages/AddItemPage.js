import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:3001/api';

function AddItemPage() {
  const [itemName, setItemName] = useState('');
  const [itemImage, setItemImage] = useState(null); // 画像ファイルの状態
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // ★追加: ファイルが選択されたときのハンドラ
  const handleImageChange = (e) => {
    setItemImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setError('アイテム名を入力してください。');
      return;
    }

    // ★修正: FormDataを使ってテキストと画像を一緒に送信する
    const formData = new FormData();
    formData.append('name', itemName); // テキストデータを追加
    if (itemImage) {
      formData.append('image', itemImage); // 画像データがあれば追加
    }

    try {
      // multipart/form-dataとして送信
      const response = await axios.post(`${API_URL}/items`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const newItemId = response.data.id;
      setMessage(`「${itemName}」を登録しました。詳細ページに移動します。`);
      setError('');
      
      setTimeout(() => {
        navigate(`/items/${newItemId}`);
      }, 1500);

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
          {/* ★追加: 画像ファイル選択フォーム */}
          <div className="form-group">
            <label htmlFor="item-image-input">画像 (任意):</label>
            <input
              id="item-image-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
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

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function AddItemPage() {
  const [itemName, setItemName] = useState('');
  const [itemImage, setItemImage] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await axios.get(`${API_URL}/tags`);
        setAvailableTags(response.data);
      } catch (err) {
        console.error("Failed to fetch tags:", err);
      }
    };
    fetchTags();
  }, []);

  const handleImageChange = (e) => {
    setItemImage(e.target.files[0]);
  };

  const handleTagChange = (tagId) => {
    setSelectedTags(prevSelectedTags => {
      const newSelectedTags = new Set(prevSelectedTags);
      if (newSelectedTags.has(tagId)) {
        newSelectedTags.delete(tagId);
      } else {
        newSelectedTags.add(tagId);
      }
      return newSelectedTags;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setError('アイテム名を入力してください。');
      return;
    }

    const formData = new FormData();
    formData.append('name', itemName);
    if (itemImage) {
      formData.append('image', itemImage);
    }
    formData.append('tags', Array.from(selectedTags).join(','));

    try {
      const response = await axios.post(`${API_URL}/items`, formData);
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
            <input id="item-name-input" type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="例: フェニックスの尾" />
          </div>
          <div className="form-group">
            <label htmlFor="item-image-input">画像 (任意):</label>
            <input id="item-image-input" type="file" accept="image/*" onChange={handleImageChange} />
          </div>
          <div className="form-group-tags">
            <label>タグ:</label>
            <div className="tags-container">
              {availableTags.map(tag => (
                <div key={tag.id} className="tag-checkbox">
                  <input type="checkbox" id={`tag-${tag.id}`} value={tag.id} checked={selectedTags.has(tag.id)} onChange={() => handleTagChange(tag.id)} />
                  <label htmlFor={`tag-${tag.id}`}>{tag.name}</label>
                </div>
              ))}
            </div>
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


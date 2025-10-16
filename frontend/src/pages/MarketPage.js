import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function MarketPage() {
  const [items, setItems] = useState([]);
  const [formItemId, setFormItemId] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [availableTags, setAvailableTags] = useState([]);
  const [filterTags, setFilterTags] = useState(new Set());

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

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterTags.size > 0) {
        params.append('tags', Array.from(filterTags).join(','));
      }
      const response = await axios.get(`${API_URL}/items`, { params });
      setItems(response.data);
      if (response.data.length > 0 && !formItemId) {
        setFormItemId(response.data[0].id);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      //setMessage("データの取得に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filterTags]);

  const handleFilterChange = (tagId) => {
    setFilterTags(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(tagId)) {
        newFilters.delete(tagId);
      } else {
        newFilters.add(tagId);
      }
      return newFilters;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formItemId || !formPrice) {
      setMessage("アイテムと価格を入力してください。");
      return;
    }
    try {
      await axios.post(`${API_URL}/prices`, {
        itemId: Number(formItemId),
        price: Number(formPrice),
      });
      setMessage("価格を登録しました！");
      setFormPrice('');
      fetchItems();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error("Error submitting price:", error);
      setMessage("価格の登録に失敗しました。");
    }
  };

  return (
    <main>
      <section className="form-section">
        <h2>取引価格を入力</h2>
        <form onSubmit={handleSubmit}>
        <div className="form-group">
              <label htmlFor="item-select">アイテム:</label>
              <select 
                id="item-select" 
                value={formItemId}
                onChange={(e) => setFormItemId(e.target.value)}
              >
                {/* items配列から選択肢を動的に生成 */}
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="price-input">価格:</label>
              <input
                id="price-input"
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="例: 150"
              />
            </div>
            <button type="submit">登録する</button>
        </form>
        {message && <p className="message">{message}</p>}
      </section>

      <section className="market-section">
        <h2>現在の相場</h2>
        <div className="filter-container">
          <strong>絞り込み:</strong>
          {availableTags.map(tag => (
            <div key={tag.id} className="tag-checkbox">
              <input type="checkbox" id={`filter-tag-${tag.id}`} checked={filterTags.has(tag.id)} onChange={() => handleFilterChange(tag.id)} />
              <label htmlFor={`filter-tag-${tag.id}`}>{tag.name}</label>
            </div>
          ))}
        </div>
        {isLoading ? <p>読み込み中...</p> : (
        <table>
          <thead>
            <tr>
              <th>アイテム名</th>
              <th>タグ</th>
              <th>平均価格</th>
              <th>最高価格</th>
              <th>最低価格</th>
              <th>取引数</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link to={`/items/${item.id}`} className="item-link">
                    {item.name}
                  </Link>
                </td>
                <td className="tags-cell">
                  {item.tags && item.tags.split(',').map(tagName => (
                    <span key={tagName} className="item-tag">{tagName}</span>
                  ))}
                </td>
                <td>{item.average_price ? Math.round(item.average_price).toLocaleString() : 'N/A'} G</td>
                <td>{item.max_price ? item.max_price.toLocaleString() : 'N/A'} G</td>
                <td>{item.min_price ? item.min_price.toLocaleString() : 'N/A'} G</td>
                <td>{item.trade_count} 件</td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </section>
    </main>
  );
}

// ★★★ この一行が抜けていました！ ★★★
export default MarketPage;


import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

// ★修正: バックエンドのベースURLを定数化
const BASE_URL = 'http://localhost:3001'; 
const API_URL = `${BASE_URL}/api`;

function ItemDetailPage() {
  const { id } = useParams(); 
  const [itemData, setItemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/items/${id}`);
        setItemData(response.data);
        setError('');
      } catch (err) {
        console.error("Error fetching item details:", err);
        setError('アイテム情報の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };
    fetchItemDetails();
  }, [id]);

  if (loading) return <main><p>読み込み中...</p></main>;
  if (error) return <main><p className="message error">{error}</p></main>;
  if (!itemData || !itemData.details) {
    return (
      <main>
        <p className="message error">指定されたアイテムは見つかりませんでした。</p>
        <Link to="/">相場一覧に戻る</Link>
      </main>
    );
  }

  const { details, history } = itemData;
  // ★追加: 画像URLを組み立てる
  const imageUrl = details.image_url ? `${BASE_URL}${details.image_url}` : null;

  return (
    <main>
      <section className="item-detail-header">
        {/* ★追加: 画像表示エリア */}
        <div className="item-visual">
          {imageUrl ? (
            <img src={imageUrl} alt={details.name} className="item-image" />
          ) : (
            <div className="item-image-placeholder">No Image</div>
          )}
        </div>
        <div className="item-info">
          <h2>{details.name}</h2>
          <div className="summary-stats">
            <div><span>平均価格</span><strong>{details.average_price ? Math.round(details.average_price).toLocaleString() : 'N/A'} G</strong></div>
            <div><span>最高価格</span><strong>{details.max_price ? details.max_price.toLocaleString() : 'N/A'} G</strong></div>
            <div><span>最低価格</span><strong>{details.min_price ? details.min_price.toLocaleString() : 'N/A'} G</strong></div>
            <div><span>総取引数</span><strong>{details.trade_count} 件</strong></div>
          </div>
        </div>
      </section>

      <section className="price-history">
        <h3>価格履歴</h3>
        {history.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>取引日時 (JST)</th>
                <th>価格</th>
              </tr>
            </thead>
            <tbody>
              {history.map((trade, index) => (
                <tr key={index}>
                  {/* ★修正: toLocaleStringでJSTに変換して表示 */}
                  <td>{new Date(trade.created_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</td>
                  <td>{trade.price.toLocaleString()} G</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>このアイテムの取引履歴はまだありません。</p>
        )}
      </section>
    </main>
  );
}

export default ItemDetailPage;

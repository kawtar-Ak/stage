import React, { useEffect, useState } from 'react';
import axios from 'axios';

function MessagesAdministratifs() {
  const [messages, setMessages] = useState([]);
  const [motCle, setMotCle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const url = motCle.trim()
        ? `/api/courriers/search?motCle=${encodeURIComponent(motCle.trim())}`
        : '/api/courriers';
      const res = await axios.get(url);
      setMessages(res.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'Erreur chargement des messages administratifs'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchMessages, 250);
    return () => clearTimeout(timeout);
  }, [motCle]);

  return (
    <div className="page-container">
      <h1 className="page-title">Messages et contenus administratifs</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="filters">
        <input
          type="text"
          value={motCle}
          onChange={e => setMotCle(e.target.value)}
          placeholder="Rechercher par N BO, source, objet, destinataire, observation, etat"
        />
        <button type="button" className="btn-secondary" onClick={() => setMotCle('')}>Reinitialiser</button>
      </div>

      <div className="data-table-wrapper">
        <table className="modern-table">
          <thead>
            <tr>
              <th>N BO</th>
              <th>Date</th>
              <th>Source</th>
              <th>Objet</th>
              <th>Direction</th>
              <th>Destinataire</th>
              <th>Service</th>
              <th>Etat</th>
              <th>Observation</th>
              <th>PDF</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10">Chargement...</td></tr>
            ) : messages.length === 0 ? (
              <tr><td colSpan="10">Aucun message administratif trouve.</td></tr>
            ) : (
              messages.map(item => (
                <tr key={item.id}>
                  <td>{item.idBureauOrdre || '-'}</td>
                  <td>{formatDate(item.date)}</td>
                  <td>{item.source || '-'}</td>
                  <td>{item.sujet || '-'}</td>
                  <td>{item.direction || '-'}</td>
                  <td>{item.destinataire || '-'}</td>
                  <td>{item.serviceNom || item.idService || '-'}</td>
                  <td>{item.etat || '-'}</td>
                  <td>{item.description || '-'}</td>
                  <td>{item.lienPdf ? <a href={item.lienPdf} target="_blank" rel="noreferrer">PDF</a> : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}

function getErrorMessage(error, fallback) {
  if (typeof error.response?.data === 'string') return error.response.data;
  if (error.response?.data?.message) return error.response.data.message;
  return fallback;
}

export default MessagesAdministratifs;

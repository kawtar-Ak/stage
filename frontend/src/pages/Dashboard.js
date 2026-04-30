import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

function Dashboard() {
  const { t } = useTranslation();
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/transactions/outgoing')
      .then(res => {
        const pending = res.data.filter(t => t.statut === 'En attente');
        setPendingTransactions(pending);
        setLoading(false);
      })
      .catch(err => {
        setError(t('erreur_chargement'));
        setLoading(false);
      });
  }, [t]);

  if (loading) return <div className="loading">{t('chargement')}</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div>
      <h1>{t('dashboard')}</h1>
      <div className="dashboard-pending-section">
        <h2>{t('transactions_outgoing')}</h2>
        {pendingTransactions.length === 0 && <p>{t('aucune_transaction')}</p>}
        {pendingTransactions.map(trans => (
          <div key={trans.id} className="pending-card" style={{ border: '1px solid #ddd', margin: '10px', padding: '10px', borderRadius: '8px' }}>
            <p><strong>{t('document')} :</strong> {trans.documentSujet}</p>
            <p><strong>{t('service_destinataire')} :</strong> {trans.destinationServiceNom}</p>
            <p><strong>{t('personne')} :</strong> {trans.destinationUserName || '—'}</p>
            <p><strong>{t('message')} :</strong> {trans.message}</p>
            <button className="btn-secondary" onClick={() => window.open(`/api/transactions/${trans.id}`, '_blank')}>{t('consulter')}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
export default Dashboard;
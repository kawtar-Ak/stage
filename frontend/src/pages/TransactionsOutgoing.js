import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

function TransactionsOutgoing() {
    const { t } = useTranslation();
    const [transactions, setTransactions] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get('/api/transactions/outgoing')
            .then(res => setTransactions(res.data))
            .catch(() => setError(t('erreur_chargement')));
    }, [t]);

    const transferAgain = (docId, docType) => {
        // Rediriger vers Mes entités ou pré-remplir un modal
        window.location.href = '/mes-entites';
    };

    return (
        <div className="page-container">
            <h1 className="page-title">{t('transactions_outgoing')}</h1>
            {error && <div className="error-message">{error}</div>}
            <div className="data-table-wrapper">
                <table className="modern-table">
                    <thead>
                        <tr><th>{t('document')}</th><th>{t('service_destinataire')}</th><th>{t('date_envoi')}</th><th>{t('statut')}</th><th>{t('actions')}</th></tr>
                    </thead>
                    <tbody>
                        {transactions.map(tx => (
                            <tr key={tx.id}>
                                <td>{tx.documentSujet}</td>
                                <td>{tx.destinationServiceNom}</td>
                                <td>{new Date(tx.dateEnvoi).toLocaleString()}</td>
                                <td>{tx.statut}</td>
                                <td><button className="btn-secondary" onClick={() => transferAgain(tx.documentId, tx.documentType)}>{t('transferer')}</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
export default TransactionsOutgoing;
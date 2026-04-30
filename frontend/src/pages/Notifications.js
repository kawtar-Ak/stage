import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

function Notifications() {
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState([]);
    const [responseMsg, setResponseMsg] = useState({});
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get('/api/transactions/incoming')
            .then(res => setNotifications(res.data))
            .catch(() => setError(t('erreur_chargement')));
    }, [t]);

    const handleRespond = async (id, accepte) => {
        const message = responseMsg[id] || '';
        try {
            await axios.post(`/api/transactions/${id}/respond`, { accepte, message });
            setNotifications(prev => prev.filter(n => n.id !== id));
            alert(accepte ? t('accepte') : t('refuse'));
        } catch (err) {
            setError(t('erreur_reponse'));
        }
    };

    return (
        <div className="page-container">
            <h1 className="page-title">{t('notifications')}</h1>
            {error && <div className="error-message">{error}</div>}
            {notifications.length === 0 && <p>{t('aucune_notification')}</p>}
            {notifications.map(n => (
                <div key={n.id} className="notification-card" style={{ border: '1px solid #ddd', margin: '1rem', padding: '1rem', borderRadius: '8px' }}>
                    <p><strong>{t('document')} :</strong> {n.documentSujet}</p>
                    <p><strong>{t('de')} :</strong> {n.sourceServiceNom}</p>
                    <p><strong>{t('message')} :</strong> {n.message}</p>
                    <textarea placeholder={t('votre_reponse')} value={responseMsg[n.id] || ''} onChange={e => setResponseMsg({...responseMsg, [n.id]: e.target.value})} rows="2" style={{ width: '100%' }} />
                    <div className="form-actions" style={{ marginTop: '1rem' }}>
                        <button className="btn-primary" onClick={() => handleRespond(n.id, true)}>{t('accepter')}</button>
                        <button className="btn-secondary" onClick={() => handleRespond(n.id, false)}>{t('refuser')}</button>
                    </div>
                </div>
            ))}
        </div>
    );
}
export default Notifications;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

function MesEntites() {
    const { t } = useTranslation();
    const [documents, setDocuments] = useState([]);
    const [services, setServices] = useState([]);
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [transferForm, setTransferForm] = useState({ serviceId: '', userId: '', doitRevenir: false, message: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDocuments();
        axios.get('/api/services').then(res => setServices(res.data));
    }, []);

    const fetchDocuments = async () => {
        try {
            const res = await axios.get('/api/documents');
            setDocuments(res.data);
        } catch (err) {
            setError(t('erreur_chargement'));
        }
    };

    const handleServiceChange = async (serviceId) => {
        setTransferForm({ ...transferForm, serviceId, userId: '' });
        const res = await axios.get(`/api/utilisateurs?serviceId=${serviceId}`);
        setUsers(res.data);
    };

    const handleTransfer = async () => {
        try {
            await axios.post('/api/transactions', {
                documentId: selectedDoc.idEntite,
                documentType: selectedDoc.type,
                destinationServiceId: transferForm.serviceId,
                destinationUserId: transferForm.userId || null,
                doitRevenir: transferForm.doitRevenir,
                message: transferForm.message
            });
            setShowModal(false);
            alert(t('transaction_envoyee'));
            fetchDocuments(); // rafraîchir la liste
        } catch (err) {
            setError(err.response?.data || t('erreur_transaction'));
        }
    };

    const archiverDocument = async (docId) => {
        try {
            await axios.post(`/api/archive/${docId}/archiver`);
            alert('Document archivé avec succès');
            fetchDocuments();
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors de l\'archivage');
        }
    };

    const retirerDocument = async (docId) => {
        const motif = prompt('Motif du retrait:');
        if (!motif) return;
        try {
            await axios.post(`/api/archive/${docId}/retirer`, motif);
            alert('Document retiré avec succès');
            fetchDocuments();
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors du retrait');
        }
    };

    const retournerDocument = async (docId) => {
        // Récupérer l'ID du dernier retrait actif (non retourné)
        try {
            const res = await axios.get(`/api/archive/${docId}/dernier-retrait`);
            const retraitId = res.data.retraitId;
            await axios.post(`/api/archive/retrait/${retraitId}/retourner`);
            alert('Document retourné avec succès');
            fetchDocuments();
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors du retour');
        }
    };

    return (
        <div className="page-container">
            <h1 className="page-title">{t('mes_entites')}</h1>
            {error && <div className="error-message">{error}</div>}
            <div className="data-table-wrapper">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>{t('titre')}</th>
                            <th>{t('type')}</th>
                            <th>{t('date')}</th>
                            <th>{t('source')}</th>
                            <th>{t('destinataire')}</th>
                            <th>{t('etat')}</th>
                            <th>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents.map(doc => (
                            <tr key={doc.idEntite}>
                                <td>{doc.sujet}</td>
                                <td>{doc.type}</td>
                                <td>{new Date(doc.dateCreation).toLocaleString()}</td>
                                <td>{doc.source}</td>
                                <td>{doc.destinataire}</td>
                                <td>
                                    {doc.type === 'Judiciaire' && doc.etatWorkflow}
                                    {doc.type !== 'Judiciaire' && '—'}
                                </td>
                                <td className="action-icons">
                                    <button className="btn-primary" onClick={() => { setSelectedDoc(doc); setShowModal(true); }}>
                                        {t('transferer')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de transfert (inchangé) */}
            {showModal && (
                <>
                    <div className="modal-overlay" onClick={() => setShowModal(false)} />
                    <div className="modal">
                        <h3>{t('transferer')} : {selectedDoc?.sujet}</h3>
                        <div className="form-grid">
                            <div className="form-field">
                                <label>{t('service_destinataire')}</label>
                                <select value={transferForm.serviceId} onChange={e => handleServiceChange(parseInt(e.target.value))}>
                                    <option value="">--</option>
                                    {services.filter(s => s.idService !== selectedDoc?.idService).map(s => <option key={s.idService} value={s.idService}>{s.nomService}</option>)}
                                </select>
                            </div>
                            <div className="form-field">
                                <label>{t('personne')}</label>
                                <select value={transferForm.userId} onChange={e => setTransferForm({...transferForm, userId: parseInt(e.target.value)})}>
                                    <option value="">--</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.nomComplet}</option>)}
                                </select>
                            </div>
                            <div className="form-field">
                                <label><input type="checkbox" checked={transferForm.doitRevenir} onChange={e => setTransferForm({...transferForm, doitRevenir: e.target.checked})} /> {t('doit_revenir')}</label>
                            </div>
                            <div className="form-field">
                                <label>{t('message')}</label>
                                <textarea value={transferForm.message} onChange={e => setTransferForm({...transferForm, message: e.target.value})} rows="2" />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button className="btn-primary" onClick={handleTransfer}>{t('envoyer')}</button>
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>{t('annuler')}</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default MesEntites;
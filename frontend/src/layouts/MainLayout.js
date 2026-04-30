import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

function MainLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('i18nextLng', lng);
  };

  const getMenuItems = () => {
    const serviceName = user?.nomService?.toLowerCase() || '';
    const serviceId = user?.idService;

    // Liens communs (disponibles pour tous les services)
    const commonLinks = [
        { label: 'dashboard', path: '/dashboard' },
        { label: 'Gérer les courriers', path: '/courriers' },
        { label: 'Gérer les dossiers juridiques', path: '/courriers-juridiques' },
        { label: 'Consulter messages et contenus administratifs', path: '/messages-administratifs' },
        { label: 'Consulter acteurs et messageries judiciaires', path: '/acteurs-judiciaires' },
        { label: 'mes_entites', path: '/mes-entites' },
        { label: 'transactions_outgoing', path: '/transactions-outgoing' },
        { label: 'notifications', path: '/notifications' }
    ];

    // Administrateur (service "خلية المعلوميات" ou IdService == 1)
    if (serviceId === 1 || serviceName.includes('خلية المعلوميات')) {
        return [
            ...commonLinks,
            { label: t('equipements'), path: '/equipements' },
            { label: t('services'), path: '/services' },
            { label: t('utilisateurs'), path: '/utilisateurs' },
            { label: t('registre'), path: '/registre' }
        ];
    }
    if ( serviceName.includes('الحفظ') || serviceId === 13) {
        return [ ...commonLinks, { label: t('registre'), path: '/registre' } ];
    }
    if (serviceName.includes('رئيس المصلحة') || serviceId === 5) {
        return [ ...commonLinks, { label: t('registre'), path: '/registre' } ];
    }
    if (serviceName.includes('مكتب الضبط') || serviceId === 2) {
        return [ ...commonLinks, { label: t('registre'), path: '/registre' } ];
    }
    if (serviceName.includes('فتح الملفات') || serviceId === 3) {
        return [ ...commonLinks, { label: t('registre'), path: '/registre' } ];
    }
    // Autres services
    return commonLinks;
};

  const menuItems = getMenuItems();

  return (
    <div className="app-layout">
      <div className="main-content">
        {children}
      </div>
      <div className="sidebar">
        <div className="user-info">
          {user?.nomComplet || user?.login}
        </div>
        {/* Sélecteur de langue */}
        <div className="language-switcher" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', justifyContent: 'center' }}>
          <button onClick={() => changeLanguage('fr')} className="btn-secondary" style={{ fontSize: '0.8rem' }}>🇫🇷 FR</button>
          <button onClick={() => changeLanguage('ar')} className="btn-secondary" style={{ fontSize: '0.8rem' }}>🇸🇦 AR</button>
        </div>
        {menuItems.map((item, idx) => (
          <Link key={idx} to={item.path}>{t(item.label)}</Link>
        ))}
        <hr />
        <button onClick={handleLogout} className="logout-btn">{t('deconnexion')}</button>
      </div>
    </div>
  );
}

export default MainLayout;



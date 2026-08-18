// ==================== ADMIN-CREDITS.JS - MIXMAX MINIMARKET ====================
// Version : Design PRO - Facture/Date/Client en colonnes séparées
// BOUTONS AVEC ICÔNES CORRIGÉS - Font Awesome fonctionnel
// ✅ STATISTIQUES EN HAUT DE PAGE
// ✅ GESTION COMPLÈTE DES CRÉDITS
// Version FINALE

// ========== VARIABLES GLOBALES ==========
window.creditsPeriod = window.creditsPeriod || 'all';
window.creditsSearch = window.creditsSearch || '';
window.creditSelectionMode = false;
window.creditSelectedIds = [];
window.allCreditsData = window.allCreditsData || [];
window.clientsDataForSearch = window.clientsDataForSearch || [];
window.creditsListener = null;

// ========== FONCTIONS UTILITAIRES ==========

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Format date + heure en français
function formatDateHeure(seconds) {
    if (!seconds) return { date: '-', time: '-', full: '-' };
    const d = new Date(seconds * 1000);
    const date = d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const time = d.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    return { date, time, full: date + ' ' + time };
}

function normalize(str) {
    return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function formatCurrency(amount) {
    return amount.toFixed(2) + ' MAD';
}

function getStatusBadge(credit) {
    if (credit.paid || (credit.remainingAmount || 0) <= 0) {
        return '<span class="status-success"><i class="fas fa-check-circle"></i> Payé</span>';
    }
    if (credit.dueDate) {
        var due = credit.dueDate.toDate ? credit.dueDate.toDate() : new Date(credit.dueDate);
        if (due < new Date()) {
            return '<span class="status-danger"><i class="fas fa-exclamation-circle"></i> En retard</span>';
        }
    }
    return '<span class="status-warning"><i class="fas fa-clock"></i> En attente</span>';
}

// ========== STYLES CSS DYNAMIQUES ==========
function injectCreditsStyles() {
    const styleId = 'credits-pro-styles-complete';
    if (document.getElementById(styleId)) return;
    
    const styles = `
        <style id="${styleId}">
            /* === POLICE GLOBALE 22px === */
            #creditsPage,
            #creditsPage * {
                font-size: 22px !important;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }
            
            /* === EXCEPTIONS === */
            #creditsPage .stat-label,
            #creditsPage .filter-group label,
            #creditsPage .total-label {
                font-size: 16px !important;
            }
            
            #creditsPage .btn-add,
            #creditsPage .btn-edit,
            #creditsPage .btn-delete,
            #creditsPage .btn-save,
            #creditsPage .btn-cancel {
                font-size: 18px !important;
            }
            
            #creditsPage .status-success,
            #creditsPage .status-warning,
            #creditsPage .status-danger {
                font-size: 18px !important;
                padding: 6px 16px !important;
                border-radius: 20px !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: 6px !important;
                font-weight: 600 !important;
            }
            
            #creditsPage .status-success {
                background: #dcfce7 !important;
                color: #166534 !important;
            }
            
            #creditsPage .status-warning {
                background: #fef3c7 !important;
                color: #92400e !important;
            }
            
            #creditsPage .status-danger {
                background: #fee2e2 !important;
                color: #991b1b !important;
            }
            
            /* === STATS CARDS === */
            #creditStatsContainer {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
                gap: 12px;
                margin-bottom: 16px;
                padding: 12px 16px;
                background: #f8fafc;
                border-radius: 12px;
                border: 1px solid #e2e8f0;
            }
            
            #creditStatsContainer .stat-card {
                background: #fff;
                padding: 12px 16px;
                border-radius: 10px;
                border-left: 4px solid #2563eb;
                transition: transform 0.2s;
            }
            
            #creditStatsContainer .stat-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            }
            
            #creditStatsContainer .stat-label {
                font-size: 13px;
                color: #64748b;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            #creditStatsContainer .stat-value {
                font-size: 26px;
                font-weight: 800;
                color: #111827;
            }
            
            /* === CHAMP VOCAL === */
            .voice-display-field {
                padding: 8px 12px !important;
                border: 2px solid #16a34a !important;
                border-radius: 8px !important;
                width: 180px !important;
                background: #f0fdf4 !important;
                color: #14532d !important;
                font-weight: 600 !important;
                font-size: 22px !important;
                min-height: 48px !important;
            }
            
            /* === COLONNES SÉPARÉES === */
            .facture-cell {
                display: flex;
                align-items: center;
                gap: 10px;
                font-weight: 800;
                font-size: 22px !important;
                color: var(--text-primary);
                padding: 4px 12px;
                border-radius: 8px;
                border-left: 3px solid var(--accent);
                background: var(--gray-50);
            }
            
            .facture-cell i {
                color: var(--accent);
                font-size: 20px !important;
            }
            
            .facture-cell .facture-number {
                color: var(--black);
                font-weight: 900;
                font-size: 22px !important;
                background: var(--white);
                padding: 0 10px;
                border-radius: 4px;
            }
            
            .date-cell {
                display: flex;
                flex-direction: column;
                gap: 2px;
                padding: 2px 0;
            }
            
            .date-cell .date-line,
            .date-cell .time-line {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 20px !important;
                color: var(--text-secondary);
                font-weight: 500;
            }
            
            .date-cell .date-line i,
            .date-cell .time-line i {
                font-size: 16px !important;
                color: var(--accent);
                opacity: 0.7;
                width: 18px;
            }
            
            .client-cell {
                display: flex;
                align-items: center;
                gap: 10px;
                font-weight: 700;
                font-size: 22px !important;
                color: var(--text-primary);
                background: rgba(20, 184, 166, 0.05);
                padding: 4px 12px;
                border-radius: 8px;
            }
            
            .client-cell i {
                color: var(--accent);
                font-size: 20px !important;
            }
            
            /* === TABLEAU GLOBAL === */
            #creditsPage .data-table {
                font-size: 22px !important;
                border-collapse: separate;
                border-spacing: 0 4px;
                width: 100%;
            }
            
            #creditsPage .data-table thead th {
                font-size: 18px !important;
                padding: 14px 18px !important;
                background: var(--gray-50) !important;
                color: var(--text-secondary) !important;
                font-weight: 700 !important;
                text-transform: uppercase;
                letter-spacing: 0.6px;
                border-bottom: 2px solid var(--border);
                position: sticky;
                top: 0;
                z-index: 2;
                white-space: nowrap;
            }
            
            #creditsPage .data-table thead th i {
                font-size: 16px !important;
                margin-right: 6px;
            }
            
            #creditsPage .data-table tbody td {
                padding: 14px 16px !important;
                font-size: 22px !important;
                vertical-align: middle;
                background: var(--white);
                border-bottom: 1px solid var(--gray-100);
            }
            
            #creditsPage .data-table tbody tr:hover td {
                background: var(--gray-50);
            }
            
            /* === MONTANTS === */
            .amount-total {
                font-weight: 800 !important;
                font-size: 24px !important;
                color: var(--black) !important;
                letter-spacing: -0.3px;
            }
            
            .amount-remaining {
                font-weight: 800 !important;
                font-size: 24px !important;
                color: var(--danger) !important;
                letter-spacing: -0.3px;
            }
            
            .amount-remaining.paid {
                color: #16a34a !important;
            }
            
            /* === BARRE DE RECHERCHE AVEC BOUTON X === */
            .search-bar-pro {
                display: flex;
                align-items: center;
                gap: 6px;
                background: var(--white);
                border: 2px solid var(--border);
                border-radius: 12px;
                padding: 4px 4px 4px 18px;
                transition: var(--transition);
                flex: 1;
                min-width: 220px;
                position: relative;
            }
            
            .search-bar-pro:focus-within {
                border-color: var(--black);
                box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.04);
            }
            
            .search-bar-pro i.fa-search {
                color: var(--text-muted);
                font-size: 20px !important;
            }
            
            .search-bar-pro input {
                flex: 1;
                border: none;
                background: transparent;
                padding: 14px 8px;
                font-size: 22px !important;
                font-family: 'Inter', sans-serif;
                outline: none;
                color: var(--text-primary);
                min-width: 100px;
            }
            
            .search-bar-pro input::placeholder {
                color: var(--text-muted);
                font-weight: 400;
                font-size: 20px !important;
            }
            
            /* === BOUTON X POUR EFFACER === */
            .search-clear-btn {
                width: 35px !important;
                height: 35px !important;
                min-width: 35px !important;
                border-radius: 50% !important;
                border: none !important;
                background: var(--gray-200) !important;
                color: var(--text-secondary) !important;
                font-size: 18px !important;
                cursor: pointer !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                transition: var(--transition) !important;
                padding: 0 !important;
                margin: 0 2px !important;
            }
            
            .search-clear-btn:hover {
                background: var(--gray-300) !important;
                color: var(--black) !important;
                transform: scale(1.05);
            }
            
            .search-clear-btn.hidden {
                display: none !important;
            }
            
            /* === BOUTONS D'ACTION CORRIGÉS - AVEC ICÔNES === */
            #creditsPage .action-buttons {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 6px !important;
                flex-wrap: nowrap !important;
                min-width: 180px !important;
            }
            
            #creditsPage .action-buttons .btn-edit,
            #creditsPage .action-buttons .btn-delete,
            #creditsPage .action-buttons .btn-add {
                width: 44px !important;
                height: 44px !important;
                min-width: 44px !important;
                min-height: 44px !important;
                border-radius: 10px !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 0 !important;
                font-size: 18px !important;
                transition: all 0.2s ease !important;
                border: none !important;
                background: var(--gray-50) !important;
                color: var(--text-secondary) !important;
                cursor: pointer !important;
                flex-shrink: 0 !important;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
            }
            
            /* === ICÔNES DES BOUTONS === */
            #creditsPage .action-buttons .btn-edit i,
            #creditsPage .action-buttons .btn-delete i,
            #creditsPage .action-buttons .btn-add i {
                font-size: 20px !important;
                pointer-events: none !important;
                line-height: 1 !important;
            }
            
            #creditsPage .action-buttons .btn-edit:hover {
                background: var(--gray-200) !important;
                color: var(--black) !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
            }
            
            #creditsPage .action-buttons .btn-delete {
                color: #ef4444 !important;
                background: rgba(239, 68, 68, 0.08) !important;
            }
            
            #creditsPage .action-buttons .btn-delete:hover {
                background: rgba(239, 68, 68, 0.15) !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15) !important;
            }
            
            #creditsPage .action-buttons .btn-add {
                background: var(--black) !important;
                color: var(--white) !important;
            }
            
            #creditsPage .action-buttons .btn-add:hover {
                background: var(--primary-hover) !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
            }
            
            /* === BOUTON PAYER SPÉCIAL === */
            #creditsPage .action-buttons .btn-add.payer-btn {
                background: #10B981 !important;
                color: #fff !important;
                font-size: 14px !important;
                padding: 0 12px !important;
                width: auto !important;
                min-width: 60px !important;
                border-radius: 8px !important;
                gap: 4px !important;
            }
            
            #creditsPage .action-buttons .btn-add.payer-btn:hover {
                background: #059669 !important;
                transform: translateY(-2px) !important;
            }
            
            #creditsPage .action-buttons .btn-add.payer-btn i {
                font-size: 14px !important;
            }
            
            /* === FILTRES === */
            #creditsPage .filters-container {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                align-items: center;
                margin-bottom: 16px;
                padding: 12px 16px;
                background: var(--white);
                border-radius: 12px;
                border: 1px solid var(--border);
            }
            
            #creditsPage .filter-group {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            #creditsPage .filter-group label {
                font-size: 16px !important;
                font-weight: 600;
                color: var(--text-secondary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            #creditsPage .filter-group select {
                padding: 10px 16px;
                border: 2px solid var(--border);
                border-radius: 10px;
                font-size: 20px !important;
                font-family: 'Inter', sans-serif;
                background: var(--white);
                color: var(--text-primary);
                transition: var(--transition);
                min-width: 140px;
            }
            
            #creditsPage .filter-group select:focus {
                border-color: var(--black);
                outline: none;
                box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.04);
            }
            
            /* === BOUTON AJOUTER CRÉDIT === */
            #creditsPage .btn-add-credit {
                background: var(--black) !important;
                color: var(--white) !important;
                padding: 12px 24px !important;
                border-radius: 10px !important;
                border: none !important;
                font-size: 20px !important;
                font-weight: 700 !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: 8px !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
                margin-left: auto !important;
            }
            
            #creditsPage .btn-add-credit:hover {
                background: var(--primary-hover) !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
            }
            
            #creditsPage .btn-add-credit i {
                font-size: 22px !important;
            }
            
            /* === TOTAL EN BAS === */
            #creditsPage .total-row-pro {
                display: flex;
                justify-content: flex-end;
                align-items: center;
                gap: 32px;
                padding: 18px 24px;
                background: #fef2f2;
                border-radius: 14px;
                margin-top: 18px;
                border: 1px solid #fecaca;
                flex-wrap: wrap;
            }
            
            #creditsPage .total-row-pro .total-label {
                font-size: 16px !important;
                font-weight: 700;
                color: var(--text-secondary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            #creditsPage .total-row-pro .total-amount {
                font-size: 28px !important;
                font-weight: 900;
                color: var(--danger);
                letter-spacing: -0.5px;
            }
            
            #creditsPage .total-row-pro .total-amount i {
                color: var(--danger);
                font-size: 22px !important;
                margin-right: 6px;
            }
            
            /* === MODAL === */
            .credits-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                backdrop-filter: blur(4px);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
            }
            
            .credits-modal {
                background: var(--white);
                border-radius: 16px;
                padding: 32px;
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                animation: slideUp 0.3s ease;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            
            .credits-modal h2 {
                font-size: 26px !important;
                font-weight: 800;
                color: var(--black);
                margin-bottom: 24px;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .credits-modal h2 i {
                color: var(--accent);
            }
            
            .credits-modal .form-group {
                margin-bottom: 16px;
            }
            
            .credits-modal .form-group label {
                display: block;
                font-size: 16px !important;
                font-weight: 600;
                color: var(--text-secondary);
                margin-bottom: 6px;
            }
            
            .credits-modal .form-group input,
            .credits-modal .form-group select,
            .credits-modal .form-group textarea {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid var(--border);
                border-radius: 10px;
                font-size: 20px !important;
                font-family: 'Inter', sans-serif;
                transition: var(--transition);
                background: var(--white);
                color: var(--text-primary);
            }
            
            .credits-modal .form-group input:focus,
            .credits-modal .form-group select:focus,
            .credits-modal .form-group textarea:focus {
                border-color: var(--black);
                outline: none;
                box-shadow: 0 0 0 3px rgba(0,0,0,0.04);
            }
            
            .credits-modal .modal-actions {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                margin-top: 24px;
            }
            
            .credits-modal .modal-actions button {
                padding: 12px 24px;
                border-radius: 10px;
                border: none;
                font-size: 18px !important;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .credits-modal .modal-actions .btn-cancel {
                background: var(--gray-100);
                color: var(--text-secondary);
            }
            
            .credits-modal .modal-actions .btn-cancel:hover {
                background: var(--gray-200);
            }
            
            .credits-modal .modal-actions .btn-submit {
                background: var(--black);
                color: var(--white);
            }
            
            .credits-modal .modal-actions .btn-submit:hover {
                background: var(--primary-hover);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            
            /* === RESPONSIVE === */
            @media(max-width:1024px) {
                #creditsPage .action-buttons {
                    min-width: 140px !important;
                    gap: 4px !important;
                }
                
                #creditsPage .action-buttons .btn-edit,
                #creditsPage .action-buttons .btn-delete,
                #creditsPage .action-buttons .btn-add {
                    width: 38px !important;
                    height: 38px !important;
                    min-width: 38px !important;
                    min-height: 38px !important;
                    font-size: 16px !important;
                }
                
                #creditsPage .action-buttons .btn-add.payer-btn {
                    min-width: 50px !important;
                    font-size: 12px !important;
                    padding: 0 10px !important;
                }
                
                #creditStatsContainer {
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)) !important;
                    gap: 10px !important;
                    padding: 10px 12px !important;
                }
                
                #creditStatsContainer .stat-value {
                    font-size: 22px !important;
                }
            }
            
            @media(max-width:768px) {
                #creditsPage .data-table tbody td {
                    font-size: 18px !important;
                    padding: 10px 12px !important;
                }
                
                .facture-cell {
                    font-size: 18px !important;
                    padding: 2px 8px !important;
                }
                
                .facture-cell .facture-number {
                    font-size: 18px !important;
                }
                
                .date-cell .date-line,
                .date-cell .time-line {
                    font-size: 16px !important;
                }
                
                .client-cell {
                    font-size: 18px !important;
                    padding: 2px 8px !important;
                }
                
                .search-bar-pro input {
                    font-size: 18px !important;
                }
                
                .search-clear-btn {
                    width: 32px !important;
                    height: 32px !important;
                    min-width: 32px !important;
                    font-size: 16px !important;
                }
                
                .voice-display-field {
                    font-size: 18px !important;
                    width: 140px !important;
                }
                
                #creditsPage .action-buttons {
                    min-width: 120px !important;
                    gap: 4px !important;
                }
                
                #creditsPage .action-buttons .btn-edit,
                #creditsPage .action-buttons .btn-delete,
                #creditsPage .action-buttons .btn-add {
                    width: 34px !important;
                    height: 34px !important;
                    min-width: 34px !important;
                    min-height: 34px !important;
                    font-size: 14px !important;
                    border-radius: 8px !important;
                }
                
                #creditsPage .action-buttons .btn-edit i,
                #creditsPage .action-buttons .btn-delete i,
                #creditsPage .action-buttons .btn-add i {
                    font-size: 16px !important;
                }
                
                #creditStatsContainer {
                    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)) !important;
                    gap: 8px !important;
                    padding: 8px 10px !important;
                }
                
                #creditStatsContainer .stat-value {
                    font-size: 20px !important;
                }
                
                #creditStatsContainer .stat-label {
                    font-size: 11px !important;
                }
            }
            
            @media(max-width:500px) {
                #creditsPage .data-table tbody td {
                    font-size: 15px !important;
                    padding: 8px 10px !important;
                }
                
                .facture-cell {
                    font-size: 15px !important;
                    padding: 2px 6px !important;
                }
                
                .facture-cell .facture-number {
                    font-size: 15px !important;
                }
                
                .date-cell .date-line,
                .date-cell .time-line {
                    font-size: 13px !important;
                    gap: 4px !important;
                }
                
                .date-cell .date-line i,
                .date-cell .time-line i {
                    font-size: 12px !important;
                    width: 14px !important;
                }
                
                .client-cell {
                    font-size: 15px !important;
                    padding: 2px 6px !important;
                }
                
                .search-bar-pro input {
                    font-size: 15px !important;
                    padding: 10px 6px !important;
                }
                
                .search-clear-btn {
                    width: 28px !important;
                    height: 28px !important;
                    min-width: 28px !important;
                    font-size: 14px !important;
                }
                
                #creditsPage .filter-group select {
                    font-size: 16px !important;
                    padding: 8px 12px !important;
                }
                
                .voice-display-field {
                    font-size: 15px !important;
                    width: 100px !important;
                    padding: 6px 8px !important;
                }
                
                #creditsPage .action-buttons {
                    min-width: 90px !important;
                    gap: 2px !important;
                }
                
                #creditsPage .action-buttons .btn-edit,
                #creditsPage .action-buttons .btn-delete,
                #creditsPage .action-buttons .btn-add {
                    width: 28px !important;
                    height: 28px !important;
                    min-width: 28px !important;
                    min-height: 28px !important;
                    font-size: 12px !important;
                    border-radius: 6px !important;
                }
                
                #creditsPage .action-buttons .btn-add.payer-btn {
                    min-width: 40px !important;
                    font-size: 10px !important;
                    padding: 0 6px !important;
                    height: 28px !important;
                }
                
                #creditsPage .action-buttons .btn-edit i,
                #creditsPage .action-buttons .btn-delete i,
                #creditsPage .action-buttons .btn-add i {
                    font-size: 12px !important;
                }
                
                #creditStatsContainer {
                    grid-template-columns: repeat(3, 1fr) !important;
                    gap: 6px !important;
                    padding: 6px 8px !important;
                }
                
                #creditStatsContainer .stat-value {
                    font-size: 18px !important;
                }
                
                #creditStatsContainer .stat-label {
                    font-size: 10px !important;
                }
            }
            
            /* === ANIMATIONS === */
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(40px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateX(50px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
        </style>
    `;
    document.head.insertAdjacentHTML('beforeend', styles);
}

// ========== STATISTIQUES DES CRÉDITS ==========
function renderCreditStats(data) {
    var statsContainer = document.getElementById('creditStatsContainer');
    if (!statsContainer) {
        statsContainer = document.createElement('div');
        statsContainer.id = 'creditStatsContainer';
        var page = document.getElementById('creditsPage') || document.querySelector('.content-card');
        if (page) {
            page.insertBefore(statsContainer, page.firstChild);
        } else {
            var container = document.getElementById('creditsTableContainer');
            if (container) container.parentNode.insertBefore(statsContainer, container);
        }
    }

    if (!data || data.length === 0) {
        statsContainer.innerHTML = `
            <div style="background:#fff; padding:12px 16px; border-radius:10px; border-left:4px solid #94a3b8; grid-column:1/-1; text-align:center; color:#94a3b8; font-size:18px;">
                <i class="fas fa-inbox" style="font-size:28px; display:block; margin-bottom:8px;"></i>
                Aucune donnée disponible
            </div>
        `;
        return;
    }

    var actifs = data.filter(function(c) { return !c.paid && (c.remainingAmount || 0) > 0; });
    var payes = data.filter(function(c) { return c.paid || (c.remainingAmount || 0) <= 0; });
    var totalRestant = actifs.reduce(function(sum, c) { return sum + (c.remainingAmount || 0); }, 0);
    var totalCredits = data.reduce(function(sum, c) { return sum + (c.total || 0); }, 0);

    var clientDebts = {};
    actifs.forEach(function(c) {
        var name = c.clientName || 'Client inconnu';
        if (!clientDebts[name]) clientDebts[name] = 0;
        clientDebts[name] += (c.remainingAmount || 0);
    });
    var topClient = '';
    var topAmount = 0;
    for (var name in clientDebts) {
        if (clientDebts[name] > topAmount) {
            topAmount = clientDebts[name];
            topClient = name;
        }
    }

    var now = new Date();
    var enRetard = actifs.filter(function(c) {
        if (!c.dueDate) return false;
        var due = c.dueDate.toDate ? c.dueDate.toDate() : new Date(c.dueDate);
        return due < now;
    });

    statsContainer.innerHTML = `
        <div class="stat-card" style="border-left-color: #2563eb;">
            <div class="stat-label">📊 Total</div>
            <div class="stat-value">${data.length}</div>
        </div>
        <div class="stat-card" style="border-left-color: #dc2626;">
            <div class="stat-label">💳 Impayés</div>
            <div class="stat-value" style="color:#dc2626;">${actifs.length}</div>
        </div>
        <div class="stat-card" style="border-left-color: #16a34a;">
            <div class="stat-label">✅ Payés</div>
            <div class="stat-value" style="color:#16a34a;">${payes.length}</div>
        </div>
        <div class="stat-card" style="border-left-color: #8b5cf6;">
            <div class="stat-label">💰 Restant dû</div>
            <div class="stat-value" style="color:#8b5cf6;">${totalRestant.toFixed(2)} MAD</div>
        </div>
        <div class="stat-card" style="border-left-color: #f59e0b;">
            <div class="stat-label">⏰ En retard</div>
            <div class="stat-value" style="color:#f59e0b;">${enRetard.length}</div>
        </div>
        <div class="stat-card" style="border-left-color: #ec4899;">
            <div class="stat-label">🏆 Plus gros crédit</div>
            <div class="stat-value" style="font-size:16px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(topClient)}">
                ${topClient ? escapeHtml(topClient) : '-'}
            </div>
            <div style="font-size:15px; font-weight:600; color:#8b5cf6;">${topAmount.toFixed(2)} MAD</div>
        </div>
    `;
}

// ========== DÉTECTION FILTRE PÉRIODE (pour voice) ==========
function detectPeriodFilterCredits(text) {
    var cleaned = text.toLowerCase().trim();
    if (cleaned.includes("aujourd'hui") || cleaned.includes("aujourd hui") || cleaned.includes("today") || cleaned.includes("ajourdhui") || cleaned.includes("aujourd")) {
        return 'today';
    }
    if (cleaned.includes("ce mois") || cleaned.includes("cemois") || cleaned.includes("mois en cours") || cleaned.includes("ce mois ci") || cleaned.includes("mois")) {
        return 'month';
    }
    if (cleaned.includes("cette semaine") || cleaned.includes("cettesemaine") || cleaned.includes("semaine") || cleaned.includes("7 jours") || cleaned.includes("7j") || cleaned.includes("sept jours")) {
        return 'week';
    }
    if (cleaned.includes("cette année") || cleaned.includes("cetteannee") || cleaned.includes("cette annee") || cleaned.includes("annee") || cleaned.includes("année") || cleaned.includes("1 an") || cleaned.includes("1an")) {
        return 'year';
    }
    if (cleaned.includes("tout") || cleaned.includes("toutes") || cleaned.includes("all") || cleaned.includes("tous") || cleaned.includes("toute les credits") || cleaned.includes("tout les crédits")) {
        return 'all';
    }
    return null;
}

// ========== CHARGER LES CLIENTS POUR LA RECHERCHE ==========
async function loadClientsForSearchCredits() {
    try {
        const snapshot = await db.collection('clients').limit(2000).get();
        window.clientsDataForSearch = [];
        snapshot.forEach(doc => {
            var d = doc.data();
            d.id = doc.id;
            window.clientsDataForSearch.push(d);
        });
        console.log('📋 Clients chargés pour recherche:', window.clientsDataForSearch.length);
    } catch(e) {
        console.warn('Erreur chargement clients:', e);
        window.clientsDataForSearch = [];
    }
}

// ========== FONCTION DE RECHERCHE AVEC DESCRIPTION ==========
function filterCreditsBySearchWithDescription(data, query) {
    if (!query || query.trim() === '') return data;
    
    var q = query.toLowerCase().trim();
    var results = [];
    var clientsMap = {};
    
    window.clientsDataForSearch.forEach(function(c) {
        clientsMap[c.id] = c;
    });
    
    data.forEach(function(credit) {
        var match = false;
        var clientInfo = null;
        
        if (credit.clientName && credit.clientName.toLowerCase().indexOf(q) !== -1) {
            match = true;
        }
        
        if (!match && credit.items) {
            for (var i = 0; i < credit.items.length; i++) {
                if (credit.items[i].nom && credit.items[i].nom.toLowerCase().indexOf(q) !== -1) {
                    match = true;
                    break;
                }
            }
        }
        
        if (!match && credit.clientId && clientsMap[credit.clientId]) {
            var client = clientsMap[credit.clientId];
            var description = client.description || '';
            if (description.toLowerCase().indexOf(q) !== -1) {
                match = true;
                clientInfo = client;
            }
        }
        
        if (!match && credit.clientName && !credit.clientId) {
            for (var id in clientsMap) {
                var c = clientsMap[id];
                var fullName = (c.nom || '') + ' ' + (c.prenom || '');
                if (fullName.trim().toLowerCase() === credit.clientName.toLowerCase()) {
                    var desc = c.description || '';
                    if (desc.toLowerCase().indexOf(q) !== -1) {
                        match = true;
                        clientInfo = c;
                        break;
                    }
                }
            }
        }
        
        if (match) {
            if (clientInfo) {
                credit._clientDisplayName = (clientInfo.nom || '') + ' ' + (clientInfo.prenom || '');
            } else if (credit.clientId && clientsMap[credit.clientId]) {
                var c = clientsMap[credit.clientId];
                credit._clientDisplayName = (c.nom || '') + ' ' + (c.prenom || '');
            } else {
                credit._clientDisplayName = credit.clientName || credit.table || 'Client inconnu';
            }
            results.push(credit);
        }
    });
    
    return results;
}

// Génère l'affichage Facture (colonne séparée)
function renderCreditFactureCell(credit) {
    const factureNum = credit.factureNum || credit.id?.substring(0, 8) || '---';
    return `
        <div class="facture-cell">
            <i class="fas fa-file-invoice"></i>
            <span class="facture-number">#${factureNum}</span>
        </div>
    `;
}

// Génère l'affichage Date/Heure (colonne séparée)
function renderCreditDateCell(credit) {
    const dt = credit.createdAt ? formatDateHeure(credit.createdAt.seconds) : { date: '-', time: '-', full: '-' };
    return `
        <div class="date-cell">
            <div class="date-line">
                <i class="far fa-calendar-alt"></i>
                <span>${dt.date}</span>
            </div>
            <div class="time-line">
                <i class="far fa-clock"></i>
                <span>${dt.time}</span>
            </div>
        </div>
    `;
}

// Génère l'affichage Client (colonne séparée)
function renderCreditClientCell(credit) {
    var clientName = credit._clientDisplayName || credit.clientName || credit.table || 'Client inconnu';
    return `
        <div class="client-cell">
            <i class="fas fa-user-circle"></i>
            <span>${escapeHtml(clientName)}</span>
        </div>
    `;
}

// ========== RENDER TABLEAU DES CRÉDITS ==========
function renderCreditsTable(data, period, searchQuery) {
    var filteredData = [...data];
    
    // Filtrer par période
    if (period && period !== 'all') {
        var now = new Date();
        filteredData = filteredData.filter(function(c) {
            if (!c.createdAt) return false;
            var date = c.createdAt.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
            
            if (period === 'today') {
                return date.toDateString() === now.toDateString();
            } else if (period === 'week') {
                var weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return date >= weekAgo;
            } else if (period === 'month') {
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            } else if (period === 'year') {
                return date.getFullYear() === now.getFullYear();
            }
            return true;
        });
    }
    
    // Filtrer par recherche
    if (searchQuery && searchQuery.trim() !== '') {
        filteredData = filterCreditsBySearchWithDescription(filteredData, searchQuery);
    }
    
    var tableContainer = document.getElementById('creditsTableContainer');
    if (!tableContainer) return;
    
    if (filteredData.length === 0) {
        tableContainer.innerHTML = `
            <div style="text-align:center; padding:60px 20px; color:#64748b; font-size:22px;">
                <i class="fas fa-inbox" style="font-size:48px; display:block; margin-bottom:16px; color:#94a3b8;"></i>
                Aucun crédit trouvé
                <div style="font-size:16px; color:#94a3b8; margin-top:8px;">
                    ${searchQuery ? 'Essayez de modifier votre recherche' : 'Aucun crédit enregistré pour le moment'}
                </div>
            </div>
        `;
        return;
    }
    
    var totalRestant = filteredData.reduce(function(sum, c) {
        return sum + (c.remainingAmount || 0);
    }, 0);
    
    var html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th><i class="fas fa-file-invoice"></i> Facture</th>
                    <th><i class="far fa-calendar-alt"></i> Date / Heure</th>
                    <th><i class="fas fa-user"></i> Client</th>
                    <th><i class="fas fa-shopping-cart"></i> Articles</th>
                    <th><i class="fas fa-coins"></i> Total</th>
                    <th><i class="fas fa-hand-holding-usd"></i> Restant</th>
                    <th><i class="fas fa-circle"></i> Statut</th>
                    <th><i class="fas fa-cog"></i> Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    filteredData.forEach(function(credit) {
        var factureCell = renderCreditFactureCell(credit);
        var dateCell = renderCreditDateCell(credit);
        var clientCell = renderCreditClientCell(credit);
        
        var itemsList = '';
        if (credit.items && credit.items.length > 0) {
            itemsList = credit.items.slice(0, 3).map(function(item) {
                return item.nom || 'Article';
            }).join(', ');
            if (credit.items.length > 3) {
                itemsList += ` +${credit.items.length - 3} autres`;
            }
        } else {
            itemsList = '-';
        }
        
        var statusBadge = getStatusBadge(credit);
        var isPaid = credit.paid || (credit.remainingAmount || 0) <= 0;
        var remainingClass = isPaid ? 'amount-remaining paid' : 'amount-remaining';
        
        html += `
            <tr>
                <td>${factureCell}</td>
                <td>${dateCell}</td>
                <td>${clientCell}</td>
                <td style="font-size:20px; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(itemsList)}</td>
                <td class="amount-total">${(credit.total || 0).toFixed(2)} MAD</td>
                <td class="${remainingClass}">${(credit.remainingAmount || 0).toFixed(2)} MAD</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="editCredit('${credit.id}')" title="Modifier">
                            <i class="fas fa-pen"></i>
                        </button>
                        ${!isPaid ? `
                        <button class="btn-add payer-btn" onclick="payCredit('${credit.id}')" title="Marquer comme payé">
                            <i class="fas fa-check"></i> Pay
                        </button>
                        ` : ''}
                        <button class="btn-delete" onclick="deleteCredit('${credit.id}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
        <div class="total-row-pro">
            <span class="total-label">
                <i class="fas fa-calculator"></i> Total restant dû
            </span>
            <span class="total-amount">
                <i class="fas fa-money-bill-wave"></i> ${totalRestant.toFixed(2)} MAD
            </span>
        </div>
    `;
    
    tableContainer.innerHTML = html;
}

// ========== NOTIFICATIONS ==========
function showNotification(message, type) {
    var colors = {
        success: '#16a34a',
        error: '#dc2626',
        warning: '#f59e0b',
        info: '#2563eb'
    };
    
    var icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    var bgColor = colors[type] || colors.info;
    var icon = icons[type] || icons.info;
    
    var notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${bgColor};
        color: white;
        border-radius: 12px;
        font-size: 18px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        max-width: 400px;
        animation: slideIn 0.3s ease;
        font-family: 'Inter', sans-serif;
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    
    notification.innerHTML = `<i class="fas ${icon}" style="font-size:24px;"></i> ${message}`;
    document.body.appendChild(notification);
    
    setTimeout(function() {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        notification.style.transition = 'all 0.3s ease';
        setTimeout(function() {
            notification.remove();
        }, 300);
    }, 3500);
}

// ========== ACTIONS CRUD ==========

function editCredit(creditId) {
    // Trouver le crédit dans les données
    var credit = window.allCreditsData.find(function(c) { return c.id === creditId; });
    if (!credit) {
        showNotification('Crédit non trouvé', 'error');
        return;
    }
    
    // Ouvrir le modal d'édition
    openCreditModal(credit);
}

function payCredit(creditId) {
    if (!confirm('Confirmer le paiement de ce crédit ?')) return;
    
    showNotification('Traitement en cours...', 'info');
    
    db.collection('credits').doc(creditId).update({
        paid: true,
        remainingAmount: 0,
        paidAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function() {
        showNotification('✅ Crédit payé avec succès !', 'success');
        loadCreditsData(); // Recharger les données
    }).catch(function(error) {
        console.error('Erreur lors du paiement:', error);
        showNotification('❌ Erreur lors du paiement', 'error');
    });
}

function deleteCredit(creditId) {
    if (!confirm('⚠️ Supprimer définitivement ce crédit ? Cette action est irréversible.')) return;
    
    showNotification('Suppression en cours...', 'info');
    
    db.collection('credits').doc(creditId).delete().then(function() {
        showNotification('✅ Crédit supprimé avec succès', 'success');
        loadCreditsData();
    }).catch(function(error) {
        console.error('Erreur lors de la suppression:', error);
        showNotification('❌ Erreur lors de la suppression', 'error');
    });
}

// ========== MODAL CRÉDIT ==========
function openCreditModal(creditData) {
    var isEdit = !!creditData && creditData.id;
    var modalOverlay = document.createElement('div');
    modalOverlay.className = 'credits-modal-overlay';
    modalOverlay.id = 'creditModal';
    
    var clientOptions = '';
    window.clientsDataForSearch.forEach(function(client) {
        var name = (client.nom || '') + ' ' + (client.prenom || '');
        var selected = creditData && creditData.clientId === client.id ? 'selected' : '';
        clientOptions += `<option value="${client.id}" ${selected}>${escapeHtml(name)}</option>`;
    });
    
    var modalHtml = `
        <div class="credits-modal">
            <h2>
                <i class="fas ${isEdit ? 'fa-edit' : 'fa-plus-circle'}"></i>
                ${isEdit ? 'Modifier le crédit' : 'Nouveau crédit'}
            </h2>
            <form id="creditForm">
                <div class="form-group">
                    <label><i class="fas fa-user"></i> Client</label>
                    <select id="creditClient" required>
                        <option value="">Sélectionner un client</option>
                        ${clientOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-file-invoice"></i> Numéro de facture</label>
                    <input type="text" id="creditFactureNum" placeholder="FACT-001" value="${isEdit ? escapeHtml(creditData.factureNum || '') : ''}">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-coins"></i> Montant total</label>
                    <input type="number" id="creditTotal" step="0.01" placeholder="0.00" value="${isEdit ? (creditData.total || 0) : ''}" required>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-hand-holding-usd"></i> Montant payé</label>
                    <input type="number" id="creditPaid" step="0.01" placeholder="0.00" value="${isEdit ? (creditData.paidAmount || 0) : ''}">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-calendar-alt"></i> Date d'échéance</label>
                    <input type="date" id="creditDueDate" value="${isEdit && creditData.dueDate ? (creditData.dueDate.toDate ? creditData.dueDate.toDate().toISOString().split('T')[0] : new Date(creditData.dueDate).toISOString().split('T')[0]) : ''}">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-notes-medical"></i> Notes</label>
                    <textarea id="creditNotes" rows="3" placeholder="Notes supplémentaires...">${isEdit ? escapeHtml(creditData.notes || '') : ''}</textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-cancel" onclick="closeCreditModal()">
                        <i class="fas fa-times"></i> Annuler
                    </button>
                    <button type="submit" class="btn-submit">
                        <i class="fas ${isEdit ? 'fa-save' : 'fa-plus'}"></i> ${isEdit ? 'Mettre à jour' : 'Créer'}
                    </button>
                </div>
            </form>
        </div>
    `;
    
    modalOverlay.innerHTML = modalHtml;
    document.body.appendChild(modalOverlay);
    
    // Gestionnaire du formulaire
    document.getElementById('creditForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveCredit(creditData ? creditData.id : null);
    });
    
    // Fermer le modal en cliquant en dehors
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            closeCreditModal();
        }
    });
}

function closeCreditModal() {
    var modal = document.getElementById('creditModal');
    if (modal) modal.remove();
}

function saveCredit(creditId) {
    var clientId = document.getElementById('creditClient').value;
    var factureNum = document.getElementById('creditFactureNum').value.trim();
    var total = parseFloat(document.getElementById('creditTotal').value) || 0;
    var paidAmount = parseFloat(document.getElementById('creditPaid').value) || 0;
    var dueDate = document.getElementById('creditDueDate').value;
    var notes = document.getElementById('creditNotes').value.trim();
    
    if (!clientId) {
        showNotification('Veuillez sélectionner un client', 'warning');
        return;
    }
    
    if (total <= 0) {
        showNotification('Le montant total doit être supérieur à 0', 'warning');
        return;
    }
    
    var remainingAmount = total - paidAmount;
    var isPaid = remainingAmount <= 0;
    
    // Trouver le client
    var client = window.clientsDataForSearch.find(function(c) { return c.id === clientId; });
    var clientName = client ? ((client.nom || '') + ' ' + (client.prenom || '')).trim() : 'Client inconnu';
    
    var data = {
        clientId: clientId,
        clientName: clientName,
        factureNum: factureNum || 'FACT-' + Date.now().toString().slice(-6),
        total: total,
        paidAmount: paidAmount,
        remainingAmount: remainingAmount,
        paid: isPaid,
        notes: notes,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (dueDate) {
        data.dueDate = new Date(dueDate);
    }
    
    if (!creditId) {
        // Création
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        data.items = [];
        
        showNotification('Création en cours...', 'info');
        
        db.collection('credits').add(data).then(function(docRef) {
            showNotification('✅ Crédit créé avec succès !', 'success');
            closeCreditModal();
            loadCreditsData();
        }).catch(function(error) {
            console.error('Erreur lors de la création:', error);
            showNotification('❌ Erreur lors de la création', 'error');
        });
    } else {
        // Mise à jour
        showNotification('Mise à jour en cours...', 'info');
        
        db.collection('credits').doc(creditId).update(data).then(function() {
            showNotification('✅ Crédit mis à jour avec succès !', 'success');
            closeCreditModal();
            loadCreditsData();
        }).catch(function(error) {
            console.error('Erreur lors de la mise à jour:', error);
            showNotification('❌ Erreur lors de la mise à jour', 'error');
        });
    }
}

// ========== CHARGER LES DONNÉES ==========
function loadCreditsData() {
    showNotification('Chargement des données...', 'info');
    
    db.collection('credits')
        .orderBy('createdAt', 'desc')
        .limit(500)
        .get()
        .then(function(snapshot) {
            window.allCreditsData = [];
            snapshot.forEach(function(doc) {
                var credit = doc.data();
                credit.id = doc.id;
                window.allCreditsData.push(credit);
            });
            
            console.log('📋 Crédits chargés:', window.allCreditsData.length);
            
            renderCreditStats(window.allCreditsData);
            renderCreditsTable(
                window.allCreditsData,
                window.creditsPeriod,
                window.creditsSearch
            );
            
            showNotification('✅ Données chargées avec succès', 'success');
        })
        .catch(function(error) {
            console.error('Erreur lors du chargement des crédits:', error);
            showNotification('❌ Erreur lors du chargement des données', 'error');
        });
}

// ========== CHARGEMENT EN TEMPS RÉEL ==========
function setupRealtimeCredits() {
    if (window.creditsListener) {
        window.creditsListener();
        window.creditsListener = null;
    }
    
    window.creditsListener = db.collection('credits')
        .orderBy('createdAt', 'desc')
        .limit(500)
        .onSnapshot(function(snapshot) {
            var data = [];
            snapshot.forEach(function(doc) {
                var credit = doc.data();
                credit.id = doc.id;
                data.push(credit);
            });
            
            window.allCreditsData = data;
            
            renderCreditStats(window.allCreditsData);
            renderCreditsTable(
                window.allCreditsData,
                window.creditsPeriod,
                window.creditsSearch
            );
            
            console.log('🔄 Crédits mis à jour en temps réel:', data.length);
        }, function(error) {
            console.error('Erreur du listener:', error);
        });
}

// ========== INITIALISATION ==========
function initCreditsPage() {
    // Injecter les styles
    injectCreditsStyles();
    
    // Charger les clients pour la recherche
    loadClientsForSearchCredits().then(function() {
        // Créer l'interface
        createCreditsInterface();
        
        // Configurer les événements
        setupCreditsEvents();
        
        // Charger les données
        loadCreditsData();
        
        // Mettre en place l'écoute en temps réel
        setupRealtimeCredits();
    });
}

function createCreditsInterface() {
    var page = document.getElementById('creditsPage') || document.querySelector('.content-card');
    if (!page) {
        console.warn('❌ Page des crédits non trouvée');
        return;
    }
    
    // Vérifier si l'interface existe déjà
    if (document.getElementById('creditsTableContainer')) return;
    
    // Créer le conteneur des filtres
    var filtersContainer = document.createElement('div');
    filtersContainer.className = 'filters-container';
    filtersContainer.innerHTML = `
        <div class="filter-group">
            <label for="periodFilter"><i class="fas fa-calendar"></i> Période</label>
            <select id="periodFilter">
                <option value="all">📅 Toutes</option>
                <option value="today">📆 Aujourd'hui</option>
                <option value="week">📊 Cette semaine</option>
                <option value="month">📈 Ce mois</option>
                <option value="year">📉 Cette année</option>
            </select>
        </div>
        <div class="search-bar-pro">
            <i class="fas fa-search"></i>
            <input type="text" id="creditsSearchInput" placeholder="🔍 Rechercher un crédit..." value="${escapeHtml(window.creditsSearch)}">
            <button class="search-clear-btn ${window.creditsSearch ? '' : 'hidden'}" id="creditsClearSearch">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <button class="btn-add-credit" id="addCreditBtn">
            <i class="fas fa-plus"></i> Nouveau crédit
        </button>
    `;
    page.appendChild(filtersContainer);
    
    // Créer le conteneur du tableau
    var tableContainer = document.createElement('div');
    tableContainer.id = 'creditsTableContainer';
    tableContainer.style.cssText = 'overflow-x:auto; margin-top:12px;';
    page.appendChild(tableContainer);
}

function setupCreditsEvents() {
    // Filtre de période
    var periodFilter = document.getElementById('periodFilter');
    if (periodFilter) {
        periodFilter.value = window.creditsPeriod || 'all';
        periodFilter.addEventListener('change', function() {
            window.creditsPeriod = this.value;
            renderCreditsTable(
                window.allCreditsData,
                window.creditsPeriod,
                window.creditsSearch
            );
        });
    }
    
    // Recherche
    var searchInput = document.getElementById('creditsSearchInput');
    var clearBtn = document.getElementById('creditsClearSearch');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            window.creditsSearch = this.value;
            if (clearBtn) {
                clearBtn.classList.toggle('hidden', !this.value);
            }
            renderCreditsTable(
                window.allCreditsData,
                window.creditsPeriod,
                window.creditsSearch
            );
        });
        
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                window.creditsSearch = this.value;
                renderCreditsTable(
                    window.allCreditsData,
                    window.creditsPeriod,
                    window.creditsSearch
                );
            }
        });
    }
    
    // Bouton effacer la recherche
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (searchInput) {
                searchInput.value = '';
                window.creditsSearch = '';
                this.classList.add('hidden');
                renderCreditsTable(
                    window.allCreditsData,
                    window.creditsPeriod,
                    window.creditsSearch
                );
                searchInput.focus();
            }
        });
    }
    
    // Bouton ajouter
    var addBtn = document.getElementById('addCreditBtn');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            // Vérifier que les clients sont chargés
            if (window.clientsDataForSearch.length === 0) {
                showNotification('Chargement des clients en cours...', 'info');
                loadClientsForSearchCredits().then(function() {
                    openCreditModal(null);
                });
            } else {
                openCreditModal(null);
            }
        });
    }
}

// ========== EXPORT POUR LES MODULES ==========
// Si vous utilisez des modules ES6, décommentez ceci :
/*
export {
    initCreditsPage,
    loadCreditsData,
    setupRealtimeCredits,
    renderCreditStats,
    renderCreditsTable,
    filterCreditsBySearchWithDescription,
    editCredit,
    payCredit,
    deleteCredit,
    openCreditModal,
    closeCreditModal,
    showNotification,
    formatCurrency,
    getStatusBadge
};
*/

// ========== AUTO-INITIALISATION ==========
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si la page des crédits est présente
    if (document.getElementById('creditsPage') || document.querySelector('.content-card')) {
        setTimeout(function() {
            initCreditsPage();
        }, 100);
    }
});

// ========== UTILITAIRE POUR CONSOLE ==========
console.log('✅ admin-credits.js chargé avec succès');
console.log('📖 Utilisez initCreditsPage() pour initialiser manuellement');

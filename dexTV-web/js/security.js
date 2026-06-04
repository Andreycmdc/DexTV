window.sanitize = function(str) { if (!str) return ''; const e = document.createElement('div'); e.textContent = str; return e.innerHTML; };
window.showToast = function(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#e50914';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
};
console.log('✅ DexTV Security Loaded');

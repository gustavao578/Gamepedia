/**
 * cookies.js - Gerenciador de Cookies
 * Implementação profissional para manipulação de cookies no navegador
 */

const Cookies = {
    /**
     * Define um cookie
     * @param {string} name - Nome do cookie
     * @param {string} value - Valor do cookie
     * @param {number} days - Dias para expirar (opcional)
     */
    set(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        // Garante codificação segura e acesso global (path=/)
        document.cookie = name + "=" + (encodeURIComponent(value) || "") + expires + "; path=/; SameSite=Lax";
    },

    /**
     * Obtém um cookie pelo nome
     * @param {string} name - Nome do cookie
     * @returns {string|null} - Valor do cookie ou null se não existir
     */
    get(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                return decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
        }
        return null;
    },

    /**
     * Deleta um cookie
     * @param {string} name - Nome do cookie
     */
    delete(name) {
        document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
};
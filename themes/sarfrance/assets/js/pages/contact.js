/* Contact page — Leaflet maps + fetch form submission (vanilla) */
(function () {
    'use strict';

    function init() {
        initMaps();
        initForm();
    }

    /* ─── Leaflet Maps ──────────────────────────────────────────────────────── */
    function initMaps() {
        if (!SAR.map.available()) return;

        var parisEl = document.getElementById('map-paris');
        if (parisEl) {
            /* SAR France — 20 rue Bosquet, 75007 Paris */
            SAR.map.create(parisEl, {
                center: [48.8561, 2.3067],
                zoom: 16,
                marker: true,
                popup: parisEl.dataset.popup || '',
                openPopup: true
            });
        }

        var louisvilleEl = document.getElementById('map-louisville');
        if (louisvilleEl) {
            /* NSSAR — 809 W Main St, Louisville, KY */
            SAR.map.create(louisvilleEl, {
                center: [38.2574, -85.7665],
                zoom: 16,
                marker: true,
                popup: louisvilleEl.dataset.popup || '',
                openPopup: true
            });
        }
    }

    /* ─── Contact Form ──────────────────────────────────────────────────────── */
    function initForm() {
        var form = document.getElementById('contact-form');
        if (!form) return;

        var feedback = document.getElementById('form-feedback');
        var submit = document.getElementById('form-submit');
        var pageContent = document.querySelector('.page-content');
        var apiUrl = pageContent ? pageContent.dataset.contactApi : '';

        // Determine home URL based on language (detect /en/ prefix)
        var isEnglish = SAR.isEnglish();
        var homeUrl = SAR.homeUrl();

        /* ─── Cloudflare Turnstile (anti-spam) ──────────────────────────────── */
        var turnstileKey = pageContent ? pageContent.dataset.turnstileKey : '';
        var turnstileWidgetId = null;

        function renderTurnstile() {
            if (!turnstileKey || !document.getElementById('turnstile-container')) return;
            if (typeof window.turnstile === 'undefined') {
                // Script not ready yet — retry shortly.
                window.setTimeout(renderTurnstile, 200);
                return;
            }
            turnstileWidgetId = window.turnstile.render('#turnstile-container', {
                sitekey: String(turnstileKey),
                language: isEnglish ? 'en' : 'fr'
            });
        }
        renderTurnstile();

        function showError(msg) {
            feedback.classList.add('feedback-error');
            feedback.textContent = msg;
        }

        function isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }

        function fieldValue(id) {
            var el = document.getElementById(id);
            return el ? (el.value || '').trim() : '';
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // Clear previous feedback
            feedback.classList.remove('feedback-error', 'feedback-success');
            feedback.textContent = '';

            // Client-side validation
            var nom = fieldValue('nom');
            var prenom = fieldValue('prenom');
            var email = fieldValue('email');
            var objetEl = document.getElementById('objet');
            var objet = objetEl ? objetEl.value : '';
            var message = fieldValue('message');

            if (!nom || !prenom || !email || !objet || !message) {
                showError(isEnglish
                    ? 'Please fill in all required fields.'
                    : 'Veuillez remplir tous les champs obligatoires.');
                return;
            }

            if (!isValidEmail(email)) {
                showError(isEnglish
                    ? 'Please enter a valid email address.'
                    : 'Veuillez saisir une adresse courriel valide.');
                return;
            }

            // Require a Turnstile token before sending (when the widget is enabled).
            var turnstileToken = '';
            if (turnstileKey) {
                if (typeof window.turnstile === 'undefined' || turnstileWidgetId === null) {
                    showError(isEnglish
                        ? 'The anti-spam verification is still loading. Please wait a moment and try again.'
                        : 'La vérification anti-spam est en cours de chargement. Veuillez patienter un instant puis réessayer.');
                    return;
                }
                turnstileToken = window.turnstile.getResponse(turnstileWidgetId) || '';
                if (!turnstileToken) {
                    showError(isEnglish
                        ? 'Please complete the anti-spam verification.'
                        : 'Veuillez valider la vérification anti-spam.');
                    return;
                }
            }

            sendForm({
                nom: nom,
                prenom: prenom,
                email: email,
                objet: objet,
                message: message,
                // Cloudflare Turnstile token — verified server-side via siteverify.
                'cf-turnstile-response': turnstileToken
            });
        });

        function setSubmitting(isSubmitting) {
            submit.disabled = isSubmitting;
            if (isSubmitting) {
                submit.textContent = isEnglish ? 'Sending…' : 'Envoi en cours…';
            } else {
                submit.textContent = isEnglish ? 'Send' : 'Envoyer';
            }
        }

        function resetTurnstile() {
            // Turnstile tokens are single-use — reset so the user can retry.
            if (turnstileWidgetId !== null && typeof window.turnstile !== 'undefined') {
                window.turnstile.reset(turnstileWidgetId);
            }
        }

        async function sendForm(payload) {
            // Disable button during submission
            setSubmitting(true);

            try {
                var res = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    // Redirect to homepage on success
                    window.location.href = homeUrl;
                    return;
                }

                // Error path
                setSubmitting(false);
                resetTurnstile();

                var errorMsg = null;
                try {
                    var body = await res.json();
                    errorMsg = body && body.error;
                } catch (parseErr) {
                    errorMsg = null;
                }

                if (res.status === 429) {
                    showError(errorMsg || (isEnglish
                        ? 'You have already sent a message recently. Please wait 5 minutes.'
                        : 'Vous avez déjà envoyé un message récemment. Veuillez patienter 5 minutes.'));
                } else {
                    showError(errorMsg || (isEnglish
                        ? 'An error occurred. Please try again.'
                        : 'Une erreur est survenue. Veuillez réessayer.'));
                }
            } catch (networkErr) {
                // Network failure / request could not be sent
                setSubmitting(false);
                resetTurnstile();
                showError(isEnglish
                    ? 'An error occurred. Please try again.'
                    : 'Une erreur est survenue. Veuillez réessayer.');
            }
        }
    }

    SAR.onReady(init);
})();

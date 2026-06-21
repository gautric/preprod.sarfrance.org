/* Contact page — Leaflet maps + AJAX form submission */
$(function () {
    /* ─── Leaflet Maps ──────────────────────────────────────────────────────────── */

    var tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var tileAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>';

    /* SAR France — 20 rue Bosquet, 75007 Paris */
    var mapParis = L.map('map-paris').setView([48.8561, 2.3067], 16);
    L.tileLayer(tileUrl, { attribution: tileAttr, maxZoom: 18 }).addTo(mapParis);
    L.marker([48.8561, 2.3067]).addTo(mapParis)
        .bindPopup($('#map-paris').data('popup')).openPopup();

    /* NSSAR — 809 W Main St, Louisville, KY */
    var mapLouisville = L.map('map-louisville').setView([38.2574, -85.7665], 16);
    L.tileLayer(tileUrl, { attribution: tileAttr, maxZoom: 18 }).addTo(mapLouisville);
    L.marker([38.2574, -85.7665]).addTo(mapLouisville)
        .bindPopup($('#map-louisville').data('popup')).openPopup();

    /* ─── Contact Form AJAX Submission ──────────────────────────────────────────── */

    var $form = $('#contact-form');
    if (!$form.length) return;

    var $feedback = $('#form-feedback');
    var $submit = $('#form-submit');
    var apiUrl = $('.page-content').data('contact-api');

    // Determine home URL based on language (detect /en/ prefix)
    var isEnglish = window.location.pathname.indexOf('/en/') === 0;
    var homeUrl = isEnglish ? '/en/' : '/';

    /* ─── Cloudflare Turnstile (anti-spam) ──────────────────────────────────────── */
    var turnstileKey = $('.page-content').data('turnstile-key');
    var turnstileWidgetId = null;

    // Render the widget explicitly once the Turnstile script has loaded.
    function renderTurnstile() {
        if (!turnstileKey || !$('#turnstile-container').length) return;
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

    $form.on('submit', function (e) {
        e.preventDefault();

        // Clear previous feedback
        $feedback.removeClass('feedback-error feedback-success').text('');

        // Client-side validation
        var nom = ($('#nom').val() || '').trim();
        var prenom = ($('#prenom').val() || '').trim();
        var email = ($('#email').val() || '').trim();
        var objet = $('#objet').val();
        var message = ($('#message').val() || '').trim();

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

        // Disable button during submission
        $submit.prop('disabled', true).text(isEnglish ? 'Sending…' : 'Envoi en cours…');

        $.ajax({
            url: apiUrl,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                nom: nom,
                prenom: prenom,
                email: email,
                objet: objet,
                message: message,
                // Cloudflare Turnstile token — verified server-side via siteverify.
                'cf-turnstile-response': turnstileToken
            }),
            success: function () {
                // Redirect to homepage on success
                window.location.href = homeUrl;
            },
            error: function (xhr) {
                $submit.prop('disabled', false).text(isEnglish ? 'Send' : 'Envoyer');

                // Turnstile tokens are single-use — reset so the user can retry.
                if (turnstileWidgetId !== null && typeof window.turnstile !== 'undefined') {
                    window.turnstile.reset(turnstileWidgetId);
                }

                var errorMsg;
                try {
                    var resp = JSON.parse(xhr.responseText);
                    errorMsg = resp.error;
                } catch (e) {
                    errorMsg = null;
                }

                if (xhr.status === 429) {
                    showError(errorMsg || (isEnglish
                        ? 'You have already sent a message recently. Please wait 5 minutes.'
                        : 'Vous avez déjà envoyé un message récemment. Veuillez patienter 5 minutes.'));
                } else {
                    showError(errorMsg || (isEnglish
                        ? 'An error occurred. Please try again.'
                        : 'Une erreur est survenue. Veuillez réessayer.'));
                }
            }
        });
    });

    function showError(msg) {
        $feedback.addClass('feedback-error').text(msg);
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
});

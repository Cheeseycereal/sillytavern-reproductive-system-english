// Safe SillyTavern loader for Reproductive System English
// Loads a visible settings shell first, then starts the full extension core.

const extensionDisplayName = 'Reproductive System';

async function appendSettingsShell() {
    try {
        if (document.getElementById('reproductive-system-settings')) return;

        const settingsUrl = new URL('./settings.html', import.meta.url).href;
        let html = '';
        try {
            html = await window.jQuery.get(settingsUrl);
        } catch (error) {
            console.warn('[Reproductive] Could not load settings.html; using built-in fallback shell.', error);
            html = `
<div id="reproductive-system-settings" class="extension_container reproductive-system-settings">
    <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
            <b>${extensionDisplayName}</b>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
            <p>Loading Reproductive System...</p>
        </div>
    </div>
</div>`;
        }

        const target = window.jQuery('#extensions_settings2');
        if (target.length) {
            target.append(html);
        } else {
            console.warn('[Reproductive] #extensions_settings2 not found yet; settings shell was not appended.');
        }

        window.jQuery(document)
            .off('click.reproShellDrawer', '#reproductive-system-settings .inline-drawer-toggle')
            .on('click.reproShellDrawer', '#reproductive-system-settings .inline-drawer-toggle', function () {
                window.jQuery(this).closest('.inline-drawer').toggleClass('is-open');
                window.jQuery(this).find('.inline-drawer-icon').toggleClass('down up');
            });
    } catch (error) {
        console.error('[Reproductive] Failed to append settings shell:', error);
    }
}

jQuery(async () => {
    await appendSettingsShell();

    try {
        const core = await import('./core.js');
        await core.initReproductiveSystem();
    } catch (error) {
        console.error('[Reproductive] Core failed to load:', error);
        const content = document.querySelector('#reproductive-system-settings .inline-drawer-content');
        if (content) {
            content.innerHTML = `<p style="color:#ff6b6b;"><b>Reproductive System failed to load.</b></p><p>Open DevTools Console and look for <code>[Reproductive] Core failed to load</code>.</p>`;
        }
    }
});

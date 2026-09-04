/* Fase 20A: camada visual. A lógica de autenticação, navegação e dados vive em idz-app.js. */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function closeDrawer() {
    $('#idz20a-drawer')?.classList.remove('open');
    $('#idz20a-backdrop')?.classList.remove('open');
  }

  function openDrawer() {
    $('#idz20a-drawer')?.classList.add('open');
    $('#idz20a-backdrop')?.classList.add('open');
    window.renderNavigation?.();
  }

  function ensureDrawer() {
    if (!$('#idz20a-backdrop')) {
      const backdrop = document.createElement('div');
      backdrop.id = 'idz20a-backdrop';
      backdrop.addEventListener('click', closeDrawer);
      document.body.append(backdrop);
    }
    if (!$('#idz20a-drawer')) {
      const drawer = document.createElement('aside');
      drawer.id = 'idz20a-drawer';
      drawer.setAttribute('aria-label', 'Menu de navegação');
      drawer.innerHTML = `
        <div class="idz20a-drawer-head">
          <img src="assets/logo-idz-oficial-v2.png" alt="Informática do Zero" decoding="async">
          <button type="button" class="idz20a-close" aria-label="Fechar menu"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div id="idz20a-drawer-body"><span class="idz20a-menu-title">CARREGANDO SESSÃO…</span></div>`;
      $('.idz20a-close', drawer).addEventListener('click', closeDrawer);
      document.body.append(drawer);
    }

    $$('.hamburger').forEach((button) => {
      if (button.dataset.idzDrawerBound === 'true') return;
      button.dataset.idzDrawerBound = 'true';
      button.removeAttribute('onclick');
      button.setAttribute('aria-label', 'Abrir menu');
      button.addEventListener('click', (event) => {
        event.preventDefault();
        $('#idz20a-drawer')?.classList.contains('open') ? closeDrawer() : openDrawer();
      });
    });
  }

  function removeLegacyVisualMocks() {
    ['#idz-support-20a', '#idz-refund-20a', '#idz20a-current-lesson', '#idz20a-lock-list', '#idz20a-admin-brief'].forEach((selector) => $(selector)?.remove());
    $$('.idz20a-admin-nav').forEach((node) => node.remove());
    $$('.lms-module-box').forEach((node) => { node.style.display = ''; });
  }

  function optimizeDecoration() {
    document.body.classList.add('idz-20a');
    $('#particles-canvas')?.style.setProperty('pointer-events', 'none');
    $$('.background-orb, .ambient-orb, .decorative, [data-decorative]').forEach((node) => {
      node.style.pointerEvents = 'none';
    });
    $$('img').forEach((image, index) => {
      image.decoding = 'async';
      if (index > 1) image.loading = 'lazy';
    });
  }

  function boot() {
    if (!window.IDZ_AUTH_STATE) window.IDZ_AUTH_STATE = 'AUTH_LOADING';
    removeLegacyVisualMocks();
    optimizeDecoration();
    ensureDrawer();
    window.IDZ_PHASE_20A = { openDrawer, closeDrawer, refreshMenu: () => window.renderNavigation?.() };
    window.renderNavigation?.();
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDrawer();
  });
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot, { once: true }) : boot();
})();

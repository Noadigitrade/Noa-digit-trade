// ============================================================
// NOA DIGIT TRADE - APP.JS FINAL CORRIGÉ
// Supabase Auth + Profiles + Orders + Paiement + Litiges
//
// CORRECTION PRINCIPALE :
// orders.receive_cfa est NOT NULL.
// - Achat  : receive_cfa = 0
// - Vente  : receive_cfa = montant FCFA réellement reçu
// ============================================================

const SUPABASE_URL = 'https://vowafwsvrjpkhkocptih.supabase.co';
const SUPABASE_KEY = 'sb_publishable_umIa4749av8722xus6aQHw_1nf8b-PC';

if (!window.supabase) {
  console.error("Supabase JS n'a pas été chargé.");
}

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const CONFIG = {
  buyRate: 600,
  sellRate: 570,
  minOrder: 2000,
  maxOrder: 50000,

  networks: {
    trc20: {
      name: 'USDT TRC20',
      fee: 2
    },

    bp20: {
      name: 'USDT BEP20',
      fee: 0
    }
  },

  payment: {
    method: 'orange_money',
    number: '74602553',
    displayNumber: '74 60 25 53'
  }
};

let currentUser = null;
let currentProfile = null;
let currentOrder = null;

let currentExchangeType = 'buy';
let currentNetwork = 'trc20';

let applicationInitializing = false;
let authListenerReady = false;


// ============================================================
// UTILITAIRES
// ============================================================

const $ = id => document.getElementById(id);


function showMessage(message, type = 'info') {

  const box = $('appMessage');

  if (!box) return;

  box.textContent = String(message || '');

  box.className = type;

  box.id = 'appMessage';
}


function hideMessage() {

  const box = $('appMessage');

  if (!box) return;

  box.textContent = '';

  box.className = '';
}


function formatNumber(value, max = 0) {

  const n = Number(value);

  return (
    Number.isFinite(n)
      ? n
      : 0
  ).toLocaleString(
    'fr-FR',
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: max
    }
  );
}


function formatDate(value) {

  if (!value) return '-';

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return '-';
  }

  return d.toLocaleString(
    'fr-FR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  );
}


function normalizePhone(phone) {

  return String(phone || '')
    .replace(/\s+/g, '')
    .trim();
}


function escapeHtml(value) {

  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function getSupabaseErrorMessage(error) {

  return (
    error?.message ||
    error?.error_description ||
    error?.details ||
    error?.hint ||
    'Erreur inconnue.'
  );
}


// ============================================================
// NAVIGATION PRINCIPALE
// ============================================================

function showAuthPage() {

  $('authPage')?.classList.add('active');

  $('appPage')?.classList.remove('active');

  $('bottomNav')?.classList.add('hidden');
}


function showAppPage() {

  $('authPage')?.classList.remove('active');

  $('appPage')?.classList.add('active');

  $('bottomNav')?.classList.remove('hidden');
}


function showSubPage(pageId) {

  document
    .querySelectorAll('.sub-page')
    .forEach(page => {

      page.classList.add('hidden');

      page.classList.remove('active');
    });


  const target = $(pageId);

  if (target) {

    target.classList.remove('hidden');

    target.classList.add('active');
  }


  document
    .querySelectorAll('.nav-btn')
    .forEach(button => {

      button.classList.toggle(
        'active',
        button.dataset.page === pageId
      );
    });


  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });


  if (pageId === 'ordersPage') {

    loadOrderHistory();
  }


  if (pageId === 'supportPage') {

    loadDisputes();

    loadOrdersForDispute();
  }
}


// ============================================================
// AUTH FORMULAIRES
// ============================================================

function showLoginForm() {

  $('loginTab')?.classList.add('active');

  $('registerTab')?.classList.remove('active');

  $('loginForm')?.classList.add('active');

  $('registerForm')?.classList.remove('active');
}


function showRegisterForm() {

  $('loginTab')?.classList.remove('active');

  $('registerTab')?.classList.add('active');

  $('loginForm')?.classList.remove('active');

  $('registerForm')?.classList.add('active');
}


// ============================================================
// PROFIL
// ============================================================

async function loadUserProfile() {

  if (!currentUser?.id) {
    return null;
  }


  const metadata =
    currentUser.user_metadata || {};


  const fallback = {

    id:
      currentUser.id,

    full_name:
      metadata.full_name ||
      metadata.name ||
      currentUser.email?.split('@')[0] ||
      'Utilisateur',

    phone:
      metadata.phone || '',

    country:
      metadata.country ||
      'Burkina Faso',

    role:
      'user'
  };


  try {

    const {
      data: profile,
      error
    } =
      await supabaseClient
        .from('profiles')
        .select(
          'id,full_name,phone,country'
        )
        .eq(
          'id',
          currentUser.id
        )
        .maybeSingle();


    if (!error && profile) {

      currentProfile =
        profile;

      updateUserInterface();

      return profile;
    }


    if (!error && !profile) {

      const {
        data: inserted,
        error: insertError
      } =
        await supabaseClient
          .from('profiles')
          .insert({

            id:
              currentUser.id,

            full_name:
              fallback.full_name,

            phone:
              fallback.phone,

            country:
              fallback.country
          })
          .select(
            'id,full_name,phone,country'
          )
          .maybeSingle();


      if (!insertError && inserted) {

        currentProfile =
          inserted;

        updateUserInterface();

        return inserted;
      }


      if (insertError) {

        console.warn(
          'Profil non créé (RLS/trigger possible) :',
          insertError
        );
      }

    } else if (error) {

      console.warn(
        'Profil non lisible, utilisation de Auth :',
        error
      );
    }

  } catch (error) {

    console.warn(
      'Profil non disponible, utilisation de Auth :',
      error
    );
  }


  currentProfile =
    fallback;

  updateUserInterface();

  return currentProfile;
}


function updateUserInterface() {

  if (!currentUser) {
    return;
  }


  const p =
    currentProfile || {};

  const m =
    currentUser.user_metadata || {};


  const name =
    p.full_name ||
    m.full_name ||
    m.name ||
    'Utilisateur';


  const phone =
    p.phone ||
    m.phone ||
    '';


  const country =
    p.country ||
    m.country ||
    'Burkina Faso';


  if ($('userName')) {

    $('userName').textContent =
      name;
  }


  if ($('userCountry')) {

    $('userCountry').textContent =
      '🇧🇫 ' + country;
  }


  if ($('profileName')) {

    $('profileName').value =
      name;
  }


  if ($('profilePhone')) {

    $('profilePhone').value =
      phone;
  }


  if ($('profileCountry')) {

    $('profileCountry').value =
      country;
  }
}


async function initializeApplication() {

  if (applicationInitializing) {
    return;
  }


  applicationInitializing =
    true;


  try {

    await loadUserProfile();

    showAppPage();

    updateUserInterface();

    updateRatesUI();

    updateCalculator();

  } catch (error) {

    console.error(
      'Erreur initialisation :',
      error
    );

    showAppPage();

  } finally {

    applicationInitializing =
      false;
  }
}
// ============================================================
// AUTHENTIFICATION
// ============================================================

async function registerUser(event) {

  event.preventDefault();

  hideMessage();

  const name =
    $('registerName')?.value.trim() || '';

  const phone =
    normalizePhone(
      $('registerPhone')?.value
    );

  const country =
    $('registerCountry')?.value.trim() ||
    'Burkina Faso';

  const email =
    (
      $('registerEmail')?.value.trim() ||
      ''
    ).toLowerCase();

  const password =
    $('registerPassword')?.value || '';

  const confirmPassword =
    $('registerPasswordConfirm')?.value || '';


  if (!name) {

    return showMessage(
      'Veuillez saisir votre nom et prénom.',
      'error'
    );
  }


  if (!phone) {

    return showMessage(
      'Veuillez saisir votre numéro de téléphone.',
      'error'
    );
  }


  if (!email) {

    return showMessage(
      'Veuillez saisir votre adresse email.',
      'error'
    );
  }


  if (password.length < 6) {

    return showMessage(
      'Le mot de passe doit contenir au moins 6 caractères.',
      'error'
    );
  }


  if (password !== confirmPassword) {

    return showMessage(
      'Les deux mots de passe ne correspondent pas.',
      'error'
    );
  }


  const button =
    event.submitter ||
    $('registerForm')
      ?.querySelector(
        'button[type="submit"]'
      );


  const original =
    button?.textContent;


  if (button) {

    button.disabled =
      true;

    button.textContent =
      'Création du compte...';
  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.signUp({

        email,

        password,

        options: {

          data: {

            full_name:
              name,

            phone:
              phone,

            country:
              country
          }
        }
      });


    if (error) {
      throw error;
    }


    if (!data?.user) {

      throw new Error(
        'Le compte n\'a pas pu être créé.'
      );
    }


    currentUser =
      data.user;


    if (data.session) {

      await initializeApplication();

      showMessage(
        'Compte créé avec succès. Bienvenue sur NOA DIGIT TRADE !',
        'success'
      );

    } else {

      showMessage(
        'Compte créé avec succès. Vérifiez votre email puis connectez-vous.',
        'success'
      );

      showLoginForm();


      if ($('loginEmail')) {

        $('loginEmail').value =
          email;
      }
    }


  } catch (error) {

    console.error(
      'Erreur inscription :',
      error
    );


    let message =
      getSupabaseErrorMessage(
        error
      );


    if (
      /already registered|user already registered|already exists/i
        .test(message)
    ) {

      message =
        'Cette adresse email est déjà utilisée.';
    }


    showMessage(
      message,
      'error'
    );


  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        original ||
        'Créer mon compte';
    }
  }
}


// ============================================================
// CONNEXION
// ============================================================

async function loginUser(event) {

  event.preventDefault();

  hideMessage();


  const email =
    (
      $('loginEmail')
        ?.value.trim() ||
      ''
    ).toLowerCase();


  const password =
    $('loginPassword')
      ?.value || '';


  if (!email || !password) {

    return showMessage(
      'Veuillez remplir tous les champs.',
      'error'
    );
  }


  const button =
    event.submitter ||
    $('loginForm')
      ?.querySelector(
        'button[type="submit"]'
      );


  const original =
    button?.textContent;


  if (button) {

    button.disabled =
      true;

    button.textContent =
      'Connexion...';
  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth
        .signInWithPassword({

          email,

          password

        });


    if (error) {
      throw error;
    }


    currentUser =
      data.user;


    await initializeApplication();


    showMessage(
      'Connexion réussie.',
      'success'
    );


  } catch (error) {

    console.error(
      'Erreur connexion :',
      error
    );


    let message =
      getSupabaseErrorMessage(
        error
      );


    if (
      /invalid login credentials/i
        .test(message)
    ) {

      message =
        'Email ou mot de passe incorrect.';
    }


    if (
      /email not confirmed/i
        .test(message)
    ) {

      message =
        'Votre adresse email n\'est pas encore confirmée.';
    }


    showMessage(
      message,
      'error'
    );


  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        original ||
        'Se connecter';
    }
  }
}


// ============================================================
// DÉCONNEXION
// ============================================================

async function logoutUser() {

  try {

    await supabaseClient.auth
      .signOut();

  } catch (error) {

    console.error(
      'Erreur déconnexion :',
      error
    );
  }


  currentUser =
    null;

  currentProfile =
    null;

  currentOrder =
    null;


  showAuthPage();

  showLoginForm();

  hideMessage();
}


// ============================================================
// TARIFS
// ============================================================

function updateRatesUI() {

  if ($('homeBuyRate')) {

    $('homeBuyRate').textContent =
      formatNumber(
        CONFIG.buyRate
      );
  }


  if ($('homeSellRate')) {

    $('homeSellRate').textContent =
      formatNumber(
        CONFIG.sellRate
      );
  }


  if ($('homeMinOrder')) {

    $('homeMinOrder').textContent =
      formatNumber(
        CONFIG.minOrder
      );
  }


  if ($('homeMaxOrder')) {

    $('homeMaxOrder').textContent =
      formatNumber(
        CONFIG.maxOrder
      );
  }


  if ($('homeTrc20Fee')) {

    $('homeTrc20Fee').textContent =
      CONFIG.networks.trc20.fee;
  }


  if ($('homeBp20Fee')) {

    $('homeBp20Fee').textContent =
      CONFIG.networks.bp20.fee;
  }


  if ($('trc20Fee')) {

    $('trc20Fee').textContent =
      CONFIG.networks.trc20.fee;
  }


  if ($('bp20Fee')) {

    $('bp20Fee').textContent =
      CONFIG.networks.bp20.fee;
  }
}


// ============================================================
// MODE ACHAT
// ============================================================

function setBuyMode() {

  currentExchangeType =
    'buy';


  $('buyTab')?.classList.add(
    'active'
  );

  $('sellTab')?.classList.remove(
    'active'
  );


  if ($('amountLabel')) {

    $('amountLabel').textContent =
      'Montant à payer';
  }


  if ($('amountUnit')) {

    $('amountUnit').textContent =
      'FCFA';
  }


  const input =
    $('amountInput');


  if (input) {

    input.placeholder =
      'Minimum : 2 000 FCFA';
  }


  updateCalculator();
}


// ============================================================
// MODE VENTE
// ============================================================

function setSellMode() {

  currentExchangeType =
    'sell';


  $('buyTab')?.classList.remove(
    'active'
  );

  $('sellTab')?.classList.add(
    'active'
  );


  // En vente, le client saisit directement
  // la quantité d'USDT à vendre.

  if ($('amountLabel')) {

    $('amountLabel').textContent =
      'Quantité à vendre';
  }


  if ($('amountUnit')) {

    $('amountUnit').textContent =
      'USDT';
  }


  const input =
    $('amountInput');


  if (input) {

    input.placeholder =
      'Exemple : 10 USDT';
  }


  updateCalculator();
}


// ============================================================
// SÉLECTION DU RÉSEAU
// ============================================================

function selectNetwork(network) {

  if (
    !CONFIG.networks[network]
  ) {
    return;
  }


  currentNetwork =
    network;


  $('trc20Option')
    ?.classList.toggle(
      'active',
      network === 'trc20'
    );


  $('bp20Option')
    ?.classList.toggle(
      'active',
      network === 'bp20'
    );


  updateCalculator();
}


// ============================================================
// CALCUL DE LA TRANSACTION
// ============================================================

function calculateOrder() {

  const amount =
    Number(
      $('amountInput')
        ?.value
    ) || 0;


  const fee =
    CONFIG
      .networks[
        currentNetwork
      ]?.fee || 0;


  // ==========================================================
  // ACHAT
  // ==========================================================

  if (
    currentExchangeType ===
    'buy'
  ) {

    const amountCfa =
      amount;


    const grossUsdt =
      amountCfa /
      CONFIG.buyRate;


    const netUsdt =
      Math.max(
        grossUsdt - fee,
        0
      );


    return {

      side:
        'buy',

      amountCfa:
        amountCfa,

      usdtAmount:
        grossUsdt,

      feeUsdt:
        fee,

      netUsdt:
        netUsdt,

      // IMPORTANT :
      // receive_cfa est NOT NULL dans orders.
      // Pour un achat, cette valeur doit être 0.

      receiveCfa:
        0,

      rate:
        CONFIG.buyRate
    };
  }


  // ==========================================================
  // VENTE
  // ==========================================================

  const usdtAmount =
    amount;


  const netUsdt =
    Math.max(
      usdtAmount - fee,
      0
    );


  const grossCfa =
    usdtAmount *
    CONFIG.sellRate;


  const receiveCfa =
    netUsdt *
    CONFIG.sellRate;


  return {

    side:
      'sell',

    amountCfa:
      grossCfa,

    usdtAmount:
      usdtAmount,

    feeUsdt:
      fee,

    netUsdt:
      netUsdt,

    receiveCfa:
      receiveCfa,

    rate:
      CONFIG.sellRate
  };
}


// ============================================================
// AFFICHAGE DU CALCUL
// ============================================================

function updateCalculator() {

  const c =
    calculateOrder();


  if ($('summaryRate')) {

    $('summaryRate').textContent =
      `${formatNumber(c.rate)} FCFA / USDT`;
  }


  // ==========================================================
  // ACHAT
  // ==========================================================

  if (
    currentExchangeType ===
    'buy'
  ) {

    if ($('summaryCfa')) {

      $('summaryCfa').textContent =
        `${formatNumber(c.amountCfa)} FCFA`;
    }


    if ($('summaryUsdt')) {

      $('summaryUsdt').textContent =
        `${c.usdtAmount.toFixed(6)} USDT`;
    }


    if ($('summaryFee')) {

      $('summaryFee').textContent =
        `${c.feeUsdt} USDT`;
    }


    if ($('summaryResultLabel')) {

      $('summaryResultLabel').textContent =
        'Vous recevez';
    }


    if ($('summaryResult')) {

      $('summaryResult').textContent =
        `${c.netUsdt.toFixed(6)} USDT`;
    }


    return;
  }


  // ==========================================================
  // VENTE
  // ==========================================================

  if ($('summaryCfa')) {

    $('summaryCfa').textContent =
      `${formatNumber(c.receiveCfa)} FCFA`;
  }


  if ($('summaryUsdt')) {

    $('summaryUsdt').textContent =
      `${c.usdtAmount.toFixed(6)} USDT`;
  }


  if ($('summaryFee')) {

    $('summaryFee').textContent =
      `${c.feeUsdt} USDT`;
  }


  if ($('summaryResultLabel')) {

    $('summaryResultLabel').textContent =
      'Vous recevez';
  }


  if ($('summaryResult')) {

    $('summaryResult').textContent =
      `${formatNumber(c.receiveCfa)} FCFA`;
  }
}


// ============================================================
// ADRESSE PORTEFEUILLE
// ============================================================

function getWalletAddress() {

  const ids = [

    'walletAddress',

    'wallet',

    'walletInput',

    'userWallet',

    'wallet_address'

  ];


  for (
    const id of ids
  ) {

    const el =
      $(id);


    if (
      el?.value?.trim()
    ) {

      return el.value.trim();
    }
  }


  return '';
}
// ============================================================
// VÉRIFICATION DE LA COMMANDE
// ============================================================

function reviewOrder() {

  hideMessage();


  if (!currentUser) {

    showMessage(
      'Vous devez être connecté pour passer une commande.',
      'error'
    );

    showAuthPage();

    showLoginForm();

    return;
  }


  const c =
    calculateOrder();


  if (
    !c.usdtAmount ||
    c.usdtAmount <= 0
  ) {

    return showMessage(

      currentExchangeType === 'buy'

        ? 'Veuillez saisir un montant en FCFA.'

        : 'Veuillez saisir la quantité d\'USDT à vendre.',

      'error'
    );
  }


  // ==========================================================
  // ACHAT
  // ==========================================================

  if (
    currentExchangeType === 'buy'
  ) {

    if (
      c.amountCfa <
      CONFIG.minOrder
    ) {

      return showMessage(
        `Le montant minimum est de ${formatNumber(CONFIG.minOrder)} FCFA.`,
        'error'
      );
    }


    if (
      c.amountCfa >
      CONFIG.maxOrder
    ) {

      return showMessage(
        `Le montant maximum est de ${formatNumber(CONFIG.maxOrder)} FCFA.`,
        'error'
      );
    }


    if (
      c.netUsdt <= 0
    ) {

      return showMessage(
        'Le montant USDT après frais est insuffisant.',
        'error'
      );
    }
  }


  // ==========================================================
  // VENTE
  // ==========================================================

  if (
    currentExchangeType === 'sell'
  ) {

    const minimumUsdt =
      CONFIG.minOrder /
      CONFIG.sellRate;


    const maximumUsdt =
      CONFIG.maxOrder /
      CONFIG.sellRate;


    if (
      c.usdtAmount <
      minimumUsdt
    ) {

      return showMessage(
        `La quantité minimum est de ${minimumUsdt.toFixed(2)} USDT.`,
        'error'
      );
    }


    if (
      c.usdtAmount >
      maximumUsdt
    ) {

      return showMessage(
        `La quantité maximum est de ${maximumUsdt.toFixed(2)} USDT.`,
        'error'
      );
    }


    if (
      c.netUsdt <= 0
    ) {

      return showMessage(
        'La quantité d\'USDT après frais est insuffisante.',
        'error'
      );
    }
  }


  const wallet =
    getWalletAddress();


  if (!wallet) {

    return showMessage(
      'Veuillez saisir votre adresse de portefeuille USDT.',
      'error'
    );
  }


  // ==========================================================
  // CONSERVATION TEMPORAIRE DE LA COMMANDE
  // ==========================================================

  currentOrder = {

    side:
      currentExchangeType,

    network:
      currentNetwork,

    amountCfa:
      c.amountCfa,

    usdtAmount:
      c.usdtAmount,

    feeUsdt:
      c.feeUsdt,

    netUsdt:
      c.netUsdt,

    // IMPORTANT :
    // Pour un achat, cette valeur vaut 0.
    // Pour une vente, elle contient le FCFA réellement reçu.

    receiveCfa:
      Number(c.receiveCfa || 0),

    rate:
      c.rate,

    walletAddress:
      wallet,

    paymentMethod:
      currentExchangeType === 'buy'
        ? 'orange_money'
        : null
  };


  renderConfirmation();


  showSubPage(
    'confirmationPage'
  );
}


// ============================================================
// CONFIRMATION DE LA COMMANDE
// ============================================================

function renderConfirmation() {

  const box =
    $('confirmationSummary');


  if (
    !box ||
    !currentOrder
  ) {
    return;
  }


  const networkName =
    CONFIG.networks[
      currentOrder.network
    ]?.name ||
    currentOrder.network ||
    '-';


  // ==========================================================
  // ACHAT
  // ==========================================================

  if (
    currentOrder.side === 'buy'
  ) {

    box.innerHTML = `

      <div class="summary-row">
        <span>Type</span>
        <strong>Achat USDT</strong>
      </div>

      <div class="summary-row">
        <span>Montant à payer</span>
        <strong>
          ${formatNumber(currentOrder.amountCfa)} FCFA
        </strong>
      </div>

      <div class="summary-row">
        <span>Taux</span>
        <strong>
          ${formatNumber(currentOrder.rate)} FCFA / USDT
        </strong>
      </div>

      <div class="summary-row">
        <span>USDT acheté</span>
        <strong>
          ${Number(currentOrder.usdtAmount).toFixed(6)} USDT
        </strong>
      </div>

      <div class="summary-row">
        <span>Frais réseau</span>
        <strong>
          ${Number(currentOrder.feeUsdt)} USDT
        </strong>
      </div>

      <div class="summary-row">
        <span>USDT net reçu</span>
        <strong>
          ${Number(currentOrder.netUsdt).toFixed(6)} USDT
        </strong>
      </div>

      <div class="summary-row">
        <span>Réseau</span>
        <strong>
          ${escapeHtml(networkName)}
        </strong>
      </div>

      <div class="summary-row">
        <span>Portefeuille</span>
        <strong class="break-word">
          ${escapeHtml(currentOrder.walletAddress)}
        </strong>
      </div>

      <div class="summary-row">
        <span>Paiement</span>
        <strong>Orange Money</strong>
      </div>

      <div class="summary-row summary-total">
        <span>Vous recevez</span>
        <strong>
          ${Number(currentOrder.netUsdt).toFixed(6)} USDT
        </strong>
      </div>

    `;

    return;
  }


  // ==========================================================
  // VENTE
  // ==========================================================

  box.innerHTML = `

    <div class="summary-row">
      <span>Type</span>
      <strong>Vente USDT</strong>
    </div>

    <div class="summary-row">
      <span>Quantité vendue</span>
      <strong>
        ${Number(currentOrder.usdtAmount).toFixed(6)} USDT
      </strong>
    </div>

    <div class="summary-row">
      <span>Taux de vente</span>
      <strong>
        ${formatNumber(currentOrder.rate)} FCFA / USDT
      </strong>
    </div>

    <div class="summary-row">
      <span>Frais réseau</span>
      <strong>
        ${Number(currentOrder.feeUsdt)} USDT
      </strong>
    </div>

    <div class="summary-row">
      <span>USDT après frais</span>
      <strong>
        ${Number(currentOrder.netUsdt).toFixed(6)} USDT
      </strong>
    </div>

    <div class="summary-row">
      <span>Réseau</span>
      <strong>
        ${escapeHtml(networkName)}
      </strong>
    </div>

    <div class="summary-row">
      <span>Adresse d'envoi</span>
      <strong class="break-word">
        ${escapeHtml(currentOrder.walletAddress)}
      </strong>
    </div>

    <div class="summary-row">
      <span>Montant brut</span>
      <strong>
        ${formatNumber(
          Number(currentOrder.usdtAmount) *
          Number(currentOrder.rate)
        )} FCFA
      </strong>
    </div>

    <div class="summary-row summary-total">
      <span>Vous recevez</span>
      <strong>
        ${formatNumber(currentOrder.receiveCfa)} FCFA
      </strong>
    </div>

  `;
}


// ============================================================
// ANNULER LA CONFIRMATION
// ============================================================

function cancelReview() {

  currentOrder =
    null;

  showSubPage(
    'exchangePage'
  );
}


// ============================================================
// ENREGISTREMENT DE LA COMMANDE
// ============================================================

async function placeOrder() {

  hideMessage();


  if (!currentUser) {

    showMessage(
      'Votre session a expiré. Veuillez vous reconnecter.',
      'error'
    );

    showAuthPage();

    showLoginForm();

    return;
  }


  if (!currentOrder) {

    return showMessage(
      'Aucune commande à enregistrer.',
      'error'
    );
  }


  const button =
    $('placeOrderBtn');


  const originalText =
    button?.textContent;


  if (button) {

    button.disabled =
      true;

    button.textContent =
      'Enregistrement...';
  }


  try {

    // --------------------------------------------------------
    // VÉRIFICATION DE SESSION
    // --------------------------------------------------------

    const {
      data: sessionData,
      error: sessionError
    } =
      await supabaseClient.auth
        .getSession();


    if (sessionError) {
      throw sessionError;
    }


    if (
      !sessionData?.session?.user
    ) {

      throw new Error(
        'Votre session n\'est plus active.'
      );
    }


    currentUser =
      sessionData.session.user;


    // --------------------------------------------------------
    // NOTE CLIENT
    // --------------------------------------------------------

    const customerNote =
      currentOrder.walletAddress
        ? `Adresse portefeuille : ${currentOrder.walletAddress}`
        : null;


    // --------------------------------------------------------
    // PAYLOAD ORDERS
    // --------------------------------------------------------
    //
    // IMPORTANT :
    // receive_cfa ne doit JAMAIS être null.
    //
    // ACHAT :
    // receive_cfa = 0
    //
    // VENTE :
    // receive_cfa = montant FCFA réellement reçu.
    // --------------------------------------------------------

    const receiveCfa =
      currentOrder.side === 'sell'
        ? Number(
            currentOrder.receiveCfa || 0
          )
        : 0;


    const payload = {

      user_id:
        currentUser.id,

      side:
        currentOrder.side,

      network:
        currentOrder.network,

      payment_method:
        currentOrder.paymentMethod,

      amount_cfa:
        Number(
          currentOrder.amountCfa || 0
        ),

      usdt_amount:
        Number(
          currentOrder.usdtAmount || 0
        ),

      fee_usdt:
        Number(
          currentOrder.feeUsdt || 0
        ),

      net_usdt:
        Number(
          currentOrder.netUsdt || 0
        ),

      receive_cfa:
        receiveCfa,

      status:
        'pending',

      customer_note:
        customerNote
    };


    console.log(
      'Commande envoyée à Supabase :',
      payload
    );


    // --------------------------------------------------------
    // INSERTION SUPABASE
    // --------------------------------------------------------

    const {
      data,
      error
    } =
      await supabaseClient
        .from('orders')
        .insert(
          payload
        )
        .select('*')
        .single();


    if (error) {
      throw error;
    }


    if (!data) {

      throw new Error(
        'Supabase n\'a retourné aucune commande.'
      );
    }


    // --------------------------------------------------------
    // COMMANDE ENREGISTRÉE
    // --------------------------------------------------------

    currentOrder.id =
      data.id;

    currentOrder.createdAt =
      data.created_at;

    currentOrder.status =
      data.status ||
      'pending';


    // ========================================================
    // ACHAT
    // ========================================================

    if (
      currentOrder.side === 'buy'
    ) {

      renderPaymentPage();

      showSubPage(
        'paymentPage'
      );

      showMessage(
        'Commande enregistrée. Effectuez maintenant le paiement Orange Money.',
        'success'
      );

    }


    // ========================================================
    // VENTE
    // ========================================================

    else {

      showSubPage(
        'ordersPage'
      );

      showMessage(
        'Votre demande de vente a été enregistrée. Nous allons la traiter.',
        'success'
      );
    }


    // Actualiser l'historique
    await loadOrderHistory();


  } catch (error) {

    console.error(
      'ERREUR CRÉATION COMMANDE :',
      error
    );


    showMessage(
      'Impossible d\'enregistrer la commande : ' +
      getSupabaseErrorMessage(error),
      'error'
    );


  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        originalText ||
        'Placer la commande';
    }
  }
}
// ============================================================
// PAIEMENT ORANGE MONEY
// ACHAT UNIQUEMENT
// ============================================================

function renderPaymentPage() {

  if (
    !currentOrder ||
    currentOrder.side !== 'buy'
  ) {
    return;
  }


  const amount =
    Number(
      currentOrder.amountCfa
    ) || 0;


  if ($('paymentAmount')) {

    $('paymentAmount').textContent =
      `Montant : ${formatNumber(amount)} FCFA`;
  }


  if ($('paymentNumber')) {

    $('paymentNumber').textContent =
      CONFIG.payment.displayNumber;
  }


  if ($('paymentCode')) {

    $('paymentCode').textContent =
      `*144*10*${CONFIG.payment.number}*${amount}#`;
  }
}


// ============================================================
// DÉCLARATION DU PAIEMENT
// ============================================================

async function declarePayment() {

  hideMessage();


  if (!currentOrder?.id) {

    return showMessage(
      'Commande introuvable.',
      'error'
    );
  }


  if (
    currentOrder.side !== 'buy'
  ) {

    return showMessage(
      'Cette opération ne nécessite pas de paiement Orange Money.',
      'error'
    );
  }


  if (!currentUser?.id) {

    return showMessage(
      'Votre session a expiré. Veuillez vous reconnecter.',
      'error'
    );
  }


  const button =
    $('paymentDoneBtn');


  const originalText =
    button?.textContent;


  if (button) {

    button.disabled =
      true;

    button.textContent =
      'Confirmation...';
  }


  try {

    // --------------------------------------------------------
    // Vérification de la session
    // --------------------------------------------------------

    const {
      data: sessionData,
      error: sessionError
    } =
      await supabaseClient.auth
        .getSession();


    if (sessionError) {
      throw sessionError;
    }


    if (
      !sessionData?.session?.user
    ) {

      throw new Error(
        'Votre session n\'est plus active.'
      );
    }


    currentUser =
      sessionData.session.user;


    // --------------------------------------------------------
    // MISE À JOUR DE LA COMMANDE
    // --------------------------------------------------------

    const {
      data,
      error
    } =
      await supabaseClient
        .from('orders')
        .update({

          status:
            'payment_declared'

        })
        .eq(
          'id',
          currentOrder.id
        )
        .eq(
          'user_id',
          currentUser.id
        )
        .select('*')
        .single();


    if (error) {
      throw error;
    }


    if (!data) {

      throw new Error(
        'La commande n\'a pas pu être mise à jour.'
      );
    }


    currentOrder.status =
      data.status ||
      'payment_declared';


    showMessage(
      'Paiement déclaré. Votre commande est maintenant en attente de vérification.',
      'success'
    );


    await loadOrderHistory();


  } catch (error) {

    console.error(
      'ERREUR DÉCLARATION PAIEMENT :',
      error
    );


    showMessage(
      'Impossible de confirmer le paiement : ' +
      getSupabaseErrorMessage(error),
      'error'
    );


  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        originalText ||
        'J\'ai effectué le paiement';
    }
  }
}


// ============================================================
// HISTORIQUE DES COMMANDES
// ============================================================

async function loadOrderHistory() {

  const list =
    $('ordersList');


  if (!list) {
    return;
  }


  if (!currentUser) {

    list.innerHTML =
      '<div class="small center">Connectez-vous pour voir vos commandes.</div>';

    return;
  }


  list.innerHTML =
    '<div class="small center">Chargement des commandes...</div>';


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from('orders')
        .select('*')
        .eq(
          'user_id',
          currentUser.id
        )
        .order(
          'created_at',
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    if (
      !data ||
      data.length === 0
    ) {

      list.innerHTML =
        '<div class="small center">Vous n\'avez encore aucune commande.</div>';

      return;
    }


    list.innerHTML =
      data
        .map(
          renderOrderCard
        )
        .join('');


  } catch (error) {

    console.error(
      'ERREUR HISTORIQUE :',
      error
    );


    list.innerHTML =
      `<div class="small center">
        Impossible de charger vos commandes.
        <br>
        ${escapeHtml(
          getSupabaseErrorMessage(error)
        )}
      </div>`;
  }
}


// ============================================================
// CARTE HISTORIQUE
// ============================================================

function renderOrderCard(order) {

  const side =
    order.side;


  const type =
    side === 'buy'
      ? 'Achat USDT'
      : 'Vente USDT';


  const status =
    order.status ||
    'pending';


  const statusLabel =
    getStatusLabel(
      status
    );


  const networkName =
    CONFIG.networks[
      order.network
    ]?.name ||
    order.network ||
    '-';


  // ==========================================================
  // ACHAT
  // ==========================================================

  if (
    side === 'buy'
  ) {

    return `

      <div class="order-card">

        <div class="order-header">

          <div class="order-type">
            ${escapeHtml(type)}
          </div>

          <span class="status ${escapeHtml(status)}">
            ${escapeHtml(statusLabel)}
          </span>

        </div>


        <div class="order-row">
          <span>Montant payé</span>
          <strong>
            ${formatNumber(order.amount_cfa)} FCFA
          </strong>
        </div>


        <div class="order-row">
          <span>USDT acheté</span>
          <strong>
            ${Number(
              order.usdt_amount || 0
            ).toFixed(6)} USDT
          </strong>
        </div>


        <div class="order-row">
          <span>Frais</span>
          <strong>
            ${Number(
              order.fee_usdt || 0
            )} USDT
          </strong>
        </div>


        <div class="order-row">
          <span>USDT net reçu</span>
          <strong>
            ${Number(
              order.net_usdt || 0
            ).toFixed(6)} USDT
          </strong>
        </div>


        <div class="order-row">
          <span>Réseau</span>
          <strong>
            ${escapeHtml(networkName)}
          </strong>
        </div>


        <div class="order-row">
          <span>Date</span>
          <strong>
            ${formatDate(order.created_at)}
          </strong>
        </div>

      </div>

    `;
  }


  // ==========================================================
  // VENTE
  // ==========================================================

  return `

    <div class="order-card">

      <div class="order-header">

        <div class="order-type">
          ${escapeHtml(type)}
        </div>

        <span class="status ${escapeHtml(status)}">
          ${escapeHtml(statusLabel)}
        </span>

      </div>


      <div class="order-row">
        <span>USDT vendu</span>
        <strong>
          ${Number(
            order.usdt_amount || 0
          ).toFixed(6)} USDT
        </strong>
      </div>


      <div class="order-row">
        <span>Frais réseau</span>
        <strong>
          ${Number(
            order.fee_usdt || 0
          ).toFixed(6)} USDT
        </strong>
      </div>


      <div class="order-row">
        <span>USDT net</span>
        <strong>
          ${Number(
            order.net_usdt || 0
          ).toFixed(6)} USDT
        </strong>
      </div>


      <div class="order-row">
        <span>Montant reçu</span>
        <strong>
          ${formatNumber(
            order.receive_cfa || 0
          )} FCFA
        </strong>
      </div>


      <div class="order-row">
        <span>Réseau</span>
        <strong>
          ${escapeHtml(networkName)}
        </strong>
      </div>


      <div class="order-row">
        <span>Date</span>
        <strong>
          ${formatDate(order.created_at)}
        </strong>
      </div>

    </div>

  `;
}


// ============================================================
// STATUTS
// ============================================================

function getStatusLabel(status) {

  const labels = {

    pending:
      'En attente',

    payment_declared:
      'Paiement déclaré',

    processing:
      'En traitement',

    completed:
      'Terminée',

    cancelled:
      'Annulée',

    rejected:
      'Refusée'

  };


  return (
    labels[status] ||
    status ||
    'En attente'
  );
}
// ============================================================
// SUPPORT / LITIGES
// ============================================================

async function loadOrdersForDispute() {

  const select =
    $('disputeOrder');

  if (
    !select ||
    !currentUser
  ) {
    return;
  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from('orders')
        .select(
          'id,side,created_at,status'
        )
        .eq(
          'user_id',
          currentUser.id
        )
        .order(
          'created_at',
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    select.innerHTML =
      '<option value="">Sélectionner une commande</option>';


    (data || [])
      .forEach(order => {

        const type =
          order.side === 'buy'
            ? 'Achat'
            : 'Vente';


        const option =
          document.createElement(
            'option'
          );


        option.value =
          order.id;


        option.textContent =
          `${type} - ${formatDate(order.created_at)} - ${getStatusLabel(order.status)}`;


        select.appendChild(
          option
        );
      });


  } catch (error) {

    console.error(
      'Erreur commandes support :',
      error
    );


    select.innerHTML =
      '<option value="">Impossible de charger les commandes</option>';
  }
}


// ============================================================
// ENVOYER UN LITIGE
// ============================================================

async function submitDispute(event) {

  event.preventDefault();

  hideMessage();


  if (!currentUser?.id) {

    return showMessage(
      'Vous devez être connecté.',
      'error'
    );
  }


  const orderId =
    $('disputeOrder')
      ?.value || '';


  const subject =
    $('disputeSubject')
      ?.value
      ?.trim() || '';


  const message =
    $('disputeMessage')
      ?.value
      ?.trim() || '';


  if (!orderId) {

    return showMessage(
      'Veuillez sélectionner une commande.',
      'error'
    );
  }


  if (!subject) {

    return showMessage(
      'Veuillez indiquer le sujet du problème.',
      'error'
    );
  }


  if (!message) {

    return showMessage(
      'Veuillez expliquer votre problème.',
      'error'
    );
  }


  const button =
    event.submitter ||
    $('disputeForm')
      ?.querySelector(
        'button[type="submit"]'
      );


  const originalText =
    button?.textContent;


  if (button) {

    button.disabled =
      true;

    button.textContent =
      'Envoi...';
  }


  try {

    // --------------------------------------------------------
    // Vérifier que la commande appartient bien à l'utilisateur
    // --------------------------------------------------------

    const {
      data: order,
      error: orderError
    } =
      await supabaseClient
        .from('orders')
        .select('id')
        .eq(
          'id',
          orderId
        )
        .eq(
          'user_id',
          currentUser.id
        )
        .maybeSingle();


    if (orderError) {
      throw orderError;
    }


    if (!order) {

      throw new Error(
        'La commande sélectionnée est introuvable.'
      );
    }


    // --------------------------------------------------------
    // Création du litige
    // --------------------------------------------------------

    const payload = {

      user_id:
        currentUser.id,

      order_id:
        orderId,

      subject:
        subject,

      message:
        message,

      status:
        'open'
    };


    const {
      data,
      error
    } =
      await supabaseClient
        .from('disputes')
        .insert(
          payload
        )
        .select('*')
        .single();


    if (error) {
      throw error;
    }


    if (!data) {

      throw new Error(
        'Le litige n\'a pas pu être créé.'
      );
    }


    $('disputeForm')
      ?.reset();


    showMessage(
      'Votre demande a été envoyée à notre équipe.',
      'success'
    );


    await loadDisputes();


  } catch (error) {

    console.error(
      'Erreur création litige :',
      error
    );


    showMessage(
      'Impossible d\'envoyer votre demande : ' +
      getSupabaseErrorMessage(error),
      'error'
    );


  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        originalText ||
        'Envoyer la demande';
    }
  }
}


// ============================================================
// CHARGER LES LITIGES
// ============================================================

async function loadDisputes() {

  const list =
    $('disputesList');


  if (!list) {
    return;
  }


  if (!currentUser?.id) {

    list.innerHTML =
      '<div class="small center">Connectez-vous pour voir vos demandes.</div>';

    return;
  }


  list.innerHTML =
    '<div class="small center">Chargement...</div>';


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from('disputes')
        .select('*')
        .eq(
          'user_id',
          currentUser.id
        )
        .order(
          'created_at',
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    if (
      !data ||
      data.length === 0
    ) {

      list.innerHTML =
        '<div class="small center">Aucune demande pour le moment.</div>';

      return;
    }


    list.innerHTML =
      data
        .map(
          renderDisputeCard
        )
        .join('');


  } catch (error) {

    console.error(
      'Erreur chargement litiges :',
      error
    );


    list.innerHTML =
      `<div class="small center">
        Impossible de charger les demandes.
        <br>
        ${escapeHtml(
          getSupabaseErrorMessage(error)
        )}
      </div>`;
  }
}


// ============================================================
// CARTE LITIGE
// ============================================================

function renderDisputeCard(dispute) {

  const status =
    dispute.status ||
    'open';


  const statusLabel =
    status === 'open'
      ? 'Ouvert'
      : status === 'closed'
        ? 'Fermé'
        : status === 'resolved'
          ? 'Résolu'
          : status;


  return `

    <div class="order-card">

      <div class="order-header">

        <strong>
          ${escapeHtml(
            dispute.subject ||
            'Demande'
          )}
        </strong>

        <span class="status ${escapeHtml(status)}">
          ${escapeHtml(statusLabel)}
        </span>

      </div>


      <p>
        ${escapeHtml(
          dispute.message ||
          ''
        )}
      </p>


      <div class="small">
        ${formatDate(
          dispute.created_at
        )}
      </div>

    </div>

  `;
}


// ============================================================
// SAUVEGARDE DU PROFIL
// ============================================================

async function saveProfile(event) {

  event?.preventDefault();

  hideMessage();


  if (!currentUser?.id) {

    return showMessage(
      'Vous devez être connecté.',
      'error'
    );
  }


  const name =
    $('profileName')
      ?.value
      ?.trim() || '';


  const phone =
    normalizePhone(
      $('profilePhone')
        ?.value
    );


  const country =
    $('profileCountry')
      ?.value
      ?.trim() ||
    'Burkina Faso';


  if (!name) {

    return showMessage(
      'Veuillez saisir votre nom.',
      'error'
    );
  }


  if (!phone) {

    return showMessage(
      'Veuillez saisir votre numéro.',
      'error'
    );
  }


  const button =
    event?.submitter ||
    $('profileForm')
      ?.querySelector(
        'button[type="submit"]'
      );


  const originalText =
    button?.textContent;


  if (button) {

    button.disabled =
      true;

    button.textContent =
      'Enregistrement...';
  }


  try {

    // --------------------------------------------------------
    // Sauvegarde dans profiles
    // --------------------------------------------------------

    const {
      data,
      error
    } =
      await supabaseClient
        .from('profiles')
        .upsert(
          {
            id:
              currentUser.id,

            full_name:
              name,

            phone:
              phone,

            country:
              country
          },
          {
            onConflict:
              'id'
          }
        )
        .select(
          'id,full_name,phone,country'
        )
        .maybeSingle();


    if (error) {
      throw error;
    }


    currentProfile =
      data || {

        id:
          currentUser.id,

        full_name:
          name,

        phone:
          phone,

        country:
          country
      };


    // --------------------------------------------------------
    // Synchronisation avec Auth
    // --------------------------------------------------------

    const {
      error: authError
    } =
      await supabaseClient.auth
        .updateUser({

          data: {

            full_name:
              name,

            phone:
              phone,

            country:
              country

          }

        });


    if (authError) {
      console.warn(
        'Métadonnées Auth non mises à jour :',
        authError
      );
    }


    updateUserInterface();


    showMessage(
      'Profil mis à jour avec succès.',
      'success'
    );


  } catch (error) {

    console.error(
      'Erreur sauvegarde profil :',
      error
    );


    showMessage(
      'Impossible de sauvegarder le profil : ' +
      getSupabaseErrorMessage(error),
      'error'
    );


  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        originalText ||
        'Enregistrer';
    }
  }
}
// ============================================================
// MODIFIER LE MOT DE PASSE
// ============================================================

async function changePassword(event) {

  event?.preventDefault();

  hideMessage();


  if (!currentUser?.id) {

    return showMessage(
      'Vous devez être connecté.',
      'error'
    );
  }


  const password =
    $('newPassword')
      ?.value || '';


  const confirmation =
    $('confirmPassword')
      ?.value || '';


  if (password.length < 6) {

    return showMessage(
      'Le nouveau mot de passe doit contenir au moins 6 caractères.',
      'error'
    );
  }


  if (
    password !==
    confirmation
  ) {

    return showMessage(
      'Les mots de passe ne correspondent pas.',
      'error'
    );
  }


  const button =
    event?.submitter ||
    $('passwordForm')
      ?.querySelector(
        'button[type="submit"]'
      );


  const originalText =
    button?.textContent;


  if (button) {

    button.disabled =
      true;

    button.textContent =
      'Modification...';
  }


  try {

    const {
      error
    } =
      await supabaseClient.auth
        .updateUser({

          password:
            password

        });


    if (error) {
      throw error;
    }


    $('passwordForm')
      ?.reset();


    showMessage(
      'Mot de passe modifié avec succès.',
      'success'
    );


  } catch (error) {

    console.error(
      'Erreur mot de passe :',
      error
    );


    showMessage(
      'Impossible de modifier le mot de passe : ' +
      getSupabaseErrorMessage(error),
      'error'
    );


  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        originalText ||
        'Modifier le mot de passe';
    }
  }
}


// ============================================================
// RAFRAÎCHIR LES DONNÉES UTILISATEUR
// ============================================================

async function refreshCurrentUser() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth
        .getUser();


    if (error) {
      throw error;
    }


    if (data?.user) {

      currentUser =
        data.user;

      await loadUserProfile();

      return currentUser;
    }


    currentUser =
      null;

    currentProfile =
      null;

    return null;


  } catch (error) {

    console.error(
      'Erreur actualisation utilisateur :',
      error
    );

    return null;
  }
}


// ============================================================
// VÉRIFICATION DE SESSION
// ============================================================

async function ensureAuthenticated() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth
        .getSession();


    if (error) {
      throw error;
    }


    const user =
      data?.session?.user ||
      null;


    currentUser =
      user;


    if (!user) {

      currentProfile =
        null;

      return false;
    }


    return true;


  } catch (error) {

    console.error(
      'Erreur vérification session :',
      error
    );


    currentUser =
      null;

    currentProfile =
      null;

    return false;
  }
}


// ============================================================
// RETOUR À L'ACCUEIL
// ============================================================

function goHome() {

  if (!currentUser) {

    showAuthPage();

    showLoginForm();

    return;
  }


  showSubPage(
    'homePage'
  );
}


// ============================================================
// OUVRIR LA PAGE ÉCHANGE
// ============================================================

function openExchange() {

  if (!currentUser) {

    showMessage(
      'Connectez-vous pour effectuer une opération.',
      'error'
    );

    showAuthPage();

    showLoginForm();

    return;
  }


  showSubPage(
    'exchangePage'
  );
}


// ============================================================
// OUVRIR L'HISTORIQUE
// ============================================================

async function openOrdersPage() {

  if (!currentUser) {

    showMessage(
      'Connectez-vous pour consulter vos commandes.',
      'error'
    );

    showAuthPage();

    showLoginForm();

    return;
  }


  showSubPage(
    'ordersPage'
  );


  await loadOrderHistory();
}


// ============================================================
// OUVRIR LE SUPPORT
// ============================================================

async function openSupportPage() {

  if (!currentUser) {

    showMessage(
      'Connectez-vous pour contacter le support.',
      'error'
    );

    showAuthPage();

    showLoginForm();

    return;
  }


  showSubPage(
    'supportPage'
  );


  await Promise.all([
    loadDisputes(),
    loadOrdersForDispute()
  ]);
}


// ============================================================
// RÉINITIALISER LE FORMULAIRE D'ÉCHANGE
// ============================================================

function resetExchangeForm() {

  const input =
    $('amountInput');


  if (input) {

    input.value =
      '';
  }


  document
    .querySelectorAll(
      'input[name="wallet"], input[data-wallet]'
    )
    .forEach(input => {

      if (
        input &&
        input.id !== 'profilePhone'
      ) {

        input.value =
          '';
      }
    });


  currentOrder =
    null;


  setBuyMode();

  selectNetwork(
    'trc20'
  );


  hideMessage();

  updateCalculator();
}


// ============================================================
// INITIALISATION DES ÉVÉNEMENTS
// ============================================================

function setupEvents() {

  // ----------------------------------------------------------
  // FORMULAIRE CONNEXION
  // ----------------------------------------------------------

  $('loginForm')
    ?.addEventListener(
      'submit',
      loginUser
    );


  // ----------------------------------------------------------
  // FORMULAIRE INSCRIPTION
  // ----------------------------------------------------------

  $('registerForm')
    ?.addEventListener(
      'submit',
      registerUser
    );


  // ----------------------------------------------------------
  // DÉCONNEXION
  // ----------------------------------------------------------

  $('logoutBtn')
    ?.addEventListener(
      'click',
      logoutUser
    );


  // ----------------------------------------------------------
  // ONGLETS AUTH
  // ----------------------------------------------------------

  $('loginTab')
    ?.addEventListener(
      'click',
      showLoginForm
    );


  $('registerTab')
    ?.addEventListener(
      'click',
      showRegisterForm
    );


  // ----------------------------------------------------------
  // ACHAT / VENTE
  // ----------------------------------------------------------

  $('buyTab')
    ?.addEventListener(
      'click',
      setBuyMode
    );


  $('sellTab')
    ?.addEventListener(
      'click',
      setSellMode
    );


  // ----------------------------------------------------------
  // RÉSEAUX
  // ----------------------------------------------------------

  $('trc20Option')
    ?.addEventListener(
      'click',
      () => {

        selectNetwork(
          'trc20'
        );

      }
    );


  $('bp20Option')
    ?.addEventListener(
      'click',
      () => {

        selectNetwork(
          'bp20'
        );

      }
    );


  // ----------------------------------------------------------
  // CALCUL AUTOMATIQUE
  // ----------------------------------------------------------

  $('amountInput')
    ?.addEventListener(
      'input',
      updateCalculator
    );


  // ----------------------------------------------------------
  // VALIDATION COMMANDE
  // ----------------------------------------------------------

  $('reviewOrderBtn')
    ?.addEventListener(
      'click',
      reviewOrder
    );


  // ----------------------------------------------------------
  // PLACER COMMANDE
  // ----------------------------------------------------------

  $('placeOrderBtn')
    ?.addEventListener(
      'click',
      placeOrder
    );


  // ----------------------------------------------------------
  // ANNULER CONFIRMATION
  // ----------------------------------------------------------

  $('cancelReviewBtn')
    ?.addEventListener(
      'click',
      cancelReview
    );


  // ----------------------------------------------------------
  // PAIEMENT
  // ----------------------------------------------------------

  $('paymentDoneBtn')
    ?.addEventListener(
      'click',
      declarePayment
    );


  // ----------------------------------------------------------
  // VOIR COMMANDE
  // ----------------------------------------------------------

  $('viewOrderBtn')
    ?.addEventListener(
      'click',
      openOrdersPage
    );


  // ----------------------------------------------------------
  // PROFIL
  // ----------------------------------------------------------

  $('profileForm')
    ?.addEventListener(
      'submit',
      saveProfile
    );


  // ----------------------------------------------------------
  // MOT DE PASSE
  // ----------------------------------------------------------

  $('passwordForm')
    ?.addEventListener(
      'submit',
      changePassword
    );


  // ----------------------------------------------------------
  // SUPPORT / LITIGE
  // ----------------------------------------------------------

  $('disputeForm')
    ?.addEventListener(
      'submit',
      submitDispute
    );


  // ----------------------------------------------------------
  // NAVIGATION BASSE
  // ----------------------------------------------------------

  document
    .querySelectorAll(
      '.nav-btn'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        async () => {

          const page =
            button.dataset.page;


          if (!page) {
            return;
          }


          if (
            page !== 'homePage' &&
            !currentUser
          ) {

            showAuthPage();

            showLoginForm();

            return;
          }


          showSubPage(
            page
          );

        }
      );

    });


  // ----------------------------------------------------------
  // BOUTON COMMENCER
  // ----------------------------------------------------------

  $('startBtn')
    ?.addEventListener(
      'click',
      openExchange
    );


  // ----------------------------------------------------------
  // OUVRIR ÉCHANGE
  // ----------------------------------------------------------

  document
    .querySelectorAll(
      '[data-open-exchange]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        openExchange
      );

    });


  // ----------------------------------------------------------
  // RETOUR ACCUEIL
  // ----------------------------------------------------------

  document
    .querySelectorAll(
      '[data-home]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        goHome
      );

    });


  // ----------------------------------------------------------
  // BOUTONS HISTORIQUE
  // ----------------------------------------------------------

  document
    .querySelectorAll(
      '[data-orders]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        openOrdersPage
      );

    });


  // ----------------------------------------------------------
  // BOUTONS SUPPORT
  // ----------------------------------------------------------

  document
    .querySelectorAll(
      '[data-support]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        openSupportPage
      );

    });


  // ----------------------------------------------------------
  // ANNULER / RETOUR ÉCHANGE
  // ----------------------------------------------------------

  document
    .querySelectorAll(
      '[data-reset-exchange]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        resetExchangeForm
      );

    });
}
// ============================================================
// LISTENER SUPABASE AUTH
// ============================================================

function setupAuthListener() {

  if (authListenerReady) {
    return;
  }


  authListenerReady =
    true;


  supabaseClient.auth
    .onAuthStateChange(
      async (event, session) => {

        console.log(
          'Événement Auth :',
          event
        );


        currentUser =
          session?.user ||
          null;


        // ------------------------------------------------------
        // UTILISATEUR CONNECTÉ
        // ------------------------------------------------------

        if (currentUser) {

          // Évite de bloquer le listener Auth.
          setTimeout(
            async () => {

              try {

                await initializeApplication();

              } catch (error) {

                console.error(
                  'Erreur après changement Auth :',
                  error
                );

                showAppPage();
              }

            },
            0
          );


          return;
        }


        // ------------------------------------------------------
        // UTILISATEUR DÉCONNECTÉ
        // ------------------------------------------------------

        currentProfile =
          null;

        currentOrder =
          null;


        showAuthPage();

        showLoginForm();
      }
    );
}


// ============================================================
// DÉMARRAGE DE L'APPLICATION
// ============================================================

async function boot() {

  try {

    console.log(
      'NOA DIGIT TRADE : démarrage...'
    );


    // --------------------------------------------------------
    // Initialiser les événements
    // --------------------------------------------------------

    setupEvents();


    // --------------------------------------------------------
    // Initialiser Supabase Auth
    // --------------------------------------------------------

    setupAuthListener();


    // --------------------------------------------------------
    // Récupérer la session existante
    // --------------------------------------------------------

    const {
      data,
      error
    } =
      await supabaseClient.auth
        .getSession();


    if (error) {

      console.warn(
        'Erreur récupération session :',
        error
      );
    }


    currentUser =
      data?.session?.user ||
      null;


    // --------------------------------------------------------
    // UTILISATEUR DÉJÀ CONNECTÉ
    // --------------------------------------------------------

    if (currentUser) {

      await initializeApplication();

    }


    // --------------------------------------------------------
    // PAS DE SESSION
    // --------------------------------------------------------

    else {

      showAuthPage();

      showLoginForm();
    }


    // --------------------------------------------------------
    // VALEURS INITIALES DE L'ÉCHANGE
    // --------------------------------------------------------

    setBuyMode();


    selectNetwork(
      'trc20'
    );


    updateRatesUI();


    updateCalculator();


    console.log(
      'NOA DIGIT TRADE : application prête.'
    );


  } catch (error) {

    console.error(
      'ERREUR DÉMARRAGE APPLICATION :',
      error
    );


    showAuthPage();


    showMessage(
      'Impossible de démarrer l\'application : ' +
      getSupabaseErrorMessage(error),
      'error'
    );
  }
}


// ============================================================
// LANCEMENT AUTOMATIQUE
// ============================================================

if (
  document.readyState ===
  'loading'
) {

  document.addEventListener(
    'DOMContentLoaded',
    boot,
    {
      once: true
    }
  );

} else {

  boot();
}
// ============================================================
// SÉCURITÉ ET EXPOSITION DES FONCTIONS
// ============================================================

// Les fonctions principales restent accessibles aux boutons
// déjà présents dans index.html.
//
// On expose uniquement les fonctions nécessaires à l'interface.

window.NOADigitTrade = {

  loginUser,
  registerUser,
  logoutUser,

  setBuyMode,
  setSellMode,

  selectNetwork,

  calculateOrder,
  updateCalculator,

  reviewOrder,
  placeOrder,

  declarePayment,

  loadOrderHistory,

  loadDisputes,
  loadOrdersForDispute,
  submitDispute,

  saveProfile,
  changePassword,

  showLoginForm,
  showRegisterForm,

  showSubPage,

  openExchange,
  openOrdersPage,
  openSupportPage,
  goHome

};


// ============================================================
// PROTECTION CONTRE LES ERREURS NON GÉRÉES
// ============================================================

window.addEventListener(
  'error',
  event => {

    console.error(
      'Erreur JavaScript :',
      event.error ||
      event.message
    );

  }
);


window.addEventListener(
  'unhandledrejection',
  event => {

    console.error(
      'Erreur Promise non gérée :',
      event.reason
    );

  }
);


// ============================================================
// FIN APP.JS
// ============================================================

console.log(
  'NOA DIGIT TRADE - APP.JS chargé avec succès.'
);


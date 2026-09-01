// ============================================================
// NOA DIGIT TRADE - APP.JS FINAL
// Supabase Auth + Profiles + Orders + Paiement + Litiges
// Correction principale : le profil ne bloque plus l'application.
// user_id utilise l'UUID de auth.users, identique à profiles.id.
// ============================================================

const SUPABASE_URL = 'https://vowafwsvrjpkhkocptih.supabase.co';
const SUPABASE_KEY = 'sb_publishable_umIa4749av8722xus6aQHw_1nf8b-PC';

if (!window.supabase) {
  console.error('Supabase JS n\'a pas été chargé.');
}

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const CONFIG = {
  buyRate: 600,
  sellRate: 570,
  minOrder: 2000,
  maxOrder: 50000,
  networks: {
    trc20: { name: 'USDT TRC20', fee: 2 },
    bp20: { name: 'USDT BEP20', fee: 0 }
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
  return (Number.isFinite(n) ? n : 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: max
  });
}

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\s+/g, '').trim();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getSupabaseErrorMessage(error) {
  return error?.message ||
    error?.error_description ||
    error?.details ||
    error?.hint ||
    'Erreur inconnue.';
}

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
  document.querySelectorAll('.sub-page').forEach(p => {
    p.classList.add('hidden');
    p.classList.remove('active');
  });

  const target = $(pageId);

  if (target) {
    target.classList.remove('hidden');
    target.classList.add('active');
  }

  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.page === pageId);
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

// ------------------------------------------------------------
// PROFIL
// ------------------------------------------------------------

async function loadUserProfile() {
  if (!currentUser?.id) return null;

  const metadata = currentUser.user_metadata || {};

  const fallback = {
    id: currentUser.id,
    full_name:
      metadata.full_name ||
      metadata.name ||
      currentUser.email?.split('@')[0] ||
      'Utilisateur',
    phone: metadata.phone || '',
    country: metadata.country || 'Burkina Faso',
    role: 'user'
  };

  try {
    const {
      data: profile,
      error
    } = await supabaseClient
      .from('profiles')
      .select('id,full_name,phone,country')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (!error && profile) {
      currentProfile = profile;
      updateUserInterface();
      return profile;
    }

    if (!error && !profile) {
      const {
        data: inserted,
        error: insertError
      } = await supabaseClient
        .from('profiles')
        .insert({
          id: currentUser.id,
          full_name: fallback.full_name,
          phone: fallback.phone,
          country: fallback.country
        })
        .select('id,full_name,phone,country')
        .maybeSingle();

      if (!insertError && inserted) {
        currentProfile = inserted;
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

  currentProfile = fallback;
  updateUserInterface();

  return currentProfile;
}

function updateUserInterface() {
  if (!currentUser) return;

  const p = currentProfile || {};
  const m = currentUser.user_metadata || {};

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
    $('userName').textContent = name;
  }

  if ($('userCountry')) {
    $('userCountry').textContent =
      '🇧🇫 ' + country;
  }

  if ($('profileName')) {
    $('profileName').value = name;
  }

  if ($('profilePhone')) {
    $('profilePhone').value = phone;
  }

  if ($('profileCountry')) {
    $('profileCountry').value = country;
  }
}

async function initializeApplication() {
  if (applicationInitializing) return;

  applicationInitializing = true;

  try {
    showAppPage();

    updateRatesUI();

    if (!currentUser) {
      const { data } =
        await supabaseClient.auth.getUser();

      currentUser = data?.user || null;
    }

    if (currentUser) {
      await loadUserProfile();
    }

    updateCalculator();

    showSubPage('homePage');

    try {
      await loadOrderHistory();
    } catch (historyError) {
      console.warn(
        'Historique indisponible au démarrage :',
        historyError
      );
    }

  } catch (error) {
    console.error(
      'Erreur initialisation :',
      error
    );

    if (currentUser) {
      showAppPage();
      updateUserInterface();
    } else {
      showAuthPage();
    }

    showMessage(
      'Une partie de l\'application n\'a pas pu être chargée. Vous pouvez continuer.',
      'error'
    );

  } finally {
    applicationInitializing = false;
  }
}

// ------------------------------------------------------------
// AUTH
// ------------------------------------------------------------

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
    $('registerCountry')?.value.trim() || '';

  const email =
    ($('registerEmail')?.value.trim() || '')
      .toLowerCase();

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

  if (country !== 'Burkina Faso') {
    return showMessage(
      'NOA DIGIT TRADE est réservé au Burkina Faso.',
      'error'
    );
  }

  const button =
    event.submitter ||
    $('registerForm')?.querySelector(
      'button[type="submit"]'
    );

  const original =
    button?.textContent;

  if (button) {
    button.disabled = true;
    button.textContent =
      'Création du compte...';
  }

  try {
    const {
      data,
      error
    } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone,
          country
        }
      }
    });

    if (error) throw error;

    if (!data?.user) {
      throw new Error(
        'Le compte Auth n\'a pas pu être créé.'
      );
    }

    currentUser = data.user;

    if (data.session) {
      await loadUserProfile();
      await initializeApplication();

      showMessage(
        'Compte créé avec succès. Bienvenue sur NOA DIGIT TRADE !',
        'success'
      );

    } else {
      showMessage(
        'Compte créé avec succès. Vérifiez votre adresse email puis connectez-vous.',
        'success'
      );

      showLoginForm();

      if ($('loginEmail')) {
        $('loginEmail').value = email;
      }
    }

  } catch (error) {
    let message =
      getSupabaseErrorMessage(error);

    if (
      /already registered|user already registered|already exists/i
        .test(message)
    ) {
      message =
        'Cette adresse email est déjà utilisée.';
    }

    showMessage(message, 'error');

  } finally {
    if (button) {
      button.disabled = false;
      button.textContent =
        original || 'Créer mon compte';
    }
  }
}async function loginUser(event) {
  event.preventDefault();
  hideMessage();

  const email =
    ($('loginEmail')?.value.trim() || '')
      .toLowerCase();

  const password =
    $('loginPassword')?.value || '';

  if (!email || !password) {
    return showMessage(
      'Veuillez remplir tous les champs.',
      'error'
    );
  }

  const button =
    event.submitter ||
    $('loginForm')?.querySelector(
      'button[type="submit"]'
    );

  const original =
    button?.textContent;

  if (button) {
    button.disabled = true;
    button.textContent = 'Connexion...';
  }

  try {
    const {
      data,
      error
    } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    currentUser = data.user;

    await initializeApplication();

    showMessage(
      'Connexion réussie.',
      'success'
    );

  } catch (error) {
    let message =
      getSupabaseErrorMessage(error);

    if (/invalid login credentials/i.test(message)) {
      message =
        'Email ou mot de passe incorrect.';
    }

    if (/email not confirmed/i.test(message)) {
      message =
        'Votre adresse email n\'est pas encore confirmée. Vérifiez votre boîte email.';
    }

    showMessage(message, 'error');

  } finally {
    if (button) {
      button.disabled = false;
      button.textContent =
        original || 'Se connecter';
    }
  }
}

async function logoutUser() {
  try {
    await supabaseClient.auth.signOut();
  } catch (e) {
    console.error(e);
  }

  currentUser = null;
  currentProfile = null;
  currentOrder = null;

  showAuthPage();
  showLoginForm();

  showMessage(
    'Vous êtes déconnecté.',
    'info'
  );
}


// ------------------------------------------------------------
// TARIFS / CALCUL
// ------------------------------------------------------------

function updateRatesUI() {
  if ($('homeBuyRate')) {
    $('homeBuyRate').textContent =
      formatNumber(CONFIG.buyRate);
  }

  if ($('homeSellRate')) {
    $('homeSellRate').textContent =
      formatNumber(CONFIG.sellRate);
  }

  if ($('homeMinOrder')) {
    $('homeMinOrder').textContent =
      formatNumber(CONFIG.minOrder);
  }

  if ($('homeMaxOrder')) {
    $('homeMaxOrder').textContent =
      formatNumber(CONFIG.maxOrder);
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


function setBuyMode() {
  currentExchangeType = 'buy';

  $('buyTab')?.classList.add('active');
  $('sellTab')?.classList.remove('active');

  if ($('amountLabel')) {
    $('amountLabel').textContent =
      'Montant à payer';
  }

  if ($('amountUnit')) {
    $('amountUnit').textContent =
      'FCFA';
  }

  updateCalculator();
}


function setSellMode() {
  currentExchangeType = 'sell';

  $('buyTab')?.classList.remove('active');
  $('sellTab')?.classList.add('active');

  // EN VENTE, LE CLIENT SAISIT LES USDT
  if ($('amountLabel')) {
    $('amountLabel').textContent =
      'Quantité à vendre';
  }

  if ($('amountUnit')) {
    $('amountUnit').textContent =
      'USDT';
  }

  updateCalculator();
}


function selectNetwork(network) {
  if (!CONFIG.networks[network]) return;

  currentNetwork = network;

  $('trc20Option')?.classList.toggle(
    'active',
    network === 'trc20'
  );

  $('bp20Option')?.classList.toggle(
    'active',
    network === 'bp20'
  );

  updateCalculator();
}


// ------------------------------------------------------------
// CALCUL DE LA TRANSACTION
// ------------------------------------------------------------

function calculateOrder() {
  const inputValue =
    Number($('amountInput')?.value) || 0;

  const fee =
    CONFIG.networks[currentNetwork]?.fee || 0;

  // ACHAT
  if (currentExchangeType === 'buy') {
    const fiatAmount = inputValue;

    const grossUsdt =
      fiatAmount / CONFIG.buyRate;

    const netUsdt =
      Math.max(grossUsdt - fee, 0);

    return {
      inputAmount: inputValue,
      fiatAmount,
      grossUsdt,
      netUsdt,
      rate: CONFIG.buyRate,
      fee
    };
  }

  // VENTE
  // Le client saisit directement la quantité d'USDT.
  const usdtAmount = inputValue;

  const netUsdt =
    Math.max(usdtAmount - fee, 0);

  const grossFcfa =
    usdtAmount * CONFIG.sellRate;

  const netFcfa =
    netUsdt * CONFIG.sellRate;

  return {
    inputAmount: inputValue,
    usdtAmount,
    grossFcfa,
    netFcfa,
    rate: CONFIG.sellRate,
    fee
  };
}


function updateCalculator() {
  const c = calculateOrder();

  if (!$('summaryRate')) return;

  if (currentExchangeType === 'buy') {

    if ($('summaryRate')) {
      $('summaryRate').textContent =
        `${formatNumber(c.rate)} FCFA / USDT`;
    }

    if ($('summaryCfa')) {
      $('summaryCfa').textContent =
        `${formatNumber(c.fiatAmount)} FCFA`;
    }

    if ($('summaryUsdt')) {
      $('summaryUsdt').textContent =
        `${c.netUsdt.toFixed(6)} USDT`;
    }

    if ($('summaryFee')) {
      $('summaryFee').textContent =
        `${c.fee} USDT`;
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


  // ----------------------------------------------------------
  // VENTE
  // ----------------------------------------------------------

  if ($('summaryRate')) {
    $('summaryRate').textContent =
      `${formatNumber(c.rate)} FCFA / USDT`;
  }

  if ($('summaryCfa')) {
    $('summaryCfa').textContent =
      `${formatNumber(c.netFcfa)} FCFA`;
  }

  if ($('summaryUsdt')) {
    $('summaryUsdt').textContent =
      `${c.usdtAmount.toFixed(6)} USDT`;
  }

  if ($('summaryFee')) {
    $('summaryFee').textContent =
      `${c.fee} USDT`;
  }

  if ($('summaryResultLabel')) {
    $('summaryResultLabel').textContent =
      'Vous recevez';
  }

  if ($('summaryResult')) {
    $('summaryResult').textContent =
      `${formatNumber(c.netFcfa)} FCFA`;
  }
}


// ------------------------------------------------------------
// PORTEFEUILLE
// ------------------------------------------------------------

function getWalletAddress() {
  for (
    const id of [
      'walletAddress',
      'wallet',
      'walletInput',
      'userWallet',
      'wallet_address'
    ]
  ) {
    const el = $(id);

    if (el?.value?.trim()) {
      return el.value.trim();
    }
  }

  return '';
}


// ------------------------------------------------------------
// VÉRIFICATION AVANT COMMANDE
// ------------------------------------------------------------

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

  const c = calculateOrder();

  if (!c.inputAmount) {
    return showMessage(
      currentExchangeType === 'buy'
        ? 'Veuillez saisir un montant en FCFA.'
        : 'Veuillez saisir la quantité d\'USDT à vendre.',
      'error'
    );
  }


  // ----------------------------------------------------------
  // ACHAT
  // ----------------------------------------------------------

  if (currentExchangeType === 'buy') {

    if (
      c.fiatAmount < CONFIG.minOrder ||
      c.fiatAmount > CONFIG.maxOrder
    ) {
      return showMessage(
        `Le montant doit être compris entre ${formatNumber(CONFIG.minOrder)} et ${formatNumber(CONFIG.maxOrder)} FCFA.`,
        'error'
      );
    }

    if (c.netUsdt <= 0) {
      return showMessage(
        'Le montant USDT après frais est insuffisant.',
        'error'
      );
    }
  }


  // ----------------------------------------------------------
  // VENTE
  // ----------------------------------------------------------

  if (currentExchangeType === 'sell') {

    const minimumUsdt =
      CONFIG.minOrder / CONFIG.sellRate;

    const maximumUsdt =
      CONFIG.maxOrder / CONFIG.sellRate;

    if (
      c.usdtAmount < minimumUsdt ||
      c.usdtAmount > maximumUsdt
    ) {
      return showMessage(
        `La quantité doit être comprise entre ${minimumUsdt.toFixed(2)} et ${maximumUsdt.toFixed(2)} USDT.`,
        'error'
      );
    }

    if (c.netUsdt <= 0) {
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
      currentExchangeType === 'sell'
        ? 'Veuillez saisir l\'adresse du portefeuille depuis lequel vous allez envoyer les USDT.'
        : 'Veuillez saisir votre adresse de portefeuille USDT.',
      'error'
    );
  }


  // ----------------------------------------------------------
  // CRÉATION DE LA COMMANDE TEMPORAIRE
  // ----------------------------------------------------------

  if (currentExchangeType === 'buy') {

    currentOrder = {
      type: 'buy',

      fiat_amount:
        c.fiatAmount,

      crypto_amount:
        c.netUsdt,

      rate:
        c.rate,

      network:
        currentNetwork,

      fee:
        c.fee,

      wallet_address:
        wallet,

      payment_method:
        CONFIG.payment.method,

      result_usdt:
        c.netUsdt,

      status:
        'pending'
    };

  } else {

    currentOrder = {
      type: 'sell',

      fiat_amount:
        c.netFcfa,

      crypto_amount:
        c.usdtAmount,

      rate:
        c.rate,

      network:
        currentNetwork,

      fee:
        c.fee,

      wallet_address:
        wallet,

      payment_method:
        null,

      result_usdt:
        c.netUsdt,

      result_fcfa:
        c.netFcfa,

      status:
        'pending'
    };
  }


  renderConfirmation();

  showSubPage(
    'confirmationPage'
  );
}// ------------------------------------------------------------
// CONFIRMATION DE LA COMMANDE
// ------------------------------------------------------------

function renderConfirmation() {
  const box = $('confirmationSummary');

  if (!box || !currentOrder) return;

  const typeLabel =
    currentOrder.type === 'buy'
      ? 'Achat USDT'
      : 'Vente USDT';

  const networkName =
    CONFIG.networks[currentOrder.network]?.name ||
    currentOrder.network ||
    '-';


  // ----------------------------------------------------------
  // CONFIRMATION ACHAT
  // ----------------------------------------------------------

  if (currentOrder.type === 'buy') {

    box.innerHTML = `
      <div class="summary-row">
        <span>Type</span>
        <strong>
          ${escapeHtml(typeLabel)}
        </strong>
      </div>

      <div class="summary-row">
        <span>Montant payé</span>
        <strong>
          ${formatNumber(currentOrder.fiat_amount)} FCFA
        </strong>
      </div>

      <div class="summary-row">
        <span>Taux</span>
        <strong>
          ${formatNumber(currentOrder.rate)} FCFA / USDT
        </strong>
      </div>

      <div class="summary-row">
        <span>USDT reçu</span>
        <strong>
          ${Number(currentOrder.crypto_amount).toFixed(6)} USDT
        </strong>
      </div>

      <div class="summary-row">
        <span>Réseau</span>
        <strong>
          ${escapeHtml(networkName)}
        </strong>
      </div>

      <div class="summary-row">
        <span>Frais réseau</span>
        <strong>
          ${Number(currentOrder.fee)} USDT
        </strong>
      </div>

      <div class="summary-row">
        <span>Portefeuille</span>
        <strong>
          ${escapeHtml(currentOrder.wallet_address)}
        </strong>
      </div>

      <div class="summary-row">
        <span>Moyen de paiement</span>
        <strong>
          Orange Money
        </strong>
      </div>

      <div class="summary-row summary-total">
        <span>Vous recevez</span>
        <strong>
          ${Number(currentOrder.result_usdt).toFixed(6)} USDT
        </strong>
      </div>
    `;

    return;
  }


  // ----------------------------------------------------------
  // CONFIRMATION VENTE
  // ----------------------------------------------------------

  box.innerHTML = `
    <div class="summary-row">
      <span>Type</span>
      <strong>
        ${escapeHtml(typeLabel)}
      </strong>
    </div>

    <div class="summary-row">
      <span>Quantité vendue</span>
      <strong>
        ${Number(currentOrder.crypto_amount).toFixed(6)} USDT
      </strong>
    </div>

    <div class="summary-row">
      <span>Taux de vente</span>
      <strong>
        ${formatNumber(currentOrder.rate)} FCFA / USDT
      </strong>
    </div>

    <div class="summary-row">
      <span>Réseau</span>
      <strong>
        ${escapeHtml(networkName)}
      </strong>
    </div>

    <div class="summary-row">
      <span>Frais réseau</span>
      <strong>
        ${Number(currentOrder.fee)} USDT
      </strong>
    </div>

    <div class="summary-row">
      <span>USDT après frais</span>
      <strong>
        ${Number(currentOrder.result_usdt).toFixed(6)} USDT
      </strong>
    </div>

    <div class="summary-row">
      <span>Portefeuille d'envoi</span>
      <strong>
        ${escapeHtml(currentOrder.wallet_address)}
      </strong>
    </div>

    <div class="summary-row summary-total">
      <span>Vous recevez</span>
      <strong>
        ${formatNumber(currentOrder.result_fcfa)} FCFA
      </strong>
    </div>
  `;
}


// ------------------------------------------------------------
// ANNULATION DE LA CONFIRMATION
// ------------------------------------------------------------

function cancelReview() {
  currentOrder = null;

  showSubPage(
    'exchangePage'
  );
}


// ------------------------------------------------------------
// COMMANDES
// ------------------------------------------------------------

async function placeOrder() {
  hideMessage();

  if (!currentUser) {
    return showMessage(
      'Votre session a expiré. Veuillez vous reconnecter.',
      'error'
    );
  }

  if (!currentOrder) {
    return showMessage(
      'Aucune commande à enregistrer.',
      'error'
    );
  }

  const button =
    $('placeOrderBtn');

  const original =
    button?.textContent;

  if (button) {
    button.disabled = true;
    button.textContent =
      'Enregistrement...';
  }


  try {

    const {
      data: sessionData,
      error: sessionError
    } = await supabaseClient.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!sessionData?.session?.user) {
      throw new Error(
        'Votre session n\'est plus active.'
      );
    }

    currentUser =
      sessionData.session.user;

    const userId =
      currentUser.id;

    currentOrder.user_id =
      userId;


    // --------------------------------------------------------
    // PAYLOAD ACHAT
    // --------------------------------------------------------

    if (currentOrder.type === 'buy') {

      const payload = {
        user_id:
          userId,

        type:
          'buy',

        fiat_amount:
          currentOrder.fiat_amount,

        crypto_amount:
          currentOrder.crypto_amount,

        rate:
          currentOrder.rate,

        fee:
          currentOrder.fee,

        network:
          currentOrder.network,

        wallet_address:
          currentOrder.wallet_address,

        payment_method:
          'orange_money',

        status:
          'pending'
      };


      const {
        data,
        error
      } = await supabaseClient
        .from('orders')
        .insert(payload)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          'La commande n\'a pas été créée.'
        );
      }

      Object.assign(
        currentOrder,
        {
          id:
            data.id,

          created_at:
            data.created_at,

          status:
            data.status || 'pending'
        }
      );


      // Pour un achat :
      // on continue vers Orange Money.
      renderPaymentPage();

      showSubPage(
        'paymentPage'
      );

      showMessage(
        'Votre commande a été enregistrée.',
        'success'
      );

      await loadOrderHistory();

      return;
    }


    // --------------------------------------------------------
    // PAYLOAD VENTE
    // --------------------------------------------------------

    const sellPayload = {
      user_id:
        userId,

      type:
        'sell',

      // En vente, fiat_amount représente
      // le montant FCFA que le client doit recevoir.
      fiat_amount:
        currentOrder.fiat_amount,

      // Quantité totale d'USDT vendue.
      crypto_amount:
        currentOrder.crypto_amount,

      rate:
        currentOrder.rate,

      fee:
        currentOrder.fee,

      network:
        currentOrder.network,

      wallet_address:
        currentOrder.wallet_address,

      // Pas de paiement Orange Money pour une vente.
      payment_method:
        null,

      status:
        'pending'
    };


    const {
      data: sellData,
      error: sellError
    } = await supabaseClient
      .from('orders')
      .insert(sellPayload)
      .select('*')
      .single();

    if (sellError) {
      throw sellError;
    }

    if (!sellData) {
      throw new Error(
        'La vente n\'a pas été créée.'
      );
    }


    Object.assign(
      currentOrder,
      {
        id:
          sellData.id,

        created_at:
          sellData.created_at,

        status:
          sellData.status || 'pending'
      }
    );


    // --------------------------------------------------------
    // VENTE :
    // PAS D'ÉCRAN ORANGE MONEY.
    // --------------------------------------------------------

    showSubPage(
      'ordersPage'
    );

    showMessage(
      'Votre demande de vente a été enregistrée. Nous allons traiter votre demande.',
      'success'
    );

    await loadOrderHistory();


  } catch (error) {

    console.error(
      'Erreur création commande :',
      error
    );

    showMessage(
      'Impossible d\'enregistrer la commande : ' +
      getSupabaseErrorMessage(error),
      'error'
    );

  } finally {

    if (button) {
      button.disabled = false;

      button.textContent =
        original ||
        'Placer la commande';
    }
  }
}


// ------------------------------------------------------------
// PAIEMENT ORANGE MONEY — ACHAT UNIQUEMENT
// ------------------------------------------------------------

function renderPaymentPage() {
  if (!currentOrder) return;

  // Une vente ne doit jamais afficher Orange Money.
  if (currentOrder.type !== 'buy') {
    return;
  }

  const amount =
    Number(currentOrder.fiat_amount) || 0;

  if ($('paymentAmount')) {
    $('paymentAmount').textContent =
      `Montant : ${formatNumber(amount)} FCFA`;
  }

  if ($('paymentCode')) {
    $('paymentCode').textContent =
      `*144*10*${CONFIG.payment.number}*${amount}#`;
  }

  if ($('paymentNumber')) {
    $('paymentNumber').textContent =
      CONFIG.payment.displayNumber;
  }
}


// ------------------------------------------------------------
// DÉCLARER LE PAIEMENT
// ------------------------------------------------------------

async function declarePayment() {
  hideMessage();

  if (!currentOrder?.id) {
    return showMessage(
      'Commande introuvable.',
      'error'
    );
  }

  // Une vente n'a pas de paiement Orange Money
  // à déclarer par le client.
  if (currentOrder.type !== 'buy') {
    return showMessage(
      'Cette opération ne nécessite pas de paiement Orange Money.',
      'info'
    );
  }

  const button =
    $('paymentDoneBtn');

  const original =
    button?.textContent;

  if (button) {
    button.disabled = true;
    button.textContent =
      'Confirmation...';
  }


  try {

    const {
      data: sessionData,
      error: sessionError
    } = await supabaseClient.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!sessionData?.session) {
      throw new Error(
        'Votre session a expiré.'
      );
    }

    const {
      data,
      error
    } = await supabaseClient.rpc(
      'declare_order_payment',
      {
        p_order_id:
          currentOrder.id
      }
    );

    if (error) {
      throw error;
    }

    if (data?.status) {
      currentOrder.status =
        data.status;
    }

    showMessage(
      'Paiement déclaré. Votre commande est maintenant en attente de vérification.',
      'success'
    );

    await loadOrderHistory();

  } catch (error) {

    console.error(
      'Erreur déclaration paiement :',
      error
    );

    showMessage(
      'Impossible de confirmer le paiement : ' +
      getSupabaseErrorMessage(error),
      'error'
    );

  } finally {

    if (button) {
      button.disabled = false;

      button.textContent =
        original ||
        'J\'ai effectué le paiement';
    }
  }
}


function viewCurrentOrder() {
  showSubPage(
    'ordersPage'
  );
}


// ------------------------------------------------------------
// HISTORIQUE DES COMMANDES
// ------------------------------------------------------------

async function loadOrderHistory() {
  const list =
    $('ordersList');

  if (!list) return;

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
    } = await supabaseClient
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

    if (!data?.length) {

      list.innerHTML =
        '<div class="small center">Vous n\'avez encore aucune commande.</div>';

      return;
    }

    list.innerHTML =
      data
        .map(renderOrderCard)
        .join('');

  } catch (error) {

    console.error(
      'Erreur historique :',
      error
    );

    list.innerHTML =
      '<div class="small center">Impossible de charger vos commandes.</div>';
  }
}


// ------------------------------------------------------------
// CARTE HISTORIQUE
// ------------------------------------------------------------

function renderOrderCard(order) {

  const type =
    order.type === 'buy'
      ? 'Achat USDT'
      : 'Vente USDT';

  const status =
    order.status ||
    'pending';

  const label =
    getStatusLabel(status);

  const networkName =
    CONFIG.networks[order.network]?.name ||
    order.network ||
    '-';


  // ----------------------------------------------------------
  // CARTE ACHAT
  // ----------------------------------------------------------

  if (order.type === 'buy') {

    return `
      <div class="order-card">

        <div class="order-header">
          <div class="order-type">
            ${escapeHtml(type)}
          </div>

          <span class="status ${escapeHtml(status)}">
            ${escapeHtml(label)}
          </span>
        </div>

        <div class="order-row">
          <span>Montant payé</span>
          <strong>
            ${formatNumber(order.fiat_amount)} FCFA
          </strong>
        </div>

        <div class="order-row">
          <span>USDT reçu</span>
          <strong>
            ${Number(order.crypto_amount || 0).toFixed(6)} USDT
          </strong>
        </div>

        <div class="order-row">
          <span>Réseau</span>
          <strong>
            ${escapeHtml(networkName)}
          </strong>
        </div>

        <div class="order-row">
          <span>Paiement</span>
          <strong>
            Orange Money
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


  // ----------------------------------------------------------
  // CARTE VENTE
  // ----------------------------------------------------------

  return `
    <div class="order-card">

      <div class="order-header">
        <div class="order-type">
          ${escapeHtml(type)}
        </div>

        <span class="status ${escapeHtml(status)}">
          ${escapeHtml(label)}
        </span>
      </div>

      <div class="order-row">
        <span>USDT vendu</span>
        <strong>
          ${Number(order.crypto_amount || 0).toFixed(6)} USDT
        </strong>
      </div>

      <div class="order-row">
        <span>Montant reçu</span>
        <strong>
          ${formatNumber(order.fiat_amount || 0)} FCFA
        </strong>
      </div>

      <div class="order-row">
        <span>Réseau</span>
        <strong>
          ${escapeHtml(networkName)}
        </strong>
      </div>

      <div class="order-row">
        <span>Frais réseau</span>
        <strong>
          ${Number(order.fee || 0)} USDT
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


// ------------------------------------------------------------
// STATUTS
// ------------------------------------------------------------

function getStatusLabel(status) {

  return ({
    pending:
      'En attente',

    processing:
      'En traitement',

    completed:
      'Terminée',

    cancelled:
      'Annulée',

    paid:
      'Paiement déclaré',

    payment_declared:
      'Paiement déclaré'

  })[status] ||
    status ||
    'En attente';
}// ------------------------------------------------------------
// LITIGES / SUPPORT
// ------------------------------------------------------------

async function loadOrdersForDispute() {
  const select = $('disputeOrder');

  if (!select || !currentUser) return;

  try {
    const {
      data,
      error
    } = await supabaseClient
      .from('orders')
      .select('id,type,created_at,status')
      .eq('user_id', currentUser.id)
      .order('created_at', {
        ascending: false
      });

    if (error) throw error;

    select.innerHTML =
      '<option value="">Sélectionner une commande</option>';

    (data || []).forEach(order => {

      const type =
        order.type === 'buy'
          ? 'Achat'
          : 'Vente';

      const option =
        document.createElement('option');

      option.value =
        order.id;

      option.textContent =
        `${type} - ${formatDate(order.created_at)} - ${getStatusLabel(order.status)}`;

      select.appendChild(option);
    });

  } catch (error) {

    console.error(
      'Erreur chargement commandes support :',
      error
    );
  }
}


async function submitDispute(event) {
  event.preventDefault();

  hideMessage();

  if (!currentUser) {
    return showMessage(
      'Vous devez être connecté.',
      'error'
    );
  }

  const orderId =
    $('disputeOrder')?.value || '';

  const subject =
    $('disputeSubject')?.value.trim() || '';

  const message =
    $('disputeMessage')?.value.trim() || '';

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
    $('disputeForm')?.querySelector(
      'button[type="submit"]'
    );

  const original =
    button?.textContent;

  if (button) {
    button.disabled = true;
    button.textContent =
      'Envoi...';
  }


  try {

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
      error
    } = await supabaseClient
      .from('disputes')
      .insert(payload);

    if (error) {
      throw error;
    }

    if ($('disputeForm')) {
      $('disputeForm').reset();
    }

    showMessage(
      'Votre demande a été envoyée. Notre équipe va vous répondre.',
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
      button.disabled = false;

      button.textContent =
        original ||
        'Envoyer la demande';
    }
  }
}


async function loadDisputes() {

  const list =
    $('disputesList');

  if (!list || !currentUser) return;

  list.innerHTML =
    '<div class="small center">Chargement...</div>';

  try {

    const {
      data,
      error
    } = await supabaseClient
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

    if (!data?.length) {

      list.innerHTML =
        '<div class="small center">Aucune demande pour le moment.</div>';

      return;
    }

    list.innerHTML =
      data
        .map(renderDisputeCard)
        .join('');

  } catch (error) {

    console.error(
      'Erreur chargement litiges :',
      error
    );

    list.innerHTML =
      '<div class="small center">Impossible de charger les demandes.</div>';
  }
}


function renderDisputeCard(dispute) {

  const status =
    dispute.status ||
    'open';

  const statusLabel =
    status === 'open'
      ? 'Ouvert'
      : status === 'closed'
        ? 'Fermé'
        : status;

  return `
    <div class="order-card">

      <div class="order-header">

        <strong>
          ${escapeHtml(dispute.subject || 'Demande')}
        </strong>

        <span class="status ${escapeHtml(status)}">
          ${escapeHtml(statusLabel)}
        </span>

      </div>

      <p>
        ${escapeHtml(dispute.message || '')}
      </p>

      <div class="small">
        ${formatDate(dispute.created_at)}
      </div>

    </div>
  `;
}


// ------------------------------------------------------------
// PROFIL UTILISATEUR
// ------------------------------------------------------------

async function saveProfile(event) {

  event?.preventDefault();

  hideMessage();

  if (!currentUser) {
    return showMessage(
      'Vous devez être connecté.',
      'error'
    );
  }

  const name =
    $('profileName')?.value.trim() || '';

  const phone =
    normalizePhone(
      $('profilePhone')?.value
    );

  const country =
    $('profileCountry')?.value.trim() ||
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

  try {

    const {
      data,
      error
    } = await supabaseClient
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

    if (data) {
      currentProfile =
        data;
    } else {
      currentProfile = {
        id:
          currentUser.id,

        full_name:
          name,

        phone:
          phone,

        country:
          country
      };
    }

    await supabaseClient.auth.updateUser({
      data: {
        full_name:
          name,

        phone:
          phone,

        country:
          country
      }
    });

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
  }
}


// ------------------------------------------------------------
// MOT DE PASSE
// ------------------------------------------------------------

async function changePassword(event) {

  event?.preventDefault();

  hideMessage();

  const password =
    $('newPassword')?.value || '';

  const confirm =
    $('confirmPassword')?.value || '';

  if (password.length < 6) {
    return showMessage(
      'Le nouveau mot de passe doit contenir au moins 6 caractères.',
      'error'
    );
  }

  if (password !== confirm) {
    return showMessage(
      'Les mots de passe ne correspondent pas.',
      'error'
    );
  }

  try {

    const {
      error
    } = await supabaseClient.auth.updateUser({
      password
    });

    if (error) {
      throw error;
    }

    if ($('passwordForm')) {
      $('passwordForm').reset();
    }

    showMessage(
      'Mot de passe modifié avec succès.',
      'success'
    );

  } catch (error) {

    console.error(
      'Erreur changement mot de passe :',
      error
    );

    showMessage(
      'Impossible de modifier le mot de passe : ' +
      getSupabaseErrorMessage(error),
      'error'
    );
  }
}


// ------------------------------------------------------------
// ÉVÉNEMENTS
// ------------------------------------------------------------

function setupEvents() {

  // AUTH
  $('loginForm')?.addEventListener(
    'submit',
    loginUser
  );

  $('registerForm')?.addEventListener(
    'submit',
    registerUser
  );

  $('logoutBtn')?.addEventListener(
    'click',
    logoutUser
  );


  // TABS AUTH
  $('loginTab')?.addEventListener(
    'click',
    showLoginForm
  );

  $('registerTab')?.addEventListener(
    'click',
    showRegisterForm
  );


  // ACHAT / VENTE
  $('buyTab')?.addEventListener(
    'click',
    setBuyMode
  );

  $('sellTab')?.addEventListener(
    'click',
    setSellMode
  );


  // RÉSEAUX
  $('trc20Option')?.addEventListener(
    'click',
    () => selectNetwork('trc20')
  );

  $('bp20Option')?.addEventListener(
    'click',
    () => selectNetwork('bp20')
  );


  // CALCUL AUTOMATIQUE
  $('amountInput')?.addEventListener(
    'input',
    updateCalculator
  );

  $('walletAddress')?.addEventListener(
    'input',
    () => {}
  );


  // COMMANDE
  $('reviewOrderBtn')?.addEventListener(
    'click',
    reviewOrder
  );

  $('placeOrderBtn')?.addEventListener(
    'click',
    placeOrder
  );

  $('cancelReviewBtn')?.addEventListener(
    'click',
    cancelReview
  );


  // PAIEMENT ACHAT
  $('paymentDoneBtn')?.addEventListener(
    'click',
    declarePayment
  );

  $('viewOrderBtn')?.addEventListener(
    'click',
    viewCurrentOrder
  );


  // PROFIL
  $('profileForm')?.addEventListener(
    'submit',
    saveProfile
  );

  $('passwordForm')?.addEventListener(
    'submit',
    changePassword
  );


  // SUPPORT
  $('disputeForm')?.addEventListener(
    'submit',
    submitDispute
  );


  // NAVIGATION
  document
    .querySelectorAll('.nav-btn')
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const page =
            button.dataset.page;

          if (page) {
            showSubPage(page);
          }
        }
      );
    });


  // BOUTON COMMENCER
  $('startBtn')?.addEventListener(
    'click',
    () => {
      showSubPage('exchangePage');
    }
  );


  // BOUTONS QUI OUVRENT L'ÉCHANGE
  document
    .querySelectorAll('[data-open-exchange]')
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {
          showSubPage('exchangePage');
        }
      );
    });


  // BOUTON RETOUR ACCUEIL
  document
    .querySelectorAll('[data-home]')
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {
          showSubPage('homePage');
        }
      );
    });
}


// ------------------------------------------------------------
// ÉTAT AUTH SUPABASE
// ------------------------------------------------------------

function setupAuthListener() {

  if (authListenerReady) return;

  authListenerReady = true;

  supabaseClient.auth.onAuthStateChange(
    async (_event, session) => {

      currentUser =
        session?.user || null;

      if (currentUser) {

        // Important :
        // ne pas lancer trop de requêtes Supabase
        // directement dans le callback.
        setTimeout(
          () => {
            initializeApplication();
          },
          0
        );

      } else {

        currentProfile =
          null;

        currentOrder =
          null;

        showAuthPage();
      }
    }
  );
}


// ------------------------------------------------------------
// INITIALISATION
// ------------------------------------------------------------

async function boot() {

  try {

    setupEvents();

    setupAuthListener();

    const {
      data,
      error
    } = await supabaseClient.auth.getSession();

    if (error) {
      console.warn(
        'Session Supabase :',
        error
      );
    }

    currentUser =
      data?.session?.user || null;

    if (currentUser) {

      await initializeApplication();

    } else {

      showAuthPage();

      showLoginForm();
    }

    setBuyMode();

    selectNetwork('trc20');

    updateRatesUI();

  } catch (error) {

    console.error(
      'Erreur démarrage application :',
      error
    );

    showAuthPage();

    showMessage(
      'Impossible de démarrer l\'application. Rechargez la page.',
      'error'
    );
  }
}


// ------------------------------------------------------------
// LANCEMENT
// ------------------------------------------------------------

if (
  document.readyState === 'loading'
) {

  document.addEventListener(
    'DOMContentLoaded',
    boot
  );

} else {

  boot();
}

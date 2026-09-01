// ============================================================
// NOA DIGIT TRADE - APP.JS FINAL
// Supabase Auth + Profiles + Orders + Paiement + Litiges
// Correction : receive_cfa ne peut plus être NULL.
// ============================================================

const SUPABASE_URL = 'https://vowafwsvrjpkhkocptih.supabase.co';
const SUPABASE_KEY = 'sb_publishable_umIa4749av8722xus6aQHw_1nf8b-PC';

if (!window.supabase) {
  console.error('Supabase JS n\'a pas été chargé.');
}

const supabaseClient =
  window.supabase.createClient(
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

const $ = id =>
  document.getElementById(id);


function showMessage(
  message,
  type = 'info'
) {

  const box =
    $('appMessage');

  if (!box) return;

  box.textContent =
    String(message || '');

  box.className =
    type;

  box.id =
    'appMessage';
}


function hideMessage() {

  const box =
    $('appMessage');

  if (!box) return;

  box.textContent =
    '';

  box.className =
    '';
}


function formatNumber(
  value,
  max = 0
) {

  const n =
    Number(value);

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

  const d =
    new Date(value);

  if (
    Number.isNaN(
      d.getTime()
    )
  ) {
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

  return String(
    phone || ''
  )
    .replace(
      /\s+/g,
      ''
    )
    .trim();
}


function escapeHtml(value) {

  return String(
    value ?? ''
  )
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    );
}


function getSupabaseErrorMessage(
  error
) {

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

  $('authPage')?.classList.add(
    'active'
  );

  $('appPage')?.classList.remove(
    'active'
  );

  $('bottomNav')?.classList.add(
    'hidden'
  );
}


function showAppPage() {

  $('authPage')?.classList.remove(
    'active'
  );

  $('appPage')?.classList.add(
    'active'
  );

  $('bottomNav')?.classList.remove(
    'hidden'
  );
}


function showSubPage(
  pageId
) {

  document
    .querySelectorAll(
      '.sub-page'
    )
    .forEach(page => {

      page.classList.add(
        'hidden'
      );

      page.classList.remove(
        'active'
      );
    });


  const target =
    $(pageId);

  if (target) {

    target.classList.remove(
      'hidden'
    );

    target.classList.add(
      'active'
    );
  }


  document
    .querySelectorAll(
      '.nav-btn'
    )
    .forEach(button => {

      button.classList.toggle(
        'active',
        button.dataset.page ===
          pageId
      );
    });


  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });


  if (
    pageId ===
    'ordersPage'
  ) {

    loadOrderHistory();
  }


  if (
    pageId ===
    'supportPage'
  ) {

    loadDisputes();
    loadOrdersForDispute();
  }
}


// ============================================================
// AUTH FORMULAIRES
// ============================================================

function showLoginForm() {

  $('loginTab')?.classList.add(
    'active'
  );

  $('registerTab')?.classList.remove(
    'active'
  );

  $('loginForm')?.classList.add(
    'active'
  );

  $('registerForm')?.classList.remove(
    'active'
  );
}


function showRegisterForm() {

  $('loginTab')?.classList.remove(
    'active'
  );

  $('registerTab')?.classList.add(
    'active'
  );

  $('loginForm')?.classList.remove(
    'active'
  );

  $('registerForm')?.classList.add(
    'active'
  );
}


// ============================================================
// PROFIL
// ============================================================

function getBestUserName() {

  if (!currentUser) {
    return 'Utilisateur';
  }

  const metadata =
    currentUser.user_metadata ||
    {};

  const profileName =
    String(currentProfile?.full_name || '').trim();

  const metadataName =
    String(
      metadata.full_name ||
      metadata.name ||
      metadata.fullName ||
      ''
    ).trim();

  let cachedName = '';

  try {
    cachedName =
      String(
        localStorage.getItem(
          `noa_user_name_${currentUser.id}`
        ) || ''
      ).trim();
  } catch (error) {
    console.warn('Cache nom indisponible :', error);
  }

  const emailName =
    String(
      currentUser.email?.split('@')[0] || ''
    ).trim();

  return (
    profileName ||
    metadataName ||
    cachedName ||
    emailName ||
    'Utilisateur'
  );
}


function cacheUserProfile(profile) {

  if (!currentUser?.id) {
    return;
  }

  const name =
    String(
      profile?.full_name ||
      ''
    ).trim();

  if (!name) {
    return;
  }

  try {
    localStorage.setItem(
      `noa_user_name_${currentUser.id}`,
      name
    );
  } catch (error) {
    console.warn('Impossible de mémoriser le nom :', error);
  }
}


async function loadUserProfile() {

  if (
    !currentUser?.id
  ) {
    return null;
  }


  const metadata =
    currentUser.user_metadata ||
    {};


  const fallback = {

    id:
      currentUser.id,

    full_name:
      getBestUserName(),

    phone:
      metadata.phone ||
      '',

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


    if (
      !error &&
      profile
    ) {

      currentProfile = {
        ...fallback,
        ...profile,
        full_name:
          String(profile.full_name || '').trim() ||
          fallback.full_name,
        phone:
          String(profile.phone || '').trim() ||
          fallback.phone,
        country:
          String(profile.country || '').trim() ||
          fallback.country
      };

      cacheUserProfile(currentProfile);
      updateUserInterface();

      return currentProfile;
    }


    if (
      !error &&
      !profile
    ) {

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


      if (
        !insertError &&
        inserted
      ) {

        currentProfile =
          inserted;

        cacheUserProfile(currentProfile);
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
    currentUser.user_metadata ||
    {};


  const name =
    getBestUserName();


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

  if (
    applicationInitializing
  ) {
    return;
  }


  applicationInitializing =
    true;


  try {

    // L'utilisateur est déjà authentifié : afficher immédiatement
    // l'application pour éviter tout clignotement vers la connexion.
    showAppPage();

    // Affichage immédiat du nom depuis Auth/cache, sans attendre Supabase profiles.
    updateUserInterface();

    // Ces chargements sont secondaires : une erreur RLS ne doit jamais
    // empêcher l'utilisateur d'entrer dans l'application.
    await Promise.allSettled([
      loadUserProfile(),
      loadAppSettings()
    ]);

    updateUserInterface();
    updateRatesUI();
    updateCalculator();

  } catch (error) {

    console.error(
      'Erreur initialisation :',
      error
    );

    // Une erreur non critique ne doit pas renvoyer l'utilisateur vers login.
    showAppPage();
    updateUserInterface();

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

    cacheUserProfile({
      full_name: name
    });

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


// ------------------------------------------------------------
// CONNEXION
// ------------------------------------------------------------

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

    updateUserInterface();

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


// ------------------------------------------------------------
// DÉCONNEXION
// ------------------------------------------------------------

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
// CHARGEMENT DES PARAMÈTRES PUBLICS
// ============================================================

async function loadAppSettings() {
  /*
   * Les tarifs sont gérés par l'administration dans public.app_settings.
   * Le client peut seulement les LIRE grâce à la policy SELECT.
   *
   * Valeurs utilisées :
   * - buy_rate
   * - sell_rate
   * - trc20_fee
   * - bp20_fee
   * - min_order / max_order
   *
   * min_order_cfa / max_order_cfa sont également acceptés
   * comme solution de compatibilité si ces noms existent dans la table.
   */

  try {
    const {
      data,
      error
    } = await supabaseClient
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.error(
        'Erreur lecture app_settings :',
        error
      );
      return false;
    }

    if (!data) {
      console.warn(
        'Aucune configuration app_settings trouvée.'
      );
      return false;
    }

    const buyRate = Number(data.buy_rate);
    const sellRate = Number(data.sell_rate);

    const minOrder = Number(
      data.min_order ??
      data.min_order_cfa
    );

    const maxOrder = Number(
      data.max_order ??
      data.max_order_cfa
    );

    const trc20Fee = Number(data.trc20_fee);
    const bp20Fee = Number(data.bp20_fee);

    if (Number.isFinite(buyRate) && buyRate > 0) {
      CONFIG.buyRate = buyRate;
    }

    if (Number.isFinite(sellRate) && sellRate > 0) {
      CONFIG.sellRate = sellRate;
    }

    if (Number.isFinite(minOrder) && minOrder >= 0) {
      CONFIG.minOrder = minOrder;
    }

    if (Number.isFinite(maxOrder) && maxOrder >= 0) {
      CONFIG.maxOrder = maxOrder;
    }

    if (
      Number.isFinite(trc20Fee) &&
      trc20Fee >= 0
    ) {
      CONFIG.networks.trc20.fee = trc20Fee;
    }

    if (
      Number.isFinite(bp20Fee) &&
      bp20Fee >= 0
    ) {
      CONFIG.networks.bp20.fee = bp20Fee;
    }

    console.log(
      'Paramètres client chargés depuis app_settings :',
      {
        buyRate: CONFIG.buyRate,
        sellRate: CONFIG.sellRate,
        minOrder: CONFIG.minOrder,
        maxOrder: CONFIG.maxOrder,
        trc20Fee: CONFIG.networks.trc20.fee,
        bp20Fee: CONFIG.networks.bp20.fee
      }
    );

    return true;

  } catch (error) {
    console.error(
      'Erreur inattendue lecture app_settings :',
      error
    );

    return false;
  }
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
// RÉSEAU
// ============================================================

function selectNetwork(
  network
) {

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

      // La colonne orders.receive_cfa
      // est NOT NULL. Pour un achat,
      // le client reçoit des USDT et
      // non des FCFA : on enregistre 0.
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

      currentExchangeType ===
      'buy'

        ? 'Veuillez saisir un montant en FCFA.'

        : 'Veuillez saisir la quantité d\'USDT à vendre.',

      'error'
    );
  }


  if (
    currentExchangeType ===
    'buy'
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


  if (
    currentExchangeType ===
    'sell'
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

    receiveCfa:
      c.receiveCfa,

    rate:
      c.rate,

    walletAddress:
      wallet,

    paymentMethod:
      currentExchangeType ===
      'buy'
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


  if (
    currentOrder.side ===
    'buy'
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


    // La table orders ne possède pas de colonne
    // wallet_address. L'adresse est conservée
    // dans customer_note.
    const customerNote =
      currentOrder.walletAddress
        ? `Adresse portefeuille : ${currentOrder.walletAddress}`
        : null;


    // receive_cfa est NOT NULL dans orders.
    // Achat = 0 FCFA reçu.
    // Vente = montant FCFA réellement reçu.
    const receiveCfa =
      currentOrder.side === 'sell'
        ? Number(currentOrder.receiveCfa || 0)
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
          currentOrder.amountCfa
        ),

      usdt_amount:
        Number(
          currentOrder.usdtAmount
        ),

      fee_usdt:
        Number(
          currentOrder.feeUsdt
        ),

      net_usdt:
        Number(
          currentOrder.netUsdt
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


    currentOrder.id =
      data.id;

    currentOrder.createdAt =
      data.created_at;

    currentOrder.status =
      data.status ||
      'pending';


    if (
      currentOrder.side ===
      'buy'
    ) {

      renderPaymentPage();

      showSubPage(
        'paymentPage'
      );

      showMessage(
        'Commande enregistrée. Effectuez maintenant le paiement Orange Money.',
        'success'
      );

    } else {

      showSubPage(
        'ordersPage'
      );

      showMessage(
        'Votre demande de vente a été enregistrée. Nous allons la traiter.',
        'success'
      );
    }


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


  if (
    !currentOrder?.id
  ) {

    return showMessage(
      'Commande introuvable.',
      'error'
    );
  }


  if (
    currentOrder.side !==
    'buy'
  ) {

    return showMessage(
      'Cette opération ne nécessite pas de paiement Orange Money.',
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
      data.status;


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
// HISTORIQUE
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

function renderOrderCard(
  order
) {

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
            ${Number(order.usdt_amount || 0).toFixed(6)} USDT
          </strong>
        </div>


        <div class="order-row">
          <span>Frais</span>
          <strong>
            ${Number(order.fee_usdt || 0)} USDT
          </strong>
        </div>


        <div class="order-row">
          <span>USDT net reçu</span>
          <strong>
            ${Number(order.net_usdt || 0).toFixed(6)} USDT
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
          ${Number(order.usdt_amount || 0).toFixed(6)} USDT
        </strong>
      </div>


      <div class="order-row">
        <span>Frais réseau</span>
        <strong>
          ${Number(order.fee_usdt || 0).toFixed(6)} USDT
        </strong>
      </div>


      <div class="order-row">
        <span>USDT net</span>
        <strong>
          ${Number(order.net_usdt || 0).toFixed(6)} USDT
        </strong>
      </div>


      <div class="order-row">
        <span>Montant reçu</span>
        <strong>
          ${formatNumber(order.receive_cfa || 0)} FCFA
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

function getStatusLabel(
  status
) {

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
  }
}


// ============================================================
// ENVOYER UN LITIGE
// ============================================================

async function submitDispute(
  event
) {

  event.preventDefault();

  hideMessage();


  if (!currentUser) {

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
    } =
      await supabaseClient
        .from('disputes')
        .insert(
          payload
        );


    if (error) {
      throw error;
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


  if (
    !list ||
    !currentUser
  ) {
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
      </div>`;
  }
}


// ============================================================
// CARTE LITIGE
// ============================================================

function renderDisputeCard(
  dispute
) {

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

async function saveProfile(
  event
) {

  event?.preventDefault();

  hideMessage();


  if (!currentUser) {

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


  try {

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

    cacheUserProfile(currentProfile);

    const {
      data: updatedAuthData
    } = await supabaseClient.auth
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

    if (updatedAuthData?.user) {
      currentUser =
        updatedAuthData.user;
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
  }
}


// ============================================================
// MODIFIER LE MOT DE PASSE
// ============================================================

async function changePassword(
  event
) {

  event?.preventDefault();

  hideMessage();


  const password =
    $('newPassword')
      ?.value || '';


  const confirmation =
    $('confirmPassword')
      ?.value || '';


  if (
    password.length < 6
  ) {

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


  try {

    const {
      error
    } =
      await supabaseClient.auth
        .updateUser({
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
  }
}


// ============================================================
// ÉVÉNEMENTS
// ============================================================

function setupEvents() {

  $('loginForm')
    ?.addEventListener(
      'submit',
      loginUser
    );


  $('registerForm')
    ?.addEventListener(
      'submit',
      registerUser
    );


  $('logoutBtn')
    ?.addEventListener(
      'click',
      logoutUser
    );


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


  $('amountInput')
    ?.addEventListener(
      'input',
      updateCalculator
    );


  $('reviewOrderBtn')
    ?.addEventListener(
      'click',
      reviewOrder
    );


  $('placeOrderBtn')
    ?.addEventListener(
      'click',
      placeOrder
    );


  $('cancelReviewBtn')
    ?.addEventListener(
      'click',
      cancelReview
    );


  $('paymentDoneBtn')
    ?.addEventListener(
      'click',
      declarePayment
    );


  $('viewOrderBtn')
    ?.addEventListener(
      'click',
      () => {

        showSubPage(
          'ordersPage'
        );

      }
    );


  $('profileForm')
    ?.addEventListener(
      'submit',
      saveProfile
    );


  $('passwordForm')
    ?.addEventListener(
      'submit',
      changePassword
    );


  $('disputeForm')
    ?.addEventListener(
      'submit',
      submitDispute
    );


  document
    .querySelectorAll(
      '.nav-btn'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const page =
            button.dataset.page;


          if (page) {

            showSubPage(
              page
            );
          }
        }
      );
    });


  $('startBtn')
    ?.addEventListener(
      'click',
      () => {

        showSubPage(
          'exchangePage'
        );
      }
    );


  document
    .querySelectorAll(
      '[data-open-exchange]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          showSubPage(
            'exchangePage'
          );
        }
      );
    });


  document
    .querySelectorAll(
      '[data-home]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          showSubPage(
            'homePage'
          );
        }
      );
    });
}


// ============================================================
// LISTENER SUPABASE AUTH
// ============================================================

function setupAuthListener() {

  if (
    authListenerReady
  ) {
    return;
  }


  authListenerReady =
    true;


  supabaseClient.auth
    .onAuthStateChange(
      (event, session) => {

        /*
         * IMPORTANT :
         * signInWithPassword() déclenche SIGNED_IN.
         * loginUser() initialise déjà l'application.
         *
         * On ne relance donc plus initializeApplication()
         * depuis le listener. Cela évite les doubles initialisations
         * et le clignotement de l'écran de connexion sur mobile.
         */

        currentUser =
          session?.user ||
          null;


        if (
          event === 'SIGNED_OUT' ||
          (!session && event !== 'INITIAL_SESSION')
        ) {

          currentProfile =
            null;

          currentOrder =
            null;

          showAuthPage();
          showLoginForm();

          return;
        }

        /*
         * SIGNED_IN / TOKEN_REFRESHED / INITIAL_SESSION :
         * l'état est simplement synchronisé.
         */
      }
    );
}


// ============================================================
// DÉMARRAGE
// ============================================================

async function boot() {

  try {

    setupEvents();

    setupAuthListener();


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


    if (currentUser) {

      await initializeApplication();

    } else {

      showAuthPage();

      showLoginForm();
    }


    setBuyMode();

    selectNetwork(
      'trc20'
    );

    updateRatesUI();

    updateCalculator();


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
    boot
  );

} else {

  boot();
}

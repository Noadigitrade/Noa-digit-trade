// ==========================================
// NOA DIGIT TRADE
// SUPABASE AUTH + ORDERS
// ==========================================

// ==========================================
// CONFIGURATION SUPABASE
// ==========================================

const SUPABASE_URL =
  'https://vowafwsvrjpkhkocptih.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_umIa4749av8722xus6aQHw_1nf8b-PC';


// ==========================================
// TAUX DE CHANGE
// ==========================================

// Le client achète chez NOA DIGIT TRADE
// 1 USDT = 600 FCFA

const BUY_RATE = 600;


// Le client vend à NOA DIGIT TRADE
// 1 USDT = 570 FCFA

const SELL_RATE = 570;


// ==========================================
// INITIALISATION SUPABASE
// ==========================================

if (!window.supabase) {

  console.error(
    'Supabase JS n’a pas été chargé.'
  );

} else {

  console.log(
    'Supabase JS chargé.'
  );

}

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ==========================================
// VARIABLES
// ==========================================

let type = 'buy';


// ==========================================
// PAGE CHARGÉE
// ==========================================

document.addEventListener(
  'DOMContentLoaded',
  async () => {

    console.log(
      'Noa Digit Trade démarré.'
    );

    setupTabs();

    setupStartButton();

    setupAuth();

    setupSubmitButton();

    setupCalculation();

    await checkSession();

  }
);


// ==========================================
// VÉRIFIER LA SESSION
// ==========================================

async function checkSession() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();


    if (error) {

      console.error(
        'Erreur session :',
        error
      );

      updateLoginButton(null);

      return;

    }


    updateLoginButton(
      data.session
    );

  } catch (error) {

    console.error(
      'Erreur vérification session :',
      error
    );

    updateLoginButton(null);

  }

}


// ==========================================
// SURVEILLER LES CHANGEMENTS
// ==========================================

supabaseClient.auth.onAuthStateChange(
  (_event, session) => {

    updateLoginButton(session);

  }
);


// ==========================================
// BOUTON CONNEXION / MON COMPTE
// ==========================================

function updateLoginButton(session) {

  const login =
    document.getElementById('login');


  if (!login) {
    return;
  }


  login.onclick = null;


  if (session) {

    login.textContent =
      'Mon compte';


    login.onclick = () => {

      showAccountModal(
        session.user
      );

    };

  } else {

    login.textContent =
      'Se connecter';


    login.onclick = () => {

      showAuthModal();

    };

  }

}


// ==========================================
// ONGLET ACHETER / VENDRE
// ==========================================

function setupTabs() {

  const tabs =
    document.querySelectorAll('.tab');


  tabs.forEach(button => {

    button.addEventListener(
      'click',
      () => {

        tabs.forEach(item => {

          item.classList.remove(
            'active'
          );

        });


        button.classList.add(
          'active'
        );


        type =
          button.dataset.type;


        console.log(
          'Type sélectionné :',
          type
        );


        updateCalculationMode();

      }
    );

  });

}


// ==========================================
// BOUTON COMMENCER
// ==========================================

function setupStartButton() {

  const start =
    document.getElementById('start');


  if (!start) {
    return;
  }


  start.addEventListener(
    'click',
    () => {

      const order =
        document.getElementById('order');


      if (order) {

        order.scrollIntoView({

          behavior: 'smooth',

          block: 'start'

        });

      }

    }
  );

}


// ==========================================
// CALCUL EN TEMPS RÉEL
// ==========================================

function setupCalculation() {

  const amountInput =
    document.getElementById('amount');


  if (!amountInput) {
    return;
  }


  amountInput.addEventListener(
    'input',
    updateCalculation
  );


  updateCalculationMode();

  updateCalculation();

}


// ==========================================
// ADAPTER LE CHAMP AU TYPE
// ==========================================

function updateCalculationMode() {

  const amountInput =
    document.getElementById('amount');

  const amountLabel =
    document.getElementById('amountLabel');

  const walletLabel =
    document.getElementById('walletLabel');

  const calculation =
    document.getElementById('calculation');

  const rateText =
    document.getElementById('rateText');


  if (!amountInput) {
    return;
  }


  if (type === 'buy') {

    if (amountLabel) {

      amountLabel.textContent =
        'Montant à payer (FCFA)';

    }


    amountInput.placeholder =
      'Ex. 10000';

    amountInput.inputMode =
      'decimal';


    if (walletLabel) {

      walletLabel.textContent =
        'Adresse du portefeuille USDT';

    }


    if (rateText) {

      rateText.textContent =
        `Taux d'achat : 1 USDT = ${BUY_RATE.toLocaleString('fr-FR')} FCFA`;

    }


    if (calculation) {

      calculation.innerHTML = `
        <span>Vous recevrez</span>

        <strong id="resultAmount">
          0 USDT
        </strong>

        <small id="resultDetail">
          1 USDT = ${BUY_RATE.toLocaleString('fr-FR')} FCFA
        </small>
      `;

    }

  } else {

    if (amountLabel) {

      amountLabel.textContent =
        'Montant à vendre (USDT)';

    }


    amountInput.placeholder =
      'Ex. 10';

    amountInput.inputMode =
      'decimal';


    if (walletLabel) {

      walletLabel.textContent =
        'Adresse du portefeuille USDT';

    }


    if (rateText) {

      rateText.textContent =
        `Taux de vente : 1 USDT = ${SELL_RATE.toLocaleString('fr-FR')} FCFA`;

    }


    if (calculation) {

      calculation.innerHTML = `
        <span>Vous recevrez</span>

        <strong id="resultAmount">
          0 FCFA
        </strong>

        <small id="resultDetail">
          1 USDT = ${SELL_RATE.toLocaleString('fr-FR')} FCFA
        </small>
      `;

    }

  }


  updateCalculation();

}


// ==========================================
// EFFECTUER LE CALCUL
// ==========================================

function updateCalculation() {

  const amountInput =
    document.getElementById('amount');


  const resultAmount =
    document.getElementById('resultAmount');


  const resultDetail =
    document.getElementById('resultDetail');


  if (
    !amountInput ||
    !resultAmount
  ) {

    return;

  }


  const value =
    Number(
      amountInput.value
    );


  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {

    resultAmount.textContent =
      type === 'buy'
        ? '0 USDT'
        : '0 FCFA';

    if (resultDetail) {

      resultDetail.textContent =
        type === 'buy'
          ? `1 USDT = ${BUY_RATE.toLocaleString('fr-FR')} FCFA`
          : `1 USDT = ${SELL_RATE.toLocaleString('fr-FR')} FCFA`;

    }

    return;

  }


  if (type === 'buy') {

    const usdt =
      value / BUY_RATE;


    resultAmount.textContent =
      `${formatNumber(usdt, 6)} USDT`;


    if (resultDetail) {

      resultDetail.textContent =
        `${formatNumber(value, 0)} FCFA ÷ ${BUY_RATE} = ${formatNumber(usdt, 6)} USDT`;

    }

  } else {

    const fcfa =
      value * SELL_RATE;


    resultAmount.textContent =
      `${formatNumber(fcfa, 0)} FCFA`;


    if (resultDetail) {

      resultDetail.textContent =
        `${formatNumber(value, 6)} USDT × ${SELL_RATE} = ${formatNumber(fcfa, 0)} FCFA`;

    }

  }

}


// ==========================================
// FORMAT NOMBRE
// ==========================================

function formatNumber(
  value,
  maximumFractionDigits = 2
) {

  return Number(value).toLocaleString(
    'fr-FR',
    {
      minimumFractionDigits: 0,
      maximumFractionDigits:
        maximumFractionDigits
    }
  );

}


// ==========================================
// OUVRIR AUTH
// ==========================================

function showAuthModal() {

  const modal =
    document.getElementById(
      'authModal'
    );


  const loginForm =
    document.getElementById(
      'loginForm'
    );


  const signupForm =
    document.getElementById(
      'signupForm'
    );


  if (!modal) {

    console.error(
      'Fenêtre authModal introuvable.'
    );

    return;

  }


  modal.style.display =
    'flex';


  modal.setAttribute(
    'aria-hidden',
    'false'
  );


  if (loginForm) {

    loginForm.hidden =
      false;

  }


  if (signupForm) {

    signupForm.hidden =
      true;

  }


  const loginMessage =
    document.getElementById(
      'loginMessage'
    );


  const signupMessage =
    document.getElementById(
      'signupMessage'
    );


  if (loginMessage) {

    loginMessage.textContent =
      '';

  }


  if (signupMessage) {

    signupMessage.textContent =
      '';

  }

}


// ==========================================
// FERMER AUTH
// ==========================================

function closeAuthModal() {

  const modal =
    document.getElementById(
      'authModal'
    );


  if (!modal) {
    return;
  }


  modal.style.display =
    'none';


  modal.setAttribute(
    'aria-hidden',
    'true'
  );

}


// ==========================================
// CONFIGURATION AUTH
// ==========================================

function setupAuth() {

  const modal =
    document.getElementById(
      'authModal'
    );


  const closeAuth =
    document.getElementById(
      'closeAuth'
    );


  const showSignup =
    document.getElementById(
      'showSignup'
    );


  const showLogin =
    document.getElementById(
      'showLogin'
    );


  const loginSubmit =
    document.getElementById(
      'loginSubmit'
    );


  const signupSubmit =
    document.getElementById(
      'signupSubmit'
    );


  if (closeAuth) {

    closeAuth.addEventListener(
      'click',
      closeAuthModal
    );

  }


  if (modal) {

    modal.addEventListener(
      'click',
      event => {

        if (
          event.target === modal
        ) {

          closeAuthModal();

        }

      }
    );

  }


  if (showSignup) {

    showSignup.addEventListener(
      'click',
      () => {

        const loginForm =
          document.getElementById(
            'loginForm'
          );


        const signupForm =
          document.getElementById(
            'signupForm'
          );


        if (loginForm) {

          loginForm.hidden =
            true;

        }


        if (signupForm) {

          signupForm.hidden =
            false;

        }

      }
    );

  }


  if (showLogin) {

    showLogin.addEventListener(
      'click',
      () => {

        const loginForm =
          document.getElementById(
            'loginForm'
          );


        const signupForm =
          document.getElementById(
            'signupForm'
          );


        if (signupForm) {

          signupForm.hidden =
            true;

        }


        if (loginForm) {

          loginForm.hidden =
            false;

        }

      }
    );

  }


  if (loginSubmit) {

    loginSubmit.addEventListener(
      'click',
      loginUser
    );

  }


  if (signupSubmit) {

    signupSubmit.addEventListener(
      'click',
      signupUser
    );

  }

}


// ==========================================
// CONNEXION
// ==========================================

async function loginUser() {

  const emailInput =
    document.getElementById(
      'loginEmail'
    );


  const passwordInput =
    document.getElementById(
      'loginPassword'
    );


  const message =
    document.getElementById(
      'loginMessage'
    );


  const button =
    document.getElementById(
      'loginSubmit'
    );


  if (
    !emailInput ||
    !passwordInput ||
    !message ||
    !button
  ) {

    return;

  }


  const email =
    emailInput.value.trim();


  const password =
    passwordInput.value;


  message.textContent =
    '';


  if (!email || !password) {

    message.textContent =
      'Veuillez remplir tous les champs.';

    return;

  }


  button.disabled =
    true;


  button.textContent =
    'Connexion...';


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.signInWithPassword({

        email,
        password

      });


    if (error) {

      throw error;

    }


    message.textContent =
      'Connexion réussie.';


    console.log(
      'Connexion réussie :',
      data.user
    );


    setTimeout(
      closeAuthModal,
      700
    );


  } catch (error) {

    console.error(
      'Erreur connexion :',
      error
    );


    message.textContent =
      'Erreur : ' +
      error.message;

  } finally {

    button.disabled =
      false;


    button.textContent =
      'Se connecter';

  }

}


// ==========================================
// INSCRIPTION
// ==========================================

async function signupUser() {

  const emailInput =
    document.getElementById(
      'signupEmail'
    );


  const passwordInput =
    document.getElementById(
      'signupPassword'
    );


  const confirmInput =
    document.getElementById(
      'signupPasswordConfirm'
    );


  const message =
    document.getElementById(
      'signupMessage'
    );


  const button =
    document.getElementById(
      'signupSubmit'
    );


  if (
    !emailInput ||
    !passwordInput ||
    !confirmInput ||
    !message ||
    !button
  ) {

    return;

  }


  const email =
    emailInput.value.trim();


  const password =
    passwordInput.value;


  const confirmPassword =
    confirmInput.value;


  message.textContent =
    '';


  if (
    !email ||
    !password ||
    !confirmPassword
  ) {

    message.textContent =
      'Veuillez remplir tous les champs.';

    return;

  }


  if (password.length < 6) {

    message.textContent =
      'Le mot de passe doit contenir au moins 6 caractères.';

    return;

  }


  if (password !== confirmPassword) {

    message.textContent =
      'Les mots de passe ne correspondent pas.';

    return;

  }


  button.disabled =
    true;


  button.textContent =
    'Création...';


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.signUp({

        email,

        password,

        options: {

          emailRedirectTo:
            'https://noadigittrade.github.io'

        }

      });


    if (error) {

      throw error;

    }


    console.log(
      'Compte Auth créé :',
      data
    );


    if (
      data.user &&
      !data.session
    ) {

      message.textContent =
        'Compte créé. Vérifiez votre email pour confirmer votre compte.';

      return;

    }


    if (data.user) {

      try {

        await createUserProfile(
          data.user
        );

      } catch (profileError) {

        console.error(
          'Erreur création profil :',
          profileError
        );

        message.textContent =
          'Compte créé, mais le profil utilisateur n’a pas pu être créé.';

        return;

      }


      message.textContent =
        'Compte créé avec succès.';

    }


    passwordInput.value =
      '';

    confirmInput.value =
      '';


  } catch (error) {

    console.error(
      'Erreur inscription :',
      error
    );


    message.textContent =
      'Erreur : ' +
      error.message;

  } finally {

    button.disabled =
      false;


    button.textContent =
      'Créer mon compte';

  }

}


// ==========================================
// CRÉER PROFIL USERS
// ==========================================

async function createUserProfile(user) {

  if (!user || !user.id) {

    throw new Error(
      'Utilisateur Supabase invalide.'
    );

  }


  const {
    data: existingUsers,
    error: searchError
  } =
    await supabaseClient
      .from('Users')
      .select('id')
      .eq('auth_id', user.id)
      .limit(1);


  if (searchError) {

    throw searchError;

  }


  if (
    existingUsers &&
    existingUsers.length > 0
  ) {

    return existingUsers[0];

  }


  const {
    data: newUser,
    error: insertError
  } =
    await supabaseClient
      .from('Users')
      .insert({

        auth_id:
          user.id,

        email:
          user.email || ''

      })
      .select()
      .single();


  if (insertError) {

    throw insertError;

  }


  return newUser;

}


// ==========================================
// MON COMPTE
// ==========================================

async function showAccountModal(user) {

  const oldModal =
    document.getElementById(
      'accountModal'
    );


  if (oldModal) {

    oldModal.remove();

  }


  const modal =
    document.createElement(
      'div'
    );


  modal.id =
    'accountModal';


  modal.style.cssText = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.55);
    display:flex;
    align-items:center;
    justify-content:center;
    z-index:9999;
    padding:20px;
    overflow-y:auto;
  `;


  modal.innerHTML = `

    <div style="
      width:100%;
      max-width:560px;
      max-height:90vh;
      overflow-y:auto;
      background:white;
      color:#101828;
      border-radius:24px;
      padding:28px;
      box-shadow:0 20px 50px rgba(0,0,0,.25);
    ">

      <h2 style="
        margin-top:0;
        font-size:32px;
      ">
        Mon compte
      </h2>

      <p>
        <strong>Email :</strong><br>
        ${escapeHtml(user.email || '')}
      </p>

      <hr style="
        border:none;
        border-top:1px solid #e5e7eb;
        margin:25px 0;
      ">

      <h3 style="
        font-size:22px;
        margin-bottom:18px;
      ">
        Mes demandes
      </h3>

      <div id="ordersContainer">
        <p style="color:#667085;">
          Chargement de vos demandes...
        </p>
      </div>

      <button
        id="logoutButton"
        type="button"
        class="primary full"
        style="margin-top:25px;">
        Se déconnecter
      </button>

      <button
        id="closeAccountButton"
        type="button"
        style="
          width:100%;
          margin-top:10px;
          padding:13px;
          border:1px solid #d0d5dd;
          border-radius:12px;
          background:white;
          cursor:pointer;
        ">
        Fermer
      </button>

      <p id="accountMessage"></p>

    </div>

  `;


  document.body.appendChild(
    modal
  );


  document
    .getElementById(
      'closeAccountButton'
    )
    .addEventListener(
      'click',
      () => modal.remove()
    );


  modal.addEventListener(
    'click',
    event => {

      if (
        event.target === modal
      ) {

        modal.remove();

      }

    }
  );


  document
    .getElementById(
      'logoutButton'
    )
    .addEventListener(
      'click',
      async () => {

        const button =
          document.getElementById(
            'logoutButton'
          );


        button.disabled =
          true;


        button.textContent =
          'Déconnexion...';


        const {
          error
        } =
          await supabaseClient.auth.signOut();


        if (error) {

          const accountMessage =
            document.getElementById(
              'accountMessage'
            );


          if (accountMessage) {

            accountMessage.textContent =
              'Erreur : ' +
              error.message;

          }


          button.disabled =
            false;


          button.textContent =
            'Se déconnecter';


          return;

        }


        modal.remove();

      }
    );


  // Charger les commandes
  await loadUserOrders(
    user.id
  );

}


// ==========================================
// CHARGER LES DEMANDES DU CLIENT
// ==========================================

async function loadUserOrders(
  authUserId
) {

  const container =
    document.getElementById(
      'ordersContainer'
    );


  if (!container) {
    return;
  }


  try {

    // --------------------------------------
    // Récupérer l'identifiant du profil
    // --------------------------------------

    const {
      data: users,
      error: userError
    } =
      await supabaseClient
        .from('Users')
        .select('id')
        .eq('auth_id', authUserId)
        .limit(1);


    if (userError) {

      throw userError;

    }


    if (
      !users ||
      users.length === 0
    ) {

      container.innerHTML = `
        <div style="
          padding:20px;
          background:#f8fafc;
          border-radius:16px;
          color:#667085;
        ">
          Aucune demande pour le moment.
        </div>
      `;

      return;

    }


    const userId =
      users[0].id;


    // --------------------------------------
    // Récupérer les commandes
    // --------------------------------------

    const {
      data: orders,
      error: ordersError
    } =
      await supabaseClient
        .from('orders')
        .select(`
          id,
          type,
          crypto_amount,
          fiat_amount,
          rate,
          network,
          wallet_address,
          status,
          created_at
        `)
        .eq('user_id', userId)
        .order(
          'created_at',
          {
            ascending: false
          }
        );


    if (ordersError) {

      throw ordersError;

    }


    if (
      !orders ||
      orders.length === 0
    ) {

      container.innerHTML = `
        <div style="
          padding:20px;
          background:#f8fafc;
          border-radius:16px;
          color:#667085;
        ">
          Aucune demande pour le moment.
        </div>
      `;

      return;

    }


    // --------------------------------------
    // Afficher les commandes
    // --------------------------------------

    container.innerHTML =
      orders
        .map(order =>
          createOrderCard(order)
        )
        .join('');


  } catch (error) {

    console.error(
      'Erreur chargement commandes :',
      error
    );


    container.innerHTML = `
      <div style="
        padding:20px;
        background:#fff4f4;
        border:1px solid #fecaca;
        border-radius:16px;
        color:#b42318;
      ">
        Impossible de charger vos demandes.
        <br><br>
        ${escapeHtml(error.message || '')}
      </div>
    `;

  }

}


// ==========================================
// CRÉER UNE CARTE DE COMMANDE
// ==========================================

function createOrderCard(order) {

  const isBuy =
    order.type === 'buy';


  // ----------------------------------------
  // Valeurs enregistrées
  // ----------------------------------------

  const cryptoAmount =
    Number(order.crypto_amount) || 0;


  let fiatAmount =
    Number(order.fiat_amount) || 0;


  let rate =
    Number(order.rate) || 0;


  // ----------------------------------------
  // CORRECTION DE SECOURS
  //
  // Si une ancienne commande possède
  // 0 FCFA ou 0 comme taux, on recalcule
  // avec le taux correspondant.
  // ----------------------------------------

  if (isBuy) {

    if (rate <= 0) {

      rate =
        BUY_RATE;

    }


    if (fiatAmount <= 0) {

      fiatAmount =
        cryptoAmount * BUY_RATE;

    }

  } else {

    if (rate <= 0) {

      rate =
        SELL_RATE;

    }


    if (fiatAmount <= 0) {

      fiatAmount =
        cryptoAmount * SELL_RATE;

    }

  }


  // ----------------------------------------
  // Type
  // ----------------------------------------

  const typeText =
    isBuy
      ? 'Achat USDT'
      : 'Vente USDT';


  const typeIcon =
    isBuy
      ? '🟢'
      : '🔵';


  // ----------------------------------------
  // Statut
  // ----------------------------------------

  const status =
    String(
      order.status || 'pending'
    ).toLowerCase();


  let statusText =
    'En attente';


  let statusBackground =
    '#fff7d6';


  let statusColor =
    '#9a6700';


  if (status === 'completed') {

    statusText =
      'Terminée';

    statusBackground =
      '#dcfce7';

    statusColor =
      '#166534';

  }


  if (status === 'approved') {

    statusText =
      'Validée';

    statusBackground =
      '#dcfce7';

    statusColor =
      '#166534';

  }


  if (status === 'cancelled') {

    statusText =
      'Annulée';

    statusBackground =
      '#fee2e2';

    statusColor =
      '#991b1b';

  }


  if (status === 'rejected') {

    statusText =
      'Refusée';

    statusBackground =
      '#fee2e2';

    statusColor =
      '#991b1b';

  }


  // ----------------------------------------
  // Date
  // ----------------------------------------

  let dateText =
    'Date inconnue';


  if (order.created_at) {

    const date =
      new Date(
        order.created_at
      );


    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {

      dateText =
        date.toLocaleString(
          'fr-FR',
          {
            dateStyle: 'medium',
            timeStyle: 'short'
          }
        );

    }

  }


  // ----------------------------------------
  // Wallet
  // ----------------------------------------

  const wallet =
    order.wallet_address || '';


  // ----------------------------------------
  // HTML
  // ----------------------------------------

  return `

    <div style="
      border:1px solid #e5e7eb;
      border-radius:20px;
      padding:20px;
      margin-bottom:18px;
      background:white;
    ">

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:10px;
        flex-wrap:wrap;
        margin-bottom:18px;
      ">

        <strong style="
          font-size:19px;
        ">
          ${typeIcon} ${typeText}
        </strong>

        <span style="
          display:inline-block;
          padding:8px 13px;
          border-radius:20px;
          background:${statusBackground};
          color:${statusColor};
          font-size:14px;
          font-weight:bold;
        ">
          ${statusText}
        </span>

      </div>


      <div style="
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:12px;
        margin-bottom:18px;
      ">

        <div style="
          padding:15px;
          border-radius:14px;
          background:#f8fafc;
        ">

          <div style="
            color:#667085;
            font-size:13px;
            margin-bottom:5px;
          ">
            Montant USDT
          </div>

          <strong style="
            font-size:19px;
          ">
            ${formatNumber(cryptoAmount, 6)} USDT
          </strong>

        </div>


        <div style="
          padding:15px;
          border-radius:14px;
          background:#f8fafc;
        ">

          <div style="
            color:#667085;
            font-size:13px;
            margin-bottom:5px;
          ">
            Montant FCFA
          </div>

          <strong style="
            font-size:19px;
          ">
            ${formatNumber(fiatAmount, 0)} FCFA
          </strong>

        </div>

      </div>


      <div style="
        line-height:1.8;
        color:#475467;
        font-size:15px;
      ">

        <div>
          <strong>Taux :</strong>
          1 USDT = ${formatNumber(rate, 0)} FCFA
        </div>

        <div>
          <strong>Réseau :</strong>
          ${escapeHtml(order.network || '')}
        </div>

        <div>
          <strong>Portefeuille :</strong>
          <span style="
            word-break:break-all;
          ">
            ${escapeHtml(wallet)}
          </span>
        </div>

        <div>
          <strong>Date :</strong>
          ${escapeHtml(dateText)}
        </div>

      </div>

    </div>

  `;

}


// ==========================================
// PROTECTION HTML
// ==========================================

function escapeHtml(value) {

  return String(value)

    .replaceAll(
      '&',
      '&amp;'
    )

    .replaceAll(
      '<',
      '&lt;'
    )

    .replaceAll(
      '>',
      '&gt;'
    )

    .replaceAll(
      '"',
      '&quot;'
    )

    .replaceAll(
      "'",
      '&#039;'
    );

}


// ==========================================
// BOUTON ENVOI
// ==========================================

function setupSubmitButton() {

  const submit =
    document.getElementById(
      'submit'
    );


  if (!submit) {

    return;

  }


  submit.addEventListener(
    'click',
    sendOrder
  );

}


// ==========================================
// ENVOYER LA COMMANDE
// ==========================================

async function sendOrder() {

  const amountInput =
    document.getElementById(
      'amount'
    );


  const walletInput =
    document.getElementById(
      'wallet'
    );


  const networkInput =
    document.getElementById(
      'network'
    );


  const message =
    document.getElementById(
      'msg'
    );


  const submit =
    document.getElementById(
      'submit'
    );


  if (
    !amountInput ||
    !walletInput ||
    !networkInput ||
    !message ||
    !submit
  ) {

    return;

  }


  const amount =
    amountInput.value.trim();


  const wallet =
    walletInput.value.trim();


  const network =
    networkInput.value;


  message.textContent =
    '';


  if (!amount || !wallet) {

    message.textContent =
      'Veuillez remplir tous les champs.';

    return;

  }


  const numericAmount =
    Number(amount);


  if (
    !Number.isFinite(numericAmount) ||
    numericAmount <= 0
  ) {

    message.textContent =
      'Le montant doit être supérieur à 0.';

    return;

  }


  // ========================================
  // CALCULER LES MONTANTS
  // ========================================

  let cryptoAmount;

  let fiatAmount;

  let rate;


  if (type === 'buy') {

    // Client paie en FCFA
    // et reçoit des USDT.

    fiatAmount =
      numericAmount;

    rate =
      BUY_RATE;

    cryptoAmount =
      numericAmount / BUY_RATE;

  } else {

    // Client vend des USDT
    // et reçoit des FCFA.

    cryptoAmount =
      numericAmount;

    rate =
      SELL_RATE;

    fiatAmount =
      numericAmount * SELL_RATE;

  }


  // ========================================
  // UTILISATEUR CONNECTÉ
  // ========================================

  let user;


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getUser();


    if (
      error ||
      !data.user
    ) {

      message.textContent =
        'Veuillez vous connecter avant d’envoyer une demande.';

      showAuthModal();

      return;

    }


    user =
      data.user;

  } catch (error) {

    console.error(
      'Erreur récupération utilisateur :',
      error
    );


    message.textContent =
      'Impossible de vérifier votre connexion.';

    return;

  }


  submit.disabled =
    true;


  submit.textContent =
    'Envoi en cours...';


  try {

    // ======================================
    // RÉCUPÉRER LE PROFIL
    // ======================================

    let userId;


    const {
      data: users,
      error: userError
    } =
      await supabaseClient
        .from('Users')
        .select('id')
        .eq('auth_id', user.id)
        .limit(1);


    if (userError) {

      throw new Error(
        userError.message
      );

    }


    if (
      users &&
      users.length > 0
    ) {

      userId =
        users[0].id;

    } else {

      const newProfile =
        await createUserProfile(
          user
        );


      userId =
        newProfile.id;

    }


    // ======================================
    // CRÉER LA COMMANDE
    // ======================================

    const {
      data: order,
      error: orderError
    } =
      await supabaseClient
        .from('orders')
        .insert({

          user_id:
            userId,

          type:
            type,

          crypto_amount:
            cryptoAmount,

          fiat_amount:
            fiatAmount,

          rate:
            rate,

          network:
            network,

          wallet_address:
            wallet,

          status:
            'pending'

        })
        .select()
        .single();


    if (orderError) {

      throw new Error(
        orderError.message
      );

    }


    console.log(
      'Commande créée :',
      order
    );


    // ======================================
    // MESSAGE DE SUCCÈS
    // ======================================

    if (type === 'buy') {

      message.textContent =
        `Demande d’achat envoyée avec succès : ${formatNumber(cryptoAmount, 6)} USDT pour ${formatNumber(fiatAmount, 0)} FCFA.`;

    } else {

      message.textContent =
        `Demande de vente envoyée avec succès : ${formatNumber(cryptoAmount, 6)} USDT pour ${formatNumber(fiatAmount, 0)} FCFA.`;

    }


    amountInput.value =
      '';


    walletInput.value =
      '';


    updateCalculation();

  } catch (error) {

    console.error(
      'Erreur commande :',
      error
    );


    message.textContent =
      'Erreur : ' +
      error.message;

  } finally {

    submit.disabled =
      false;


    submit.textContent =
      'Envoyer la demande';

  }

}

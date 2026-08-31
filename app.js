// ===============================
// NOA DIGIT TRADE - SUPABASE
// ===============================

// Configuration Supabase
const SUPABASE_URL =
  'https://vowafwsvrjpkhkocptih.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_umIa4749av8722xus6aQHw_1nf8b-PC';


// ===============================
// CLIENT SUPABASE
// ===============================

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// Type de commande
let type = 'buy';


// ===============================
// STYLE DE LA FENÊTRE AUTH
// ===============================

const authStyle = document.createElement('style');

authStyle.textContent = `

.auth-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 20px;

  z-index: 9999;
}

.auth-modal {
  width: 100%;
  max-width: 430px;

  background: #ffffff;

  border-radius: 22px;

  padding: 28px;

  box-shadow: 0 25px 70px rgba(0,0,0,0.2);

  position: relative;
}

.auth-close {
  position: absolute;

  top: 14px;
  right: 16px;

  width: 36px;
  height: 36px;

  border-radius: 50%;

  border: 1px solid #e5e7eb;

  background: #fff;

  font-size: 22px;

  cursor: pointer;
}

.auth-modal h2 {
  margin: 0 0 8px;

  font-size: 28px;
}

.auth-subtitle {
  margin: 0 0 25px;

  color: #667085;

  line-height: 1.5;
}

.auth-modal label {
  display: block;

  margin: 15px 0 7px;

  font-size: 14px;

  font-weight: 700;
}

.auth-input {
  width: 100%;

  padding: 14px;

  border: 1px solid #d0d5dd;

  border-radius: 10px;

  font-size: 16px;

  outline: none;
}

.auth-input:focus {
  border-color: #111827;

  box-shadow: 0 0 0 3px rgba(17,24,39,0.08);
}

.password-wrapper {
  position: relative;
}

.password-wrapper .auth-input {
  padding-right: 55px;
}

.password-toggle {
  position: absolute;

  right: 8px;
  top: 50%;

  transform: translateY(-50%);

  border: 0;

  background: transparent;

  cursor: pointer;

  font-size: 18px;
}

.auth-submit {
  width: 100%;

  margin-top: 22px;

  padding: 14px;

  border: 0;

  border-radius: 12px;

  background: #111827;

  color: white;

  font-size: 15px;

  font-weight: 700;

  cursor: pointer;
}

.auth-submit:hover {
  background: #1f2937;
}

.auth-submit:disabled {
  opacity: 0.6;

  cursor: not-allowed;
}

.auth-switch {
  margin-top: 20px;

  text-align: center;

  color: #667085;

  font-size: 14px;
}

.auth-switch button {
  border: 0;

  background: transparent;

  color: #111827;

  font-weight: 700;

  cursor: pointer;
}

.auth-message {
  margin-top: 16px;

  padding: 11px;

  border-radius: 10px;

  font-size: 14px;

  line-height: 1.4;

  display: none;
}

.auth-message.error {
  display: block;

  background: #fef2f2;

  color: #b42318;
}

.auth-message.success {
  display: block;

  background: #ecfdf3;

  color: #027a48;
}

@media (max-width: 500px) {

  .auth-modal {
    padding: 24px 18px;

    border-radius: 18px;
  }

  .auth-modal h2 {
    font-size: 24px;
  }

}

`;

document.head.appendChild(authStyle);


// ===============================
// PAGE CHARGÉE
// ===============================

document.addEventListener('DOMContentLoaded', async () => {


  // ===============================
  // ONGLET ACHETER / VENDRE
  // ===============================

  document.querySelectorAll('.tab').forEach(button => {

    button.addEventListener('click', () => {

      document
        .querySelectorAll('.tab')
        .forEach(item => {
          item.classList.remove('active');
        });

      button.classList.add('active');

      type = button.dataset.type;

    });

  });


  // ===============================
  // BOUTON COMMENCER
  // ===============================

  const start =
    document.getElementById('start');

  if (start) {

    start.addEventListener('click', () => {

      const order =
        document.getElementById('order');

      if (order) {

        order.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

      }

    });

  }


  // ===============================
  // BOUTON CONNEXION
  // ===============================

  const login =
    document.getElementById('login');

  if (login) {

    login.addEventListener('click', async () => {

      const {
        data: {
          session
        }
      } = await supabaseClient.auth.getSession();


      if (session) {

        showAccountWindow();

      } else {

        showAuthWindow('login');

      }

    });

  }


  // ===============================
  // VÉRIFIER SESSION AU CHARGEMENT
  // ===============================

  updateLoginButton();


  // ===============================
  // ÉCOUTER LES CHANGEMENTS AUTH
  // ===============================

  supabaseClient.auth.onAuthStateChange(
    async (event, session) => {

      console.log(
        'Auth event:',
        event
      );

      updateLoginButton();

    }
  );


  // ===============================
  // ENVOI COMMANDE
  // ===============================

  const submit =
    document.getElementById('submit');

  if (submit) {

    submit.addEventListener(
      'click',
      async () => {

        const amountElement =
          document.getElementById('amount');

        const walletElement =
          document.getElementById('wallet');

        const networkElement =
          document.getElementById('network');

        const message =
          document.getElementById('msg');


        if (
          !amountElement ||
          !walletElement ||
          !networkElement ||
          !message
        ) {
          return;
        }


        const amount =
          amountElement.value.trim();

        const wallet =
          walletElement.value.trim();

        const network =
          networkElement.value;


        // -------------------------------
        // VALIDATION
        // -------------------------------

        if (!amount || !wallet) {

          message.textContent =
            'Veuillez remplir le montant et l’adresse du portefeuille.';

          return;

        }


        if (Number(amount) <= 0) {

          message.textContent =
            'Le montant doit être supérieur à 0.';

          return;

        }


        // -------------------------------
        // DÉSACTIVER BOUTON
        // -------------------------------

        submit.disabled = true;

        submit.textContent =
          'Envoi en cours...';


        try {

          // -------------------------------
          // ENVOI SUPABASE
          // -------------------------------

          const response =
            await fetch(
              `${SUPABASE_URL}/rest/v1/orders`,
              {
                method: 'POST',

                headers: {
                  'apikey': SUPABASE_KEY,

                  'Authorization':
                    `Bearer ${SUPABASE_KEY}`,

                  'Content-Type':
                    'application/json',

                  'Prefer':
                    'return=minimal'
                },

                body: JSON.stringify({

                  type: type,

                  crypto_amount:
                    Number(amount),

                  network: network,

                  wallet_address:
                    wallet,

                  status:
                    'pending'

                })
              }
            );


          // -------------------------------
          // ERREUR
          // -------------------------------

          if (!response.ok) {

            const errorText =
              await response.text();

            console.error(
              'Erreur Supabase:',
              errorText
            );

            throw new Error(
              errorText ||
              'Erreur lors de la création de la commande.'
            );

          }


          // -------------------------------
          // SUCCÈS
          // -------------------------------

          console.log(
            'Commande créée avec succès'
          );


          message.textContent =
            `Demande ${
              type === 'buy'
                ? 'd’achat'
                : 'de vente'
            } envoyée avec succès : ${amount} USDT (${network}).`;


          amountElement.value = '';

          walletElement.value = '';


        } catch (error) {

          console.error(error);

          message.textContent =
            `Erreur : ${error.message}`;


        } finally {

          submit.disabled = false;

          submit.textContent =
            'Envoyer la demande';

        }

      }
    );

  }

});


// ==================================================
// FENÊTRE AUTHENTIFICATION
// ==================================================

function showAuthWindow(mode = 'login') {

  // Supprimer une ancienne fenêtre
  const old =
    document.getElementById('authOverlay');

  if (old) {
    old.remove();
  }


  const isLogin =
    mode === 'login';


  // -------------------------------
  // OVERLAY
  // -------------------------------

  const overlay =
    document.createElement('div');

  overlay.id =
    'authOverlay';

  overlay.className =
    'auth-overlay';


  // -------------------------------
  // MODAL
  // -------------------------------

  const modal =
    document.createElement('div');

  modal.className =
    'auth-modal';


  // -------------------------------
  // FERMER
  // -------------------------------

  const close =
    document.createElement('button');

  close.className =
    'auth-close';

  close.type =
    'button';

  close.innerHTML =
    '&times;';


  close.addEventListener(
    'click',
    () => overlay.remove()
  );


  // -------------------------------
  // TITRE
  // -------------------------------

  const title =
    document.createElement('h2');

  title.textContent =
    isLogin
      ? 'Se connecter'
      : 'Créer un compte';


  const subtitle =
    document.createElement('p');

  subtitle.className =
    'auth-subtitle';

  subtitle.textContent =
    isLogin
      ? 'Connectez-vous à votre espace Noa Digit Trade.'
      : 'Créez votre compte pour accéder à votre espace personnel.';


  // -------------------------------
  // EMAIL
  // -------------------------------

  const emailLabel =
    document.createElement('label');

  emailLabel.textContent =
    'Adresse email';


  const email =
    document.createElement('input');

  email.type =
    'email';

  email.className =
    'auth-input';

  email.placeholder =
    'exemple@email.com';

  email.autocomplete =
    'email';


  // -------------------------------
  // MOT DE PASSE
  // -------------------------------

  const passwordLabel =
    document.createElement('label');

  passwordLabel.textContent =
    'Mot de passe';


  const passwordWrapper =
    document.createElement('div');

  passwordWrapper.className =
    'password-wrapper';


  const password =
    document.createElement('input');

  password.type =
    'password';

  password.className =
    'auth-input';

  password.placeholder =
    'Votre mot de passe';

  password.autocomplete =
    isLogin
      ? 'current-password'
      : 'new-password';


  const passwordToggle =
    document.createElement('button');

  passwordToggle.type =
    'button';

  passwordToggle.className =
    'password-toggle';

  passwordToggle.textContent =
    '👁';


  passwordToggle.addEventListener(
    'click',
    () => {

      if (
        password.type === 'password'
      ) {

        password.type =
          'text';

        passwordToggle.textContent =
          '🙈';

      } else {

        password.type =
          'password';

        passwordToggle.textContent =
          '👁';

      }

    }
  );


  passwordWrapper.appendChild(password);

  passwordWrapper.appendChild(
    passwordToggle
  );


  // -------------------------------
  // BOUTON
  // -------------------------------

  const submit =
    document.createElement('button');

  submit.type =
    'button';

  submit.className =
    'auth-submit';

  submit.textContent =
    isLogin
      ? 'Se connecter'
      : 'Créer mon compte';


  // -------------------------------
  // MESSAGE
  // -------------------------------

  const message =
    document.createElement('div');

  message.className =
    'auth-message';


  // -------------------------------
  // CHANGEMENT DE MODE
  // -------------------------------

  const switchContainer =
    document.createElement('div');

  switchContainer.className =
    'auth-switch';


  const switchText =
    document.createElement('span');

  switchText.textContent =
    isLogin
      ? 'Vous n’avez pas encore de compte ? '
      : 'Vous avez déjà un compte ? ';


  const switchButton =
    document.createElement('button');

  switchButton.type =
    'button';

  switchButton.textContent =
    isLogin
      ? 'Créer un compte'
      : 'Se connecter';


  switchButton.addEventListener(
    'click',
    () => {

      overlay.remove();

      showAuthWindow(
        isLogin
          ? 'signup'
          : 'login'
      );

    }
  );


  switchContainer.appendChild(
    switchText
  );

  switchContainer.appendChild(
    switchButton
  );


  // -------------------------------
  // CONNEXION / INSCRIPTION
  // -------------------------------

  submit.addEventListener(
    'click',
    async () => {

      const emailValue =
        email.value.trim();

      const passwordValue =
        password.value;


      message.className =
        'auth-message';

      message.textContent =
        '';


      // -------------------------------
      // VALIDATION EMAIL
      // -------------------------------

      if (!emailValue) {

        showAuthMessage(
          message,
          'Veuillez saisir votre adresse email.',
          'error'
        );

        return;

      }


      // -------------------------------
      // VALIDATION MOT DE PASSE
      // -------------------------------

      if (!passwordValue) {

        showAuthMessage(
          message,
          'Veuillez saisir votre mot de passe.',
          'error'
        );

        return;

      }


      if (passwordValue.length < 6) {

        showAuthMessage(
          message,
          'Le mot de passe doit contenir au moins 6 caractères.',
          'error'
        );

        return;

      }


      // -------------------------------
      // CHARGEMENT
      // -------------------------------

      submit.disabled =
        true;

      submit.textContent =
        isLogin
          ? 'Connexion...'
          : 'Création...';


      try {

        let result;


        // ===============================
        // CONNEXION
        // ===============================

        if (isLogin) {

          result =
            await supabaseClient.auth.signInWithPassword({
              email: emailValue,
              password: passwordValue
            });


        // ===============================
        // INSCRIPTION
        // ===============================

        } else {

          result =
            await supabaseClient.auth.signUp({
              email: emailValue,
              password: passwordValue
            });

        }


        // -------------------------------
        // ERREUR SUPABASE
        // -------------------------------

        if (result.error) {

          throw result.error;

        }


        // ===============================
        // INSCRIPTION
        // ===============================

        if (!isLogin) {

          if (
            result.data.session
          ) {

            showAuthMessage(
              message,
              'Compte créé avec succès. Vous êtes maintenant connecté.',
              'success'
            );


            setTimeout(
              () => {
                overlay.remove();
                updateLoginButton();
              },
              1200
            );


          } else {

            showAuthMessage(
              message,
              'Compte créé ! Vérifiez votre email pour confirmer votre adresse avant de vous connecter.',
              'success'
            );

          }


        // ===============================
        // CONNEXION
        // ===============================

        } else {

          showAuthMessage(
            message,
            'Connexion réussie !',
            'success'
          );


          setTimeout(
            () => {

              overlay.remove();

              updateLoginButton();

            },
            700
          );

        }


      } catch (error) {

        console.error(
          'Erreur Auth Supabase:',
          error
        );


        let errorMessage =
          error.message ||
          'Une erreur est survenue.';


        // Messages plus simples
        if (
          errorMessage.includes(
            'Invalid login credentials'
          )
        ) {

          errorMessage =
            'Email ou mot de passe incorrect.';

        }


        if (
          errorMessage.includes(
            'User already registered'
          )
        ) {

          errorMessage =
            'Un compte existe déjà avec cet email.';

        }


        if (
          errorMessage.includes(
            'Password should be at least'
          )
        ) {

          errorMessage =
            'Le mot de passe doit contenir au moins 6 caractères.';

        }


        showAuthMessage(
          message,
          errorMessage,
          'error'
        );


      } finally {

        submit.disabled =
          false;

        submit.textContent =
          isLogin
            ? 'Se connecter'
            : 'Créer mon compte';

      }

    }
  );


  // -------------------------------
  // CONSTRUCTION
  // -------------------------------

  modal.appendChild(close);

  modal.appendChild(title);

  modal.appendChild(subtitle);

  modal.appendChild(emailLabel);

  modal.appendChild(email);

  modal.appendChild(passwordLabel);

  modal.appendChild(passwordWrapper);

  modal.appendChild(submit);

  modal.appendChild(message);

  modal.appendChild(switchContainer);

  overlay.appendChild(modal);

  document.body.appendChild(overlay);


  // -------------------------------
  // FERMER EN CLIQUANT À L'EXTÉRIEUR
  // -------------------------------

  overlay.addEventListener(
    'click',
    event => {

      if (
        event.target === overlay
      ) {

        overlay.remove();

      }

    }
  );


  // Focus email
  setTimeout(
    () => email.focus(),
    100
  );

}


// ==================================================
// MESSAGE AUTH
// ==================================================

function showAuthMessage(
  element,
  text,
  type
) {

  element.textContent =
    text;

  element.className =
    `auth-message ${type}`;

}


// ==================================================
// BOUTON COMPTE
// ==================================================

async function updateLoginButton() {

  const login =
    document.getElementById('login');

  if (!login) {
    return;
  }


  const {
    data: {
      session
    }
  } =
    await supabaseClient.auth.getSession();


  if (session) {

    login.textContent =
      'Mon compte';

  } else {

    login.textContent =
      'Se connecter';

  }

}


// ==================================================
// FENÊTRE COMPTE
// ==================================================

async function showAccountWindow() {

  const {
    data: {
      user
    }
  } =
    await supabaseClient.auth.getUser();


  if (!user) {

    showAuthWindow('login');

    return;

  }


  const old =
    document.getElementById('authOverlay');

  if (old) {
    old.remove();
  }


  const overlay =
    document.createElement('div');

  overlay.id =
    'authOverlay';

  overlay.className =
    'auth-overlay';


  const modal =
    document.createElement('div');

  modal.className =
    'auth-modal';


  const close =
    document.createElement('button');

  close.type =
    'button';

  close.className =
    'auth-close';

  close.innerHTML =
    '&times;';


  close.addEventListener(
    'click',
    () => overlay.remove()
  );


  const title =
    document.createElement('h2');

  title.textContent =
    'Mon compte';


  const subtitle =
    document.createElement('p');

  subtitle.className =
    'auth-subtitle';

  subtitle.innerHTML =
    `Connecté avec<br><strong>${escapeHTML(user.email)}</strong>`;


  const logout =
    document.createElement('button');

  logout.type =
    'button';

  logout.className =
    'auth-submit';

  logout.textContent =
    'Se déconnecter';


  logout.addEventListener(
    'click',
    async () => {

      logout.disabled =
        true;

      logout.textContent =
        'Déconnexion...';


      const {
        error
      } =
        await supabaseClient.auth.signOut();


      if (error) {

        console.error(error);

        logout.disabled =
          false;

        logout.textContent =
          'Se déconnecter';

        return;

      }


      overlay.remove();

      updateLoginButton();

    }
  );


  modal.appendChild(close);

  modal.appendChild(title);

  modal.appendChild(subtitle);

  modal.appendChild(logout);

  overlay.appendChild(modal);

  document.body.appendChild(overlay);


  overlay.addEventListener(
    'click',
    event => {

      if (
        event.target === overlay
      ) {

        overlay.remove();

      }

    }
  );

}


// ==================================================
// PROTECTION AFFICHAGE EMAIL
// ==================================================

function escapeHTML(value) {

  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

}

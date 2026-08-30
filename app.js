let type = 'buy';

document.querySelectorAll('.tab').forEach(button => {
  button.onclick = () => {
    document.querySelectorAll('.tab')
      .forEach(item => item.classList.remove('active'));

    button.classList.add('active');

    type = button.dataset.type;
  };
});


document.getElementById('start').onclick = () => {
  document.getElementById('order')
    .scrollIntoView({ behavior: 'smooth' });
};


document.getElementById('login').onclick = () => {
  alert(
    'La connexion Supabase sera activée à l’étape suivante.'
  );
};


document.getElementById('submit').onclick = () => {

  const amount =
    document.getElementById('amount').value;

  const wallet =
    document.getElementById('wallet').value.trim();

  const network =
    document.getElementById('network').value;

  const message =
    document.getElementById('msg');

  if (!amount || !wallet) {
    message.textContent =
      'Veuillez remplir le montant et l’adresse du portefeuille.';
    return;
  }

  message.textContent =
    `Demande ${
      type === 'buy' ? 'd’achat' : 'de vente'
    } préparée : ${amount} USDT (${network}).`;
};

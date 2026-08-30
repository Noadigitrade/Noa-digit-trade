const response = await fetch(
  `${SUPABASE_URL}/rest/v1/orders`,
  {
    method: 'POST',

    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },

    body: JSON.stringify({

      type: type,

      crypto_amount: Number(amount),

      network: network,

      wallet_address: wallet,

      status: 'pending'

    })
  }
);

if (!response.ok) {

  const errorText =
    await response.text();

  console.error(
    'Erreur Supabase :',
    errorText
  );

  throw new Error(
    errorText || 'Erreur lors de la création de la commande.'
  );
}

console.log('Commande créée avec succès');

message.textContent =
  `Demande ${
    type === 'buy'
      ? 'd’achat'
      : 'de vente'
  } envoyée avec succès : ${amount} USDT (${network}).`;

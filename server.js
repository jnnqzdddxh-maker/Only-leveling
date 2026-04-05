const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// ROUTE : Coach IA (Anthropic)
// ============================================================
app.post('/api/chat', async (req, res) => {
  try {
    const { system, messages } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system,
        messages
      })
    });

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error('Erreur Anthropic:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ROUTE : Stripe Checkout
// ============================================================
app.post('/api/create-checkout', async (req, res) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { plan, email } = req.body;

    const prices = {
      starter:     process.env.STRIPE_PRICE_STARTER,
      performance: process.env.STRIPE_PRICE_PERFORMANCE,
      elite:       process.env.STRIPE_PRICE_ELITE,
    };

    if (!prices[plan]) {
      return res.status(400).json({ error: 'Plan invalide' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: prices[plan], quantity: 1 }],
      mode: 'subscription',
      customer_email: email || undefined,
      success_url: process.env.APP_URL + '?payment=success&plan=' + plan,
      cancel_url:  process.env.APP_URL + '?payment=cancel',
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error('Erreur Stripe:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// Toutes les autres routes → index.html (SPA)
// ============================================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Only Leveling tourne sur le port ${PORT}`));

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const PRODUCTS = {
  premium: { price: process.env.STRIPE_PRICE_PREMIUM, mode: 'subscription' as const },
  lifetime: { price: process.env.STRIPE_PRICE_LIFETIME, mode: 'payment' as const },
  business: { price: process.env.STRIPE_PRICE_BUSINESS, mode: 'subscription' as const },
};

export async function createCheckoutSession(input: { productId: keyof typeof PRODUCTS; userId?: string; origin: string }) {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe is not configured on the server.');
  const product = PRODUCTS[input.productId];
  if (!product?.price) throw new Error('Unknown billing product.');

  const session = await stripe.checkout.sessions.create(
    {
      mode: product.mode,
      line_items: [{ price: product.price, quantity: 1 }],
      success_url: `${input.origin}/?billing=success`,
      cancel_url: `${input.origin}/?billing=cancelled`,
      client_reference_id: input.userId,
      metadata: { productId: input.productId, userId: input.userId || '' },
      allow_promotion_codes: true,
    },
    { idempotencyKey: `spot-on-${input.userId || 'guest'}-${input.productId}-${Date.now()}` },
  );

  return { url: session.url };
}

export function constructWebhookEvent(payload: string | Buffer, signature: string) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('Stripe webhook secret is not configured.');
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
